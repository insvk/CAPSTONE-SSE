#ifndef IMBS_DOMAIN_REPORTING_H
#define IMBS_DOMAIN_REPORTING_H

#include "../common.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char product_id[64];
    char sku[64];
    char name[128];
    quantity_t on_hand_qty;
    money_t average_cost_cents;
    money_t total_valuation_cents;
} imbs_stock_valuation_row_t;

typedef struct {
    money_t total_stock_valuation_cents;
    size_t total_sku_count;
    size_t low_stock_count;
} imbs_inventory_summary_t;

imbs_status_t imbs_reporting_calculate_stock_row(
    quantity_t on_hand,
    money_t average_cost,
    imbs_stock_valuation_row_t* row,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_REPORTING_H */

