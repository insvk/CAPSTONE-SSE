/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS
 * Native C HTTP REST API & Static Asset Server
 * Supports Windows (Winsock2) and Linux/POSIX Sockets
 * ==============================================================================
 */

#include "../include/http_server.h"
#include "../include/db/db_adapter.h"
#include "../include/cJSON.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <sys/stat.h>

#ifdef _WIN32
  #include <winsock2.h>
  #include <ws2tcpip.h>
  typedef int socklen_t;
  #define close_socket(s) closesocket(s)
#else
  #include <unistd.h>
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <arpa/inet.h>
  #define close_socket(s) close(s)
  #define INVALID_SOCKET -1
  #define SOCKET_ERROR -1
  typedef int SOCKET;
#endif

#define BUFFER_SIZE 65536
static volatile int g_running = 1;

static void handle_signal(int sig) {
    (void)sig;
    g_running = 0;
}

static const char* get_mime_type(const char* path) {
    const char* ext = strrchr(path, '.');
    if (!ext) return "application/octet-stream";
    if (!strcmp(ext, ".html") || !strcmp(ext, ".htm")) return "text/html; charset=utf-8";
    if (!strcmp(ext, ".css")) return "text/css; charset=utf-8";
    if (!strcmp(ext, ".js")) return "application/javascript; charset=utf-8";
    if (!strcmp(ext, ".json")) return "application/json; charset=utf-8";
    if (!strcmp(ext, ".svg")) return "image/svg+xml";
    if (!strcmp(ext, ".png")) return "image/png";
    if (!strcmp(ext, ".jpg") || !strcmp(ext, ".jpeg")) return "image/jpeg";
    if (!strcmp(ext, ".ico")) return "image/x-icon";
    if (!strcmp(ext, ".webp")) return "image/webp";
    return "text/plain; charset=utf-8";
}

static void send_json_response(SOCKET sock, int status_code, cJSON* data, const char* err_msg) {
    cJSON* envelope = cJSON_CreateObject();
    cJSON_AddBoolToObject(envelope, "success", status_code >= 200 && status_code < 300);
    
    if (data) {
        cJSON_AddItemToObject(envelope, "data", data);
    } else {
        cJSON_AddNullToObject(envelope, "data");
    }

    cJSON* meta = cJSON_CreateObject();
    char req_id[32];
    sprintf(req_id, "req-%08d", rand() % 10000000);
    cJSON_AddStringToObject(meta, "request_id", req_id);
    cJSON_AddItemToObject(envelope, "meta", meta);

    if (err_msg) {
        cJSON* err_obj = cJSON_CreateObject();
        cJSON_AddStringToObject(err_obj, "message", err_msg);
        cJSON_AddItemToObject(envelope, "error", err_obj);
    } else {
        cJSON_AddNullToObject(envelope, "error");
    }

    char* body = cJSON_PrintUnformatted(envelope);
    cJSON_Delete(envelope);

    char header[512];
    int len = body ? (int)strlen(body) : 0;
    const char* status_text = (status_code == 200) ? "OK" : 
                             (status_code == 201) ? "Created" :
                             (status_code == 400) ? "Bad Request" :
                             (status_code == 404) ? "Not Found" : "Internal Server Error";

    sprintf(header, 
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: application/json; charset=utf-8\r\n"
        "Content-Length: %d\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With\r\n"
        "Connection: close\r\n\r\n",
        status_code, status_text, len);

    send(sock, header, (int)strlen(header), 0);
    if (body) {
        send(sock, body, len, 0);
        free(body);
    }
}

static void send_static_file(SOCKET sock, const char* filepath) {
    FILE* f = fopen(filepath, "rb");
    if (!f) {
        /* If not found, try frontend/index.html for SPA routing */
        f = fopen("frontend/index.html", "rb");
        if (!f) {
            const char* not_found = "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\n\r\nNot Found";
            send(sock, not_found, (int)strlen(not_found), 0);
            return;
        }
        filepath = "frontend/index.html";
    }

    fseek(f, 0, SEEK_END);
    long fsize = ftell(f);
    fseek(f, 0, SEEK_SET);

    char header[512];
    sprintf(header,
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %ld\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Connection: close\r\n\r\n",
        get_mime_type(filepath), fsize);

    send(sock, header, (int)strlen(header), 0);

    char buf[4096];
    size_t n = 0;
    while ((n = fread(buf, 1, sizeof(buf), f)) > 0) {
        send(sock, buf, (int)n, 0);
    }
    fclose(f);
}

