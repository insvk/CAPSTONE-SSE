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

async function seedRBAC() {
    console.log('Connecting to Supabase PostgreSQL...');
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // 1. Ensure all 5 standard roles exist
    await client.query(`
        INSERT INTO roles (id, code, name, description)
        VALUES 
            ('40000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Super Administrator', 'Complete access to all tenant operations'),
            ('40000000-0000-0000-0000-000000000002', 'STORE_MANAGER', 'Store Manager', 'Procurement, suppliers, purchase orders, and GRN receipts'),
            ('40000000-0000-0000-0000-000000000003', 'CASHIER', 'POS Cashier', 'Point of sale billing, cashier counter, and sales invoicing'),
            ('40000000-0000-0000-0000-000000000004', 'INVENTORY_MANAGER', 'Inventory Manager', 'Stock balances, movements, catalog, and adjustments'),
            ('40000000-0000-0000-0000-000000000005', 'AUDITOR', 'Auditor & Compliance', 'Tamper-evident logs, general ledger, and financial statements')
        ON CONFLICT (code) DO NOTHING;
    `);

    // 2. Remove any old tabler seed user
    await client.query(`DELETE FROM user_profiles WHERE email = 'pawel.kuna@tabler.io';`);

    // 3. Seed all 5 RBAC Users
    const users = [
        {
            id: '30000000-0000-0000-0000-000000000002',
            email: 'admin@apex.com',
            full_name: 'Naresh S',
            job_title: 'Lead Administrator',
            role_code: 'SUPER_ADMIN'
        },
        {
            id: '30000000-0000-0000-0000-000000000003',
            email: 'inventory@apex.com',
            full_name: 'Vikram Mehta',
            job_title: 'Warehouse Logistics Lead',
            role_code: 'INVENTORY_MANAGER'
        },
        {
            id: '30000000-0000-0000-0000-000000000004',
            email: 'store@apex.com',
            full_name: 'Pooja Reddy',
            job_title: 'Procurement & Store Manager',
            role_code: 'STORE_MANAGER'
        },
        {
            id: '30000000-0000-0000-0000-000000000005',
            email: 'cashier@apex.com',
            full_name: 'Aman Verma',
            job_title: 'Head Billing Cashier',
            role_code: 'CASHIER'
        },
        {
            id: '30000000-0000-0000-0000-000000000006',
            email: 'auditor@apex.com',
            full_name: 'Sneha Nair',
            job_title: 'Statutory Auditor & Compliance',
            role_code: 'AUDITOR'
        }
    ];

    for (const u of users) {
        await client.query(`
            INSERT INTO user_profiles (id, organization_id, branch_id, email, full_name, job_title, is_active)
            VALUES ($1, '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', $2, $3, $4, true)
            ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, job_title = EXCLUDED.job_title;
        `, [u.id, u.email, u.full_name, u.job_title]);

        // Link role
        await client.query(`
            INSERT INTO user_roles (user_id, role_id)
            SELECT $1, id FROM roles WHERE code = $2
            ON CONFLICT DO NOTHING;
        `, [u.id, u.role_code]);
    }

    console.log('RBAC roles and users seeded successfully!');
    const verify = await client.query(`
        SELECT u.email, u.full_name, u.job_title, r.code as role
        FROM user_profiles u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        ORDER BY u.email;
    `);
    console.log('\nVerified Active Staff Users in Supabase:');
    verify.rows.forEach(r => console.log(`  - ${r.email.padEnd(20)} | ${r.full_name.padEnd(16)} | Role: ${r.role}`));

    await client.end();
}

seedRBAC().catch(err => {
    console.error('Seed RBAC failed:', err);
    process.exit(1);
});
