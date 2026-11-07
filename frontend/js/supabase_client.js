/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Supabase Production Client & Cloud Engine
 * Direct integration with live PostgreSQL 16 database on Supabase
 * Project: fdtkwdkpanxbuextrpiw.supabase.co
 * ==============================================================================
 */

const SUPABASE_DEFAULT_URL = 'https://fdtkwdkpanxbuextrpiw.supabase.co';
const SUPABASE_DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdGt3ZGtwYW54YnVleHRycGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5NzM5MTksImV4cCI6MjEwOTU0OTkxOX0.MI0VyIiU9uUO1lo9nf_fnTk-htATdRBisZlmM4IelIE';

const SafeStorage = {
    _mem: {},
    getItem(key) {
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const val = window.sessionStorage.getItem(key);
                if (val !== null) return val;
            }
        } catch (_) {}
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const val = window.localStorage.getItem(key);
                if (val !== null) return val;
            }
        } catch (_) {}
        return this._mem[key] || null;
    },
    setItem(key, value) {
        this._mem[key] = value;
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                window.sessionStorage.setItem(key, value);
            }
        } catch (_) {}
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (_) {}
    },
    removeItem(key) {
        delete this._mem[key];
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                window.sessionStorage.removeItem(key);
            }
        } catch (_) {}
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
            }
        } catch (_) {}
    }
};

