#ifndef IMBS_DOMAIN_PROCUREMENT_H
#define IMBS_DOMAIN_PROCUREMENT_H

#include "../common.h"
#include "tax.h"

#ifdef __cplusplus
extern "C" {
#endif

#define MAX_PO_LINES 64

typedef struct {
    char product_id[64];
    quantity_t ordered_qty;
    quantity_t received_qty;
    money_t unit_price_cents;
    imbs_tax_spec_t tax_spec;

    /* Computed */
    money_t subtotal_cents;
    money_t tax_cents;
    money_t line_total_cents;
} imbs_po_line_t;

typedef struct {
    char po_number[64];
    char supplier_id[64];
    imbs_po_line_t lines[MAX_PO_LINES];
    size_t line_count;

    money_t grand_total_cents;
    bool is_fully_received;
} imbs_purchase_order_t;

imbs_status_t imbs_procurement_calculate_po(
    imbs_purchase_order_t* po,
    imbs_error_t* err
);

imbs_status_t imbs_procurement_process_receipt(
    imbs_purchase_order_t* po,
    size_t line_index,
    quantity_t receiving_qty,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_PROCUREMENT_H */

