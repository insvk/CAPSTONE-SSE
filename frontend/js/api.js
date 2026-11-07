/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS
 * Frontend REST API Client
 * Seamlessly interfaces with C Native Server (:8080), Vercel, or Supabase
 * ==============================================================================
 */

const api = {
    getBaseUrl() {
        let customBackend = null;
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                customBackend = window.localStorage.getItem('imbs_backend_url');
            }
        } catch (_) {}
        if (!customBackend && typeof window !== 'undefined' && window.ENV) {
            customBackend = window.ENV.BACKEND_URL;
        }
        if (customBackend) {
            return `${customBackend.replace(/\/$/, '')}/api/v1`;
        }
        return '/api?path=';
    },

    async request(endpoint, options = {}) {
        const base = this.getBaseUrl();
        const url = base.includes('?path=') ? `${base}${endpoint}` : `${base}/${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const resp = await fetch(url, config);
            const json = await resp.json();

            if (!resp.ok || !json.success) {
                const errMsg = (json && json.error && json.error.message) ? json.error.message : `API Request Failed (HTTP ${resp.status})`;
                throw new Error(errMsg);
            }

            return json.data;
        } catch (err) {
            console.warn(`[API Network Notice] ${endpoint}:`, err.message);

            // Transparent Supabase Direct Fallback
            if (window.SupabaseClient) {
                try {
                    if (endpoint === 'products') return await window.SupabaseClient.getProducts();
                    if (endpoint === 'inventory/balances') return await window.SupabaseClient.getInventoryBalances();
                    if (endpoint === 'inventory/movements') return await window.SupabaseClient.getStockMovements();
                    if (endpoint === 'invoices') return await window.SupabaseClient.getInvoices();
                    if (endpoint === 'suppliers') return await window.SupabaseClient.getSuppliers();
                    if (endpoint === 'customers') return await window.SupabaseClient.getCustomers();
                    if (endpoint === 'staff' || endpoint === 'users') return await window.SupabaseClient.getStaff();
                    if (endpoint === 'accounting/journal-entries') return await window.SupabaseClient.getJournalEntries();
                    if (endpoint === 'accounting/chart-of-accounts') return await window.SupabaseClient.getChartOfAccounts();
                    if (endpoint === 'reports/dashboard-summary') return await window.SupabaseClient.getDashboardStats();
                    if (endpoint === 'audit-events') return await window.SupabaseClient.getAuditEvents();
                } catch (supaErr) {
                    console.error("[Supabase Direct Fallback Error]", supaErr);
                }
            }

            throw err;
        }
    },

    // Health
    getHealth() { return this.request('health'); },

    // Dashboard
    getDashboardMetrics() { return this.request('reports/dashboard-summary'); },

    // Products
    getProducts() { return this.request('products'); },
    createProduct(data) {
        return this.request('products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Inventory
    getInventoryBalances() { return this.request('inventory/balances'); },
    getStockMovements() { return this.request('inventory/movements'); },
    postStockAdjustment(data) {
        return this.request('inventory/adjustments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    postStockTransfer(data) {
        return this.request('inventory/transfers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Procurement
    getSuppliers() { return this.request('suppliers'); },
    createSupplier(data) {
        return this.request('suppliers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getPurchaseOrders() { return this.request('purchase-orders'); },
    createPurchaseOrder(data) {
        return this.request('purchase-orders', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    receiveGoods(data) {
        return this.request('goods-receipts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Customers
    getCustomers() { return this.request('customers'); },
    createCustomer(data) {
        return this.request('customers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // POS Sales & Invoices
    quoteSale(cart) {
        return this.request('sales/quote', {
            method: 'POST',
            body: JSON.stringify(cart)
        });
    },
    checkoutSale(sale) {
        return this.request('sales/checkout', {
            method: 'POST',
            body: JSON.stringify(sale)
        });
    },
    getInvoices() { return this.request('invoices'); },
    getInvoiceById(id) { return this.request(`invoices/${id}`); },

    // Payments
    getPayments() { return this.request('payments'); },
    createPayment(data) {
        return this.request('payments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Double-Entry Accounting
    getJournalEntries() { return this.request('accounting/journal-entries'); },
    getChartOfAccounts() { return this.request('accounting/chart-of-accounts'); },
    getTrialBalance() { return this.request('accounting/trial-balance'); },

    // System & Benchmarking
    getSystemBenchmark() { return this.request('system/benchmark'); },

    // Audit & Governance
    getAuditEvents() { return this.request('audit-events'); },
    getNotifications() { return this.request('notifications'); }
};

window.api = api;
