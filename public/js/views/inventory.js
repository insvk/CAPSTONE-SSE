/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise Stock Ledger & Inventory Management
 * Shadcn UI Kit Dark Theme & 100% Live Supabase PostgreSQL Integration
 * Multiple Stock Management Modes: CSV Import, Inward, Outward, Transfer & Audit
 * Zero Emojis - Ultra-Clean Enterprise SaaS Aesthetics
 * ==============================================================================
 */

const InventoryView = {
    balances: [],
    movements: [],
    activeTab: 'balances', // 'balances' | 'movements'
    filterWarehouse: 'all',
    filterCategory: 'all',
    filterStatus: 'all',
    searchQuery: '',

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
            <!-- Top Metric Summaries -->
            <div class="shadcn-metrics-grid" style="margin-bottom: 20px;">
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">TOTAL PHYSICAL STOCK</span>
                    <div class="shadcn-metric-val">${totalUnits.toLocaleString()} <span style="font-size: 13px; font-weight: 400; color: var(--text-muted);">units</span></div>
                    <span class="shadcn-trend-pill up">Verified On-Hand</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">TOTAL VALUATION (WAC)</span>
                    <div class="shadcn-metric-val" style="color: var(--accent-green);">₹${valFormatted}</div>
                    <span class="shadcn-trend-pill up">Weighted Average Cost</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">LOW STOCK ITEMS</span>
                    <div class="shadcn-metric-val" style="color: ${lowStockCount > 0 ? '#ef4444' : '#fff'};">
                        ${lowStockCount} <span style="font-size: 13px; font-weight: 500; color: ${lowStockCount > 0 ? '#ef4444' : '#22c55e'};">${lowStockCount > 0 ? 'Reorder Needed' : 'Optimal'}</span>
                    </div>
                    <span class="shadcn-trend-pill ${lowStockCount > 0 ? 'down' : 'up'}">${lowStockCount > 0 ? 'Trigger Purchase Order' : 'All SKUs above threshold'}</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">ACTIVE WAREHOUSES</span>
                    <div class="shadcn-metric-val" style="color: #60a5fa;">2 Hubs</div>
                    <span class="shadcn-trend-pill up">Mumbai Central & Bandra POS</span>
                </div>
            </div>

            <!-- Master Inventory Workspace Card -->
            <div class="shadcn-table-wrap">
                <!-- Top Action & Navigation Bar -->
                <div class="shadcn-table-header" style="flex-wrap: wrap; gap: 12px;">
                    <div class="shadcn-tab-pills">
                        <button class="shadcn-tab-btn ${this.activeTab === 'balances' ? 'active' : ''}" onclick="InventoryView.switchTab('balances')">
                            Warehouse Balances (${this.balances.length})
                        </button>
                        <button class="shadcn-tab-btn ${this.activeTab === 'movements' ? 'active' : ''}" onclick="InventoryView.switchTab('movements')">
                            Stock Movement Ledger (${this.movements.length})
                        </button>
                    </div>

                    <!-- Multiple Stock Management Options -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                        <button class="shadcn-btn-secondary" style="height: 32px; font-size: 12px; padding: 0 12px;" onclick="InventoryView.showBulkImportModal()" title="Import stock from CSV / spreadsheet data">
                            Import Stock (CSV)
                        </button>
                        <button class="shadcn-btn-secondary" style="height: 32px; font-size: 12px; padding: 0 12px;" onclick="InventoryView.showTransferModal()" title="Transfer stock between warehouse hubs">
                            Inter-Hub Transfer
                        </button>
                        <button class="shadcn-btn-secondary" style="height: 32px; font-size: 12px; padding: 0 12px;" onclick="InventoryView.showReconcileModal()" title="Physical cycle count reconciliation">
                            Cycle Count Audit
                        </button>
                        <button class="shadcn-btn-primary" style="height: 32px; font-size: 12px; padding: 0 14px;" onclick="InventoryView.showAdjustModal()">
                            + Stock Adjustment
                        </button>
                    </div>
                </div>

                <!-- Secondary Filter & Categorization Bar -->
                <div style="padding: 12px 20px; background: #141417; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <!-- Warehouse Filter -->
                        <select id="filter-inv-warehouse" class="shadcn-select" style="height: 32px; font-size: 12px; width: 170px;" onchange="InventoryView.setWarehouseFilter(this.value)">
                            <option value="all">All Warehouse Hubs</option>
                            <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub</option>
                            <option value="20000000-0000-0000-0000-000000000002">Bandra Retail Store</option>
                        </select>

                        <!-- Stock Status Filter -->
                        <select id="filter-inv-status" class="shadcn-select" style="height: 32px; font-size: 12px; width: 160px;" onchange="InventoryView.setStatusFilter(this.value)">
                            <option value="all">All Stock Statuses</option>
                            <option value="low">Low Stock / Reorder</option>
                            <option value="in_stock">Healthy Stock</option>
                            <option value="zero">Zero Stock / Depleted</option>
                        </select>

                        <!-- Live Search Input -->
                        <input type="text" id="filter-inv-search" class="shadcn-input" placeholder="Search SKU or Product Name..." style="height: 32px; font-size: 12px; width: 220px;" oninput="InventoryView.setSearchQuery(this.value)" />
                    </div>

                    <div>
                        <button class="shadcn-btn-secondary" style="height: 32px; font-size: 11px; padding: 0 10px;" onclick="InventoryView.exportLedgerCSV()">
                            Export CSV
                        </button>
                    </div>
                </div>

                <!-- Tab Content Area -->
                <div style="overflow-x: auto;" id="inventory-tab-content">
                    ${this.activeTab === 'balances' ? this.renderBalancesTable() : this.renderMovementsTable()}
                </div>
            </div>

            <!-- Modal 1: Stock Adjustment -->
            <div id="modal-adjust-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 480px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #fff; font-size: 16px; margin: 0;">Record Stock Adjustment</h3>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Inward or outward physical inventory delta</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideAdjustModal()">Close</button>
                    </div>
                    <form onsubmit="InventoryView.handleAdjustment(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Warehouse Hub *</label>
                                <select id="adj-warehouse" class="shadcn-select" required>
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

            <!-- Modal 2: Bulk CSV Stock Import -->
            <div id="modal-bulk-import-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 580px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #fff; font-size: 16px; margin: 0;">Bulk Stock CSV Import</h3>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Import large batches of stock into Supabase with automatic WAC recalculation</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideBulkImportModal()">Close</button>
                    </div>
                    <form onsubmit="InventoryView.handleBulkImport(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Destination Warehouse Hub *</label>
                                <select id="import-warehouse" class="shadcn-select" required>
                                    <option value="20000000-0000-0000-0000-000000000001">Main Central Distribution Hub (Mumbai)</option>
                                    <option value="20000000-0000-0000-0000-000000000002">Bandra Retail Store Checkout (WH-POS1)</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <label style="font-size: 12px; color: var(--text-secondary);">CSV Stock Data (Paste or enter rows)</label>
                                    <button type="button" class="shadcn-btn-secondary" style="height: 24px; padding: 0 8px; font-size: 10px;" onclick="InventoryView.insertSampleCSV()">
                                        Insert Sample CSV
                                    </button>
                                </div>
                                <textarea id="import-csv-text" class="shadcn-input" style="height: 140px; font-family: var(--font-mono); font-size: 12px; padding: 10px; resize: vertical;" placeholder="SKU, Quantity, UnitPriceInRupees&#10;PROD-DELL-U27, 25, 45000&#10;PROD-LOGI-MXM, 50, 7500" required></textarea>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Format: SKU, Quantity, Unit Price in Rupees (one item per line)</div>
                            </div>

                            <div style="margin-bottom: 6px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Batch Import Reference Note</label>
                                <input type="text" id="import-notes" class="shadcn-input" placeholder="e.g. Inward Container Shipments Nov 2026" value="Bulk CSV Inventory Inward" />
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="padding: 16px 20px; border-top: 1px solid #222226; display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideBulkImportModal()">Cancel</button>
                            <button type="submit" id="btn-submit-import" class="shadcn-btn-primary">Execute Bulk Inward</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal 3: Inter-Hub Warehouse Stock Transfer -->
            <div id="modal-transfer-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 480px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #fff; font-size: 16px; margin: 0;">Inter-Hub Stock Transfer</h3>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Transfer physical inventory between distribution centers</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideTransferModal()">Close</button>
                    </div>
                    <form onsubmit="InventoryView.handleTransfer(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Source Hub *</label>
                                    <select id="trf-src-warehouse" class="shadcn-select" required>
                                        <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub</option>
                                        <option value="20000000-0000-0000-0000-000000000002">Bandra Retail Store</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Destination Hub *</label>
                                    <select id="trf-dest-warehouse" class="shadcn-select" required>
                                        <option value="20000000-0000-0000-0000-000000000002">Bandra Retail Store</option>
                                        <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub</option>
                                    </select>
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Product SKU to Transfer *</label>
                                <select id="trf-product" class="shadcn-select" required>
                                    ${this.balances.map(b => `<option value="${b.product_id}">${b.sku} - ${b.product_name} (On-Hand: ${b.quantity_on_hand})</option>`).join('')}
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Quantity to Move *</label>
                                    <input type="number" min="1" id="trf-qty" class="shadcn-input" placeholder="e.g. 10" required />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Transfer Note</label>
                                    <input type="text" id="trf-notes" class="shadcn-input" placeholder="Dispatch note / Transit ref" value="Replenish Retail Store" />
                                </div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="padding: 16px 20px; border-top: 1px solid #222226; display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideTransferModal()">Cancel</button>
                            <button type="submit" id="btn-submit-transfer" class="shadcn-btn-primary">Execute Stock Transfer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal 4: Cycle Count Reconciliation -->
            <div id="modal-reconcile-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 480px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #fff; font-size: 16px; margin: 0;">Physical Inventory Audit Reconciliation</h3>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Enter actual physical warehouse count; variance is automatically logged</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideReconcileModal()">Close</button>
                    </div>
                    <form onsubmit="InventoryView.handleReconciliation(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Audit Location *</label>
                                <select id="rec-warehouse" class="shadcn-select" required>
                                    <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Distribution Hub</option>
                                    <option value="20000000-0000-0000-0000-000000000002">Bandra Retail Store</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Product SKU *</label>
                                <select id="rec-product" class="shadcn-select" onchange="InventoryView.updateReconcileExpected(this.value)" required>
                                    ${this.balances.map(b => `<option value="${b.product_id}" data-qty="${b.quantity_on_hand}">${b.sku} - ${b.product_name} (Book Stock: ${b.quantity_on_hand})</option>`).join('')}
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Physical Actual Count *</label>
                                    <input type="number" min="0" id="rec-actual" class="shadcn-input" placeholder="e.g. 45" oninput="InventoryView.calculateVariance(this.value)" required />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Calculated Variance</label>
                                    <div id="rec-variance-display" style="height: 38px; display: flex; align-items: center; font-weight: 700; font-family: var(--font-mono); font-size: 14px; color: var(--text-muted);">
                                        Enter count
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="padding: 16px 20px; border-top: 1px solid #222226; display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideReconcileModal()">Cancel</button>
                            <button type="submit" id="btn-submit-reconcile" class="shadcn-btn-primary">Commit Audit Balance</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    getFilteredBalances() {
        return this.balances.filter(b => {
            // Warehouse filter
            if (this.filterWarehouse !== 'all' && b.warehouse_id !== this.filterWarehouse) {
                return false;
            }
            // Status filter
            if (this.filterStatus === 'low' && !b.is_low_stock) return false;
            if (this.filterStatus === 'in_stock' && b.quantity_on_hand <= 0) return false;
            if (this.filterStatus === 'zero' && b.quantity_on_hand > 0) return false;

            // Search query
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const sku = (b.sku || '').toLowerCase();
                const name = (b.product_name || '').toLowerCase();
                if (!sku.includes(q) && !name.includes(q)) return false;
            }
            return true;
        });
    },

    renderBalancesTable() {
        const list = this.getFilteredBalances();
        if (!list || list.length === 0) {
            return `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No stock balances match your active filters. Click "+ Stock Adjustment" or "Import Stock (CSV)" to add stock.</div>`;
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
                        <th style="text-align: right;">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.map(b => {
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
                                <td style="text-align: right; white-space: nowrap;">
                                    <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px; margin-right: 4px;" onclick="InventoryView.openQuickAdjust('${b.warehouse_id}', '${b.product_id}', '${b.sku}')" title="Adjust stock">
                                        Adjust
                                    </button>
                                    <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px; margin-right: 4px;" onclick="InventoryView.openQuickTransfer('${b.warehouse_id}', '${b.product_id}')" title="Transfer to another hub">
                                        Transfer
                                    </button>
                                    <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="InventoryView.zeroOutStock('${b.id}', '${b.product_id}', '${b.warehouse_id}', '${b.sku}')" title="Write off / zero out balance">
                                        Write-Off
                                    </button>
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

    setWarehouseFilter(val) {
        this.filterWarehouse = val;
        this.refreshTable();
    },

    setStatusFilter(val) {
        this.filterStatus = val;
        this.refreshTable();
    },

    setSearchQuery(q) {
        this.searchQuery = (q || '').trim();
        this.refreshTable();
    },

    refreshTable() {
        const content = document.getElementById('inventory-tab-content');
        if (content && this.activeTab === 'balances') {
            content.innerHTML = this.renderBalancesTable();
        }
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

    openQuickAdjust(warehouseId, productId, sku) {
        this.showAdjustModal();
        const whSelect = document.getElementById('adj-warehouse');
        const prodSelect = document.getElementById('adj-product');
        if (whSelect) whSelect.value = warehouseId;
        if (prodSelect) prodSelect.value = productId;
    },

    showBulkImportModal() {
        const m = document.getElementById('modal-bulk-import-stock');
        if (m) m.style.display = 'flex';
    },

    hideBulkImportModal() {
        const m = document.getElementById('modal-bulk-import-stock');
        if (m) m.style.display = 'none';
    },

    insertSampleCSV() {
        const sample = `PROD-DELL-U27, 25, 45000\nPROD-LOGI-MXM, 40, 7500\nPROD-KEYCH-K2, 30, 8200\nPROD-SAM-T7-1TB, 15, 11500\nPROD-ANKER-HUB, 20, 4200`;
        const textarea = document.getElementById('import-csv-text');
        if (textarea) textarea.value = sample;
    },

    showTransferModal() {
        const m = document.getElementById('modal-transfer-stock');
        if (m) m.style.display = 'flex';
    },

    hideTransferModal() {
        const m = document.getElementById('modal-transfer-stock');
        if (m) m.style.display = 'none';
    },

    openQuickTransfer(sourceWarehouseId, productId) {
        this.showTransferModal();
        const srcSelect = document.getElementById('trf-src-warehouse');
        const prodSelect = document.getElementById('trf-product');
        if (srcSelect) srcSelect.value = sourceWarehouseId;
        if (prodSelect) prodSelect.value = productId;
    },

    showReconcileModal() {
        const m = document.getElementById('modal-reconcile-stock');
        if (m) m.style.display = 'flex';
    },

    hideReconcileModal() {
        const m = document.getElementById('modal-reconcile-stock');
        if (m) m.style.display = 'none';
    },

    updateReconcileExpected(prodId) {
        const actualInput = document.getElementById('rec-actual');
        if (actualInput && actualInput.value) {
            this.calculateVariance(actualInput.value);
        }
    },

    calculateVariance(actualVal) {
        const disp = document.getElementById('rec-variance-display');
        const prodSelect = document.getElementById('rec-product');
        if (!disp || !prodSelect) return;

        const opt = prodSelect.options[prodSelect.selectedIndex];
        const bookQty = opt ? parseInt(opt.getAttribute('data-qty') || '0', 10) : 0;
        const actual = parseInt(actualVal, 10);

        if (isNaN(actual)) {
            disp.innerText = 'Enter count';
            disp.style.color = 'var(--text-muted)';
            return;
        }

        const delta = actual - bookQty;
        if (delta === 0) {
            disp.innerText = '0 (Exact Match)';
            disp.style.color = '#22c55e';
        } else if (delta > 0) {
            disp.innerText = `+${delta} Surplus Units`;
            disp.style.color = '#3b82f6';
        } else {
            disp.innerText = `${delta} Discrepancy (Shrinkage)`;
            disp.style.color = '#ef4444';
        }
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
    },

    async handleBulkImport(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-import');
        if (btn) { btn.disabled = true; btn.innerText = 'Importing to Cloud DB...'; }

        const whId = document.getElementById('import-warehouse').value;
        const rawCSV = document.getElementById('import-csv-text').value.trim();
        const notes = document.getElementById('import-notes').value.trim() || 'Bulk CSV Import';

        const lines = rawCSV.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('SKU'));
        const items = [];

        for (const line of lines) {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                const sku = parts[0];
                const qty = parseInt(parts[1], 10) || 0;
                const unitPrice = parts[2] ? Math.round(parseFloat(parts[2]) * 100) : 0;
                if (sku && qty > 0) {
                    items.push({ sku, quantity: qty, unit_cost_cents: unitPrice, warehouse_id: whId });
                }
            }
        }

        if (items.length === 0) {
            App.showToast('No valid CSV rows parsed. Please check format.', 'warning');
            if (btn) { btn.disabled = false; btn.innerText = 'Execute Bulk Inward'; }
            return;
        }

        try {
            const res = await window.SupabaseClient.importBulkStock(items, whId, notes);
            this.hideBulkImportModal();
            App.showToast(`Successfully imported ${res.successCount} stock items to Supabase!`, 'success');
            if (res.errors && res.errors.length > 0) {
                console.warn('[Import warnings]', res.errors);
            }
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Import failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Execute Bulk Inward'; }
        }
    },

    async handleTransfer(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-transfer');
        if (btn) { btn.disabled = true; btn.innerText = 'Transferring stock...'; }

        const srcWh = document.getElementById('trf-src-warehouse').value;
        const destWh = document.getElementById('trf-dest-warehouse').value;
        const prodId = document.getElementById('trf-product').value;
        const qty = parseInt(document.getElementById('trf-qty').value, 10) || 1;
        const notes = document.getElementById('trf-notes').value.trim() || 'Inter-Hub Transfer';

        if (srcWh === destWh) {
            App.showToast('Source and destination hubs must be different.', 'warning');
            if (btn) { btn.disabled = false; btn.innerText = 'Execute Stock Transfer'; }
            return;
        }

        try {
            await window.SupabaseClient.transferStock(srcWh, destWh, prodId, qty, notes);
            this.hideTransferModal();
            App.showToast(`Transferred ${qty} units successfully!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Transfer failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Execute Stock Transfer'; }
        }
    },

    async handleReconciliation(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-reconcile');
        if (btn) { btn.disabled = true; btn.innerText = 'Committing reconciliation...'; }

        const whId = document.getElementById('rec-warehouse').value;
        const prodId = document.getElementById('rec-product').value;
        const actual = parseInt(document.getElementById('rec-actual').value, 10);

        try {
            await window.SupabaseClient.reconcileStock(whId, prodId, actual, 'Monthly Cycle Audit');
            this.hideReconcileModal();
            App.showToast('Physical inventory audit balance committed to Supabase!', 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Audit failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Commit Audit Balance'; }
        }
    },

    exportLedgerCSV() {
        const rows = [
            ['SKU', 'Product Name', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'Unit WAC (INR)', 'Total Valuation (INR)', 'Low Stock Status']
        ];
        this.balances.forEach(b => {
            rows.push([
                `"${b.sku}"`,
                `"${b.product_name}"`,
                `"${b.warehouse_name}"`,
                b.quantity_on_hand,
                b.quantity_reserved,
                b.quantity_available,
                (b.weighted_avg_cost / 100).toFixed(2),
                ((b.quantity_on_hand * b.weighted_avg_cost) / 100).toFixed(2),
                b.is_low_stock ? 'REORDER NEEDED' : 'OPTIMAL'
            ]);
        });
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `inventory_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        App.showToast('Inventory ledger exported to CSV file.', 'info');
    },

    async zeroOutStock(balanceId, productId, warehouseId, sku) {
        if (!confirm(`Are you sure you want to write-off and zero out all remaining stock for "${sku}" at this warehouse?`)) return;
        try {
            App.showToast(`Zeroing out stock for ${sku}...`, 'info');
            await window.SupabaseClient.deleteStockBalance(balanceId, productId, warehouseId, 'Manual Write-Off / Stock Removal');
            App.showToast(`Stock balance for ${sku} written off successfully.`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Write-off failed: ${err.message}`, 'danger');
        }
    }
};

window.InventoryView = InventoryView;
