/**
 * Tabler Dark UI :: Point of Sale (POS) Terminal View
 * High-Speed Cashier Interface with C-Powered Calculations
 */

const PosView = {
    cart: [],
    products: [],
    customers: [],
    selectedCustomer: null,
    managerOverride: false,

    async render(container) {
        try {
            const [prods, custs] = await Promise.all([
                api.getProducts(),
                api.getCustomers()
            ]);
            this.products = prods;
            this.customers = custs;
            this.selectedCustomer = custs.find(c => c.code === 'CUST-WALK-IN') || custs[0];

            container.innerHTML = `
                <div class="pos-container">
                    <!-- Left: Catalog Panel -->
                    <div class="pos-catalog-panel">
                        <div class="pos-search-bar">
                            <input type="text" id="pos-search" class="tblr-input" placeholder="🔍 Search product name, SKU or scan barcode..." oninput="PosView.handleSearch(this.value)">
                            <select id="pos-customer-select" class="tblr-select" style="max-width: 240px;" onchange="PosView.handleCustomerChange(this.value)">
                                ${custs.map(c => `
                                    <option value="${c.id}" ${c.id === this.selectedCustomer.id ? 'selected' : ''}>
                                        👤 ${c.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Category Filters -->
                        <div class="pos-category-pills">
                            <div class="pos-pill active" onclick="PosView.filterCategory('ALL', this)">All Items</div>
                            <div class="pos-pill" onclick="PosView.filterCategory('Electronics & Hardware', this)">Electronics</div>
                            <div class="pos-pill" onclick="PosView.filterCategory('Office Supplies & Automation', this)">Office Supplies</div>
                            <div class="pos-pill" onclick="PosView.filterCategory('Packaging Materials', this)">Packaging</div>
                        </div>

                        <!-- Product Grid -->
                        <div id="pos-grid" class="pos-product-grid">
                            ${this.renderProductCards(this.products)}
                        </div>
                    </div>

                    <!-- Right: Cart & Calculation Panel -->
                    <div class="pos-cart-panel">
                        <div class="pos-cart-header">
                            <span class="pos-cart-title">ACTIVE POS BILLING CART</span>
                            <button class="tblr-btn tblr-btn-sm tblr-btn-default" onclick="PosView.clearCart()">Clear</button>
                        </div>

                        <div id="pos-cart-items" class="pos-cart-items">
                            <div style="text-align: center; color: var(--tblr-text-muted); margin-top: 40px;">
                                Cart is empty.<br>Click any product on the left to add.
                            </div>
                        </div>

                        <!-- C Engine Calculation Summary -->
                        <div id="pos-cart-summary" class="pos-cart-summary">
                            <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700; margin-bottom: 4px;">
                                ⚙ C17 Engine Real-Time Pricing
                            </div>
                            <div class="pos-summary-row">
                                <span>Gross Subtotal:</span>
                                <span id="pos-subtotal">₹0.00</span>
                            </div>
                            <div class="pos-summary-row">
                                <span>Discounts Applied:</span>
                                <span id="pos-discount" style="color: var(--tblr-danger);">-₹0.00</span>
                            </div>
                            <div class="pos-summary-row">
                                <span>Taxable Amount:</span>
                                <span id="pos-taxable">₹0.00</span>
                            </div>
                            <div class="pos-summary-row">
                                <span>CGST (9%) + SGST (9%):</span>
                                <span id="pos-tax">₹0.00</span>
                            </div>
                            <div class="pos-summary-row">
                                <span>Round Off:</span>
                                <span id="pos-roundoff">₹0.00</span>
                            </div>
                            <div class="pos-summary-row total">
                                <span>Grand Total:</span>
                                <span id="pos-grand-total" style="color: #206bc4;">₹0.00</span>
                            </div>

                            <div style="margin: 8px 0; display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="pos-manager-override" onchange="PosView.toggleOverride(this.checked)">
                                <label for="pos-manager-override" style="font-size: 11px; color: var(--tblr-text-secondary); cursor: pointer;">
                                    Manager Override Approved (Allows >20% Discount)
                                </label>
                            </div>

                            <button id="pos-btn-checkout" class="pos-checkout-btn" onclick="PosView.showCheckoutModal()" disabled>
                                ⚡ Collect Payment & Issue Invoice
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Checkout Modal -->
                <div id="modal-pos-checkout" class="tblr-modal-backdrop">
                    <div class="tblr-modal" style="max-width: 480px;">
                        <div class="tblr-modal-header">
                            <h4 class="tblr-modal-title">Payment Collection</h4>
                            <button class="tblr-modal-close" onclick="PosView.closeCheckoutModal()">✕</button>
                        </div>
                        <div class="tblr-modal-body">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <span style="font-size: 12px; color: var(--tblr-text-muted); text-transform: uppercase;">Amount Due to Collect</span>
                                <div id="checkout-modal-amount" style="font-size: 32px; font-weight: 800; color: #206bc4; margin-top: 4px;">₹0.00</div>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Payment Method</label>
                                <select id="checkout-method" class="tblr-select">
                                    <option value="CASH">💵 Cash on Hand</option>
                                    <option value="CARD">💳 POS Card Terminal</option>
                                    <option value="UPI">📱 Instant UPI QR</option>
                                    <option value="BANK_TRANSFER">🏦 Electronic Bank Transfer</option>
                                </select>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Reference / Slip Number (Optional)</label>
                                <input type="text" id="checkout-ref" class="tblr-input" placeholder="e.g. UPI Ref / Card Approval Code">
                            </div>

                            <div class="tblr-modal-footer" style="padding: 16px 0 0 0; margin-top: 10px;">
                                <button type="button" class="tblr-btn tblr-btn-default" onclick="PosView.closeCheckoutModal()">Cancel</button>
                                <button type="button" class="tblr-btn tblr-btn-success" onclick="PosView.completeCheckout()">Confirm & Print Receipt</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Invoice Print Modal -->
                <div id="modal-invoice-receipt" class="tblr-modal-backdrop">
                    <div class="tblr-modal invoice-print-modal" style="max-width: 720px;">
                        <div class="tblr-modal-header">
                            <h4 class="tblr-modal-title">Tax Invoice Generated</h4>
                            <div style="display: flex; gap: 8px;">
                                <button class="tblr-btn tblr-btn-primary tblr-btn-sm" onclick="window.print()">🖨 Print Invoice</button>
                                <button class="tblr-modal-close" onclick="PosView.closeInvoiceModal()">✕</button>
                            </div>
                        </div>
                        <div class="tblr-modal-body">
                            <div id="invoice-print-content" class="invoice-print-container"></div>
                        </div>
                    </div>
                </div>
            `;

            this.updateCartUI();
        } catch (err) {
            container.innerHTML = `<div class="tblr-card" style="color: var(--tblr-danger);">Failed to initialize POS: ${err.message}</div>`;
        }
    },

    renderProductCards(prods) {
        if (!prods || prods.length === 0) {
            return `<div style="color: var(--tblr-text-muted); padding: 20px;">No matching products.</div>`;
        }
        return prods.map(p => `
            <div class="pos-product-card" onclick="PosView.addToCart('${p.id}')">
                <div>
                    <div class="pos-product-sku">${p.sku}</div>
                    <div class="pos-product-name">${p.name}</div>
                </div>
                <div class="pos-product-footer">
                    <span class="pos-product-price">₹${(p.selling_price_cents / 100).toFixed(2)}</span>
                    <span class="pos-product-stock">GST ${p.tax_rate_percent}%</span>
                </div>
            </div>
        `).join('');
    },

    handleSearch(query) {
        const q = (query || '').toLowerCase();
        const filtered = this.products.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.sku.toLowerCase().includes(q) || 
            (p.barcode && p.barcode.includes(q))
        );
        document.getElementById('pos-grid').innerHTML = this.renderProductCards(filtered);
    },

    filterCategory(cat, el) {
        document.querySelectorAll('.pos-pill').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
        if (cat === 'ALL') {
            document.getElementById('pos-grid').innerHTML = this.renderProductCards(this.products);
        } else {
            const filtered = this.products.filter(p => p.category === cat);
            document.getElementById('pos-grid').innerHTML = this.renderProductCards(filtered);
        }
    },

    handleCustomerChange(custId) {
        this.selectedCustomer = this.customers.find(c => c.id === custId);
    },

    addToCart(productId) {
        const prod = this.products.find(p => p.id === productId);
        if (!prod) return;

        const existing = this.cart.find(item => item.product_id === productId);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({
                product_id: prod.id,
                sku: prod.sku,
                name: prod.name,
                quantity: 1,
                unit_price_cents: prod.selling_price_cents,
                discount_bp: 0,
                tax_rate_percent: prod.tax_rate_percent
            });
        }
        this.recalculateCart();
    },

    changeQty(productId, delta) {
        const item = this.cart.find(i => i.product_id === productId);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) {
            this.cart = this.cart.filter(i => i.product_id !== productId);
        }
        this.recalculateCart();
    },

    changeDiscount(productId, val) {
        const item = this.cart.find(i => i.product_id === productId);
        if (!item) return;
        const discPercent = parseFloat(val) || 0;
        item.discount_bp = Math.round(discPercent * 100);
        this.recalculateCart();
    },

    clearCart() {
        this.cart = [];
        this.updateCartUI();
    },

    toggleOverride(val) {
        this.managerOverride = val;
        this.recalculateCart();
    },

    async recalculateCart() {
        if (this.cart.length === 0) {
            this.updateCartUI();
            return;
        }

        try {
            const quote = await api.quoteSale({
                lines: this.cart,
                manager_override_approved: this.managerOverride
            });
            this.updateCartUI(quote);
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    updateCartUI(quote = null) {
        const container = document.getElementById('pos-cart-items');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--tblr-text-muted); margin-top: 40px;">
                    Cart is empty.<br>Click any product on the left to add.
                </div>
            `;
            document.getElementById('pos-subtotal').innerText = '₹0.00';
            document.getElementById('pos-discount').innerText = '-₹0.00';
            document.getElementById('pos-taxable').innerText = '₹0.00';
            document.getElementById('pos-tax').innerText = '₹0.00';
            document.getElementById('pos-roundoff').innerText = '₹0.00';
            document.getElementById('pos-grand-total').innerText = '₹0.00';
            document.getElementById('pos-btn-checkout').disabled = true;
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="pos-cart-item">
                <div class="pos-item-header">
                    <span>${item.name}</span>
                    <span>₹${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}</span>
                </div>
                <div class="pos-item-controls">
                    <div class="pos-qty-group">
                        <button class="pos-qty-btn" onclick="PosView.changeQty('${item.product_id}', -1)">-</button>
                        <span class="pos-qty-val">${item.quantity}</span>
                        <button class="pos-qty-btn" onclick="PosView.changeQty('${item.product_id}', 1)">+</button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                        <span>Disc %:</span>
                        <input type="number" class="tblr-input" style="width: 55px; padding: 2px 4px; font-size: 11px;" 
                               value="${(item.discount_bp / 100).toFixed(0)}" min="0" max="100"
                               onchange="PosView.changeDiscount('${item.product_id}', this.value)">
                    </div>
                </div>
            </div>
        `).join('');

        if (quote) {
            document.getElementById('pos-subtotal').innerText = `₹${(quote.subtotal_cents / 100).toFixed(2)}`;
            document.getElementById('pos-discount').innerText = `-₹${(quote.total_discount_cents / 100).toFixed(2)}`;
            document.getElementById('pos-taxable').innerText = `₹${(quote.taxable_subtotal_cents / 100).toFixed(2)}`;
            document.getElementById('pos-tax').innerText = `₹${(quote.total_tax_cents / 100).toFixed(2)}`;
            document.getElementById('pos-roundoff').innerText = `₹${(quote.round_off_cents / 100).toFixed(2)}`;
            document.getElementById('pos-grand-total').innerText = `₹${(quote.grand_total_cents / 100).toFixed(2)}`;
            document.getElementById('pos-btn-checkout').disabled = false;
            this.currentQuote = quote;
        }
    },

    showCheckoutModal() {
        if (!this.currentQuote) return;
        document.getElementById('checkout-modal-amount').innerText = `₹${(this.currentQuote.grand_total_cents / 100).toFixed(2)}`;
        document.getElementById('modal-pos-checkout').classList.add('show');
    },

    closeCheckoutModal() {
        document.getElementById('modal-pos-checkout').classList.remove('show');
    },

    async completeCheckout() {
        try {
            const method = document.getElementById('checkout-method').value;
            const ref = document.getElementById('checkout-ref').value;

            const saleData = {
                customer_id: this.selectedCustomer.id,
                customer_name: this.selectedCustomer.name,
                payment_method: method,
                payment_reference: ref,
                lines: this.cart,
                manager_override_approved: this.managerOverride
            };

            const invoice = await api.checkoutSale(saleData);

            this.closeCheckoutModal();
            this.clearCart();
            App.showToast(`Invoice ${invoice.invoice_number} successfully posted!`, 'success');

            this.renderPrintInvoice(invoice);
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    renderPrintInvoice(inv) {
        const printContainer = document.getElementById('invoice-print-content');
        printContainer.innerHTML = `
            <div class="invoice-header-row">
                <div>
                    <div class="invoice-company-title">Apex Industrial & Retail Systems Ltd.</div>
                    <div style="font-size: 11px; color: #475569;">108 Industrial Expressway, Tech Corridor, Chennai - 600001</div>
                    <div style="font-size: 11px; color: #475569;">GSTIN: 33AAAAA0000A1Z5 | Phone: +91 44 2800 1234</div>
                </div>
                <div class="invoice-meta-block">
                    <div class="invoice-number">${inv.invoice_number}</div>
                    <div style="font-size: 12px; font-weight: 600;">TAX INVOICE</div>
                    <div style="font-size: 11px; color: #475569;">Date: ${inv.invoice_date}</div>
                    <div style="font-size: 11px; color: #475569;">Status: <strong style="color: #16a34a;">PAID</strong></div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; margin-bottom: 16px;">
                <div>
                    <strong>Billed To:</strong><br>
                    ${inv.customer_name}<br>
                    Customer ID: ${inv.customer_id}
                </div>
                <div style="text-align: right;">
                    <strong>Payment Mode:</strong> Cash / Instant POS<br>
                    <strong>State of Supply:</strong> Tamil Nadu (33)
                </div>
            </div>

            <table class="invoice-print-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Product / Item Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Taxable Base</th>
                        <th>CGST (9%)</th>
                        <th>SGST (9%)</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${inv.lines.map((l, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td><strong>${l.product_id}</strong></td>
                            <td>${l.quantity}</td>
                            <td>₹${(l.unit_price_cents / 100).toFixed(2)}</td>
                            <td>₹${(l.taxable_amount / 100).toFixed(2)}</td>
                            <td>₹${(l.cgst_amount / 100).toFixed(2)}</td>
                            <td>₹${(l.sgst_amount / 100).toFixed(2)}</td>
                            <td><strong>₹${(l.line_total / 100).toFixed(2)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <div style="width: 280px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Gross Subtotal:</span>
                        <span>₹${(inv.subtotal_cents / 100).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Discounts:</span>
                        <span>-₹${(inv.total_discount_cents / 100).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>CGST + SGST (18%):</span>
                        <span>₹${(inv.total_tax_cents / 100).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Round Off:</span>
                        <span>₹${(inv.round_off_cents / 100).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; border-top: 2px solid #000; padding-top: 6px;">
                        <span>Grand Total:</span>
                        <span>₹${(inv.grand_total_cents / 100).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 11px; color: #64748b; text-align: center;">
                This is a computer-generated invoice authenticated by the C17 Domain Billing Engine. Double-entry ledger posted.
            </div>
        `;

        document.getElementById('modal-invoice-receipt').classList.add('show');
    },

    closeInvoiceModal() {
        document.getElementById('modal-invoice-receipt').classList.remove('show');
    }
};

window.PosView = PosView;

