/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise Serverless API Engine
 * High-Performance Inventory Management & Billing System
 * 100% Live Supabase PostgreSQL Integration :: Zero Mock Data
 * ==============================================================================
 */

const SUPABASE_DEFAULT_URL = 'https://fdtkwdkpanxbuextrpiw.supabase.co';
const SUPABASE_DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdGt3ZGtwYW54YnVleHRycGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5NzM5MTksImV4cCI6MjEwOTU0OTkxOX0.MI0VyIiU9uUO1lo9nf_fnTk-htATdRBisZlmM4IelIE';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdGt3ZGtwYW54YnVleHRycGl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mzk3MzkxOSwiZXhwIjoyMTA5NTQ5OTE5fQ.gFbbp0P942xoIp-1xrh8Bf9VTDFGHYn4LueorVDQy20';

function getSupabaseUrl() {
    return (process.env.SUPABASE_URL || SUPABASE_DEFAULT_URL).replace(/\/$/, '');
}

function getSupabaseKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY || SUPABASE_DEFAULT_KEY;
}

// Low-overhead REST client for Supabase PostgREST
async function supaRest(endpoint, options = {}) {
    const url = `${getSupabaseUrl()}/rest/v1/${endpoint}`;
    const key = getSupabaseKey();
    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers
    };

    const resp = await fetch(url, { ...options, headers });
    const text = await resp.text();
    if (!resp.ok) {
        throw new Error(`Supabase Error (${resp.status}): ${text}`);
    }
    return text ? JSON.parse(text) : null;
}

// C-compliant fixed-point integer rounding helper
function divHalfUp(num, denom) {
    if (denom === 0) return 0;
    return Math.floor((num + Math.floor(denom / 2)) / denom);
}

// Quotation & Tax Calculation Engine (100% C-Engine Invariant Compatible)
function calculateQuotation(payload) {
    const isInterState = Boolean(payload.is_inter_state);
    const invoiceDiscountBps = Number(payload.invoice_discount_bps) || 0;
    const items = payload.items || [];

    let subtotalCents = 0;
    let lineDiscountTotal = 0;
    let taxableTotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const lineResults = items.map(item => {
        const qty = Number(item.quantity) || 1;
        const unitPrice = Number(item.unit_price) || 0;
        const gross = qty * unitPrice;
        subtotalCents += gross;

        const discBps = Number(item.discount_bps) || 0;
        const lineDisc = discBps > 0 ? divHalfUp(gross * discBps, 10000) : 0;
        lineDiscountTotal += lineDisc;

        const netTaxable = gross - lineDisc;
        taxableTotal += netTaxable;

        const taxRateBps = Number(item.tax_rate_bps) || 1800;
        let cgst = 0, sgst = 0, igst = 0;

        if (isInterState) {
            igst = divHalfUp(netTaxable * taxRateBps, 10000);
            totalIgst += igst;
        } else {
            const halfBps = Math.floor(taxRateBps / 2);
            cgst = divHalfUp(netTaxable * halfBps, 10000);
            sgst = divHalfUp(netTaxable * halfBps, 10000);
            totalCgst += cgst;
            totalSgst += sgst;
        }

        const lineTotal = netTaxable + cgst + sgst + igst;

        return {
            product_id: item.product_id,
            sku: item.sku,
            name: item.name,
            quantity: qty,
            unit_price: unitPrice,
            line_gross: gross,
            discount_bps: discBps,
            line_discount: lineDisc,
            net_taxable: netTaxable,
            tax_rate_bps: taxRateBps,
            cgst_amount: cgst,
            sgst_amount: sgst,
            igst_amount: igst,
            line_total: lineTotal
        };
    });

    const invDisc = invoiceDiscountBps > 0 ? divHalfUp(taxableTotal * invoiceDiscountBps, 10000) : 0;
    const finalTaxable = taxableTotal - invDisc;
    const totalTax = totalCgst + totalSgst + totalIgst;
    const rawGrandTotal = finalTaxable + totalTax;

    // Round-off to nearest whole rupee (100 cents)
    const remainder = rawGrandTotal % 100;
    let roundOff = 0;
    if (remainder >= 50) {
        roundOff = 100 - remainder;
    } else if (remainder > 0) {
        roundOff = -remainder;
    }
    const grandTotal = rawGrandTotal + roundOff;

    return {
        subtotal: subtotalCents,
        line_discount_total: lineDiscountTotal,
        invoice_discount: invDisc,
        discount_total: lineDiscountTotal + invDisc,
        taxable_amount: finalTaxable,
        is_inter_state: isInterState,
        cgst_amount: totalCgst,
        sgst_amount: totalSgst,
        igst_amount: totalIgst,
        tax_total: totalTax,
        round_off: roundOff,
        grand_total: grandTotal,
        items: lineResults
    };
}

