#ifndef IMBS_DB_ADAPTER_H
#define IMBS_DB_ADAPTER_H

#include "../common.h"
#include "../cJSON.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Initialize persistent DB and load seed data */
imbs_status_t imbs_db_init(imbs_error_t* err);
void imbs_db_shutdown(void);

/* Catalog & Products */
cJSON* imbs_db_get_products(void);
cJSON* imbs_db_get_product_by_id(const char* id);
imbs_status_t imbs_db_create_product(const cJSON* json, cJSON** out_result, imbs_error_t* err);

/* Inventory & Balances */
cJSON* imbs_db_get_inventory_balances(void);
cJSON* imbs_db_get_stock_movements(void);
imbs_status_t imbs_db_post_stock_adjustment(const cJSON* json, cJSON** out_result, imbs_error_t* err);
imbs_status_t imbs_db_post_stock_transfer(const cJSON* json, cJSON** out_result, imbs_error_t* err);

/* Procurement & Suppliers */
cJSON* imbs_db_get_suppliers(void);
imbs_status_t imbs_db_create_supplier(const cJSON* json, cJSON** out_result, imbs_error_t* err);
cJSON* imbs_db_get_purchase_orders(void);
imbs_status_t imbs_db_create_purchase_order(const cJSON* json, cJSON** out_result, imbs_error_t* err);
imbs_status_t imbs_db_receive_goods(const cJSON* json, cJSON** out_result, imbs_error_t* err);

/* Customers */
cJSON* imbs_db_get_customers(void);
imbs_status_t imbs_db_create_customer(const cJSON* json, cJSON** out_result, imbs_error_t* err);

/* Sales, Billing & Checkout (Atomic POS Transaction Engine) */
imbs_status_t imbs_db_quote_sale(const cJSON* json, cJSON** out_result, imbs_error_t* err);
imbs_status_t imbs_db_checkout_sale(const cJSON* json, cJSON** out_result, imbs_error_t* err);
cJSON* imbs_db_get_invoices(void);
cJSON* imbs_db_get_invoice_by_id(const char* id);

/* Payments & Allocations */
cJSON* imbs_db_get_payments(void);
imbs_status_t imbs_db_create_payment(const cJSON* json, cJSON** out_result, imbs_error_t* err);

/* Double-Entry Accounting */
cJSON* imbs_db_get_journal_entries(void);
cJSON* imbs_db_get_chart_of_accounts(void);
cJSON* imbs_db_get_trial_balance(void);

/* Reports & Dashboard Aggregates */
cJSON* imbs_db_get_dashboard_metrics(void);
cJSON* imbs_db_get_audit_events(void);
cJSON* imbs_db_get_notifications(void);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DB_ADAPTER_H */

