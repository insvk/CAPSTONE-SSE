/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Inventory & Warehouse Stock Ledger View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL
 * ==============================================================================
 */

const InventoryView = {
    balances: [],
    movements: [],
    activeTab: 'balances', // 'balances' | 'movements'

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            const [b, m] = await Promise.all([
                window.SupabaseClient.getInventoryBalances(),
                window.SupabaseClient.getStockMovements()
            ]);
            this.balances = b;
            this.movements = m;
            this.renderView(container);
        } catch (err) {
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading inventory from Supabase:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderView(container) {
        let totalUnits = 0;
        let totalValuation = 0;
        let lowStockCount = 0;

        this.balances.forEach(b => {
            totalUnits += b.quantity_on_hand;
            totalValuation += (b.quantity_on_hand * b.weighted_avg_cost);
            if (b.is_low_stock) lowStockCount++;
        });

        const valFormatted = (totalValuation / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

        container.innerHTML = `
            <!-- Top Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;">
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">TOTAL PHYSICAL STOCK</div>
                    <div style="font-size: 22px; font-weight: 800; color: #fff; margin-top: 4px;">${totalUnits.toLocaleString()} <span style="font-size: 13px; font-weight: 500; color: var(--tblr-text-muted);">units</span></div>
                </div>
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">TOTAL VALUATION (WAC)</div>
                    <div style="font-size: 22px; font-weight: 800; color: #2fb344; margin-top: 4px;">₹${valFormatted}</div>
                </div>
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">LOW STOCK ITEMS</div>
                    <div style="font-size: 22px; font-weight: 800; color: ${lowStockCount > 0 ? '#ff6b6b' : '#fff'}; margin-top: 4px;">
                        ${lowStockCount} <span style="font-size: 12px; color: ${lowStockCount > 0 ? '#ff6b6b' : '#2fb344'};">${lowStockCount > 0 ? '⚠ Requires Reorder' : '✓ Optimal'}</span>
                    </div>
                </div>
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">ACTIVE WAREHOUSES</div>
                    <div style="font-size: 22px; font-weight: 800; color: #206bc4; margin-top: 4px;">2 Hubs <span style="font-size: 12px; color: var(--tblr-text-muted); font-weight: 400;">(MH & KA)</span></div>
                </div>
            </div>

            <div class="tblr-card">
                <div class="tblr-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--tblr-border-color);">
                    <div style="display: flex; gap: 8px;">
                        <button class="tblr-btn ${this.activeTab === 'balances' ? 'tblr-btn-primary' : 'tblr-btn-default'}" onclick="InventoryView.switchTab('balances')">
                            Warehouse Balances (${this.balances.length})
                        </button>
                        <button class="tblr-btn ${this.activeTab === 'movements' ? 'tblr-btn-primary' : 'tblr-btn-default'}" onclick="InventoryView.switchTab('movements')">
                            Stock Movement Ledger (${this.movements.length})
                        </button>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="tblr-btn tblr-btn-default" onclick="InventoryView.showAdjustModal()">
                            ± Stock Adjustment
                        </button>
                    </div>
                </div>

                <div class="tblr-table-responsive" id="inventory-tab-content">
                    ${this.activeTab === 'balances' ? this.renderBalancesTable() : this.renderMovementsTable()}
                </div>
            </div>

            <!-- Stock Adjustment Modal -->
            <div id="modal-adjust-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 480px;">
                    <div class="tblr-modal-header">
                        <h3 class="tblr-modal-title">Record Stock Adjustment</h3>
                        <button class="tblr-modal-close" onclick="InventoryView.hideAdjustModal()">✕</button>
                    </div>
                    <form onsubmit="InventoryView.handleAdjustment(event)">
                        <div class="tblr-modal-body">
                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Warehouse</label>
                                <select id="adj-warehouse" class="tblr-form-control">
                                    <option value="20000000-0000-0000-0000-000000000001">Main Central Distribution Hub (Mumbai)</option>
                                    <option value="20000000-0000-0000-0000-000000000002">Bandra Retail Store Checkout (WH-POS1)</option>
                                </select>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Product SKU *</label>
                                <select id="adj-product" class="tblr-form-control" required>
                                    ${this.balances.map(b => `<option value="${b.product_id}">${b.sku} - ${b.product_name} (Current: ${b.quantity_on_hand})</option>`).join('')}
                                </select>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Quantity Adjustment Delta (+/-) *</label>
                                <input type="number" id="adj-delta" class="tblr-form-control" placeholder="e.g. +5 or -2" required />
                                <div style="font-size: 11px; color: var(--tblr-text-muted); margin-top: 4px;">Use positive numbers for inflow/returns, negative for damages/shrinkage.</div>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Audit Reason *</label>
                                <select id="adj-reason" class="tblr-form-control">
                                    <option value="Physical cycle count correction">Physical cycle count correction</option>
                                    <option value="Damaged goods write-off">Damaged goods write-off</option>
                                    <option value="Unrecorded customer return">Unrecorded customer return</option>
                                    <option value="Internal warehouse shrinkage">Internal warehouse shrinkage</option>
                                </select>
                            </div>
                        </div>
                        <div class="tblr-modal-footer">
                            <button type="button" class="tblr-btn tblr-btn-default" onclick="InventoryView.hideAdjustModal()">Cancel</button>
                            <button type="submit" id="btn-save-adj" class="tblr-btn tblr-btn-primary">Apply & Sync</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderBalancesTable() {
        return `
            <table class="tblr-table">
                <thead>
                    <tr>
                        <th>SKU / PRODUCT</th>
                        <th>STORAGE LOCATION</th>
                        <th style="text-align: right;">ON-HAND</th>
                        <th style="text-align: right;">RESERVED</th>
                        <th style="text-align: right;">AVAILABLE</th>
                        <th style="text-align: right;">UNIT WAC</th>
                        <th style="text-align: right;">TOTAL VALUATION</th>
                        <th style="text-align: center;">STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.balances.map(b => {
                        const wac = (b.weighted_avg_cost / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        const totalVal = ((b.quantity_on_hand * b.weighted_avg_cost) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                        return `
                            <tr>
                                <td>
                                    <div style="font-weight: 700; color: #fff;">${b.sku}</div>
                                    <div style="font-size: 12px; color: var(--tblr-text-secondary);">${b.product_name}</div>
                                </td>
                                <td><span class="tblr-badge tblr-badge-blue">${b.warehouse_name}</span></td>
                                <td style="text-align: right; font-weight: 700; font-family: monospace; color: #fff;">${b.quantity_on_hand}</td>
                                <td style="text-align: right; font-family: monospace; color: var(--tblr-text-muted);">${b.quantity_reserved}</td>
                                <td style="text-align: right; font-family: monospace; font-weight: 700; color: ${b.quantity_available > 0 ? '#2fb344' : '#ff6b6b'};">${b.quantity_available}</td>
                                <td style="text-align: right; font-family: monospace; color: var(--tblr-text-muted);">₹${wac}</td>
                                <td style="text-align: right; font-family: monospace; font-weight: 700; color: #fff;">₹${totalVal}</td>
                                <td style="text-align: center;">
                                    <span class="tblr-badge ${b.is_low_stock ? 'tblr-badge-red' : 'tblr-badge-green'}">
                                        ${b.is_low_stock ? 'LOW STOCK' : 'IN STOCK'}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    renderMovementsTable() {
        if (!this.movements || this.movements.length === 0) {
            return `<div style="padding: 32px; text-align: center; color: var(--tblr-text-muted);">No stock movements recorded yet.</div>`;
        }

        return `
            <table class="tblr-table">
                <thead>
                    <tr>
                        <th>TIMESTAMP</th>
                        <th>TYPE</th>
                        <th>REF NUMBER</th>
                        <th>SKU / PRODUCT</th>
                        <th style="text-align: right;">QUANTITY DELTA</th>
                        <th style="text-align: right;">UNIT COST</th>
                        <th>NOTES</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.movements.map(m => {
                        const isPlus = m.quantity_delta > 0;
                        const dateStr = new Date(m.movement_date).toLocaleString();
                        const cost = (m.unit_cost / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        return `
                            <tr>
                                <td style="font-size: 12px; color: var(--tblr-text-muted);">${dateStr}</td>
                                <td><span class="tblr-badge ${isPlus ? 'tblr-badge-green' : 'tblr-badge-blue'}">${m.movement_type}</span></td>
                                <td style="font-weight: 600; font-family: monospace; color: #fff;">${m.reference_number}</td>
                                <td>
                                    <span style="font-weight: 700; color: #fff;">${m.sku}</span>
                                    <span style="font-size: 11px; color: var(--tblr-text-muted); margin-left: 6px;">${m.product_name}</span>
                                </td>
                                <td style="text-align: right; font-weight: 700; font-family: monospace; color: ${isPlus ? '#2fb344' : '#ff6b6b'};">
                                    ${isPlus ? '+' : ''}${m.quantity_delta}
                                </td>
                                <td style="text-align: right; font-family: monospace; color: var(--tblr-text-secondary);">₹${cost}</td>
                                <td style="font-size: 12px; color: var(--tblr-text-muted);">${m.notes || '—'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.renderView(document.getElementById('main-content'));
    },

    showAdjustModal() {
        const m = document.getElementById('modal-adjust-stock');
        if (m) m.style.display = 'flex';
    },

    hideAdjustModal() {
        const m = document.getElementById('modal-adjust-stock');
        if (m) m.style.display = 'none';
    },

    async handleAdjustment(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-adj');
        if (btn) { btn.disabled = true; btn.innerText = 'Syncing...'; }

        const whId = document.getElementById('adj-warehouse')?.value;
        const prodId = document.getElementById('adj-product')?.value;
        const delta = parseInt(document.getElementById('adj-delta')?.value, 10);
        const reason = document.getElementById('adj-reason')?.value;

        try {
            await window.SupabaseClient.adjustStock(whId, prodId, delta, reason);
            App.showToast(`Stock adjusted by ${delta > 0 ? '+' : ''}${delta} units!`, 'success');
            this.hideAdjustModal();
            this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Adjustment failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Apply & Sync'; }
        }
    }
};

window.InventoryView = InventoryView;
