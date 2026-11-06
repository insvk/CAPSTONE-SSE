#include "../../include/domain/tax.h"

imbs_status_t imbs_tax_calculate_line(
    money_t line_amount,
    const imbs_tax_spec_t* spec,
    imbs_tax_result_t* result,
    imbs_error_t* err
) {
    if (!spec || !result) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Null pointer passed to tax calculation.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (line_amount < 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Line amount cannot be negative.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    if (spec->jurisdiction == IMBS_TAX_EXEMPT || spec->rate_bp == 0) {
        result->taxable_amount = line_amount;
        result->cgst_amount = 0;
        result->sgst_amount = 0;
        result->igst_amount = 0;
        result->total_tax_amount = 0;
        result->line_total = line_amount;
        return IMBS_OK;
    }

    money_t taxable = 0;
    money_t total_tax = 0;

    if (spec->is_inclusive) {
        /*
         * Tax-Inclusive:
         * Taxable = (LineAmount * 10000) / (10000 + RateBP)
         */
        int64_t den = BP_SCALE + spec->rate_bp;
        taxable = imbs_round_div(line_amount * BP_SCALE, den);
        total_tax = line_amount - taxable;
    } else {
        /*
         * Tax-Exclusive:
         * Taxable = LineAmount
         * Tax = (Taxable * RateBP) / 10000
         */
        taxable = line_amount;
        total_tax = imbs_round_div(taxable * spec->rate_bp, BP_SCALE);
    }

    result->taxable_amount = taxable;
    result->total_tax_amount = total_tax;

    if (spec->jurisdiction == IMBS_TAX_INTRA_STATE) {
        /* Split equally between CGST and SGST */
        money_t half_tax = total_tax / 2;
        result->cgst_amount = half_tax;
        result->sgst_amount = total_tax - half_tax; /* Preserves penny balance */
        result->igst_amount = 0;
    } else {
        result->cgst_amount = 0;
        result->sgst_amount = 0;
        result->igst_amount = total_tax;
    }

    result->line_total = taxable + total_tax;
    return IMBS_OK;
}

