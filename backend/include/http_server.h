#ifndef IMBS_HTTP_SERVER_H
#define IMBS_HTTP_SERVER_H

#include "config.h"
#include "common.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Start the native HTTP server loop */
int imbs_http_server_run(const imbs_config_t* cfg);

/* Stop the server */
void imbs_http_server_stop(void);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_HTTP_SERVER_H */

