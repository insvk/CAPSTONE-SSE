# Vercel Production Deployment Guide: CSA0201-B-CAPSTONE-IMBS

**Project Title:** High-Performance Enterprise Inventory Management & Billing System  
**Canonical Identity:** `CSA0201-B-CAPSTONE-IMBS`  
**Target Platform:** Vercel Global Edge Network & Serverless Functions  
**Revision:** Version 1.0 (Production & Academic Capstone Edition)

---

## 1. Overview & Deployment Architecture

`CSA0201-B-CAPSTONE-IMBS` is engineered for zero-configuration, one-click deployment on **Vercel**:
- **Static Frontend:** The entire Tabler Dark UI (`frontend/`) is served globally via Vercel Edge CDN with HTTP caching, sub-50ms TTFB, and zero cold-starts.
- **Serverless API Engine:** [`api/index.js`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/api/index.js) operates as a high-speed Vercel Serverless Function servicing `/api/v1/*`.
- **Hybrid Cloud Versatility:**
  - **Standalone Mode:** Operates out of the box with zero setup using embedded enterprise seed data and pure fixed-point JavaScript arithmetic.
  - **Supabase Cloud Mode:** When `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided, the API reads and writes directly to PostgreSQL 16 on Supabase.
  - **C Backend Proxy Mode:** When `BACKEND_URL` is configured (e.g. pointing to a Docker container or Railway instance), Vercel transparently proxies all requests to the native compiled C server!

---

## 2. Method A: Deploy via GitHub & Vercel Dashboard (Recommended)

### Step 1: Push Repository to GitHub
Ensure all files are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: complete CSA0201-B-CAPSTONE-IMBS with Supabase & Vercel deploy readiness"
git push origin main
```

### Step 2: Import into Vercel
1. Log into [https://vercel.com](https://vercel.com).
2. Click **Add New... > Project** (or visit [https://vercel.com/new](https://vercel.com/new)).
3. Find your repository and click **Import**.

### Step 3: Configure Project Settings
Vercel automatically detects [`package.json`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/package.json) and [`vercel.json`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/vercel.json):
- **Framework Preset:** `Other` (or auto-detected)
- **Root Directory:** `./`
- **Build Command:** `npm run build` (runs [`scripts/build.js`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/scripts/build.js))
- **Output Directory:** Automatically managed by [`vercel.json`](file:///s:/vs%20code/CAPSTONE/CSA0201/INV-MGMT-BILL-SYS%20V0.1/vercel.json)

### Step 4: Configure Environment Variables
Expand the **Environment Variables** section and add:

| Key | Example Value | Purpose |
|---|---|---|
| `SUPABASE_URL` | `https://xyzcompany.supabase.co` | Supabase Cloud PostgreSQL endpoint |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1Ni...` | Supabase public client key |
| `BACKEND_URL` *(Optional)* | `https://imbs-c-backend.up.railway.app` | Target URL if proxying to native C binary |

### Step 5: Deploy
Click **Deploy**. Within ~25 seconds, your application is live at:
```
https://[your-project-name].vercel.app
```

---

## 3. Method B: Deploy via Vercel CLI

If deploying directly from your local terminal:

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Authenticate
vercel login

# 3. Deploy Preview Build
vercel

# 4. Deploy Production Build
vercel --prod
```

Follow the interactive prompts:
- *Set up and deploy?* `Y`
- *Which scope?* Select your personal account or team.
- *Link to existing project?* `N`
- *Project name:* `csa0201-b-capstone-imbs`
- *In which directory is your code located?* `./`

---

## 4. Verification & Post-Deployment Checklist

Once deployed to Vercel:

1. **Verify Health Endpoint:**
   ```bash
   curl https://[your-app].vercel.app/api/v1/health
   ```
   Should return:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "system": "CSA0201-B-CAPSTONE-IMBS",
       "version": "1.0.0-PRO-MAXX",
       "runtime": "Vercel Serverless Function"
     }
   }
   ```

2. **Verify Frontend UI:**
   - Open `https://[your-app].vercel.app` in your browser.
   - Verify that the Tabler Dark interface loads with the deep slate palette (`#0e1726`), header navigation, active users 58% radial canvas gauge, and KPI sparklines.
   - Click on the green **Cloud: Ready** button in the header to view or modify your Supabase credentials dynamically.

3. **Verify POS & Invoicing:**
   - Navigate to **Extra ▾ > POS Checkout**.
   - Add items to the cart, verify real-time quotation calculation, and complete a test checkout.
   - Confirm thermal receipt generation and stock level deduction.

---
*End of Vercel Deployment Guide.*

