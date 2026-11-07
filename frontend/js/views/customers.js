/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Customers Management View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL
 * ==============================================================================
 */

const CustomersView = {
    customersList: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            this.customersList = await window.SupabaseClient.getCustomers();
            this.renderTable(container);
        } catch (err) {
            console.error("[Customers Load Error]", err);
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading customers from Supabase:</strong> ${err.message}<br>
                    <button class="tblr-btn tblr-btn-primary" style="margin-top: 12px;" onclick="CustomersView.render(document.getElementById('main-content'))">Retry Sync</button>
                </div>
            `;
        }
    },

    renderTable(container) {
        const totalCustomers = this.customersList.length;
        const totalOutstanding = this.customersList.reduce((acc, c) => acc + (c.outstanding_balance_cents || 0), 0);
        const formattedOutstanding = '₹' + (totalOutstanding / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

        container.innerHTML = `
            <!-- Top Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px;">
                <div class="tblr-card" style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase;">Active Customers</div>
                    <div style="font-size: 24px; font-weight: 700; color: #fff; margin-top: 4px;">${totalCustomers}</div>
                    <div style="font-size: 11px; color: #2fb344; margin-top: 2px;">✓ Verified B2B & Retail</div>
                </div>
                <div class="tblr-card" style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase;">Total Receivables</div>
                    <div style="font-size: 24px; font-weight: 700; color: #fff; margin-top: 4px;">${formattedOutstanding}</div>
                    <div style="font-size: 11px; color: var(--tblr-text-secondary); margin-top: 2px;">Trade Debtors Balance</div>
                </div>
                <div class="tblr-card" style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase;">Compliance Status</div>
                    <div style="font-size: 24px; font-weight: 700; color: #206bc4; margin-top: 4px;">GST Registered</div>
                    <div style="font-size: 11px; color: var(--tblr-text-muted); margin-top: 2px;">HSN / SAC Invoicing</div>
                </div>
            </div>

            <!-- Customer Table Card -->
            <div class="tblr-card">
                <div class="tblr-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--tblr-border-color);">
                    <div>
                        <h3 class="tblr-card-title" style="margin: 0; font-size: 16px;">Customers Directory (${totalCustomers})</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            B2B Corporate and Retail customers synchronized with Supabase
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="cust-search" class="tblr-form-control" placeholder="Search customers..." style="max-width: 200px;" oninput="CustomersView.filterTable(this.value)" />
                        <button class="tblr-btn tblr-btn-primary" onclick="CustomersView.showAddModal()">
                            + Add Customer
                        </button>
                    </div>
                </div>

                <div class="tblr-table-responsive">
                    <table class="tblr-table" id="customers-table">
                        <thead>
                            <tr>
                                <th>CODE</th>
                                <th>CUSTOMER / COMPANY NAME</th>
                                <th>GSTIN / TAX IDENTIFIER</th>
                                <th>CONTACT</th>
                                <th>STATE</th>
                                <th>OUTSTANDING</th>
                                <th>STATUS</th>
                                <th style="text-align: right;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.customersList.length === 0 ? `
                                <tr><td colspan="8" style="text-align: center; color: var(--tblr-text-muted); padding: 32px;">No customers found. Click '+ Add Customer' to register client accounts.</td></tr>
                            ` : this.customersList.map(c => `
                                <tr>
                                    <td><span class="tblr-badge tblr-badge-blue">${c.code}</span></td>
                                    <td>
                                        <div style="font-weight: 600; color: #fff;">${c.name}</div>
                                    </td>
                                    <td>
                                        ${c.tax_identifier ? `<span style="font-family: monospace; font-size: 12px;">${c.tax_identifier}</span>` : '<span style="color: var(--tblr-text-muted); font-size: 11px;">Unregistered (B2C)</span>'}
                                    </td>
                                    <td>
                                        <div style="font-size: 12px;">${c.email || '—'}</div>
                                        <div style="font-size: 11px; color: var(--tblr-text-muted);">${c.phone || ''}</div>
                                    </td>
                                    <td><span class="tblr-badge tblr-badge-default">${c.state_code === '27' ? '27 - MH' : c.state_code === '29' ? '29 - KA' : c.state_code || '27'}</span></td>
                                    <td>
                                        <span style="font-weight: 600; color: ${(c.outstanding_balance_cents || 0) > 0 ? '#ff6b6b' : '#2fb344'};">
                                            ${c.outstanding_balance_formatted || '₹0.00'}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="tblr-badge ${c.is_active ? 'tblr-badge-green' : 'tblr-badge-red'}">
                                            ${c.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="text-align: right;">
                                        <button class="tblr-btn tblr-btn-sm tblr-btn-default" title="Create Sale" onclick="CustomersView.quickPOS('${c.id}')">
                                            ⚡ Bill
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
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

    quickPOS(customerId) {
        window.App.navigateTo('pos');
        setTimeout(() => {
            const sel = document.getElementById('pos-customer-select');
            if (sel) sel.value = customerId;
        }, 100);
    },

    showAddModal() {
        const existing = document.getElementById('modal-add-customer');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-add-customer';
        modal.className = 'tblr-modal-backdrop';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 500px;">
                <div class="tblr-modal-header">
                    <div>
                        <h3 class="tblr-modal-title">Add New Customer</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            Registers a new B2B or retail customer in Supabase PostgreSQL
                        </div>
                    </div>
                    <button class="tblr-modal-close" onclick="document.getElementById('modal-add-customer').remove()">✕</button>
                </div>
                <form onsubmit="CustomersView.handleAddSubmit(event)">
                    <div class="tblr-modal-body">
                        <div class="tblr-form-group">
                            <label class="tblr-form-label">Customer / Company Name *</label>
                            <input type="text" id="cust-add-name" class="tblr-form-control" placeholder="e.g. Acme Industrial Solutions Pvt Ltd" required />
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Customer Code</label>
                                <input type="text" id="cust-add-code" class="tblr-form-control" placeholder="CUST-004" />
                            </div>
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">GSTIN / Tax ID</label>
                                <input type="text" id="cust-add-tax" class="tblr-form-control" placeholder="27AAACA1234A1Z5" />
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Email</label>
                                <input type="email" id="cust-add-email" class="tblr-form-control" placeholder="orders@company.com" />
                            </div>
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Phone</label>
                                <input type="text" id="cust-add-phone" class="tblr-form-control" placeholder="+91 9820011223" />
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">State Code</label>
                                <select id="cust-add-state" class="tblr-form-control">
                                    <option value="27">27 - Maharashtra</option>
                                    <option value="29">29 - Karnataka</option>
                                    <option value="07">07 - Delhi</option>
                                    <option value="33">33 - Tamil Nadu</option>
                                    <option value="24">24 - Gujarat</option>
                                </select>
                            </div>
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Credit Limit (₹)</label>
                                <input type="number" id="cust-add-limit" class="tblr-form-control" placeholder="0" min="0" step="1000" />
                            </div>
                        </div>
                    </div>
                    <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="tblr-btn tblr-btn-default" onclick="document.getElementById('modal-add-customer').remove()">
                            Cancel
                        </button>
                        <button type="submit" id="cust-submit-btn" class="tblr-btn tblr-btn-primary">
                            Save Customer
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
            code: document.getElementById('cust-add-code')?.value.trim() || undefined,
            tax_identifier: document.getElementById('cust-add-tax')?.value.trim() || null,
            email: document.getElementById('cust-add-email')?.value.trim() || null,
            phone: document.getElementById('cust-add-phone')?.value.trim() || null,
            state_code: document.getElementById('cust-add-state')?.value || '27',
            credit_limit: Number(document.getElementById('cust-add-limit')?.value) || 0
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
            submitBtn.innerText = 'Save Customer';
        }
    }
};

window.CustomersView = CustomersView;

