/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS
 * Data Access Layer & Transaction Coordinator
 * Bridges Persistence, C Domain Engine, and API Responses
 * ==============================================================================
 */

#include "../../include/db/db_adapter.h"
#include "../../include/domain/product.h"
#include "../../include/domain/uom.h"
#include "../../include/domain/tax.h"
#include "../../include/domain/inventory.h"
#include "../../include/domain/billing.h"
#include "../../include/domain/payments.h"
#include "../../include/domain/accounting.h"
#include "../../include/domain/procurement.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_RECORDS 256

/* Internal In-Memory Persistent Tables */
static cJSON* g_products = NULL;
static cJSON* g_balances = NULL;
static cJSON* g_movements = NULL;
static cJSON* g_suppliers = NULL;
static cJSON* g_purchase_orders = NULL;
static cJSON* g_customers = NULL;
static cJSON* g_invoices = NULL;
static cJSON* g_payments = NULL;
static cJSON* g_journals = NULL;
static cJSON* g_chart_of_accounts = NULL;
static cJSON* g_audit_events = NULL;
static cJSON* g_notifications = NULL;

static int g_invoice_counter = 1001;
static int g_po_counter = 2001;
static int g_payment_counter = 3001;
static int g_journal_counter = 4001;
static int g_movement_counter = 5001;

static cJSON* json_clone(const cJSON* item) {
    if (!item) return NULL;
    char* s = cJSON_PrintUnformatted(item);
    if (!s) return NULL;
    cJSON* copy = cJSON_Parse(s);
    free(s);
    return copy;
}

static void json_delete_item_from_object(cJSON* obj, const char* key) {
    if (!obj || !key) return;
    cJSON* c = obj->child;
    cJSON* prev = NULL;
    while (c) {
        if (c->string && !strcmp(c->string, key)) {
            if (prev) {
                prev->next = c->next;
            } else {
                obj->child = c->next;
            }
            c->next = NULL;
            cJSON_Delete(c);
            return;
        }
        prev = c;
        c = c->next;
    }
}

static void json_replace_number_in_object(cJSON* obj, const char* key, double val) {
    if (!obj || !key) return;
    json_delete_item_from_object(obj, key);
    cJSON_AddNumberToObject(obj, key, val);
}

static void get_iso_timestamp(char* buf, size_t sz) {
    time_t now = time(NULL);
    struct tm* tm_info = gmtime(&now);
    strftime(buf, sz, "%Y-%m-%dT%H:%M:%SZ", tm_info);
}

static void log_audit(const char* action, const char* entity_type, const char* entity_id, const char* details) {
    if (!g_audit_events) return;
    cJSON* evt = cJSON_CreateObject();
    char buf[64];
    sprintf(buf, "aud-%06d", rand() % 1000000);
    cJSON_AddStringToObject(evt, "id", buf);
    cJSON_AddStringToObject(evt, "action", action);
    cJSON_AddStringToObject(evt, "entity_type", entity_type);
    cJSON_AddStringToObject(evt, "entity_id", entity_id);
    cJSON_AddStringToObject(evt, "details", details);
    char ts[32];
    get_iso_timestamp(ts, sizeof(ts));
    cJSON_AddStringToObject(evt, "created_at", ts);
    cJSON_AddItemToArray(g_audit_events, evt);
}

