#include "../../include/domain/inventory.h"

imbs_status_t imbs_inventory_check_availability(
    const imbs_inventory_balance_t* balance,
    quantity_t requested_qty,
    imbs_error_t* err
) {
    if (!balance) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Balance record is null.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (requested_qty <= 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Requested quantity must be positive.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    quantity_t available = balance->on_hand_qty - balance->reserved_qty;
    if (available < requested_qty) {
        imbs_error_set(err, IMBS_ERR_INSUFFICIENT_STOCK, "Insufficient available stock on hand.");
        return IMBS_ERR_INSUFFICIENT_STOCK;
    }

    return IMBS_OK;
}

imbs_status_t imbs_inventory_apply_movement(
    imbs_inventory_balance_t* current_balance,
    const imbs_stock_movement_request_t* req,
    bool allow_negative_stock,
    imbs_error_t* err
) {
    if (!current_balance || !req) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Invalid arguments passed to inventory movement.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (req->quantity <= 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Movement quantity must be greater than zero.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    bool is_inflow = (
        req->type == IMBS_MOVE_OPENING ||
        req->type == IMBS_MOVE_GOODS_RECEIPT ||
        req->type == IMBS_MOVE_TRANSFER_IN ||
        req->type == IMBS_MOVE_ADJUST_ADD ||
        req->type == IMBS_MOVE_RETURN_RESTOCK
    );

    if (is_inflow) {
        /*
         * Inflow: Calculate new Weighted Average Cost
         * NewAvgCost = (OldQty * OldCost + NewQty * NewCost) / (OldQty + NewQty)
         */
        int64_t old_total_val = (int64_t)current_balance->on_hand_qty * current_balance->average_cost_cents;
        if (old_total_val < 0) old_total_val = 0;

        int64_t new_inflow_val = (int64_t)req->quantity * req->unit_cost_cents;
        int64_t total_val = old_total_val + new_inflow_val;
        int64_t new_qty = (int64_t)current_balance->on_hand_qty + req->quantity;

        if (new_qty > 0) {
            current_balance->average_cost_cents = (money_t)(total_val / new_qty);
        }
        current_balance->on_hand_qty = (quantity_t)new_qty;
    } else {
        /*
         * Outflow: Check negative stock bounds
         */
        if (!allow_negative_stock && current_balance->on_hand_qty < req->quantity) {
            imbs_error_set(err, IMBS_ERR_NEGATIVE_STOCK_DISALLOWED, "Movement rejected: Negative stock is disallowed by policy.");
            return IMBS_ERR_NEGATIVE_STOCK_DISALLOWED;
        }

        current_balance->on_hand_qty -= req->quantity;
        /* Average cost remains unchanged on outflow under weighted-average policy */
    }

    return IMBS_OK;
}

bool imbs_inventory_needs_reorder(
    quantity_t on_hand,
    quantity_t reserved,
    quantity_t reorder_point
) {
    quantity_t effective_stock = on_hand - reserved;
    return effective_stock <= reorder_point;
}

