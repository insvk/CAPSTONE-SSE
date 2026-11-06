#include "../../include/domain/procurement.h"

imbs_status_t imbs_procurement_calculate_po(
    imbs_purchase_order_t* po,
    imbs_error_t* err
) {
    if (!po) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "PO pointer is null.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (po->line_count == 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "PO must contain at least one line.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    money_t total = 0;
    bool all_received = true;

    for (size_t i = 0; i < po->line_count; i++) {
        imbs_po_line_t* line = &po->lines[i];
        if (line->ordered_qty <= 0) {
            imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Ordered quantity must be positive.");
            return IMBS_ERR_INVALID_ARGUMENT;
        }

        money_t subtotal = line->ordered_qty * line->unit_price_cents;
        imbs_tax_result_t t_res;
        imbs_status_t status = imbs_tax_calculate_line(subtotal, &line->tax_spec, &t_res, err);
        if (status != IMBS_OK) return status;

        line->subtotal_cents = subtotal;
        line->tax_cents = t_res.total_tax_amount;
        line->line_total_cents = t_res.line_total;

        total += line->line_total_cents;

        if (line->received_qty < line->ordered_qty) {
            all_received = false;
        }
    }

    po->grand_total_cents = total;
    po->is_fully_received = all_received;
    return IMBS_OK;
}

imbs_status_t imbs_procurement_process_receipt(
    imbs_purchase_order_t* po,
    size_t line_index,
    quantity_t receiving_qty,
    imbs_error_t* err
) {
    if (!po || line_index >= po->line_count) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Invalid line index for receipt.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (receiving_qty <= 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Receipt quantity must be positive.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    imbs_po_line_t* line = &po->lines[line_index];
    quantity_t unreceived = line->ordered_qty - line->received_qty;

    if (receiving_qty > unreceived) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Received quantity exceeds remaining unreceived ordered quantity.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    line->received_qty += receiving_qty;
    return imbs_procurement_calculate_po(po, err);
}