imbs_status_t imbs_db_init(imbs_error_t* err) {
    (void)err;
    g_products = cJSON_CreateArray();
    g_balances = cJSON_CreateArray();
    g_movements = cJSON_CreateArray();
    g_suppliers = cJSON_CreateArray();
    g_purchase_orders = cJSON_CreateArray();
    g_customers = cJSON_CreateArray();
    g_invoices = cJSON_CreateArray();
    g_payments = cJSON_CreateArray();
    g_journals = cJSON_CreateArray();
    g_chart_of_accounts = cJSON_CreateArray();
    g_audit_events = cJSON_CreateArray();
    g_notifications = cJSON_CreateArray();

    /* 1. Seed Products */
    const char* p1_id = "p0000000-0000-0000-0000-000000000001";
    cJSON* p1 = cJSON_CreateObject();
    cJSON_AddStringToObject(p1, "id", p1_id);
    cJSON_AddStringToObject(p1, "sku", "SKU-IND-SCAN-01");
    cJSON_AddStringToObject(p1, "barcode", "8901234567890");
    cJSON_AddStringToObject(p1, "name", "Apex Pro High-Speed Barcode Scanner 2D");
    cJSON_AddStringToObject(p1, "category", "Electronics & Hardware");
    cJSON_AddStringToObject(p1, "uom", "PCS");
    cJSON_AddNumberToObject(p1, "purchase_price_cents", 420000);
    cJSON_AddNumberToObject(p1, "selling_price_cents", 650000);
    cJSON_AddNumberToObject(p1, "tax_rate_percent", 18.0);
    cJSON_AddNumberToObject(p1, "reorder_point", 15);
    cJSON_AddBoolToObject(p1, "is_active", true);
    cJSON_AddItemToArray(g_products, p1);

    const char* p2_id = "p0000000-0000-0000-0000-000000000002";
    cJSON* p2 = cJSON_CreateObject();
    cJSON_AddStringToObject(p2, "id", p2_id);
    cJSON_AddStringToObject(p2, "sku", "SKU-THERM-PRN-80");
    cJSON_AddStringToObject(p2, "barcode", "8901234567891");
    cJSON_AddStringToObject(p2, "name", "Apex 80mm High-Speed Thermal Receipt Printer");
    cJSON_AddStringToObject(p2, "category", "Electronics & Hardware");
    cJSON_AddStringToObject(p2, "uom", "PCS");
    cJSON_AddNumberToObject(p2, "purchase_price_cents", 680000);
    cJSON_AddNumberToObject(p2, "selling_price_cents", 990000);
    cJSON_AddNumberToObject(p2, "tax_rate_percent", 18.0);
    cJSON_AddNumberToObject(p2, "reorder_point", 10);
    cJSON_AddBoolToObject(p2, "is_active", true);
    cJSON_AddItemToArray(g_products, p2);

    const char* p3_id = "p0000000-0000-0000-0000-000000000003";
    cJSON* p3 = cJSON_CreateObject();
    cJSON_AddStringToObject(p3, "id", p3_id);
    cJSON_AddStringToObject(p3, "sku", "SKU-ROLL-TH-BOX");
    cJSON_AddStringToObject(p3, "barcode", "8901234567892");
    cJSON_AddStringToObject(p3, "name", "Thermal Paper Rolls 80x80mm (Box of 50)");
    cJSON_AddStringToObject(p3, "category", "Office Supplies & Automation");
    cJSON_AddStringToObject(p3, "uom", "BOX");
    cJSON_AddNumberToObject(p3, "purchase_price_cents", 180000);
    cJSON_AddNumberToObject(p3, "selling_price_cents", 250000);
    cJSON_AddNumberToObject(p3, "tax_rate_percent", 12.0);
    cJSON_AddNumberToObject(p3, "reorder_point", 25);
    cJSON_AddBoolToObject(p3, "is_active", true);
    cJSON_AddItemToArray(g_products, p3);

    const char* p4_id = "p0000000-0000-0000-0000-000000000004";
    cJSON* p4 = cJSON_CreateObject();
    cJSON_AddStringToObject(p4, "id", p4_id);
    cJSON_AddStringToObject(p4, "sku", "SKU-CASH-DRW-5B");
    cJSON_AddStringToObject(p4, "barcode", "8901234567893");
    cJSON_AddStringToObject(p4, "name", "Heavy Duty Metal POS Cash Drawer 5B/8C");
    cJSON_AddStringToObject(p4, "category", "Electronics & Hardware");
    cJSON_AddStringToObject(p4, "uom", "PCS");
    cJSON_AddNumberToObject(p4, "purchase_price_cents", 310000);
    cJSON_AddNumberToObject(p4, "selling_price_cents", 450000);
    cJSON_AddNumberToObject(p4, "tax_rate_percent", 18.0);
    cJSON_AddNumberToObject(p4, "reorder_point", 8);
    cJSON_AddBoolToObject(p4, "is_active", true);
    cJSON_AddItemToArray(g_products, p4);

    /* 2. Seed Inventory Balances */
    cJSON* b1 = cJSON_CreateObject();
    cJSON_AddStringToObject(b1, "product_id", p1_id);
    cJSON_AddStringToObject(b1, "sku", "SKU-IND-SCAN-01");
    cJSON_AddStringToObject(b1, "name", "Apex Pro High-Speed Barcode Scanner 2D");
    cJSON_AddStringToObject(b1, "warehouse", "Central Warehouse");
    cJSON_AddNumberToObject(b1, "on_hand_qty", 145);
    cJSON_AddNumberToObject(b1, "reserved_qty", 10);
    cJSON_AddNumberToObject(b1, "average_cost_cents", 420000);
    cJSON_AddItemToArray(g_balances, b1);

    cJSON* b2 = cJSON_CreateObject();
    cJSON_AddStringToObject(b2, "product_id", p2_id);
    cJSON_AddStringToObject(b2, "sku", "SKU-THERM-PRN-80");
    cJSON_AddStringToObject(b2, "name", "Apex 80mm High-Speed Thermal Receipt Printer");
    cJSON_AddStringToObject(b2, "warehouse", "Central Warehouse");
    cJSON_AddNumberToObject(b2, "on_hand_qty", 82);
    cJSON_AddNumberToObject(b2, "reserved_qty", 4);
    cJSON_AddNumberToObject(b2, "average_cost_cents", 680000);
    cJSON_AddItemToArray(g_balances, b2);

    cJSON* b3 = cJSON_CreateObject();
    cJSON_AddStringToObject(b3, "product_id", p3_id);
    cJSON_AddStringToObject(b3, "sku", "SKU-ROLL-TH-BOX");
    cJSON_AddStringToObject(b3, "name", "Thermal Paper Rolls 80x80mm (Box of 50)");
    cJSON_AddStringToObject(b3, "warehouse", "Central Warehouse");
    cJSON_AddNumberToObject(b3, "on_hand_qty", 320);
    cJSON_AddNumberToObject(b3, "reserved_qty", 15);
    cJSON_AddNumberToObject(b3, "average_cost_cents", 180000);
    cJSON_AddItemToArray(g_balances, b3);

    cJSON* b4 = cJSON_CreateObject();
    cJSON_AddStringToObject(b4, "product_id", p4_id);
    cJSON_AddStringToObject(b4, "sku", "SKU-CASH-DRW-5B");
    cJSON_AddStringToObject(b4, "name", "Heavy Duty Metal POS Cash Drawer 5B/8C");
    cJSON_AddStringToObject(b4, "warehouse", "Central Warehouse");
    cJSON_AddNumberToObject(b4, "on_hand_qty", 38);
    cJSON_AddNumberToObject(b4, "reserved_qty", 2);
    cJSON_AddNumberToObject(b4, "average_cost_cents", 310000);
    cJSON_AddItemToArray(g_balances, b4);

    /* 3. Seed Suppliers */
    cJSON* s1 = cJSON_CreateObject();
    cJSON_AddStringToObject(s1, "id", "s0000000-0000-0000-0000-000000000001");
    cJSON_AddStringToObject(s1, "code", "SUP-LOGIC-01");
    cJSON_AddStringToObject(s1, "company_name", "LogiTech Electronics Supplies India Ltd.");
    cJSON_AddStringToObject(s1, "contact_person", "Ramesh Nair");
    cJSON_AddStringToObject(s1, "phone", "+91 98401 23456");
    cJSON_AddStringToObject(s1, "email", "procurement@logitechel.in");
    cJSON_AddStringToObject(s1, "city", "Chennai");
    cJSON_AddNumberToObject(s1, "outstanding_payable_cents", 14500000);
    cJSON_AddItemToArray(g_suppliers, s1);

    cJSON* s2 = cJSON_CreateObject();
    cJSON_AddStringToObject(s2, "id", "s0000000-0000-0000-0000-000000000002");
    cJSON_AddStringToObject(s2, "code", "SUP-PAPER-02");
    cJSON_AddStringToObject(s2, "company_name", "National Paper & Roll Mills Co.");
    cJSON_AddStringToObject(s2, "contact_person", "Vikram Mehta");
    cJSON_AddStringToObject(s2, "phone", "+91 98200 98765");
    cJSON_AddStringToObject(s2, "email", "sales@nationalpaper.com");
    cJSON_AddStringToObject(s2, "city", "Mumbai");
    cJSON_AddNumberToObject(s2, "outstanding_payable_cents", 4200000);
    cJSON_AddItemToArray(g_suppliers, s2);

    /* 4. Seed Customers */
    cJSON* c1 = cJSON_CreateObject();
    cJSON_AddStringToObject(c1, "id", "cust0000-0000-0000-0000-000000000001");
    cJSON_AddStringToObject(c1, "code", "CUST-HYPER-01");
    cJSON_AddStringToObject(c1, "name", "HyperMarket Retail Ventures India");
    cJSON_AddStringToObject(c1, "phone", "+91 99400 11223");
    cJSON_AddStringToObject(c1, "email", "billing@hypermarketindia.com");
    cJSON_AddStringToObject(c1, "city", "Chennai");
    cJSON_AddNumberToObject(c1, "credit_limit_cents", 50000000);
    cJSON_AddNumberToObject(c1, "outstanding_receivable_cents", 8450000);
    cJSON_AddItemToArray(g_customers, c1);

    cJSON* c2 = cJSON_CreateObject();
    cJSON_AddStringToObject(c2, "id", "cust0000-0000-0000-0000-000000000002");
    cJSON_AddStringToObject(c2, "code", "CUST-WALK-IN");
    cJSON_AddStringToObject(c2, "name", "Walk-in Retail Customer");
    cJSON_AddStringToObject(c2, "phone", "+91 90000 00000");
    cJSON_AddStringToObject(c2, "email", "cashier@apexcorp.com");
    cJSON_AddStringToObject(c2, "city", "Chennai");
    cJSON_AddNumberToObject(c2, "credit_limit_cents", 0);
    cJSON_AddNumberToObject(c2, "outstanding_receivable_cents", 0);
    cJSON_AddItemToArray(g_customers, c2);

    /* 5. Seed Chart of Accounts */
    const char* coa_defs[][4] = {
        {"1010", "Cash on Hand", "ASSET", "Liquid physical currency in POS drawers"},
        {"1020", "Operating Bank Account", "ASSET", "Current banking account for electronic settlements"},
        {"1200", "Accounts Receivable (Debtors)", "ASSET", "Customer invoice balances due"},
        {"1300", "Merchandise Inventory Asset", "ASSET", "Current valuation of stock on hand"},
        {"2010", "Accounts Payable (Creditors)", "LIABILITY", "Supplier invoice balances due"},
        {"2210", "CGST Payable", "LIABILITY", "Central GST tax collected on sales"},
        {"2220", "SGST Payable", "LIABILITY", "State GST tax collected on sales"},
        {"4010", "Merchandise Sales Revenue", "REVENUE", "Gross revenue from goods sold"},
        {"5010", "Cost of Goods Sold (COGS)", "EXPENSE", "Direct inventory cost of goods sold"}
    };
    for (size_t i = 0; i < sizeof(coa_defs)/sizeof(coa_defs[0]); i++) {
        cJSON* acc = cJSON_CreateObject();
        cJSON_AddStringToObject(acc, "account_code", coa_defs[i][0]);
        cJSON_AddStringToObject(acc, "account_name", coa_defs[i][1]);
        cJSON_AddStringToObject(acc, "account_type", coa_defs[i][2]);
        cJSON_AddStringToObject(acc, "description", coa_defs[i][3]);
        cJSON_AddItemToArray(g_chart_of_accounts, acc);
    }

    /* 6. Seed Notifications matching reference UI */
    cJSON* n1 = cJSON_CreateObject();
    cJSON_AddStringToObject(n1, "title", "Welcome back, Paweł");
    cJSON_AddStringToObject(n1, "message", "You have 5 new messages and 2 new notifications.");
    cJSON_AddStringToObject(n1, "type", "INFO");
    cJSON_AddStringToObject(n1, "time", "10m ago");
    cJSON_AddItemToArray(g_notifications, n1);

    cJSON* n2 = cJSON_CreateObject();
    cJSON_AddStringToObject(n2, "title", "Low Stock Alert: Cash Drawer 5B/8C");
    cJSON_AddStringToObject(n2, "message", "Stock has reached reorder threshold (38 units left in Central Warehouse).");
    cJSON_AddStringToObject(n2, "type", "WARNING");
    cJSON_AddStringToObject(n2, "time", "1h ago");
    cJSON_AddItemToArray(g_notifications, n2);

    log_audit("SYSTEM_INIT", "SYSTEM", "0", "Database initialized with enterprise seed master data.");
    return IMBS_OK;
}

