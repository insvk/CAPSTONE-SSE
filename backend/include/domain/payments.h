#ifndef IMBS_DOMAIN_PAYMENTS_H
#define IMBS_DOMAIN_PAYMENTS_H

#include "../common.h"

#ifdef __cplusplus
extern "C" {
#endif

#define MAX_ALLOCATION_TARGETS 32

typedef struct {
    char invoice_id[64];
    money_t invoice_balance_due_cents;
    money_t allocated_cents; /* Output */
} imbs_payment_target_invoice_t;

typedef struct {
    char payment_id[64];
    money_t total_payment_cents;
    imbs_payment_target_invoice_t targets[MAX_ALLOCATION_TARGETS];
    size_t target_count;

    /* Output */
    money_t total_allocated_cents;
    money_t unallocated_cents;
} imbs_payment_allocation_plan_t;

imbs_status_t imbs_payment_allocate_fifo(
    imbs_payment_allocation_plan_t* plan,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_PAYMENTS_H */

