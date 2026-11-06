#include "../../include/domain/reporting.h"

imbs_status_t imbs_reporting_calculate_stock_row(
    quantity_t on_hand,
    money_t average_cost,
    imbs_stock_valuation_row_t* row,
    imbs_error_t* err
) {
    if (!row) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Row pointer is null.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    row->on_hand_qty = on_hand;
    row->average_cost_cents = average_cost;

    money_t total_val = 0;
    if (imbs_safe_mul(average_cost, on_hand, &total_val) != IMBS_OK) {
        imbs_error_set(err, IMBS_ERR_OVERFLOW, "Valuation multiplication overflow.");
        return IMBS_ERR_OVERFLOW;
    }

    row->total_valuation_cents = total_val;
    return IMBS_OK;
}

