const { Client } = require('pg');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update('imbs_salt_v1:' + password).digest('hex');
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Admin@Password26@db.fdtkwdkpanxbuextrpiw.supabase.co:5432/postgres';

async function main() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    // Ensure column exists
    await client.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`);

    const defaultPasswords = {
        'admin@sse.inv.com': 'Admin@Password26',
        'cashier@sse.inv.com': 'Cashier@123',
        'cashier2@sse.inv.in': 'Cashier@123',
        'cashier3@sse.inv.in': 'Cashier@123',
        'inventory@sse.inv.com': 'Inventory@123',
        'store@sse.inv.com': 'Store@123',
        'auditor@sse.inv.com': 'Auditor@123'
    };

    for (const [email, pwd] of Object.entries(defaultPasswords)) {
        const pHash = hashPassword(pwd);
        const res = await client.query(
            `UPDATE user_profiles SET password_hash = $1 WHERE email = $2 RETURNING id, email, full_name;`,
            [pHash, email]
        );
        if (res.rows.length > 0) {
            console.log(`Updated password hash for ${email} (${res.rows[0].full_name})`);
        }
    }

    const check = await client.query(`SELECT email, full_name, substring(password_hash from 1 for 16) as hash_preview FROM user_profiles ORDER BY email;`);
    console.log('\nVerified Cloud User Passwords:');
    check.rows.forEach(r => console.log(`  ${r.email.padEnd(25)} | ${r.full_name.padEnd(20)} | Hash: ${r.hash_preview}...`));

    await client.end();
}

main().catch(err => {
    console.error('Password hash migration failed:', err);
    process.exit(1);
});

