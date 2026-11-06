#ifndef IMBS_DOMAIN_BILLING_H
#define IMBS_DOMAIN_BILLING_H

#include "../common.h"
#include "tax.h"

#ifdef __cplusplus
extern "C" {
#endif

#define MAX_INVOICE_LINES 64
#define DEFAULT_MAX_DISCOUNT_BP 2000 /* 20.00% without manager override */

typedef struct {
    char product_id[64];
    char sku[64];
    char name[128];
    quantity_t quantity;
    money_t unit_price_cents;
    basis_points_t discount_bp;      /* Line discount e.g. 500 bp = 5.00% */
    imbs_tax_spec_t tax_spec;

    /* Computed outputs */
    money_t gross_amount_cents;
    money_t discount_amount_cents;
    imbs_tax_result_t tax_result;
} imbs_invoice_line_t;

typedef struct {
    char invoice_number[64];
    char customer_id[64];
    char branch_id[64];
    char warehouse_id[64];
    
    imbs_invoice_line_t lines[MAX_INVOICE_LINES];
    size_t line_count;

    basis_points_t invoice_discount_bp;
    bool manager_override_approved;

    /* Computed outputs */
    money_t subtotal_cents;
    money_t total_discount_cents;
    money_t taxable_subtotal_cents;
    money_t total_cgst_cents;
    money_t total_sgst_cents;
    money_t total_igst_cents;
    money_t total_tax_cents;
    money_t round_off_cents;
    money_t grand_total_cents;
    money_t amount_paid_cents;
    money_t balance_due_cents;
} imbs_invoice_t;

imbs_status_t imbs_billing_calculate_invoice(
    imbs_invoice_t* inv,
    basis_points_t max_permitted_discount_bp,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_BILLING_H */

