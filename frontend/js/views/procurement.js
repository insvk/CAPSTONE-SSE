/**
 * Tabler Dark UI :: Procurement & Suppliers View
 */

const ProcurementView = {
    async render(container) {
        try {
            const [suppliers, pos, balances] = await Promise.all([
                api.getSuppliers(),
                api.getPurchaseOrders(),
                api.getInventoryBalances()
            ]);

            container.innerHTML = `
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px;">
                    <button class="tblr-btn tblr-btn-default" onclick="ProcurementView.showSupplierModal()">
                        + Add Supplier
                    </button>
                    <button class="tblr-btn tblr-btn-primary" onclick="ProcurementView.showGRNModal()">
                        📥 Receive Goods (GRN)
                    </button>
                </div>

                <div class="tblr-grid">
                    <!-- Suppliers Table -->
                    <div class="tblr-card" style="grid-column: span 12;">
                        <div class="tblr-card-header">
                            <div>
                                <h3 class="tblr-card-title">SUPPLIER DIRECTORY</h3>
                                <span class="tblr-card-subtitle">Vendors, contact channels & outstanding accounts payable</span>
                            </div>
                        </div>

                        <div class="tblr-table-responsive">
                            <table class="tblr-table">
                                <thead>
                                    <tr>
                                        <th>Supplier Code</th>
                                        <th>Company Name</th>
                                        <th>Contact Person</th>
                                        <th>Phone / Email</th>
                                        <th>City</th>
                                        <th>Accounts Payable</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${suppliers.map(s => `
                                        <tr>
                                            <td style="font-weight: 700; color: #206bc4;">${s.code}</td>
                                            <td><div style="font-weight: 600;">${s.company_name}</div></td>
                                            <td>${s.contact_person || 'N/A'}</td>
                                            <td style="font-size: 12px; color: var(--tblr-text-secondary);">${s.phone || ''}<br>${s.email || ''}</td>
                                            <td>${s.city || 'Chennai'}</td>
                                            <td style="font-weight: 700; color: var(--tblr-danger);">
                                                ₹${((s.outstanding_payable_cents || 0) / 100).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                            </td>
                                            <td><span class="tblr-badge tblr-badge-success">Active</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Purchase Orders Table -->
                    <div class="tblr-card" style="grid-column: span 12;">
                        <div class="tblr-card-header">
                            <div>
                                <h3 class="tblr-card-title">PURCHASE ORDERS</h3>
                                <span class="tblr-card-subtitle">Inbound procurement tracking and delivery reconciliation</span>
                            </div>
                        </div>

                        <div class="tblr-table-responsive">
                            <table class="tblr-table">
                                <thead>
                                    <tr>
                                        <th>PO Number</th>
                                        <th>Supplier Ref</th>
                                        <th>Order Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pos.length === 0 ? `
                                        <tr><td colspan="5" style="text-align: center; color: var(--tblr-text-muted); padding: 24px;">No POs logged yet.</td></tr>
                                    ` : pos.map(p => `
                                        <tr>
                                            <td style="font-weight: 700; color: #206bc4;">${p.po_number}</td>
                                            <td>${p.supplier_id || 'SUP-LOGIC-01'}</td>
                                            <td style="color: var(--tblr-text-muted); font-size: 12px;">${p.order_date}</td>
                                            <td><span class="tblr-badge tblr-badge-success">${p.status}</span></td>
                                            <td>
                                                <button class="tblr-btn tblr-btn-sm tblr-btn-primary" onclick="ProcurementView.showGRNModal()">
                                                    Receive Stock
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Add Supplier Modal -->
                <div id="modal-add-supplier" class="tblr-modal-backdrop">
                    <div class="tblr-modal">
                        <div class="tblr-modal-header">
                            <h4 class="tblr-modal-title">Register Supplier</h4>
                            <button class="tblr-modal-close" onclick="ProcurementView.closeSupplierModal()">✕</button>
                        </div>
                        <div class="tblr-modal-body">
                            <form onsubmit="ProcurementView.handleSupplierSubmit(event)">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Supplier Code *</label>
                                    <input type="text" id="sup-code" class="tblr-input" required placeholder="e.g. SUP-MICRO-03">
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Company Name *</label>
                                    <input type="text" id="sup-name" class="tblr-input" required placeholder="e.g. MicroTech Component Distributors Ltd.">
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Contact Person</label>
                                        <input type="text" id="sup-contact" class="tblr-input" placeholder="e.g. Alex Henderson">
                                    </div>
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Phone</label>
                                        <input type="text" id="sup-phone" class="tblr-input" placeholder="+91 98400 55443">
                                    </div>
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Email</label>
                                    <input type="email" id="sup-email" class="tblr-input" placeholder="orders@microtech.in">
                                </div>
                                <div class="tblr-modal-footer" style="padding: 16px 0 0 0; margin-top: 10px;">
                                    <button type="button" class="tblr-btn tblr-btn-default" onclick="ProcurementView.closeSupplierModal()">Cancel</button>
                                    <button type="submit" class="tblr-btn tblr-btn-primary">Register</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Goods Receipt (GRN) Modal -->
                <div id="modal-grn" class="tblr-modal-backdrop">
                    <div class="tblr-modal">
                        <div class="tblr-modal-header">
                            <h4 class="tblr-modal-title">Record Goods Receipt Note (GRN)</h4>
                            <button class="tblr-modal-close" onclick="ProcurementView.closeGRNModal()">✕</button>
                        </div>
                        <div class="tblr-modal-body">
                            <form onsubmit="ProcurementView.handleGRNSubmit(event)">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Select Received Product *</label>
                                    <select id="grn-product" class="tblr-select" required>
                                        ${balances.map(b => `
                                            <option value="${b.product_id}">${b.name} (${b.sku}) - Cur Qty: ${b.on_hand_qty}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Received Quantity *</label>
                                        <input type="number" id="grn-qty" class="tblr-input" min="1" value="20" required>
                                    </div>
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Unit Cost (₹) *</label>
                                        <input type="number" step="0.01" id="grn-cost" class="tblr-input" value="4200.00" required>
                                    </div>
                                </div>
                                <div class="tblr-modal-footer" style="padding: 16px 0 0 0; margin-top: 10px;">
                                    <button type="button" class="tblr-btn tblr-btn-default" onclick="ProcurementView.closeGRNModal()">Cancel</button>
                                    <button type="submit" class="tblr-btn tblr-btn-primary">Post Goods Receipt</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="tblr-card" style="color: var(--tblr-danger);">Failed to load procurement: ${err.message}</div>`;
        }
    },

    showSupplierModal() { document.getElementById('modal-add-supplier').classList.add('show'); },
    closeSupplierModal() { document.getElementById('modal-add-supplier').classList.remove('show'); },

    showGRNModal() { document.getElementById('modal-grn').classList.add('show'); },
    closeGRNModal() { document.getElementById('modal-grn').classList.remove('show'); },

    async handleSupplierSubmit(e) {
        e.preventDefault();
        try {
            await api.createSupplier({
                code: document.getElementById('sup-code').value,
                company_name: document.getElementById('sup-name').value,
                contact_person: document.getElementById('sup-contact').value,
                phone: document.getElementById('sup-phone').value,
                email: document.getElementById('sup-email').value,
                city: 'Chennai'
            });

            ProcurementView.closeSupplierModal();
            App.showToast('Supplier registered!', 'success');
            ProcurementView.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    async handleGRNSubmit(e) {
        e.preventDefault();
        try {
            const prodId = document.getElementById('grn-product').value;
            const qty = parseInt(document.getElementById('grn-qty').value, 10);
            const cost = parseFloat(document.getElementById('grn-cost').value);

            await api.receiveGoods({
                product_id: prodId,
                quantity: qty,
                unit_cost_cents: Math.round(cost * 100)
            });

            ProcurementView.closeGRNModal();
            App.showToast('Goods Receipt posted! Inventory and weighted average cost updated in C engine.', 'success');
            ProcurementView.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    }
};

window.ProcurementView = ProcurementView;

