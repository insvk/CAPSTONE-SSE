# CSA0201-B-CAPSTONE-IMBS
## Ultimate Enterprise-Grade Product Requirements Document (PRD)
### C-First Inventory Management & Billing System

**Document type:** Product Requirements Document + Technical Architecture + Engineering Execution Specification  
**Project name (canonical):** `CSA0201-B-CAPSTONE-IMBS`   
**Product class:** Multi-user, cloud-connected Inventory Management, Point-of-Sale and Billing Platform  
**Status:** Master implementation specification  
**Primary engineering directive:** **C must be the principal backend language and the actual owner of the core business logic.**  
**Version:** 1.0

---

# 0. NON-NEGOTIABLE PROJECT DIRECTIVE

Build `CSA0201-B-CAPSTONE-IMBS` as a complete, working, professional inventory and billing platform—not a static UI, mock dashboard, CRUD-only demo, or collection of disconnected screens.

The application must use **C as its core implementation language**. C must implement the primary domain engine and execute the critical business rules for inventory, stock movements, purchases, sales, billing, tax calculations, discounts, returns, payments, accounting calculations, validation, and reporting. A C program that only prints a menu, performs a small calculation, or acts as a token WASM add-on does **not** satisfy the project requirement.

The frontend may use HTML, CSS and JavaScript. PostgreSQL hosted through Supabase is the authoritative persistent database. Supabase Auth, Row Level Security (RLS), Storage and Realtime may be used as supporting managed services. A native C backend service must expose the application API and call the database through a secure, well-defined data-access layer.

Python may be used for development utilities, migration scripts, test-data generation, document processing or optional analytics jobs. It must not replace, duplicate or silently become the primary implementation of the core business rules.

WebAssembly (WASM) is optional. Selected C modules may be compiled to WASM for browser-side previews or offline calculations, but WASM is not a substitute for the native C backend.

**Deployment reality:** Vercel is suitable for the frontend. A persistent native C HTTP service generally requires a hosting platform that supports long-running native processes or containers. Do not claim that a persistent C server can run on Vercel serverless without verifying the platform's current runtime support. Deploy the C service separately, preferably on a genuinely usable free tier where available. If no dependable free always-on option exists, document the limitation and provide a reproducible local/container deployment plus a clearly identified low-cost production option. Never promise unlimited free hosting.

## 0.1 Definition of done

The project is complete only when:
- A user can sign in, receive permissions appropriate to their role, and perform authorized workflows.
- Products, customers, suppliers, warehouses, stock, purchases, sales, invoices and payments persist in PostgreSQL.
- A stock-affecting transaction updates the stock ledger and derived balance atomically.
- Invoice totals, taxes, discounts, payments, balances and accounting entries are calculated by tested C domain functions.
- The browser never becomes the authority for prices, permissions, stock balances, taxes or invoice totals.
- Refreshing the browser, signing out and signing back in, or opening another authorized device does not lose persisted data.
- Multiple users can work concurrently without silent lost updates or duplicate financial transactions.
- All critical workflows have automated tests and documented manual acceptance tests.
- No essential button, route, form, API endpoint or menu item is a dead end or fake placeholder.
- The codebase builds reproducibly from documented instructions and can be deployed from GitHub.
- The academic submission clearly demonstrates meaningful C programming concepts and identifies the C source files implementing each business capability.

---

# 1. PRODUCT VISION AND OUTCOMES

## 1.1 Product vision

Deliver a secure, responsive, cloud-connected inventory and billing application for small and medium businesses, with a modular architecture capable of supporting multiple organizations, branches, warehouses, users and operational workflows.

The product should combine:
- Inventory control and stock traceability
- Purchase and supplier management
- Sales, POS and order processing
- Professional invoice generation
- Tax configuration suitable for GST workflows
- Customer and supplier records
- Payment tracking and cash/bank records
- Basic double-entry accounting
- Returns and stock adjustments
- Dashboards, reports and audit history
- Role-based access and operational governance

The platform should feel like a coherent commercial product, while remaining understandable, demonstrable and defensible as a C Programming capstone.

## 1.2 Business objectives

1. Maintain accurate stock quantities and traceable stock movement history.
2. Reduce manual billing errors through centralized C-based calculation rules.
3. Provide end-to-end traceability from purchase order to goods receipt, stock to sale, invoice to payment and return to refund/credit.
4. Provide reliable operational visibility through dashboards and reports.
5. Enforce organization, branch, warehouse and role boundaries.
6. Make every important transaction auditable.
7. Support a realistic academic demonstration without sacrificing engineering quality.

## 1.3 Success metrics

| Area | Target |
|---|---|
| Persistence | 100% of committed business transactions stored in PostgreSQL |
| Stock integrity | No negative stock unless an authorized policy explicitly permits it |
| Financial accuracy | Deterministic fixed-point/integer arithmetic; no floating-point money calculations |
| Duplicate prevention | Idempotency protection for critical write APIs |
| Authorization | Server-side authorization on every protected operation |
| Auditability | Every critical create/update/post/void/return action has an audit record |
| Reliability | No silent failure; errors are visible, actionable and logged |
| Test coverage | All critical domain rules covered by unit and integration tests |
| Responsiveness | Usable on mobile, tablet and desktop |
| Accessibility | Keyboard-operable core workflows and semantic form controls |
| Build | Clean build and test from documented setup on a fresh environment |

Targets should be measured in CI and documented. Do not claim a target has been met without test evidence.

---

# 2. USERS, ROLES AND PERMISSION MODEL

## 2.1 User personas

- **Business owner:** monitors revenue, stock value, profitability, cash position and branch performance.
- **System administrator:** configures organization, users, roles, branches, tax settings and system policies.
- **Inventory manager:** manages products, warehouses, stock transfers, counts, adjustments and reorder levels.
- **Purchase manager:** manages suppliers, purchase requests, purchase orders and goods receipts.
- **Sales manager:** manages quotations, orders, sales performance, pricing and returns.
- **Cashier / billing operator:** creates sales, collects payments and prints or downloads invoices.
- **Accountant:** reviews invoices, payments, expenses, journals and financial reports.
- **Warehouse operator:** receives, picks, packs, transfers and counts stock.
- **Auditor / read-only user:** reviews approved records, audit events and reports without changing data.

## 2.2 Required roles

Implement configurable roles rather than hardcoding UI visibility as the security mechanism.

Suggested initial roles:
- `SUPER_ADMIN`
- `ORG_ADMIN`
- `BRANCH_MANAGER`
- `INVENTORY_MANAGER`
- `PURCHASE_MANAGER`
- `SALES_MANAGER`
- `CASHIER`
- `ACCOUNTANT`
- `WAREHOUSE_OPERATOR`
- `AUDITOR`
- `READ_ONLY`

## 2.3 Permission structure

Use resource-action permissions, for example:
- `products.read`, `products.create`, `products.update`, `products.archive`
- `inventory.read`, `inventory.adjust`, `inventory.transfer`, `inventory.count`
- `purchases.read`, `purchases.create`, `purchases.approve`, `purchases.receive`
- `sales.read`, `sales.create`, `sales.discount.approve`, `sales.void`
- `invoices.read`, `invoices.issue`, `invoices.credit_note`
- `payments.read`, `payments.collect`, `payments.refund`
- `reports.read`, `reports.export`
- `users.manage`, `roles.manage`, `settings.manage`, `audit.read`

The server must enforce permissions independently of frontend navigation. Hiding a button is not authorization.

## 2.4 Approval controls

Support configurable approval thresholds for:
- Discounts above a permitted percentage or amount
- Stock adjustments above a quantity/value threshold
- Purchase orders above a monetary threshold
- Refunds and invoice voids
- Backdated transactions
- Manual price overrides
- Negative-stock exceptions, if enabled

Approval must record requester, approver, timestamp, reason, original value and approved value. Users must not approve their own sensitive transaction unless an explicit policy permits it.

