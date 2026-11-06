#include "../../include/domain/billing.h"

imbs_status_t imbs_billing_calculate_invoice(
    imbs_invoice_t* inv,
    basis_points_t max_permitted_discount_bp,
    imbs_error_t* err
) {
    if (!inv) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Invoice pointer is null.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (inv->line_count == 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Invoice must contain at least one line item.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (inv->line_count > MAX_INVOICE_LINES) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Line count exceeds maximum capacity.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    /* Reset running totals */
    inv->subtotal_cents = 0;
    inv->total_discount_cents = 0;
    inv->taxable_subtotal_cents = 0;
    inv->total_cgst_cents = 0;
    inv->total_sgst_cents = 0;
    inv->total_igst_cents = 0;
    inv->total_tax_cents = 0;

    for (size_t i = 0; i < inv->line_count; i++) {
        imbs_invoice_line_t* line = &inv->lines[i];

        if (line->quantity <= 0) {
            imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Line item quantity must be positive.");
            return IMBS_ERR_INVALID_ARGUMENT;
        }
        if (line->unit_price_cents < 0) {
            imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Unit price cannot be negative.");
            return IMBS_ERR_INVALID_ARGUMENT;
        }

        /* Check discount authorization threshold */
        if (line->discount_bp > max_permitted_discount_bp && !inv->manager_override_approved) {
            imbs_error_set(err, IMBS_ERR_DISCOUNT_LIMIT_EXCEEDED, 
                "Line discount exceeds cashier limit and requires manager approval override.");
            return IMBS_ERR_DISCOUNT_LIMIT_EXCEEDED;
        }

        /* 1. Gross line amount */
        money_t gross = 0;
        if (imbs_safe_mul(line->unit_price_cents, line->quantity, &gross) != IMBS_OK) {
            imbs_error_set(err, IMBS_ERR_OVERFLOW, "Gross amount arithmetic overflow.");
            return IMBS_ERR_OVERFLOW;
        }
        line->gross_amount_cents = gross;

        /* 2. Line discount amount */
        money_t discount = imbs_round_div(gross * line->discount_bp, BP_SCALE);
        line->discount_amount_cents = discount;

        /* 3. Net amount before tax */
        money_t net = gross - discount;

        /* 4. Tax calculation */
        imbs_status_t t_res = imbs_tax_calculate_line(net, &line->tax_spec, &line->tax_result, err);
        if (t_res != IMBS_OK) {
            return t_res;
        }

        /* 5. Accumulate invoice aggregates */
        inv->subtotal_cents += gross;
        inv->total_discount_cents += discount;
        inv->taxable_subtotal_cents += line->tax_result.taxable_amount;
        inv->total_cgst_cents += line->tax_result.cgst_amount;
        inv->total_sgst_cents += line->tax_result.sgst_amount;
        inv->total_igst_cents += line->tax_result.igst_amount;
        inv->total_tax_cents += line->tax_result.total_tax_amount;
    }

    /* Apply optional invoice-level discount */
    if (inv->invoice_discount_bp > 0) {
        if (inv->invoice_discount_bp > max_permitted_discount_bp && !inv->manager_override_approved) {
            imbs_error_set(err, IMBS_ERR_DISCOUNT_LIMIT_EXCEEDED, "Invoice-level discount exceeds authorized threshold.");
            return IMBS_ERR_DISCOUNT_LIMIT_EXCEEDED;
        }
        money_t inv_disc = imbs_round_div(inv->taxable_subtotal_cents * inv->invoice_discount_bp, BP_SCALE);
        inv->total_discount_cents += inv_disc;
        inv->taxable_subtotal_cents -= inv_disc;
    }

    /* Unrounded total = taxable subtotal + total tax */
    money_t unrounded_total = inv->taxable_subtotal_cents + inv->total_tax_cents;

    /*
     * Round-off to nearest integer monetary unit (nearest 100 paise / cents)
     */
    money_t rounded_total = ((unrounded_total + 50) / 100) * 100;
    inv->round_off_cents = rounded_total - unrounded_total;
    inv->grand_total_cents = rounded_total;

    /* Compute outstanding balance */
    if (inv->amount_paid_cents > inv->grand_total_cents) {
        inv->amount_paid_cents = inv->grand_total_cents;
    }
    inv->balance_due_cents = inv->grand_total_cents - inv->amount_paid_cents;

    return IMBS_OK;
}