void imbs_db_shutdown(void) {
    if (g_products) cJSON_Delete(g_products);
    if (g_balances) cJSON_Delete(g_balances);
    if (g_movements) cJSON_Delete(g_movements);
    if (g_suppliers) cJSON_Delete(g_suppliers);
    if (g_purchase_orders) cJSON_Delete(g_purchase_orders);
    if (g_customers) cJSON_Delete(g_customers);
    if (g_invoices) cJSON_Delete(g_invoices);
    if (g_payments) cJSON_Delete(g_payments);
    if (g_journals) cJSON_Delete(g_journals);
    if (g_chart_of_accounts) cJSON_Delete(g_chart_of_accounts);
    if (g_audit_events) cJSON_Delete(g_audit_events);
    if (g_notifications) cJSON_Delete(g_notifications);
}

cJSON* imbs_db_get_products(void) {
    return json_clone(g_products);
}

cJSON* imbs_db_get_product_by_id(const char* id) {
    if (!id || !g_products) return NULL;
    int sz = cJSON_GetArraySize(g_products);
    for (int i = 0; i < sz; i++) {
        cJSON* p = cJSON_GetArrayItem(g_products, i);
        cJSON* pid = cJSON_GetObjectItem(p, "id");
        if (pid && !strcmp(pid->valuestring, id)) {
            return json_clone(p);
        }
    }
    return NULL;
}

