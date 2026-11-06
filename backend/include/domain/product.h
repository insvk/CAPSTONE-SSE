#ifndef IMBS_DOMAIN_PRODUCT_H
#define IMBS_DOMAIN_PRODUCT_H

#include "../common.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char id[64];
    char sku[64];
    char barcode[64];
    char name[128];
    money_t purchase_price_cents;
    money_t selling_price_cents;
    basis_points_t tax_rate_bp;
    quantity_t reorder_point;
    bool track_inventory;
    bool is_active;
} imbs_product_t;

imbs_status_t imbs_product_validate(
    const imbs_product_t* product,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_PRODUCT_H */

