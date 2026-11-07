/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Products & Master SKU Management (Full CRUD)
 * 100% Live Supabase PostgreSQL Integration, Bulk CSV Import & Barcode Labels
 * ==============================================================================
 */

const ProductsView = {
    productsList: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
                <div style="width: 28px; height: 28px; border: 2px solid #27272a; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            this.productsList = await window.SupabaseClient.getProducts();
            this.renderTable(container);
        } catch (err) {
            container.innerHTML = `
                <div class="shadcn-card" style="border-color: #ef4444; color: #ef4444; padding: 24px;">
                    <strong>Error loading products from Supabase:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderTable(container) {
        container.innerHTML = `
            <div class="shadcn-table-wrap">
                <div class="shadcn-table-header" style="flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0;">Product Catalog (${this.productsList.length} items)</h2>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                            Master SKU registry with HSN compliance, real-time cloud sync, and thermal barcode labels
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <input type="text" id="prod-search-input" class="shadcn-input" placeholder="Search SKU or Name..." style="width: 200px; height: 34px;" oninput="ProductsView.filterProducts(this.value)" />
                        <button class="shadcn-btn-secondary" style="height: 34px; font-size: 12px;" onclick="ProductsView.showBulkImportModal()">
                            Bulk CSV Import
                        </button>
                        <button class="shadcn-btn-primary" style="height: 34px; font-size: 12px;" onclick="ProductsView.showAddModal()">
                            + Add New SKU
                        </button>
                    </div>
                </div>

                <div style="overflow-x: auto;">
                    <table class="shadcn-table" id="products-table">
                        <thead>
                            <tr>
                                <th>SKU / BARCODE</th>
                                <th>NAME & CATEGORY</th>
                                <th>UOM</th>
                                <th style="text-align: right;">PURCHASE PRICE</th>
                                <th style="text-align: right;">SELLING PRICE</th>
                                <th style="text-align: center;">GST RATE</th>
                                <th style="text-align: center;">REORDER PT</th>
                                <th style="text-align: center;">STATUS</th>
                                <th style="text-align: center;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody id="products-tbody">
                            ${this.renderRows(this.productsList)}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Product Modal -->
            <div id="modal-add-product" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 540px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px;">Create New Master SKU Product</h3>
                        <button class="tblr-modal-close" onclick="ProductsView.hideAddModal()">&times;</button>
                    </div>
                    <form id="form-create-product" onsubmit="ProductsView.handleCreateProduct(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">SKU Code *</label>
                                    <input type="text" id="new-prod-sku" class="shadcn-input" placeholder="e.g. PROD-DELL-U27" required />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Barcode / EAN-13</label>
                                    <input type="text" id="new-prod-barcode" class="shadcn-input" placeholder="e.g. 8901234567895" />
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Product Name *</label>
                                <input type="text" id="new-prod-name" class="shadcn-input" placeholder="e.g. Dell UltraSharp 27 Monitor" required />
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Category</label>
                                    <select id="new-prod-category" class="shadcn-select">
                                        <option value="50000000-0000-0000-0000-000000000001">Electronics & Peripherals</option>
                                        <option value="50000000-0000-0000-0000-000000000002">Monitors & Displays</option>
                                        <option value="50000000-0000-0000-0000-000000000003">Ergonomic Furniture</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Unit of Measure (UOM)</label>
                                    <select id="new-prod-uom" class="shadcn-select">
                                        <option value="PCS">PCS (Pieces)</option>
                                        <option value="BOX">BOX (12 Units)</option>
                                        <option value="KG">KG (Kilograms)</option>
                                        <option value="SET">SET (Kit)</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Purchase Cost (₹) *</label>
                                    <input type="number" step="0.01" id="new-prod-purchase" class="shadcn-input" placeholder="6500.00" required />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Selling Price (₹) *</label>
                                    <input type="number" step="0.01" id="new-prod-selling" class="shadcn-input" placeholder="8999.00" required />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">GST Tax Category</label>
                                    <select id="new-prod-tax" class="shadcn-select">
                                        <option value="60000000-0000-0000-0000-000000000001">Standard GST 18% (Hardware)</option>
                                        <option value="60000000-0000-0000-0000-000000000002">Reduced GST 12% (Furniture)</option>
                                        <option value="60000000-0000-0000-0000-000000000003">Low GST 5% (Essentials)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Initial Inward Stock Qty</label>
                                    <input type="number" id="new-prod-stock" class="shadcn-input" placeholder="50" value="25" />
                                </div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="ProductsView.hideAddModal()">Cancel</button>
                            <button type="submit" class="shadcn-btn-primary">Create SKU in Supabase</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Edit Product Modal -->
            <div id="modal-edit-product" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 540px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px;">Edit Master SKU Product</h3>
                        <button class="tblr-modal-close" onclick="ProductsView.hideEditModal()">&times;</button>
                    </div>
                    <form id="form-edit-product" onsubmit="ProductsView.handleEditProduct(event)">
                        <input type="hidden" id="edit-prod-id" />
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">SKU Code *</label>
                                    <input type="text" id="edit-prod-sku" class="shadcn-input" required />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Barcode / EAN-13</label>
                                    <input type="text" id="edit-prod-barcode" class="shadcn-input" />
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Product Name *</label>
                                <input type="text" id="edit-prod-name" class="shadcn-input" required />
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Unit of Measure</label>
                                    <select id="edit-prod-uom" class="shadcn-select">
                                        <option value="PCS">PCS (Pieces)</option>
                                        <option value="BOX">BOX (12 Units)</option>
                                        <option value="KG">KG (Kilograms)</option>
                                        <option value="SET">SET (Kit)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Reorder Point</label>
                                    <input type="number" id="edit-prod-reorder" class="shadcn-input" />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Purchase Cost (₹) *</label>
                                    <input type="number" step="0.01" id="edit-prod-purchase" class="shadcn-input" required />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Selling Price (₹) *</label>
                                    <input type="number" step="0.01" id="edit-prod-selling" class="shadcn-input" required />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">GST Tax Category</label>
                                    <select id="edit-prod-tax" class="shadcn-select">
                                        <option value="60000000-0000-0000-0000-000000000001">Standard GST 18% (Hardware)</option>
                                        <option value="60000000-0000-0000-0000-000000000002">Reduced GST 12% (Furniture)</option>
                                        <option value="60000000-0000-0000-0000-000000000003">Low GST 5% (Essentials)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Active Status</label>
                                    <select id="edit-prod-status" class="shadcn-select">
                                        <option value="true">Active in Catalog</option>
                                        <option value="false">Disabled / Archived</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="ProductsView.hideEditModal()">Cancel</button>
                            <button type="submit" class="shadcn-btn-primary">Update in Supabase</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Bulk CSV Product Import Modal -->
            <div id="modal-bulk-product-import" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 650px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px;">Bulk Import Products via CSV</h3>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                Fast catalog creation with automated inventory balance generation
                            </div>
                        </div>
                        <button class="tblr-modal-close" onclick="ProductsView.hideBulkImportModal()">&times;</button>
                    </div>
                    <form onsubmit="ProductsView.handleBulkImportSubmit(event)">
                        <div class="tblr-modal-body" style="padding: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">CSV Data Format: (sku,name,barcode,uom,buy_price,sell_price,stock)</label>
                                <button type="button" class="shadcn-btn-secondary" style="font-size: 11px; padding: 2px 8px;" onclick="ProductsView.insertSampleProductCsv()">
                                    Load Sample CSV
                                </button>
                            </div>
                            <textarea id="bulk-prod-csv-text" class="shadcn-input" rows="8" style="font-family: monospace; font-size: 12px; height: 160px; line-height: 1.4;" placeholder="PROD-SSD-1TB,Samsung 980 Pro 1TB NVMe,890456123001,PCS,8500.00,11999.00,20&#10;PROD-MIC-YETI,Blue Yeti USB Microphone,890456123002,PCS,7200.00,9999.00,15"></textarea>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">
                                Header row is optional. Prices in Rupees. Existing SKUs will have their pricing and barcodes updated in cloud DB.
                            </div>
                        </div>
                        <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                            <button type="button" class="shadcn-btn-secondary" onclick="ProductsView.hideBulkImportModal()">Cancel</button>
                            <button type="submit" id="btn-submit-bulk-prod" class="shadcn-btn-primary">Execute Cloud Import</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Barcode Label Generator & Thermal Sticker Modal -->
            <div id="modal-barcode-label" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 440px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                    <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                        <div>
                            <h3 class="tblr-modal-title" style="color: #ffffff; font-size: 16px;">Product Barcode Sticker Label</h3>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                50mm × 30mm standard retail thermal adhesive sticker (Code 128)
                            </div>
                        </div>
                        <button class="tblr-modal-close" onclick="ProductsView.hideBarcodeLabelModal()">&times;</button>
                    </div>
                    <div class="tblr-modal-body" style="padding: 24px; text-align: center; background: #000000;">
                        <div id="barcode-label-preview-container">
                            <!-- Label Injected Here -->
                        </div>
                    </div>
                    <div class="tblr-modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid #222226;">
                        <span style="font-size: 11px; color: var(--text-muted);">Ready for TVS, Zebra & TSC Printers</span>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="ProductsView.hideBarcodeLabelModal()">Close</button>
                            <button type="button" class="shadcn-btn-primary" onclick="ProductsView.printBarcodeLabel()">Print Label</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderRows(products) {
        if (!products || products.length === 0) {
            return `<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">No products found in live database. Click '+ Add New SKU' or 'Bulk CSV Import' above to register fresh items.</td></tr>`;
        }

        return products.map(p => {
            const purchase = (p.purchase_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const selling = (p.selling_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const taxPct = (p.tax_rate_bps / 100).toFixed(0);
            const barcodeVal = p.barcode || p.sku;

            return `
                <tr>
                    <td>
                        <div style="font-weight: 700; color: #fff;">${p.sku}</div>
                        <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${barcodeVal}</div>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #e4e4e7;">${p.name}</div>
                        <div style="font-size: 11px; color: #60a5fa;">${p.category}</div>
                    </td>
                    <td><span class="shadcn-badge blue">${p.base_uom}</span></td>
                    <td style="text-align: right; font-family: var(--font-mono); color: var(--text-secondary);">₹${purchase}</td>
                    <td style="text-align: right; font-weight: 700; font-family: var(--font-mono); color: var(--accent-green);">₹${selling}</td>
                    <td style="text-align: center;"><span class="shadcn-badge green">${taxPct}% GST</span></td>
                    <td style="text-align: center; color: var(--text-muted); font-family: var(--font-mono);">${p.reorder_point}</td>
                    <td style="text-align: center;">
                        <span class="shadcn-badge ${p.is_active !== false ? 'green' : 'red'}">
                            ${p.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                        <button class="shadcn-btn-secondary" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="ProductsView.showBarcodeLabelModal('${p.id}')" title="Generate and Print Barcode Label">
                            Label
                        </button>
                        <button class="shadcn-btn-secondary" style="padding: 3px 7px; font-size: 11px; margin-right: 4px;" onclick="ProductsView.showEditModal('${p.id}')" title="Edit product information">
                            Edit
                        </button>
                        <button class="shadcn-btn-secondary" style="padding: 3px 7px; font-size: 11px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="ProductsView.deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" title="Delete or deactivate SKU">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterProducts(query) {
        const q = (query || '').toLowerCase().trim();
        const filtered = this.productsList.filter(p => 
            p.sku.toLowerCase().includes(q) || 
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q))
        );
        const tbody = document.getElementById('products-tbody');
        if (tbody) tbody.innerHTML = this.renderRows(filtered);
    },

    // --------------------------------------------------------------------------
    // CREATE SKU
    // --------------------------------------------------------------------------
    showAddModal() {
        const m = document.getElementById('modal-add-product');
        if (m) m.style.display = 'flex';
    },

    hideAddModal() {
        const m = document.getElementById('modal-add-product');
        if (m) m.style.display = 'none';
    },

    async handleCreateProduct(e) {
        e.preventDefault();
        try {
            const sku = document.getElementById('new-prod-sku').value;
            const barcode = document.getElementById('new-prod-barcode').value;
            const name = document.getElementById('new-prod-name').value;
            const category_id = document.getElementById('new-prod-category').value;
            const base_uom = document.getElementById('new-prod-uom').value;
            const buy = parseFloat(document.getElementById('new-prod-purchase').value) || 0;
            const sell = parseFloat(document.getElementById('new-prod-selling').value) || 0;
            const tax_id = document.getElementById('new-prod-tax').value;
            const stock = parseInt(document.getElementById('new-prod-stock').value, 10) || 0;

            App.showToast('Writing product to Supabase PostgreSQL...', 'info');

            await window.SupabaseClient.createProduct({
                sku,
                barcode: barcode || sku,
                name,
                category_id,
                base_uom,
                purchase_price: Math.round(buy * 100),
                selling_price: Math.round(sell * 100),
                tax_category_id: tax_id,
                initial_stock: stock,
                reorder_point: 10
            });

            this.hideAddModal();
            App.showToast(`Product ${sku} created and synced with live cloud database!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Failed to create product: ${err.message}`, 'danger');
        }
    },

    // --------------------------------------------------------------------------
    // EDIT SKU
    // --------------------------------------------------------------------------
    showEditModal(productId) {
        const p = this.productsList.find(x => x.id === productId);
        if (!p) return;

        const m = document.getElementById('modal-edit-product');
        if (!m) return;

        document.getElementById('edit-prod-id').value = p.id;
        document.getElementById('edit-prod-sku').value = p.sku;
        document.getElementById('edit-prod-barcode').value = p.barcode || p.sku;
        document.getElementById('edit-prod-name').value = p.name;
        document.getElementById('edit-prod-uom').value = p.base_uom || 'PCS';
        document.getElementById('edit-prod-reorder').value = p.reorder_point || 10;
        document.getElementById('edit-prod-purchase').value = ((p.purchase_price || 0) / 100).toFixed(2);
        document.getElementById('edit-prod-selling').value = ((p.selling_price || 0) / 100).toFixed(2);
        document.getElementById('edit-prod-status').value = p.is_active !== false ? 'true' : 'false';

        m.style.display = 'flex';
    },

    hideEditModal() {
        const m = document.getElementById('modal-edit-product');
        if (m) m.style.display = 'none';
    },

    async handleEditProduct(e) {
        e.preventDefault();
        try {
            const id = document.getElementById('edit-prod-id').value;
            const sku = document.getElementById('edit-prod-sku').value;
            const barcode = document.getElementById('edit-prod-barcode').value;
            const name = document.getElementById('edit-prod-name').value;
            const uom = document.getElementById('edit-prod-uom').value;
            const reorder = parseInt(document.getElementById('edit-prod-reorder').value, 10) || 10;
            const buy = parseFloat(document.getElementById('edit-prod-purchase').value) || 0;
            const sell = parseFloat(document.getElementById('edit-prod-selling').value) || 0;
            const tax_id = document.getElementById('edit-prod-tax').value;
            const isActive = document.getElementById('edit-prod-status').value === 'true';

            App.showToast('Updating SKU in Supabase cloud...', 'info');

            await window.SupabaseClient.updateProduct(id, {
                sku,
                barcode,
                name,
                base_uom: uom,
                reorder_point: reorder,
                purchase_price: Math.round(buy * 100),
                selling_price: Math.round(sell * 100),
                tax_category_id: tax_id,
                is_active: isActive
            });

            this.hideEditModal();
            App.showToast(`Product ${sku} updated successfully!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Update failed: ${err.message}`, 'danger');
        }
    },

    // --------------------------------------------------------------------------
    // DELETE SKU
    // --------------------------------------------------------------------------
    async deleteProduct(id, name) {
        if (!confirm(`Are you sure you want to delete product "${name}" from Supabase?`)) return;
        try {
            App.showToast('Deleting product from cloud DB...', 'info');
            const res = await window.SupabaseClient.deleteProduct(id);
            App.showToast(res.message, res.softDeleted ? 'info' : 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Delete failed: ${err.message}`, 'danger');
        }
    },

    // --------------------------------------------------------------------------
    // BULK CSV PRODUCT IMPORT
    // --------------------------------------------------------------------------
    showBulkImportModal() {
        const m = document.getElementById('modal-bulk-product-import');
        if (m) m.style.display = 'flex';
    },

    hideBulkImportModal() {
        const m = document.getElementById('modal-bulk-product-import');
        if (m) m.style.display = 'none';
    },

    insertSampleProductCsv() {
        const txt = document.getElementById('bulk-prod-csv-text');
        if (!txt) return;
        txt.value = 
`PROD-LOGI-MXM3S,Logitech MX Master 3S Wireless Mouse,890100200301,PCS,6500.00,8999.00,45
PROD-KEYCH-K2PRO,Keychron K2 Pro Mechanical Keyboard,890100200302,PCS,7200.00,9499.00,30
PROD-DELL-U2723QE,Dell UltraSharp 27 4K USB-C Hub Monitor,890100200303,PCS,42000.00,54999.00,12
PROD-ANKER-737PB,Anker 737 Power Bank (PowerCore 24K),890100200304,PCS,8500.00,11999.00,25
PROD-SONY-WH1000XM5,Sony WH-1000XM5 Noise-Canceling Headphones,890100200305,PCS,22000.00,29990.00,18`;
    },

    async handleBulkImportSubmit(e) {
        e.preventDefault();
        const raw = document.getElementById('bulk-prod-csv-text')?.value.trim();
        if (!raw) {
            App.showToast('Please enter or paste CSV data.', 'danger');
            return;
        }

        const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const items = [];

        for (const line of lines) {
            const parts = line.split(',').map(p => p.trim());
            if (parts[0].toLowerCase() === 'sku') continue; // Header row
            if (parts.length >= 2) {
                items.push({
                    sku: parts[0],
                    name: parts[1] || parts[0],
                    barcode: parts[2] || parts[0],
                    base_uom: parts[3] || 'PCS',
                    purchase_price: parseFloat(parts[4]) || 0,
                    selling_price: parseFloat(parts[5]) || 0,
                    initial_stock: parseInt(parts[6] || '0', 10)
                });
            }
        }

        if (items.length === 0) {
            App.showToast('No valid CSV rows parsed.', 'danger');
            return;
        }

        const btn = document.getElementById('btn-submit-bulk-prod');
        if (btn) { btn.disabled = true; btn.innerText = 'Importing to Cloud DB...'; }

        try {
            App.showToast(`Importing ${items.length} products to Supabase...`, 'info');
            const res = await window.SupabaseClient.importBulkProducts(items);
            this.hideBulkImportModal();
            App.showToast(`Bulk Import complete: ${res.created} created, ${res.updated} updated!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Bulk Import failed: ${err.message}`, 'danger');
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = 'Execute Cloud Import'; }
        }
    },

    // --------------------------------------------------------------------------
    // BARCODE STICKER LABEL GENERATOR
    // --------------------------------------------------------------------------
    showBarcodeLabelModal(productId) {
        const p = this.productsList.find(x => x.id === productId);
        if (!p) return;

        const m = document.getElementById('modal-barcode-label');
        const container = document.getElementById('barcode-label-preview-container');
        if (!m || !container) return;

        const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
        if (window.BarcodeQR) {
            container.innerHTML = window.BarcodeQR.generateBarcodeLabel(p, store);
        } else {
            container.innerHTML = `<div>SKU: ${p.sku} • MRP: ₹${(p.selling_price / 100).toFixed(2)}</div>`;
        }

        this._activeLabelProduct = p;
        m.style.display = 'flex';
    },

    hideBarcodeLabelModal() {
        const m = document.getElementById('modal-barcode-label');
        if (m) m.style.display = 'none';
        this._activeLabelProduct = null;
    },

    printBarcodeLabel() {
        const sticker = document.querySelector('.pos-barcode-label-sticker');
        if (!sticker) return;

        const printWin = window.open('', '_blank', 'width=320,height=220');
        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Barcode Label</title>
                <style>
                    @page { size: 50mm 30mm; margin: 0; }
                    body { margin: 0; padding: 4px; display: flex; justify-content: center; align-items: center; background: #fff; }
                </style>
            </head>
            <body>
                ${sticker.outerHTML}
            </body>
            </html>
        `);
        printWin.document.close();
        setTimeout(() => {
            printWin.focus();
            printWin.print();
            printWin.close();
        }, 300);
    }
};

window.ProductsView = ProductsView;
