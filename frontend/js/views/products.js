/**
 * Tabler Dark UI :: Products View
 */

const ProductsView = {
    async render(container) {
        try {
            const products = await api.getProducts();

            container.innerHTML = `
                <div class="tblr-card">
                    <div class="tblr-card-header">
                        <div>
                            <h3 class="tblr-card-title">PRODUCT MASTER CATALOG</h3>
                            <span class="tblr-card-subtitle">Manage items, barcodes, prices, and tax rates</span>
                        </div>
                        <button class="tblr-btn tblr-btn-primary" onclick="ProductsView.showAddModal()">
                            + Add New Product
                        </button>
                    </div>

                    <div class="tblr-table-responsive">
                        <table class="tblr-table">
                            <thead>
                                <tr>
                                    <th>SKU / Barcode</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>UOM</th>
                                    <th>Purchase Cost</th>
                                    <th>Selling Price</th>
                                    <th>GST Rate</th>
                                    <th>Reorder Point</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${products.map(p => `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 700; color: #ffffff;">${p.sku}</div>
                                            <div style="font-size: 11px; color: var(--tblr-text-muted);">${p.barcode || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div style="font-weight: 600;">${p.name}</div>
                                        </td>
                                        <td><span class="tblr-badge tblr-badge-muted">${p.category || 'General'}</span></td>
                                        <td>${p.uom || 'PCS'}</td>
                                        <td>₹${(p.purchase_price_cents / 100).toFixed(2)}</td>
                                        <td style="font-weight: 700; color: var(--tblr-primary);">₹${(p.selling_price_cents / 100).toFixed(2)}</td>
                                        <td><span class="tblr-badge tblr-badge-muted">${p.tax_rate_percent}%</span></td>
                                        <td>${p.reorder_point}</td>
                                        <td>
                                            <span class="tblr-badge tblr-badge-success">Active</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Add Product Modal -->
                <div id="modal-add-product" class="tblr-modal-backdrop">
                    <div class="tblr-modal">
                        <div class="tblr-modal-header">
                            <h4 class="tblr-modal-title">Create New Product</h4>
                            <button class="tblr-modal-close" onclick="ProductsView.closeAddModal()">✕</button>
                        </div>
                        <div class="tblr-modal-body">
                            <form id="form-add-product" onsubmit="ProductsView.handleSubmit(event)">
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">SKU / Item Code *</label>
                                    <input type="text" id="p-sku" class="tblr-input" required placeholder="e.g. SKU-WIFI-ROUTER-01">
                                </div>
                                <div class="tblr-form-group">
                                    <label class="tblr-form-label">Product Name *</label>
                                    <input type="text" id="p-name" class="tblr-input" required placeholder="e.g. Dual-Band Enterprise Wireless Router">
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Category</label>
                                        <select id="p-cat" class="tblr-select">
                                            <option value="Electronics & Hardware">Electronics & Hardware</option>
                                            <option value="Office Supplies & Automation">Office Supplies & Automation</option>
                                            <option value="Packaging Materials">Packaging Materials</option>
                                        </select>
                                    </div>
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Unit of Measure (UOM)</label>
                                        <select id="p-uom" class="tblr-select">
                                            <option value="PCS">Pieces (PCS)</option>
                                            <option value="BOX">Box (BOX)</option>
                                            <option value="KG">Kilograms (KG)</option>
                                        </select>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Purchase Price (₹) *</label>
                                        <input type="number" step="0.01" id="p-buy" class="tblr-input" required placeholder="1500.00">
                                    </div>
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Selling Price (₹) *</label>
                                        <input type="number" step="0.01" id="p-sell" class="tblr-input" required placeholder="2400.00">
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">GST Tax Rate (%)</label>
                                        <select id="p-tax" class="tblr-select">
                                            <option value="18">18.00% (Standard GST)</option>
                                            <option value="12">12.00% (Reduced GST)</option>
                                            <option value="5">5.00% (Low GST)</option>
                                            <option value="0">0.00% (Exempt)</option>
                                        </select>
                                    </div>
                                    <div class="tblr-form-group">
                                        <label class="tblr-form-label">Reorder Safety Point</label>
                                        <input type="number" id="p-reorder" class="tblr-input" value="10">
                                    </div>
                                </div>
                                <div class="tblr-modal-footer" style="padding: 16px 0 0 0; margin-top: 10px;">
                                    <button type="button" class="tblr-btn tblr-btn-default" onclick="ProductsView.closeAddModal()">Cancel</button>
                                    <button type="submit" class="tblr-btn tblr-btn-primary">Save Product</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="tblr-card" style="color: var(--tblr-danger);">Failed to load products: ${err.message}</div>`;
        }
    },

    showAddModal() {
        document.getElementById('modal-add-product').classList.add('show');
    },

    closeAddModal() {
        document.getElementById('modal-add-product').classList.remove('show');
    },

    async handleSubmit(e) {
        e.preventDefault();
        try {
            const sku = document.getElementById('p-sku').value;
            const name = document.getElementById('p-name').value;
            const category = document.getElementById('p-cat').value;
            const uom = document.getElementById('p-uom').value;
            const buy = parseFloat(document.getElementById('p-buy').value);
            const sell = parseFloat(document.getElementById('p-sell').value);
            const tax = parseFloat(document.getElementById('p-tax').value);
            const reorder = parseInt(document.getElementById('p-reorder').value, 10);

            await api.createProduct({
                sku,
                name,
                category,
                uom,
                purchase_price_cents: Math.round(buy * 100),
                selling_price_cents: Math.round(sell * 100),
                tax_rate_percent: tax,
                reorder_point: reorder
            });

            ProductsView.closeAddModal();
            App.showToast('Product successfully created!', 'success');
            ProductsView.render(document.getElementById('main-content'));
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    }
};

window.ProductsView = ProductsView;

