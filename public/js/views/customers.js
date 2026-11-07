/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Customers Management & POS Transactions View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL 17
 * Displays Customer Registry & Full Historical Transaction Logs by Mobile/Account
 * ==============================================================================
 */

const CustomersView = {
    customersList: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 350px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border: 2px solid #27272a; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <span style="font-size: 13px; color: var(--text-muted);">Syncing customer directory from Supabase...</span>
                </div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            this.customersList = await window.SupabaseClient.getCustomers();
            this.renderTable(container);
        } catch (err) {
            console.error("[Customers Load Error]", err);
            container.innerHTML = `
                <div class="shadcn-card" style="border-color: #ef4444; color: #ef4444; padding: 24px;">
                    <strong>Error loading customers from Supabase:</strong> ${err.message}<br>
                    <button class="shadcn-btn-primary" style="margin-top: 14px;" onclick="CustomersView.render(document.getElementById('main-content'))">
                        Retry Sync
                    </button>
                </div>
            `;
        }
    },

    renderTable(container) {
        const totalCustomers = this.customersList.length;
        const totalOutstanding = this.customersList.reduce((acc, c) => acc + (c.outstanding_balance_cents || 0), 0);
        const formattedOutstanding = '₹' + (totalOutstanding / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

        container.innerHTML = `
            <!-- Top Summary Cards (Shadcn Metric Style) -->
            <div class="shadcn-metrics-grid" style="margin-bottom: 20px;">
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">REGISTERED CLIENTS & B2C</span>
                    <div class="shadcn-metric-val">${totalCustomers} <span style="font-size: 13px; font-weight: 400; color: var(--text-muted);">accounts</span></div>
                    <span class="shadcn-trend-pill up">✓ Live Cloud Synced</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">TRADE RECEIVABLES BALANCE</span>
                    <div class="shadcn-metric-val" style="color: ${totalOutstanding > 0 ? '#ef4444' : '#22c55e'};">${formattedOutstanding}</div>
                    <span class="shadcn-trend-pill ${totalOutstanding > 0 ? 'down' : 'up'}">Outstanding Debtor Ledger</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">GSTIN COMPLIANCE</span>
                    <div class="shadcn-metric-val" style="color: #60a5fa;">B2B + B2C POS</div>
                    <span class="shadcn-trend-pill up">HSN/SAC Validation</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">POS MOBILE TRACKING</span>
                    <div class="shadcn-metric-val" style="color: #c084fc;">Real-Time</div>
                    <span class="shadcn-trend-pill up">Auto-Account Creation</span>
                </div>
            </div>

            <!-- Customer Directory Table -->
            <div class="shadcn-table-wrap">
                <div class="shadcn-table-header">
                    <div>
                        <h2 style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0;">Customer Directory (${totalCustomers})</h2>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                            Client ledger with POS mobile number linkage and historical transaction audits
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="cust-search" class="shadcn-input" placeholder="Search by name, phone, code..." style="width: 240px; height: 34px;" oninput="CustomersView.filterTable(this.value)" />
                        <button class="shadcn-btn-primary" onclick="CustomersView.showAddModal()">
                            + Add Customer
                        </button>
                    </div>
                </div>

                <div style="overflow-x: auto;">
                    <table class="shadcn-table" id="customers-table">
                        <thead>
                            <tr>
                                <th>CODE</th>
                                <th>CUSTOMER / COMPANY NAME</th>
                                <th>MOBILE / PHONE</th>
                                <th>GSTIN / TAX ID</th>
                                <th>STATE</th>
                                <th style="text-align: right;">OUTSTANDING</th>
                                <th style="text-align: center;">STATUS</th>
                                <th style="text-align: right;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.customersList.length === 0 ? `
                                <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 36px;">No customers found. Register accounts or bill via POS Cashier.</td></tr>
                            ` : this.customersList.map(c => `
                                <tr>
                                    <td><span class="shadcn-badge blue">${c.code}</span></td>
                                    <td>
                                        <div style="font-weight: 700; color: #ffffff;">${c.name}</div>
                                        <div style="font-size: 11px; color: var(--text-muted);">${c.email || 'No email registered'}</div>
                                    </td>
                                    <td>
                                        ${c.phone 
                                            ? `<span style="font-family: var(--font-mono); font-size: 12px; color: #4ade80;">📱 ${c.phone}</span>` 
                                            : '<span style="color: var(--text-muted); font-size: 11px;">Not specified</span>'}
                                    </td>
                                    <td>
                                        ${c.tax_identifier ? `<span style="font-family: var(--font-mono); font-size: 11px;">${c.tax_identifier}</span>` : '<span style="color: var(--text-muted); font-size: 11px;">Retail (B2C)</span>'}
                                    </td>
                                    <td><span class="shadcn-badge default">${c.state_code === '27' ? '27 - MH' : c.state_code === '29' ? '29 - KA' : c.state_code || '27'}</span></td>
                                    <td style="text-align: right;">
                                        <span style="font-weight: 700; font-family: var(--font-mono); color: ${(c.outstanding_balance_cents || 0) > 0 ? '#ef4444' : '#22c55e'};">
                                            ${c.outstanding_balance_formatted || '₹0.00'}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <span class="shadcn-badge ${c.is_active ? 'green' : 'red'}">
                                            ${c.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td style="text-align: right; white-space: nowrap;">
                                        <button class="shadcn-btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="CustomersView.viewHistory('${c.id}', '${encodeURIComponent(c.name)}', '${c.phone || ''}')" title="View all POS orders and bills">
                                            📜 History
                                        </button>
                                        <button class="shadcn-btn-secondary" style="padding: 4px 8px; font-size: 11px; margin-left: 4px;" onclick="CustomersView.quickPOS('${c.id}', '${encodeURIComponent(c.name)}', '${c.phone || ''}')" title="Start POS sale for this customer">
                                            ⚡ Bill
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Customer Transaction History Modal -->
            <div id="modal-customer-history" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 680px;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title" id="history-cust-title">Customer Order History</h3>
                            <div style="font-size: 11px; color: var(--text-muted);" id="history-cust-sub">All transactions synchronized in Supabase</div>
                        </div>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-customer-history').style.display='none'">✕</button>
                    </div>
                    <div class="shadcn-modal-body" id="history-cust-body" style="padding: 16px;">
                        <!-- Invoices Render Here -->
                    </div>
                    <div class="shadcn-modal-footer">
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-customer-history').style.display='none'">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    filterTable(query) {
        const q = query.toLowerCase();
        const rows = document.querySelectorAll('#customers-table tbody tr');
        rows.forEach(r => {
            const text = r.innerText.toLowerCase();
            r.style.display = text.includes(q) ? '' : 'none';
        });
    },

    quickPOS(customerId, encodedName, phone) {
        const name = decodeURIComponent(encodedName || '');
        window.App.navigateTo('pos');
        setTimeout(() => {
            if (window.PosView) {
                window.PosView.currentCustomer = {
                    id: customerId,
                    name: name || 'Walk-in Retail Cash Customer',
                    phone: phone || '',
                    is_verified: true
                };
                const phoneInput = document.getElementById('pos-cust-phone');
                const nameInput = document.getElementById('pos-cust-name');
                const badge = document.getElementById('cust-sync-badge');
                if (phoneInput) phoneInput.value = phone || '';
                if (nameInput) nameInput.value = name || '';
                if (badge) { badge.className = 'shadcn-badge green'; badge.innerText = '✓ Verified Customer'; }
            }
        }, 150);
    },

    async viewHistory(customerId, encodedName, phone) {
        const name = decodeURIComponent(encodedName || 'Customer');
        const modal = document.getElementById('modal-customer-history');
        const title = document.getElementById('history-cust-title');
        const sub = document.getElementById('history-cust-sub');
        const body = document.getElementById('history-cust-body');

        if (title) title.innerText = `Orders & Bills: ${name}`;
        if (sub) sub.innerText = `Phone: ${phone || 'Unlinked'} • Cloud DB Ledger`;
        if (body) {
            body.innerHTML = `
                <div style="display: flex; justify-content: center; padding: 30px;">
                    <div style="width: 24px; height: 24px; border: 2px solid #27272a; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                </div>
            `;
        }
        if (modal) modal.style.display = 'flex';

        try {
            const txns = await window.SupabaseClient.getCustomerTransactions(customerId);
            if (!txns || txns.length === 0) {
                body.innerHTML = `
                    <div style="text-align: center; color: var(--text-muted); padding: 32px;">
                        No POS transactions recorded for this customer yet.
                    </div>
                `;
                return;
            }

            const totalSpent = txns.reduce((acc, t) => acc + (t.grand_total || 0), 0);
            body.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #18181c; border-radius: 8px; margin-bottom: 14px; border: 1px solid #222226;">
                    <div>
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">TOTAL LIFETIME BILLING</div>
                        <div style="font-size: 20px; font-weight: 800; color: #22c55e; font-family: var(--font-mono);">
                            ₹${(totalSpent / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="shadcn-badge green">${txns.length} Total Invoices</span>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${txns.map(t => {
                        const grandFmt = (t.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        return `
                            <div style="padding: 12px 14px; background: #121215; border: 1px solid #222226; border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <div>
                                        <span style="font-weight: 700; color: #fff; font-family: var(--font-mono); font-size: 13px;">${t.invoice_number}</span>
                                        <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">${t.invoice_date}</span>
                                    </div>
                                    <div style="font-size: 15px; font-weight: 800; color: #22c55e; font-family: var(--font-mono);">
                                        ₹${grandFmt}
                                    </div>
                                </div>
                                <div style="font-size: 12px; color: var(--text-secondary);">
                                    ${(t.lines || []).map(l => `${l.quantity}x ${l.products ? l.products.name : 'Item'}`).join(', ') || 'POS Items'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (e) {
            body.innerHTML = `<div style="color: #ef4444; padding: 20px;">Failed to load transactions: ${e.message}</div>`;
        }
    },

    showAddModal() {
        const existing = document.getElementById('modal-add-customer');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-add-customer';
        modal.className = 'shadcn-modal-backdrop';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="shadcn-modal-dialog" style="max-width: 500px;">
                <div class="shadcn-modal-header">
                    <div>
                        <h3 class="shadcn-modal-title">Register New Customer</h3>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                            Saves B2B account or retail mobile record directly to Supabase
                        </div>
                    </div>
                    <button class="shadcn-modal-close" onclick="document.getElementById('modal-add-customer').remove()">✕</button>
                </div>
                <form onsubmit="CustomersView.handleAddSubmit(event)">
                    <div class="shadcn-modal-body">
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Customer / Company Name *</label>
                            <input type="text" id="cust-add-name" class="shadcn-input" placeholder="e.g. Acme Industrial Solutions Pvt Ltd" required />
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Mobile Number *</label>
                                <input type="tel" id="cust-add-phone" class="shadcn-input" placeholder="9820011223" required />
                            </div>
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">GSTIN / Tax ID</label>
                                <input type="text" id="cust-add-tax" class="shadcn-input" placeholder="27AAACA1234A1Z5" />
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Email</label>
                                <input type="email" id="cust-add-email" class="shadcn-input" placeholder="orders@company.com" />
                            </div>
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">State Code</label>
                                <select id="cust-add-state" class="shadcn-select">
                                    <option value="27">27 - Maharashtra</option>
                                    <option value="29">29 - Karnataka</option>
                                    <option value="07">07 - Delhi</option>
                                    <option value="33">33 - Tamil Nadu</option>
                                    <option value="24">24 - Gujarat</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="shadcn-modal-footer">
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-add-customer').remove()">
                            Cancel
                        </button>
                        <button type="submit" id="cust-submit-btn" class="shadcn-btn-primary">
                            Save to Cloud DB
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async handleAddSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('cust-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        const payload = {
            name: document.getElementById('cust-add-name')?.value.trim(),
            tax_identifier: document.getElementById('cust-add-tax')?.value.trim() || null,
            email: document.getElementById('cust-add-email')?.value.trim() || null,
            phone: document.getElementById('cust-add-phone')?.value.trim() || null,
            state_code: document.getElementById('cust-add-state')?.value || '27',
            credit_limit: 0
        };

        try {
            await window.SupabaseClient.createCustomer(payload);
            document.getElementById('modal-add-customer')?.remove();
            window.App.showToast(`Customer "${payload.name}" saved to Supabase!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            console.error("Save customer error", err);
            alert("Failed to save customer: " + err.message);
            submitBtn.disabled = false;
            submitBtn.innerText = 'Save to Cloud DB';
        }
    }
};

window.CustomersView = CustomersView;
