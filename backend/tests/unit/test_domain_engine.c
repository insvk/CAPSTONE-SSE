/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS
 * C-First Domain Engine Comprehensive Unit Test Suite
 * ==============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

#include "../../include/common.h"
#include "../../include/domain/uom.h"
#include "../../include/domain/tax.h"
#include "../../include/domain/inventory.h"
#include "../../include/domain/billing.h"
#include "../../include/domain/payments.h"
#include "../../include/domain/accounting.h"
#include "../../include/domain/returns.h"
#include "../../include/domain/procurement.h"
#include "../../include/domain/product.h"
#include "../../include/domain/reporting.h"

static int g_tests_run = 0;
static int g_tests_passed = 0;

#define TEST_ASSERT(cond, msg) do { \
    g_tests_run++; \
    if (cond) { \
        g_tests_passed++; \
        printf("  [PASS] %s\n", msg); \
    } else { \
        printf("  [FAIL] %s (Line %d)\n", msg, __LINE__); \
    } \
} while(0)

/* 1. Test Fixed-Point Arithmetic & Overflow */
static void test_fixed_point_arithmetic(void) {
    printf("\n=== Running Test: Fixed-Point Arithmetic & Overflow ===\n");

    money_t out = 0;
    imbs_status_t status = imbs_safe_add(10050, 20050, &out);
    TEST_ASSERT(status == IMBS_OK && out == 30100, "Safe add: 100.50 + 200.50 = 301.00");

    status = imbs_safe_add(INT64_MAX - 10, 20, &out);
    TEST_ASSERT(status == IMBS_ERR_OVERFLOW, "Safe add overflow detection");

    status = imbs_safe_mul(5000, 4, &out);
    TEST_ASSERT(status == IMBS_OK && out == 20000, "Safe mul: 50.00 * 4 = 200.00");

    status = imbs_safe_mul(INT64_MAX / 2, 3, &out);
    TEST_ASSERT(status == IMBS_ERR_OVERFLOW, "Safe mul overflow detection");

    money_t rounded = imbs_round_div(100, 3);
    TEST_ASSERT(rounded == 33, "Half-up division: 100 / 3 = 33");

    rounded = imbs_round_div(105, 10);
    TEST_ASSERT(rounded == 11, "Half-up division: 105 / 10 = 11");
}

/* 2. Test UOM Conversions */
static void test_uom_conversions(void) {
    printf("\n=== Running Test: Unit of Measure Conversions ===\n");

    imbs_uom_conversion_t box_to_pcs = {
        .from_uom = "BOX",
        .to_uom = "PCS",
        .multiplier = 12,
        .divisor = 1
    };
    quantity_t converted = 0;
    imbs_error_t err;
    imbs_status_t st = imbs_uom_convert(5, &box_to_pcs, &converted, &err);
    TEST_ASSERT(st == IMBS_OK && converted == 60, "Convert 5 BOX to PCS (multiplier 12) = 60 PCS");

    imbs_uom_conversion_t g_to_kg = {
        .from_uom = "G",
        .to_uom = "KG",
        .multiplier = 1,
        .divisor = 1000
    };
    st = imbs_uom_convert(2500, &g_to_kg, &converted, &err);
    TEST_ASSERT(st == IMBS_OK && converted == 3, "Convert 2500 G to KG (divisor 1000 with half-up) = 3 KG");
}

