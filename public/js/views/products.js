/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Products & SKU Master Catalog View
 * Shadcn UI Kit Dark Theme & 100% Live Supabase PostgreSQL Integration
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
                <div class="shadcn-table-header">
                    <div>
                        <h2 style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0;">Product Catalog (${this.productsList.length} items)</h2>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                            Master SKU registry with HSN compliance and tax classifications
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="prod-search-input" class="shadcn-input" placeholder="Search by SKU or Name..." style="width: 240px; height: 34px;" oninput="ProductsView.filterProducts(this.value)" />
                        <button class="shadcn-btn-primary" onclick="ProductsView.showAddModal()">
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
                        <div class="tblr-modal-footer" style="padding: 16px 20px; border-top: 1px solid #222226; display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="ProductsView.hideAddModal()">Cancel</button>
                            <button type="submit" class="shadcn-btn-primary">Save to Live Database</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderRows(products) {
        if (!products || products.length === 0) {
            return `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">No products found in live database. Click '+ Add New SKU' above to register fresh items.</td></tr>`;
        }

        return products.map(p => {
            const purchase = (p.purchase_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const selling = (p.selling_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const taxPct = (p.tax_rate_bps / 100).toFixed(0);

            return `
                <tr>
                    <td>
                        <div style="font-weight: 700; color: #fff;">${p.sku}</div>
                        <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${p.barcode || 'NO BARCODE'}</div>
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
                        <button class="shadcn-btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="ProductsView.deleteProduct('${p.id}', '${p.name}')">
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
                barcode,
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

    async deleteProduct(id, name) {
        if (!confirm(`Are you sure you want to delete product "${name}" from Supabase?`)) return;
        try {
            App.showToast('Deleting product from cloud DB...', 'info');
            await window.SupabaseClient.deleteProduct(id);
            App.showToast('Product deleted successfully.', 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(`Delete failed: ${err.message}`, 'danger');
        }
    }
};

window.ProductsView = ProductsView;
