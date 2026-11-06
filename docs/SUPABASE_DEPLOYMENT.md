# Supabase Production Deployment Guide: CSA0201-B-CAPSTONE-IMBS

**Project Title:** High-Performance Enterprise Inventory Management & Billing System  
**Canonical Identity:** `CSA0201-B-CAPSTONE-IMBS`  
**Target Engine:** PostgreSQL 16 (Supabase Managed Cloud Service)  
**Revision:** Version 1.0 (Production & Academic Capstone Edition)

---

## 1. Overview & Architecture

`CSA0201-B-CAPSTONE-IMBS` utilizes PostgreSQL 16 on Supabase as its enterprise cloud database tier. The database enforces:
- **Integer Minor Units:** All currency stored in `BIGINT` minor units (cents/paise) to guarantee zero IEEE 754 floating-point drift.
- **Basis Points:** All tax rates, discounts, and percentage parameters stored as `INTEGER` basis points ($10000 = 100.00\%$).
- **Row-Level Security (RLS):** Built-in multi-tenant data isolation enabled on all 40+ tables.
- **PostgREST Optimized Views:** Consolidated views (`v_dashboard_summary`, `v_inventory_valuation`, `v_trial_balance`) for instant sub-millisecond query responses.

---

## 2. Method A: One-Click Web Console Setup (Recommended)

This is the fastest method to provision and seed your entire cloud database.

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and log in.
2. Click **New Project** (or navigate directly to [https://database.new](https://database.new)).
3. Enter project details:
   - **Name:** `csa0201-b-capstone-imbs`
   - **Database Password:** Enter a secure password and save it safely.
   - **Region:** Select the region closest to your deployment (e.g., `Mumbai (ap-south-1)` or `Singapore`).
4. Click **Create new project** and wait ~60 seconds for provisioning to complete.

### Step 2: Execute Master Setup Script in SQL Editor
1. In the Supabase Dashboard, click on **SQL Editor** in the left sidebar (icon with `>_`).
2. Click **+ New query**.
3. Open the file [`database/supabase_setup.sql`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/database/supabase_setup.sql) in your local workspace, copy its entire contents, and paste it into the Supabase SQL Editor.
4. Click **Run** (or press `Ctrl + Enter` / `Cmd + Enter`).

### Step 3: Verify Database Provisioning
Upon execution, the script will:
- Enable extensions: `uuid-ossp`, `pgcrypto`.
- Create all 40+ relational tables with foreign keys and checks (`quantity_on_hand >= 0`, `balance_due >= 0`, `debit = credit`).
- Enable Row-Level Security (RLS) on all tables with web-ready access policies.
- Create reporting views: `v_dashboard_summary`, `v_inventory_valuation`, `v_trial_balance`.
- Populate complete Enterprise Master Seed Data (Apex Global Enterprises, warehouses, products with 18%/12% GST, customers, suppliers, inventory balances, and balanced journals).

To verify:
1. Click **Table Editor** in the left sidebar.
2. Confirm that `products`, `inventory_balances`, `invoices`, and `journal_entries` are populated with master records.

### Step 4: Obtain API Credentials
1. Click **Project Settings** (gear icon) in the bottom-left sidebar.
2. Select **API**.
3. Copy the following keys:
   - **Project URL:** `https://[your-project-ref].supabase.co`
   - **anon public key:** `eyJhbGciOi...`
   - *(Optional for backend)* **service_role secret:** `eyJhbGciOi...`

---

## 3. Method B: Supabase CLI Workflow

If you prefer deploying via terminal and CI/CD:

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Authenticate CLI
supabase login

# 3. Link project to your Supabase project ref
supabase link --project-ref [YOUR_PROJECT_REF]

# 4. Push database migrations
supabase db push

# 5. Apply seed data
supabase db reset
```

---

## 4. Connecting Supabase to the Application

### Option 1: In the Live Tabler Dark Web UI (Instant & Zero-Rebuild)
1. Open the web application (locally or on Vercel).
2. Click the green **Cloud: Ready** button in the top navigation bar.
3. The **Cloud Deployment & Supabase Settings** modal opens.
4. Paste your **Supabase Project URL** and **Supabase Anon Public API Key**.
5. Click **Test Connection**: the UI queries Supabase PostgREST and displays a green confirmation:
   `✓ Supabase Connected! Successfully queried PostgreSQL master catalog.`
6. Click **Save & Apply**: the application switches to cloud synchronization!

### Option 2: Environment Variables (`.env`)
For native C backend and local development:
```env
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=eyJh...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Option 3: Vercel Cloud Environment Variables
In your Vercel Project Dashboard:
1. Go to **Settings > Environment Variables**.
2. Add:
   - `SUPABASE_URL` = `https://[YOUR_PROJECT_REF].supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJh...`
3. Redeploy or trigger a git push. The Vercel Serverless API handler will automatically query your Supabase PostgreSQL database!

---

## 5. Security & Row-Level Security (RLS)

All tables in `database/supabase_setup.sql` have RLS enabled. For enterprise production multi-tenant environments, swap the demo policy with strict tenant isolation:

```sql
-- Production Multi-Tenant Isolation by Organization
CREATE POLICY "Tenant isolation policy" ON products
  FOR ALL
  USING (organization_id = (auth.jwt() ->> 'org_id')::UUID);
```

---
*End of Supabase Deployment Guide.*

