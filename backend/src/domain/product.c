#include "../../include/domain/product.h"
#include <string.h>

imbs_status_t imbs_product_validate(
    const imbs_product_t* product,
    imbs_error_t* err
) {
    if (!product) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Product pointer is null.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (strlen(product->sku) == 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Product SKU is required.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (strlen(product->name) == 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Product Name is required.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (product->selling_price_cents < 0 || product->purchase_price_cents < 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Product prices cannot be negative.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (product->reorder_point < 0) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Reorder point cannot be negative.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    return IMBS_OK;
}