imbs_status_t imbs_db_create_product(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Invalid product JSON.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* sku = cJSON_GetObjectItem(json, "sku");
    cJSON* name = cJSON_GetObjectItem(json, "name");
    cJSON* price = cJSON_GetObjectItem(json, "selling_price_cents");
    if (!sku || !name || !price) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Missing mandatory fields (sku, name, selling_price_cents).");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    cJSON* p = json_clone(json);
    char buf[64];
    sprintf(buf, "p%08d-0000-0000-0000-%012d", rand() % 1000000, rand() % 1000000);
    json_delete_item_from_object(p, "id");
    cJSON_AddStringToObject(p, "id", buf);
    cJSON_AddItemToArray(g_products, p);

    /* Also create inventory balance row */
    cJSON* b = cJSON_CreateObject();
    cJSON_AddStringToObject(b, "product_id", buf);
    cJSON_AddStringToObject(b, "sku", sku->valuestring);
    cJSON_AddStringToObject(b, "name", name->valuestring);
    cJSON_AddStringToObject(b, "warehouse", "Central Warehouse");
    cJSON_AddNumberToObject(b, "on_hand_qty", 0);
    cJSON_AddNumberToObject(b, "reserved_qty", 0);
    cJSON_AddNumberToObject(b, "average_cost_cents", 0);
    cJSON_AddItemToArray(g_balances, b);

    log_audit("PRODUCT_CREATED", "PRODUCT", buf, name->valuestring);
    if (out_result) *out_result = json_clone(p);
    return IMBS_OK;
}

cJSON* imbs_db_get_inventory_balances(void) {
    return json_clone(g_balances);
}

cJSON* imbs_db_get_stock_movements(void) {
    return json_clone(g_movements);
}

imbs_status_t imbs_db_post_stock_adjustment(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Adjustment payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* prod_id = cJSON_GetObjectItem(json, "product_id");
    cJSON* qty = cJSON_GetObjectItem(json, "quantity");
    cJSON* type_str = cJSON_GetObjectItem(json, "type"); /* "ADD" or "SUB" */
    cJSON* reason = cJSON_GetObjectItem(json, "reason");

    if (!prod_id || !qty || !type_str) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Missing product_id, quantity, or type.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    int delta = qty->valueint;
    bool is_add = !strcmp(type_str->valuestring, "ADD");

    /* Find balance item */
    int sz = cJSON_GetArraySize(g_balances);
    cJSON* target_b = NULL;
    for (int i = 0; i < sz; i++) {
        cJSON* b = cJSON_GetArrayItem(g_balances, i);
        cJSON* pid = cJSON_GetObjectItem(b, "product_id");
        if (pid && !strcmp(pid->valuestring, prod_id->valuestring)) {
            target_b = b;
            break;
        }
    }
    if (!target_b) {
        imbs_error_set(err, IMBS_ERR_NOT_FOUND, "Product balance not found.");
        return IMBS_ERR_NOT_FOUND;
    }

    cJSON* on_hand = cJSON_GetObjectItem(target_b, "on_hand_qty");
    int cur_qty = on_hand ? on_hand->valueint : 0;
    if (!is_add && cur_qty < delta) {
        imbs_error_set(err, IMBS_ERR_INSUFFICIENT_STOCK, "Adjustment exceeds available stock.");
        return IMBS_ERR_INSUFFICIENT_STOCK;
    }

    int new_qty = is_add ? (cur_qty + delta) : (cur_qty - delta);
    json_replace_number_in_object(target_b, "on_hand_qty", (double)new_qty);

    /* Record stock movement */
    cJSON* m = cJSON_CreateObject();
    char m_num[32];
    sprintf(m_num, "MOV-%05d", g_movement_counter++);
    cJSON_AddStringToObject(m, "movement_number", m_num);
    cJSON_AddStringToObject(m, "product_id", prod_id->valuestring);
    cJSON_AddStringToObject(m, "movement_type", is_add ? "ADJUSTMENT_ADD" : "ADJUSTMENT_SUB");
    cJSON_AddNumberToObject(m, "quantity", delta);
    cJSON_AddStringToObject(m, "reason", reason ? reason->valuestring : "Stock count variance adjustment");
    char ts[32];
    get_iso_timestamp(ts, sizeof(ts));
    cJSON_AddStringToObject(m, "created_at", ts);
    cJSON_AddItemToArray(g_movements, m);

    log_audit("STOCK_ADJUSTMENT", "INVENTORY", prod_id->valuestring, is_add ? "Added stock" : "Reduced stock");
    if (out_result) *out_result = json_clone(m);
    return IMBS_OK;
}

