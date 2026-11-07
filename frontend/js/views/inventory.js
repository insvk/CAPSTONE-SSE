/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Inventory & Warehouse Stock Ledger View
 * Shadcn UI Kit Dark Theme & 100% Live Supabase PostgreSQL Integration
 * ==============================================================================
 */

const InventoryView = {
    balances: [],
    movements: [],
    activeTab: 'balances', // 'balances' | 'movements'

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
                <div style="width: 28px; height: 28px; border: 2px solid #27272a; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            const [b, m] = await Promise.all([
                window.SupabaseClient.getInventoryBalances(),
                window.SupabaseClient.getStockMovements()
            ]);
            this.balances = b || [];
            this.movements = m || [];
            this.renderView(container);
        } catch (err) {
            container.innerHTML = `
                <div class="shadcn-card" style="border-color: #ef4444; color: #ef4444; padding: 24px;">
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
            <!-- Top Summary Cards (Shadcn Metric Style) -->
            <div class="shadcn-metrics-grid" style="margin-bottom: 20px;">
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">TOTAL PHYSICAL STOCK</span>
                    <div class="shadcn-metric-val">${totalUnits.toLocaleString()} <span style="font-size: 13px; font-weight: 400; color: var(--text-muted);">units</span></div>
                    <span class="shadcn-trend-pill up">✓ On-hand</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">TOTAL VALUATION (WAC)</span>
                    <div class="shadcn-metric-val" style="color: var(--accent-green);">₹${valFormatted}</div>
                    <span class="shadcn-trend-pill up">Weighted Average Cost</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">LOW STOCK ITEMS</span>
                    <div class="shadcn-metric-val" style="color: ${lowStockCount > 0 ? '#ef4444' : '#fff'};">
                        ${lowStockCount} <span style="font-size: 13px; font-weight: 500; color: ${lowStockCount > 0 ? '#ef4444' : '#22c55e'};">${lowStockCount > 0 ? '⚠ Reorder Needed' : '✓ Optimal'}</span>
                    </div>
                    <span class="shadcn-trend-pill ${lowStockCount > 0 ? 'down' : 'up'}">${lowStockCount > 0 ? 'Trigger Purchase Order' : 'All SKUs above threshold'}</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">ACTIVE WAREHOUSES</span>
                    <div class="shadcn-metric-val" style="color: #60a5fa;">2 Hubs</div>
                    <span class="shadcn-trend-pill up">Mumbai HQ & Bengaluru Central</span>
                </div>
            </div>

            <!-- Ledger Tabs Card -->
            <div class="shadcn-table-wrap">
                <div class="shadcn-table-header">
                    <div class="shadcn-tab-pills">
                        <button class="shadcn-tab-btn ${this.activeTab === 'balances' ? 'active' : ''}" onclick="InventoryView.switchTab('balances')">
                            Warehouse Balances (${this.balances.length})
                        </button>
                        <button class="shadcn-tab-btn ${this.activeTab === 'movements' ? 'active' : ''}" onclick="InventoryView.switchTab('movements')">
                            Stock Movement Ledger (${this.movements.length})
                        </button>
                    </div>
                    <button class="shadcn-btn-primary" onclick="InventoryView.showAdjustModal()">
                        ± Stock Adjustment
                    </button>
                </div>

                <div style="overflow-x: auto;" id="inventory-tab-content">
                    ${this.activeTab === 'balances' ? this.renderBalancesTable() : this.renderMovementsTable()}
                </div>
            </div>

            <!-- Stock Adjustment Modal -->
            <div id="modal-adjust-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 480px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <h3 class="tblr-modal-title" style="color: #fff; font-size: 16px;">Record Stock Adjustment</h3>
                        <button class="tblr-modal-close" onclick="InventoryView.hideAdjustModal()">✕</button>
                    </div>
                    <form onsubmit="InventoryView.handleAdjustment(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Warehouse Hub</label>
                                <select id="adj-warehouse" class="shadcn-select">
                                    <option value="20000000-0000-0000-0000-000000000001">Main Central Distribution Hub (Mumbai)</option>
                                    <option value="20000000-0000-0000-0000-000000000002">Bandra Retail Store Checkout (WH-POS1)</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Select Product SKU *</label>
                                <select id="adj-product" class="shadcn-select" required>
                                    ${this.balances.map(b => `<option value="${b.product_id}">${b.sku} - ${b.product_name} (Current: ${b.quantity_on_hand})</option>`).join('')}
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Quantity Delta *</label>
                                    <input type="number" id="adj-delta" class="shadcn-input" placeholder="+10 or -5" required />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Audit Reason</label>
                                    <select id="adj-reason" class="shadcn-select">
                                        <option value="Physical Cycle Count Reconciliation">Cycle Count Reconciliation</option>
                                        <option value="Damaged Goods Discard">Damaged Goods Discard</option>
                                        <option value="Internal Demo Usage">Internal Demo Usage</option>
                                        <option value="Supplier Return">Supplier Return</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="padding: 16px 20px; border-top: 1px solid #222226; display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideAdjustModal()">Cancel</button>
                            <button type="submit" class="shadcn-btn-primary">Apply Adjustment</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderBalancesTable() {
        if (!this.balances || this.balances.length === 0) {
            return `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No stock balances recorded yet. Click '+ Stock Adjustment' to record initial physical inventory.</div>`;
        }

        return `
            <table class="shadcn-table">
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
                                    <div style="font-size: 12px; color: var(--text-secondary);">${b.product_name}</div>
                                </td>
                                <td><span class="shadcn-badge blue">${b.warehouse_name}</span></td>
                                <td style="text-align: right; font-weight: 700; font-family: var(--font-mono); color: #fff;">${b.quantity_on_hand}</td>
                                <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">${b.quantity_reserved}</td>
                                <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${b.quantity_available > 0 ? '#22c55e' : '#ef4444'};">${b.quantity_available}</td>
                                <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">₹${wac}</td>
                                <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #fff;">₹${totalVal}</td>
                                <td style="text-align: center;">
                                    <span class="shadcn-badge ${b.is_low_stock ? 'red' : 'green'}">
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
            return `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No stock movements recorded yet. Movements automatically log on Sales, GRN, and Adjustments.</div>`;
        }

        return `
            <table class="shadcn-table">
                <thead>
                    <tr>
                        <th>TIMESTAMP</th>
                        <th>TYPE</th>
                        <th>REF NUMBER</th>
                        <th>SKU</th>
                        <th>PRODUCT</th>
                        <th style="text-align: right;">QUANTITY DELTA</th>
                        <th style="text-align: right;">UNIT COST</th>
                        <th>REASON / NOTES</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.movements.map(m => {
                        const isPos = m.quantity_delta > 0;
                        const cost = (m.unit_cost / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        const dateStr = new Date(m.movement_date).toLocaleString();
                        return `
                            <tr>
                                <td style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${dateStr}</td>
                                <td><span class="shadcn-badge ${isPos ? 'green' : 'blue'}">${m.movement_type}</span></td>
                                <td style="font-family: var(--font-mono); font-weight: 600; color: #fff;">${m.reference_number}</td>
                                <td style="font-family: var(--font-mono); color: #60a5fa;">${m.sku}</td>
                                <td style="color: #e4e4e7;">${m.product_name}</td>
                                <td style="text-align: right; font-weight: 800; font-family: var(--font-mono); color: ${isPos ? '#22c55e' : '#ef4444'};">
                                    ${isPos ? '+' : ''}${m.quantity_delta}
                                </td>
                                <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">₹${cost}</td>
                                <td style="font-size: 12px; color: var(--text-secondary);">${m.notes || '—'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    switchTab(tab) {
        this.activeTab = tab;
        const content = document.getElementById('inventory-tab-content');
        if (content) {
            content.innerHTML = tab === 'balances' ? this.renderBalancesTable() : this.renderMovementsTable();
        }
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
        try {
            const whId = document.getElementById('adj-warehouse').value;
            const prodId = document.getElementById('adj-product').value;
            const delta = parseInt(document.getElementById('adj-delta').value, 10);
            const reason = document.getElementById('adj-reason').value;

            App.showToast('Recording physical stock adjustment in Supabase...', 'info');

            await window.SupabaseClient.adjustStock(whId, prodId, delta, reason);
            this.hideAdjustModal();
            App.showToast('Stock adjustment successfully synchronized with live database!', 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Adjustment failed: ${err.message}`, 'danger');
        }
    }
};

window.InventoryView = InventoryView;
