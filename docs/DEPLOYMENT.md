# Deployment & Operations Guide: CSA0201-B-CAPSTONE-IMBS

**Project Title:** High-Performance Enterprise Inventory Management & Billing System  
**Canonical Identity:** `CSA0201-B-CAPSTONE-IMBS`  
**Targets:** Windows 10/11 (MinGW UCRT64), Linux (Debian/Ubuntu/Alpine), Docker, Supabase  
**Revision:** Version 1.0 (Academic Capstone Defense Edition)

---

## 1. Prerequisites

### 1.1. Native Build Environment
- **C Compiler:** GCC 11+ or Clang 13+ (Supporting ANSI C99 / C11)
- **Make Tool:** GNU Make 4+
- **Database:** PostgreSQL 15+ (or Supabase Cloud instance)
- **Shell:** PowerShell 7+ (Windows) or Bash 5+ (Linux / macOS)

### 1.2. Containerized Environment
- **Docker Engine:** Version 24.0+
- **Docker Compose:** Version 2.20+

---

## 2. Local Native Build (Developer Mode)

### 2.1. Compilation via GCC / Make
From the workspace root (`s:\vs code\CAPSTONE\CSA0201\INV-MGMT-BILL-SYS V0.1`):

```bash
# Navigate to backend directory
cd backend

# Build the production server executable
make

# Execute the complete domain engine test suite
make test
```

### 2.2. Direct GCC Compilation (Without Make)
If GNU Make is not installed, compile directly with GCC:

```bash
# 1. Compile and execute domain unit tests
gcc -O2 -Wall -Wextra -I./backend/include \
  ./backend/src/domain/*.c ./backend/tests/unit/test_domain_engine.c \
  -o ./backend/bin/test_domain_engine.exe

./backend/bin/test_domain_engine.exe

# 2. Compile native C HTTP server
# On Windows (linking ws2_32):
gcc -O3 -Wall -Wextra -I./backend/include \
  ./backend/src/cJSON.c ./backend/src/config.c ./backend/src/domain/*.c \
  ./backend/src/db/db_adapter.c ./backend/src/http_server.c ./backend/src/main.c \
  -lws2_32 -o ./backend/bin/imbs_srv.exe

# On Linux:
# gcc -O3 -Wall -Wextra -I./backend/include \
#   ./backend/src/cJSON.c ./backend/src/config.c ./backend/src/domain/*.c \
#   ./backend/src/db/db_adapter.c ./backend/src/http_server.c ./backend/src/main.c \
#   -o ./backend/bin/imbs_srv
```

### 2.3. Launching the Server
```powershell
# Run the server on port 8080 (serves REST API and Tabler Dark frontend)
.\backend\bin\imbs_srv.exe 8080
```
Open your web browser and navigate to:
```
http://127.0.0.1:8080/
```

---

## 3. Database Migration & Seeding

### 3.1. Local PostgreSQL Initialization
```bash
# Create target database
createdb -U postgres csa0201_imbs

# Execute initial schema migration (40+ tables, constraints, indexes)
psql -U postgres -d csa0201_imbs -f database/migrations/001_initial_schema.sql

# Seed enterprise master catalog, inventory balances, and initial journals
psql -U postgres -d csa0201_imbs -f database/seeds/001_initial_seed.sql
```

### 3.2. Supabase Cloud Setup (One-Click Master Script)
For complete instructions, see the dedicated [Supabase Deployment Guide](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/docs/SUPABASE_DEPLOYMENT.md).

1. Create a new Supabase Project at [https://database.new](https://database.new).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and execute the contents of [`database/supabase_setup.sql`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/database/supabase_setup.sql).
4. All 40+ tables, RLS policies, views (`v_dashboard_summary`, `v_inventory_valuation`, `v_trial_balance`), and master seed data will be created in a single click!
5. In your web application, click the green **Cloud: Ready** button in the header and paste your Supabase Project URL and Anon Key to enable live cloud synchronization.

---

## 4. Vercel Cloud Deployment (One-Click Edge Hosting)
For complete instructions, see the dedicated [Vercel Deployment Guide](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/docs/VERCEL_DEPLOYMENT.md).

1. Push your repository to GitHub.
2. In Vercel, click **Import Project** and select `CSA0201-B-CAPSTONE-IMBS`.
3. Vercel automatically detects [`vercel.json`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/vercel.json) and [`package.json`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/package.json).
4. Add environment variables:
   - `SUPABASE_URL` = `https://[ref].supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJh...`
5. Click **Deploy**. Your app is immediately live on Vercel's Edge Network with serverless API routes!

---

## 5. Containerized Deployment with Docker Compose

The system includes a production-grade multi-stage Dockerfile and Docker Compose orchestration configuration in the `infra/` directory.

### 4.1. Start Stack
```bash
cd infra
docker compose up -d --build
```
This automatically spins up:
- `db`: PostgreSQL 16 Alpine container with automatic schema and seed volume mounting.
- `backend`: Lean compiled C binary running in a lightweight Alpine runtime container, exposing port `8080`.

### 4.2. Verify Container Health
```bash
docker compose ps
curl http://127.0.0.1:8080/api/v1/health
```

---

## 5. Production Hardening Checklist

- [x] **Compiler Optimizations:** Built with `-O3 -DNDEBUG` for maximum CPU register utilization.
- [x] **Stack Protection:** Built with `-fstack-protector-strong` on Linux/GCC.
- [x] **Fixed-Point Arithmetic:** Zero IEEE 754 float types utilized in monetary paths.
- [x] **Port Binding:** Defaults to `127.0.0.1` locally; bind to `0.0.0.0` inside containerized reverse proxy topologies.
- [x] **Reverse Proxy:** Terminate SSL/TLS with Nginx or Caddy reverse proxy forwarding to port `8080`.

---
*End of Deployment Guide.*