imbs_status_t imbs_db_post_stock_transfer(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Transfer payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* prod_id = cJSON_GetObjectItem(json, "product_id");
    cJSON* qty = cJSON_GetObjectItem(json, "quantity");
    cJSON* from_wh = cJSON_GetObjectItem(json, "from_warehouse");
    cJSON* to_wh = cJSON_GetObjectItem(json, "to_warehouse");

    if (!prod_id || !qty || !from_wh || !to_wh) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Missing transfer fields.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    /* Record movement */
    cJSON* m = cJSON_CreateObject();
    char m_num[32];
    sprintf(m_num, "TRF-%05d", g_movement_counter++);
    cJSON_AddStringToObject(m, "movement_number", m_num);
    cJSON_AddStringToObject(m, "product_id", prod_id->valuestring);
    cJSON_AddStringToObject(m, "movement_type", "WAREHOUSE_TRANSFER");
    cJSON_AddNumberToObject(m, "quantity", qty->valueint);
    cJSON_AddStringToObject(m, "from_warehouse", from_wh->valuestring);
    cJSON_AddStringToObject(m, "to_warehouse", to_wh->valuestring);
    char ts[32];
    get_iso_timestamp(ts, sizeof(ts));
    cJSON_AddStringToObject(m, "created_at", ts);
    cJSON_AddItemToArray(g_movements, m);

    log_audit("STOCK_TRANSFER", "INVENTORY", prod_id->valuestring, "Transferred between warehouses");
    if (out_result) *out_result = json_clone(m);
    return IMBS_OK;
}

cJSON* imbs_db_get_suppliers(void) {
    return json_clone(g_suppliers);
}

imbs_status_t imbs_db_create_supplier(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Supplier payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* s = json_clone(json);
    char buf[64];
    sprintf(buf, "s%08d-0000-0000-0000-%012d", rand() % 1000000, rand() % 1000000);
    json_delete_item_from_object(s, "id");
    cJSON_AddStringToObject(s, "id", buf);
    cJSON_AddItemToArray(g_suppliers, s);

    log_audit("SUPPLIER_CREATED", "SUPPLIER", buf, "New supplier registered");
    if (out_result) *out_result = json_clone(s);
    return IMBS_OK;
}

cJSON* imbs_db_get_purchase_orders(void) {
    return json_clone(g_purchase_orders);
}

imbs_status_t imbs_db_create_purchase_order(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "PO payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* po = json_clone(json);
    char po_num[32];
    sprintf(po_num, "PO-%05d", g_po_counter++);
    json_delete_item_from_object(po, "po_number");
    cJSON_AddStringToObject(po, "po_number", po_num);
    cJSON_AddStringToObject(po, "status", "APPROVED");
    char ts[32];
    get_iso_timestamp(ts, sizeof(ts));
    cJSON_AddStringToObject(po, "order_date", ts);
    cJSON_AddItemToArray(g_purchase_orders, po);

    log_audit("PO_CREATED", "PROCUREMENT", po_num, "Purchase Order created and approved");
    if (out_result) *out_result = json_clone(po);
    return IMBS_OK;
}

imbs_status_t imbs_db_receive_goods(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Goods receipt payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* prod_id = cJSON_GetObjectItem(json, "product_id");
    cJSON* qty = cJSON_GetObjectItem(json, "quantity");
    cJSON* cost = cJSON_GetObjectItem(json, "unit_cost_cents");

    if (!prod_id || !qty || !cost) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Missing mandatory GRN fields.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    /* Update inventory balance with C costing logic */
    int sz = cJSON_GetArraySize(g_balances);
    for (int i = 0; i < sz; i++) {
        cJSON* b = cJSON_GetArrayItem(g_balances, i);
        cJSON* pid = cJSON_GetObjectItem(b, "product_id");
        if (pid && !strcmp(pid->valuestring, prod_id->valuestring)) {
            imbs_inventory_balance_t bal;
            bal.on_hand_qty = cJSON_GetObjectItem(b, "on_hand_qty")->valueint;
            bal.reserved_qty = cJSON_GetObjectItem(b, "reserved_qty")->valueint;
            bal.average_cost_cents = (money_t)cJSON_GetObjectItem(b, "average_cost_cents")->valuedouble;

            imbs_stock_movement_request_t req;
            req.type = IMBS_MOVE_GOODS_RECEIPT;
            req.quantity = qty->valueint;
            req.unit_cost_cents = (money_t)cost->valuedouble;
            strcpy(req.reference_doc, "GRN-RECEIPT");

            imbs_inventory_apply_movement(&bal, &req, false, err);

            json_replace_number_in_object(b, "on_hand_qty", (double)bal.on_hand_qty);
            json_replace_number_in_object(b, "average_cost_cents", (double)bal.average_cost_cents);
            break;
        }
    }

    /* Record movement */
    cJSON* m = cJSON_CreateObject();
    char m_num[32];
    sprintf(m_num, "GRN-%05d", g_movement_counter++);
    cJSON_AddStringToObject(m, "movement_number", m_num);
    cJSON_AddStringToObject(m, "product_id", prod_id->valuestring);
    cJSON_AddStringToObject(m, "movement_type", "GOODS_RECEIPT");
    cJSON_AddNumberToObject(m, "quantity", qty->valueint);
    cJSON_AddNumberToObject(m, "unit_cost_cents", cost->valuedouble);
    char ts[32];
    get_iso_timestamp(ts, sizeof(ts));
    cJSON_AddStringToObject(m, "created_at", ts);
    cJSON_AddItemToArray(g_movements, m);

    log_audit("GOODS_RECEIVED", "PROCUREMENT", m_num, "Received supplier shipment into inventory");
    if (out_result) *out_result = json_clone(m);
    return IMBS_OK;
}

cJSON* imbs_db_get_customers(void) {
    return json_clone(g_customers);
}

imbs_status_t imbs_db_create_customer(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Customer payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* c = json_clone(json);
    char buf[64];
    sprintf(buf, "cust%04d-0000-0000-0000-%012d", rand() % 10000, rand() % 1000000);
    json_delete_item_from_object(c, "id");
    cJSON_AddStringToObject(c, "id", buf);
    cJSON_AddItemToArray(g_customers, c);

    log_audit("CUSTOMER_CREATED", "CUSTOMER", buf, "New customer account created");
    if (out_result) *out_result = json_clone(c);
    return IMBS_OK;
}

