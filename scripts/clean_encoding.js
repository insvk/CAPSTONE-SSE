const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            processDir(full);
        } else if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css')) {
            let content = fs.readFileSync(full, 'utf8');
            let changed = false;

            // Fix double-encoded UTF-8 sequences
            if (content.includes('\u00E2\u201A\u00B9')) { // â‚¹
                content = content.replace(/\u00E2\u201A\u00B9/g, '₹');
                changed = true;
            }
            if (content.includes('\u00E2\u20AC\u00A2')) { // â€¢
                content = content.replace(/\u00E2\u20AC\u00A2/g, '•');
                changed = true;
            }
            if (content.includes('\u00E2\u20AC\u201D')) { // â€”
                content = content.replace(/\u00E2\u20AC\u201D/g, '—');
                changed = true;
            }
            if (content.includes('\u00E2\u20AC\u2013')) { // â€“
                content = content.replace(/\u00E2\u20AC\u2013/g, '–');
                changed = true;
            }
            if (content.includes('\u00C3\u2014')) { // Ã—
                content = content.replace(/\u00C3\u2014/g, '×');
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(full, content, 'utf8');
                console.log(`Cleaned encoding artifacts in: ${full}`);
            }
        }
    }
}

processDir('frontend');
console.log('Encoding cleanup complete.');

