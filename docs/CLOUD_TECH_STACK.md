# Cloud & Technical Architecture Stack: CSA0201-B-CAPSTONE-IMBS
### Enterprise Inventory Management & Billing System
**Canonical Identifier:** `CSA0201-B-CAPSTONE-IMBS` | **Revision:** v1.0 Production Ready

---

## 1. Executive Stack Summary

| Layer | Primary Technology | Hosting / Cloud Provider | Key Role |
|---|---|---|---|
| **Edge / CDN** | Vercel Edge Network | Vercel (Global Anycast) | Global SSL termination, static caching, <50ms TTFB |
| **Frontend UI** | HTML5 / CSS3 / Vanilla JS (ES6+) | Vercel Static Hosting | Tabler Dark UI, POS register, charts, C Inspector |
| **Serverless API** | Node.js 18+ Serverless Engine | Vercel Serverless Functions | REST gateway, request routing, Supabase PostgREST client |
| **Domain Engine** | Pure ANSI C (C17 / GCC 15.2) | Native Binary / Docker Container | Microsecond fixed-point math, GST, WAC, double-entry ledger |
| **Cloud Database** | PostgreSQL 16 | Supabase Managed Cloud | 40+ normalized tables, RLS security, views, audit trail |
| **Auth & Security** | Supabase Auth (JWT / RBAC) | Supabase Cloud | Role-based tokens (Admin, Manager, Cashier, Auditor) |
| **Containers / IaaS** | Docker (Alpine 3.19) / Docker Compose | Railway / Render / AWS / GCP / Self-Hosted | Lean (~15MB) containerized native C backend |
| **CI / CD Pipeline** | GitHub Actions | GitHub Cloud Runners | Multi-OS test matrix (Ubuntu + Windows MSYS2) |

---

## 2. Cloud Infrastructure & Hosting Tier

### A. Vercel Cloud Platform (Edge & Serverless)
* **Configuration:** [`vercel.json`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/vercel.json)
* **Edge Delivery:** Global Anycast CDN serving `public/` and `frontend/` assets with automated gzip/brotli compression.
* **Serverless Functions:**
  * Route: `/api/index.js` configured with `1024 MB` memory and `15s` execution timeout.
  * URL Rewrites: Clean routing from `/api/v1/*` to the serverless function.
  * Cache Policy: Explicit `no-cache, no-store, must-revalidate` on transactional endpoints.
* **Hybrid Routing Modes:**
  1. **Direct Cloud Mode:** Serverless functions communicate with Supabase via PostgREST.
  2. **C Proxy Mode:** When `BACKEND_URL` is set, Vercel transparently forwards requests to the containerized C server.

### B. Supabase Cloud (Managed PostgreSQL 16)
* **Configuration:** [`supabase/config.toml`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/supabase/config.toml) & [`database/supabase_setup.sql`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/database/supabase_setup.sql)
* **Database Engine:** PostgreSQL 16 with extensions `uuid-ossp` and `pgcrypto`.
* **Data Guarantee:** 64-bit integer minor units (`BIGINT` cents/paise) and basis points (`INTEGER` $10000 = 100\%$) eliminating floating-point drift.
* **Row Level Security (RLS):** Policies enforced per table for multi-tenant isolation.
* **Cloud PostgREST Layer:** Auto-generated low-latency REST endpoints over database tables.
* **Materialized / SQL Views:** Pre-aggregated queries for instant dashboard metrics:
  * `v_dashboard_summary`
  * `v_inventory_valuation`
  * `v_trial_balance`

---

## 3. Core Compute & Containerization Tier

### A. Native C17 Domain Backend
* **Language & Standard:** ISO C17 (`-std=c17`), compiled via GCC 15.2 / Clang with `-O3` optimizations.
* **HTTP Socket Server:** Zero-dependency, non-blocking TCP socket engine supporting Windows (Winsock2) and Linux (POSIX sockets).
* **Payload Serialization:** Ultra-fast ANSI C JSON handling via `cJSON`.
* **Memory & Footprint:** ~205 KB native executable, zero runtime VM overhead, sub-microsecond calculation latency.