/* 3. Test Tax Engine (GST CGST/SGST/IGST/Inclusive) */
static void test_tax_engine(void) {
    printf("\n=== Running Test: GST Tax Calculation Engine ===\n");

    imbs_tax_spec_t intra_18 = {
        .rate_bp = 1800, /* 18.00% */
        .jurisdiction = IMBS_TAX_INTRA_STATE,
        .is_inclusive = false
    };
    imbs_tax_result_t res;
    imbs_error_t err;

    /* ₹1,000.00 (100000 cents) at 18% Intra-state */
    imbs_status_t st = imbs_tax_calculate_line(100000, &intra_18, &res, &err);
    TEST_ASSERT(st == IMBS_OK, "Tax calculation execution");
    TEST_ASSERT(res.taxable_amount == 100000, "Taxable base = 1000.00");
    TEST_ASSERT(res.total_tax_amount == 18000, "Total GST (18%) = 180.00");
    TEST_ASSERT(res.cgst_amount == 9000 && res.sgst_amount == 9000, "CGST 9% (90.00) & SGST 9% (90.00) split");
    TEST_ASSERT(res.line_total == 118000, "Line Total = 1,180.00");

    /* Inter-state 18% IGST */
    imbs_tax_spec_t inter_18 = {
        .rate_bp = 1800,
        .jurisdiction = IMBS_TAX_INTER_STATE,
        .is_inclusive = false
    };
    st = imbs_tax_calculate_line(100000, &inter_18, &res, &err);
    TEST_ASSERT(res.igst_amount == 18000 && res.cgst_amount == 0 && res.sgst_amount == 0, "IGST 18% full assignment");

    /* Tax-inclusive ₹1,180.00 at 18% */
    imbs_tax_spec_t inclusive_18 = {
        .rate_bp = 1800,
        .jurisdiction = IMBS_TAX_INTRA_STATE,
        .is_inclusive = true
    };
    st = imbs_tax_calculate_line(118000, &inclusive_18, &res, &err);
    TEST_ASSERT(res.taxable_amount == 100000, "Tax-inclusive back-calculation taxable base = 1,000.00");
    TEST_ASSERT(res.total_tax_amount == 18000, "Tax-inclusive back-calculation tax = 180.00");
}

/* 4. Test Inventory Ledger & Weighted Average Costing */
static void test_inventory_ledger(void) {
    printf("\n=== Running Test: Inventory Movements & Costing Policy ===\n");

    imbs_inventory_balance_t balance = {
        .product_id = "PROD-001",
        .warehouse_id = "WH-MAIN",
        .on_hand_qty = 100,
        .reserved_qty = 20,
        .average_cost_cents = 5000 /* ₹50.00 */
    };
    imbs_error_t err;

    /* Availability check */
    imbs_status_t st = imbs_inventory_check_availability(&balance, 70, &err);
    TEST_ASSERT(st == IMBS_OK, "Available check: 100 on hand - 20 reserved >= 70");

    st = imbs_inventory_check_availability(&balance, 85, &err);
    TEST_ASSERT(st == IMBS_ERR_INSUFFICIENT_STOCK, "Availability rejection: 85 requested > 80 unreserved");

    /* Goods Receipt: Inflow of 100 units @ ₹70.00 (7000 cents) */
    imbs_stock_movement_request_t gr_move = {
        .type = IMBS_MOVE_GOODS_RECEIPT,
        .quantity = 100,
        .unit_cost_cents = 7000,
        .reference_doc = "PO-2026-001"
    };
    st = imbs_inventory_apply_movement(&balance, &gr_move, false, &err);
    /* New Avg Cost = (100 * 50 + 100 * 70) / 200 = ₹60.00 (6000 cents) */
    TEST_ASSERT(st == IMBS_OK && balance.on_hand_qty == 200, "Stock balance increased to 200");
    TEST_ASSERT(balance.average_cost_cents == 6000, "Weighted average cost recalculated to 60.00");

    /* Sales Outflow: Issue 50 units */
    imbs_stock_movement_request_t sale_move = {
        .type = IMBS_MOVE_SALE_ISSUE,
        .quantity = 50,
        .unit_cost_cents = 6000,
        .reference_doc = "INV-2026-001"
    };
    st = imbs_inventory_apply_movement(&balance, &sale_move, false, &err);
    TEST_ASSERT(st == IMBS_OK && balance.on_hand_qty == 150, "Stock balance decreased to 150");
    TEST_ASSERT(balance.average_cost_cents == 6000, "Weighted average cost preserved on outflow");

    /* Negative stock policy check */
    imbs_stock_movement_request_t over_issue = {
        .type = IMBS_MOVE_SALE_ISSUE,
        .quantity = 250,
        .unit_cost_cents = 6000,
        .reference_doc = "INV-OVERDRAFT"
    };
    st = imbs_inventory_apply_movement(&balance, &over_issue, false, &err);
    TEST_ASSERT(st == IMBS_ERR_NEGATIVE_STOCK_DISALLOWED, "Negative stock movement rejected by policy");
}