---

# 3. TECHNOLOGY AND ARCHITECTURE

## 3.1 Required technology responsibilities

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | HTML5, CSS3, JavaScript | UI, forms, navigation, client validation for usability, API calls and realtime presentation |
| Core backend | **C (native compiled service)** | Primary business rules, validation, calculations, workflows, authorization checks and API orchestration |
| Database | PostgreSQL via Supabase | Authoritative persistent data, constraints, indexes and transactions |
| Authentication | Supabase Auth or equivalent secure identity provider | Identity, password lifecycle, token issuance and session lifecycle |
| Authorization | C backend + PostgreSQL RLS | Server-side permission checks and tenant/branch isolation |
| Realtime | Supabase Realtime or secure server event channel | Updates to authorized clients |
| File storage | Supabase Storage | Product images, invoice PDFs, attachments and import files |
| Frontend hosting | Vercel or equivalent static hosting | Build and serve frontend |
| C service hosting | Native process/container host | Run the persistent C API service |
| Source control | GitHub | Version control, code review and CI |
| CI | GitHub Actions | Build, lint, test, security and deployment checks |
| Optional scripts | Python | Supporting scripts only; not core domain logic |

## 3.2 High-level architecture

```text
Desktop / Tablet / Mobile Browser
              |
              | HTTPS
              v
      HTML + CSS + JavaScript
              |
              | Authenticated JSON API
              v
     Native C Backend Service
     -------------------------
     HTTP Router / Middleware
     Authentication Context
     Authorization / Policy
     Request Validation
     Domain Services (C)
       - Products
       - Inventory Ledger
       - Procurement
       - Sales / POS
       - Billing / Tax
       - Payments
       - Returns
       - Accounting
       - Reports
     Transaction Coordinator
     Data Access Layer
              |
              | TLS / parameterized SQL
              v
     PostgreSQL (Supabase)
       - Constraints / indexes
       - Transactional records
       - RLS policies
       - Audit records
              |
       +------+------------------+
       |                         |
       v                         v
 Supabase Realtime          Supabase Storage
       |
       v
 Authorized browser updates
```

## 3.3 C backend design requirements

The C service must:
- Be a real server process with a documented startup command.
- Expose versioned REST/JSON endpoints.
- Parse and validate request bodies safely.
- Verify authentication tokens or securely validate identity-provider claims.
- Derive organization and user identity from verified credentials, never trust client-supplied tenant IDs.
- Enforce role and resource permissions.
- Use parameterized database queries.
- Use PostgreSQL transactions for multi-record operations.
- Return consistent JSON response and error formats.
- Apply request size limits, timeouts, rate limits and safe concurrency controls.
- Log request correlation IDs without logging passwords, tokens or sensitive payment data.
- Handle graceful shutdown and database connection failures.
- Expose health and readiness endpoints without leaking secrets.
- Include structured configuration through environment variables.
- Never embed service-role keys, database passwords or signing secrets in frontend code or source control.

Choose a maintained C HTTP server/library and PostgreSQL client library after checking compatibility, license, security maintenance and deployment constraints. Record the exact selected versions in the repository. Do not invent package APIs or use unmaintained libraries without an explicit risk note.

## 3.4 C-first domain engine

The following business logic must live in C and be tested independently of the HTTP layer:

1. Product and SKU validation
2. Unit-of-measure conversion and quantity validation
3. Stock availability and reservation decisions
4. Stock movement validation and ledger posting
5. FIFO/weighted-average costing policy implementation
6. Purchase order totals and receiving variance
7. Sales line pricing and discount eligibility
8. Taxable base, GST component and invoice total calculation
9. Payment allocation and outstanding balance
10. Return eligibility, refund and credit-note calculation
11. Accounting journal construction and balance validation
12. Reorder point and safety-stock calculations
13. Report aggregation rules where they represent business definitions
14. Approval threshold evaluation
15. Import row validation and domain error reporting

The database remains authoritative for persistence and concurrency. C computes and orchestrates decisions; SQL constraints and transactions protect integrity. Never keep a second, conflicting source of truth in browser state.

## 3.5 Suggested C source organization

```text
CSA0201-B-CAPSTONE-IMBS/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_SPECIFICATION.md
│   ├── SECURITY.md
│   ├── DEPLOYMENT.md
│   ├── USER_GUIDE.md
│   ├── ACADEMIC_C_REPORT.md
│   ├── FLOWCHARTS/
│   └── screenshots/
├── frontend/
│   ├── index.html
│   ├── assets/
│   ├── css/
│   └── js/
├── backend/
│   ├── CMakeLists.txt
│   ├── Makefile
│   ├── include/
│   │   ├── common/
│   │   ├── config/
│   │   ├── db/
│   │   ├── http/
│   │   ├── auth/
│   │   ├── domain/
│   │   └── services/
│   ├── src/
│   │   ├── main.c
│   │   ├── config/
│   │   ├── db/
│   │   ├── http/
│   │   ├── auth/
│   │   ├── domain/
│   │   │   ├── product/
│   │   │   ├── inventory/
│   │   │   ├── procurement/
│   │   │   ├── sales/
│   │   │   ├── billing/
│   │   │   ├── tax/
│   │   │   ├── payments/
│   │   │   ├── returns/
│   │   │   ├── accounting/
│   │   │   └── reporting/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── policies/
│   └── tests/
├── scripts/
│   ├── dev/
│   ├── migration/
│   └── validation/
├── infra/
│   ├── Dockerfile.backend
│   ├── docker-compose.yml
│   └── github-actions/
└── .github/
    └── workflows/
```

This is a suggested structure. Keep the actual repository coherent; do not create empty folders or placeholder modules merely to imitate the diagram.

## 3.6 C programming requirements for academic validity

The implementation and report must demonstrate meaningful C programming:
- Structs and enums for domain entities and states
- Functions with clear contracts and single responsibilities
- Pointers and safe ownership rules
- Arrays and dynamic memory where appropriate
- Header/source separation and modular compilation
- Input validation and error handling
- Linked lists, hash tables or other data structures only where justified by a real use case
- File handling for controlled import/export or local test fixtures where appropriate
- Sorting/searching algorithms where used in actual product/report workflows
- Build configuration and compiler warnings
- Unit tests for C functions
- Memory checking and sanitizers in development/CI

Use strict compiler warnings. Aim for C17 or a documented compatible standard. Avoid undefined behavior, unsafe string functions, unchecked allocations, buffer overflows, integer overflow and uninitialized memory. Document ownership of allocated objects and ensure every allocation has a clear release path.

**Academic evidence:** provide a C module map, algorithm explanations, data structure rationale, selected flowcharts, sample inputs/outputs, build instructions, test results and screenshots. Do not claim that the whole product is written in C if the frontend and database are not.

---

# 4. FUNCTIONAL SCOPE AND MODULE REQUIREMENTS

## 4.1 Authentication and account lifecycle

Required:
- Login and logout
- Secure password hashing through the identity provider; never store plaintext passwords
- Password reset using verified email workflow
- Email verification where configured
- Session expiry and refresh
- Server-side token validation
- Optional TOTP-based 2FA if feasible and securely implemented
- Account activation, suspension and deactivation
- Login history and security event records
- Session revocation for administrators
- Rate limiting and lockout/risk controls for repeated failures

Acceptance:
- Invalid or expired tokens cannot access protected APIs.
- A disabled user cannot continue using an old session after revocation policy takes effect.
- Password reset tokens are single-use and time-limited.
- No secrets or password material appear in application logs.

## 4.2 Organization, branch and warehouse setup

Support:
- Organization profile and business details
- Multiple branches
- Multiple warehouses per branch
- Address, contact and tax registration configuration
- Default currency and timezone
- Financial year and invoice numbering settings
- Branch-specific users and permissions
- Configurable document prefixes

A user may access only organizations and branches explicitly assigned to them.

