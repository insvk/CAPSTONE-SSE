/**
 * Tabler Dark UI :: Inventory & Stock Ledger View
 */

const InventoryView = {
    async render(container) {
        try {
            const [balances, movements] = await Promise.all([
                api.getInventoryBalances(),
                api.getStockMovements()
            ]);

            container.innerHTML = `
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px;">
                    <button class="tblr-btn tblr-btn-default" onclick="InventoryView.showTransferModal()">
                        ⇄ Transfer Between Warehouses
                    </button>
                    <button class="tblr-btn tblr-btn-primary" onclick="InventoryView.showAdjustModal()">
                        + Quick Stock Adjustment
                    </button>
                </div>

                <div class="tblr-grid" style="margin-bottom: 24px;">
                    <!-- Stock Balances Table -->
                    <div class="tblr-card" style="grid-column: span 12;">
                        <div class="tblr-card-header">
                            <div>
                                <h3 class="tblr-card-title">CURRENT WAREHOUSE STOCK BALANCES</h3>
                                <span class="tblr-card-subtitle">Derived from atomic stock ledger postings</span>
                            </div>
                        </div>

                        <div class="tblr-table-responsive">
                            <table class="tblr-table">
                                <thead>
                                    <tr>
                                        <th>SKU / Product</th>
                                        <th>Warehouse</th>
                                        <th>On Hand</th>
                                        <th>Reserved</th>
                                        <th>Available</th>
                                        <th>Avg Unit Cost</th>
                                        <th>Total Valuation</th>
                                        <th>Stock Health</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${balances.map(b => {
                                        const avail = b.on_hand_qty - b.reserved_qty;
                                        const totalVal = (b.on_hand_qty * (b.average_cost_cents || 0)) / 100;
                                        return `
                                            <tr>
                                                <td>
                                                    <div style="font-weight: 700; color: #ffffff;">${b.sku}</div>
                                                    <div style="font-size: 11px; color: var(--tblr-text-muted);">${b.name}</div>
                                                </td>
                                                <td><span class="tblr-badge tblr-badge-muted">${b.warehouse || 'Central'}</span></td>
                                                <td style="font-weight: 700; font-size: 15px;">${b.on_hand_qty}</td>
                                                <td style="color: var(--tblr-warning);">${b.reserved_qty}</td>
                                                <td style="font-weight: 700; color: var(--tblr-success);">${avail}</td>
                                                <td>₹${((b.average_cost_cents || 0) / 100).toFixed(2)}</td>
                                                <td style="font-weight: 700;">₹${totalVal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                                <td>
                                                    ${avail <= 15 ? 
                                                        '<span class="tblr-badge tblr-badge-danger">Low Stock Alert</span>' : 
                                                        '<span class="tblr-badge tblr-badge-success">Optimal</span>'}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Immutable Stock Movements Ledger -->
                    <div class="tblr-card" style="grid-column: span 12;">
                        <div class="tblr-card-header">
                            <div>
                                <h3 class="tblr-card-title">IMMUTABLE STOCK MOVEMENT AUDIT LEDGER</h3>
                                <span class="tblr-card-subtitle">Full cryptographic trace of all receipts, sales issues, transfers & adjustments</span>
                            </div>
                        </div>

                        <div class="tblr-table-responsive">
                            <table class="tblr-table">
                                <thead>
                                    <tr>
                                        <th>Movement #</th>
                                        <th>Type</th>
                                        <th>Product ID</th>
                                        <th>Quantity</th>
                                        <th>Reason / Details</th>
                                        <th>Timestamp (UTC)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${movements.length === 0 ? `
                                        <tr><td colspan="6" style="text-align: center; color: var(--tblr-text-muted); padding: 24px;">No movements posted yet. Perform a sale or GRN to view ledger entries.</td></tr>
                                    ` : movements.map(m => `
                                        <tr>
                                            <td style="font-family: monospace; font-weight: 700; color: #206bc4;">${m.movement_number}</td>
                                            <td>
                                                <span class="tblr-badge ${
                                                    m.movement_type.includes('RECEIPT') || m.movement_type.includes('ADD') ? 'tblr-badge-success' : 
                                                    m.movement_type.includes('TRANSFER') ? 'tblr-badge-muted' : 'tblr-badge-danger'
                                                }">
                                                    ${m.movement_type}
                                                </span>
                                            </td>
                                            <td style="font-size: 11px; font-family: monospace;">${m.product_id}</td>
                                            <td style="font-weight: 700;">${m.quantity}</td>
                                            <td>${m.reason || (m.from_warehouse ? `${m.from_warehouse} → ${m.to_warehouse}` : 'Transaction issue')}</td>
                                            <td style="color: var(--tblr-text-muted); font-size: 12px;">${m.created_at || 'Just now'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Adjustment Modal -->
                <div id="modal-stock-adjust" class="tblr-modal-backdrop">
                    <div class="tblr-modal">
                        <div class="tblr-modal-header">
                            <h4 class="tblr-modal-title">Record Physical Stock Adjustment</h4>
                            <button class="tblr-modal-close" onclick="InventoryView.closeAdjustModal()">✕</button>
                        </div>
                        <div class="tblr-modal-body">
                            <form onsubmit="InventoryView.handleAdjustSubmit(event)">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Select Target Product *</label>
                                    <select id="adj-product" class="tblr-select" required>
                                        ${balances.map(b => `
                                            <option value="${b.product_id}">${b.name} (${b.sku}) - On Hand: ${b.on_hand_qty}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Adjustment Type *</label>
                                        <select id="adj-type" class="tblr-select">
                                            <option value="ADD">Add Stock (+)</option>
                                            <option value="SUB">Deduct Stock (-)</option>
                                        </select>
                                    </div>
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Quantity *</label>
                                        <input type="number" id="adj-qty" class="tblr-input" min="1" value="5" required>
                                    </div>
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Reason / Auditor Reference</label>
                                    <input type="text" id="adj-reason" class="tblr-input" placeholder="e.g. Physical cycle count variance reconciliation">
                                </div>
                                <div class="tblr-modal-footer" style="padding: 16px 0 0 0; margin-top: 10px;">
                                    <button type="button" class="tblr-btn tblr-btn-default" onclick="InventoryView.closeAdjustModal()">Cancel</button>
                                    <button type="submit" class="tblr-btn tblr-btn-primary">Post Adjustment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Transfer Modal -->
                <div id="modal-stock-transfer" class="tblr-modal-backdrop">
                    <div class="tblr-modal">
                        <div class="tblr-modal-header">
                            <h4 class="tblr-modal-title">Transfer Stock Between Locations</h4>
                            <button class="tblr-modal-close" onclick="InventoryView.closeTransferModal()">✕</button>
                        </div>
                        <div class="tblr-modal-body">
                            <form onsubmit="InventoryView.handleTransferSubmit(event)">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Select Product *</label>
                                    <select id="trf-product" class="tblr-select" required>
                                        ${balances.map(b => `
                                            <option value="${b.product_id}">${b.name} (${b.sku})</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Source Warehouse</label>
                                        <select id="trf-from" class="tblr-select">
                                            <option value="Central Warehouse">Central Warehouse</option>
                                            <option value="Retail Store Hub">Retail Store Hub</option>
                                        </select>
                                    </div>
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Destination Warehouse</label>
                                        <select id="trf-to" class="tblr-select">
                                            <option value="Retail Store Hub">Retail Store Hub</option>
                                            <option value="Central Warehouse">Central Warehouse</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Quantity to Transfer *</label>
                                    <input type="number" id="trf-qty" class="tblr-input" min="1" value="10" required>
                                </div>
                                <div class="tblr-modal-footer" style="padding: 16px 0 0 0; margin-top: 10px;">
                                    <button type="button" class="tblr-btn tblr-btn-default" onclick="InventoryView.closeTransferModal()">Cancel</button>
                                    <button type="submit" class="tblr-btn tblr-btn-primary">Dispatch Transfer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="tblr-card" style="color: var(--tblr-danger);">Failed to load inventory: ${err.message}</div>`;
        }
    },

    showAdjustModal() { document.getElementById('modal-stock-adjust').classList.add('show'); },
    closeAdjustModal() { document.getElementById('modal-stock-adjust').classList.remove('show'); },

    showTransferModal() { document.getElementById('modal-stock-transfer').classList.add('show'); },
    closeTransferModal() { document.getElementById('modal-stock-transfer').classList.remove('show'); },

    async handleAdjustSubmit(e) {
        e.preventDefault();
        try {
            const prodId = document.getElementById('adj-product').value;
            const type = document.getElementById('adj-type').value;
            const qty = parseInt(document.getElementById('adj-qty').value, 10);
            const reason = document.getElementById('adj-reason').value;

            await api.postStockAdjustment({
                product_id: prodId,
                type: type,
                quantity: qty,
                reason: reason
            });

            InventoryView.closeAdjustModal();
            App.showToast('Stock adjustment posted atomically!', 'success');
            InventoryView.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    async handleTransferSubmit(e) {
        e.preventDefault();
        try {
            const prodId = document.getElementById('trf-product').value;
            const fromWh = document.getElementById('trf-from').value;
            const toWh = document.getElementById('trf-to').value;
            const qty = parseInt(document.getElementById('trf-qty').value, 10);

            await api.postStockTransfer({
                product_id: prodId,
                from_warehouse: fromWh,
                to_warehouse: toWh,
                quantity: qty
            });

            InventoryView.closeTransferModal();
            App.showToast('Warehouse transfer movement dispatched!', 'success');
            InventoryView.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    }
};

window.InventoryView = InventoryView;