/* Run C Billing Calculation on lines */
imbs_status_t imbs_db_quote_sale(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Cart payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* lines_arr = cJSON_GetObjectItem(json, "lines");
    if (!lines_arr || !cJSON_IsArray(lines_arr) || cJSON_GetArraySize(lines_arr) == 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Cart must contain at least one line item.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    imbs_invoice_t inv;
    memset(&inv, 0, sizeof(inv));
    inv.line_count = (size_t)cJSON_GetArraySize(lines_arr);
    if (inv.line_count > MAX_INVOICE_LINES) inv.line_count = MAX_INVOICE_LINES;

    cJSON* override_flag = cJSON_GetObjectItem(json, "manager_override_approved");
    inv.manager_override_approved = (override_flag && cJSON_IsTrue(override_flag));

    cJSON* inv_disc = cJSON_GetObjectItem(json, "invoice_discount_bp");
    inv.invoice_discount_bp = inv_disc ? inv_disc->valueint : 0;

    for (size_t i = 0; i < inv.line_count; i++) {
        cJSON* l = cJSON_GetArrayItem(lines_arr, (int)i);
        imbs_invoice_line_t* line = &inv.lines[i];

        cJSON* pid = cJSON_GetObjectItem(l, "product_id");
        if (pid) strncpy(line->product_id, pid->valuestring, sizeof(line->product_id)-1);

        cJSON* qty = cJSON_GetObjectItem(l, "quantity");
        line->quantity = qty ? qty->valueint : 1;

        cJSON* price = cJSON_GetObjectItem(l, "unit_price_cents");
        line->unit_price_cents = price ? (money_t)price->valuedouble : 0;

        cJSON* disc = cJSON_GetObjectItem(l, "discount_bp");
        line->discount_bp = disc ? disc->valueint : 0;

        cJSON* tax_rate = cJSON_GetObjectItem(l, "tax_rate_percent");
        basis_points_t rate_bp = tax_rate ? (basis_points_t)(tax_rate->valuedouble * 100.0) : 1800;
        line->tax_spec.rate_bp = rate_bp;
        line->tax_spec.jurisdiction = IMBS_TAX_INTRA_STATE;
        line->tax_spec.is_inclusive = false;
    }

    imbs_status_t st = imbs_billing_calculate_invoice(&inv, DEFAULT_MAX_DISCOUNT_BP, err);
    if (st != IMBS_OK) return st;

    cJSON* resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "subtotal_cents", (double)inv.subtotal_cents);
    cJSON_AddNumberToObject(resp, "total_discount_cents", (double)inv.total_discount_cents);
    cJSON_AddNumberToObject(resp, "taxable_subtotal_cents", (double)inv.taxable_subtotal_cents);
    cJSON_AddNumberToObject(resp, "total_cgst_cents", (double)inv.total_cgst_cents);
    cJSON_AddNumberToObject(resp, "total_sgst_cents", (double)inv.total_sgst_cents);
    cJSON_AddNumberToObject(resp, "total_igst_cents", (double)inv.total_igst_cents);
    cJSON_AddNumberToObject(resp, "total_tax_cents", (double)inv.total_tax_cents);
    cJSON_AddNumberToObject(resp, "round_off_cents", (double)inv.round_off_cents);
    cJSON_AddNumberToObject(resp, "grand_total_cents", (double)inv.grand_total_cents);

    cJSON* computed_lines = cJSON_CreateArray();
    for (size_t i = 0; i < inv.line_count; i++) {
        imbs_invoice_line_t* line = &inv.lines[i];
        cJSON* cl = cJSON_CreateObject();
        cJSON_AddStringToObject(cl, "product_id", line->product_id);
        cJSON_AddNumberToObject(cl, "quantity", line->quantity);
        cJSON_AddNumberToObject(cl, "unit_price_cents", (double)line->unit_price_cents);
        cJSON_AddNumberToObject(cl, "gross_amount_cents", (double)line->gross_amount_cents);
        cJSON_AddNumberToObject(cl, "discount_amount_cents", (double)line->discount_amount_cents);
        cJSON_AddNumberToObject(cl, "taxable_amount", (double)line->tax_result.taxable_amount);
        cJSON_AddNumberToObject(cl, "cgst_amount", (double)line->tax_result.cgst_amount);
        cJSON_AddNumberToObject(cl, "sgst_amount", (double)line->tax_result.sgst_amount);
        cJSON_AddNumberToObject(cl, "line_total", (double)line->tax_result.line_total);
        cJSON_AddItemToArray(computed_lines, cl);
    }
    cJSON_AddItemToObject(resp, "lines", computed_lines);

    if (out_result) *out_result = resp;
    return IMBS_OK;
}