/* 5. Test Billing & POS Invoice Calculation */
static void test_billing_engine(void) {
    printf("\n=== Running Test: Billing & POS Invoice Engine ===\n");

    imbs_invoice_t inv;
    memset(&inv, 0, sizeof(inv));
    strcpy(inv.invoice_number, "INV-2026-9001");
    inv.line_count = 2;
    inv.manager_override_approved = false;

    /* Line 1: 2 units Barcode Scanner @ ₹6,500.00 (650000 cents), 5% discount, 18% GST */
    inv.lines[0].quantity = 2;
    inv.lines[0].unit_price_cents = 650000;
    inv.lines[0].discount_bp = 500; /* 5% */
    inv.lines[0].tax_spec.rate_bp = 1800;
    inv.lines[0].tax_spec.jurisdiction = IMBS_TAX_INTRA_STATE;
    inv.lines[0].tax_spec.is_inclusive = false;

    /* Line 2: 4 units Thermal Paper @ ₹2,500.00 (250000 cents), 0% discount, 12% GST */
    inv.lines[1].quantity = 4;
    inv.lines[1].unit_price_cents = 250000;
    inv.lines[1].discount_bp = 0;
    inv.lines[1].tax_spec.rate_bp = 1200;
    inv.lines[1].tax_spec.jurisdiction = IMBS_TAX_INTRA_STATE;
    inv.lines[1].tax_spec.is_inclusive = false;

    imbs_error_t err;
    imbs_status_t st = imbs_billing_calculate_invoice(&inv, DEFAULT_MAX_DISCOUNT_BP, &err);
    TEST_ASSERT(st == IMBS_OK, "Calculate invoice successfully");
    TEST_ASSERT(inv.subtotal_cents == 2300000, "Invoice subtotal = 23,000.00");
    TEST_ASSERT(inv.total_discount_cents == 65000, "Total discount = 650.00");
    TEST_ASSERT(inv.grand_total_cents > 0, "Grand total calculated");

    /* Unauthorized discount threshold rejection test */
    inv.lines[0].discount_bp = 3500; /* 35% > 20% limit */
    st = imbs_billing_calculate_invoice(&inv, DEFAULT_MAX_DISCOUNT_BP, &err);
    TEST_ASSERT(st == IMBS_ERR_DISCOUNT_LIMIT_EXCEEDED, "Discount limit exceeded without manager override rejected");

    inv.manager_override_approved = true;
    st = imbs_billing_calculate_invoice(&inv, DEFAULT_MAX_DISCOUNT_BP, &err);
    TEST_ASSERT(st == IMBS_OK, "Discount accepted when manager override approved");
}

/* 6. Test Multi-Invoice Payment Allocation */
static void test_payment_allocation(void) {
    printf("\n=== Running Test: Payment Multi-Invoice FIFO Allocation ===\n");

    imbs_payment_allocation_plan_t plan;
    memset(&plan, 0, sizeof(plan));
    strcpy(plan.payment_id, "PAY-2026-001");
    plan.total_payment_cents = 5000000; /* ₹50,000.00 */
    plan.target_count = 3;

    /* Target 1: Due ₹20,000.00 */
    strcpy(plan.targets[0].invoice_id, "INV-001");
    plan.targets[0].invoice_balance_due_cents = 2000000;

    /* Target 2: Due ₹25,000.00 */
    strcpy(plan.targets[1].invoice_id, "INV-002");
    plan.targets[1].invoice_balance_due_cents = 2500000;

    /* Target 3: Due ₹15,000.00 */
    strcpy(plan.targets[2].invoice_id, "INV-003");
    plan.targets[2].invoice_balance_due_cents = 1500000;

    imbs_error_t err;
    imbs_status_t st = imbs_payment_allocate_fifo(&plan, &err);
    TEST_ASSERT(st == IMBS_OK, "FIFO allocation succeeded");
    TEST_ASSERT(plan.targets[0].allocated_cents == 2000000, "Target 1 fully cleared (20,000.00)");
    TEST_ASSERT(plan.targets[1].allocated_cents == 2500000, "Target 2 fully cleared (25,000.00)");
    TEST_ASSERT(plan.targets[2].allocated_cents == 500000, "Target 3 partially cleared with remaining 5,000.00");
    TEST_ASSERT(plan.total_allocated_cents == 5000000, "Total allocated = 50,000.00");
    TEST_ASSERT(plan.unallocated_cents == 0, "Unallocated balance = 0");
}