## 4.3 Dashboard

Provide role-aware dashboards with:
- Sales today, week, month and selected period
- Purchase totals
- Gross margin where cost data is reliable
- Stock valuation
- Low-stock and out-of-stock items
- Expiring/expired batches
- Pending purchase orders and goods receipts
- Unpaid invoices and overdue balances
- Payment summary
- Top-selling products
- Recent transactions
- Branch/warehouse filters
- Date range and export controls

All figures must come from real database-backed queries. Label the date range, currency and calculation basis. No hardcoded sample metrics in production mode.

## 4.4 Product and catalog management

Product fields:
- Product ID
- SKU / item code
- Barcode
- Name and description
- Category and subcategory
- Brand and manufacturer
- Unit of measure
- Purchase price and selling price
- Tax category / tax rate reference
- Reorder point and preferred reorder quantity
- Track-stock flag
- Batch/serial/expiry tracking configuration
- Product image and attachments
- Active/archived state
- Created/updated metadata

Features:
- Create, view, update, archive and restore
- Search by name, SKU or barcode
- Category and brand filters
- Bulk import with preview and validation
- Bulk export
- Duplicate SKU/barcode prevention within the required scope
- Product variants and configurable attributes
- Unit conversion with explicit conversion rules
- Price history
- Product image upload
- Audit trail

Do not hard-delete products that are referenced by posted transactions. Use archival and immutable transaction snapshots.

## 4.5 Inventory and stock ledger

This is a critical module.

Maintain:
- Stock by organization, branch, warehouse, product and (where applicable) batch/serial
- Opening stock
- Goods receipt
- Sales issue
- Sales return
- Purchase return
- Warehouse transfer
- Stock adjustment
- Stock count and reconciliation
- Reservation and release
- Damaged, expired and quarantined stock
- Stock movement history
- Reorder alerts

Every stock-changing event must create an immutable ledger movement with:
- Movement ID
- Product and quantity
- Source and destination location where relevant
- Movement type
- Reference document
- Unit cost / valuation basis
- Transaction timestamp
- Actor and reason
- Idempotency key
- Reversal reference when corrected

Rules:
- Never edit a posted movement in place. Correct it through a reversal and replacement movement.
- Use database transactions to post movements and update any cached balance.
- Protect concurrent stock changes using row locks, serializable/appropriate isolation or atomic conditional updates.
- Prevent negative stock by default; any exception must be an explicit policy with permission and audit.
- Maintain a reconciliation mechanism comparing ledger totals with stored balances.
- Do not let a browser calculate or directly write authoritative stock balance.
- Stock transfer must debit source and credit destination atomically.
- A failed transaction must leave neither partial ledger entries nor partial balance changes.

Costing policy:
- Support a documented initial costing method such as weighted average.
- FIFO may be added with explicit cost layers and tests.
- Do not mix costing methods silently.
- Keep valuation calculations in fixed-point/integer arithmetic.
- Document how returns, landed cost and stock adjustments affect valuation.

## 4.6 Warehouse management

Features:
- Warehouse and bin/location setup
- Put-away and picking workflows
- Transfer requests and approvals
- Transfer dispatch and receipt
- Cycle counts
- Full physical stock counts
- Variance review and adjustment approval
- Batch, lot, serial and expiry tracking
- FEFO picking for expiry-managed goods
- Warehouse activity log

A transfer should have explicit states such as draft, requested, approved, dispatched, partially received, received, cancelled. Do not silently mark stock as received at dispatch.

## 4.7 Procurement and supplier management

Supplier master:
- Legal/business name
- Contact person
- Phone and email
- Address
- Tax registration details
- Payment terms
- Opening balance if accounting scope includes it
- Status and notes

Procurement workflow:
1. Purchase request (optional)
2. Request for quotation (optional)
3. Supplier quotation comparison (optional)
4. Purchase order
5. Approval
6. Goods receipt note
7. Quality/quantity inspection
8. Supplier invoice capture
9. Three-way match where configured
10. Supplier payment
11. Purchase return / debit note

Rules:
- Purchase order does not increase on-hand stock.
- Goods receipt posts inventory.
- Supplier invoice records financial liability according to accounting policy.
- Partial deliveries must be supported.
- Receiving quantity cannot exceed permitted tolerance without approval.
- Preserve price and tax snapshots on posted documents.
- Track ordered, received, invoiced and outstanding quantities.

## 4.8 Sales, quotations and POS

Features:
- Customer selection or quick customer creation
- Product search by name/SKU/barcode
- Cart and quantity editing
- Price list selection
- Discount rules and manager override
- Tax calculation
- Hold/resume cart
- Draft quotation
- Sales order
- Delivery / fulfillment state
- POS checkout
- Cash, card, bank transfer and configured payment methods
- Partial payment
- Split payment
- Receipt / invoice output
- Return initiation
- Salesperson and branch attribution

Rules:
- The C backend recalculates all submitted line prices, discounts, tax and totals.
- Ignore client-supplied totals as authoritative.
- Revalidate product availability at checkout.
- Use idempotency keys to prevent duplicate checkout on retries.
- Invoice and stock issue must be committed atomically where the business flow requires it.
- If payment provider integration is not configured, clearly mark the method as manual/offline; do not simulate a successful external payment.

## 4.9 Billing and invoices

Required documents:
- Quotation
- Pro forma invoice if enabled
- Tax invoice
- Payment receipt
- Credit note
- Debit note where applicable
- Delivery note
- Purchase order
- Goods receipt note

Invoice capabilities:
- Organization and branch identity
- Unique invoice number with concurrency-safe sequence
- Customer billing and shipping details
- Product/service lines
- Quantity, unit price and discount
- Taxable value and tax breakdown
- Round-off policy
- Grand total
- Amount paid and balance due
- Payment terms and due date
- Notes and terms
- Status: draft, issued, partially paid, paid, overdue, voided or credited as appropriate
- PDF generation
- Print-friendly layout
- Email delivery integration if configured
- Immutable snapshot of customer, product description, price and tax data at issue time

Issued invoices must not be silently edited. Use credit notes, debit notes or reversal workflows.

## 4.10 GST and tax configuration

Design tax as configurable, not hardcoded to one rate.

Support configuration for:
- Tax-inclusive and tax-exclusive pricing
- Tax category and rate
- CGST/SGST/IGST-style components where applicable
- Place-of-supply and intra/inter-state determination where the business has provided valid configuration
- Exempt, zero-rated and non-taxable items
- Tax rounding rules
- Tax summary reports
- Customer/supplier tax registration details
- Invoice-level tax snapshots

Important:
- The application is not a substitute for professional tax/legal advice.
- GST rates and compliance fields must be configurable and reviewed against current applicable rules before real-world use.
- Do not invent tax rates or assume all transactions use the same treatment.
- Keep tax calculation in C and cover it with boundary tests.
- Store monetary values as integer minor units or fixed-point decimal values, not binary floating-point.

## 4.11 Customer relationship management

Features:
- Customer profile
- Contact and address book
- Billing/shipping addresses
- Tax identifiers
- Customer group and price list
- Credit limit and payment terms
- Transaction history
- Outstanding balance
- Notes and attachments
- Customer statement
- Import/export

Credit-limit enforcement must be server-side and auditable. Do not expose unnecessary personal information to users without permission.

## 4.12 Payments and cash/bank management

Support:
- Payment receipt
- Supplier payment
- Partial and split payment
- Payment allocation to one or more invoices
- Unallocated advance
- Refund
- Payment reversal
- Cash drawer opening/closing if POS scope requires it
- Cash and bank accounts
- Daily collection summary
- Payment method configuration
- Reference number and reconciliation status

Rules:
- Payment records must be idempotent.
- A payment allocation cannot exceed available unapplied amount.
- Refunds must reference the original payment or approved credit balance.
- Never store raw card numbers, CVV or payment credentials.
- External gateway integrations must use provider-hosted/tokenized payment flows.