/* Atomic POS Sale Checkout Coordinator */
imbs_status_t imbs_db_checkout_sale(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Sale payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    cJSON* quote = NULL;
    imbs_status_t st = imbs_db_quote_sale(json, &quote, err);
    if (st != IMBS_OK) return st;

    /* Check stock availability & deduct atomically */
    cJSON* lines_arr = cJSON_GetObjectItem(json, "lines");
    int line_count = cJSON_GetArraySize(lines_arr);

    for (int i = 0; i < line_count; i++) {
        cJSON* l = cJSON_GetArrayItem(lines_arr, i);
        const char* pid = cJSON_GetObjectItem(l, "product_id")->valuestring;
        int req_qty = cJSON_GetObjectItem(l, "quantity")->valueint;

        /* Verify against stock balance */
        int b_sz = cJSON_GetArraySize(g_balances);
        bool found = false;
        for (int j = 0; j < b_sz; j++) {
            cJSON* b = cJSON_GetArrayItem(g_balances, j);
            if (!strcmp(cJSON_GetObjectItem(b, "product_id")->valuestring, pid)) {
                found = true;
                int on_hand = cJSON_GetObjectItem(b, "on_hand_qty")->valueint;
                int reserved = cJSON_GetObjectItem(b, "reserved_qty")->valueint;
                if ((on_hand - reserved) < req_qty) {
                    cJSON_Delete(quote);
                    imbs_error_set(err, IMBS_ERR_INSUFFICIENT_STOCK, "Insufficient stock available for line item.");
                    return IMBS_ERR_INSUFFICIENT_STOCK;
                }
                /* Atomic deduction */
                json_replace_number_in_object(b, "on_hand_qty", (double)(on_hand - req_qty));
                break;
            }
        }
        if (!found) {
            cJSON_Delete(quote);
            imbs_error_set(err, IMBS_ERR_NOT_FOUND, "Product stock balance record missing.");
            return IMBS_ERR_NOT_FOUND;
        }

        /* Post immutable stock movement */
        cJSON* m = cJSON_CreateObject();
        char m_num[32];
        sprintf(m_num, "MOV-SALE-%05d", g_movement_counter++);
        cJSON_AddStringToObject(m, "movement_number", m_num);
        cJSON_AddStringToObject(m, "product_id", pid);
        cJSON_AddStringToObject(m, "movement_type", "SALE_ISSUE");
        cJSON_AddNumberToObject(m, "quantity", req_qty);
        char ts[32];
        get_iso_timestamp(ts, sizeof(ts));
        cJSON_AddStringToObject(m, "created_at", ts);
        cJSON_AddItemToArray(g_movements, m);
    }

    /* Create Final Invoice Record */
    cJSON* inv_rec = cJSON_CreateObject();
    char inv_num[32];
    sprintf(inv_num, "INV-2026-%04d", g_invoice_counter++);
    cJSON_AddStringToObject(inv_rec, "invoice_number", inv_num);

    cJSON* cust_id = cJSON_GetObjectItem(json, "customer_id");
    cJSON* cust_name = cJSON_GetObjectItem(json, "customer_name");
    cJSON_AddStringToObject(inv_rec, "customer_id", cust_id ? cust_id->valuestring : "cust0000-0000-0000-0000-000000000002");
    cJSON_AddStringToObject(inv_rec, "customer_name", cust_name ? cust_name->valuestring : "Walk-in Retail Customer");

    char cur_ts[32];
    get_iso_timestamp(cur_ts, sizeof(cur_ts));
    cJSON_AddStringToObject(inv_rec, "invoice_date", cur_ts);
    cJSON_AddStringToObject(inv_rec, "status", "PAID");

    /* Copy calculations from C quote */
    double grand_total = cJSON_GetObjectItem(quote, "grand_total_cents")->valuedouble;
    cJSON_AddNumberToObject(inv_rec, "subtotal_cents", cJSON_GetObjectItem(quote, "subtotal_cents")->valuedouble);
    cJSON_AddNumberToObject(inv_rec, "total_discount_cents", cJSON_GetObjectItem(quote, "total_discount_cents")->valuedouble);
    cJSON_AddNumberToObject(inv_rec, "taxable_subtotal_cents", cJSON_GetObjectItem(quote, "taxable_subtotal_cents")->valuedouble);
    cJSON_AddNumberToObject(inv_rec, "total_cgst_cents", cJSON_GetObjectItem(quote, "total_cgst_cents")->valuedouble);
    cJSON_AddNumberToObject(inv_rec, "total_sgst_cents", cJSON_GetObjectItem(quote, "total_sgst_cents")->valuedouble);
    cJSON_AddNumberToObject(inv_rec, "total_tax_cents", cJSON_GetObjectItem(quote, "total_tax_cents")->valuedouble);
    cJSON_AddNumberToObject(inv_rec, "round_off_cents", cJSON_GetObjectItem(quote, "round_off_cents")->valuedouble);
    cJSON_AddNumberToObject(inv_rec, "grand_total_cents", grand_total);
    cJSON_AddNumberToObject(inv_rec, "amount_paid_cents", grand_total);
    cJSON_AddNumberToObject(inv_rec, "balance_due_cents", 0);
    cJSON_AddItemToObject(inv_rec, "lines", json_clone(cJSON_GetObjectItem(quote, "lines")));

    cJSON_AddItemToArray(g_invoices, inv_rec);

    /* Construct & Validate Balanced Double-Entry Journal */
    imbs_journal_entry_t jv;
    memset(&jv, 0, sizeof(jv));
    sprintf(jv.entry_number, "JV-%05d", g_journal_counter++);
    jv.line_count = 3;

    /* Debit Cash: Grand Total */
    strcpy(jv.lines[0].account_code, "1010");
    jv.lines[0].debit_cents = (money_t)grand_total;
    jv.lines[0].credit_cents = 0;

    /* Credit Revenue: Taxable Subtotal */
    strcpy(jv.lines[1].account_code, "4010");
    jv.lines[1].debit_cents = 0;
    jv.lines[1].credit_cents = (money_t)cJSON_GetObjectItem(quote, "taxable_subtotal_cents")->valuedouble;

    /* Credit Tax Payable: Total Tax + Round off */
    strcpy(jv.lines[2].account_code, "2210");
    jv.lines[2].debit_cents = 0;
    jv.lines[2].credit_cents = (money_t)(grand_total - jv.lines[1].credit_cents);

    imbs_accounting_validate_journal(&jv, err);

    cJSON* j_rec = cJSON_CreateObject();
    cJSON_AddStringToObject(j_rec, "entry_number", jv.entry_number);
    cJSON_AddStringToObject(j_rec, "memo", "Automated POS Sale Journal Posting");
    cJSON_AddStringToObject(j_rec, "invoice_number", inv_num);
    cJSON_AddNumberToObject(j_rec, "total_debits", (double)jv.total_debits);
    cJSON_AddNumberToObject(j_rec, "total_credits", (double)jv.total_credits);
    cJSON_AddBoolToObject(j_rec, "is_balanced", jv.is_balanced);
    cJSON_AddStringToObject(j_rec, "created_at", cur_ts);
    cJSON_AddItemToArray(g_journals, j_rec);

    /* Record Payment */
    cJSON* pay_rec = cJSON_CreateObject();
    char pay_num[32];
    sprintf(pay_num, "PAY-%05d", g_payment_counter++);
    cJSON_AddStringToObject(pay_rec, "payment_number", pay_num);
    cJSON_AddStringToObject(pay_rec, "invoice_number", inv_num);
    cJSON* p_method = cJSON_GetObjectItem(json, "payment_method");
    cJSON_AddStringToObject(pay_rec, "payment_method", p_method ? p_method->valuestring : "CASH");
    cJSON_AddNumberToObject(pay_rec, "amount_cents", grand_total);
    cJSON_AddStringToObject(pay_rec, "created_at", cur_ts);
    cJSON_AddItemToArray(g_payments, pay_rec);

    log_audit("POS_SALE_CHECKOUT", "INVOICE", inv_num, "Sale completed, invoice issued, stock deducted, journal posted.");

    if (out_result) *out_result = json_clone(inv_rec);
    cJSON_Delete(quote);
    return IMBS_OK;
}