static void handle_client(SOCKET client_sock) {
    char* buffer = (char*)malloc(BUFFER_SIZE);
    if (!buffer) {
        close_socket(client_sock);
        return;
    }

    int bytes_received = recv(client_sock, buffer, BUFFER_SIZE - 1, 0);
    if (bytes_received <= 0) {
        free(buffer);
        close_socket(client_sock);
        return;
    }
    buffer[bytes_received] = '\0';

    /* Parse Method, Path */
    char method[16] = {0};
    char path[256] = {0};
    sscanf(buffer, "%15s %255s", method, path);

    /* Handle CORS Pre-flight */
    if (!strcmp(method, "OPTIONS")) {
        const char* cors_resp = 
            "HTTP/1.1 204 No Content\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS\r\n"
            "Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With\r\n"
            "Connection: close\r\n\r\n";
        send(client_sock, cors_resp, (int)strlen(cors_resp), 0);
        free(buffer);
        close_socket(client_sock);
        return;
    }

    /* Extract Request Body */
    char* body_start = strstr(buffer, "\r\n\r\n");
    int body_offset = 4;
    if (!body_start) {
        body_start = strstr(buffer, "\n\n");
        body_offset = 2;
    }
    cJSON* json_body = NULL;
    if (body_start) {
        body_start += body_offset;
        while (*body_start == ' ' || *body_start == '\r' || *body_start == '\n') body_start++;
        if (*body_start) {
            json_body = cJSON_Parse(body_start);
        }
    }

    /* Remove query strings for router matching */
    char clean_path[256];
    memset(clean_path, 0, sizeof(clean_path));
    strncpy(clean_path, path, sizeof(clean_path) - 1);
    char* qmark = strchr(clean_path, '?');
    if (qmark) *qmark = '\0';

    /* REST API ROUTER */
    if (!strncmp(clean_path, "/api/v1/", 8)) {
        const char* endpoint = clean_path + 8;
        imbs_error_t err;
        memset(&err, 0, sizeof(err));

        /* Health Check */
        if (!strcmp(endpoint, "health")) {
            cJSON* h = cJSON_CreateObject();
            cJSON_AddStringToObject(h, "status", "healthy");
            cJSON_AddStringToObject(h, "engine", "C17 Native Domain Engine");
            cJSON_AddStringToObject(h, "version", "1.0.0-PRO-MAXX");
            send_json_response(client_sock, 200, h, NULL);
        }
        /* Products */
        else if (!strcmp(endpoint, "products")) {
            if (!strcmp(method, "GET")) {
                send_json_response(client_sock, 200, imbs_db_get_products(), NULL);
            } else if (!strcmp(method, "POST")) {
                cJSON* res = NULL;
                imbs_status_t st = imbs_db_create_product(json_body, &res, &err);
                if (st == IMBS_OK) {
                    send_json_response(client_sock, 201, res, NULL);
                } else {
                    send_json_response(client_sock, 400, NULL, err.message);
                }
            }
        }
        /* Inventory Balances */
        else if (!strcmp(endpoint, "inventory/balances")) {
            send_json_response(client_sock, 200, imbs_db_get_inventory_balances(), NULL);
        }
        /* Stock Movements */
        else if (!strcmp(endpoint, "inventory/movements")) {
            send_json_response(client_sock, 200, imbs_db_get_stock_movements(), NULL);
        }
        /* Stock Adjustments */
        else if (!strcmp(endpoint, "inventory/adjustments") && !strcmp(method, "POST")) {
            cJSON* res = NULL;
            imbs_status_t st = imbs_db_post_stock_adjustment(json_body, &res, &err);
            if (st == IMBS_OK) {
                send_json_response(client_sock, 200, res, NULL);
            } else {
                send_json_response(client_sock, 400, NULL, err.message);
            }
        }
        /* Stock Transfers */
        else if (!strcmp(endpoint, "inventory/transfers") && !strcmp(method, "POST")) {
            cJSON* res = NULL;
            imbs_status_t st = imbs_db_post_stock_transfer(json_body, &res, &err);
            if (st == IMBS_OK) {
                send_json_response(client_sock, 200, res, NULL);
            } else {
                send_json_response(client_sock, 400, NULL, err.message);
            }
        }
        /* Suppliers */
        else if (!strcmp(endpoint, "suppliers")) {
            if (!strcmp(method, "GET")) {
                send_json_response(client_sock, 200, imbs_db_get_suppliers(), NULL);
            } else if (!strcmp(method, "POST")) {
                cJSON* res = NULL;
                imbs_status_t st = imbs_db_create_supplier(json_body, &res, &err);
                if (st == IMBS_OK) {
                    send_json_response(client_sock, 201, res, NULL);
                } else {
                    send_json_response(client_sock, 400, NULL, err.message);
                }
            }
        }
        /* Purchase Orders */
        else if (!strcmp(endpoint, "purchase-orders")) {
            if (!strcmp(method, "GET")) {
                send_json_response(client_sock, 200, imbs_db_get_purchase_orders(), NULL);
            } else if (!strcmp(method, "POST")) {
                cJSON* res = NULL;
                imbs_status_t st = imbs_db_create_purchase_order(json_body, &res, &err);
                if (st == IMBS_OK) {
                    send_json_response(client_sock, 201, res, NULL);
                } else {
                    send_json_response(client_sock, 400, NULL, err.message);
                }
            }
        }
        /* Goods Receipt */
        else if (!strcmp(endpoint, "goods-receipts") && !strcmp(method, "POST")) {
            cJSON* res = NULL;
            imbs_status_t st = imbs_db_receive_goods(json_body, &res, &err);
            if (st == IMBS_OK) {
                send_json_response(client_sock, 200, res, NULL);
            } else {
                send_json_response(client_sock, 400, NULL, err.message);
            }
        }
        /* Customers */
        else if (!strcmp(endpoint, "customers")) {
            if (!strcmp(method, "GET")) {
                send_json_response(client_sock, 200, imbs_db_get_customers(), NULL);
            } else if (!strcmp(method, "POST")) {
                cJSON* res = NULL;
                imbs_status_t st = imbs_db_create_customer(json_body, &res, &err);
                if (st == IMBS_OK) {
                    send_json_response(client_sock, 201, res, NULL);
                } else {
                    send_json_response(client_sock, 400, NULL, err.message);
                }
            }
        }
        /* Sales Cart Quotation / Preview */
        else if (!strcmp(endpoint, "sales/quote") && !strcmp(method, "POST")) {
            cJSON* res = NULL;
            imbs_status_t st = imbs_db_quote_sale(json_body, &res, &err);
            if (st == IMBS_OK) {
                send_json_response(client_sock, 200, res, NULL);
            } else {
                send_json_response(client_sock, 400, NULL, err.message);
            }
        }
        /* Sales Checkout (Atomic C POS) */
        else if (!strcmp(endpoint, "sales/checkout") && !strcmp(method, "POST")) {
            cJSON* res = NULL;
            imbs_status_t st = imbs_db_checkout_sale(json_body, &res, &err);
            if (st == IMBS_OK) {
                send_json_response(client_sock, 201, res, NULL);
            } else {
                send_json_response(client_sock, 400, NULL, err.message);
            }
        }
        /* Invoices */
        else if (!strcmp(endpoint, "invoices")) {
            send_json_response(client_sock, 200, imbs_db_get_invoices(), NULL);
        }
        /* Single Invoice */
        else if (!strncmp(endpoint, "invoices/", 9)) {
            const char* inv_id = endpoint + 9;
            cJSON* inv = imbs_db_get_invoice_by_id(inv_id);
            if (inv) {
                send_json_response(client_sock, 200, inv, NULL);
            } else {
                send_json_response(client_sock, 404, NULL, "Invoice not found.");
            }
        }
        /* Payments */
        else if (!strcmp(endpoint, "payments")) {
            if (!strcmp(method, "GET")) {
                send_json_response(client_sock, 200, imbs_db_get_payments(), NULL);
            } else if (!strcmp(method, "POST")) {
                cJSON* res = NULL;
                imbs_status_t st = imbs_db_create_payment(json_body, &res, &err);
                if (st == IMBS_OK) {
                    send_json_response(client_sock, 201, res, NULL);
                } else {
                    send_json_response(client_sock, 400, NULL, err.message);
                }
            }
        }
        /* Accounting Journals & Accounts */
        else if (!strcmp(endpoint, "accounting/journal-entries")) {
            send_json_response(client_sock, 200, imbs_db_get_journal_entries(), NULL);
        }
        else if (!strcmp(endpoint, "accounting/chart-of-accounts")) {
            send_json_response(client_sock, 200, imbs_db_get_chart_of_accounts(), NULL);
        }
        else if (!strcmp(endpoint, "accounting/trial-balance")) {
            send_json_response(client_sock, 200, imbs_db_get_trial_balance(), NULL);
        }
        /* Dashboard Metrics */
        else if (!strcmp(endpoint, "reports/dashboard-summary")) {
            send_json_response(client_sock, 200, imbs_db_get_dashboard_metrics(), NULL);
        }
        /* Audit Events */
        else if (!strcmp(endpoint, "audit-events")) {
            send_json_response(client_sock, 200, imbs_db_get_audit_events(), NULL);
        }
        /* Notifications */
        else if (!strcmp(endpoint, "notifications")) {
            send_json_response(client_sock, 200, imbs_db_get_notifications(), NULL);
        }
        else {
            send_json_response(client_sock, 404, NULL, "API route not found.");
        }
    } 
    /* STATIC FILE SERVING FOR TABLER FRONTEND */
    else {
        char filepath[512];
        if (!strcmp(clean_path, "/") || !strcmp(clean_path, "")) {
            strcpy(filepath, "frontend/index.html");
        } else {
            /* Map static asset paths to frontend directory */
            sprintf(filepath, "frontend%s", clean_path);
        }
        send_static_file(client_sock, filepath);
    }

    if (json_body) cJSON_Delete(json_body);
    free(buffer);
    close_socket(client_sock);
}

