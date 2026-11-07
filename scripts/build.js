#!/usr/bin/env node
/**
 * CSA0201-B-CAPSTONE-IMBS :: Vercel & Production Build Verifier
 */

const fs = require('fs');
const path = require('path');

console.log('==============================================================================');
console.log('CSA0201-B-CAPSTONE-IMBS :: Preparing Vercel & Supabase Production Deployment');
console.log('==============================================================================');

const requiredFiles = [
    'frontend/index.html',
    'frontend/css/shadcn-theme.css',
    'frontend/css/pos.css',
    'frontend/css/login.css',
    'frontend/js/app.js',
    'frontend/js/api.js',
    'frontend/js/auth.js',
    'frontend/js/barcode_qr.js',
    'frontend/js/store_config.js',
    'frontend/js/pos_hardware.js',
    'frontend/js/supabase_client.js',
    'frontend/js/charts.js',
    'frontend/js/views/dashboard.js',
    'frontend/js/views/products.js',
    'frontend/js/views/inventory.js',
    'frontend/js/views/pos.js',
    'frontend/js/views/invoices.js',
    'frontend/js/views/customers.js',
    'frontend/js/views/procurement.js',
    'frontend/js/views/accounting.js',
    'frontend/js/views/staff.js',
    'frontend/js/views/audit.js',
    'frontend/js/views/c_inspector.js',
    'api/index.js',
    'database/supabase_setup.sql'
];

let hasErrors = false;

for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) {
        console.error(`[ERROR] Missing critical file: ${file}`);
        hasErrors = true;
    } else {
        const stats = fs.statSync(fullPath);
        console.log(`  [OK] ${file} (${stats.size} bytes)`);
    }
}

if (hasErrors) {
    console.error('\nBuild verification FAILED!');
    process.exit(1);
}

// Synchronize frontend/ -> public/ for zero-config Vercel static hosting
const srcDir = path.join(__dirname, '..', 'frontend');
const destDir = path.join(__dirname, '..', 'public');
fs.cpSync(srcDir, destDir, { recursive: true });
console.log('  [OK] Synchronized frontend/ -> public/ for Vercel static hosting');

console.log('==============================================================================');
console.log('BUILD SUCCESS: Static Frontend & Serverless API Ready for Deployment');
console.log('==============================================================================');

