# End-User & Cashier Operations Guide: CSA0201-B-CAPSTONE-IMBS

**Project Title:** High-Performance Enterprise Inventory Management & Billing System  
**Canonical Identity:** `CSA0201-B-CAPSTONE-IMBS`  
**Theme Style:** Tabler Dark UI Design System  
**Revision:** Version 1.0 (Academic Capstone Defense Edition)

---

## 1. Introduction & Navigation Overview

`CSA0201-B-CAPSTONE-IMBS` features a high-density, ergonomic Tabler Dark interface engineered for enterprise productivity, warehouse operators, and high-speed retail checkout cashiers.

```
+------------------------------------------------------------------------------------------------------+
| [>_ tabler]  Dashboards  Products  Inventory  Procurement  POS Checkout  Invoices  Accounting  [C Engine] |
+------------------------------------------------------------------------------------------------------+
| OVERVIEW                                                                                             |
| Dashboard                                                                [New view] [+ Create report]|
+------------------------------------------------------------------------------------------------------+
```

### Top Navigation Menu Items:
1. **Dashboards (`/`):** Enterprise executive telemetry, active user gauges, revenue sparklines, and geographic distribution.
2. **Products (`#products`):** Master product catalog, pricing configuration, HSN/GST tax rates, and SKU definitions.
3. **Inventory (`#inventory`):** Real-time multi-warehouse stock balances, reserve quantities, and immutable movement ledger.
4. **Procurement (`#procurement`):** Vendor directory, purchase orders, and Goods Receipt Note (GRN) inward processing.
5. **POS Checkout (`#pos`):** High-speed point-of-sale cash register with live C quotation engine and thermal receipt generation.
6. **Invoices (`#invoices`):** Tax invoice archive, payment allocation tracking, and printable tax invoices.
7. **Accounting (`#accounting`):** Double-entry general ledger, chart of accounts, and real-time trial balance.
8. **C Inspector (`#c-inspector`):** Academic evaluation dashboard, C struct inspector, and live microsecond benchmark runner.

---

## 2. Dashboard Walkthrough (Tabler Dark Reference Experience)

The primary dashboard reproduces the Tabler Dark interface shown in the reference design:

1. **Welcome Card:**
   - Displays current user greeting (`Welcome back, Paweł`).
   - Notification indicators (`5 new messages and 2 new notifications`).
   - Key micro-stats: **Today's Sales** (`6,782 ↑7%`) and **Growth Rate** (`78.4% ↓1%`).
2. **Total Users Card:**
   - Displays `75,782` registered users with green positive trend indicator (`2% ↑`).
   - Canvas wave sparkline illustrating 30-day user acquisition.
3. **Active Users Gauge Card:**
   - Displays `25,782` active users.
   - Features a high-contrast radial semi-donut canvas gauge rendering **58% Active Users**.
4. **Sales Conversion & Revenue Cards:**
   - **Sales:** `75%` conversion rate with progress bar.
   - **Revenue:** `$4,300` (`8% ↑`) with blue sinusoidal area chart.
   - **New Clients:** `6,782` with trendline.
   - **Active Subscriptions:** `2,986` (`4% ↑`) with vertical histogram bars.
5. **Operational Stat Tiles:**
   - **Sales:** `132 Sales` / `12 waiting payments`.
   - **Orders:** `78 Orders` / `32 shipped`.
   - **Shares:** `623 Shares` / `16 today`.
   - **Likes:** `132 Likes` / `21 today`.
6. **Traffic Summary & Regional Locations:**
   - Grouped multi-color bar chart comparing Web, Social, and Other traffic streams.
   - Vector-rendered interactive world map showing regional sales distribution.

---

## 3. High-Speed Point-of-Sale (POS) Cashier Workflow

The POS module (`#pos`) is engineered for rapid keyboard-driven or barcode scanner-driven retail checkout.

### 3.1. Adding Products to the Cart
- **Barcode Scanner:** Scanning an EAN-13 or SKU barcode immediately appends the product to the active cart.
- **Product Grid:** Click or tap any product tile in the product catalog pane to increment its quantity in the cart.
- **Live Search:** Type in the search box to filter products by name or SKU instantly.

