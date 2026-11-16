const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function check(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            check(full);
        } else if (f.endsWith('.js')) {
            try {
                execSync(`node -c "${full}"`);
                console.log(`[OK] ${full}`);
            } catch (err) {
                console.error(`[SYNTAX ERROR] ${full}`);
                process.exit(1);
            }
        }
    }
}

check(path.join(__dirname, '..', 'frontend', 'js'));
console.log('All frontend JavaScript files passed syntax verification!');