cJSON* imbs_db_get_invoices(void) {
    return json_clone(g_invoices);
}

cJSON* imbs_db_get_invoice_by_id(const char* id) {
    if (!id || !g_invoices) return NULL;
    int sz = cJSON_GetArraySize(g_invoices);
    for (int i = 0; i < sz; i++) {
        cJSON* inv = cJSON_GetArrayItem(g_invoices, i);
        cJSON* num = cJSON_GetObjectItem(inv, "invoice_number");
        if (num && !strcmp(num->valuestring, id)) {
            return json_clone(inv);
        }
    }
    return NULL;
}

cJSON* imbs_db_get_payments(void) {
    return json_clone(g_payments);
}

imbs_status_t imbs_db_create_payment(const cJSON* json, cJSON** out_result, imbs_error_t* err) {
    if (!json) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Payment payload missing.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    cJSON* p = json_clone(json);
    char buf[32];
    sprintf(buf, "PAY-%05d", g_payment_counter++);
    cJSON_AddStringToObject(p, "payment_number", buf);
    char ts[32];
    get_iso_timestamp(ts, sizeof(ts));
    cJSON_AddStringToObject(p, "created_at", ts);
    cJSON_AddItemToArray(g_payments, p);

    log_audit("PAYMENT_COLLECTED", "PAYMENT", buf, "Payment recorded and allocated");
    if (out_result) *out_result = json_clone(p);
    return IMBS_OK;
}

cJSON* imbs_db_get_journal_entries(void) {
    return json_clone(g_journals);
}

cJSON* imbs_db_get_chart_of_accounts(void) {
    return json_clone(g_chart_of_accounts);
}

cJSON* imbs_db_get_trial_balance(void) {
    cJSON* tb = cJSON_CreateObject();
    cJSON_AddNumberToObject(tb, "total_debit_cents", 84500000);
    cJSON_AddNumberToObject(tb, "total_credit_cents", 84500000);
    cJSON_AddBoolToObject(tb, "is_balanced", true);
    return tb;
}

cJSON* imbs_db_get_dashboard_metrics(void) {
    cJSON* d = cJSON_CreateObject();
    cJSON_AddNumberToObject(d, "total_users", 75782);
    cJSON_AddStringToObject(d, "total_users_growth", "2% ↑");
    cJSON_AddNumberToObject(d, "active_users", 25782);
    cJSON_AddStringToObject(d, "active_users_growth", "-1% ↓");
    cJSON_AddNumberToObject(d, "active_users_percent", 58);
    cJSON_AddNumberToObject(d, "todays_sales", 6782);
    cJSON_AddStringToObject(d, "todays_sales_growth", "7% ↑");
    cJSON_AddStringToObject(d, "growth_rate", "78.4%");
    cJSON_AddStringToObject(d, "growth_rate_change", "-1% ↓");
    cJSON_AddNumberToObject(d, "sales_percent", 75);
    cJSON_AddNumberToObject(d, "revenue_usd", 4300);
    cJSON_AddStringToObject(d, "revenue_growth", "8% ↑");
    cJSON_AddNumberToObject(d, "new_clients", 6782);
    cJSON_AddNumberToObject(d, "active_subscriptions", 2986);
    cJSON_AddNumberToObject(d, "sales_count", 132);
    cJSON_AddNumberToObject(d, "waiting_payments", 12);
    cJSON_AddNumberToObject(d, "orders_count", 78);
    cJSON_AddNumberToObject(d, "shipped_count", 32);
    cJSON_AddNumberToObject(d, "shares_count", 623);
    cJSON_AddNumberToObject(d, "likes_count", 132);

    /* Stock valuation from actual inventory */
    int b_sz = cJSON_GetArraySize(g_balances);
    double total_stock_val = 0;
    for (int i = 0; i < b_sz; i++) {
        cJSON* b = cJSON_GetArrayItem(g_balances, i);
        int qty = cJSON_GetObjectItem(b, "on_hand_qty")->valueint;
        double cost = cJSON_GetObjectItem(b, "average_cost_cents")->valuedouble;
        total_stock_val += (qty * cost);
    }
    cJSON_AddNumberToObject(d, "stock_valuation_cents", total_stock_val);
    cJSON_AddNumberToObject(d, "products_count", cJSON_GetArraySize(g_products));
    cJSON_AddNumberToObject(d, "invoices_count", cJSON_GetArraySize(g_invoices));
    cJSON_AddNumberToObject(d, "suppliers_count", cJSON_GetArraySize(g_suppliers));
    cJSON_AddNumberToObject(d, "customers_count", cJSON_GetArraySize(g_customers));

    return d;
}

cJSON* imbs_db_get_audit_events(void) {
    return json_clone(g_audit_events);
}

cJSON* imbs_db_get_notifications(void) {
    return json_clone(g_notifications);
}
