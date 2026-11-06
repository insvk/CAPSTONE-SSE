#ifndef IMBS_CONFIG_H
#define IMBS_CONFIG_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char app_name[64];
    char app_env[32];
    int port;
    char host[64];
    char database_url[256];
    char supabase_url[256];
    char jwt_secret[128];
    int token_expiry_seconds;
    char cors_origins[256];
} imbs_config_t;

void imbs_config_load_defaults(imbs_config_t* cfg);
void imbs_config_load_from_env(imbs_config_t* cfg);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_CONFIG_H */