## 4.13 Returns, refunds and warranty

Support:
- Sales return request
- Eligibility checks
- Returned quantity and condition
- Restock, quarantine, scrap or repair disposition
- Refund or credit note
- Purchase return to supplier
- Return reason codes
- Serial/batch traceability
- Warranty dates and claim references

A return must not automatically increase sellable stock until inspection/disposition rules permit it.

## 4.14 Accounting foundation

Provide a coherent basic accounting layer:
- Chart of accounts
- Journal entries
- Debit/credit lines
- General ledger
- Customer receivables
- Supplier payables
- Cash/bank accounts
- Sales and purchase postings
- Tax control accounts
- Expense entries
- Trial balance
- Account ledger
- Period locking

Rules:
- Every posted journal must balance: total debits equal total credits.
- Journal entries must be immutable after posting; correct with reversal entries.
- Accounting postings must be linked to source documents.
- Define and document the posting matrix for each workflow.
- Do not claim full statutory accounting compliance without a proper accounting review.

## 4.15 Expenses

Features:
- Expense category
- Vendor/payee
- Date and branch
- Amount and tax treatment
- Payment account
- Attachment/receipt
- Approval status
- Recurring expense template (optional)
- Expense reports

## 4.16 Reports and analytics

Minimum reports:
- Stock on hand
- Stock valuation
- Stock movement ledger
- Low-stock report
- Expiry and batch report
- Purchase register
- Supplier outstanding
- Sales register
- Sales by product/category/customer/branch
- Tax summary
- Invoice ageing
- Customer outstanding
- Payment collection
- Returns and refunds
- Expense report
- Trial balance and general ledger
- Audit activity report

Reports must support:
- Date range
- Branch/warehouse
- Category/product/customer/supplier filters where relevant
- Pagination
- CSV export
- Print/PDF where implemented
- Clearly stated totals and timezone
- Permission checks

Do not load an unbounded dataset into the browser. Aggregate and paginate on the server/database.

## 4.17 Notifications and workflow

Support in-app notifications for:
- Low stock
- Purchase approval
- Goods receipt variance
- Invoice overdue
- Payment received
- Refund request
- Stock count variance
- User/security events

Email/SMS/push notifications are optional integrations. If not configured, the UI must state that delivery is unavailable rather than falsely showing “sent”.

## 4.18 Audit trail

Record critical events:
- Login/security events
- User/role changes
- Product and pricing changes
- Stock movements and adjustments
- Purchase approvals and receipts
- Invoice issue/void/credit
- Payment receipt/refund/reversal
- Tax and system setting changes
- Exports of sensitive data

Audit event fields:
- Event ID
- Organization
- Actor
- Action
- Entity type and ID
- Timestamp
- Request/correlation ID
- Before/after diff where appropriate
- Reason/approval reference
- Source IP/device metadata only where lawful and necessary

Audit logs must be append-only to application roles. Do not store secrets or unnecessary sensitive data in audit payloads.

---

# 5. DATA MODEL AND DATABASE DESIGN

## 5.1 Database principles

- PostgreSQL is the authoritative system of record.
- Use UUID primary keys for distributed-friendly identifiers.
- Use foreign keys and check constraints.
- Use unique constraints for business identifiers within their correct scope.
- Use `numeric(p,s)` or integer minor units for monetary values; never PostgreSQL floating-point for money.
- Use timezone-aware timestamps (`timestamptz`) and store UTC.
- Add `created_at`, `updated_at`, `created_by`, `updated_by` where appropriate.
- Use soft deletion/archive only where legally and operationally safe.
- Use immutable posted transaction records.
- Add indexes based on measured query patterns.
- Use migrations for every schema change.
- Do not make schema changes manually in production without a migration.

## 5.2 Core entity groups

**Identity and tenancy**
- organizations
- organization_settings
- branches
- warehouses
- warehouse_bins
- user_profiles
- organization_memberships
- roles
- permissions
- role_permissions
- user_role_assignments
- user_branch_access
- user_sessions or session metadata where appropriate

**Catalog**
- products
- product_variants
- product_categories
- brands
- units_of_measure
- unit_conversions
- product_barcodes
- price_lists
- product_prices
- product_tax_categories
- product_images

**Inventory**
- inventory_balances (derived/cache, not sole source of truth)
- stock_movements
- stock_reservations
- stock_batches
- stock_serials
- stock_counts
- stock_count_lines
- stock_transfers
- stock_transfer_lines
- stock_cost_layers where FIFO is implemented

**Procurement**
- suppliers
- purchase_requests
- purchase_orders
- purchase_order_lines
- goods_receipts
- goods_receipt_lines
- supplier_invoices
- purchase_returns
- purchase_return_lines

**Sales and billing**
- customers
- customer_addresses
- quotations
- quotation_lines
- sales_orders
- sales_order_lines
- sales
- sale_lines
- invoices
- invoice_lines
- invoice_tax_lines
- credit_notes
- credit_note_lines
- delivery_notes

**Finance**
- payments
- payment_allocations
- refunds
- cash_accounts
- bank_accounts
- expenses
- expense_categories
- chart_of_accounts
- journal_entries
- journal_lines
- accounting_periods

**Governance**
- approvals
- audit_events
- notifications
- idempotency_records
- file_metadata
- import_jobs
- export_jobs

## 5.3 Key database invariants

- A posted invoice belongs to one organization and a valid branch.
- A posted invoice number is unique within the configured numbering scope.
- A stock movement references a valid product and location.
- Movement quantity is positive; direction/type determines increase or decrease.
- A transfer has balanced source and destination movement effects.
- A posted journal has equal debit and credit totals.
- Payment allocation totals cannot exceed the payment's allocatable amount.
- A return quantity cannot exceed the eligible sold/received quantity less previous returns.
- An idempotency key is unique within its defined user/organization/endpoint scope.
- Tenant and branch references must be validated server-side and constrained in the database.

## 5.4 Tenant isolation and RLS

For every tenant-owned table:
- Include organization scope, directly or through a rigorously enforced parent relationship.
- Enable RLS.
- Create policies for authorized membership and permitted branch access.
- Test both allowed and denied cases.
- Do not assume a UUID is secret or sufficient authorization.
- Do not expose Supabase service-role credentials to the browser.
- If the C backend uses a privileged database role, it must enforce authorization itself and expose only narrowly scoped operations. Prefer defense in depth and least privilege.
- Test cross-tenant access attempts using deliberately different organization IDs.

---

# 6. API DESIGN

## 6.1 API conventions

- Base path: `/api/v1`
- JSON request/response
- HTTPS only outside local development
- Bearer token authentication
- Consistent status codes
- Request correlation ID
- Pagination using `limit` and cursor/offset strategy
- Server-side filtering and sorting with allowlisted fields
- Idempotency key for critical write operations
- Explicit API versioning
- OpenAPI specification maintained with implementation

