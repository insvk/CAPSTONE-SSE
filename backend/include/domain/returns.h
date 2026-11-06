#ifndef IMBS_DOMAIN_RETURNS_H
#define IMBS_DOMAIN_RETURNS_H

#include "../common.h"
#include "tax.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    IMBS_RETURN_RESTOCK = 0,
    IMBS_RETURN_QUARANTINE = 1,
    IMBS_RETURN_SCRAP = 2
} imbs_return_disposition_t;

typedef struct {
    char invoice_id[64];
    char product_id[64];
    quantity_t original_sold_qty;
    quantity_t previously_returned_qty;
    quantity_t requested_return_qty;
    money_t original_unit_price_cents;
    basis_points_t original_discount_bp;
    imbs_tax_spec_t tax_spec;
    imbs_return_disposition_t disposition;

    /* Computed outputs */
    money_t refund_taxable_cents;
    money_t refund_tax_cents;
    money_t total_credit_note_cents;
    bool should_increment_sellable_stock;
} imbs_sales_return_claim_t;

imbs_status_t imbs_returns_evaluate_claim(
    imbs_sales_return_claim_t* claim,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_RETURNS_H */

