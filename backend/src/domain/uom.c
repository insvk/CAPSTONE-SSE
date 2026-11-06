#include "../../include/domain/uom.h"

imbs_status_t imbs_uom_convert(
    quantity_t in_qty,
    const imbs_uom_conversion_t* conv,
    quantity_t* out_qty,
    imbs_error_t* err
) {
    if (!conv || !out_qty) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Null pointer passed to UOM conversion.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (conv->divisor <= 0 || conv->multiplier <= 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_UOM_CONVERSION, "Conversion multiplier and divisor must be > 0.");
        return IMBS_ERR_INVALID_UOM_CONVERSION;
    }

    int64_t scaled = (int64_t)in_qty * conv->multiplier;
    int64_t converted = (scaled + (conv->divisor / 2)) / conv->divisor;

    if (converted > INT32_MAX || converted < INT32_MIN) {
        imbs_error_set(err, IMBS_ERR_OVERFLOW, "Converted quantity overflowed 32-bit integer.");
        return IMBS_ERR_OVERFLOW;
    }

    *out_qty = (quantity_t)converted;
    return IMBS_OK;
}

