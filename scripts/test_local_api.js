const handler = require('../api/index.js');
const { EventEmitter } = require('events');

async function callHandler(path, method = 'GET', body = null) {
    const req = new EventEmitter();
    req.url = path;
    req.method = method;
    req.headers = { host: 'localhost:8080' };
    if (body) req.body = body;

    let resCode = 0;
    let resHeaders = {};
    let resBody = '';

    const res = {
        setHeader(k, v) { resHeaders[k] = v; },
        writeHead(code, headers) {
            resCode = code;
            if (headers) Object.assign(resHeaders, headers);
            return this;
        },
        end(data) {
            if (data) resBody += data;
            return this;
        }
    };

    await handler(req, res);
    return { status: resCode, body: JSON.parse(resBody) };
}

async function testAll() {
    console.log("=== TESTING LOCAL api/index.js ===");
    for (const p of ['/health', '/products', '/inventory/balances', '/invoices', '/suppliers', '/customers', '/staff', '/reports/dashboard-summary']) {
        try {
            const res = await callHandler(p);
            console.log(`[PASS] ${p}: Status ${res.status}, Success: ${res.body.success}`);
        } catch (e) {
            console.error(`[FAIL] ${p}: ${e.message}`);
        }
    }
}

testAll();
