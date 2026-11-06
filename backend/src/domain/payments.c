#include "../../include/domain/payments.h"

imbs_status_t imbs_payment_allocate_fifo(
    imbs_payment_allocation_plan_t* plan,
    imbs_error_t* err
) {
    if (!plan) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Payment allocation plan is null.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (plan->total_payment_cents <= 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Payment amount must be greater than zero.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    money_t remaining_payment = plan->total_payment_cents;
    money_t total_allocated = 0;

    for (size_t i = 0; i < plan->target_count; i++) {
        imbs_payment_target_invoice_t* target = &plan->targets[i];
        target->allocated_cents = 0;

        if (target->invoice_balance_due_cents <= 0) {
            continue;
        }

        if (remaining_payment <= 0) {
            break;
        }

        money_t to_allocate = (remaining_payment >= target->invoice_balance_due_cents)
            ? target->invoice_balance_due_cents
            : remaining_payment;

        target->allocated_cents = to_allocate;
        total_allocated += to_allocate;
        remaining_payment -= to_allocate;
    }

    plan->total_allocated_cents = total_allocated;
    plan->unallocated_cents = remaining_payment;

    return IMBS_OK;
}