Example response envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "server-generated-id"
  },
  "error": null
}
```

Example error:

```json
{
  "success": false,
  "data": null,
  "meta": {
    "request_id": "server-generated-id"
  },
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "The requested quantity is not available.",
    "details": {}
  }
}
```

Never return SQL statements, stack traces, secrets or internal filesystem paths to clients.

## 6.2 Endpoint groups

**Authentication / profile**
- `GET /auth/me`
- `POST /auth/logout` (if backend session handling requires it)
- `GET /users/me`
- `PATCH /users/me`

**Products**
- `GET /products`
- `POST /products`
- `GET /products/{id}`
- `PATCH /products/{id}`
- `POST /products/{id}/archive`
- `GET /products/{id}/price-history`

**Inventory**
- `GET /inventory/balances`
- `GET /inventory/movements`
- `POST /inventory/adjustments`
- `POST /inventory/transfers`
- `POST /inventory/transfers/{id}/approve`
- `POST /inventory/transfers/{id}/dispatch`
- `POST /inventory/transfers/{id}/receive`
- `POST /inventory/counts`
- `POST /inventory/counts/{id}/submit`

**Procurement**
- `GET /suppliers`
- `POST /suppliers`
- `GET /purchase-orders`
- `POST /purchase-orders`
- `POST /purchase-orders/{id}/submit`
- `POST /purchase-orders/{id}/approve`
- `POST /goods-receipts`
- `POST /goods-receipts/{id}/post`

**Sales and invoices**
- `GET /customers`
- `POST /customers`
- `POST /sales/quote`
- `POST /sales`
- `GET /sales/{id}`
- `POST /sales/{id}/complete`
- `GET /invoices`
- `GET /invoices/{id}`
- `POST /invoices/{id}/issue`
- `POST /invoices/{id}/void`
- `POST /invoices/{id}/credit-notes`

**Payments**
- `POST /payments`
- `POST /payments/{id}/allocate`
- `POST /payments/{id}/refund`
- `GET /payments`
- `GET /customers/{id}/statement`

**Reports**
- `GET /reports/sales`
- `GET /reports/stock`
- `GET /reports/stock-valuation`
- `GET /reports/tax`
- `GET /reports/receivables`
- `GET /reports/payables`
- `GET /reports/trial-balance`

**Administration**
- `GET /users`
- `POST /users/invitations`
- `PATCH /users/{id}/status`
- `GET /roles`
- `POST /roles`
- `PATCH /roles/{id}`
- `GET /audit-events`
- `GET /settings`
- `PATCH /settings`

This list is a baseline. Each implemented endpoint must have request schema, response schema, authorization rule, validation rules, error codes and tests. Do not expose an endpoint until it has a working implementation.

---

# 7. FINANCIAL AND INVENTORY CALCULATION RULES

## 7.1 Money representation

Use integer minor units (for example paise) or a carefully defined fixed-point decimal representation. The selected currency precision must be explicit. Never use `float` or `double` for money calculations.

Define:
- Currency code
- Minor-unit precision
- Rounding mode
- Tax rounding stage
- Line-level vs invoice-level discount order
- Whether prices include or exclude tax
- Round-off account/policy

Use overflow-checked arithmetic. Reject values outside supported ranges.

## 7.2 Invoice calculation sequence

The C domain engine should use a documented, deterministic sequence such as:
1. Validate product, unit, quantity and price eligibility.
2. Compute gross line amount using fixed-point arithmetic.
3. Apply permitted line discount.
4. Compute taxable base.
5. Apply configured tax components and rounding rules.
6. Aggregate line totals.
7. Apply invoice-level discount only according to configured allocation policy.
8. Apply invoice-level charges if enabled.
9. Apply explicit round-off policy.
10. Compute grand total.
11. Apply valid payment allocations.
12. Compute outstanding balance.

The exact policy must be documented and tested. Do not assume one calculation order is legally correct for every jurisdiction.

## 7.3 Stock calculation sequence

For stock-affecting operations:
1. Authenticate and authorize.
2. Validate organization, branch, warehouse and product scope.
3. Validate document state and idempotency key.
4. Lock or atomically reserve the relevant stock.
5. Validate available quantity and tracking requirements.
6. Insert immutable stock movement records.
7. Update derived balance or let a transaction-safe projection process update it.
8. Record valuation/cost effects.
9. Commit all related records atomically.
10. Publish realtime notification only after commit.

---

# 8. UI/UX AND DESIGN SYSTEM

## 8.1 Experience principles

- Premium, modern, professional business software
- Clear information hierarchy
- Fast navigation for frequent cashier and inventory tasks
- Consistent components and spacing
- Responsive layout for mobile, tablet and desktop
- Accessible contrast and keyboard operation
- No cluttered screens or inconsistent popup styling
- Clear loading, empty, error, success and disabled states

## 8.2 Required application shell

- Sidebar navigation with role-aware modules
- Collapsible sidebar
- Top bar with organization/branch selector where permitted
- Global search
- Notification center
- User menu and session actions
- Breadcrumbs
- Main content area
- Responsive mobile navigation

## 8.3 Required screens

1. Login / forgot password / reset password
2. Dashboard
3. Products list and product editor
4. Categories and units
5. Inventory overview and movement ledger
6. Stock adjustment
7. Warehouse and transfer workflows
8. Stock count
9. Suppliers
10. Purchase orders
11. Goods receipt
12. Customers
13. POS / sales checkout
14. Quotations and sales orders
15. Invoice list and invoice detail
16. Payment collection and payment history
17. Returns and refunds
18. Expenses
19. Accounting / ledger views
20. Reports and exports
21. User and role management
22. Organization / branch / tax settings
23. Audit log
24. Profile and security settings

## 8.4 UI behavior requirements

Every interactive element must:
- Have a clear label and purpose.
- Perform its advertised action.
- Show validation errors beside the relevant field.
- Prevent accidental duplicate submissions.
- Display progress while requests are pending.
- Provide success/failure feedback.
- Preserve safe form input when a recoverable server error occurs.
- Respect role permissions.
- Work with keyboard navigation.

Use a consistent design token system for:
- Colors
- Typography
- Spacing
- Radius
- Borders
- Shadows
- Focus states
- Z-index layers
- Responsive breakpoints

Dark and light themes must both be complete, including modals, dropdowns, tooltips, tables, charts, toasts and nested panels. Do not implement dark mode only on the page background.

## 8.5 Accessibility

Target WCAG 2.2 AA practices where feasible:
- Semantic HTML
- Visible focus
- Labelled controls
- Sufficient contrast
- Keyboard-operable dialogs and menus
- Error text that is not color-only
- Appropriate ARIA only where native semantics are insufficient
- Reduced-motion support

---

# 9. REALTIME, CONCURRENCY AND OFFLINE BEHAVIOR

## 9.1 Realtime

Realtime updates may include:
- Stock balance changes
- Sales and invoice status
- Payment status
- Purchase approval/receipt status
- Notifications
- User/session administrative events

Requirements:
- Subscribe only to data the current user is authorized to see.
- Treat realtime messages as notifications, not as the authoritative record.
- Re-fetch the canonical record after important events.
- Handle reconnects, duplicate events and out-of-order delivery.
- Avoid leaking tenant data through broad subscriptions.
- Do not show “live” if the connection is disconnected or stale.

## 9.2 Concurrency

Protect against:
- Two cashiers selling the same last unit
- Duplicate checkout after a browser retry
- Two users receiving the same purchase order line
- Concurrent invoice number allocation
- Simultaneous payment allocation
- Repeated webhook delivery
- Concurrent approval or void actions

Use transactions, constraints, idempotency, locks and optimistic concurrency/version fields as appropriate.

## 9.3 Offline behavior

A limited offline experience may cache non-sensitive reference data and unsent drafts. Do not promise offline posting of authoritative stock or financial transactions unless a robust conflict-resolution and reconciliation design is implemented.

Clearly distinguish:
- Saved locally
- Pending sync
- Synced
- Failed sync
- Conflict requiring user action

Never display a locally queued invoice as a finalized issued invoice.

---

# 10. SECURITY, PRIVACY AND GOVERNANCE

## 10.1 Security baseline

- TLS for all production traffic
- Secure token verification
- Least-privilege database access
- RLS on tenant-owned data
- Parameterized SQL
- Input validation at API boundary and domain layer
- Output encoding in frontend
- CSRF protection where cookie-based authentication is used
- CORS allowlist
- Rate limiting
- Request body size limits
- Secure headers
- Secret management through deployment environment
- Dependency and compiler security checks
- Safe error messages
- Audit trail
- Backup and recovery plan

## 10.2 Threats to test

- Broken access control / IDOR
- Cross-tenant data leakage
- Privilege escalation
- SQL injection
- Stored/reflected XSS
- CSRF where applicable
- Brute force and credential stuffing
- Token replay and expiry bypass
- Duplicate payment or checkout
- Race-condition stock overselling
- Malicious file upload
- CSV formula injection on exports
- Excessive data exposure
- Sensitive data in logs
- Insecure direct object references to stored files
- Misconfigured CORS
- Secrets committed to Git

## 10.3 File upload security

- Allowlist file types and verify content signatures where possible.
- Enforce file size limits.
- Generate storage object names server-side.
- Store metadata and ownership.
- Use short-lived signed URLs for private files.
- Do not trust filename extensions.
- Scan files where a suitable service is available.
- Prevent one tenant from reading another tenant's files.

## 10.4 Privacy

Collect only data needed for business workflows. Restrict personal and financial data by role. Define retention and deletion policies with applicable legal requirements. Avoid logging full customer details, credentials, access tokens or payment secrets.

---

# 11. PERFORMANCE AND RELIABILITY

## 11.1 Performance principles

- Paginate large lists.
- Use database indexes based on query plans.
- Avoid N+1 query patterns.
- Aggregate reports in PostgreSQL or a dedicated reporting path.
- Cache only data with a clear invalidation strategy.
- Avoid loading entire stock ledgers into the browser.
- Use lazy loading for images and long tables.
- Compress static assets.
- Set request and database timeouts.
- Measure before optimizing.

## 11.2 Observability

Provide:
- Structured backend logs
- Request/correlation IDs
- Health endpoint
- Readiness endpoint
- Database connectivity monitoring
- Error rate and latency monitoring
- Failed job/import tracking
- Audit events
- Deployment/build logs

Do not include credentials or secrets in observability payloads.

## 11.3 Failure handling

- Retry only operations safe to retry.
- Use idempotency keys for non-idempotent writes.
- Never retry a payment or stock post blindly.
- Use bounded retries with backoff for transient errors.
- Return actionable errors to the UI.
- Keep transaction boundaries clear.
- Do not swallow errors or report success after a failed database write.

---

# 12. IMPORT, EXPORT AND DOCUMENT GENERATION

## 12.1 Imports

Support CSV import for products, customers and suppliers initially.

Import workflow:
1. Upload file.
2. Validate format and size.
3. Preview detected columns.
4. Map columns.
5. Validate each row.
6. Show row-level errors.
7. Confirm import.
8. Execute in controlled batches.
9. Provide success/failure summary.
10. Preserve an import job record.

Imports must be idempotent or have a clear duplicate-handling policy.

## 12.2 Exports

Support permission-controlled CSV exports. Prevent spreadsheet formula injection by escaping dangerous leading characters. Large exports should be asynchronous and downloadable through expiring signed URLs.

## 12.3 PDF and print

Invoice/receipt PDFs must use stored invoice snapshots, not current mutable product/customer records. Ensure currency, tax components, invoice number, business details and totals are consistent with the posted record.

---

# 13. TESTING AND QUALITY GATES

## 13.1 C unit tests

Test pure domain functions without requiring HTTP or live database:
- Money arithmetic and overflow
- Quantity and unit conversion
- Discount boundaries
- Tax component calculations
- Invoice totals and rounding
- Payment allocation
- Outstanding balance
- Stock availability
- Stock movement validation
- Costing method
- Return quantity eligibility
- Journal balancing
- Reorder calculations
- Approval thresholds

Include boundary, invalid, zero, negative, maximum and overflow cases.

## 13.2 Backend integration tests

Test:
- Authenticated API access
- Authorization denial
- Database transaction rollback
- Stock posting
- Duplicate idempotency key
- Concurrent stock checkout
- Invoice issue and immutability
- Partial payment and allocation
- Return and refund
- Tenant isolation
- Audit event creation
- File access controls

## 13.3 Frontend tests

Test:
- Login and session expiry UX
- Form validation
- Role-aware navigation
- Loading/empty/error states
- POS flow
- Responsive layouts
- Modal and dropdown behavior
- Keyboard navigation
- API error handling

## 13.4 End-to-end acceptance workflows

At minimum automate or document:
1. Create organization and branch.
2. Create a user and assign a role.
3. Create category, unit and product.
4. Create supplier and purchase order.
5. Receive goods and verify stock ledger/balance.
6. Create customer.
7. Sell product through POS.
8. Verify invoice, tax, stock deduction and journal.
9. Record partial payment.
10. Verify outstanding balance.
11. Complete a return and refund/credit.
12. Transfer stock between warehouses.
13. Run a stock count and approve variance.
14. Generate reports.
15. Attempt unauthorized cross-branch and cross-tenant access.
16. Verify audit events.

## 13.5 Build and static analysis

Use:
- Strict compiler warnings (`-Wall -Wextra -Wpedantic` and suitable additional warnings)
- AddressSanitizer and UndefinedBehaviorSanitizer in development/test builds where supported
- Static analysis appropriate to the toolchain
- Dependency vulnerability checks
- Formatting/lint checks
- SQL migration validation
- Frontend lint and tests
- CI build and test gates

Do not suppress warnings broadly. Explain and narrowly suppress unavoidable warnings.

---

# 14. DEPLOYMENT AND ENVIRONMENT MANAGEMENT

## 14.1 Environments

Separate:
- Local development
- Test/CI
- Staging/demo
- Production

Use separate database projects or isolated schemas/credentials. Never point test scripts at production by default.

## 14.2 Environment variables

Create `.env.example` with names and safe placeholders only. Example categories:
- `APP_ENV`
- `APP_PORT`
- `APP_LOG_LEVEL`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (frontend-safe only when intended)
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never frontend)
- `AUTH_JWT_AUDIENCE`
- `CORS_ALLOWED_ORIGINS`
- `STORAGE_BUCKET`
- `RATE_LIMIT_*`

The exact variables depend on the chosen auth and database integration. Document which process consumes each variable. Do not commit real values.

## 14.3 Deployment topology

Recommended:
- Frontend: Vercel static hosting.
- C backend: container/native-process host with persistent process support.
- Database/Auth/Realtime/Storage: Supabase.
- Source: GitHub.
- CI: GitHub Actions.

Before choosing a C hosting provider, verify:
- Native C binary/container support
- Persistent process behavior
- Sleep/idle policy
- Memory and CPU quotas
- Outbound database connectivity
- TLS and custom domain support
- Logs and health checks
- Free-tier limitations and current pricing

A free tier may sleep, impose usage limits or change. Document the actual tested configuration. Do not build a critical workflow around an unverified “free forever” assumption.

## 14.4 Docker

Provide a reproducible backend Dockerfile using a multi-stage build:
- Build stage with compiler and dependencies
- Runtime stage with only required runtime libraries
- Non-root runtime user
- Minimal base image
- Health check
- No secrets baked into image
- Predictable signal handling

Provide local compose configuration for backend and any local dependencies required for development. Supabase cloud can remain the managed database/auth option.

## 14.5 CI/CD

On pull request:
1. Format/lint checks
2. C compile
3. C unit tests
4. Sanitizer tests where supported
5. Frontend lint/build/tests
6. Database migration checks
7. API contract checks
8. Dependency/security scan

On protected branch:
- Build versioned artifacts
- Deploy frontend
- Deploy backend through its supported host
- Run post-deployment health checks
- Record commit SHA and deployment version

Do not auto-run destructive migrations without review and backup strategy.

## 14.6 Backup and recovery

Document:
- Database backup schedule and retention
- Point-in-time recovery availability by plan
- Storage object backup approach
- Migration rollback or forward-fix strategy
- Recovery owner and procedure
- Restore test frequency

A backup is not proven until a restore has been tested.

---

# 15. IMPLEMENTATION PHASES

## Phase 0 — Repository and feasibility audit
- Inspect existing repository and preserve existing work.
- Identify actual languages, build tools, routes, APIs and database state.
- Confirm C toolchain and selected HTTP/DB libraries.
- Confirm hosting feasibility for native C service.
- Produce architecture decision records.
- Do not overwrite user data or secrets.

**Exit gate:** documented baseline, build succeeds, architecture and deployment choices validated.

## Phase 1 — Foundation
- Repository structure
- C build system
- Logging/configuration
- HTTP server and middleware
- Database connection and migrations
- Auth token verification
- Organization/branch membership
- RLS and permission foundation
- Frontend design system and app shell

**Exit gate:** authenticated user can load authorized profile and organization data from the real database.

## Phase 2 — Catalog and inventory
- Products/categories/units
- Warehouses/bins
- Stock ledger
- Opening stock
- Adjustments
- Transfers
- Stock counts
- Costing foundation

**Exit gate:** stock operations are transactional, auditable and concurrency-safe.

## Phase 3 — Procurement
- Suppliers
- Purchase orders
- Approvals
- Goods receipts
- Supplier invoices
- Purchase returns

**Exit gate:** purchase receipt changes inventory correctly and can be traced to source documents.

## Phase 4 — Sales and billing
- Customers
- Quotations
- Sales orders
- POS
- C pricing/tax engine
- Invoice issue
- PDF/print
- Payments and allocations

**Exit gate:** end-to-end sale produces correct invoice, stock movement and payment state.

## Phase 5 — Returns and accounting
- Returns/refunds
- Credit notes
- Chart of accounts
- Journals
- General ledger
- Trial balance
- Expenses

**Exit gate:** all posted financial records balance and link to source documents.

## Phase 6 — Reports and governance
- Dashboards
- Reports and exports
- Audit trail
- Notifications
- User/role management
- Approval workflows

**Exit gate:** report totals reconcile with transactional records; permissions verified.

## Phase 7 — Hardening and release
- Security tests
- Concurrency tests
- Performance checks
- Accessibility review
- Responsive QA
- Backup/restore test
- Documentation
- Deployment validation

**Exit gate:** all P0/P1 acceptance criteria pass and release evidence is recorded.

---

# 16. PRIORITY CLASSIFICATION

## P0 — Must work for capstone release
- C-native backend and C domain engine
- Authenticated API
- Organization/branch boundary
- Product CRUD
- Customer/supplier CRUD
- Warehouse setup
- Stock ledger and balances
- Purchase order and goods receipt
- Sales/POS
- C-based invoice/tax/discount calculation
- Invoice issue and PDF/print
- Payment receipt and allocation
- Core reports
- RBAC and audit trail
- PostgreSQL persistence
- Responsive frontend
- Automated tests and deployment instructions

## P1 — Strong enterprise baseline
- Multiple branches/warehouses
- Approval workflows
- Stock transfers/counts
- Returns and credit notes
- Batch/serial/expiry tracking
- Realtime notifications
- Accounting journal and trial balance
- CSV import/export
- Advanced filters and dashboards
- 2FA and session administration

## P2 — Advanced extensions
- FIFO cost layers
- Barcode scanner integration
- Purchase RFQ comparison
- Multi-currency
- Advanced forecasting
- External payment gateway
- Email/SMS automation
- Offline draft queue
- Manufacturing/BOM
- Advanced BI and custom report builder

Do not label P1/P2 features as completed unless they are implemented, tested and available.

---

# 17. ACCEPTANCE CRITERIA

## 17.1 C-core acceptance
- Core business calculations are implemented in C source files.
- C modules are independently buildable/testable.
- HTTP handlers call C domain services; business rules are not duplicated in JavaScript.
- C tests cover money, tax, stock, payment, return and journal rules.
- Build instructions work on a clean machine.
- Memory and undefined-behavior checks are run where supported.
- The academic report maps each major requirement to C files and functions.

## 17.2 Data acceptance
- All committed records persist in PostgreSQL.
- Browser refresh does not erase data.
- No production workflow relies on localStorage as its database.
- Foreign keys and constraints reject invalid relationships.
- RLS/authorization tests prevent cross-tenant data access.
- Migrations can build a clean database from scratch.

## 17.3 Workflow acceptance
- Receiving goods increases stock exactly once.
- A sale decreases stock exactly once.
- Duplicate API retries do not duplicate invoices, movements or payments.
- Issued invoice snapshots remain stable if product/customer master data changes later.
- Payment allocation and outstanding balance reconcile.
- Returns respect original sold quantities and configured disposition.
- Posted journals balance.
- Failed multi-step transactions roll back completely.

## 17.4 UI acceptance
- All P0 screens work on desktop and mobile.
- Forms validate and display server errors.
- Loading, empty and failure states exist.
- Theme is consistent across all nested UI components.
- No dead buttons or fake success messages.
- Role restrictions are reflected in the UI and enforced by the API.

## 17.5 Security acceptance
- No service-role key or database secret is shipped to the browser.
- All protected endpoints verify identity and permission.
- Cross-tenant and cross-branch tests pass.
- SQL injection tests pass.
- File access is tenant-scoped.
- Logs do not contain secrets.
- Rate limits and safe request limits are configured.

---

# 18. ACADEMIC SUBMISSION PACKAGE

The project must include:
1. Project abstract
2. Problem statement
3. Objectives and scope
4. Existing-system limitations
5. Proposed-system overview
6. Architecture diagram
7. Module description
8. Database ER diagram
9. DFD / flowcharts for key workflows
10. C data structures and function descriptions
11. Algorithms for stock posting, invoice calculation and payment allocation
12. Sample input/output
13. Test cases and results
14. Screenshots of working application
15. Limitations and future enhancements
16. Conclusion
17. References and tool/library acknowledgements

## 18.1 Required C demonstrations

Prepare demonstrable examples:
- Product record represented using `struct`
- Enumerated stock movement/document states
- Search/filter or lookup logic
- Safe dynamic allocation and cleanup
- Invoice calculation function
- Tax calculation function
- Stock availability and movement validation
- Payment allocation calculation
- Journal balance validation
- File import parsing and row validation

Each example must be part of the actual application code where possible, not a disconnected classroom snippet created only for the report.

---

# 19. RISKS AND MITIGATIONS

| Risk | Impact | Mitigation |
|---|---|---|
| Native C hosting unavailable on chosen free tier | Backend cannot remain online | Validate provider early; use container/native host; document local/demo fallback |
| Supabase free-tier quotas | Service interruption or limits | Monitor usage, design efficient queries, document plan limits and backup options |
| C memory safety defects | Crashes or data corruption | Strict warnings, sanitizers, tests, ownership rules and code review |
| Incorrect tax rules | Financial/compliance errors | Configurable rules, tests and qualified review before production |
| Concurrent stock updates | Overselling or inconsistent balances | Transactions, locks, constraints and idempotency |
| Frontend duplicates business logic | Inconsistent totals | C backend is sole authority; frontend only previews |
| Scope too large for capstone timeline | Incomplete implementation | P0/P1/P2 staging and release gates |
| Realtime event gaps | Stale UI | Re-fetch canonical records and reconcile on reconnect |
| Poor secret management | Data breach | Environment secrets, least privilege and secret scanning |
| Unverified backups | Irrecoverable loss | Scheduled restore drills and documented recovery |

---

# 20. MASTER AI CODING-AGENT EXECUTION PROMPT

Use the following prompt with the coding agent that will implement the repository.

---

## MASTER PROMPT — BUILD `CSA0201-B-CAPSTONE-IMBS`

You are the principal software architect, senior C systems programmer, backend engineer, database engineer, frontend engineer, security reviewer and QA lead responsible for implementing **`CSA0201-B-CAPSTONE-IMBS`**.

### Mission

Build a complete, enterprise-quality Inventory Management and Billing System with **C as the primary backend and core business-logic language**. The result must be a real working application with persistent PostgreSQL/Supabase data, secure APIs, a responsive frontend, role-based access, inventory and billing workflows, automated tests and deployment documentation.

### A. Mandatory C-first rule

1. The backend must be a native compiled C service.
2. Core domain decisions and calculations must be implemented in C.
3. Implement C modules for products, inventory, stock ledger, procurement, sales, pricing, discounts, tax, invoices, payments, returns, accounting validations and reporting rules.
4. JavaScript must not become the source of truth for any financial, stock, tax or permission decision.
5. Python may only support scripts, migrations, test data, document processing or optional non-core jobs.
6. WASM is optional and cannot replace the native C backend.
7. Use a maintained C HTTP library and PostgreSQL client library. Verify their current APIs, compatibility, licensing and security posture before selecting them.
8. Provide real C source/header files, build scripts, tests and documentation. Do not fake C integration with a tiny demonstration module.

### B. Start with an audit — do not blindly overwrite

- Inspect the complete repository, current branch, existing files, dependencies, build scripts, routes, APIs, environment-variable names and database migrations.
- Identify what already works and preserve it.
- Do not delete or replace working functionality without a documented reason.
- Do not overwrite `.env`, secrets, user data or database records.
- Create a baseline report listing existing issues, missing features and proposed changes.
- If the repository is empty, initialize the structure described in this PRD.

### C. Architecture

Implement:
- HTML/CSS/JavaScript responsive frontend.
- Native C HTTP/JSON backend.
- PostgreSQL through Supabase as the system of record.
- Secure authentication integration.
- Server-side RBAC and tenant/branch authorization.
- PostgreSQL RLS and constraints.
- Supabase Realtime for authorized updates where appropriate.
- Supabase Storage for private files.
- GitHub CI and separate frontend/backend deployment.

Validate hosting before committing to a deployment design. Vercel may host the frontend, but do not assume it supports a persistent native C process. Use a compatible native-process/container host for the C service and document actual free-tier limits. Never claim a deployment is live unless it has been verified.

### D. Implement real modules

Implement the P0 requirements in this PRD first:
- Authentication and session lifecycle
- Organizations, branches and warehouses
- Roles and permissions
- Dashboard backed by real data
- Product/category/unit CRUD
- Customers and suppliers
- Inventory ledger, balances, adjustments and transfers
- Purchase orders and goods receipt
- Sales/POS and checkout
- C-based pricing, discounts and tax calculation
- Invoice issue, print/PDF and immutable snapshots
- Payments and allocations
- Core reports
- Audit trail
- Responsive UI

Then implement P1 and P2 in priority order. Keep unfinished modules clearly marked as not implemented; never show fake data as real.

### E. Data integrity

- Design migrations before application queries.
- Use foreign keys, unique constraints, check constraints and indexes.
- Use UUID identifiers.
- Use UTC timestamps.
- Use fixed-point/integer money.
- Make stock and financial writes transactional.
- Use idempotency keys for checkout, invoice issue, payment, refund, receipt and webhook operations.
- Use immutable ledgers and reversal workflows.
- Protect concurrent stock updates.
- Keep invoice/customer/product snapshots.
- Ensure every posted journal balances.
- Make RLS and server-side tenant authorization mandatory.
- Test negative authorization paths, not only successful paths.

### F. Security

Perform a threat review and implement:
- Token verification
- Permission checks on every protected route
- Tenant/branch isolation
- Parameterized SQL
- Input validation
- Safe output handling
- CORS allowlist
- Rate limiting
- Request size limits
- Secure headers
- Secret management
- Safe file uploads
- Audit events
- Safe error responses
- No credentials in logs or frontend bundles

Do not put a Supabase service-role key, database password, signing key or other server secret in frontend code, Git or public configuration.

### G. Frontend quality

Create a cohesive professional UI:
- Responsive desktop/tablet/mobile layout
- Role-aware navigation
- Consistent typography, spacing, colors, borders and radii
- Complete light/dark theme
- Accessible forms and dialogs
- Search, filters, pagination and sorting
- Loading, empty, error and success states
- Confirmation for destructive actions
- No dead buttons, fake success messages or placeholder metrics
- Consistent modal, dropdown, popup, table and nested-panel styling

All screens must use real API data. Keep client-side validation for usability, but repeat all critical validation in C.

### H. Engineering quality

- Use modular C source and header files.
- Use a reproducible CMake or Make build.
- Compile with strict warnings.
- Add unit, integration and end-to-end tests.
- Use AddressSanitizer/UndefinedBehaviorSanitizer where supported.
- Test overflow, boundary cases and malformed input.
- Add database migration tests.
- Maintain an OpenAPI specification.
- Add CI checks for C, frontend, migrations, tests and dependency security.
- Keep code readable, documented and maintainable.
- Avoid unnecessary abstractions and avoid one giant source file.

### I. Required implementation workflow

For every phase:
1. Inspect current state.
2. State the concrete implementation plan.
3. Implement the feature end to end.
4. Add or update migrations.
5. Add C unit tests and API integration tests.
6. Add frontend states and error handling.
7. Run build, lint and tests.
8. Fix failures before moving on.
9. Update documentation.
10. Report changed files and verification evidence.

Do not stop after producing a plan. Continue implementing until the available scope is complete or a genuine external blocker is reached.

### J. Final verification report

At completion, provide:
- Implemented modules and their status
- Architecture and technology decisions
- C source files implementing each core business rule
- Database migrations and RLS policies
- API endpoint inventory
- Build and test commands
- Actual test results (passed/failed/skipped)
- Security checks performed and unresolved risks
- Deployment URLs only if verified
- Required environment variables (names only; never reveal values)
- Known limitations
- Exact steps to run locally and deploy

Never fabricate test results, deployment status, integrations, data or screenshots. If a requirement cannot be completed, explain the exact blocker and leave the project in a buildable, documented state.

**Primary acceptance rule:** the application must prove that C is the real backend/domain engine, PostgreSQL is the persistent source of truth, and the frontend is a client—not a mockup pretending to be a finished system.

---

# 21. FINAL RELEASE CHECKLIST

## Product
- [ ] Project name is exactly `CSA0201-B-CAPSTONE-IMBS` in documentation and project metadata.
- [ ] P0 workflows work end to end.
- [ ] No fake production data or fake success states.
- [ ] Mobile and desktop layouts are usable.

## C implementation
- [ ] Native C backend starts and serves API requests.
- [ ] Core domain rules are implemented in C.
- [ ] C unit tests pass.
- [ ] Strict compiler warnings reviewed.
- [ ] Sanitizer/static-analysis results recorded.
- [ ] Academic C module documentation is complete.

## Database and security
- [ ] Clean migrations work.
- [ ] RLS policies are enabled and tested.
- [ ] Cross-tenant access is denied.
- [ ] Stock and financial operations are transactional.
- [ ] Idempotency tests pass.
- [ ] Secrets are absent from source and frontend bundles.

## Quality and deployment
- [ ] Frontend build passes.
- [ ] Backend build passes.
- [ ] Integration and E2E tests pass.
- [ ] Backup and restore procedure documented.
- [ ] Deployment topology is verified.
- [ ] README and user guide are complete.
- [ ] Known limitations are disclosed.

---

# 22. PRODUCT BOUNDARIES AND IMPORTANT DISCLAIMERS

This PRD defines a robust capstone and a foundation for a commercial application. It does not by itself certify legal, tax, accounting, privacy or regulatory compliance. Before real commercial use, review jurisdiction-specific GST/invoicing rules, accounting treatment, privacy obligations, data retention, payment-provider requirements and security controls with qualified professionals.

The system should be implemented incrementally. A smaller set of fully working, tested workflows is more valuable than a large collection of incomplete screens. Prioritize correctness, data integrity, security and demonstrable C implementation over feature count.

**Canonical project identity:** `CSA0201-B-CAPSTONE-IMBS`  
**Core engineering identity:** C-first native backend + PostgreSQL/Supabase + responsive web frontend  
**Release principle:** real functionality, verified behavior, transparent limitations.
