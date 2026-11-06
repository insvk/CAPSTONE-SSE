#ifndef IMBS_DOMAIN_INVENTORY_H
#define IMBS_DOMAIN_INVENTORY_H

#include "../common.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    IMBS_MOVE_OPENING = 1,
    IMBS_MOVE_GOODS_RECEIPT = 2,
    IMBS_MOVE_SALE_ISSUE = 3,
    IMBS_MOVE_TRANSFER_OUT = 4,
    IMBS_MOVE_TRANSFER_IN = 5,
    IMBS_MOVE_ADJUST_ADD = 6,
    IMBS_MOVE_ADJUST_SUB = 7,
    IMBS_MOVE_RETURN_RESTOCK = 8
} imbs_movement_type_t;

typedef struct {
    char product_id[64];
    char warehouse_id[64];
    quantity_t on_hand_qty;
    quantity_t reserved_qty;
    money_t average_cost_cents;
} imbs_inventory_balance_t;

typedef struct {
    imbs_movement_type_t type;
    char product_id[64];
    char source_warehouse_id[64];
    char dest_warehouse_id[64];
    quantity_t quantity;
    money_t unit_cost_cents;
    char reference_doc[64];
} imbs_stock_movement_request_t;

/* Check if warehouse has sufficient unreserved stock */
imbs_status_t imbs_inventory_check_availability(
    const imbs_inventory_balance_t* balance,
    quantity_t requested_qty,
    imbs_error_t* err
);

/* Compute new balance and weighted-average cost after movement */
imbs_status_t imbs_inventory_apply_movement(
    imbs_inventory_balance_t* current_balance,
    const imbs_stock_movement_request_t* req,
    bool allow_negative_stock,
    imbs_error_t* err
);

/* Compute reorder need */
bool imbs_inventory_needs_reorder(
    quantity_t on_hand,
    quantity_t reserved,
    quantity_t reorder_point
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_INVENTORY_H */

