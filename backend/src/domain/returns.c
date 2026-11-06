#include "../../include/domain/returns.h"

imbs_status_t imbs_returns_evaluate_claim(
    imbs_sales_return_claim_t* claim,
    imbs_error_t* err
) {
    if (!claim) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Sales return claim is null.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (claim->requested_return_qty <= 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Return quantity must be positive.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    quantity_t max_eligible = claim->original_sold_qty - claim->previously_returned_qty;
    if (claim->requested_return_qty > max_eligible) {
        imbs_error_set(err, IMBS_ERR_RETURN_EXCEEDS_SOLD_QTY, 
            "Requested return quantity exceeds original net invoiced quantity.");
        return IMBS_ERR_RETURN_EXCEEDS_SOLD_QTY;
    }

    /* Compute original discounted unit price */
    money_t line_gross = claim->original_unit_price_cents * claim->requested_return_qty;
    money_t line_discount = imbs_round_div(line_gross * claim->original_discount_bp, BP_SCALE);
    money_t line_net = line_gross - line_discount;

    imbs_tax_result_t tax_res;
    imbs_status_t status = imbs_tax_calculate_line(line_net, &claim->tax_spec, &tax_res, err);
    if (status != IMBS_OK) {
        return status;
    }

    claim->refund_taxable_cents = tax_res.taxable_amount;
    claim->refund_tax_cents = tax_res.total_tax_amount;
    claim->total_credit_note_cents = tax_res.line_total;

    /* Sellable stock incremented only if disposition is RESTOCK */
    claim->should_increment_sellable_stock = (claim->disposition == IMBS_RETURN_RESTOCK);

    return IMBS_OK;
}

