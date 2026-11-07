const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load .env if present
try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value.trim();
            }
        });
    }
} catch (_) {}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Admin@Password26@db.fdtkwdkpanxbuextrpiw.supabase.co:5432/postgres';

async function migrate() {
    console.log('Connecting to Supabase PostgreSQL...');
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected successfully!');

    const sqlPath = path.join(__dirname, '..', 'database', 'supabase_setup.sql');
    console.log(`Reading SQL file from ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL migration script on Supabase...');
    await client.query(sql);

    console.log('Migration executed successfully!');

    // Verify tables
    const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    `);

    console.log('\nVerified tables created in Supabase:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));

    // Verify row counts
    const pCount = await client.query('SELECT COUNT(*) FROM products;');
    const bCount = await client.query('SELECT COUNT(*) FROM inventory_balances;');
    const uCount = await client.query('SELECT COUNT(*) FROM user_profiles;');
    console.log(`\nRow counts: products=${pCount.rows[0].count}, inventory_balances=${bCount.rows[0].count}, user_profiles=${uCount.rows[0].count}`);

    await client.end();
    console.log('\nDatabase migration complete and verified!');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
