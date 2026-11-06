#ifndef IMBS_DOMAIN_UOM_H
#define IMBS_DOMAIN_UOM_H

#include "../common.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char code[16];
    char name[64];
    bool is_fractional;
    int precision;
} imbs_uom_t;

typedef struct {
    char from_uom[16];
    char to_uom[16];
    int64_t multiplier;
    int64_t divisor;
} imbs_uom_conversion_t;

imbs_status_t imbs_uom_convert(
    quantity_t in_qty,
    const imbs_uom_conversion_t* conv,
    quantity_t* out_qty,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_UOM_H */

