#ifndef IMBS_DOMAIN_TAX_H
#define IMBS_DOMAIN_TAX_H

#include "../common.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    IMBS_TAX_INTRA_STATE = 0, /* CGST + SGST (split equally) */
    IMBS_TAX_INTER_STATE = 1, /* IGST */
    IMBS_TAX_EXEMPT = 2       /* 0% tax */
} imbs_tax_jurisdiction_t;

typedef struct {
    basis_points_t rate_bp;         /* e.g. 1800 bp = 18.00% */
    imbs_tax_jurisdiction_t jurisdiction;
    bool is_inclusive;
} imbs_tax_spec_t;

typedef struct {
    money_t taxable_amount;
    money_t cgst_amount;
    money_t sgst_amount;
    money_t igst_amount;
    money_t total_tax_amount;
    money_t line_total;
} imbs_tax_result_t;

imbs_status_t imbs_tax_calculate_line(
    money_t line_amount,            /* After line discount */
    const imbs_tax_spec_t* spec,
    imbs_tax_result_t* result,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_TAX_H */