### 3.2. Real-Time C Domain Calculation
As cart items, quantities, or discounts are modified, the browser immediately submits a calculation request to the native C engine (`POST /api/v1/quotation/calculate`). The C engine computes:
- Gross Subtotal
- Line & Invoice Discounts
- CGST (Central GST) and SGST (State GST) or IGST (Integrated GST)
- Integer Cash Round-Off
- Grand Total Net Payable

All calculations execute in under **1 microsecond**, ensuring no UI lag.

### 3.3. Manager Override for High Discounts
- Standard cashiers may apply promotional discounts up to **20.00%**.
- If a discount exceeding 20.00% is attempted without managerial approval, the C engine rejects the transaction with `IMBS_ERR_DISCOUNT_LIMIT_EXCEEDED`.
- Ticking the **Manager Override** checkbox simulates authorization by an administrative supervisor.

### 3.4. Finalizing Sale & Printing Thermal Receipt
1. Click the blue **Pay (Grand Total)** button.
2. The Checkout Modal opens, displaying total due, payment method selector (Cash, Card, UPI), and amount tendered.
3. Click **Confirm & Print Invoice**.
4. The system:
   - Atomically records the invoice in the database.
   - Deducts stock from warehouse inventory.
   - Generates double-entry accounting lines (`Debit: Cash`, `Credit: Revenue`, `Credit: GST Payable`).
   - Displays the formatted 80mm thermal receipt ready for instant printing.

---

## 4. Inventory Management & Stock Auditing

### 4.1. Monitoring Warehouse Balances (`#inventory`)
- View available, reserved, and physical on-hand quantities for every SKU.
- Items falling below the configured **Reorder Point** display a prominent red `LOW STOCK` badge.

### 4.2. Manual Stock Adjustments
1. Click the **Stock Adjustment** button.
2. Select the warehouse and target product SKU.
3. Enter the adjustment delta (e.g., `-2` for damaged units, `+5` for unrecorded returns).
4. Specify the audit reason and click **Apply Adjustment**.
5. The adjustment is logged in `stock_movements` with pre- and post-balance snapshots.

### 4.3. Warehouse Transfers
1. Click **Stock Transfer**.
2. Select Source Warehouse, Destination Warehouse, Product, and Transfer Quantity.
3. Click **Transfer Stock**. Stock is atomically decremented from the source and incremented at the destination.

---

## 5. Procurement & Goods Receipt Notes (GRN)

When purchasing inventory from vendors:
1. Navigate to **Procurement (`#procurement`)**.
2. View existing Purchase Orders (POs) and vendor status.
3. Click **Receive Goods (GRN)**.
4. Enter the received quantity and invoice purchase price.
5. The C domain engine updates physical stock and automatically recalculates the **Weighted Average Cost (WAC)** for that product, preserving historical valuation accuracy.

---

## 6. Double-Entry General Ledger & Trial Balance

To ensure accounting compliance:
1. Navigate to **Accounting (`#accounting`)**.
2. Inspect the **Journal Entries** table: verify that every entry satisfies $\sum \text{Debits} \equiv \sum \text{Credits}$.
3. Review the **Chart of Accounts** and account balances.
4. Click **Verify Trial Balance**: confirms that total debit balances equal total credit balances across all asset, liability, equity, revenue, and expense accounts.

---

## 7. Academic C Inspector & Microsecond Benchmarking

For academic project evaluation, select **C Inspector (`#c-inspector`)** from the top menu:
- **Struct Inspector:** Inspect the exact C memory layout of `money_t`, `imbs_invoice_t`, `imbs_inventory_balance_t`, and `imbs_journal_entry_t`.
- **Live Benchmark Runner:** Click **Run 100,000 Operations Benchmark** to measure native C execution speed for arithmetic, GST calculations, WAC averaging, and journal checks directly in real time.

---
*End of End-User & Cashier Operations Guide.*

