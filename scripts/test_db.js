const { Client } = require('pg');

async function checkDb() {
    const c = new Client({
        connectionString: 'postgresql://postgres:Admin@Password26@db.fdtkwdkpanxbuextrpiw.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    await c.connect();
    console.log("Connected to Supabase PostgreSQL!");
    
    const tables = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log("Tables in public schema:", tables.rows.map(r => r.table_name));

    for (const tbl of ['users', 'roles', 'products', 'inventory_balances', 'stock_movements', 'sales_invoices', 'purchase_orders', 'suppliers', 'customers', 'accounts', 'journal_entries']) {
        try {
            const count = await c.query(`SELECT COUNT(*) FROM ${tbl}`);
            console.log(`Count in ${tbl}:`, count.rows[0].count);
        } catch (e) {
            console.log(`Table ${tbl} error:`, e.message);
        }
    }

    await c.end();
}

checkDb().catch(console.error);
