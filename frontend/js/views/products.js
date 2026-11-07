/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Products & SKU Master Catalog View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL
 * ==============================================================================
 */

const ProductsView = {
    productsList: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            this.productsList = await window.SupabaseClient.getProducts();
            this.renderTable(container);
        } catch (err) {
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading products from Supabase:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderTable(container) {
        container.innerHTML = `
            <div class="tblr-card">
                <div class="tblr-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--tblr-border-color);">
                    <div>
                        <h3 class="tblr-card-title" style="margin: 0; font-size: 16px;">Product Catalog (${this.productsList.length} items)</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            Master SKU registry with HSN compliance and tax classifications
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="prod-search-input" class="tblr-form-control" placeholder="Search by SKU or Name..." style="width: 220px; height: 34px; font-size: 13px;" oninput="ProductsView.filterProducts(this.value)" />
                        <button class="tblr-btn tblr-btn-primary" onclick="ProductsView.showAddModal()">
                            + Add New SKU
                        </button>
                    </div>
                </div>

                <div class="tblr-table-responsive">
                    <table class="tblr-table" id="products-table">
                        <thead>
                            <tr>
                                <th>SKU / BARCODE</th>
                                <th>NAME & CATEGORY</th>
                                <th>UOM</th>
                                <th style="text-align: right;">PURCHASE PRICE</th>
                                <th style="text-align: right;">SELLING PRICE</th>
                                <th style="text-align: center;">GST RATE</th>
                                <th style="text-align: center;">REORDER PT</th>
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
                <div class="tblr-modal-dialog" style="max-width: 550px;">
                    <div class="tblr-modal-header">
                        <h3 class="tblr-modal-title">Create New Master Product</h3>
                        <button class="tblr-modal-close" onclick="ProductsView.hideAddModal()">✕</button>
                    </div>
                    <form id="form-create-product" onsubmit="ProductsView.handleCreateProduct(event)">
                        <div class="tblr-modal-body">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">SKU Code *</label>
                                    <input type="text" id="new-prod-sku" class="tblr-form-control" placeholder="e.g. PROD-DELL-U27" required />
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Barcode / EAN-13</label>
                                    <input type="text" id="new-prod-barcode" class="tblr-form-control" placeholder="e.g. 8901234567895" />
                                </div>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Product Name *</label>
                                <input type="text" id="new-prod-name" class="tblr-form-control" placeholder="e.g. Dell UltraSharp 27 Monitor" required />
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Category</label>
                                    <select id="new-prod-category" class="tblr-form-control">
                                        <option value="50000000-0000-0000-0000-000000000001">Electronics & Peripherals</option>
                                        <option value="50000000-0000-0000-0000-000000000002">Monitors & Displays</option>
                                        <option value="50000000-0000-0000-0000-000000000003">Ergonomic Furniture</option>
                                    </select>
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Unit of Measure (UOM)</label>
                                    <select id="new-prod-uom" class="tblr-form-control">
                                        <option value="PCS">PCS (Pieces)</option>
                                        <option value="BOX">BOX (12 Units)</option>
                                        <option value="KG">KG (Kilograms)</option>
                                        <option value="SET">SET (Kit)</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Purchase Cost (₹) *</label>
                                    <input type="number" step="0.01" id="new-prod-purchase" class="tblr-form-control" placeholder="6500.00" required />
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Selling Price (₹) *</label>
                                    <input type="number" step="0.01" id="new-prod-selling" class="tblr-form-control" placeholder="8999.00" required />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Initial Stock (Units)</label>
                                    <input type="number" id="new-prod-stock" class="tblr-form-control" value="25" min="0" />
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Reorder Threshold</label>
                                    <input type="number" id="new-prod-reorder" class="tblr-form-control" value="10" min="1" />
                                </div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer">
                            <button type="button" class="tblr-btn tblr-btn-default" onclick="ProductsView.hideAddModal()">Cancel</button>
                            <button type="submit" id="btn-save-product" class="tblr-btn tblr-btn-primary">Save Product</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderRows(products) {
        if (!products || products.length === 0) {
            return `<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--tblr-text-muted);">No products found in database. Click '+ Add New SKU' above.</td></tr>`;
        }

        return products.map(p => {
            const purchase = (p.purchase_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const selling = (p.selling_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const taxPct = (p.tax_rate_bps / 100).toFixed(0);

            return `
                <tr>
                    <td>
                        <div style="font-weight: 700; color: #fff;">${p.sku}</div>
                        <div style="font-size: 11px; color: var(--tblr-text-muted);">${p.barcode || 'NO BARCODE'}</div>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #e2e8f0;">${p.name}</div>
                        <div style="font-size: 11px; color: var(--tblr-primary);">${p.category}</div>
                    </td>
                    <td><span class="tblr-badge tblr-badge-blue">${p.base_uom}</span></td>
                    <td style="text-align: right; font-family: monospace; color: var(--tblr-text-secondary);">₹${purchase}</td>
                    <td style="text-align: right; font-weight: 700; font-family: monospace; color: #2fb344;">₹${selling}</td>
                    <td style="text-align: center;"><span class="tblr-badge tblr-badge-green">${taxPct}% GST</span></td>
                    <td style="text-align: center; color: var(--tblr-text-muted);">${p.reorder_point}</td>
                    <td style="text-align: center;">
                        <button class="tblr-btn tblr-btn-default" style="padding: 4px 8px; font-size: 11px; color: #ff6b6b;" onclick="ProductsView.deleteProduct('${p.id}', '${p.name}')">
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
            p.category.toLowerCase().includes(q)
        );
        const tbody = document.getElementById('products-tbody');
        if (tbody) tbody.innerHTML = this.renderRows(filtered);
    },

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
        const saveBtn = document.getElementById('btn-save-product');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerText = 'Creating in Supabase...';
        }

        const sku = document.getElementById('new-prod-sku')?.value.trim();
        const barcode = document.getElementById('new-prod-barcode')?.value.trim();
        const name = document.getElementById('new-prod-name')?.value.trim();
        const category_id = document.getElementById('new-prod-category')?.value;
        const base_uom = document.getElementById('new-prod-uom')?.value;
        const purchase = parseFloat(document.getElementById('new-prod-purchase')?.value || '0');
        const selling = parseFloat(document.getElementById('new-prod-selling')?.value || '0');
        const stock = parseInt(document.getElementById('new-prod-stock')?.value || '0', 10);
        const reorder = parseInt(document.getElementById('new-prod-reorder')?.value || '10', 10);

        try {
            await window.SupabaseClient.createProduct({
                sku,
                barcode,
                name,
                category_id,
                base_uom,
                purchase_price: purchase * 100, // C minor units
                selling_price: selling * 100,
                initial_stock: stock,
                reorder_point: reorder
            });

            App.showToast(`Product ${sku} created and synchronized with cloud!`, 'success');
            this.hideAddModal();
            this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Failed to create product: ${err.message}`, 'danger');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Save Product';
            }
        }
    },

    async deleteProduct(id, name) {
        if (!confirm(`Are you sure you want to delete ${name}? This will remove its inventory balances.`)) return;

        try {
            await window.SupabaseClient.deleteProduct(id);
            App.showToast(`Deleted ${name} from cloud database.`, 'info');
            this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Delete failed: ${err.message}`, 'danger');
        }
    }
};

window.ProductsView = ProductsView;