### B. Docker & Container Orchestration
* **Multi-Stage Dockerfile:** [`infra/Dockerfile.backend`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/infra/Dockerfile.backend)
  * **Stage 1 (Builder):** `alpine:3.19` compiles C domain code, builds, and executes the 41-test unit suite at build time.
  * **Stage 2 (Runner):** Minimal `alpine:3.19` runner (~15 MB footprint), non-root execution (`imbsuser:imbsgroup`).
* **Docker Compose:** [`infra/docker-compose.yml`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/infra/docker-compose.yml) provisions `postgres:16-alpine` alongside `imbs_backend` on an isolated bridge network with automated health checks.
* **Reverse Proxy:** [`infra/nginx.conf`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/infra/nginx.conf) for production SSL termination and load balancing.

---

## 4. Frontend & Client-Side Cloud Integration

* **Design Framework:** Tabler Dark UI (`#0e1726` deep slate, `#182433` card slate, `#206bc4` electric blue).
* **Zero Heavy Frameworks:** Pure Vanilla JavaScript (ES6+), zero Webpack/Babel compile step, zero bundle bloat.
* **Hardware & Visualization Libraries:**
  * `JsBarcode` (`v3.12.3`) – Real-time SKU barcode generation.
  * `QRCode.js` (`v1.5.4`) – UPI / payment dynamic QR code generation.
  * HTML5 Canvas 2D – Lightweight client-side sparklines and radial progress gauges.
* **Cloud Client Bridge:** [`public/js/supabase_client.js`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/public/js/supabase_client.js) providing direct client-side fetch, JWT token management, and offline calculation fallback.

---

## 5. DevOps, CI/CD & Automation

* **Pipeline Definition:** [`.github/workflows/ci.yml`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/.github/workflows/ci.yml)
* **Automated Test Matrix:**
  * **Ubuntu Latest:** `gcc` native build & automated test execution.
  * **Windows Latest:** MSYS2 `UCRT64` MinGW GCC build & automated test execution.
* **Quality Gate:** Strict build break if any of the 41 domain tests fail (100% pass mandate).
* **Build Utility:** [`scripts/build.js`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/scripts/build.js) verifies syntax, prepares static distribution, and checks environment variables.

---

## 6. Cloud Environment Configuration

| Variable | Environment | Required | Description |
|---|---|---|---|
| `SUPABASE_URL` | Vercel / Node.js | Yes (Cloud Mode) | HTTPS endpoint for Supabase project instance |
| `SUPABASE_ANON_KEY` | Vercel / Client | Yes (Cloud Mode) | Public anonymous JWT client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel / Node.js | Optional | Privileged backend key for admin tasks |
| `BACKEND_URL` | Vercel Serverless | Optional | URL to containerized native C backend proxy |
| `PORT` | C Server / Docker | Optional | Native HTTP server listening port (Default: `8080`) |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Docker Compose | Optional | Direct PostgreSQL connection parameters |

---

## 7. Cloud Architectural Flow Diagram

```
[ User Browser (Desktop / POS / Mobile) ]
                   |
                   | HTTPS (TLS 1.3)
                   v
     +---------------------------+
     |   VERCEL EDGE NETWORK     |  <-- Anycast CDN (<50ms TTFB)
     +---------------------------+
         |                   |
         | Static UI Files   | /api/v1/* API Calls
         v                   v
   [ Tabler Dark UI ]    +-------------------------------+
   [ Vanilla JS App ]    | VERCEL SERVERLESS FUNCTIONS   |
                         | (api/index.js :: Node 18+)    |
                         +-------------------------------+
                                 |               |
               (Cloud PostgREST) |               | (Optional Proxy via BACKEND_URL)
                                 v               v
                +--------------------+   +------------------------------------+
                |  SUPABASE CLOUD    |   | NATIVE C17 BACKEND CONTAINER       |
                |  (PostgreSQL 16)   |   | (Docker / Alpine 3.19 on Railway)  |
                |  - 40+ Tables      |   | - 10 Pure C Domain Subsystems      |
                |  - RLS Policies    |   | - 64-bit Fixed-Point Arithmetic    |
                |  - Realtime & Auth |   | - Sub-microsecond execution        |
                +--------------------+   +------------------------------------+
```

---
*End of Cloud & Technical Architecture Stack Specification.*
