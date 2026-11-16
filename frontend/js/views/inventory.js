/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise Stock Ledger & Inventory Management
 * Shadcn UI Kit Dark Theme & 100% Live Supabase PostgreSQL Integration
 * Multiple Stock Management Modes: CSV Import, Inward, Outward, Transfer & Audit
 * Auto PO Generator for Low Stock, Barcode Studio & Pareto ABC Analytics
 * Zero Emojis - Ultra-Clean Enterprise SaaS Aesthetics
 * ==============================================================================
 */

const InventoryView = {
    balances: [],
    movements: [],
    products: [],
    suppliers: [],
    activeTab: 'balances', // 'balances' | 'movements' | 'analytics'
    filterWarehouse: 'all',
    filterCategory: 'all',
    filterStatus: 'all', // 'all' | 'low' | 'in_stock' | 'zero'
    searchQuery: '',
    _autoPoCandidates: [],
    _barcodeStudioProduct: null,

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
                <div style="width: 28px; height: 28px; border: 2px solid #27272a; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            const [b, m, p, s] = await Promise.all([
                window.SupabaseClient.getInventoryBalances(),
                window.SupabaseClient.getStockMovements(),
                window.SupabaseClient.getProducts().catch(() => []),
                window.SupabaseClient.getSuppliers().catch(() => [])
            ]);
            this.balances = b || [];
            this.movements = m || [];
            this.products = p || [];
            this.suppliers = s || [];
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
            const onHand = Number(b.quantity_on_hand) || 0;
            const wac = Number(b.weighted_avg_cost) || 0;
            totalUnits += onHand;
            totalValuation += (onHand * wac);
            if (b.is_low_stock || onHand <= (b.reorder_point || 20)) {
                lowStockCount++;
            }
        });

        const valFormatted = (totalValuation / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

        container.innerHTML = `
            <!-- Top Metric Summaries -->
            <div class="shadcn-metrics-grid" style="margin-bottom: 20px;">
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">TOTAL PHYSICAL STOCK</span>
                    <div class="shadcn-metric-val">${totalUnits.toLocaleString()} <span style="font-size: 13px; font-weight: 400; color: var(--text-muted);">units</span></div>
                    <span class="shadcn-trend-pill up">Verified On-Hand Across Hubs</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">TOTAL VALUATION (WAC)</span>
                    <div class="shadcn-metric-val" style="color: var(--accent-green);">&#8377;${valFormatted}</div>
                    <span class="shadcn-trend-pill up">Weighted Average Cost Basis</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">LOW STOCK ITEMS</span>
                    <div class="shadcn-metric-val" style="color: ${lowStockCount > 0 ? '#ef4444' : '#fff'};">
                        ${lowStockCount} <span style="font-size: 13px; font-weight: 500; color: ${lowStockCount > 0 ? '#ef4444' : '#22c55e'};">${lowStockCount > 0 ? 'Reorder Needed' : 'Optimal'}</span>
                    </div>
                    <span class="shadcn-trend-pill ${lowStockCount > 0 ? 'down' : 'up'}">${lowStockCount > 0 ? 'Trigger Auto Purchase Order' : 'All SKUs above threshold'}</span>
                </div>
                <div class="shadcn-metric-card">
                    <span class="shadcn-metric-label">ACTIVE WAREHOUSE HUBS</span>
                    <div class="shadcn-metric-val" style="color: #60a5fa;">2 Active Hubs</div>
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
                        <button class="shadcn-tab-btn ${this.activeTab === 'analytics' ? 'active' : ''}" onclick="InventoryView.switchTab('analytics')">
                            Valuation &amp; Stock Analytics
                        </button>
                    </div>

                    <!-- Multiple Stock Management Options -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                        <button class="shadcn-btn-secondary" style="height: 32px; font-size: 12px; padding: 0 12px; color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);" onclick="InventoryView.showAutoPOModal()" title="Auto-generate Purchase Orders for low-stock SKUs">
                            Auto PO (Low Stock)
                        </button>
                        <button class="shadcn-btn-secondary" style="height: 32px; font-size: 12px; padding: 0 12px; color: #a78bfa; border-color: rgba(167, 139, 250, 0.4);" onclick="InventoryView.openBarcodeStudio()" title="Design &amp; Print Thermal Barcode Labels &amp; Shelf Talkers">
                            Barcode Studio
                        </button>
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

                <!-- Secondary Filter & Categorization Bar (only for balances tab) -->
                <div id="inv-filter-bar" style="padding: 12px 20px; background: #141417; border-bottom: 1px solid var(--border-color); display: ${this.activeTab === 'balances' ? 'flex' : 'none'}; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <!-- Warehouse Filter -->
                        <select id="filter-inv-warehouse" class="shadcn-select" style="height: 32px; font-size: 12px; width: 170px;" onchange="InventoryView.setWarehouseFilter(this.value)">
                            <option value="all">All Storage Hubs</option>
                            <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub</option>
                            <option value="20000000-0000-0000-0000-000000000002">Bandra POS Store</option>
                        </select>

                        <!-- Stock Status Categorization Filter -->
                        <select id="filter-inv-status" class="shadcn-select" style="height: 32px; font-size: 12px; width: 160px;" onchange="InventoryView.setStatusFilter(this.value)">
                            <option value="all">All Stock Statuses</option>
                            <option value="low">Low Stock (Reorder)</option>
                            <option value="in_stock">Healthy In-Stock (>0)</option>
                            <option value="zero">Out of Stock (Zero)</option>
                        </select>

                        <!-- Search Box -->
                        <input type="text" id="filter-inv-search" class="shadcn-input" placeholder="Search SKU or Product Name..." style="height: 32px; font-size: 12px; width: 220px;" oninput="InventoryView.setSearchQuery(this.value)" />
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="shadcn-btn-secondary" style="height: 32px; font-size: 11px; padding: 0 10px;" onclick="InventoryView.exportLedgerCSV()" title="Export current filtered view to CSV">
                            Export Balances CSV
                        </button>
                    </div>
                </div>

                <!-- Table Content Container -->
                <div id="inv-table-content" style="overflow-x: auto;">
                    ${this.renderActiveTabContent()}
                </div>
            </div>

            <!-- Modal: Stock Adjustment -->
            <div id="modal-adjust-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 500px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px;">Manual Stock Adjustment</h3>
                        <button class="tblr-modal-close" onclick="InventoryView.hideAdjustModal()">&times;</button>
                    </div>
                    <form onsubmit="InventoryView.handleAdjustment(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Storage Warehouse *</label>
                                <select id="adj-warehouse" class="shadcn-select" onchange="InventoryView.updateAdjStockInfo()" required>
                                    <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub (Main)</option>
                                    <option value="20000000-0000-0000-0000-000000000002">Bandra POS Store</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Product SKU *</label>
                                <select id="adj-product" class="shadcn-select" onchange="InventoryView.updateAdjStockInfo()" required>
                                    <option value="">-- Select Product --</option>
                                    ${this.products.map(p => `<option value="${p.id}">${p.sku} - ${p.name}</option>`).join('')}
                                </select>
                            </div>

                            <div id="adj-stock-info" style="margin-bottom: 14px; padding: 10px 14px; background: #18181b; border: 1px solid #27272a; border-radius: 8px; font-size: 12px; color: var(--text-muted); display: none;">
                                Current On-Hand: <strong id="adj-info-current" style="color: #fff;">0</strong> units
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Adjustment Type *</label>
                                    <select id="adj-type" class="shadcn-select" required>
                                        <option value="CYCLE_COUNT">Physical Cycle Count</option>
                                        <option value="DAMAGED">Damaged / Broken Goods</option>
                                        <option value="EXPIRED">Expired Stock Write-Off</option>
                                        <option value="FOUND">Stock Found / Re-entry</option>
                                        <option value="INITIAL">Initial Inward Entry</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Quantity Delta (+/-) *</label>
                                    <input type="number" id="adj-qty" class="shadcn-input" placeholder="e.g. 10 or -5" required />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Batch / Lot No. (Optional)</label>
                                    <input type="text" id="adj-batch" class="shadcn-input" placeholder="e.g. LOT-2026-A1" />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Expiry Date (Optional)</label>
                                    <input type="date" id="adj-expiry" class="shadcn-input" />
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Reason / Audit Notes *</label>
                                <input type="text" id="adj-notes" class="shadcn-input" placeholder="e.g. Monthly physical audit discrepancy" required />
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideAdjustModal()">Cancel</button>
                            <button type="submit" id="btn-submit-adjust" class="shadcn-btn-primary">Apply Stock Adjustment</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal: Bulk CSV Import -->
            <div id="modal-bulk-import-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 600px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px; margin: 0;">Bulk Stock CSV Import</h3>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Directly inward batch inventory into Supabase Cloud DB</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideBulkImportModal()">&times;</button>
                    </div>
                    <form onsubmit="InventoryView.handleBulkImport(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Destination Warehouse Hub *</label>
                                <select id="import-warehouse" class="shadcn-select" required>
                                    <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub (Main)</option>
                                    <option value="20000000-0000-0000-0000-000000000002">Bandra POS Store</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <label style="font-size: 12px; color: var(--text-secondary); display: block;">CSV Data (SKU, Quantity, UnitPriceINR) *</label>
                                    <button type="button" class="shadcn-btn-secondary" style="height: 24px; padding: 0 8px; font-size: 10px;" onclick="InventoryView.insertSampleCSV()">
                                        Insert Sample CSV
                                    </button>
                                </div>
                                <textarea id="import-csv-text" class="shadcn-input" rows="7" style="font-family: var(--font-mono); font-size: 12px; height: auto;" placeholder="SKU,Quantity,UnitPriceINR&#10;LAP-X1C,25,124999.00&#10;KB-MXM,50,9999.00" required></textarea>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Batch Notes / PO Reference</label>
                                <input type="text" id="import-notes" class="shadcn-input" placeholder="e.g. PO-2026-NOV-SUPP1 Bulk Inward" />
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideBulkImportModal()">Cancel</button>
                            <button type="submit" id="btn-submit-import" class="shadcn-btn-primary">Execute Bulk Inward</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal: Inter-Hub Transfer -->
            <div id="modal-transfer-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 500px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px; margin: 0;">Inter-Hub Stock Transfer</h3>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Move verified stock between warehouses with audit log</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideTransferModal()">&times;</button>
                    </div>
                    <form onsubmit="InventoryView.handleTransfer(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Source Hub *</label>
                                    <select id="trf-src-warehouse" class="shadcn-select" required>
                                        <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub</option>
                                        <option value="20000000-0000-0000-0000-000000000002">Bandra POS Store</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Destination Hub *</label>
                                    <select id="trf-dest-warehouse" class="shadcn-select" required>
                                        <option value="20000000-0000-0000-0000-000000000002">Bandra POS Store</option>
                                        <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub</option>
                                    </select>
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Product SKU to Transfer *</label>
                                <select id="trf-product" class="shadcn-select" required>
                                    ${this.products.map(p => `<option value="${p.id}">${p.sku} - ${p.name}</option>`).join('')}
                                </select>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Transfer Quantity *</label>
                                <input type="number" id="trf-qty" class="shadcn-input" min="1" value="1" required />
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Transfer Notes</label>
                                <input type="text" id="trf-notes" class="shadcn-input" placeholder="e.g. Replenish Bandra POS register" />
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideTransferModal()">Cancel</button>
                            <button type="submit" id="btn-submit-transfer" class="shadcn-btn-primary">Execute Stock Transfer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal: Physical Cycle Reconciliation -->
            <div id="modal-reconcile-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 500px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px; margin: 0;">Physical Cycle Count Audit</h3>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Reconcile system balance with counted shelf inventory</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideReconcileModal()">&times;</button>
                    </div>
                    <form onsubmit="InventoryView.handleReconciliation(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Warehouse Hub *</label>
                                <select id="rec-warehouse" class="shadcn-select" required>
                                    <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub</option>
                                    <option value="20000000-0000-0000-0000-000000000002">Bandra POS Store</option>
                                </select>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Product SKU to Audit *</label>
                                <select id="rec-product" class="shadcn-select" onchange="InventoryView.updateReconcileExpected(this.value)" required>
                                    <option value="">-- Select Product --</option>
                                    ${this.products.map(p => `<option value="${p.id}">${p.sku} - ${p.name}</option>`).join('')}
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">System Recorded Balance</label>
                                    <input type="text" id="rec-expected" class="shadcn-input" readonly style="background: #18181b; color: #a1a1aa; font-family: var(--font-mono);" value="Select product" />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Actual Counted Stock *</label>
                                    <input type="number" id="rec-actual" class="shadcn-input" min="0" placeholder="Counted units" oninput="InventoryView.calculateVariance(this.value)" required />
                                </div>
                            </div>

                            <div id="rec-variance-display" style="padding: 10px 14px; background: #18181b; border: 1px solid #27272a; border-radius: 8px; font-size: 13px; font-weight: 600; display: none;">
                                Variance: <span id="rec-var-val">0</span>
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideReconcileModal()">Cancel</button>
                            <button type="submit" id="btn-submit-reconcile" class="shadcn-btn-primary">Commit Audit Balance</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal: Quick Price Edit -->
            <div id="modal-quick-price-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 440px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px; margin: 0;">Edit Product Price Anytime</h3>
                            <div id="inv-price-sub" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Synchronizes with POS billing and Stock Ledger in Cloud DB</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hidePriceModal()">&times;</button>
                    </div>
                    <form onsubmit="InventoryView.handlePriceSave(event)">
                        <input type="hidden" id="inv-price-prod-id" />
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Selling Price (MRP &#8377;) *</label>
                                <input type="number" step="0.01" id="inv-price-selling" class="shadcn-input" style="font-size: 16px; font-weight: 700; height: 42px;" required />
                            </div>
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Weighted Avg Cost / Purchase Price (&#8377;) *</label>
                                <input type="number" step="0.01" id="inv-price-purchase" class="shadcn-input" style="font-size: 16px; font-weight: 700; height: 42px;" required />
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hidePriceModal()">Cancel</button>
                            <button type="submit" id="btn-save-inv-price" class="shadcn-btn-primary" style="background: #22c55e; color: #09090b; border-color: #22c55e; font-weight: 700;">Save Price in Cloud</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal: Set Exact Physical Count -->
            <div id="modal-set-count-stock" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 440px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px; margin: 0;">Set Exact Physical Stock Count</h3>
                            <div id="inv-setcount-sub" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Overwrites on-hand balance and generates audit entry</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideSetCountModal()">&times;</button>
                    </div>
                    <form onsubmit="InventoryView.handleSetCountSave(event)">
                        <input type="hidden" id="inv-setcount-wh-id" />
                        <input type="hidden" id="inv-setcount-prod-id" />
                        <input type="hidden" id="inv-setcount-curr" />
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">New Verified On-Hand Count *</label>
                                <input type="number" id="inv-setcount-qty" min="0" class="shadcn-input" style="font-size: 18px; font-weight: 700; height: 44px;" required />
                            </div>
                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Verification Reason *</label>
                                <input type="text" id="inv-setcount-reason" class="shadcn-input" value="Floor count verification" required />
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideSetCountModal()">Cancel</button>
                            <button type="submit" id="btn-save-inv-setcount" class="shadcn-btn-primary">Update Cloud Balance</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal: Auto Purchase Order Generator for Low Stock -->
            <div id="modal-auto-po" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 780px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px; margin: 0;">Automated Purchase Order Generator</h3>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Calculates replenishment deficit &amp; creates official Purchase Order in Cloud DB</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideAutoPOModal()">&times;</button>
                    </div>
                    <form onsubmit="InventoryView.handleExecuteAutoPO(event)">
                        <div class="tblr-modal-body" style="padding: 20px; max-height: 65vh; overflow-y: auto;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Primary Supplier *</label>
                                    <select id="auto-po-supplier" class="shadcn-select" required>
                                        ${this.suppliers.map(s => `<option value="${s.id}">${s.name} (${s.code || 'SUPP'})</option>`).join('')}
                                        ${this.suppliers.length === 0 ? `<option value="40000000-0000-0000-0000-000000000001">SIMATS Central Distribution Hub</option>` : ''}
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Receiving Destination Hub *</label>
                                    <select id="auto-po-warehouse" class="shadcn-select" required>
                                        <option value="20000000-0000-0000-0000-000000000001">Mumbai Central Hub (Main)</option>
                                        <option value="20000000-0000-0000-0000-000000000002">Bandra POS Store</option>
                                    </select>
                                </div>
                            </div>

                            <div style="font-size: 12px; font-weight: 700; color: #a1a1aa; margin-bottom: 8px; text-transform: uppercase;">
                                Candidate Deficit Items for Replenishment:
                            </div>

                            <div style="border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
                                <table class="shadcn-table" style="font-size: 12px;">
                                    <thead>
                                        <tr>
                                            <th style="width: 32px;"><input type="checkbox" id="auto-po-check-all" checked onchange="InventoryView.toggleAllPOCandidates(this.checked)" /></th>
                                            <th>SKU &amp; PRODUCT</th>
                                            <th style="text-align: right;">CURRENT STOCK</th>
                                            <th style="text-align: right;">REORDER PT</th>
                                            <th style="text-align: right; width: 110px;">ORDER QTY</th>
                                            <th style="text-align: right;">UNIT COST</th>
                                            <th style="text-align: right;">LINE TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody id="auto-po-tbody">
                                        <!-- populated dynamically -->
                                    </tbody>
                                </table>
                            </div>

                            <div style="background: #17171e; border: 1px solid #242430; border-radius: 8px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 11px; color: #a1a1aa; text-transform: uppercase;">Estimated Order Summary</div>
                                    <div id="auto-po-summary-text" style="font-size: 13px; font-weight: 600; color: #fff; margin-top: 2px;">0 items selected</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 11px; color: #a1a1aa; text-transform: uppercase;">Estimated PO Grand Total</div>
                                    <div id="auto-po-grand-total" style="font-size: 20px; font-weight: 800; color: #22c55e; font-family: var(--font-mono);">&#8377;0.00</div>
                                </div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideAutoPOModal()">Cancel</button>
                            <button type="submit" id="btn-submit-auto-po" class="shadcn-btn-primary" style="background: #f59e0b; color: #000; border-color: #f59e0b; font-weight: 700;">Confirm &amp; Create PO in Cloud DB</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal: Thermal Barcode Label & Shelf-Talker Studio -->
            <div id="modal-barcode-studio" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 680px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px; margin: 0;">Thermal Barcode Label &amp; Shelf-Talker Studio</h3>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Generate and print Code-128 barcode stickers, shelf edge labels, and pricing tags</div>
                        </div>
                        <button class="tblr-modal-close" onclick="InventoryView.hideBarcodeStudio()">&times;</button>
                    </div>
                    <div class="tblr-modal-body" style="padding: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Select Product SKU *</label>
                                <select id="bcode-prod-select" class="shadcn-select" onchange="InventoryView.updateBarcodePreview()" required>
                                    ${this.products.map(p => `<option value="${p.id}">${p.sku} - ${p.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Label Format / Size *</label>
                                <select id="bcode-format-select" class="shadcn-select" onchange="InventoryView.updateBarcodePreview()">
                                    <option value="50x25">50mm x 25mm Thermal Roll (Standard Sticker)</option>
                                    <option value="38x25">38mm x 25mm Compact Jewelry / Hardware Tag</option>
                                    <option value="80mm">80mm Shelf-Talker Strip (Price &amp; Offers)</option>
                                    <option value="a4">A4 Laser Label Sheet (24-up Grid)</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Number of Copies</label>
                                <input type="number" id="bcode-copies-input" class="shadcn-input" min="1" max="500" value="10" oninput="InventoryView.updateBarcodePreview()" />
                            </div>
                            <div style="display: flex; gap: 12px; align-items: flex-end; padding-bottom: 6px;">
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #fff; cursor: pointer;">
                                    <input type="checkbox" id="bcode-opt-price" checked onchange="InventoryView.updateBarcodePreview()" /> Show Price (MRP)
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #fff; cursor: pointer;">
                                    <input type="checkbox" id="bcode-opt-brand" checked onchange="InventoryView.updateBarcodePreview()" /> Show Store Brand
                                </label>
                            </div>
                        </div>

                        <!-- Live Label Preview Area -->
                        <div style="font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; margin-bottom: 8px;">
                            High-Resolution Vector Preview:
                        </div>
                        <div id="bcode-preview-box" style="background: #18181f; border: 1px dashed #3f3f46; border-radius: 8px; padding: 24px; min-height: 140px; display: flex; align-items: center; justify-content: center; overflow-x: auto;">
                            <!-- SVG label generated here -->
                        </div>
                    </div>
                    <div class="tblr-modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid #222226;">
                        <div style="font-size: 12px; color: #a1a1aa;">
                            Target: ESC/POS Thermal Barcode Printers (Zebra, TSC, TVS, Epson)
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="InventoryView.hideBarcodeStudio()">Cancel</button>
                            <button type="button" class="shadcn-btn-primary" style="background: #a78bfa; color: #000; border-color: #a78bfa; font-weight: 700;" onclick="InventoryView.printBarcodeStudioLabels()">
                                Print Thermal Labels
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderActiveTabContent() {
        if (this.activeTab === 'balances') {
            return this.renderBalancesTable();
        } else if (this.activeTab === 'movements') {
            return this.renderMovementsTable();
        } else if (this.activeTab === 'analytics') {
            return this.renderAnalyticsView();
        }
        return '';
    },

    getFilteredBalances() {
        return this.balances.filter(b => {
            if (this.filterWarehouse !== 'all' && b.warehouse_id !== this.filterWarehouse) {
                return false;
            }
            if (this.filterStatus === 'low' && (!b.is_low_stock && b.quantity_on_hand > (b.reorder_point || 20))) return false;
            if (this.filterStatus === 'in_stock' && b.quantity_on_hand <= 0) return false;
            if (this.filterStatus === 'zero' && b.quantity_on_hand > 0) return false;

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
                        <th style="text-align: right;">ON-HAND (INSTANT ADJUST)</th>
                        <th style="text-align: right;">RESERVED</th>
                        <th style="text-align: right;">AVAILABLE</th>
                        <th style="text-align: right;">SELLING PRICE (MRP)</th>
                        <th style="text-align: right;">UNIT COST (WAC)</th>
                        <th style="text-align: right;">TOTAL VALUATION</th>
                        <th style="text-align: center;">STATUS</th>
                        <th style="text-align: right;">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.map(b => {
                        const sell = ((b.selling_price || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        const wac = (b.weighted_avg_cost / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        const totalVal = ((b.quantity_on_hand * b.weighted_avg_cost) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                        const isLow = b.is_low_stock || b.quantity_on_hand <= (b.reorder_point || 20);

                        return `
                            <tr id="row-bal-${b.id}">
                                <td>
                                    <div style="font-weight: 700; color: #fff;">${b.sku}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">${b.product_name}</div>
                                </td>
                                <td><span class="shadcn-badge blue">${b.warehouse_name}</span></td>
                                <td style="text-align: right;">
                                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                                        <button class="shadcn-btn-secondary" style="width: 22px; height: 22px; padding: 0; font-size: 13px; font-weight: 700; line-height: 1; border-color: #3f3f46;" onclick="InventoryView.quickInlineAdjust('${b.warehouse_id}', '${b.product_id}', '${b.sku}', -1, ${b.quantity_on_hand}, '${b.id}')" title="Deduct 1 unit instant count">-</button>
                                        <span id="onhand-val-${b.id}" style="font-weight: 700; font-family: var(--font-mono); color: #fff; min-width: 32px; text-align: right;">${b.quantity_on_hand}</span>
                                        <button class="shadcn-btn-secondary" style="width: 22px; height: 22px; padding: 0; font-size: 13px; font-weight: 700; line-height: 1; border-color: #3f3f46;" onclick="InventoryView.quickInlineAdjust('${b.warehouse_id}', '${b.product_id}', '${b.sku}', 1, ${b.quantity_on_hand}, '${b.id}')" title="Add 1 unit instant count">+</button>
                                    </div>
                                </td>
                                <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">${b.quantity_reserved}</td>
                                <td id="avail-val-${b.id}" style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${b.quantity_available > 0 ? '#22c55e' : '#ef4444'};">${b.quantity_available}</td>
                                <td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: #60a5fa;">&#8377;${sell}</td>
                                <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">&#8377;${wac}</td>
                                <td id="val-val-${b.id}" style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #fff;">&#8377;${totalVal}</td>
                                <td style="text-align: center;">
                                    <span class="shadcn-badge ${isLow ? 'red' : 'green'}">
                                        ${isLow ? 'LOW STOCK' : 'IN STOCK'}
                                    </span>
                                </td>
                                <td style="text-align: right; white-space: nowrap;">
                                    <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px; margin-right: 4px; color: #60a5fa; border-color: rgba(96, 165, 250, 0.4);" onclick="InventoryView.openPriceModal('${b.product_id}', '${b.sku}', '${b.product_name}', ${b.selling_price || 0}, ${b.weighted_avg_cost || 0})" title="Edit Selling Price &amp; Cost Price anytime">
                                        &#8377; Price
                                    </button>
                                    <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px; margin-right: 4px; color: #a78bfa; border-color: rgba(167, 139, 250, 0.4);" onclick="InventoryView.openBarcodeStudio('${b.product_id}')" title="Print Barcode Labels">
                                        Label
                                    </button>
                                    <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px; margin-right: 4px; color: #34d399; border-color: rgba(52, 211, 153, 0.4);" onclick="InventoryView.openSetCountModal('${b.warehouse_id}', '${b.product_id}', '${b.sku}', '${b.product_name}', ${b.quantity_on_hand})" title="Set exact physical count">
                                        Count
                                    </button>
                                    <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px; margin-right: 4px;" onclick="InventoryView.openQuickAdjust('${b.warehouse_id}', '${b.product_id}', '${b.sku}')" title="Adjust stock (+/- delta)">
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
                        <th>DATE &amp; TIME</th>
                        <th>SKU / PRODUCT</th>
                        <th>STORAGE HUB</th>
                        <th style="text-align: center;">TYPE</th>
                        <th style="text-align: right;">QUANTITY</th>
                        <th style="text-align: right;">PREV BALANCE</th>
                        <th style="text-align: right;">NEW BALANCE</th>
                        <th>REASON &amp; AUDIT NOTES</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.movements.map(m => {
                        const isPos = m.quantity_delta > 0;
                        const dateStr = new Date(m.created_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        });

                        return `
                            <tr>
                                <td style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted);">${dateStr}</td>
                                <td>
                                    <div style="font-weight: 700; color: #fff;">${m.sku || 'SKU'}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary);">${m.product_name || ''}</div>
                                </td>
                                <td><span class="shadcn-badge blue">${m.warehouse_name || 'Hub'}</span></td>
                                <td style="text-align: center;">
                                    <span class="shadcn-badge ${this.getMovementTypeBadge(m.movement_type)}">
                                        ${m.movement_type}
                                    </span>
                                </td>
                                <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${isPos ? '#22c55e' : '#ef4444'};">
                                    ${isPos ? '+' : ''}${m.quantity_delta}
                                </td>
                                <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">${m.quantity_before}</td>
                                <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #fff;">${m.quantity_after}</td>
                                <td style="font-size: 12px; color: var(--text-secondary);">${m.reason || 'Standard movement'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    renderAnalyticsView() {
        // 1. Calculate Pareto ABC Analysis
        let totalValuation = 0;
        const items = this.balances.map(b => {
            const onHand = Number(b.quantity_on_hand) || 0;
            const wac = Number(b.weighted_avg_cost) || 0;
            const value = onHand * wac;
            totalValuation += value;
            return {
                id: b.id,
                product_id: b.product_id,
                sku: b.sku,
                product_name: b.product_name,
                warehouse_name: b.warehouse_name,
                onHand: onHand,
                wac: wac,
                value: value
            };
        });

        // Sort descending by asset value
        items.sort((a, b) => b.value - a.value);

        let cumulative = 0;
        let countA = 0, countB = 0, countC = 0;
        let valA = 0, valB = 0, valC = 0;

        items.forEach(item => {
            cumulative += item.value;
            const cumPct = totalValuation > 0 ? (cumulative / totalValuation) * 100 : 0;
            item.cumPct = cumPct;

            if (cumPct <= 80 || (countA === 0 && item.value > 0)) {
                item.abcClass = 'A';
                countA++;
                valA += item.value;
            } else if (cumPct <= 95) {
                item.abcClass = 'B';
                countB++;
                valB += item.value;
            } else {
                item.abcClass = 'C';
                countC++;
                valC += item.value;
            }
        });

        const valAFormatted = (valA / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const valBFormatted = (valB / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const valCFormatted = (valC / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const pctA = totalValuation > 0 ? ((valA / totalValuation) * 100).toFixed(1) : 0;
        const pctB = totalValuation > 0 ? ((valB / totalValuation) * 100).toFixed(1) : 0;
        const pctC = totalValuation > 0 ? ((valC / totalValuation) * 100).toFixed(1) : 0;

        return `
            <div style="padding: 20px;">
                <!-- Pareto ABC Valuation Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    <div style="background: #17171e; border: 1px solid #eab308; border-radius: 10px; padding: 18px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 11px; font-weight: 800; color: #eab308; letter-spacing: 0.6px; text-transform: uppercase;">CATEGORY A (CRITICAL ASSETS)</span>
                            <span class="shadcn-badge yellow" style="font-weight: 800;">Class A</span>
                        </div>
                        <div style="font-size: 26px; font-weight: 900; color: #ffffff; font-family: var(--font-mono);">&#8377;${valAFormatted}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
                            ${countA} SKUs &bull; <strong>${pctA}%</strong> of Total Inventory Capital
                        </div>
                        <div style="font-size: 11px; color: #eab308; margin-top: 8px; border-top: 1px solid #272732; padding-top: 8px;">
                            High Priority: Daily cycle counting, tight safety stocks
                        </div>
                    </div>

                    <div style="background: #17171e; border: 1px solid #60a5fa; border-radius: 10px; padding: 18px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 11px; font-weight: 800; color: #60a5fa; letter-spacing: 0.6px; text-transform: uppercase;">CATEGORY B (MODERATE VELOCITY)</span>
                            <span class="shadcn-badge blue" style="font-weight: 800;">Class B</span>
                        </div>
                        <div style="font-size: 26px; font-weight: 900; color: #ffffff; font-family: var(--font-mono);">&#8377;${valBFormatted}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
                            ${countB} SKUs &bull; <strong>${pctB}%</strong> of Total Inventory Capital
                        </div>
                        <div style="font-size: 11px; color: #60a5fa; margin-top: 8px; border-top: 1px solid #272732; padding-top: 8px;">
                            Medium Priority: Weekly replenishment reviews
                        </div>
                    </div>

                    <div style="background: #17171e; border: 1px solid #71717a; border-radius: 10px; padding: 18px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 11px; font-weight: 800; color: #a1a1aa; letter-spacing: 0.6px; text-transform: uppercase;">CATEGORY C (BULK / LOW VALUE)</span>
                            <span class="shadcn-badge" style="font-weight: 800; background: #27272a; color: #a1a1aa;">Class C</span>
                        </div>
                        <div style="font-size: 26px; font-weight: 900; color: #ffffff; font-family: var(--font-mono);">&#8377;${valCFormatted}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
                            ${countC} SKUs &bull; <strong>${pctC}%</strong> of Total Inventory Capital
                        </div>
                        <div style="font-size: 11px; color: #a1a1aa; margin-top: 8px; border-top: 1px solid #272732; padding-top: 8px;">
                            Low Priority: Simple bulk ordering, quarterly counts
                        </div>
                    </div>
                </div>

                <!-- Pareto ABC Classification Table -->
                <div style="margin-top: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="font-size: 15px; font-weight: 700; color: #ffffff; margin: 0;">Pareto Valuation Ranking &amp; Capital Concentration</h3>
                        <button class="shadcn-btn-secondary" style="height: 28px; font-size: 11px;" onclick="InventoryView.exportValuationCSV()">Export Valuation CSV</button>
                    </div>

                    <table class="shadcn-table">
                        <thead>
                            <tr>
                                <th>RANK</th>
                                <th>SKU / PRODUCT</th>
                                <th>STORAGE HUB</th>
                                <th style="text-align: center;">PARETO CLASS</th>
                                <th style="text-align: right;">ON-HAND</th>
                                <th style="text-align: right;">UNIT COST (WAC)</th>
                                <th style="text-align: right;">TOTAL VALUATION</th>
                                <th style="text-align: right;">CUMULATIVE %</th>
                                <th style="text-align: right;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item, idx) => {
                                const wacFormatted = (item.wac / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                                const valFmt = (item.value / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                                const badgeClass = item.abcClass === 'A' ? 'yellow' : (item.abcClass === 'B' ? 'blue' : '');

                                return `
                                    <tr>
                                        <td style="font-family: var(--font-mono); color: var(--text-muted); font-weight: 600;">#${idx + 1}</td>
                                        <td>
                                            <div style="font-weight: 700; color: #fff;">${item.sku}</div>
                                            <div style="font-size: 12px; color: var(--text-secondary);">${item.product_name}</div>
                                        </td>
                                        <td><span class="shadcn-badge blue">${item.warehouse_name}</span></td>
                                        <td style="text-align: center;">
                                            <span class="shadcn-badge ${badgeClass}" style="font-weight: 800;">
                                                Class ${item.abcClass}
                                            </span>
                                        </td>
                                        <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #fff;">${item.onHand}</td>
                                        <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">&#8377;${wacFormatted}</td>
                                        <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #22c55e;">&#8377;${valFmt}</td>
                                        <td style="text-align: right; font-family: var(--font-mono); color: var(--text-secondary);">${item.cumPct.toFixed(1)}%</td>
                                        <td style="text-align: right; white-space: nowrap;">
                                            <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px; margin-right: 4px;" onclick="InventoryView.openBarcodeStudio('${item.product_id}')">
                                                Label
                                            </button>
                                            <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 11px;" onclick="InventoryView.openQuickAdjust(null, '${item.product_id}', '${item.sku}')">
                                                Adjust
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    getMovementTypeBadge(type) {
        switch (type) {
            case 'PURCHASE_RECEIPT':
            case 'INWARD':
                return 'green';
            case 'SALE':
            case 'OUTWARD':
                return 'blue';
            case 'CYCLE_COUNT':
            case 'CYCLE_ADJUSTMENT':
                return 'yellow';
            case 'DAMAGED':
            case 'EXPIRED':
            case 'WRITE_OFF':
                return 'red';
            case 'TRANSFER':
                return 'blue';
            default:
                return 'gray';
        }
    },

    // --------------------------------------------------------------------------
    // INSTANT INLINE ADJUSTMENTS (+/- on row)
    // --------------------------------------------------------------------------
    async quickInlineAdjust(warehouseId, productId, sku, delta, currentQty, balanceId) {
        const newQty = Math.max(0, currentQty + delta);
        
        // Optimistic DOM update
        const countEl = document.getElementById(`onhand-val-${balanceId}`);
        const availEl = document.getElementById(`avail-val-${balanceId}`);
        if (countEl) countEl.innerText = newQty;
        if (availEl) {
            availEl.innerText = newQty;
            availEl.style.color = newQty > 0 ? '#22c55e' : '#ef4444';
        }

        // Update local object
        const b = this.balances.find(x => x.id === balanceId);
        if (b) {
            b.quantity_on_hand = newQty;
            b.quantity_available = newQty;
            const valEl = document.getElementById(`val-val-${balanceId}`);
            if (valEl) {
                const totalVal = ((newQty * b.weighted_avg_cost) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                valEl.innerHTML = `&#8377;${totalVal}`;
            }
        }

        try {
            await window.SupabaseClient.adjustStock(
                warehouseId,
                productId,
                delta,
                `Instant Row Cycle Stepper (${delta > 0 ? '+' : ''}${delta})`
            );
            if (window.App && window.App.showToast) {
                window.App.showToast(`Updated stock for ${sku}: ${newQty} units`, 'success');
            }
        } catch (err) {
            // Revert on error
            if (countEl) countEl.innerText = currentQty;
            if (b) {
                b.quantity_on_hand = currentQty;
                b.quantity_available = currentQty;
            }
            if (window.App && window.App.showToast) {
                window.App.showToast(`Failed to update stock: ${err.message}`, 'danger');
            }
        }
    },

    // --------------------------------------------------------------------------
    // FILTER CONTROLS
    // --------------------------------------------------------------------------
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
        const content = document.getElementById('inv-table-content');
        if (content) {
            content.innerHTML = this.renderActiveTabContent();
        }
    },

    switchTab(tab) {
        this.activeTab = tab;
        const filterBar = document.getElementById('inv-filter-bar');
        if (filterBar) {
            filterBar.style.display = tab === 'balances' ? 'flex' : 'none';
        }
        document.querySelectorAll('.shadcn-tab-pills .shadcn-tab-btn').forEach((btn, idx) => {
            const tabs = ['balances', 'movements', 'analytics'];
            btn.classList.toggle('active', tabs[idx] === tab);
        });
        this.refreshTable();
    },

    // --------------------------------------------------------------------------
    // STOCK ADJUSTMENT MODAL
    // --------------------------------------------------------------------------
    showAdjustModal() {
        const m = document.getElementById('modal-adjust-stock');
        if (m) {
            m.style.display = 'flex';
            this.updateAdjStockInfo();
        }
    },

    hideAdjustModal() {
        const m = document.getElementById('modal-adjust-stock');
        if (m) m.style.display = 'none';
    },

    openQuickAdjust(warehouseId, productId, sku) {
        this.showAdjustModal();
        const whSelect = document.getElementById('adj-warehouse');
        const prodSelect = document.getElementById('adj-product');
        if (whSelect && warehouseId) whSelect.value = warehouseId;
        if (prodSelect && productId) prodSelect.value = productId;
        this.updateAdjStockInfo();
    },

    updateAdjStockInfo() {
        const whSelect = document.getElementById('adj-warehouse');
        const prodSelect = document.getElementById('adj-product');
        const infoEl = document.getElementById('adj-stock-info');
        const currEl = document.getElementById('adj-info-current');
        if (!whSelect || !prodSelect || !infoEl) return;

        const whId = whSelect.value;
        const prodId = prodSelect.value;
        const match = this.balances.find(b => b.warehouse_id === whId && b.product_id === prodId);

        if (match) {
            if (currEl) currEl.innerText = match.quantity_on_hand;
            infoEl.style.display = 'block';
        } else {
            infoEl.style.display = 'none';
        }
    },

    // --------------------------------------------------------------------------
    // QUICK PRICE EDIT MODAL
    // --------------------------------------------------------------------------
    openPriceModal(productId, sku, name, sellingPriceCents, wacCostCents) {
        const modal = document.getElementById('modal-quick-price-stock');
        if (!modal) return;
        document.getElementById('inv-price-prod-id').value = productId;
        document.getElementById('inv-price-sub').innerText = `${sku} - ${name}`;
        document.getElementById('inv-price-selling').value = ((sellingPriceCents || 0) / 100).toFixed(2);
        document.getElementById('inv-price-purchase').value = ((wacCostCents || 0) / 100).toFixed(2);
        modal.style.display = 'flex';
    },

    hidePriceModal() {
        const modal = document.getElementById('modal-quick-price-stock');
        if (modal) modal.style.display = 'none';
    },

    async handlePriceSave(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-inv-price');
        if (btn) { btn.disabled = true; btn.innerText = 'Updating Cloud DB...'; }

        const prodId = document.getElementById('inv-price-prod-id').value;
        const sellVal = parseFloat(document.getElementById('inv-price-selling').value) || 0;
        const buyVal = parseFloat(document.getElementById('inv-price-purchase').value) || 0;

        try {
            await window.SupabaseClient.updateProductPrice(prodId, sellVal, buyVal);
            this.hidePriceModal();
            App.showToast('Product prices updated in Cloud DB!', 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Failed to update price: ${err.message}`, 'danger');
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = 'Save Price in Cloud'; }
        }
    },

    // --------------------------------------------------------------------------
    // SET EXACT PHYSICAL COUNT MODAL
    // --------------------------------------------------------------------------
    openSetCountModal(warehouseId, productId, sku, name, currentOnHand) {
        const modal = document.getElementById('modal-set-count-stock');
        if (!modal) return;
        document.getElementById('inv-setcount-wh-id').value = warehouseId;
        document.getElementById('inv-setcount-prod-id').value = productId;
        document.getElementById('inv-setcount-curr').value = currentOnHand;
        document.getElementById('inv-setcount-sub').innerText = `${sku} - ${name} (Currently on hand: ${currentOnHand})`;
        document.getElementById('inv-setcount-qty').value = currentOnHand;
        modal.style.display = 'flex';
    },

    hideSetCountModal() {
        const modal = document.getElementById('modal-set-count-stock');
        if (modal) modal.style.display = 'none';
    },

    async handleSetCountSave(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-inv-setcount');
        if (btn) { btn.disabled = true; btn.innerText = 'Updating Cloud DB...'; }

        const whId = document.getElementById('inv-setcount-wh-id').value;
        const prodId = document.getElementById('inv-setcount-prod-id').value;
        const currQty = parseInt(document.getElementById('inv-setcount-curr').value, 10) || 0;
        const newQty = parseInt(document.getElementById('inv-setcount-qty').value, 10);
        const reason = document.getElementById('inv-setcount-reason').value.trim() || 'Floor count verification';

        try {
            await window.SupabaseClient.setStockOnHand(whId, prodId, newQty, reason);
            this.hideSetCountModal();
            App.showToast(`Updated stock balance to ${newQty} units!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Failed to set count: ${err.message}`, 'danger');
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = 'Update Cloud Balance'; }
        }
    },

    // --------------------------------------------------------------------------
    // BULK IMPORT MODAL
    // --------------------------------------------------------------------------
    showBulkImportModal() {
        const m = document.getElementById('modal-bulk-import-stock');
        if (m) m.style.display = 'flex';
    },

    hideBulkImportModal() {
        const m = document.getElementById('modal-bulk-import-stock');
        if (m) m.style.display = 'none';
    },

    insertSampleCSV() {
        const sample = `SKU,Quantity,UnitPriceINR\nPROD-DELL-U27,15,48999.00\nKB-MXM,40,9999.00\nMO-MS3,60,3499.00\nHEADSET-WH1000,10,24990.00`;
        const textarea = document.getElementById('import-csv-text');
        if (textarea) textarea.value = sample;
    },

    // --------------------------------------------------------------------------
    // TRANSFER MODAL
    // --------------------------------------------------------------------------
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

    // --------------------------------------------------------------------------
    // RECONCILE MODAL
    // --------------------------------------------------------------------------
    showReconcileModal() {
        const m = document.getElementById('modal-reconcile-stock');
        if (m) m.style.display = 'flex';
    },

    hideReconcileModal() {
        const m = document.getElementById('modal-reconcile-stock');
        if (m) m.style.display = 'none';
    },

    updateReconcileExpected(prodId) {
        const whId = document.getElementById('rec-warehouse').value;
        const match = this.balances.find(b => b.warehouse_id === whId && b.product_id === prodId);
        const expInput = document.getElementById('rec-expected');
        if (expInput) {
            expInput.value = match ? `${match.quantity_on_hand} units` : '0 units (No balance recorded)';
        }
        const actualInput = document.getElementById('rec-actual');
        if (actualInput && actualInput.value) {
            this.calculateVariance(actualInput.value);
        }
    },

    calculateVariance(actualVal) {
        const disp = document.getElementById('rec-variance-display');
        const valSpan = document.getElementById('rec-var-val');
        const prodSelect = document.getElementById('rec-product');
        if (!disp || !prodSelect) return;

        const whId = document.getElementById('rec-warehouse').value;
        const prodId = prodSelect.value;
        const match = this.balances.find(b => b.warehouse_id === whId && b.product_id === prodId);
        const expected = match ? match.quantity_on_hand : 0;
        const actual = parseInt(actualVal, 10);

        if (isNaN(actual)) {
            disp.style.display = 'none';
            return;
        }

        disp.style.display = 'block';
        const delta = actual - expected;

        if (delta === 0) {
            disp.style.borderColor = '#22c55e';
            disp.style.color = '#22c55e';
            valSpan.innerText = '0 (Stock Perfectly Balanced)';
        } else if (delta > 0) {
            disp.style.borderColor = '#60a5fa';
            disp.style.color = '#60a5fa';
            valSpan.innerText = `+${delta} surplus units (Positive Variance)`;
        } else {
            disp.style.borderColor = '#ef4444';
            disp.style.color = '#ef4444';
            valSpan.innerText = `${delta} shortage units (Discrepancy / Shrinkage)`;
        }
    },

    // --------------------------------------------------------------------------
    // AUTO PURCHASE ORDER GENERATOR FOR LOW STOCK
    // --------------------------------------------------------------------------
    showAutoPOModal() {
        const modal = document.getElementById('modal-auto-po');
        if (!modal) return;

        // Find candidate items below reorder point or low stock
        const candidates = [];
        this.balances.forEach(b => {
            const onHand = Number(b.quantity_on_hand) || 0;
            const reorderPt = Number(b.reorder_point) || 20;
            if (b.is_low_stock || onHand <= reorderPt) {
                // Calculate suggested reorder quantity (target: 2x reorder point or minimum 10)
                const suggestedQty = Math.max((reorderPt * 2) - onHand, 10);
                const costPerUnit = b.weighted_avg_cost || (b.selling_price ? Math.round(b.selling_price * 0.7) : 1000);
                candidates.push({
                    balance_id: b.id,
                    product_id: b.product_id,
                    sku: b.sku,
                    name: b.product_name,
                    warehouse_id: b.warehouse_id,
                    onHand: onHand,
                    reorderPt: reorderPt,
                    suggestedQty: suggestedQty,
                    costPerUnit: costPerUnit,
                    included: true
                });
            }
        });

        // If no deficit items found, offer to replenish all catalog items with low turnover
        if (candidates.length === 0 && this.balances.length > 0) {
            this.balances.slice(0, 5).forEach(b => {
                const onHand = Number(b.quantity_on_hand) || 0;
                const costPerUnit = b.weighted_avg_cost || 1000;
                candidates.push({
                    balance_id: b.id,
                    product_id: b.product_id,
                    sku: b.sku,
                    name: b.product_name,
                    warehouse_id: b.warehouse_id,
                    onHand: onHand,
                    reorderPt: b.reorder_point || 20,
                    suggestedQty: 10,
                    costPerUnit: costPerUnit,
                    included: true
                });
            });
        }

        this._autoPoCandidates = candidates;
        this.renderPOCandidateRows();
        modal.style.display = 'flex';
    },

    hideAutoPOModal() {
        const modal = document.getElementById('modal-auto-po');
        if (modal) modal.style.display = 'none';
        this._autoPoCandidates = [];
    },

    renderPOCandidateRows() {
        const tbody = document.getElementById('auto-po-tbody');
        if (!tbody) return;

        if (this._autoPoCandidates.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">All items have optimal stock levels. No replenishments needed!</td></tr>`;
            this.updatePOSummary();
            return;
        }

        tbody.innerHTML = this._autoPoCandidates.map((c, idx) => {
            const costFmt = (c.costPerUnit / 100).toFixed(2);
            const lineTotal = ((c.suggestedQty * c.costPerUnit) / 100).toFixed(2);

            return `
                <tr>
                    <td style="width: 32px; text-align: center;">
                        <input type="checkbox" ${c.included ? 'checked' : ''} onchange="InventoryView.togglePOCandidate(${idx}, this.checked)" />
                    </td>
                    <td>
                        <div style="font-weight: 700; color: #fff;">${c.sku}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${c.name}</div>
                    </td>
                    <td style="text-align: right; font-family: var(--font-mono); color: #ef4444; font-weight: 700;">${c.onHand}</td>
                    <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">${c.reorderPt}</td>
                    <td style="text-align: right;">
                        <input type="number" min="1" max="9999" value="${c.suggestedQty}" class="shadcn-input" style="height: 28px; width: 80px; text-align: right; font-family: var(--font-mono); font-size: 12px;" oninput="InventoryView.updatePOCandidateQty(${idx}, this.value)" />
                    </td>
                    <td style="text-align: right; font-family: var(--font-mono); color: var(--text-muted);">&#8377;${costFmt}</td>
                    <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: #22c55e;">&#8377;${lineTotal}</td>
                </tr>
            `;
        }).join('');

        this.updatePOSummary();
    },

    togglePOCandidate(idx, isChecked) {
        if (this._autoPoCandidates[idx]) {
            this._autoPoCandidates[idx].included = isChecked;
            this.updatePOSummary();
        }
    },

    toggleAllPOCandidates(isChecked) {
        this._autoPoCandidates.forEach(c => c.included = isChecked);
        this.renderPOCandidateRows();
    },

    updatePOCandidateQty(idx, val) {
        const qty = parseInt(val, 10) || 1;
        if (this._autoPoCandidates[idx]) {
            this._autoPoCandidates[idx].suggestedQty = qty;
            this.updatePOSummary();
        }
    },

    updatePOSummary() {
        const selected = this._autoPoCandidates.filter(c => c.included);
        let totalQty = 0;
        let grandTotalCents = 0;

        selected.forEach(c => {
            totalQty += c.suggestedQty;
            grandTotalCents += (c.suggestedQty * c.costPerUnit);
        });

        const summaryTextEl = document.getElementById('auto-po-summary-text');
        const grandTotalEl = document.getElementById('auto-po-grand-total');

        if (summaryTextEl) {
            summaryTextEl.innerText = `${selected.length} SKUs selected (${totalQty} total units)`;
        }
        if (grandTotalEl) {
            const grandTotalFmt = (grandTotalCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            grandTotalEl.innerHTML = `&#8377;${grandTotalFmt}`;
        }
    },

    async handleExecuteAutoPO(e) {
        e.preventDefault();
        const selected = this._autoPoCandidates.filter(c => c.included);
        if (selected.length === 0) {
            App.showToast('Please select at least one candidate item for the PO.', 'warning');
            return;
        }

        const btn = document.getElementById('btn-submit-auto-po');
        if (btn) { btn.disabled = true; btn.innerText = 'Creating PO in Cloud DB...'; }

        const supplierId = document.getElementById('auto-po-supplier').value;
        const warehouseId = document.getElementById('auto-po-warehouse').value;
        const totalUnits = selected.reduce((s, c) => s + c.suggestedQty, 0);
        let subtotalCents = 0;
        selected.forEach(c => subtotalCents += (c.suggestedQty * c.costPerUnit));
        const taxCents = Math.round(subtotalCents * 0.18); // standard 18% GST estimate
        const grandTotalCents = subtotalCents + taxCents;

        const poNo = `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Date.now().toString().slice(-4)}`;

        try {
            await window.SupabaseClient.createPurchaseOrder({
                po_number: poNo,
                supplier_id: supplierId,
                warehouse_id: warehouseId,
                subtotal_cents: subtotalCents,
                tax_total_cents: taxCents,
                grand_total_cents: grandTotalCents,
                notes: `Automated replenishment PO for ${selected.length} low-stock SKUs (${totalUnits} units)`,
                items_count: selected.length
            });

            this.hideAutoPOModal();
            App.showToast(`Purchase Order ${poNo} generated and synced to Cloud DB!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Failed to create PO: ${err.message}`, 'danger');
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = 'Confirm & Create PO in Cloud DB'; }
        }
    },

    // --------------------------------------------------------------------------
    // THERMAL BARCODE LABEL & SHELF-TALKER STUDIO
    // --------------------------------------------------------------------------
    openBarcodeStudio(productId) {
        const modal = document.getElementById('modal-barcode-studio');
        if (!modal) return;

        const prodSelect = document.getElementById('bcode-prod-select');
        if (prodSelect) {
            if (productId) {
                prodSelect.value = productId;
            } else if (!prodSelect.value && this.products.length > 0) {
                prodSelect.value = this.products[0].id;
            }
        }

        this.updateBarcodePreview();
        modal.style.display = 'flex';
    },

    hideBarcodeStudio() {
        const modal = document.getElementById('modal-barcode-studio');
        if (modal) modal.style.display = 'none';
    },

    updateBarcodePreview() {
        const prodSelect = document.getElementById('bcode-prod-select');
        const formatSelect = document.getElementById('bcode-format-select');
        const previewBox = document.getElementById('bcode-preview-box');
        const optPrice = document.getElementById('bcode-opt-price') ? document.getElementById('bcode-opt-price').checked : true;
        const optBrand = document.getElementById('bcode-opt-brand') ? document.getElementById('bcode-opt-brand').checked : true;

        if (!prodSelect || !formatSelect || !previewBox) return;

        const prod = this.products.find(p => p.id === prodSelect.value);
        if (!prod) {
            previewBox.innerHTML = '<span style="color: var(--text-muted);">Select a product to preview label</span>';
            return;
        }

        const format = formatSelect.value;
        const store = window.StoreConfig ? window.StoreConfig.getProfile() : { shop_name: 'SSE ENTERPRISE' };
        const barcodeVal = prod.barcode || prod.sku;
        const price = ((prod.selling_price || 0) / 100).toFixed(2);
        const mrp = ((Math.round((prod.selling_price || 0) * 1.2)) / 100).toFixed(2);

        let barcodeSvg = '';
        if (window.BarcodeQR && window.BarcodeQR.code128) {
            barcodeSvg = window.BarcodeQR.code128(barcodeVal, { width: 180, height: 40, showText: true });
        } else {
            barcodeSvg = `<div style="font-family: monospace; font-size: 14px; font-weight: 700; background: #000; color: #fff; padding: 4px 8px; border-radius: 4px;">*${barcodeVal}*</div>`;
        }

        if (format === '80mm') {
            // Shelf-Talker Strip
            previewBox.innerHTML = `
                <div style="background: #ffffff; color: #000000; width: 340px; padding: 14px 18px; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px;">
                        <span style="font-size: 10px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase;">${optBrand ? (store.shop_name || 'SSE RETAIL') : ''}</span>
                        <span style="background: #ef4444; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">SAVE 20%</span>
                    </div>
                    <div style="font-size: 14px; font-weight: 800; margin-bottom: 6px; line-height: 1.2;">${prod.name}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                        <div>
                            <div style="font-size: 11px; color: #71717a; text-decoration: line-through;">MRP: &#8377;${mrp}</div>
                            <div style="font-size: 26px; font-weight: 900; color: #000; font-family: monospace;">&#8377;${price}</div>
                            <div style="font-size: 9px; color: #52525b;">Inclusive of all GST taxes</div>
                        </div>
                        <div style="text-align: right;">${barcodeSvg}</div>
                    </div>
                </div>
            `;
        } else if (format === '38x25') {
            // Compact Tag
            previewBox.innerHTML = `
                <div style="background: #ffffff; color: #000000; width: 170px; padding: 8px; border-radius: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center;">
                    <div style="font-size: 9px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px;">${prod.name}</div>
                    <div style="margin: 4px auto;">${barcodeSvg}</div>
                    <div style="font-size: 11px; font-weight: 900; margin-top: 4px; font-family: monospace;">&#8377;${price}</div>
                </div>
            `;
        } else {
            // Standard 50x25mm Adhesive Label
            previewBox.innerHTML = `
                <div style="background: #ffffff; color: #000000; width: 220px; padding: 10px 12px; border-radius: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center;">
                    ${optBrand ? `<div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #52525b; letter-spacing: 0.5px; margin-bottom: 2px;">${store.shop_name || 'SSE RETAIL'}</div>` : ''}
                    <div style="font-size: 12px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px;">${prod.name}</div>
                    <div style="margin: 4px auto;">${barcodeSvg}</div>
                    <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid #e4e4e7; margin-top: 6px; padding-top: 4px;">
                        <span style="font-size: 9px; color: #71717a; font-family: monospace;">SKU: ${prod.sku}</span>
                        ${optPrice ? `<span style="font-size: 13px; font-weight: 900; font-family: monospace;">&#8377;${price}</span>` : ''}
                    </div>
                </div>
            `;
        }
    },

    printBarcodeStudioLabels() {
        const prodSelect = document.getElementById('bcode-prod-select');
        const formatSelect = document.getElementById('bcode-format-select');
        const copiesInput = document.getElementById('bcode-copies-input');
        const optPrice = document.getElementById('bcode-opt-price') ? document.getElementById('bcode-opt-price').checked : true;
        const optBrand = document.getElementById('bcode-opt-brand') ? document.getElementById('bcode-opt-brand').checked : true;

        if (!prodSelect) return;
        const prod = this.products.find(p => p.id === prodSelect.value);
        if (!prod) return;

        const copies = parseInt(copiesInput.value, 10) || 1;
        const format = formatSelect ? formatSelect.value : '50x25';
        const store = window.StoreConfig ? window.StoreConfig.getProfile() : { shop_name: 'SSE ENTERPRISE' };
        const barcodeVal = prod.barcode || prod.sku;
        const price = ((prod.selling_price || 0) / 100).toFixed(2);

        let barcodeSvg = '';
        if (window.BarcodeQR && window.BarcodeQR.code128) {
            barcodeSvg = window.BarcodeQR.code128(barcodeVal, { width: 170, height: 38, showText: true });
        }

        const labelHtml = `
            <div class="print-label-item" style="width: 200px; padding: 6px; border: 1px dashed #ccc; margin: 4px; box-sizing: border-box; text-align: center; page-break-inside: avoid;">
                ${optBrand ? `<div style="font-size: 9px; font-weight: 800; text-transform: uppercase;">${store.shop_name || 'SSE RETAIL'}</div>` : ''}
                <div style="font-size: 11px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.name}</div>
                <div style="margin: 3px auto;">${barcodeSvg}</div>
                <div style="display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; border-top: 1px solid #ddd; padding-top: 2px;">
                    <span>${prod.sku}</span>
                    ${optPrice ? `<strong>&#8377;${price}</strong>` : ''}
                </div>
            </div>
        `;

        const printWin = window.open('', '_blank', 'width=800,height=600');
        if (!printWin) {
            App.showToast('Please allow browser popups to print barcode labels.', 'danger');
            return;
        }

        let allLabels = '';
        for (let i = 0; i < copies; i++) {
            allLabels += labelHtml;
        }

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Barcode Labels - ${prod.sku}</title>
                <style>
                    @page { size: auto; margin: 0mm; }
                    body { font-family: sans-serif; margin: 0; padding: 10px; display: flex; flex-wrap: wrap; justify-content: center; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${allLabels}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    },

    // --------------------------------------------------------------------------
    // ACTION HANDLERS
    // --------------------------------------------------------------------------
    async handleAdjustment(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-adjust');
        if (btn) { btn.disabled = true; btn.innerText = 'Applying adjustment...'; }

        const whId = document.getElementById('adj-warehouse').value;
        const prodId = document.getElementById('adj-product').value;
        const adjType = document.getElementById('adj-type').value;
        const delta = parseInt(document.getElementById('adj-qty').value, 10);
        const batch = document.getElementById('adj-batch').value.trim();
        const notes = document.getElementById('adj-notes').value.trim();
        const fullReason = `${adjType}: ${notes}${batch ? ` (Lot: ${batch})` : ''}`;

        try {
            await window.SupabaseClient.adjustStock(whId, prodId, delta, fullReason);
            this.hideAdjustModal();
            App.showToast(`Stock adjusted (${delta > 0 ? '+' : ''}${delta} units) successfully!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Adjustment failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Apply Stock Adjustment'; }
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
        link.setAttribute('download', `inventory_balances_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        App.showToast('Inventory balances exported to CSV file.', 'info');
    },

    exportValuationCSV() {
        const rows = [
            ['SKU', 'Product Name', 'Warehouse', 'On Hand', 'Unit Cost (INR)', 'Total Valuation (INR)']
        ];
        this.balances.forEach(b => {
            rows.push([
                `"${b.sku}"`,
                `"${b.product_name}"`,
                `"${b.warehouse_name}"`,
                b.quantity_on_hand,
                (b.weighted_avg_cost / 100).toFixed(2),
                ((b.quantity_on_hand * b.weighted_avg_cost) / 100).toFixed(2)
            ]);
        });
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `inventory_valuation_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        App.showToast('Valuation report exported to CSV file.', 'info');
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