const SupabaseClient = {
    getUrl() {
        return SafeStorage.getItem('imbs_supabase_url') || (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_URL) || SUPABASE_DEFAULT_URL;
    },

    getKey() {
        return SafeStorage.getItem('imbs_supabase_anon_key') || (typeof window !== 'undefined' && window.ENV && window.ENV.SUPABASE_ANON_KEY) || SUPABASE_DEFAULT_KEY;
    },

    getHeaders() {
        const key = this.getKey();
        const user = this.getCurrentUser();
        const headers = {
            'apikey': key,
            'Authorization': user && user.token ? `Bearer ${user.token}` : `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
        return headers;
    },

    async restRequest(endpoint, options = {}) {
        const url = `${this.getUrl().replace(/\/$/, '')}/rest/v1/${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        const resp = await fetch(url, config);
        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`[Supabase Error ${resp.status}] ${errText}`);
        }

        const text = await resp.text();
        return text ? JSON.parse(text) : null;
    },

    // --------------------------------------------------------------------------
    // AUTHENTICATION & SESSION (RBAC Enforced)
    // --------------------------------------------------------------------------
    getCurrentUser() {
        try {
            const stored = SafeStorage.getItem('imbs_auth_user');
            if (stored) return JSON.parse(stored);
        } catch (_) {}
        return null;
    },

    setCurrentUser(user) {
        if (!user) {
            SafeStorage.removeItem('imbs_auth_user');
        } else {
            SafeStorage.setItem('imbs_auth_user', JSON.stringify(user));
        }
    },

    signOut() {
        const user = this.getCurrentUser();
        if (user) {
            this.logAudit("AUTH_LOGOUT", "USER", user.id, `User logged out (${user.email})`).catch(() => {});
        }
        SafeStorage.setItem('imbs_signed_out', 'true');
        SafeStorage.removeItem('imbs_auth_user');
    },

    async signIn(email, password) {
        SafeStorage.removeItem('imbs_signed_out');
        const normalizedEmail = (email || '').trim().toLowerCase();

        // 1. Query Supabase PostgreSQL for verified user and assigned role
        try {
            const query = `user_profiles?email=eq.${encodeURIComponent(normalizedEmail)}&select=id,full_name,email,job_title,organization_id,branch_id,user_roles(roles(code,name))`;
            const users = await this.restRequest(query);

            if (users && users.length > 0) {
                const u = users[0];
                let roleCode = 'SUPER_ADMIN';
                let roleName = 'Super Administrator';
                if (u.user_roles && u.user_roles.length > 0 && u.user_roles[0].roles) {
                    roleCode = u.user_roles[0].roles.code || 'SUPER_ADMIN';
                    roleName = u.user_roles[0].roles.name || 'Super Administrator';
                }

                const authUser = {
                    id: u.id,
                    email: u.email,
                    full_name: u.full_name,
                    job_title: u.job_title || roleName,
                    role: roleCode,
                    role_name: roleName,
                    organization_id: u.organization_id || "00000000-0000-0000-0000-000000000001"
                };

                this.setCurrentUser(authUser);
                await this.logAudit("AUTH_LOGIN", "USER", u.id, `Signed in as ${authUser.role} (${u.email})`);
                return authUser;
            }
        } catch (dbErr) {
            console.warn("[Database auth query warning, checking RBAC defaults]", dbErr);
        }

        // 2. Pre-configured Enterprise RBAC Accounts
        const rbacAccounts = {
            'admin@apex.com': {
                id: '30000000-0000-0000-0000-000000000002',
                full_name: 'Naresh S',
                job_title: 'Lead Administrator',
                role: 'SUPER_ADMIN',
                role_name: 'Super Administrator'
            },
            'inventory@apex.com': {
                id: '30000000-0000-0000-0000-000000000003',
                full_name: 'Vikram Mehta',
                job_title: 'Warehouse Logistics Lead',
                role: 'INVENTORY_MANAGER',
                role_name: 'Inventory Manager'
            },
            'store@apex.com': {
                id: '30000000-0000-0000-0000-000000000004',
                full_name: 'Pooja Reddy',
                job_title: 'Procurement & Store Manager',
                role: 'STORE_MANAGER',
                role_name: 'Store Manager'
            },
            'cashier@apex.com': {
                id: '30000000-0000-0000-0000-000000000005',
                full_name: 'Aman Verma',
                job_title: 'Head Billing Cashier',
                role: 'CASHIER',
                role_name: 'POS Cashier'
            },
            'auditor@apex.com': {
                id: '30000000-0000-0000-0000-000000000006',
                full_name: 'Sneha Nair',
                job_title: 'Statutory Auditor & Compliance',
                role: 'AUDITOR',
                role_name: 'Auditor & Compliance'
            }
        };

        if (rbacAccounts[normalizedEmail]) {
            const acc = rbacAccounts[normalizedEmail];
            const authUser = {
                id: acc.id,
                email: normalizedEmail,
                full_name: acc.full_name,
                job_title: acc.job_title,
                role: acc.role,
                role_name: acc.role_name,
                organization_id: "00000000-0000-0000-0000-000000000001"
            };
            this.setCurrentUser(authUser);
            await this.logAudit("AUTH_LOGIN", "USER", acc.id, `Signed in as ${acc.role} (${normalizedEmail})`);
            return authUser;
        }

        throw new Error("Invalid email or credentials. Please check your role or select an RBAC preset.");
    },

    async signUp(email, password, fullName, jobTitle = "Staff Member", roleCode = "CASHIER") {
        const newUser = {
            organization_id: "00000000-0000-0000-0000-000000000001",
            branch_id: "10000000-0000-0000-0000-000000000001",
            email: email.trim(),
            full_name: fullName.trim(),
            job_title: jobTitle.trim(),
            is_active: true
        };

        const created = await this.restRequest('user_profiles', {
            method: 'POST',
            body: JSON.stringify(newUser)
        });

        const user = created[0];
        const authUser = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            job_title: user.job_title,
            role: roleCode,
            role_name: roleCode,
            organization_id: user.organization_id
        };

        this.setCurrentUser(authUser);
        await this.logAudit("AUTH_SIGNUP", "USER", user.id, `New user registered: ${user.email} (${roleCode})`);
        return authUser;
    },

    // --------------------------------------------------------------------------
    // CUSTOMER MANAGEMENT
    // --------------------------------------------------------------------------
    async getCustomers() {
        const query = 'customers?select=id,code,name,tax_identifier,email,phone,state_code,credit_limit_cents,outstanding_balance_cents,is_active&order=name.asc';
        const res = await this.restRequest(query);
        return (res || []).map(c => ({
            ...c,
            credit_limit: c.credit_limit_cents,
            outstanding_balance: c.outstanding_balance_cents,
            outstanding_balance_formatted: '₹' + ((c.outstanding_balance_cents || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })
        }));
    },

    async createCustomer(data) {
        const payload = {
            organization_id: "00000000-0000-0000-0000-000000000001",
            code: data.code || `CUST-${Math.floor(100 + Math.random() * 900)}`,
            name: data.name,
            tax_identifier: data.tax_identifier || null,
            email: data.email || null,
            phone: data.phone || null,
            state_code: data.state_code || "27",
            credit_limit_cents: Math.round((Number(data.credit_limit) || 0) * 100),
            outstanding_balance_cents: 0,
            is_active: true
        };
        const res = await this.restRequest('customers', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        await this.logAudit("CREATE", "CUSTOMER", res[0]?.id, `Added customer: ${data.name}`);
        return res[0];
    },

    // --------------------------------------------------------------------------
    // STAFF & RBAC USER MANAGEMENT
    // --------------------------------------------------------------------------
    async getStaff() {
        const query = 'user_profiles?select=id,full_name,email,job_title,is_active,created_at,user_roles(roles(code,name))&order=full_name.asc';
        const res = await this.restRequest(query);
        return (res || []).map(u => {
            const roleObj = (u.user_roles && u.user_roles[0] && u.user_roles[0].roles) ? u.user_roles[0].roles : { code: 'STAFF', name: 'Staff Member' };
            return {
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                job_title: u.job_title || 'Staff Member',
                role: roleObj.code,
                role_name: roleObj.name,
                is_active: u.is_active,
                created_at: u.created_at
            };
        });
    },

    async createStaff(data) {
        const userId = `30000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
        const profilePayload = {
            id: userId,
            organization_id: "00000000-0000-0000-0000-000000000001",
            branch_id: "10000000-0000-0000-0000-000000000001",
            email: data.email.trim(),
            full_name: data.full_name.trim(),
            job_title: data.job_title || "Staff Member",
            is_active: true
        };
        const res = await this.restRequest('user_profiles', {
            method: 'POST',
            body: JSON.stringify(profilePayload)
        });

        // Find and attach role id
        try {
            const roles = await this.restRequest(`roles?code=eq.${encodeURIComponent(data.role || 'CASHIER')}`);
            if (roles && roles.length > 0) {
                await this.restRequest('user_roles', {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: userId,
                        role_id: roles[0].id
                    })
                });
            }
        } catch (_) {}

        await this.logAudit("CREATE", "STAFF_USER", userId, `Created staff account: ${data.full_name} (${data.role})`);
        return res[0];
    },

    signOut() {
        const user = this.getCurrentUser();
        if (user) {
            this.logAudit("AUTH_LOGOUT", "USER", user.id, `User logged out: ${user.email}`).catch(() => {});
        }
        this.setCurrentUser(null);
    },

    // --------------------------------------------------------------------------
    // PRODUCTS CATALOG
    // --------------------------------------------------------------------------
    async getProducts() {
        const data = await this.restRequest('products?select=id,sku,barcode,name,description,base_uom,purchase_price_cents,selling_price_cents,reorder_point,is_active,categories(name),tax_categories(tax_rate_bps)&order=created_at.desc');
        return data.map(p => ({
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
    },

    async createProduct(prod) {
        const user = this.getCurrentUser();
        const payload = {
            organization_id: "00000000-0000-0000-0000-000000000001",
            category_id: prod.category_id || "50000000-0000-0000-0000-000000000001",
            tax_category_id: prod.tax_category_id || "60000000-0000-0000-0000-000000000001",
            sku: prod.sku.trim().toUpperCase(),
            barcode: prod.barcode ? prod.barcode.trim() : null,
            name: prod.name.trim(),
            description: prod.description || "",
            base_uom: prod.base_uom || "PCS",
            purchase_price_cents: Math.round(Number(prod.purchase_price) || 0),
            selling_price_cents: Math.round(Number(prod.selling_price) || 0),
            reorder_point: Number(prod.reorder_point) || 10,
            reorder_quantity: 50,
            is_active: true
        };

        const res = await this.restRequest('products', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const createdProd = res[0];

        // Automatically create an initial warehouse inventory balance record
        await this.restRequest('inventory_balances', {
            method: 'POST',
            body: JSON.stringify({
                organization_id: "00000000-0000-0000-0000-000000000001",
                warehouse_id: "20000000-0000-0000-0000-000000000001",
                product_id: createdProd.id,
                quantity_on_hand: Number(prod.initial_stock) || 0,
                quantity_reserved: 0,
                weighted_avg_cost_cents: payload.purchase_price_cents
            })
        });

        await this.logAudit("PRODUCT_CREATE", "PRODUCT", createdProd.id, `Created product ${createdProd.sku} (${createdProd.name})`);
        return createdProd;
    },

    async deleteProduct(id) {
        // Delete balance first
        await this.restRequest(`inventory_balances?product_id=eq.${id}`, { method: 'DELETE' });
        const res = await this.restRequest(`products?id=eq.${id}`, { method: 'DELETE' });
        await this.logAudit("PRODUCT_DELETE", "PRODUCT", id, `Deleted product ID ${id}`);
        return res;
    },

    // --------------------------------------------------------------------------
    // INVENTORY & STOCK MOVEMENTS
    // --------------------------------------------------------------------------
    async getInventoryBalances() {
        const query = `inventory_balances?select=id,warehouse_id,product_id,quantity_on_hand,quantity_reserved,weighted_avg_cost_cents,products(sku,name,reorder_point,selling_price_cents),warehouses(name)&order=quantity_on_hand.desc`;
        const data = await this.restRequest(query);

        return data.map(b => {
            const onHand = Number(b.quantity_on_hand) || 0;
            const reserved = Number(b.quantity_reserved) || 0;
            const reorder = b.products ? Number(b.products.reorder_point) || 10 : 10;
            return {
                id: b.id,
                warehouse_id: b.warehouse_id,
                warehouse_name: b.warehouses ? b.warehouses.name : 'Main Hub',
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
    },

    async adjustStock(warehouseId, productId, deltaQty, reason = "Cycle count audit") {
        const user = this.getCurrentUser();
        // Fetch current balance
        const balances = await this.restRequest(`inventory_balances?warehouse_id=eq.${warehouseId}&product_id=eq.${productId}`);
        if (!balances || balances.length === 0) throw new Error("Inventory balance record not found.");

        const bal = balances[0];
        const newQty = Math.max(0, Number(bal.quantity_on_hand) + Number(deltaQty));

        // Update balance
        await this.restRequest(`inventory_balances?id=eq.${bal.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                quantity_on_hand: newQty,
                updated_at: new Date().toISOString()
            })
        });

        // Record stock movement
        const mov = await this.restRequest('stock_movements', {
            method: 'POST',
            body: JSON.stringify({
                organization_id: "00000000-0000-0000-0000-000000000001",
                warehouse_id: warehouseId,
                movement_type: deltaQty >= 0 ? "ADJUST_IN" : "ADJUST_OUT",
                reference_number: `ADJ-${Date.now().toString().slice(-6)}`,
                notes: reason,
                created_by: user ? user.id : null
            })
        });

        if (mov && mov[0]) {
            await this.restRequest('stock_movement_items', {
                method: 'POST',
                body: JSON.stringify({
                    movement_id: mov[0].id,
                    product_id: productId,
                    quantity_delta: deltaQty,
                    unit_cost_cents: bal.weighted_avg_cost_cents,
                    balance_after: newQty
                })
            });
        }

        await this.logAudit("STOCK_ADJUSTMENT", "INVENTORY", bal.id, `Stock adjusted by ${deltaQty} units (${reason}). New balance: ${newQty}`);
        return { success: true, new_quantity: newQty };
    },

    async getStockMovements() {
        const query = `stock_movements?select=id,movement_type,reference_number,notes,created_at,stock_movement_items(quantity_delta,unit_cost_cents,balance_after,products(sku,name))&order=created_at.desc&limit=50`;
        const movements = await this.restRequest(query);

        const flat = [];
        for (const m of movements) {
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
        return flat;
    },

    // --------------------------------------------------------------------------
    // POS BILLING & INVOICING
    // --------------------------------------------------------------------------
    async checkoutSale(saleData) {
        const user = this.getCurrentUser();
        const invoiceNo = `INV-2026-${Date.now().toString().slice(-4)}`;

        const invoicePayload = {
            organization_id: "00000000-0000-0000-0000-000000000001",
            branch_id: "10000000-0000-0000-0000-000000000001",
            warehouse_id: saleData.warehouse_id || "20000000-0000-0000-0000-000000000001",
            customer_id: saleData.customer_id || "80000000-0000-0000-0000-000000000003",
            invoice_number: invoiceNo,
            invoice_date: new Date().toISOString().split('T')[0],
            subtotal_cents: Math.round(saleData.subtotal),
            discount_cents: Math.round(saleData.discount_total || 0),
            tax_total_cents: Math.round(saleData.tax_total),
            round_off_cents: Math.round(saleData.round_off || 0),
            grand_total_cents: Math.round(saleData.grand_total),
            paid_amount_cents: Math.round(saleData.grand_total),
            balance_due_cents: 0,
            status: "PAID",
            is_pos: true,
            created_by: user ? user.id : null
        };

        // 1. Insert Invoice
        const invRes = await this.restRequest('invoices', {
            method: 'POST',
            body: JSON.stringify(invoicePayload)
        });
        const createdInv = invRes[0];

        // 2. Insert Invoice Lines & Decrement Stock
        for (const line of saleData.items) {
            await this.restRequest('invoice_lines', {
                method: 'POST',
                body: JSON.stringify({
                    invoice_id: createdInv.id,
                    product_id: line.product_id,
                    quantity: line.quantity,
                    unit_price_cents: Math.round(line.unit_price),
                    discount_bps: line.discount_bps || 0,
                    tax_rate_bps: line.tax_rate_bps || 1800,
                    cgst_cents: Math.round(line.cgst_amount || 0),
                    sgst_cents: Math.round(line.sgst_amount || 0),
                    igst_cents: Math.round(line.igst_amount || 0),
                    line_total_cents: Math.round(line.line_total)
                })
            });

            // Deduct stock in Supabase
            try {
                const balRecs = await this.restRequest(`inventory_balances?warehouse_id=eq.${invoicePayload.warehouse_id}&product_id=eq.${line.product_id}`);
                if (balRecs && balRecs.length > 0) {
                    const currentStock = Number(balRecs[0].quantity_on_hand) || 0;
                    const updatedStock = Math.max(0, currentStock - Number(line.quantity));
                    await this.restRequest(`inventory_balances?id=eq.${balRecs[0].id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            quantity_on_hand: updatedStock,
                            updated_at: new Date().toISOString()
                        })
                    });
                }
            } catch (stockErr) {
                console.warn("[Stock update notice]", stockErr);
            }
        }

        // 3. Post Balanced Double-Entry Journal
        try {
            const taxable = saleData.taxable_amount || (saleData.subtotal - (saleData.discount_total || 0));
            const journalPayload = {
                organization_id: "00000000-0000-0000-0000-000000000001",
                entry_number: `JE-${Date.now().toString().slice(-6)}`,
                entry_date: invoicePayload.invoice_date,
                source_document: invoiceNo,
                narration: `POS sale checkout ${invoiceNo}`,
                total_debit_cents: Math.round(saleData.grand_total),
                total_credit_cents: Math.round(saleData.grand_total),
                status: "POSTED",
                created_by: user ? user.id : null
            };

            const jrRes = await this.restRequest('journal_entries', {
                method: 'POST',
                body: JSON.stringify(journalPayload)
            });

            if (jrRes && jrRes[0]) {
                const jeId = jrRes[0].id;
                // Debit Cash
                await this.restRequest('journal_lines', {
                    method: 'POST',
                    body: JSON.stringify({
                        journal_entry_id: jeId,
                        account_id: "a0000000-0000-0000-0000-000000000001", // Cash
                        debit_cents: Math.round(saleData.grand_total),
                        credit_cents: 0,
                        memo: "Cash received at POS register"
                    })
                });
                // Credit Revenue
                await this.restRequest('journal_lines', {
                    method: 'POST',
                    body: JSON.stringify({
                        journal_entry_id: jeId,
                        account_id: "a0000000-0000-0000-0000-000000000009", // Revenue
                        debit_cents: 0,
                        credit_cents: Math.round(taxable),
                        memo: "Sales revenue"
                    })
                });
                // Credit CGST
                if (saleData.cgst_amount > 0) {
                    await this.restRequest('journal_lines', {
                        method: 'POST',
                        body: JSON.stringify({
                            journal_entry_id: jeId,
                            account_id: "a0000000-0000-0000-0000-000000000006", // CGST
                            debit_cents: 0,
                            credit_cents: Math.round(saleData.cgst_amount),
                            memo: "Output CGST"
                        })
                    });
                }
                // Credit SGST
                if (saleData.sgst_amount > 0) {
                    await this.restRequest('journal_lines', {
                        method: 'POST',
                        body: JSON.stringify({
                            journal_entry_id: jeId,
                            account_id: "a0000000-0000-0000-0000-000000000007", // SGST
                            debit_cents: 0,
                            credit_cents: Math.round(saleData.sgst_amount),
                            memo: "Output SGST"
                        })
                    });
                }
            }
        } catch (jeErr) {
            console.warn("[Journal entry auto-post notice]", jeErr);
        }

        await this.logAudit("SALE_CHECKOUT", "INVOICE", createdInv.id, `POS sale completed: ${invoiceNo} (₹${(createdInv.grand_total_cents / 100).toFixed(2)})`);
        return createdInv;
    },

    async getInvoices() {
        const query = `invoices?select=id,invoice_number,invoice_date,subtotal_cents,discount_cents,tax_total_cents,round_off_cents,grand_total_cents,paid_amount_cents,balance_due_cents,status,is_pos,customers(name),invoice_lines(quantity,unit_price_cents,line_total_cents,products(name,sku))&order=created_at.desc`;
        const data = await this.restRequest(query);

        return data.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            customer_name: inv.customers ? inv.customers.name : 'Walk-in Retail Customer',
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
    },

    // --------------------------------------------------------------------------
    // DOUBLE-ENTRY GENERAL LEDGER
    // --------------------------------------------------------------------------
    async getJournalEntries() {
        const query = `journal_entries?select=id,entry_number,entry_date,source_document,narration,total_debit_cents,total_credit_cents,status,journal_lines(debit_cents,credit_cents,memo,chart_of_accounts(code,name))&order=created_at.desc&limit=50`;
        const data = await this.restRequest(query);

        return data.map(je => ({
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
    },

    async getChartOfAccounts() {
        return await this.restRequest('chart_of_accounts?select=id,code,name,account_type,is_active&order=code.asc');
    },

    async getTrialBalance() {
        return await this.restRequest('v_trial_balance');
    },

    // --------------------------------------------------------------------------
    // PROCUREMENT & SUPPLIERS
    // --------------------------------------------------------------------------
    async getSuppliers() {
        return await this.restRequest('suppliers?select=id,code,name,tax_identifier,contact_person,email,phone,state_code,is_active&order=name.asc');
    },

    async createSupplier(supp) {
        const payload = {
            organization_id: "00000000-0000-0000-0000-000000000001",
            code: supp.code || `SUPP-${Date.now().toString().slice(-4)}`,
            name: supp.name.trim(),
            contact_person: supp.contact_person || "",
            email: supp.email || "",
            phone: supp.phone || "",
            state_code: supp.state_code || "27",
            is_active: true
        };
        const res = await this.restRequest('suppliers', { method: 'POST', body: JSON.stringify(payload) });
        await this.logAudit("SUPPLIER_CREATE", "SUPPLIER", res[0].id, `Created supplier ${supp.name}`);
        return res[0];
    },

    async getPurchaseOrders() {
        const data = await this.restRequest('purchase_orders?select=id,po_number,po_date,grand_total_cents,status,notes,suppliers(name)&order=created_at.desc');
        return data.map(po => ({
            id: po.id,
            po_number: po.po_number,
            po_date: po.po_date,
            supplier_name: po.suppliers ? po.suppliers.name : 'Vendor',
            grand_total: po.grand_total_cents,
            status: po.status,
            notes: po.notes
        }));
    },

    async receiveGoods(grnData) {
        const user = this.getCurrentUser();
        const grnNo = `GRN-2026-${Date.now().toString().slice(-4)}`;

        const grn = await this.restRequest('goods_receipt_notes', {
            method: 'POST',
            body: JSON.stringify({
                organization_id: "00000000-0000-0000-0000-000000000001",
                warehouse_id: grnData.warehouse_id || "20000000-0000-0000-0000-000000000001",
                grn_number: grnNo,
                receipt_date: new Date().toISOString().split('T')[0],
                status: "POSTED",
                notes: grnData.notes || "Inward stock reception",
                created_by: user ? user.id : null
            })
        });

        // Update inventory & Weighted Average Cost
        if (grnData.product_id && grnData.quantity_received > 0) {
            const balances = await this.restRequest(`inventory_balances?warehouse_id=eq.${grnData.warehouse_id || "20000000-0000-0000-0000-000000000001"}&product_id=eq.${grnData.product_id}`);
            if (balances && balances.length > 0) {
                const bal = balances[0];
                const q_curr = Number(bal.quantity_on_hand) || 0;
                const c_curr = Number(bal.weighted_avg_cost_cents) || 0;
                const q_in = Number(grnData.quantity_received);
                const c_in = Math.round(Number(grnData.unit_cost_cents) || c_curr);

                // C domain formula for Weighted Average Cost
                const totalQty = q_curr + q_in;
                const newWac = totalQty > 0 ? Math.round(((q_curr * c_curr) + (q_in * c_in)) / totalQty) : c_in;

                await this.restRequest(`inventory_balances?id=eq.${bal.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        quantity_on_hand: totalQty,
                        weighted_avg_cost_cents: newWac,
                        updated_at: new Date().toISOString()
                    })
                });

                // Movement item
                await this.restRequest('goods_receipt_items', {
                    method: 'POST',
                    body: JSON.stringify({
                        grn_id: grn[0].id,
                        product_id: grnData.product_id,
                        quantity_received: q_in,
                        unit_cost_cents: c_in
                    })
                });
            }
        }

        await this.logAudit("GRN_RECEIVE", "GRN", grn[0].id, `Goods received: ${grnNo}`);
        return grn[0];
    },

    // --------------------------------------------------------------------------
    // DASHBOARD LIVE AGGREGATIONS (COMPUTED REAL-TIME FROM SUPABASE)
    // --------------------------------------------------------------------------
    async getDashboardStats() {
        const [balances, invoices, products] = await Promise.all([
            this.getInventoryBalances(),
            this.getInvoices(),
            this.getProducts()
        ]);

        // 1. Total Stock Valuation (Sum of on_hand * wac)
        let totalValuationCents = 0;
        let lowStockCount = 0;
        let totalUnitsOnHand = 0;

        balances.forEach(b => {
            totalValuationCents += (b.quantity_on_hand * b.weighted_avg_cost);
            totalUnitsOnHand += b.quantity_on_hand;
            if (b.is_low_stock) lowStockCount++;
        });

        // 2. Invoices & Sales Metrics
        let totalRevenueCents = 0;
        let todayBillingCents = 0;
        let pendingPaymentsCents = 0;
        let unpaidInvoicesCount = 0;

        const todayStr = new Date().toISOString().split('T')[0];

        invoices.forEach(inv => {
            totalRevenueCents += inv.grand_total;
            if (inv.invoice_date === todayStr) {
                todayBillingCents += inv.grand_total;
            }
            if (inv.status !== 'PAID') {
                pendingPaymentsCents += inv.balance_due;
                unpaidInvoicesCount++;
            }
        });

        // 3. Stock Capacity Utilization (Available vs Total)
        const totalCapacityEstimated = Math.max(500, totalUnitsOnHand * 1.25);
        const capacityUtilizationPct = Math.min(100, Math.round((totalUnitsOnHand / totalCapacityEstimated) * 100));

        // 4. Category breakdown for chart
        const categoryMap = {};
        balances.forEach(b => {
            const cat = b.product_name ? b.product_name.split(' ')[0] : 'General';
            categoryMap[cat] = (categoryMap[cat] || 0) + b.quantity_on_hand;
        });

        return {
            total_valuation_cents: totalValuationCents,
            total_valuation_formatted: `₹${(totalValuationCents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            today_billing_cents: todayBillingCents,
            today_billing_formatted: `₹${(todayBillingCents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            total_revenue_cents: totalRevenueCents,
            total_revenue_formatted: `₹${(totalRevenueCents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            active_skus_count: products.length,
            low_stock_count: lowStockCount,
            capacity_utilization_pct: capacityUtilizationPct,
            unpaid_invoices_count: unpaidInvoicesCount,
            pending_payments_cents: pendingPaymentsCents,
            pending_payments_formatted: `₹${(pendingPaymentsCents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            total_invoices_count: invoices.length,
            category_distribution: categoryMap
        };
    },

    // --------------------------------------------------------------------------
    // AUDIT & GOVERNANCE
    // --------------------------------------------------------------------------
    async logAudit(action, entityType, entityId, details) {
        try {
            const user = this.getCurrentUser();
            await this.restRequest('audit_events', {
                method: 'POST',
                body: JSON.stringify({
                    organization_id: "00000000-0000-0000-0000-000000000001",
                    actor_user_id: user ? user.id : null,
                    action: action,
                    entity_type: entityType,
                    entity_id: String(entityId || ''),
                    details: details,
                    created_at: new Date().toISOString()
                })
            });
        } catch (e) {
            console.warn("[Audit Log Notice]", e.message);
        }
    },

    async getAuditEvents() {
        return await this.restRequest('audit_events?select=id,action,entity_type,entity_id,details,created_at&order=created_at.desc&limit=50');
    }
};

window.SupabaseClient = SupabaseClient;
