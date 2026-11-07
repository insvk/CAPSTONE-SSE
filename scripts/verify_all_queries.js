const SUPABASE_URL = 'https://fdtkwdkpanxbuextrpiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdGt3ZGtwYW54YnVleHRycGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5NzM5MTksImV4cCI6MjEwOTU0OTkxOX0.MI0VyIiU9uUO1lo9nf_fnTk-htATdRBisZlmM4IelIE';

async function fetchRest(endpoint) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const resp = await fetch(url, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    const text = await resp.text();
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    return JSON.parse(text);
}

async function verifyAll() {
    console.log("=== VERIFYING SUPABASE REST ENDPOINTS WITH EXACT SCHEMA ===");
    const queries = [
        ['products', 'products?select=id,sku,barcode,name,description,base_uom,purchase_price_cents,selling_price_cents,reorder_point,is_active,categories(name),tax_categories(tax_rate_bps)&order=created_at.desc'],
        ['inventory_balances', 'inventory_balances?select=id,warehouse_id,product_id,quantity_on_hand,quantity_reserved,weighted_avg_cost_cents,products(sku,name,reorder_point,selling_price_cents),warehouses(name)&order=quantity_on_hand.desc'],
        ['stock_movements', 'stock_movements?select=id,movement_type,reference_number,created_at,stock_movement_items(quantity_delta,unit_cost_cents,products(sku,name))&order=created_at.desc&limit=50'],
        ['invoices', 'invoices?select=id,invoice_number,invoice_date,subtotal_cents,discount_cents,tax_total_cents,round_off_cents,grand_total_cents,paid_amount_cents,status,is_pos,customers(name)&order=created_at.desc'],
        ['suppliers', 'suppliers?select=id,code,name,contact_person,email,phone,state_code,is_active&order=name.asc'],
        ['customers', 'customers?select=id,code,name,tax_identifier,email,phone,state_code,is_active&order=name.asc'],
        ['staff / user_profiles', 'user_profiles?select=id,full_name,email,job_title,is_active,user_roles(roles(code,name))&order=created_at.asc'],
        ['journal_entries', 'journal_entries?select=id,entry_number,entry_date,source_document,narration,total_debit_cents,total_credit_cents,status,journal_lines(account_id,debit_cents,credit_cents,memo,chart_of_accounts(code,name))&order=entry_date.desc'],
        ['chart_of_accounts', 'chart_of_accounts?select=id,code,name,account_type,is_active&order=code.asc'],
        ['audit_events', 'audit_events?select=id,action,entity_type,entity_id,details,created_at&order=created_at.desc&limit=50']
    ];

    for (const [name, q] of queries) {
        try {
            const data = await fetchRest(q);
            console.log(`[PASS] ${name}: ${data.length} records returned`);
        } catch (err) {
            console.error(`[FAIL] ${name}: ${err.message}`);
        }
    }
}

verifyAll();
