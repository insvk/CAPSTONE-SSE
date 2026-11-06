#include "../include/config.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

void imbs_config_load_defaults(imbs_config_t* cfg) {
    if (!cfg) return;
    memset(cfg, 0, sizeof(imbs_config_t));
    strcpy(cfg->app_name, "CSA0201-B-CAPSTONE-IMBS");
    strcpy(cfg->app_env, "development");
    cfg->port = 8080;
    strcpy(cfg->host, "0.0.0.0");
    strcpy(cfg->database_url, "postgresql://localhost:5432/imbs");
    strcpy(cfg->supabase_url, "");
    strcpy(cfg->jwt_secret, "capstone-c-secret-key-2026");
    cfg->token_expiry_seconds = 86400;
    strcpy(cfg->cors_origins, "*");
}

void imbs_config_load_from_env(imbs_config_t* cfg) {
    imbs_config_load_defaults(cfg);

    const char* val = getenv("APP_PORT");
    if (val && *val) cfg->port = atoi(val);

    val = getenv("APP_HOST");
    if (val && *val) strncpy(cfg->host, val, sizeof(cfg->host) - 1);

    val = getenv("APP_ENV");
    if (val && *val) strncpy(cfg->app_env, val, sizeof(cfg->app_env) - 1);

    val = getenv("DATABASE_URL");
    if (val && *val) strncpy(cfg->database_url, val, sizeof(cfg->database_url) - 1);

    val = getenv("SUPABASE_URL");
    if (val && *val) strncpy(cfg->supabase_url, val, sizeof(cfg->supabase_url) - 1);

    val = getenv("JWT_SECRET");
    if (val && *val) strncpy(cfg->jwt_secret, val, sizeof(cfg->jwt_secret) - 1);
}

