/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: High-Speed POS Cashier Billing Register
 * Live Cloud Synchronization with Supabase PostgreSQL & C Billing Invariants
 * ==============================================================================
 */

const PosView = {
    products: [],
    customers: [],
    cart: [],
    isInterState: false,
    invoiceDiscountBps: 0,
    hasManagerOverride: false,

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            const [prods, custs] = await Promise.all([
                window.SupabaseClient.getProducts(),
                window.SupabaseClient.getCustomers()
            ]);
            this.products = prods || [];
            this.customers = custs || [];
            this.renderLayout(container);
        } catch (err) {
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading POS catalog:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderLayout(container) {
        container.innerHTML = `
            <div class="pos-container">
                <!-- Left: Catalog & Quick Picker -->
                <div class="pos-catalog-panel">
                    <div style="display: flex; gap: 10px; margin-bottom: 14px;">
                        <input type="text" id="pos-search" class="tblr-form-control" placeholder="🔍 Search product or scan barcode (EAN-13)..." style="flex: 1;" oninput="PosView.filterCatalog(this.value)" autofocus />
                    </div>

                    <div class="pos-product-grid" id="pos-catalog-grid">
                        ${this.renderCatalogItems(this.products)}
                    </div>
                </div>

                <!-- Right: Active Bill Cart & Calculations -->
                <div class="pos-cart-panel">
                    <div class="pos-cart-header">
                        <span style="font-weight: 700; color: #fff; font-size: 15px;">Active Bill / Quotation</span>
                        <button class="tblr-btn tblr-btn-default" style="padding: 4px 10px; font-size: 11px; color: #ff6b6b;" onclick="PosView.clearCart()">
                            Clear Cart
                        </button>
                    </div>

                    <div class="pos-cart-items-wrap" id="pos-cart-items">
                        ${this.renderCartItems()}
                    </div>

                    <!-- Discount & Tax Controls -->
                    <div style="padding: 10px 14px; background: rgba(0,0,0,0.15); border-top: 1px solid var(--tblr-border-color); display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--tblr-text-secondary);">
                            <input type="checkbox" id="pos-interstate" onchange="PosView.toggleInterstate(this.checked)" ${this.isInterState ? 'checked' : ''} />
                            Inter-State (IGST 18%)
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #ff9800;">
                            <input type="checkbox" id="pos-override" onchange="PosView.toggleOverride(this.checked)" ${this.hasManagerOverride ? 'checked' : ''} />
                            Manager Override (>20%)
                        </label>
                    </div>

                    <!-- Totals Breakdown -->
                    <div class="pos-totals-box" id="pos-totals-box">
                        ${this.renderTotals()}
                    </div>

                    <!-- Checkout Button -->
                    <button class="pos-btn-checkout" id="pos-btn-pay" onclick="PosView.openCheckoutModal()" ${this.cart.length === 0 ? 'disabled' : ''}>
                        ⚡ Pay & Checkout (${this.getFormattedGrandTotal()})
                    </button>
                </div>
            </div>

            <!-- Thermal Receipt & Checkout Modal -->
            <div id="modal-pos-checkout" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 440px;">
                    <div class="tblr-modal-header">
                        <h3 class="tblr-modal-title">Complete POS Transaction</h3>
                        <button class="tblr-modal-close" onclick="PosView.closeCheckoutModal()">✕</button>
                    </div>
                    <form onsubmit="PosView.handleCheckout(event)">
                        <div class="tblr-modal-body">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">TOTAL PAYABLE</div>
                                <div style="font-size: 32px; font-weight: 800; color: #2fb344; font-family: monospace;" id="checkout-display-total">
                                    ${this.getFormattedGrandTotal()}
                                </div>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Customer</label>
                                <select id="checkout-customer" class="tblr-form-control">
                                    ${(this.customers && this.customers.length > 0)
                                        ? this.customers.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join('')
                                        : '<option value="80000000-0000-0000-0000-000000000003">Walk-in Retail Cash Customer</option>'
                                    }
                                </select>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Payment Method</label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                                    <label class="tblr-btn tblr-btn-default" style="display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
                                        <input type="radio" name="pay-method" value="CASH" checked /> Cash
                                    </label>
                                    <label class="tblr-btn tblr-btn-default" style="display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
                                        <input type="radio" name="pay-method" value="UPI" /> UPI
                                    </label>
                                    <label class="tblr-btn tblr-btn-default" style="display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
                                        <input type="radio" name="pay-method" value="CARD" /> Card
                                    </label>
                                </div>
                            </div>

                            <div class="tblr-form-group">
                                <label class="tblr-form-label">Amount Tendered (₹)</label>
                                <input type="number" step="0.01" id="checkout-tendered" class="tblr-form-control" style="font-size: 16px; font-weight: 700; font-family: monospace;" oninput="PosView.calculateChange(this.value)" />
                                <div id="checkout-change-display" style="font-size: 12px; color: #2fb344; margin-top: 4px; font-weight: 600;"></div>
                            </div>
                        </div>
                        <div class="tblr-modal-footer">
                            <button type="button" class="tblr-btn tblr-btn-default" onclick="PosView.closeCheckoutModal()">Cancel</button>
                            <button type="submit" id="btn-confirm-sale" class="tblr-btn tblr-btn-primary" style="background: #2fb344; border-color: #2fb344;">
                                ✓ Confirm & Print Receipt
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 80mm Thermal Receipt Preview Modal -->
            <div id="modal-receipt-preview" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 380px;">
                    <div class="tblr-modal-header">
                        <h3 class="tblr-modal-title">Tax Invoice Receipt</h3>
                        <button class="tblr-modal-close" onclick="PosView.closeReceiptModal()">✕</button>
                    </div>
                    <div class="tblr-modal-body" id="receipt-print-area">
                        <!-- Thermal Receipt Contents -->
                    </div>
                    <div class="tblr-modal-footer">
                        <button type="button" class="tblr-btn tblr-btn-default" onclick="PosView.closeReceiptModal()">Close</button>
                        <button type="button" class="tblr-btn tblr-btn-primary" onclick="window.print()">🖨 Print 80mm Receipt</button>
                    </div>
                </div>
            </div>
        `;

        this.updateTotals();
    },

    renderCatalogItems(items) {
        if (!items || items.length === 0) {
            return `<div style="grid-column: span 3; text-align: center; color: var(--tblr-text-muted); padding: 40px;">No products match your search.</div>`;
        }

        return items.map(p => {
            const price = (p.selling_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            return `
                <div class="pos-item-card" onclick="PosView.addToCart('${p.id}')">
                    <div style="font-size: 11px; color: var(--tblr-primary); font-weight: 700; text-transform: uppercase;">${p.category}</div>
                    <div style="font-size: 14px; font-weight: 700; color: #fff; margin: 4px 0;">${p.name}</div>
                    <div style="font-size: 11px; color: var(--tblr-text-muted); font-family: monospace;">SKU: ${p.sku}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span style="font-size: 15px; font-weight: 800; color: #2fb344; font-family: monospace;">₹${price}</span>
                        <span class="tblr-badge tblr-badge-blue">+ Add</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderCartItems() {
        if (this.cart.length === 0) {
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 180px; color: var(--tblr-text-muted);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px;">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <span>Cart is empty. Select items to bill.</span>
                </div>
            `;
        }

        return this.cart.map((item, idx) => {
            const unit = (item.unit_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const lineGross = (item.quantity * item.unit_price) / 100;
            return `
                <div class="pos-cart-line">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: #fff; font-size: 13px;">${item.name}</div>
                        <div style="font-size: 11px; color: var(--tblr-text-muted); font-family: monospace;">₹${unit} each</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button class="tblr-btn tblr-btn-default" style="padding: 2px 7px; font-size: 12px;" onclick="PosView.updateQty(${idx}, -1)">-</button>
                        <span style="font-weight: 700; font-family: monospace; width: 22px; text-align: center; color: #fff;">${item.quantity}</span>
                        <button class="tblr-btn tblr-btn-default" style="padding: 2px 7px; font-size: 12px;" onclick="PosView.updateQty(${idx}, 1)">+</button>
                    </div>
                    <div style="width: 80px; text-align: right; font-weight: 700; font-family: monospace; color: #fff;">
                        ₹${lineGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <button style="background: none; border: none; color: #ff6b6b; cursor: pointer; padding: 4px;" onclick="PosView.removeFromCart(${idx})">✕</button>
                </div>
            `;
        }).join('');
    },

    addToCart(productId) {
        const prod = this.products.find(p => p.id === productId);
        if (!prod) return;

        const existing = this.cart.find(c => c.product_id === productId);
        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({
                product_id: prod.id,
                sku: prod.sku,
                name: prod.name,
                unit_price: prod.selling_price,
                tax_rate_bps: prod.tax_rate_bps || 1800,
                discount_bps: 0,
                quantity: 1
            });
        }

        this.refreshCartUI();
    },

    updateQty(index, delta) {
        if (!this.cart[index]) return;
        this.cart[index].quantity += delta;
        if (this.cart[index].quantity <= 0) {
            this.cart.splice(index, 1);
        }
        this.refreshCartUI();
    },

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.refreshCartUI();
    },

    clearCart() {
        this.cart = [];
        this.refreshCartUI();
    },

    refreshCartUI() {
        const el = document.getElementById('pos-cart-items');
        if (el) el.innerHTML = this.renderCartItems();
        this.updateTotals();
    },

    filterCatalog(q) {
        const query = (q || '').toLowerCase().trim();
        const filtered = this.products.filter(p => 
            p.sku.toLowerCase().includes(query) || 
            p.name.toLowerCase().includes(query) || 
            (p.barcode && p.barcode.includes(query))
        );
        const grid = document.getElementById('pos-catalog-grid');
        if (grid) grid.innerHTML = this.renderCatalogItems(filtered);
    },

    toggleInterstate(checked) {
        this.isInterState = checked;
        this.updateTotals();
    },

    toggleOverride(checked) {
        this.hasManagerOverride = checked;
        this.updateTotals();
    },

    calculateQuotation() {
        let subtotal = 0;
        let taxable = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        for (const item of this.cart) {
            const gross = item.quantity * item.unit_price;
            subtotal += gross;

            const taxRate = item.tax_rate_bps || 1800;
            const lineTax = Math.round((gross * taxRate) / 10000);

            if (this.isInterState) {
                igst += lineTax;
            } else {
                const c = Math.round(lineTax / 2);
                cgst += c;
                sgst += (lineTax - c);
            }

            taxable += gross;
        }

        const totalTax = cgst + sgst + igst;
        const exact = taxable + totalTax;
        const rounded = Math.round(exact / 100) * 100;
        const roundOff = rounded - exact;

        return {
            subtotal,
            taxable_amount: taxable,
            cgst_amount: cgst,
            sgst_amount: sgst,
            igst_amount: igst,
            tax_total: totalTax,
            round_off: roundOff,
            grand_total: rounded
        };
    },

    updateTotals() {
        const totalsEl = document.getElementById('pos-totals-box');
        if (totalsEl) totalsEl.innerHTML = this.renderTotals();

        const btn = document.getElementById('pos-btn-pay');
        if (btn) {
            btn.disabled = this.cart.length === 0;
            btn.innerText = `⚡ Pay & Checkout (${this.getFormattedGrandTotal()})`;
        }
    },

    renderTotals() {
        const q = this.calculateQuotation();
        const sub = (q.subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const tax = (q.tax_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const grand = (q.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

        return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span style="color: var(--tblr-text-muted);">Taxable Subtotal</span>
                <span style="font-family: monospace; color: #fff;">₹${sub}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span style="color: var(--tblr-text-muted);">${this.isInterState ? 'IGST (18%)' : 'CGST (9%) + SGST (9%)'}</span>
                <span style="font-family: monospace; color: #fff;">₹${tax}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--tblr-border-color); font-size: 16px; font-weight: 800;">
                <span style="color: #fff;">Net Total</span>
                <span style="font-family: monospace; color: #2fb344;">₹${grand}</span>
            </div>
        `;
    },

    getFormattedGrandTotal() {
        const q = this.calculateQuotation();
        return `₹${(q.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    },

    openCheckoutModal() {
        if (this.cart.length === 0) return;
        const q = this.calculateQuotation();
        const modal = document.getElementById('modal-pos-checkout');
        const disp = document.getElementById('checkout-display-total');
        const tender = document.getElementById('checkout-tendered');

        if (disp) disp.innerText = `₹${(q.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        if (tender) tender.value = (q.grand_total / 100).toFixed(2);
        this.calculateChange((q.grand_total / 100).toFixed(2));

        if (modal) modal.style.display = 'flex';
    },

    closeCheckoutModal() {
        const modal = document.getElementById('modal-pos-checkout');
        if (modal) modal.style.display = 'none';
    },

    calculateChange(tenderedVal) {
        const q = this.calculateQuotation();
        const tendered = parseFloat(tenderedVal || '0') * 100;
        const change = tendered - q.grand_total;
        const changeEl = document.getElementById('checkout-change-display');
        if (!changeEl) return;

        if (change >= 0) {
            changeEl.style.color = '#2fb344';
            changeEl.innerText = `Change Due: ₹${(change / 100).toFixed(2)}`;
        } else {
            changeEl.style.color = '#ff6b6b';
            changeEl.innerText = `Balance Short: ₹${(Math.abs(change) / 100).toFixed(2)}`;
        }
    },

    async handleCheckout(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-confirm-sale');
        if (btn) { btn.disabled = true; btn.innerText = 'Synchronizing with Cloud...'; }

        const q = this.calculateQuotation();
        const custId = document.getElementById('checkout-customer')?.value;

        try {
            const invoice = await window.SupabaseClient.checkoutSale({
                customer_id: custId,
                warehouse_id: "20000000-0000-0000-0000-000000000001",
                items: this.cart,
                subtotal: q.subtotal,
                tax_total: q.tax_total,
                cgst_amount: q.cgst_amount,
                sgst_amount: q.sgst_amount,
                igst_amount: q.igst_amount,
                round_off: q.round_off,
                grand_total: q.grand_total
            });

            this.closeCheckoutModal();
            App.showToast(`Invoice ${invoice.invoice_number} recorded in Supabase!`, 'success');
            this.showReceipt(invoice, q);
            this.clearCart();
        } catch (err) {
            App.showToast(`Checkout failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = '✓ Confirm & Print Receipt'; }
        }
    },

    showReceipt(inv, q) {
        const area = document.getElementById('receipt-print-area');
        if (!area) return;

        area.innerHTML = `
            <div style="font-family: monospace; font-size: 12px; line-height: 1.4; color: #111; background: #fff; padding: 16px; border: 1px dashed #ccc;">
                <div style="text-align: center; font-weight: bold; font-size: 15px;">APEX GLOBAL ENTERPRISES</div>
                <div style="text-align: center; font-size: 11px;">Bandra Kurla Complex, Mumbai - 400051</div>
                <div style="text-align: center; font-size: 11px;">GSTIN: 27AABCU9603R1ZM</div>
                <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
                <div>INVOICE: ${inv.invoice_number}</div>
                <div>DATE: ${inv.invoice_date}</div>
                <div>CASHIER: Naresh S</div>
                <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
                ${this.cart.map(item => `
                    <div style="display: flex; justify-content: space-between;">
                        <span>${item.name} x${item.quantity}</span>
                        <span>₹${((item.quantity * item.unit_price) / 100).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
                <div style="display: flex; justify-content: space-between;">
                    <span>SUBTOTAL:</span><span>₹${(q.subtotal / 100).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>GST TAX:</span><span>₹${(q.tax_total / 100).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 4px;">
                    <span>GRAND TOTAL:</span><span>₹${(q.grand_total / 100).toFixed(2)}</span>
                </div>
                <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
                <div style="text-align: center; font-size: 10px; margin-top: 8px;">THANK YOU FOR YOUR BUSINESS!</div>
            </div>
        `;

        const m = document.getElementById('modal-receipt-preview');
        if (m) m.style.display = 'flex';
    },

    closeReceiptModal() {
        const m = document.getElementById('modal-receipt-preview');
        if (m) m.style.display = 'none';
    }
};

window.PosView = PosView;