module.exports = async (req, res) => {
    // 1. CORS Configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, Prefer');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return;
    }

    // 2. Parse URL path and query parameters
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let rawPath = url.searchParams.get('path') || url.pathname || '';
    let pathname = rawPath
        .replace(/^\/api\/v1\/?/, '')
        .replace(/^\/api\/?/, '')
        .replace(/^index\.js\/?/, '')
        .replace(/^\//, '');
    if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);

    // If path is empty, default to health check
    if (!pathname) pathname = 'health';

    res.setHeader('Content-Type', 'application/json');

    // Parse Body
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (typeof req.body === 'object' && req.body !== null) {
            body = req.body;
        } else if (typeof req.body === 'string' && req.body.length > 0) {
            try { body = JSON.parse(req.body); } catch (_) {}
        } else {
            // Buffer stream if body was not auto-parsed by runtime
            body = await new Promise((resolve) => {
                let chunks = '';
                req.on('data', chunk => chunks += chunk);
                req.on('end', () => {
                    try { resolve(chunks ? JSON.parse(chunks) : {}); } catch (_) { resolve({}); }
                });
                req.on('error', () => resolve({}));
            });
        }
    }

    try {
        // --- 1. HEALTH CHECK ---
        if (pathname === 'health') {
            let dbOk = false;
            let dbError = null;
            try {
                const ping = await supaRest('products?select=id&limit=1');
                dbOk = Array.isArray(ping);
            } catch (e) {
                dbError = e.message;
            }

            return res.writeHead(200).end(JSON.stringify({
                success: true,
                data: {
                    status: dbOk ? "healthy" : "degraded",
                    system: "CSA0201-B-CAPSTONE-IMBS",
                    version: "2.1.0-PRO-MAXX",
                    runtime: "Vercel Serverless Function",
                    database: "Supabase PostgreSQL 17",
                    db_connected: dbOk,
                    db_error: dbError,
                    timestamp: new Date().toISOString()
                }
            }));
        }

        // --- 2. QUOTATION ENGINE (C Invariants) ---
        if (pathname === 'quotation/calculate' || pathname === 'sales/quote') {
            const quote = calculateQuotation(body);
            return res.writeHead(200).end(JSON.stringify({ success: true, data: quote }));
        }

        // --- 3. PRODUCTS CATALOG ---
        if (pathname === 'products') {
            if (req.method === 'GET') {
                const rows = await supaRest('products?select=id,sku,barcode,name,description,base_uom,purchase_price_cents,selling_price_cents,reorder_point,is_active,categories(name),tax_categories(tax_rate_bps)&order=created_at.desc');
                const products = (rows || []).map(p => ({
                    id: p.id,
                    sku: p.sku,
                    barcode: p.barcode,
                    name: p.name,
                    description: p.description,
                    category: p.categories ? p.categories.name : 'General',
                    base_uom: p.base_uom,
                    purchase_price: p.purchase_price_cents,
                    selling_price: p.selling_price_cents,
                    tax_rate_bps: p.tax_categories ? p.tax_categories.tax_rate_bps : 1800,
                    reorder_point: p.reorder_point,
                    is_active: p.is_active
                }));
                return res.writeHead(200).end(JSON.stringify({ success: true, data: products }));
            }

            if (req.method === 'POST') {
                const payload = {
                    organization_id: "00000000-0000-0000-0000-000000000001",
                    category_id: body.category_id || "50000000-0000-0000-0000-000000000001",
                    tax_category_id: body.tax_category_id || "60000000-0000-0000-0000-000000000001",
                    sku: (body.sku || `SKU-${Date.now().toString().slice(-6)}`).trim().toUpperCase(),
                    barcode: body.barcode ? body.barcode.trim() : null,
                    name: (body.name || "New SKU Item").trim(),
                    description: body.description || "",
                    base_uom: body.base_uom || body.uom || "PCS",
                    purchase_price_cents: Math.round(Number(body.purchase_price || body.purchase_price_cents) || 0),
                    selling_price_cents: Math.round(Number(body.selling_price || body.selling_price_cents) || 0),
                    reorder_point: Number(body.reorder_point) || 10,
                    reorder_quantity: 50,
                    is_active: true
                };

                const created = await supaRest('products', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                if (created && created[0]) {
                    // Create initial balance record
                    await supaRest('inventory_balances', {
                        method: 'POST',
                        body: JSON.stringify({
                            organization_id: "00000000-0000-0000-0000-000000000001",
                            warehouse_id: "20000000-0000-0000-0000-000000000001",
                            product_id: created[0].id,
                            quantity_on_hand: Number(body.initial_stock) || 0,
                            quantity_reserved: 0,
                            weighted_avg_cost_cents: payload.purchase_price_cents
                        })
                    });
                }

                return res.writeHead(201).end(JSON.stringify({ success: true, data: created[0] }));
            }
        }

        // --- 4. INVENTORY BALANCES & MOVEMENTS ---
        if (pathname === 'inventory/balances') {
            const rows = await supaRest('inventory_balances?select=id,warehouse_id,product_id,quantity_on_hand,quantity_reserved,weighted_avg_cost_cents,products(sku,name,reorder_point,selling_price_cents),warehouses(name)&order=quantity_on_hand.desc');
            const balances = (rows || []).map(b => {
                const onHand = Number(b.quantity_on_hand) || 0;
                const reserved = Number(b.quantity_reserved) || 0;
                const reorder = b.products ? Number(b.products.reorder_point) || 10 : 10;
                return {
                    id: b.id,
                    warehouse_id: b.warehouse_id,
                    warehouse_name: b.warehouses ? b.warehouses.name : 'Main Distribution Hub Mumbai',
                    product_id: b.product_id,
                    sku: b.products ? b.products.sku : 'SKU',
                    product_name: b.products ? b.products.name : 'Unknown Item',
                    quantity_on_hand: onHand,
                    quantity_reserved: reserved,
                    quantity_available: Math.max(0, onHand - reserved),
                    weighted_avg_cost: Number(b.weighted_avg_cost_cents) || 0,
                    selling_price: b.products ? Number(b.products.selling_price_cents) || 0 : 0,
                    reorder_point: reorder,
                    is_low_stock: onHand <= reorder
                };
            });
            return res.writeHead(200).end(JSON.stringify({ success: true, data: balances }));
        }

        if (pathname === 'inventory/movements') {
            const rows = await supaRest('stock_movements?select=id,movement_type,reference_number,notes,created_at,stock_movement_items(quantity_delta,unit_cost_cents,balance_after,products(sku,name))&order=created_at.desc&limit=50');
            const flat = [];
            for (const m of (rows || [])) {
                const items = m.stock_movement_items || [];
                if (items.length === 0) {
                    flat.push({
                        id: m.id,
                        movement_date: m.created_at,
                        movement_type: m.movement_type,
                        reference_number: m.reference_number,
                        sku: 'N/A',
                        product_name: m.notes || 'General Adjustment',
                        quantity_delta: 0,
                        unit_cost: 0,
                        notes: m.notes
                    });
                } else {
                    for (const it of items) {
                        flat.push({
                            id: m.id,
                            movement_date: m.created_at,
                            movement_type: m.movement_type,
                            reference_number: m.reference_number,
                            sku: it.products ? it.products.sku : 'SKU',
                            product_name: it.products ? it.products.name : 'Item',
                            quantity_delta: it.quantity_delta,
                            unit_cost: it.unit_cost_cents,
                            notes: m.notes
                        });
                    }
                }
            }
            return res.writeHead(200).end(JSON.stringify({ success: true, data: flat }));
        }

        if (pathname === 'inventory/adjustments') {
            const whId = body.warehouse_id || "20000000-0000-0000-0000-000000000001";
            const prodId = body.product_id;
            const delta = Number(body.delta_quantity || body.quantity_delta) || 0;
            const reason = body.reason || "Cycle count inventory audit";

            const bal = await supaRest(`inventory_balances?warehouse_id=eq.${whId}&product_id=eq.${prodId}`);
            if (!bal || bal.length === 0) {
                return res.writeHead(404).end(JSON.stringify({ success: false, error: { message: "Inventory record not found" } }));
            }

            const currentOnHand = Number(bal[0].quantity_on_hand) || 0;
            const newOnHand = Math.max(0, currentOnHand + delta);

            await supaRest(`inventory_balances?id=eq.${bal[0].id}`, {
                method: 'PATCH',
                body: JSON.stringify({ quantity_on_hand: newOnHand, updated_at: new Date().toISOString() })
            });

            const mov = await supaRest('stock_movements', {
                method: 'POST',
                body: JSON.stringify({
                    organization_id: "00000000-0000-0000-0000-000000000001",
                    warehouse_id: whId,
                    movement_type: delta >= 0 ? "ADJUST_IN" : "ADJUST_OUT",
                    reference_number: `ADJ-${Date.now().toString().slice(-6)}`,
                    notes: reason
                })
            });

            if (mov && mov[0]) {
                await supaRest('stock_movement_items', {
                    method: 'POST',
                    body: JSON.stringify({
                        movement_id: mov[0].id,
                        product_id: prodId,
                        quantity_delta: delta,
                        unit_cost_cents: bal[0].weighted_avg_cost_cents,
                        balance_after: newOnHand
                    })
                });
            }

            return res.writeHead(200).end(JSON.stringify({ success: true, data: { new_quantity: newOnHand } }));
        }

        // --- 5. INVOICES & POS BILLING ---
        if (pathname === 'invoices' || pathname === 'pos/checkout') {
            if (req.method === 'POST') {
                const quote = calculateQuotation(body);
                const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const invoiceNo = body.invoice_number || `INV-POS-${todayStr}-${Date.now().toString().slice(-4)}`;

                const invoicePayload = {
                    organization_id: "00000000-0000-0000-0000-000000000001",
                    branch_id: "10000000-0000-0000-0000-000000000001",
                    warehouse_id: body.warehouse_id || "20000000-0000-0000-0000-000000000001",
                    customer_id: body.customer_id || "80000000-0000-0000-0000-000000000003",
                    invoice_number: invoiceNo,
                    invoice_date: new Date().toISOString().split('T')[0],
                    subtotal_cents: Math.round(quote.subtotal),
                    discount_cents: Math.round(quote.discount_total),
                    tax_total_cents: Math.round(quote.tax_total),
                    round_off_cents: Math.round(quote.round_off),
                    grand_total_cents: Math.round(quote.grand_total),
                    paid_amount_cents: Math.round(quote.grand_total),
                    balance_due_cents: 0,
                    status: "PAID",
                    is_pos: true
                };

                const createdInv = await supaRest('invoices', {
                    method: 'POST',
                    body: JSON.stringify(invoicePayload)
                });

                if (createdInv && createdInv[0]) {
                    const invId = createdInv[0].id;
                    for (const item of quote.items) {
                        await supaRest('invoice_lines', {
                            method: 'POST',
                            body: JSON.stringify({
                                invoice_id: invId,
                                product_id: item.product_id,
                                quantity: item.quantity,
                                unit_price_cents: Math.round(item.unit_price),
                                discount_bps: item.discount_bps,
                                tax_rate_bps: item.tax_rate_bps,
                                cgst_cents: Math.round(item.cgst_amount),
                                sgst_cents: Math.round(item.sgst_amount),
                                igst_cents: Math.round(item.igst_amount),
                                line_total_cents: Math.round(item.line_total)
                            })
                        });

                        // Deduct stock in Supabase
                        try {
                            const b = await supaRest(`inventory_balances?warehouse_id=eq.${invoicePayload.warehouse_id}&product_id=eq.${item.product_id}`);
                            if (b && b[0]) {
                                const cur = Number(b[0].quantity_on_hand) || 0;
                                const upd = Math.max(0, cur - Number(item.quantity));
                                await supaRest(`inventory_balances?id=eq.${b[0].id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ quantity_on_hand: upd, updated_at: new Date().toISOString() })
                                });
                            }
                        } catch (_) {}
                    }
                }

                return res.writeHead(201).end(JSON.stringify({ success: true, data: createdInv[0] }));
            }

            if (req.method === 'GET') {
                const rows = await supaRest('invoices?select=id,invoice_number,invoice_date,subtotal_cents,discount_cents,tax_total_cents,round_off_cents,grand_total_cents,paid_amount_cents,balance_due_cents,status,is_pos,customers(name),invoice_lines(quantity,unit_price_cents,line_total_cents,products(name,sku))&order=created_at.desc');
                const invoices = (rows || []).map(inv => ({
                    id: inv.id,
                    invoice_number: inv.invoice_number,
                    customer_name: inv.customers ? inv.customers.name : 'Walk-in Retail Cash Customer',
                    invoice_date: inv.invoice_date,
                    subtotal: inv.subtotal_cents,
                    discount: inv.discount_cents,
                    tax_amount: inv.tax_total_cents,
                    round_off: inv.round_off_cents,
                    grand_total: inv.grand_total_cents,
                    paid_amount: inv.paid_amount_cents,
                    balance_due: inv.balance_due_cents,
                    status: inv.status,
                    is_pos: inv.is_pos,
                    lines: inv.invoice_lines || []
                }));
                return res.writeHead(200).end(JSON.stringify({ success: true, data: invoices }));
            }
        }

        // --- 6. SUPPLIERS & PROCUREMENT ---
        if (pathname === 'suppliers') {
            if (req.method === 'POST') {
                const payload = {
                    organization_id: "00000000-0000-0000-0000-000000000001",
                    code: body.code || `SUPP-${Date.now().toString().slice(-4)}`,
                    name: (body.name || "New Vendor").trim(),
                    tax_identifier: body.tax_identifier || null,
                    contact_person: body.contact_person || "",
                    email: body.email || "",
                    phone: body.phone || "",
                    state_code: body.state_code || "27",
                    is_active: true
                };
                const created = await supaRest('suppliers', { method: 'POST', body: JSON.stringify(payload) });
                return res.writeHead(201).end(JSON.stringify({ success: true, data: created[0] }));
            }

            const rows = await supaRest('suppliers?select=id,code,name,tax_identifier,contact_person,email,phone,state_code,is_active&order=name.asc');
            return res.writeHead(200).end(JSON.stringify({ success: true, data: rows || [] }));
        }

        if (pathname === 'purchase-orders') {
            const rows = await supaRest('purchase_orders?select=id,po_number,po_date,grand_total_cents,status,notes,suppliers(name)&order=created_at.desc');
            const pos = (rows || []).map(po => ({
                id: po.id,
                po_number: po.po_number,
                po_date: po.po_date,
                supplier_name: po.suppliers ? po.suppliers.name : 'Vendor',
                grand_total: po.grand_total_cents,
                status: po.status,
                notes: po.notes
            }));
            return res.writeHead(200).end(JSON.stringify({ success: true, data: pos }));
        }

        if (pathname === 'goods-receipts') {
            const grnNo = `GRN-2026-${Date.now().toString().slice(-4)}`;
            const grn = await supaRest('goods_receipt_notes', {
                method: 'POST',
                body: JSON.stringify({
                    organization_id: "00000000-0000-0000-0000-000000000001",
                    warehouse_id: body.warehouse_id || "20000000-0000-0000-0000-000000000001",
                    grn_number: grnNo,
                    receipt_date: new Date().toISOString().split('T')[0],
                    status: "POSTED",
                    notes: body.notes || "Inward stock reception"
                })
            });

            // Update inventory & WAC if product specified
            if (body.product_id && Number(body.quantity_received) > 0) {
                const bal = await supaRest(`inventory_balances?warehouse_id=eq.${body.warehouse_id || "20000000-0000-0000-0000-000000000001"}&product_id=eq.${body.product_id}`);
                if (bal && bal[0]) {
                    const q_curr = Number(bal[0].quantity_on_hand) || 0;
                    const c_curr = Number(bal[0].weighted_avg_cost_cents) || 0;
                    const q_in = Number(body.quantity_received);
                    const c_in = Math.round(Number(body.unit_cost_cents) || c_curr);
                    const tot = q_curr + q_in;
                    const newWac = tot > 0 ? Math.round(((q_curr * c_curr) + (q_in * c_in)) / tot) : c_in;

                    await supaRest(`inventory_balances?id=eq.${bal[0].id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ quantity_on_hand: tot, weighted_avg_cost_cents: newWac, updated_at: new Date().toISOString() })
                    });
                }
            }

            return res.writeHead(201).end(JSON.stringify({ success: true, data: { grn_number: grnNo, status: "POSTED" } }));
        }

        // --- 7. CUSTOMERS ---
        if (pathname === 'customers') {
            if (req.method === 'POST') {
                const payload = {
                    organization_id: "00000000-0000-0000-0000-000000000001",
                    code: body.code || `CUST-${Math.floor(100 + Math.random() * 900)}`,
                    name: (body.name || "New Client").trim(),
                    tax_identifier: body.tax_identifier || null,
                    email: body.email || null,
                    phone: body.phone || null,
                    state_code: body.state_code || "27",
                    credit_limit_cents: Math.round((Number(body.credit_limit) || 0) * 100),
                    outstanding_balance_cents: 0,
                    is_active: true
                };
                const created = await supaRest('customers', { method: 'POST', body: JSON.stringify(payload) });
                return res.writeHead(201).end(JSON.stringify({ success: true, data: created[0] }));
            }

            const rows = await supaRest('customers?select=id,code,name,tax_identifier,email,phone,state_code,credit_limit_cents,outstanding_balance_cents,is_active&order=name.asc');
            const custs = (rows || []).map(c => ({
                ...c,
                credit_limit: c.credit_limit_cents,
                outstanding_balance: c.outstanding_balance_cents
            }));
            return res.writeHead(200).end(JSON.stringify({ success: true, data: custs }));
        }

        // --- 8. STAFF & RBAC USERS ---
        if (pathname === 'staff' || pathname === 'users' || pathname.startsWith('staff/')) {
            if (req.method === 'PATCH') {
                const targetId = pathname.startsWith('staff/') ? pathname.replace('staff/', '') : (body.id || body.user_id);
                if (!targetId) {
                    return res.writeHead(400).end(JSON.stringify({ error: "Missing staff id for update." }));
                }
                const updatePayload = {};
                if (body.full_name !== undefined) updatePayload.full_name = body.full_name.trim();
                if (body.job_title !== undefined) updatePayload.job_title = body.job_title.trim();
                if (body.avatar_url !== undefined) updatePayload.avatar_url = body.avatar_url ? body.avatar_url.trim() : null;
                if (body.is_active !== undefined) updatePayload.is_active = Boolean(body.is_active);
                updatePayload.updated_at = new Date().toISOString();

                const updated = await supaRest(`user_profiles?id=eq.${encodeURIComponent(targetId)}`, {
                    method: 'PATCH',
                    body: JSON.stringify(updatePayload)
                });

                if (body.role_code || body.role) {
                    const rCode = body.role_code || body.role;
                    const roles = await supaRest(`roles?code=eq.${encodeURIComponent(rCode)}`);
                    if (roles && roles[0]) {
                        await supaRest(`user_roles?user_id=eq.${encodeURIComponent(targetId)}`, {
                            method: 'DELETE'
                        }).catch(() => {});
                        await supaRest('user_roles', {
                            method: 'POST',
                            body: JSON.stringify({ user_id: targetId, role_id: roles[0].id })
                        }).catch(() => {});
                    }
                }

                return res.writeHead(200).end(JSON.stringify({ success: true, data: updated && updated[0] ? updated[0] : updatePayload }));
            }

            if (req.method === 'POST') {
                const userId = `30000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
                const createdUser = await supaRest('user_profiles', {
                    method: 'POST',
                    body: JSON.stringify({
                        id: userId,
                        organization_id: "00000000-0000-0000-0000-000000000001",
                        branch_id: "10000000-0000-0000-0000-000000000001",
                        email: (body.email || "").trim(),
                        full_name: (body.full_name || "Staff Member").trim(),
                        job_title: body.job_title || "Staff",
                        avatar_url: body.avatar_url ? body.avatar_url.trim() : null,
                        is_active: true
                    })
                });

                if (body.role_code || body.role) {
                    const rCode = body.role_code || body.role;
                    const roles = await supaRest(`roles?code=eq.${encodeURIComponent(rCode)}`);
                    if (roles && roles[0]) {
                        await supaRest('user_roles', {
                            method: 'POST',
                            body: JSON.stringify({ user_id: userId, role_id: roles[0].id })
                        });
                    }
                }

                return res.writeHead(201).end(JSON.stringify({ success: true, data: createdUser[0] }));
            }

            const rows = await supaRest('user_profiles?select=id,full_name,email,job_title,avatar_url,is_active,created_at,user_roles(roles(code,name))&order=full_name.asc');
            const staff = (rows || []).map(u => {
                const roleObj = (u.user_roles && u.user_roles[0] && u.user_roles[0].roles) ? u.user_roles[0].roles : { code: 'STAFF', name: 'Staff Member' };
                return {
                    id: u.id,
                    full_name: u.full_name,
                    email: u.email,
                    job_title: u.job_title || 'Staff Member',
                    avatar_url: u.avatar_url || null,
                    role: roleObj.code,
                    role_name: roleObj.name,
                    is_active: u.is_active,
                    created_at: u.created_at
                };
            });
            return res.writeHead(200).end(JSON.stringify({ success: true, data: staff }));
        }

        // --- 9. ACCOUNTING & GENERAL LEDGER ---
        if (pathname === 'accounting/journal-entries') {
            const rows = await supaRest('journal_entries?select=id,entry_number,entry_date,source_document,narration,total_debit_cents,total_credit_cents,status,journal_lines(debit_cents,credit_cents,memo,chart_of_accounts(code,name))&order=entry_date.desc&limit=50');
            const journals = (rows || []).map(je => ({
                id: je.id,
                entry_number: je.entry_number,
                entry_date: je.entry_date,
                source_document: je.source_document,
                narration: je.narration,
                total_debit: je.total_debit_cents,
                total_credit: je.total_credit_cents,
                status: je.status,
                lines: (je.journal_lines || []).map(l => ({
                    account_code: l.chart_of_accounts ? l.chart_of_accounts.code : 'CODE',
                    account_name: l.chart_of_accounts ? l.chart_of_accounts.name : 'Account',
                    debit: l.debit_cents,
                    credit: l.credit_cents,
                    memo: l.memo
                }))
            }));
            return res.writeHead(200).end(JSON.stringify({ success: true, data: journals }));
        }

        if (pathname === 'accounting/chart-of-accounts') {
            const rows = await supaRest('chart_of_accounts?select=id,code,name,account_type,is_active&order=code.asc');
            return res.writeHead(200).end(JSON.stringify({ success: true, data: rows || [] }));
        }

        // --- 10. DASHBOARD SUMMARY TELEMETRY (LIVE AGGREGATIONS) ---
        if (pathname === 'reports/dashboard-summary') {
            const [balances, invoices, products, customers] = await Promise.all([
                supaRest('inventory_balances?select=quantity_on_hand,weighted_avg_cost_cents'),
                supaRest('invoices?select=grand_total_cents,paid_amount_cents,balance_due_cents,status,invoice_date'),
                supaRest('products?select=id'),
                supaRest('customers?select=id')
            ]);

            let totalValuation = 0;
            let totalUnits = 0;
            (balances || []).forEach(b => {
                const qty = Number(b.quantity_on_hand) || 0;
                const cost = Number(b.weighted_avg_cost_cents) || 0;
                totalUnits += qty;
                totalValuation += (qty * cost);
            });

            let totalRevenue = 0;
            let todayBilling = 0;
            let pendingReceivables = 0;
            const todayStr = new Date().toISOString().split('T')[0];

            (invoices || []).forEach(inv => {
                const grand = Number(inv.grand_total_cents) || 0;
                totalRevenue += grand;
                if (inv.invoice_date === todayStr) todayBilling += grand;
                if (inv.status !== 'PAID') pendingReceivables += (Number(inv.balance_due_cents) || 0);
            });

            return res.writeHead(200).end(JSON.stringify({
                success: true,
                data: {
                    total_valuation_cents: totalValuation,
                    total_valuation_formatted: `₹${(totalValuation / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                    today_billing_cents: todayBilling,
                    today_billing_formatted: `₹${(todayBilling / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                    total_revenue_cents: totalRevenue,
                    total_revenue_formatted: `₹${(totalRevenue / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                    active_skus_count: (products || []).length,
                    total_units_on_hand: totalUnits,
                    total_invoices_count: (invoices || []).length,
                    total_customers_count: (customers || []).length,
                    pending_receivables_cents: pendingReceivables,
                    pending_receivables_formatted: `₹${(pendingReceivables / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                }
            }));
        }

        // --- 11. AUDIT & NOTIFICATIONS ---
        if (pathname === 'audit-events') {
            const rows = await supaRest('audit_events?select=id,action,entity_type,entity_id,details,created_at&order=created_at.desc&limit=50');
            return res.writeHead(200).end(JSON.stringify({ success: true, data: rows || [] }));
        }

        if (pathname === 'notifications') {
            const rows = await supaRest('notifications?select=*&order=created_at.desc&limit=10');
            return res.writeHead(200).end(JSON.stringify({ success: true, data: rows || [] }));
        }

        // Default 404
        return res.writeHead(404).end(JSON.stringify({
            success: false,
            error: { message: `Route /api/v1/${pathname} not recognized by Serverless Engine` }
        }));

    } catch (err) {
        console.error(`[API Handler Error] /${pathname}:`, err.message);
        return res.writeHead(500).end(JSON.stringify({
            success: false,
            error: { message: err.message || "Internal Server Error" }
        }));
    }
};