int imbs_http_server_run(const imbs_config_t* cfg) {
    if (!cfg) return 1;
    printf("[INFO] Starting HTTP server on port %d...\n", cfg->port);
    fflush(stdout);

#ifdef _WIN32
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) {
        printf("[ERROR] WSAStartup failed.\n");
        fflush(stdout);
        return 1;
    }
    printf("[INFO] WSAStartup initialized successfully.\n");
    fflush(stdout);
#else
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);
#endif

    SOCKET server_sock = socket(AF_INET, SOCK_STREAM, 0);
    if (server_sock == INVALID_SOCKET) {
#ifdef _WIN32
        printf("[ERROR] Failed to create socket: %d\n", WSAGetLastError());
#else
        printf("[ERROR] Failed to create socket.\n");
#endif
        fflush(stdout);
        return 1;
    }
    printf("[INFO] Socket created.\n");
    fflush(stdout);

    int opt = 1;
#ifdef _WIN32
    setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
#else
    setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    struct sockaddr_in server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons((unsigned short)cfg->port);

    if (bind(server_sock, (struct sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
#ifdef _WIN32
        int wsa_err = WSAGetLastError();
        printf("[ERROR] Bind failed on port %d with WSA error %d.\n", cfg->port, wsa_err);
#else
        printf("[ERROR] Bind failed on port %d.\n", cfg->port);
#endif
        fflush(stdout);
        close_socket(server_sock);
        return 1;
    }

    if (listen(server_sock, 32) == SOCKET_ERROR) {
        printf("[ERROR] Listen failed.\n");
        fflush(stdout);
        close_socket(server_sock);
        return 1;
    }

    printf("==============================================================================\n");
    printf("  CSA0201-B-CAPSTONE-IMBS Native C Service Started\n");
    printf("  Host: http://localhost:%d\n", cfg->port);
    printf("  Architecture: C17 Native Domain Engine + PostgreSQL/Supabase Dal\n");
    printf("  Frontend: Tabler Dark UI Theme\n");
    printf("==============================================================================\n");
    fflush(stdout);

    while (g_running) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        SOCKET client_sock = accept(server_sock, (struct sockaddr*)&client_addr, &client_len);

        if (client_sock == INVALID_SOCKET) {
            if (!g_running) break;
            continue;
        }

        handle_client(client_sock);
    }

    close_socket(server_sock);
#ifdef _WIN32
    WSACleanup();
#endif
    printf("[INFO] IMBS Server stopped gracefully.\n");
    return 0;
}

void imbs_http_server_stop(void) {
    g_running = 0;
}
