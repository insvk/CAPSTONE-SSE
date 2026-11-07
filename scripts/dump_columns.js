const { Client } = require('pg');

async function dumpColumns() {
    const c = new Client({
        connectionString: 'postgresql://postgres:Admin@Password26@db.fdtkwdkpanxbuextrpiw.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    await c.connect();

    const tables = [
        'stock_movement_items',
        'stock_movements',
        'invoices',
        'invoice_lines',
        'suppliers',
        'customers',
        'roles',
        'user_roles',
        'user_profiles',
        'chart_of_accounts',
        'journal_entries',
        'journal_lines',
        'purchase_orders',
        'purchase_order_items',
        'goods_receipt_notes',
        'goods_receipt_items'
    ];

    for (const t of tables) {
        const res = await c.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='public' AND table_name=$1 
            ORDER BY ordinal_position
        `, [t]);
        console.log(`\n=== TABLE: ${t} ===`);
        res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    }

    await c.end();
}

dumpColumns().catch(console.error);

