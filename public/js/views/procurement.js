/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Procurement & Supply Chain View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL
 * ==============================================================================
 */

const ProcurementView = {
    suppliers: [],
    purchaseOrders: [],
    products: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            const [s, po, p] = await Promise.all([
                window.SupabaseClient.getSuppliers(),
                window.SupabaseClient.getPurchaseOrders(),
                window.SupabaseClient.getProducts()
            ]);
            this.suppliers = s;
            this.purchaseOrders = po;
            this.products = p;
            this.renderView(container);
        } catch (err) {
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading procurement data:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderView(container) {
        container.innerHTML = `
            <!-- Top Controls -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2 style="font-size: 18px; font-weight: 700; color: #fff; margin: 0;">Procurement & Inward Logistics</h2>
                    <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 4px;">Vendor purchasing, Purchase Orders, and Goods Receipt Notes (GRN)</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="tblr-btn tblr-btn-default" onclick="ProcurementView.showAddSupplierModal()">
                        + Add Supplier
                    </button>
                    <button class="tblr-btn tblr-btn-primary" onclick="ProcurementView.showGRNModal()">
                        📥 Receive Inward Stock (GRN)
                    </button>
                </div>
            </div>

            <!-- Two Columns: Suppliers & Active POs -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- Column 1: Supplier Directory -->
                <div class="tblr-card">
                    <div class="tblr-card-header" style="padding: 14px 20px; border-bottom: 1px solid var(--tblr-border-color);">
                        <h3 class="tblr-card-title" style="margin: 0; font-size: 15px;">Registered Suppliers (${this.suppliers.length})</h3>
                    </div>
                    <div class="tblr-table-responsive">
                        <table class="tblr-table">
                            <thead>
                                <tr>
                                    <th>SUPPLIER NAME</th>
                                    <th>CONTACT</th>
                                    <th>GSTIN</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.suppliers.map(s => `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 700; color: #fff;">${s.name}</div>
                                            <div style="font-size: 11px; color: var(--tblr-text-muted); font-family: monospace;">${s.code}</div>
                                        </td>
                                        <td>
                                            <div style="color: #e2e8f0; font-size: 12px;">${s.contact_person || '—'}</div>
                                            <div style="font-size: 11px; color: var(--tblr-primary);">${s.phone || s.email || '—'}</div>
                                        </td>
                                        <td style="font-family: monospace; font-size: 11px; color: var(--tblr-text-muted);">${s.tax_identifier || 'UNREGISTERED'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Column 2: Purchase Orders & Inward Logs -->
                <div class="tblr-card">
                    <div class="tblr-card-header" style="padding: 14px 20px; border-bottom: 1px solid var(--tblr-border-color);">
                        <h3 class="tblr-card-title" style="margin: 0; font-size: 15px;">Purchase Orders (${this.purchaseOrders.length})</h3>
                    </div>
                    <div class="tblr-table-responsive">
                        <table class="tblr-table">
                            <thead>
                                <tr>
                                    <th>PO NUMBER</th>
                                    <th>SUPPLIER</th>
                                    <th>AMOUNT</th>
                                    <th style="text-align: center;">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.purchaseOrders.length === 0 ? `
                                    <tr><td colspan="4" style="text-align: center; color: var(--tblr-text-muted); padding: 24px;">No purchase orders recorded.</td></tr>
                                ` : this.purchaseOrders.map(po => `
                                    <tr>
                                        <td style="font-weight: 700; font-family: monospace; color: #fff;">${po.po_number}</td>
                                        <td style="color: #e2e8f0;">${po.supplier_name}</td>
                                        <td style="font-family: monospace; color: #2fb344; font-weight: 700;">₹${((po.grand_total || 0) / 100).toLocaleString('en-IN')}</td>
                                        <td style="text-align: center;"><span class="tblr-badge tblr-badge-blue">${po.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- GRN Modal -->
            <div id="modal-procurement-grn" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 500px;">
                    <div class="tblr-modal-header">
                        <h3 class="tblr-modal-title">Receive Inward Stock (GRN)</h3>
                        <button class="tblr-modal-close" onclick="ProcurementView.hideGRNModal()">✕</button>
                    </div>
                    <form onsubmit="ProcurementView.handleGRNSubmit(event)">
                        <div class="tblr-modal-body">
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Receiving Warehouse *</label>
                                <select id="grn-warehouse" class="tblr-form-control">
                                    <option value="20000000-0000-0000-0000-000000000001">Main Central Distribution Hub (Mumbai)</option>
                                    <option value="20000000-0000-0000-0000-000000000002">Bandra Retail Store Checkout (WH-POS1)</option>
                                </select>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Product to Receive *</label>
                                <select id="grn-product" class="tblr-form-control" required>
                                    ${this.products.map(p => `<option value="${p.id}">${p.sku} - ${p.name}</option>`).join('')}
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Received Quantity (Units) *</label>
                                    <input type="number" id="grn-qty" class="tblr-form-control" value="20" min="1" required />
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Inward Unit Cost (₹) *</label>
                                    <input type="number" step="0.01" id="grn-unit-cost" class="tblr-form-control" placeholder="6500.00" required />
                                </div>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Delivery Challan / Invoice Notes</label>
                                <input type="text" id="grn-notes" class="tblr-form-control" placeholder="e.g. Challan #DC-9821 from TechDistributors" />
                            </div>

                            <div style="padding: 10px; background: rgba(32, 107, 196, 0.1); border: 1px solid #206bc4; border-radius: 6px; font-size: 11px; color: #60a5fa;">
                                ℹ Receiving stock automatically updates quantity on hand and recalculates Weighted Average Cost (WAC) inside PostgreSQL.
                            </div>
                        </div>
                        <div class="tblr-modal-footer">
                            <button type="button" class="tblr-btn tblr-btn-default" onclick="ProcurementView.hideGRNModal()">Cancel</button>
                            <button type="submit" id="btn-save-grn" class="tblr-btn tblr-btn-primary">Post GRN & Recalculate WAC</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Add Supplier Modal -->
            <div id="modal-add-supplier" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 460px;">
                    <div class="tblr-modal-header">
                        <h3 class="tblr-modal-title">Register New Supplier</h3>
                        <button class="tblr-modal-close" onclick="ProcurementView.hideAddSupplierModal()">✕</button>
                    </div>
                    <form onsubmit="ProcurementView.handleCreateSupplier(event)">
                        <div class="tblr-modal-body">
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Supplier Business Name *</label>
                                <input type="text" id="supp-name" class="tblr-form-control" placeholder="e.g. Reliance Electronics Supply Ltd" required />
                            </div>
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Contact Person</label>
                                <input type="text" id="supp-contact" class="tblr-form-control" placeholder="e.g. Rajesh Kumar" />
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Phone</label>
                                    <input type="text" id="supp-phone" class="tblr-form-control" placeholder="+91 98200..." />
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">GSTIN / Tax ID</label>
                                    <input type="text" id="supp-gstin" class="tblr-form-control" placeholder="27AABC..." />
                                </div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer">
                            <button type="button" class="tblr-btn tblr-btn-default" onclick="ProcurementView.hideAddSupplierModal()">Cancel</button>
                            <button type="submit" id="btn-save-supp" class="tblr-btn tblr-btn-primary">Save Supplier</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    showGRNModal() {
        const m = document.getElementById('modal-procurement-grn');
        if (m) m.style.display = 'flex';
    },

    hideGRNModal() {
        const m = document.getElementById('modal-procurement-grn');
        if (m) m.style.display = 'none';
    },

    showAddSupplierModal() {
        const m = document.getElementById('modal-add-supplier');
        if (m) m.style.display = 'flex';
    },

    hideAddSupplierModal() {
        const m = document.getElementById('modal-add-supplier');
        if (m) m.style.display = 'none';
    },

    async handleGRNSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-grn');
        if (btn) { btn.disabled = true; btn.innerText = 'Posting to Cloud...'; }

        const whId = document.getElementById('grn-warehouse')?.value;
        const prodId = document.getElementById('grn-product')?.value;
        const qty = parseInt(document.getElementById('grn-qty')?.value, 10);
        const unitCost = parseFloat(document.getElementById('grn-unit-cost')?.value || '0') * 100;
        const notes = document.getElementById('grn-notes')?.value;

        try {
            await window.SupabaseClient.receiveGoods({
                warehouse_id: whId,
                product_id: prodId,
                quantity_received: qty,
                unit_cost_cents: unitCost,
                notes: notes
            });

            App.showToast(`Goods Receipt posted! Stock & Weighted Average Cost updated.`, 'success');
            this.hideGRNModal();
            this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`GRN failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Post GRN & Recalculate WAC'; }
        }
    },

    async handleCreateSupplier(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-supp');
        if (btn) { btn.disabled = true; btn.innerText = 'Saving...'; }

        const name = document.getElementById('supp-name')?.value;
        const contact = document.getElementById('supp-contact')?.value;
        const phone = document.getElementById('supp-phone')?.value;
        const gstin = document.getElementById('supp-gstin')?.value;

        try {
            await window.SupabaseClient.createSupplier({
                name,
                contact_person: contact,
                phone,
                tax_identifier: gstin
            });

            App.showToast(`Supplier ${name} created in Supabase!`, 'success');
            this.hideAddSupplierModal();
            this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Save Supplier'; }
        }
    }
};

window.ProcurementView = ProcurementView;
