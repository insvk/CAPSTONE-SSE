# REST API Specification: CSA0201-B-CAPSTONE-IMBS

**Project Title:** High-Performance Enterprise Inventory Management & Billing System  
**Canonical Identity:** `CSA0201-B-CAPSTONE-IMBS`  
**API Version:** `v1`  
**Protocol:** HTTP/1.1 REST  
**Data Serialization:** JSON (ANSI C `cJSON` parser)  
**Revision:** Version 1.0 (Academic Capstone Defense Edition)

---

## 1. Global Conventions & Standards

### 1.1. Base URL
All API requests must target the `/api/v1` namespace:
```
http://127.0.0.1:8080/api/v1
```

### 1.2. Currency & Number Serialization
- **Financial Minor Units:** All monetary values (`selling_price`, `subtotal`, `grand_total`, `tax_amount`, `debit_amount`) are represented as integer minor units (paise / cents). For example, ₹1,250.75 is sent as `125075`.
- **Basis Points:** All tax rates, discounts, and percentage parameters are represented as integer basis points where $10000 = 100.00\%$. For example, 18% GST is `1800`, and a 5% discount is `500`.

### 1.3. Standard Response Wrapper & Errors
Success responses return raw JSON objects or lists with appropriate HTTP status codes (`200 OK`, `201 Created`).  
Failure responses return a structured JSON error body:
```json
{
  "error": "Human readable error description",
  "error_code": -1004
}
```

Common Error Codes:
- `0`: `IMBS_OK` (Success)
- `-1001`: `IMBS_ERR_INVALID_ARGUMENT`
- `-1002`: `IMBS_ERR_OVERFLOW` (Arithmetic overflow detected)
- `-1003`: `IMBS_ERR_DIVISION_BY_ZERO`
- `-1004`: `IMBS_ERR_STOCK_UNAVAILABLE` (Insufficient unreserved inventory)
- `-1005`: `IMBS_ERR_NEGATIVE_STOCK_PROHIBITED`
- `-1006`: `IMBS_ERR_DISCOUNT_LIMIT_EXCEEDED` (Discount exceeds 20% cap without manager override)
- `-1007`: `IMBS_ERR_UNBALANCED_JOURNAL` (Debit sum $\ne$ Credit sum)
- `-1008`: `IMBS_ERR_INVALID_UOM_CONVERSION`

---

## 2. API Endpoints Reference

### 2.1. System & Health

#### `GET /api/v1/health`
Checks server uptime, memory subsystem health, and C domain engine readiness.
- **Request:** None
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "system": "CSA0201-B-CAPSTONE-IMBS",
  "version": "1.0.0-PRO-MAXX",
  "engine": "Native C (GCC 15.2.0)",
  "uptime_seconds": 3600
}
```

#### `GET /api/v1/system/benchmark`
Executes real-time micro-benchmarks on the pure C arithmetic, GST tax calculation, WAC costing, and double-entry validation engines.
- **Request:** None
- **Response `200 OK`:**
```json
{
  "iterations": 100000,
  "fixed_point_ns_per_op": 1.2,
  "tax_calc_ns_per_op": 3.8,
  "inventory_wac_ns_per_op": 4.1,
  "journal_validation_ns_per_op": 12.4,
  "total_benchmark_time_ms": 2.15
}
```

---

### 2.2. Real-Time C Computation Engine

#### `POST /api/v1/quotation/calculate`
Calculates instant live quotations for shopping carts and POS draft orders directly inside the C domain engine.
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "is_inter_state": false,
  "invoice_discount_bps": 200,
  "has_manager_override": false,
  "items": [
    {
      "product_id": "p1",
      "quantity": 2,
      "unit_price": 50000,
      "discount_bps": 500,
      "tax_rate_bps": 1800
    },
    {
      "product_id": "p2",
      "quantity": 1,
      "unit_price": 35000,
      "discount_bps": 0,
      "tax_rate_bps": 1800
    }
  ]
}
```
- **Response `200 OK`:**
```json
{
  "subtotal": 135000,
  "discount_total": 7700,
  "taxable_amount": 127300,
  "cgst_amount": 11457,
  "sgst_amount": 11457,
  "igst_amount": 0,
  "tax_total": 22914,
  "round_off": -14,
  "grand_total": 150200
}
```

---

### 2.3. Products & Catalog

#### `GET /api/v1/products`
Retrieves product catalog with current prices, tax rates, and stock thresholds.
- **Response `200 OK`:**
```json
[
  {
    "id": "prod-001",
    "sku": "PROD-LOGI-MXM3S",
    "name": "Logitech MX Master 3S Mouse",
    "category": "Electronics",
    "base_uom": "PCS",
    "purchase_price": 650000,
    "selling_price": 899900,
    "tax_rate_bps": 1800,
    "reorder_point": 10,
    "is_active": true
  }
]
```

#### `POST /api/v1/products`
Creates a new product with validated SKU and pricing bounds.
- **Request Body:**
```json
{
  "sku": "PROD-DELL-U2723QE",
  "name": "Dell UltraSharp 27 4K Monitor",
  "category_id": "cat-hardware",
  "base_uom": "PCS",
  "purchase_price": 3800000,
  "selling_price": 5200000,
  "tax_rate_bps": 1800,
  "reorder_point": 5
}
```
- **Response `201 Created`:**
```json
{
  "id": "prod-006",
  "sku": "PROD-DELL-U2723QE",
  "message": "Product created successfully"
}
```

