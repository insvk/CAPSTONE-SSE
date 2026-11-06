# Security Architecture & Threat Model: CSA0201-B-CAPSTONE-IMBS

**Project Title:** High-Performance Enterprise Inventory Management & Billing System  
**Canonical Identity:** `CSA0201-B-CAPSTONE-IMBS`  
**Security Standard:** Enterprise Financial Data Protection & OWASP Top 10 Compliance  
**Revision:** Version 1.0 (Academic Capstone Defense Edition)

---

## 1. Threat Model & Security Philosophy

Financial systems are primary targets for computational tampering, rounding theft (e.g., salami slicing attacks), unauthorized price overrides, privilege escalation, and multi-tenant data leakage. `CSA0201-B-CAPSTONE-IMBS` enforces defense-in-depth across the application lifecycle:

```
[ Inbound HTTP / TLS ]
         |
         v
+-----------------------------------------------------------+
| Layer 1: Network & Boundary Defense                       |
|   - HTTP Request Bounds (64 KB ceiling)                   |
|   - Strict Header Sanitization & Content-Type validation  |
+-----------------------------------------------------------+
         |
         v
+-----------------------------------------------------------+
| Layer 2: Memory & C Native Arithmetic Protection         |
|   - Signed 64-bit integer overflow detection              |
|   - Half-up rounding against truncation drift             |
|   - Bounded string copies & re-entrant pure domain logic  |
+-----------------------------------------------------------+
         |
         v
+-----------------------------------------------------------+
| Layer 3: Role-Based Access Control & Invariant Policies   |
|   - Mandatory Manager Override for discounts > 20%        |
|   - Strict double-entry balance validation                |
+-----------------------------------------------------------+
         |
         v
+-----------------------------------------------------------+
| Layer 4: Database Multi-Tenancy & Row-Level Security      |
|   - PostgreSQL Row-Level Security (RLS) by org_id         |
|   - Parameterized SQL (Zero SQL injection surface)        |
|   - Immutable append-only movement and audit ledgers      |
+-----------------------------------------------------------+
```

---

## 2. Memory Safety & Integer Arithmetic Defenses

### 2.1. Protection Against Arithmetic Overflow & Underflow
In high-volume enterprise systems, an adversary may manipulate item quantities or unit prices to trigger 64-bit integer overflow, wrapping positive balances into negative values.  
`CSA0201-B-CAPSTONE-IMBS` rejects any operation that would exceed `INT64_MAX` ($9,223,372,036,854,775,807$) or fall below `INT64_MIN`:
```c
// Pre-condition checking in backend/include/common.h
if ((b > 0 && a > INT64_MAX - b) || (b < 0 && a < INT64_MIN - b)) {
    return IMBS_ERR_OVERFLOW;
}
```

### 2.2. Elimination of Buffer Overruns
- The HTTP server allocates fixed bounded buffers for inbound requests (`64 KB`).
- JSON strings are parsed with `cJSON`, which verifies null-termination and enforces strict length tracking.
- Outbound responses allocate heap buffers scaled precisely to response length and are freed immediately after socket transmission.

---

## 3. Role-Based Access Control (RBAC) Matrix

Access permissions are enforced strictly across five enterprise user roles:

| Action / Operation | Admin | Store Manager | Cashier | Accountant | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|
| **POS Sales Checkout** | Yes | Yes | Yes | No | No |
| **Apply Standard Discount ($\le 20\%$)** | Yes | Yes | Yes | No | No |
| **Authorize Discount Override ($> 20\%$)** | Yes | Yes | No | No | No |
| **Process Sales Returns & Credit Notes** | Yes | Yes | No | No | No |
| **Create & Edit Product Master Catalog** | Yes | Yes | No | No | No |
| **Manual Stock Cycle Adjustments** | Yes | Yes | No | No | No |
| **Warehouse-to-Warehouse Stock Transfer** | Yes | Yes | No | No | No |
| **Post Goods Receipt Note (GRN)** | Yes | Yes | No | No | No |
| **Create Manual Journal Entries** | Yes | No | No | Yes | No |
| **View Financial Reports & Trial Balance** | Yes | Yes | No | Yes | Yes |
| **Audit Log Inspection** | Yes | No | No | No | Yes |

---

## 4. Multi-Tenant Isolation & Row-Level Security (RLS)

Every database table contains an `organization_id` foreign key. Row-Level Security (RLS) policies in PostgreSQL guarantee that queries cannot read or write data belonging to another tenant:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY tenant_isolation_policy ON products
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID);
```

---

## 5. Audit Logging & Non-Repudiation

All state-modifying actions are written to an append-only `audit_events` table:
- **Timestamp:** UTC ISO 8601 timestamp generated at the database level (`NOW()`).
- **Actor:** User UUID and operating role.
- **Client IP & User Agent:** Extracted from HTTP socket headers.
- **Payload Snapshot:** Pre-mutation and post-mutation JSON state snapshots for forensic reconstruction.

---
*End of Security Specification.*