/* 7. Test Double-Entry Accounting Balances */
static void test_double_entry_accounting(void) {
    printf("\n=== Running Test: Double-Entry Accounting Invariant ===\n");

    imbs_journal_entry_t entry;
    memset(&entry, 0, sizeof(entry));
    strcpy(entry.entry_number, "JV-2026-001");
    entry.line_count = 3;

    /* Debit Cash: ₹11,800.00 */
    strcpy(entry.lines[0].account_code, "1010");
    entry.lines[0].debit_cents = 1180000;
    entry.lines[0].credit_cents = 0;

    /* Credit Revenue: ₹10,000.00 */
    strcpy(entry.lines[1].account_code, "4010");
    entry.lines[1].debit_cents = 0;
    entry.lines[1].credit_cents = 1000000;

    /* Credit GST Payable: ₹1,800.00 */
    strcpy(entry.lines[2].account_code, "2210");
    entry.lines[2].debit_cents = 0;
    entry.lines[2].credit_cents = 180000;

    imbs_error_t err;
    imbs_status_t st = imbs_accounting_validate_journal(&entry, &err);
    TEST_ASSERT(st == IMBS_OK && entry.is_balanced, "Balanced journal (Debits: 11,800 == Credits: 11,800) accepted");

    /* Deliberately unbalance the journal */
    entry.lines[0].debit_cents = 1100000;
    st = imbs_accounting_validate_journal(&entry, &err);
    TEST_ASSERT(st == IMBS_ERR_UNBALANCED_JOURNAL && !entry.is_balanced, "Unbalanced journal strictly rejected");
}

/* 8. Test Sales Returns & Disposition */
static void test_sales_returns(void) {
    printf("\n=== Running Test: Sales Returns & Credit Note Engine ===\n");

    imbs_sales_return_claim_t claim = {
        .original_sold_qty = 10,
        .previously_returned_qty = 2,
        .requested_return_qty = 3,
        .original_unit_price_cents = 100000, /* 1,000.00 */
        .original_discount_bp = 0,
        .tax_spec = {
            .rate_bp = 1800,
            .jurisdiction = IMBS_TAX_INTRA_STATE,
            .is_inclusive = false
        },
        .disposition = IMBS_RETURN_RESTOCK
    };
    imbs_error_t err;
    imbs_status_t st = imbs_returns_evaluate_claim(&claim, &err);
    TEST_ASSERT(st == IMBS_OK, "Eligible return claim approved");
    TEST_ASSERT(claim.total_credit_note_cents == 354000, "Credit note total = 3,540.00 (3 * 1,000 + 18% GST)");
    TEST_ASSERT(claim.should_increment_sellable_stock == true, "Restock disposition marks stock for re-entry");

    /* Exceeds sold quantity check */
    claim.requested_return_qty = 9; /* 2 prev + 9 req = 11 > 10 orig */
    st = imbs_returns_evaluate_claim(&claim, &err);
    TEST_ASSERT(st == IMBS_ERR_RETURN_EXCEEDS_SOLD_QTY, "Return claim exceeding net sold quantity rejected");
}

int main(void) {
    printf("==============================================================================\n");
    printf("CSA0201-B-CAPSTONE-IMBS :: C-First Domain Engine Test Suite\n");
    printf("==============================================================================\n");

    test_fixed_point_arithmetic();
    test_uom_conversions();
    test_tax_engine();
    test_inventory_ledger();
    test_billing_engine();
    test_payment_allocation();
    test_double_entry_accounting();
    test_sales_returns();

    printf("\n==============================================================================\n");
    printf("TEST RESULTS: %d / %d tests PASSED (%.1f%%)\n",
           g_tests_passed, g_tests_run, (float)g_tests_passed * 100.0f / (float)g_tests_run);
    printf("==============================================================================\n");

    return (g_tests_run == g_tests_passed) ? 0 : 1;
}

