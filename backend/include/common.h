/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS
 * Common Type Definitions, Error Codes, and Fixed-Point Arithmetic Core
 * ==============================================================================
 */

#ifndef IMBS_COMMON_H
#define IMBS_COMMON_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Monetary values are strictly stored as 64-bit signed integers in minor units
 * (e.g. 1 INR = 100 Paise, 1 USD = 100 Cents).
 * Binary floating point (float/double) is strictly prohibited for money calculations.
 */
typedef int64_t money_t;

/* Quantity is strictly an integer */
typedef int32_t quantity_t;

/*
 * Percentages are expressed in Basis Points (1% = 100 bp, 18% = 1800 bp).
 * This eliminates floating-point rounding divergence.
 */
typedef int32_t basis_points_t;

#define BP_SCALE 10000
#define BP_ONE_PERCENT 100

/* Result / Status Codes */
typedef enum {
    IMBS_OK = 0,
    IMBS_ERR_INVALID_ARGUMENT = 1,
    IMBS_ERR_OVERFLOW = 2,
    IMBS_ERR_INSUFFICIENT_STOCK = 3,
    IMBS_ERR_NEGATIVE_STOCK_DISALLOWED = 4,
    IMBS_ERR_DISCOUNT_LIMIT_EXCEEDED = 5,
    IMBS_ERR_UNBALANCED_JOURNAL = 6,
    IMBS_ERR_ALLOCATION_EXCEEDS_PAYMENT = 7,
    IMBS_ERR_RETURN_EXCEEDS_SOLD_QTY = 8,
    IMBS_ERR_INVALID_UOM_CONVERSION = 9,
    IMBS_ERR_NOT_FOUND = 10,
    IMBS_ERR_UNAUTHORIZED = 11,
    IMBS_ERR_DUPLICATE_KEY = 12,
    IMBS_ERR_INTERNAL = 99
} imbs_status_t;

/* Error Envelope */
typedef struct {
    imbs_status_t code;
    char message[256];
} imbs_error_t;

static inline void imbs_error_set(imbs_error_t* err, imbs_status_t code, const char* msg) {
    if (err) {
        err->code = code;
        if (msg) {
            size_t i = 0;
            while (msg[i] != '\0' && i < 255) {
                err->message[i] = msg[i];
                i++;
            }
            err->message[i] = '\0';
        } else {
            err->message[0] = '\0';
        }
    }
}

/*
 * Safe Integer Arithmetic Helpers with Overflow Protection
 */
static inline imbs_status_t imbs_safe_add(money_t a, money_t b, money_t* out) {
    if ((b > 0 && a > INT64_MAX - b) || (b < 0 && a < INT64_MIN - b)) {
        return IMBS_ERR_OVERFLOW;
    }
    *out = a + b;
    return IMBS_OK;
}

static inline imbs_status_t imbs_safe_sub(money_t a, money_t b, money_t* out) {
    if ((b < 0 && a > INT64_MAX + b) || (b > 0 && a < INT64_MIN + b)) {
        return IMBS_ERR_OVERFLOW;
    }
    *out = a - b;
    return IMBS_OK;
}

static inline imbs_status_t imbs_safe_mul(money_t a, int64_t b, money_t* out) {
    if (a > 0) {
        if (b > 0) {
            if (a > (INT64_MAX / b)) return IMBS_ERR_OVERFLOW;
        } else {
            if (b < (INT64_MIN / a)) return IMBS_ERR_OVERFLOW;
        }
    } else {
        if (b > 0) {
            if (a < (INT64_MIN / b)) return IMBS_ERR_OVERFLOW;
        } else {
            if (a != 0 && b < (INT64_MAX / a)) return IMBS_ERR_OVERFLOW;
        }
    }
    *out = a * b;
    return IMBS_OK;
}

/*
 * Round half-up integer division: (numerator + denominator/2) / denominator
 */
static inline money_t imbs_round_div(int64_t num, int64_t den) {
    if (den == 0) return 0;
    if (num >= 0) {
        return (num + (den / 2)) / den;
    } else {
        return (num - (den / 2)) / den;
    }
}

#ifdef __cplusplus
}
#endif

#endif /* IMBS_COMMON_H */