---

### 2.4. Inventory Management

#### `GET /api/v1/inventory/balances`
Returns current stock on hand, reserved stock, and prevailing weighted average cost.
- **Response `200 OK`:**
```json
[
  {
    "warehouse_id": "wh-001",
    "warehouse_name": "Main Warehouse Mumbai",
    "product_id": "prod-001",
    "sku": "PROD-LOGI-MXM3S",
    "product_name": "Logitech MX Master 3S Mouse",
    "quantity_on_hand": 140,
    "quantity_reserved": 15,
    "quantity_available": 125,
    "weighted_avg_cost": 650000,
    "reorder_point": 10,
    "is_low_stock": false
  }
]
```

#### `GET /api/v1/inventory/movements`
Returns immutable stock audit trail entries.
- **Response `200 OK`:**
```json
[
  {
    "id": "mov-1001",
    "movement_date": "2026-11-06T10:30:00Z",
    "movement_type": "OUT_SALE",
    "reference_no": "INV-2026-0001",
    "sku": "PROD-LOGI-MXM3S",
    "quantity_delta": -2,
    "unit_cost": 650000
  }
]
```

#### `POST /api/v1/inventory/adjust`
Adjusts warehouse stock for physical cycle counts or wastage.
- **Request Body:**
```json
{
  "warehouse_id": "wh-001",
  "product_id": "prod-001",
  "adjustment_qty": -2,
  "reason": "Damaged unit write-off"
}
```
- **Response `200 OK`:**
```json
{
  "status": "success",
  "new_quantity": 138,
  "movement_id": "mov-1002"
}
```

---

### 2.5. Billing & Invoices

#### `GET /api/v1/invoices`
Lists generated tax invoices.
- **Response `200 OK`:**
```json
[
  {
    "id": "inv-001",
    "invoice_number": "INV-2026-0001",
    "customer_name": "Acme Industrial Supplies",
    "invoice_date": "2026-11-06",
    "subtotal": 1799800,
    "tax_amount": 323964,
    "grand_total": 2123764,
    "paid_amount": 2123764,
    "balance_due": 0,
    "status": "PAID"
  }
]
```

#### `POST /api/v1/invoices`
Creates a finalized sales invoice, deducts inventory atomically, and writes double-entry journals.
- **Request Body:**
```json
{
  "customer_id": "cust-001",
  "warehouse_id": "wh-001",
  "items": [
    {
      "product_id": "prod-001",
      "quantity": 2,
      "unit_price": 899900,
      "discount_bps": 0,
      "tax_rate_bps": 1800
    }
  ],
  "payment_method": "CASH",
  "amount_tendered": 2123764
}
```
- **Response `201 Created`:**
```json
{
  "invoice_id": "inv-002",
  "invoice_number": "INV-2026-0002",
  "grand_total": 2123764,
  "status": "PAID"
}
```

---

### 2.6. Double-Entry Accounting

#### `GET /api/v1/accounting/journals`
Lists balanced journal entries.
- **Response `200 OK`:**
```json
[
  {
    "id": "je-001",
    "entry_number": "JE-2026-0001",
    "entry_date": "2026-11-06",
    "narration": "Sales Invoice INV-2026-0001 posting",
    "total_debit": 2123764,
    "total_credit": 2123764,
    "lines": [
      { "account_code": "1010", "account_name": "Cash in Register", "debit": 2123764, "credit": 0 },
      { "account_code": "4010", "account_name": "Sales Revenue", "debit": 0, "credit": 1799800 },
      { "account_code": "2110", "account_name": "Output CGST Payable", "debit": 0, "credit": 161982 },
      { "account_code": "2120", "account_name": "Output SGST Payable", "debit": 0, "credit": 161982 }
    ]
  }
]
```

#### `GET /api/v1/accounting/trial-balance`
Generates real-time balanced trial balance summary.
- **Response `200 OK`:**
```json
{
  "as_of_date": "2026-11-06",
  "total_debits": 45800000,
  "total_credits": 45800000,
  "is_balanced": true,
  "accounts": [
    { "code": "1010", "name": "Cash in Register", "type": "ASSET", "balance": 12500000 },
    { "code": "1110", "name": "Accounts Receivable", "type": "ASSET", "balance": 430000 },
    { "code": "1210", "name": "Merchandise Inventory", "type": "ASSET", "balance": 32870000 },
    { "code": "4010", "name": "Sales Revenue", "type": "REVENUE", "balance": 45800000 }
  ]
}
```

---

### 2.7. Analytics & Dashboard Reports

#### `GET /api/v1/reports/dashboard-summary`
Aggregates key financial, inventory, user, and sales metrics matching the Tabler Dark UI dashboard widgets.
- **Response `200 OK`:**
```json
{
  "total_users": 75782,
  "users_growth_pct": 2,
  "active_users": 25782,
  "active_users_change_pct": -1,
  "active_users_gauge_pct": 58,
  "conversion_rate_pct": 75,
  "revenue_minor": 430000,
  "revenue_growth_pct": 8,
  "new_clients": 6782,
  "active_subscriptions": 2986,
  "today_sales": 6782,
  "today_growth_pct": 7,
  "growth_rate_pct": 78.4,
  "shares_count": 623,
  "likes_count": 132,
  "orders_count": 78,
  "orders_shipped": 32,
  "sales_count": 132,
  "waiting_payments": 12
}
```

---
*End of REST API Specification.*

