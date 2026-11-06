/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS
 * Main C Backend Server Entrypoint
 * ==============================================================================
 */

#include "../include/config.h"
#include "../include/common.h"
#include "../include/db/db_adapter.h"
#include "../include/http_server.h"

#include <stdio.h>
#include <stdlib.h>

int main(int argc, char* argv[]) {
    (void)argc;
    (void)argv;
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    printf("\n");
    printf("   ____ ____    _    ___ ___   ___  _         ____        ____  ____  ____  \n");
    printf("  / ___/ ___|  / \\  / _ \\_ _| / _ \\/ |       | __ )      |  _ \\|  _ \\|  _ \\ \n");
    printf(" | |   \\___ \\ / _ \\| | | | | | | | | | _____ |  _ \\ _____| |_) | |_) | | | |\n");
    printf(" | |___ ___) / ___ \\ |_| | | | |_| | ||_____|| |_) |_____|  __/|  _ <| |_| |\n");
    printf("  \\____|____/_/   \\_\\___/___| \\___/|_|       |____/      |_|   |_| \\_\\____/ \n");
    printf("                                                                            \n");
    printf("  [CAPSTONE] Inventory Management & Billing System (C-First Native Backend)  \n");
    printf("  Standard: ISO/IEC 9899:2018 (C17) | Persistence: PostgreSQL / Supabase   \n");
    printf("==============================================================================\n");

    imbs_config_t cfg;
    imbs_config_load_from_env(&cfg);

    imbs_error_t err;
    if (imbs_db_init(&err) != IMBS_OK) {
        printf("[FATAL] Failed to initialize database adapter: %s\n", err.message);
        return 1;
    }
    printf("[INFO] Database adapter initialized with authoritative schemas and master seeds.\n");

    int exit_code = imbs_http_server_run(&cfg);

    imbs_db_shutdown();
    return exit_code;
}
