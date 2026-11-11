/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise High-Speed POS Billing Register (MAX GOD-TIER)
 * - Dual-Screen & Pop-Out Customer Facing Pole Display with BroadcastChannel
 * - Multi-Payment Split Tender (Cash + UPI + Card + Credit Ledger)
 * - Instant Currency Denominations Calculator & High-Contrast Change Return
 * - Multi-Cart Park & Recall (Held Orders Drawer & Hold Tickets)
 * - Dynamic Customer Loyalty Points & Institutional Tier Concessions
 * - Intelligent Promo Code Engine (SIMATS10, FACULTY15, STUDENT5, FESTIVE100, BULK20)
 * - Decimal Loose Weight / Scale Quantity Mode (KG/Grams)
 * - Thermal Receipt Suite (80mm, 58mm, A4 GST Tax Invoice, WhatsApp Dispatch)
 * - Polyphonic Web Audio Sound Effects & Keyboard Shortcuts Master Hub
 * - 100% Real-Time Cloud Synchronization with Supabase PostgreSQL 17
 * ==============================================================================
 */

const PosView = {
    products: [],
    customers: [],
    cart: [],
    isInterState: false,
    hasManagerOverride: false,
    activeCategory: 'ALL',
    currentCustomer: {
        id: "80000000-0000-0000-0000-000000000003",
        name: "Walk-in Retail Cash Customer",
        phone: "",
        tier: "Retail Regular",
        loyalty_points: 0,
        is_verified: false
    },
    activeCounter: null,
    lastInvoice: null,
    activePromo: null,
    promoDiscountBps: 0,
    redeemedPoints: 0,
    checkoutMode: 'SINGLE', // 'SINGLE' | 'SPLIT'
    splitTender: {
        cash: 0,
        upi: 0,
        card: 0,
        credit: 0
    },
    activeReceiptFormat: '80mm', // '80mm' | '58mm' | 'A4'
    isExpressMode: false,

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 380px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 14px;">
                    <div style="width: 36px; height: 36px; border: 2.5px solid #27272a; border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <span style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Initializing high-speed POS terminal & real-time catalog...</span>
                </div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            const [prods, custs] = await Promise.all([
                window.SupabaseClient.getProducts(),
                window.SupabaseClient.getCustomers()
            ]);
            this.products = prods || [];
            this.customers = custs || [];
            this.activeCounter = window.StoreConfig ? window.StoreConfig.getActiveCounter() : { id: 'CTR-01', name: 'Counter 01 - Front Desk', code: 'CTR-01' };
            this.renderLayout(container);
            this.syncCustomerDisplay();
        } catch (err) {
            container.innerHTML = `
                <div class="shadcn-card" style="border-color: #ef4444; color: #ef4444; padding: 24px;">
                    <h3 style="margin: 0 0 8px 0; color: #fff;">Error loading POS catalog</h3>
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">${err.message}</p>
                    <button class="shadcn-btn-primary" onclick="PosView.render(document.getElementById('main-content'))">Retry Cloud Connection</button>
                </div>
            `;
        }
    },

    renderLayout(container) {
        const categories = ['ALL', ...new Set(this.products.map(p => p.category || 'General'))];
        const storeProfile = window.StoreConfig ? window.StoreConfig.getProfile() : { shop_name: 'SSE Enterprise Hub' };
        const counters = window.StoreConfig ? window.StoreConfig.getCounters() : [];
        const heldOrders = window.SupabaseClient ? window.SupabaseClient.getHeldOrders() : [];

        container.innerHTML = `
            <!-- Top POS Station Control Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px 18px; background: #121215; border: 1px solid #222226; border-radius: 8px; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 34px; height: 34px; border-radius: 6px; background: #22c55e; color: #09090b; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <div>
                        <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${storeProfile.shop_name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">
                            GSTIN: <span style="font-family: monospace; color: #a1a1aa;">${storeProfile.gstin}</span> • POS Terminal
                        </div>
                    </div>
                </div>

                <!-- Station Controls & Customer Display Launcher -->
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <!-- Counter Switcher -->
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Station:</span>
                        <select id="pos-counter-select" class="shadcn-select" style="width: 190px; height: 32px; font-size: 12px; font-weight: 600;" onchange="PosView.switchCounter(this.value)">
                            ${counters.map(c => `
                                <option value="${c.id}" ${c.id === this.activeCounter.id ? 'selected' : ''}>
                                    ${c.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Customer Display Button (Dual-Screen) -->
                    <button class="pos-cust-disp-indicator online" id="btn-cust-display" onclick="PosView.openCustomerDisplay()" title="Launch Dual-Screen Customer Facing Display">
                        <span class="pos-cust-disp-dot"></span>
                        <span>Customer Screen [F10]</span>
                    </button>

                    <!-- In-App Mirror Preview Button -->
                    <button class="shadcn-btn-secondary" style="height: 32px; padding: 0 10px; font-size: 12px;" onclick="PosHardware.showInAppCustomerMirror()" title="Preview what the customer sees on single monitor">
                        Mirror Preview
                    </button>

                    <!-- Parked Orders Drawer Toggle -->
                    <button class="shadcn-btn-secondary" style="height: 32px; padding: 0 10px; font-size: 12px; position: relative;" onclick="PosView.openHeldOrdersModal()" title="View Held / Parked Carts">
                        Parked Carts
                        <span id="pos-held-count-badge" class="shadcn-badge blue" style="margin-left: 4px; padding: 1px 6px; font-size: 10px;">${heldOrders.length}</span>
                    </button>

                    <!-- Hardware Peripherals -->
                    <button class="shadcn-btn-secondary" style="height: 32px; padding: 0 10px; font-size: 12px;" onclick="PosHardware.showHardwareModal()" title="Configure Printer, Cash Drawer & Scanner">
                        Hardware
                    </button>

                    <!-- Store Profile Details -->
                    <button class="shadcn-btn-secondary" style="height: 32px; padding: 0 10px; font-size: 12px;" onclick="App.openStoreProfileModal()" title="Configure Shop Name, Address, GSTIN, UPI on Bill">
                        Store Profile
                    </button>
                </div>
            </div>

            <!-- Main POS Split Workspace -->
            <div class="pos-container">
                <!-- Left Column: Catalog & Barcode Scanner Panel -->
                <div class="pos-catalog-panel">
                    <!-- High-Speed Barcode & Search Bar -->
                    <div style="display: grid; grid-template-columns: 1fr 180px 100px; gap: 8px;">
                        <div style="position: relative;">
                            <input type="text" id="pos-barcode-scanner" class="shadcn-input" placeholder="Scan Barcode (EAN-13) or SKU & press Enter... [F2]" style="height: 42px; font-size: 13px; padding-left: 36px; border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.15);" onkeydown="PosView.handleBarcodeKeydown(event)" autofocus />
                            <svg style="position: absolute; left: 12px; top: 13px; color: #3b82f6;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"/>
                            </svg>
                        </div>
                        <input type="text" id="pos-search" class="shadcn-input" placeholder="Filter items..." style="height: 42px;" oninput="PosView.filterCatalog(this.value)" />
                        <button class="shadcn-btn-secondary" style="height: 42px; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="PosView.openLooseWeightModal()" title="Add custom weight/grams item">
                            Weight Scale
                        </button>
                    </div>

                    <!-- Category Filter Tabs -->
                    <div class="pos-category-pills" style="margin-top: 10px;">
                        ${categories.map(cat => `
                            <button class="pos-pill ${this.activeCategory === cat ? 'active' : ''}" onclick="PosView.setCategory('${cat}')">
                                ${cat}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Product Grid -->
                    <div class="pos-product-grid" id="pos-catalog-grid">
                        ${this.renderCatalogItems(this.getFilteredProducts())}
                    </div>
                </div>

                <!-- Right Column: Active Bill, Customer Loyalty, Discounts & Checkout -->
                <div class="pos-cart-panel" style="display: flex; flex-direction: column;">
                    <!-- Customer Details & Loyalty Header -->
                    <div style="padding: 12px 16px; background: #16161b; border-bottom: 1px solid #222226;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 11px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Customer & Loyalty</span>
                            <span id="cust-sync-badge" class="pos-tier-pill ${this.currentCustomer.phone ? 'simats' : 'retail'}">
                                ${this.currentCustomer.tier || 'Retail Regular'}
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: 130px 1fr; gap: 8px;">
                            <div>
                                <input type="tel" id="pos-cust-phone" class="shadcn-input" placeholder="Mobile No. [F3]" style="height: 32px; font-size: 12px; font-family: monospace;" value="${this.currentCustomer.phone || ''}" oninput="PosView.handlePhoneLookup(this.value)" />
                            </div>
                            <div>
                                <input type="text" id="pos-cust-name" class="shadcn-input" placeholder="Customer Name" style="height: 32px; font-size: 12px;" value="${this.currentCustomer.name || 'Walk-in Retail Cash Customer'}" onchange="PosView.updateCustomerName(this.value)" />
                            </div>
                        </div>

                        <!-- Customer Loyalty & History Bar -->
                        <div id="cust-phone-feedback" style="font-size: 11px; color: var(--text-muted); margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <span id="cust-loyalty-text">Points: ${this.currentCustomer.loyalty_points || 0} pts</span>
                            <div style="display: flex; gap: 6px;">
                                ${(this.currentCustomer.loyalty_points > 0 && this.redeemedPoints === 0) ? `
                                    <button class="shadcn-btn-secondary" style="padding: 1px 6px; font-size: 10px; color: #4ade80;" onclick="PosView.redeemLoyaltyPoints()">
                                        Redeem ${this.currentCustomer.loyalty_points} pts (-₹${this.currentCustomer.loyalty_points})
                                    </button>
                                ` : (this.redeemedPoints > 0 ? `
                                    <span style="color: #4ade80; font-size: 10px; font-weight: 700;">Points Applied (-₹${this.redeemedPoints})</span>
                                ` : '')}
                                <button class="shadcn-btn-secondary" style="padding: 1px 6px; font-size: 10px;" onclick="PosView.openCustomerHistoryModal()" title="View purchase history">
                                    History
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Promo Code & Instant Voucher Bar -->
                    <div style="padding: 8px 14px; background: #111114; border-bottom: 1px solid #1f1f24; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                            <input type="text" id="pos-promo-input" class="shadcn-input" placeholder="Coupon (e.g. SIMATS10) [F4]" style="height: 28px; font-size: 11px; text-transform: uppercase; font-family: monospace; width: 140px;" onkeydown="if(event.key==='Enter') PosView.applyPromoCode(this.value)" />
                            <button class="shadcn-btn-secondary" style="height: 28px; padding: 0 8px; font-size: 11px;" onclick="PosView.applyPromoCode(document.getElementById('pos-promo-input').value)">
                                Apply
                            </button>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <span class="pos-promo-chip" onclick="PosView.applyPromoCode('SIMATS10')" title="10% SIMATS Educational Discount">SIMATS10</span>
                            <span class="pos-promo-chip" onclick="PosView.applyPromoCode('STUDENT5')" title="5% Student Concession">STUDENT5</span>
                            <span class="pos-promo-chip" onclick="PosView.applyPromoCode('FESTIVE100')" title="Flat ₹100 Off">SAVE100</span>
                        </div>
                    </div>

                    <!-- Active Bill Cart Items Header -->
                    <div class="pos-cart-header" style="padding: 8px 16px; background: #141418; border-bottom: 1px solid #1f1f24; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #fff; font-size: 12px;">Active Cart (${this.cart.reduce((s, i) => s + (Number(i.quantity) || 1), 0)} items)</span>
                        <div style="display: flex; gap: 6px;">
                            <button class="shadcn-btn-secondary" style="padding: 2px 8px; font-size: 11px; color: #60a5fa;" onclick="PosView.parkCurrentCart()" title="Park/Hold this cart for later [F7]">
                                Park [F7]
                            </button>
                            <button class="shadcn-btn-secondary" style="padding: 2px 8px; font-size: 11px; color: #ef4444;" onclick="PosView.clearCart()" title="Clear register [Esc]">
                                Clear
                            </button>
                        </div>
                    </div>

                    <!-- Cart Items List Container -->
                    <div class="pos-cart-items-wrap" id="pos-cart-items" style="flex: 1; max-height: calc(100vh - 440px); overflow-y: auto;">
                        ${this.renderCartItems()}
                    </div>

                    <!-- Tax & GST Invariants Toggles -->
                    <div style="padding: 6px 14px; background: #121215; border-top: 1px solid #1f1f24; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-secondary);">
                            <input type="checkbox" id="pos-interstate" onchange="PosView.toggleInterstate(this.checked)" ${this.isInterState ? 'checked' : ''} />
                            Inter-State (IGST 18%)
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--accent-amber);">
                            <input type="checkbox" id="pos-override" onchange="PosView.toggleOverride(this.checked)" ${this.hasManagerOverride ? 'checked' : ''} />
                            Manager Override (>20%)
                        </label>
                    </div>

                    <!-- Totals Breakdown -->
                    <div class="pos-totals-box" id="pos-totals-box">
                        ${this.renderTotals()}
                    </div>

                    <!-- Multi-Action Checkout Grid -->
                    <div style="padding: 10px 14px; background: #0e0e12; border-top: 1px solid #1f1f24; display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px;">
                        <button class="pos-btn-checkout" id="pos-btn-quick-cash" onclick="PosView.quickCashCheckout()" ${this.cart.length === 0 ? 'disabled' : ''} style="background: #22c55e; color: #09090b; border-color: #22c55e; font-weight: 800; font-size: 13px;" title="1-Click Instant Cash Settle (F9)">
                            Fast Cash (${this.getFormattedGrandTotal()}) [F9]
                        </button>
                        <button class="pos-btn-checkout" id="pos-btn-pay" onclick="PosView.openCheckoutModal()" ${this.cart.length === 0 ? 'disabled' : ''} style="background: #2563eb; color: #ffffff; border-color: #2563eb; font-size: 12px; font-weight: 700;" title="Split Pay / Custom Tender / UPI / Card (F8)">
                            Split / Pay [F8]
                        </button>
                    </div>
                </div>
            </div>

            <!-- Floating Keyboard Shortcuts Footer Strip -->
            <div class="pos-shortcuts-strip">
                <div><span class="pos-key-badge">F2</span>Focus Scan</div>
                <div><span class="pos-key-badge">F3</span>Cust Phone</div>
                <div><span class="pos-key-badge">F4</span>Coupon</div>
                <div><span class="pos-key-badge">F7</span>Park Cart</div>
                <div><span class="pos-key-badge">F8</span>Split Tender</div>
                <div><span class="pos-key-badge">F9</span>Fast Cash</div>
                <div><span class="pos-key-badge">F10</span>Customer Screen</div>
                <div><span class="pos-key-badge">Esc</span>Clear Cart</div>
            </div>

            <!-- MODAL 1: ADVANCED MULTI-PAYMENT TENDER & SPLIT CHECKOUT DIALOG -->
            <div id="modal-pos-checkout" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 520px; background: #101014; border-color: #272730;">
                    <div class="shadcn-modal-header" style="border-bottom: 1px solid #1f1f24;">
                        <div>
                            <h3 class="shadcn-modal-title">Settle Bill & Finalize Sale</h3>
                            <div style="font-size: 11px; color: var(--text-muted);" id="checkout-station-label">
                                Terminal: ${this.activeCounter.name} • Cashier: ${window.SupabaseClient.getCurrentUser()?.full_name || 'Cashier'}
                            </div>
                        </div>
                        <button class="shadcn-modal-close" onclick="PosView.closeCheckoutModal()">&times;</button>
                    </div>
                    <form onsubmit="PosView.handleCheckout(event)">
                        <div class="shadcn-modal-body" style="padding: 16px 20px;">
                            <!-- Big Display Total -->
                            <div style="text-align: center; margin-bottom: 14px; background: #16161c; padding: 14px; border-radius: 8px; border: 1px solid #222228;">
                                <div style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">NET AMOUNT DUE</div>
                                <div style="font-size: 34px; font-weight: 900; color: #22c55e; font-family: var(--font-mono);" id="checkout-display-total">
                                    ${this.getFormattedGrandTotal()}
                                </div>
                                <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">
                                    Billed to: <strong id="checkout-billed-to" style="color: #ffffff;">${this.currentCustomer.name}</strong>
                                </div>
                            </div>

                            <!-- Single vs Split Tender Tab Switcher -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                                <button type="button" class="shadcn-btn-secondary ${this.checkoutMode === 'SINGLE' ? 'active' : ''}" style="${this.checkoutMode === 'SINGLE' ? 'background: #2563eb; color: #fff; border-color: #2563eb;' : ''}" onclick="PosView.setCheckoutMode('SINGLE')">
                                    Single Tender Mode
                                </button>
                                <button type="button" class="shadcn-btn-secondary ${this.checkoutMode === 'SPLIT' ? 'active' : ''}" style="${this.checkoutMode === 'SPLIT' ? 'background: #2563eb; color: #fff; border-color: #2563eb;' : ''}" onclick="PosView.setCheckoutMode('SPLIT')">
                                    Multi-Payment Split Tender
                                </button>
                            </div>

                            <!-- MODE A: SINGLE TENDER -->
                            <div id="checkout-mode-single" style="display: ${this.checkoutMode === 'SINGLE' ? 'block' : 'none'};">
                                <div style="margin-bottom: 14px;">
                                    <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; display: block; font-weight: 600;">Payment Tender Method</label>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px;">
                                        <label class="shadcn-btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; padding: 6px; font-size: 11px;">
                                            <input type="radio" name="pay-method" value="CASH" checked onchange="PosView.setPaymentMethod('CASH')" /> Cash
                                        </label>
                                        <label class="shadcn-btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; padding: 6px; font-size: 11px;">
                                            <input type="radio" name="pay-method" value="UPI" onchange="PosView.setPaymentMethod('UPI')" /> UPI / QR
                                        </label>
                                        <label class="shadcn-btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; padding: 6px; font-size: 11px;">
                                            <input type="radio" name="pay-method" value="CARD" onchange="PosView.setPaymentMethod('CARD')" /> Card EDC
                                        </label>
                                        <label class="shadcn-btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; padding: 6px; font-size: 11px;">
                                            <input type="radio" name="pay-method" value="CREDIT" onchange="PosView.setPaymentMethod('CREDIT')" /> Ledger
                                        </label>
                                    </div>
                                </div>

                                <!-- Dynamic UPI QR Box -->
                                <div id="checkout-upi-box" style="display: none;"></div>

                                <!-- Cash Tender & Denominations Pad -->
                                <div id="checkout-tender-group">
                                    <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; display: block; font-weight: 600;">Amount Tendered by Customer (INR)</label>
                                    <input type="number" step="0.01" id="checkout-tendered" class="shadcn-input" style="font-size: 18px; font-weight: 800; font-family: var(--font-mono); height: 42px;" oninput="PosView.calculateChange(this.value)" />
                                    
                                    <!-- Denominations Fast Pad -->
                                    <div class="pos-denom-grid">
                                        <button type="button" class="pos-denom-btn exact" onclick="PosView.setExactTender()">Exact Total</button>
                                        <button type="button" class="pos-denom-btn" onclick="PosView.addDenomination(50)">+₹50</button>
                                        <button type="button" class="pos-denom-btn" onclick="PosView.addDenomination(100)">+₹100</button>
                                        <button type="button" class="pos-denom-btn" onclick="PosView.setTenderAmount(100)">₹100</button>
                                        <button type="button" class="pos-denom-btn" onclick="PosView.setTenderAmount(200)">₹200</button>
                                        <button type="button" class="pos-denom-btn" onclick="PosView.setTenderAmount(500)">₹500</button>
                                        <button type="button" class="pos-denom-btn" onclick="PosView.setTenderAmount(2000)">₹2000</button>
                                    </div>

                                    <div id="checkout-change-display" style="font-size: 13px; color: #22c55e; margin-top: 8px; font-weight: 700; padding: 6px 10px; background: #16161c; border-radius: 6px; text-align: center;"></div>
                                </div>
                            </div>

                            <!-- MODE B: MULTI-PAYMENT SPLIT TENDER -->
                            <div id="checkout-mode-split" style="display: ${this.checkoutMode === 'SPLIT' ? 'block' : 'none'};">
                                <div class="pos-split-container">
                                    <div class="pos-split-row">
                                        <span class="pos-split-badge">Cash</span>
                                        <input type="number" step="0.01" id="split-cash" class="shadcn-input pos-split-input" placeholder="0.00" oninput="PosView.recalcSplitTender()" />
                                        <button type="button" class="pos-split-fill-btn" onclick="PosView.fillSplitRemaining('cash')">Fill Rest</button>
                                    </div>
                                    <div class="pos-split-row">
                                        <span class="pos-split-badge">UPI / QR</span>
                                        <input type="number" step="0.01" id="split-upi" class="shadcn-input pos-split-input" placeholder="0.00" oninput="PosView.recalcSplitTender()" />
                                        <button type="button" class="pos-split-fill-btn" onclick="PosView.fillSplitRemaining('upi')">Fill Rest</button>
                                    </div>
                                    <div class="pos-split-row">
                                        <span class="pos-split-badge">Card</span>
                                        <input type="number" step="0.01" id="split-card" class="shadcn-input pos-split-input" placeholder="0.00" oninput="PosView.recalcSplitTender()" />
                                        <button type="button" class="pos-split-fill-btn" onclick="PosView.fillSplitRemaining('card')">Fill Rest</button>
                                    </div>
                                    <div class="pos-split-row">
                                        <span class="pos-split-badge">Credit Ledger</span>
                                        <input type="number" step="0.01" id="split-credit" class="shadcn-input pos-split-input" placeholder="0.00" oninput="PosView.recalcSplitTender()" />
                                        <button type="button" class="pos-split-fill-btn" onclick="PosView.fillSplitRemaining('credit')">Fill Rest</button>
                                    </div>

                                    <!-- Split Status Summary -->
                                    <div style="border-top: 1px solid #272730; padding-top: 8px; margin-top: 4px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                                        <span style="color: #a1a1aa;">Remaining to Settle:</span>
                                        <span id="split-remaining-val" style="font-family: monospace; color: #ef4444;">₹0.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="shadcn-modal-footer" style="border-top: 1px solid #1f1f24; display: flex; justify-content: space-between;">
                            <button type="button" class="shadcn-btn-secondary" onclick="PosView.closeCheckoutModal()">Cancel</button>
                            <button type="submit" id="btn-confirm-sale" class="shadcn-btn-primary" style="background: #22c55e; color: #09090b; border-color: #22c55e; font-weight: 800;">
                                Finalize Bill & Print [Enter]
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL 2: THERMAL RECEIPT & PRINT SUITE -->
            <div id="modal-pos-receipt" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 500px; background: #0c0c10;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title">Tax Invoice Generated</h3>
                            <div style="font-size: 11px; color: var(--text-muted);">Unique Sequential Bill Number Assigned</div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button class="shadcn-btn-secondary ${this.activeReceiptFormat === '80mm' ? 'active' : ''}" style="height: 28px; padding: 0 8px; font-size: 11px;" onclick="PosView.setReceiptFormat('80mm')">80mm</button>
                            <button class="shadcn-btn-secondary ${this.activeReceiptFormat === '58mm' ? 'active' : ''}" style="height: 28px; padding: 0 8px; font-size: 11px;" onclick="PosView.setReceiptFormat('58mm')">58mm</button>
                            <button class="shadcn-btn-secondary ${this.activeReceiptFormat === 'A4' ? 'active' : ''}" style="height: 28px; padding: 0 8px; font-size: 11px;" onclick="PosView.setReceiptFormat('A4')">A4 GST</button>
                            <button class="shadcn-modal-close" onclick="PosView.closeReceiptModal()">&times;</button>
                        </div>
                    </div>
                    <div class="shadcn-modal-body" style="padding: 14px; background: #000000; overflow-x: auto; max-height: 480px;">
                        <div id="receipt-print-area">
                            <!-- Thermal Receipt Rendered Here -->
                        </div>
                    </div>
                    <div class="shadcn-modal-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div style="display: flex; gap: 6px;">
                            <button type="button" class="shadcn-btn-secondary" style="color: #22c55e;" onclick="PosView.shareWhatsAppReceipt()">
                                WhatsApp Bill
                            </button>
                            <button type="button" class="shadcn-btn-secondary" onclick="PosView.downloadThermalSlip()">
                                Download Slip
                            </button>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="PosView.closeReceiptModal()">
                                New Bill [Esc]
                            </button>
                            <button type="button" class="shadcn-btn-primary" onclick="PosView.printReceipt()">
                                Print Thermal (80mm)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL 3: PARKED / HELD CARTS MANAGER (MULTI-CART NETWORK) -->
            <div id="modal-pos-held-orders" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 540px; background: #121217;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title">Parked & Held Orders</h3>
                            <div style="font-size: 11px; color: var(--text-muted);">Multi-cart queue for high-volume customer flow</div>
                        </div>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-pos-held-orders').style.display='none'">&times;</button>
                    </div>
                    <div class="shadcn-modal-body" style="padding: 16px;">
                        <div id="pos-held-orders-container" class="pos-held-list">
                            <!-- Held cards dynamically injected -->
                        </div>
                    </div>
                    <div class="shadcn-modal-footer">
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-pos-held-orders').style.display='none'">
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <!-- MODAL 4: DECIMAL LOOSE WEIGHT / SCALE QUANTITY CALCULATOR -->
            <div id="modal-loose-weight" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 400px; background: #121217;">
                    <div class="shadcn-modal-header">
                        <h3 class="shadcn-modal-title">Weighing Scale & Loose Qty</h3>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-loose-weight').style.display='none'">&times;</button>
                    </div>
                    <div class="shadcn-modal-body" style="padding: 16px;">
                        <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Select Product</label>
                        <select id="weight-product-select" class="shadcn-select" style="margin-bottom: 12px;" onchange="PosView.updateWeightCalculation()">
                            ${this.products.map(p => `
                                <option value="${p.id}" data-price="${p.selling_price}">${p.name} (₹${(p.selling_price / 100).toFixed(2)} / ${p.base_uom || 'KG'})</option>
                            `).join('')}
                        </select>

                        <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Measured Weight / Quantity (e.g. 1.250)</label>
                        <div style="display: grid; grid-template-columns: 1fr 80px; gap: 8px; margin-bottom: 12px;">
                            <input type="number" step="0.001" id="weight-qty-input" class="shadcn-input" value="1.000" style="font-size: 16px; font-weight: 700; font-family: monospace;" oninput="PosView.updateWeightCalculation()" />
                            <select id="weight-unit-select" class="shadcn-select" onchange="PosView.updateWeightCalculation()">
                                <option value="KG">KG</option>
                                <option value="G">Grams</option>
                                <option value="L">Liters</option>
                                <option value="PCS">PCS</option>
                            </select>
                        </div>

                        <div style="background: #181820; border: 1px solid #272732; border-radius: 8px; padding: 12px; text-align: center;">
                            <div style="font-size: 11px; color: var(--text-muted);">Calculated Line Amount</div>
                            <div id="weight-calc-amount" style="font-size: 26px; font-weight: 800; color: #22c55e; font-family: monospace; margin-top: 4px;">₹0.00</div>
                        </div>
                    </div>
                    <div class="shadcn-modal-footer">
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-loose-weight').style.display='none'">Cancel</button>
                        <button type="button" class="shadcn-btn-primary" onclick="PosView.addWeighedItemToCart()">Add to Active Cart</button>
                    </div>
                </div>
            </div>

            <!-- MODAL 5: CUSTOMER PURCHASE HISTORY DRAWER -->
            <div id="modal-customer-history" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 560px; background: #121217;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title" id="cust-history-modal-title">Customer History</h3>
                            <div style="font-size: 11px; color: var(--text-muted);">Past invoices, purchases and credit ledger</div>
                        </div>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-customer-history').style.display='none'">&times;</button>
                    </div>
                    <div class="shadcn-modal-body" style="padding: 16px;" id="cust-history-list">
                        <!-- History injected dynamically -->
                    </div>
                    <div class="shadcn-modal-footer">
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-customer-history').style.display='none'">Close</button>
                    </div>
                </div>
            </div>

            <!-- MODAL 6: MULTI-COUNTER MANAGEMENT -->
            <div id="modal-manage-counters" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 480px; background: #121217;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title">Multi-Counter Station Network</h3>
                            <div style="font-size: 11px; color: var(--text-muted);">Assign dedicated POS counters across retail hubs</div>
                        </div>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-manage-counters').style.display='none'">&times;</button>
                    </div>
                    <div class="shadcn-modal-body" style="padding: 16px;">
                        <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: block;">Registered Stations</label>
                        <div id="counter-list-items" style="display: flex; flex-direction: column; gap: 8px;">
                            ${counters.map(c => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #18181c; border: 1px solid #222226; border-radius: 6px;">
                                    <div>
                                        <div style="font-weight: 700; color: #ffffff; font-size: 13px;">${c.name}</div>
                                        <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">CODE: ${c.code}</div>
                                    </div>
                                    <span class="shadcn-badge ${c.id === this.activeCounter.id ? 'green' : 'default'}">
                                        ${c.id === this.activeCounter.id ? 'CURRENT' : 'ONLINE'}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                        <div style="padding-top: 14px; border-top: 1px solid #222226; margin-top: 14px;">
                            <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: block;">+ Add New Counter Station</label>
                            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;">
                                <input type="text" id="new-counter-name" class="shadcn-input" placeholder="e.g. Counter 05 - Lab Supply" />
                                <button type="button" class="shadcn-btn-primary" onclick="PosView.addNewCounter()">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="shadcn-modal-footer">
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-manage-counters').style.display='none'">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.updateTotals();
        this.setupKeyboardShortcuts();

        setTimeout(() => {
            document.getElementById('pos-barcode-scanner')?.focus();
        }, 80);
    },

    // --------------------------------------------------------------------------
    // POLYPHONIC AUDIO SYNTHESIZER
    // --------------------------------------------------------------------------
    playSound(type = 'scan') {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;

            if (type === 'scan') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.07);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.07);
            } else if (type === 'success') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + (i * 0.08));
                    gain.gain.setValueAtTime(0.2, now + (i * 0.08));
                    gain.gain.linearRampToValueAtTime(0.01, now + (i * 0.08) + 0.15);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + (i * 0.08));
                    osc.stop(now + (i * 0.08) + 0.15);
                });
            } else if (type === 'error') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch (_) {}
    },

    // --------------------------------------------------------------------------
    // KEYBOARD MASTER SHORTCUTS
    // --------------------------------------------------------------------------
    setupKeyboardShortcuts() {
        if (this._keyHandler) {
            window.removeEventListener('keydown', this._keyHandler);
        }
        this._keyHandler = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                document.getElementById('pos-barcode-scanner')?.focus();
            } else if (e.key === 'F3') {
                e.preventDefault();
                document.getElementById('pos-cust-phone')?.focus();
            } else if (e.key === 'F4') {
                e.preventDefault();
                document.getElementById('pos-promo-input')?.focus();
            } else if (e.key === 'F7') {
                e.preventDefault();
                if (this.cart.length > 0) this.parkCurrentCart();
                else this.openHeldOrdersModal();
            } else if (e.key === 'F8') {
                e.preventDefault();
                this.openCheckoutModal();
            } else if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();
                this.quickCashCheckout();
            } else if (e.key === 'F10') {
                e.preventDefault();
                this.openCustomerDisplay();
            } else if (e.key === 'Escape') {
                if (document.getElementById('modal-pos-checkout')?.style.display === 'flex') {
                    this.closeCheckoutModal();
                } else if (document.getElementById('modal-pos-receipt')?.style.display === 'flex') {
                    this.closeReceiptModal();
                } else if (this.cart.length > 0 && confirm('Clear active POS cart?')) {
                    this.clearCart();
                }
            }
        };
        window.addEventListener('keydown', this._keyHandler);
    },

    // --------------------------------------------------------------------------
    // DUAL-SCREEN CUSTOMER DISPLAY INTEGRATION
    // --------------------------------------------------------------------------
    openCustomerDisplay() {
        if (window.PosHardware && window.PosHardware.launchCustomerDisplay) {
            window.PosHardware.launchCustomerDisplay();
            this.syncCustomerDisplay();
            App.showToast('Customer Pole Display launched. Mirrored via BroadcastChannel.', 'success');
        }
    },

    syncCustomerDisplay(additionalPayload = {}) {
        if (!window.PosHardware || !window.PosHardware.broadcastCustomerDisplay) return;

        const q = this.calculateQuotation();
        const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
        const upiUrl = window.BarcodeQR ? window.BarcodeQR.getUpiUrl(store, { grand_total_cents: q.grand_total, invoice_number: 'LIVE-BILL' }) : '';
        const qrSvg = (window.BarcodeQR && upiUrl && q.grand_total > 0) ? window.BarcodeQR.qr(upiUrl, { size: 130 }) : '';

        window.PosHardware.broadcastCustomerDisplay({
            cart: this.cart,
            quotation: q,
            customer: this.currentCustomer,
            discount_total: q.items.reduce((s, i) => s + (i.discount_amount || 0), 0) + Math.round((q.subtotal * this.promoDiscountBps) / 10000) + (this.redeemedPoints * 100),
            qrSvg: qrSvg,
            ...additionalPayload
        });
    },

    // --------------------------------------------------------------------------
    // MULTI-CART PARK & RECALL (HOLD ORDER ENGINE)
    // --------------------------------------------------------------------------
    parkCurrentCart() {
        if (this.cart.length === 0) {
            App.showToast('Cart is empty. Nothing to park.', 'info');
            return;
        }

        const note = prompt('Enter customer identifier or parking note (optional):', this.currentCustomer.name) || 'Parked Cart';
        const q = this.calculateQuotation();

        const heldTicket = {
            id: `HOLD-${Date.now().toString().slice(-6)}`,
            customer: { ...this.currentCustomer },
            items: [...this.cart],
            subtotal: q.subtotal,
            tax_total: q.tax_total,
            grand_total: q.grand_total,
            notes: note,
            counter_name: this.activeCounter ? this.activeCounter.name : 'Counter 01'
        };

        if (window.SupabaseClient && window.SupabaseClient.saveHeldOrder) {
            window.SupabaseClient.saveHeldOrder(heldTicket);
        }

        this.playSound('scan');
        App.showToast(`Order parked as ${heldTicket.id} for ${this.currentCustomer.name}`, 'success');
        this.clearCart();
        this.updateHeldOrdersBadge();
    },

    openHeldOrdersModal() {
        const modal = document.getElementById('modal-pos-held-orders');
        const container = document.getElementById('pos-held-orders-container');
        if (!modal || !container) return;

        const held = window.SupabaseClient ? window.SupabaseClient.getHeldOrders() : [];
        if (held.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 36px 0;">
                    No parked orders in queue. Press [F7] on active cart to park an order.
                </div>
            `;
        } else {
            container.innerHTML = held.map(o => {
                const total = ((o.grand_total || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                const timeAgo = this.formatTimeAgo(o.timestamp);
                return `
                    <div class="pos-held-card">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 800; color: #fff; font-size: 13px;">${o.id}</span>
                                <span class="shadcn-badge blue" style="font-size: 10px;">${o.item_count || o.items?.length || 1} items</span>
                                <span style="font-size: 11px; color: var(--text-muted);">${timeAgo}</span>
                            </div>
                            <div style="font-size: 12px; color: #60a5fa; margin-top: 3px; font-weight: 600;">
                                ${o.customer?.name || 'Walk-in'} ${o.customer?.phone ? `• ${o.customer.phone}` : ''}
                            </div>
                            <div style="font-size: 11px; color: var(--text-muted); font-style: italic;">
                                "${o.notes || 'No note'}"
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 16px; font-weight: 800; font-family: monospace; color: #22c55e;">
                                ₹${total}
                            </span>
                            <button class="shadcn-btn-primary" style="height: 30px; padding: 0 10px; font-size: 11px; background: #22c55e; color: #000; font-weight: 700;" onclick="PosView.recallHeldOrder('${o.id}')">
                                Recall Cart
                            </button>
                            <button class="shadcn-btn-secondary" style="height: 30px; padding: 0 8px; font-size: 11px; color: #ef4444;" onclick="PosView.discardHeldOrder('${o.id}')" title="Discard">
                                &times;
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        modal.style.display = 'flex';
    },

    recallHeldOrder(orderId) {
        const held = window.SupabaseClient ? window.SupabaseClient.getHeldOrders() : [];
        const ticket = held.find(o => o.id === orderId);
        if (!ticket) return;

        if (this.cart.length > 0 && !confirm('Active cart has items. Replace with parked order?')) {
            return;
        }

        this.cart = [...ticket.items];
        if (ticket.customer) {
            this.currentCustomer = { ...ticket.customer };
            const phoneInput = document.getElementById('pos-cust-phone');
            const nameInput = document.getElementById('pos-cust-name');
            if (phoneInput) phoneInput.value = this.currentCustomer.phone || '';
            if (nameInput) nameInput.value = this.currentCustomer.name || '';
        }

        if (window.SupabaseClient && window.SupabaseClient.removeHeldOrder) {
            window.SupabaseClient.removeHeldOrder(orderId);
        }

        document.getElementById('modal-pos-held-orders').style.display = 'none';
        this.refreshCartUI();
        this.updateHeldOrdersBadge();
        this.playSound('scan');
        App.showToast(`Restored parked order ${orderId} to register`, 'success');
    },

    discardHeldOrder(orderId) {
        if (!confirm('Discard this parked order?')) return;
        if (window.SupabaseClient && window.SupabaseClient.removeHeldOrder) {
            window.SupabaseClient.removeHeldOrder(orderId);
        }
        this.openHeldOrdersModal();
        this.updateHeldOrdersBadge();
    },

    updateHeldOrdersBadge() {
        const held = window.SupabaseClient ? window.SupabaseClient.getHeldOrders() : [];
        const badge = document.getElementById('pos-held-count-badge');
        if (badge) badge.innerText = held.length;
    },

    formatTimeAgo(isoDate) {
        if (!isoDate) return 'just now';
        const sec = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
        if (sec < 60) return `${sec}s ago`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m ago`;
        return `${Math.floor(min / 60)}h ago`;
    },

    // --------------------------------------------------------------------------
    // PROMO CODES & DISCOUNT ENGINE
    // --------------------------------------------------------------------------
    applyPromoCode(rawCode) {
        const code = (rawCode || '').trim().toUpperCase();
        if (!code) {
            this.activePromo = null;
            this.promoDiscountBps = 0;
            this.updateTotals();
            return;
        }

        const coupons = {
            'SIMATS10': { name: 'SIMATS Institutional Rebate (10%)', bps: 1000, minRupees: 0 },
            'FACULTY15': { name: 'Academic Faculty Rebate (15%)', bps: 1500, minRupees: 0 },
            'STUDENT5': { name: 'SIMATS Student Concession (5%)', bps: 500, minRupees: 0 },
            'FESTIVE100': { name: 'Festive Mega Saving (-₹100)', flatRupees: 100, minRupees: 500 },
            'SAVE50': { name: 'Quick Saver (-₹50)', flatRupees: 50, minRupees: 300 },
            'BULK20': { name: 'Wholesale B2B Concession (20%)', bps: 2000, minRupees: 1000 }
        };

        if (coupons[code]) {
            const c = coupons[code];
            this.activePromo = { code, ...c };
            this.promoDiscountBps = c.bps || 0;
            this.playSound('scan');
            App.showToast(`Applied coupon: ${code} (${c.name})`, 'success');
        } else {
            this.playSound('error');
            App.showToast(`Coupon "${code}" is invalid or expired`, 'danger');
        }

        this.updateTotals();
        this.syncCustomerDisplay();
    },

    redeemLoyaltyPoints() {
        const pts = this.currentCustomer.loyalty_points || 0;
        if (pts <= 0) return;

        this.redeemedPoints = pts;
        this.playSound('scan');
        App.showToast(`Redeemed ${pts} loyalty points as ₹${pts}.00 discount!`, 'success');
        this.updateTotals();
        this.syncCustomerDisplay();

        const feed = document.getElementById('cust-phone-feedback');
        if (feed) {
            feed.innerHTML = `
                <span id="cust-loyalty-text">Points: 0 pts</span>
                <span style="color: #4ade80; font-size: 10px; font-weight: 700;">Points Applied (-₹${pts})</span>
            `;
        }
    },

    // --------------------------------------------------------------------------
    // CUSTOMER PHONE LOOKUP & TIER CLASSIFICATION
    // --------------------------------------------------------------------------
    async handlePhoneLookup(rawPhone) {
        const phone = rawPhone.replace(/\D/g, '');
        this.currentCustomer.phone = phone;

        const badge = document.getElementById('cust-sync-badge');
        const feedback = document.getElementById('cust-phone-feedback');
        const nameInput = document.getElementById('pos-cust-name');

        if (phone.length < 10) {
            if (badge) { badge.className = 'pos-tier-pill retail'; badge.innerText = 'Retail Regular'; }
            if (feedback) feedback.innerHTML = `<span>Enter 10-digit mobile (${phone.length}/10)...</span>`;
            return;
        }

        // 1. Search local cached customer accounts
        const match = this.customers.find(c => c.phone && c.phone.replace(/\D/g, '').endsWith(phone.slice(-10)));
        if (match) {
            this.setVerifiedCustomer(match);
            return;
        }

        // 2. Query Supabase PostgreSQL
        try {
            if (feedback) feedback.innerText = 'Searching cloud customer registry...';
            const res = await window.SupabaseClient.restRequest(`customers?phone=ilike.*${phone.slice(-10)}*&limit=1`);
            if (res && res.length > 0) {
                this.setVerifiedCustomer(res[0]);
                return;
            }
        } catch (_) {}

        // New Customer
        if (badge) { badge.className = 'pos-tier-pill simats'; badge.innerText = '+ New Customer'; }
        if (feedback) feedback.innerHTML = `<span style="color: #fbbf24;">New Customer: Enter name to register upon checkout.</span>`;
        this.syncCustomerDisplay();
    },

    setVerifiedCustomer(c) {
        const nameInput = document.getElementById('pos-cust-name');
        const badge = document.getElementById('cust-sync-badge');
        const feedback = document.getElementById('cust-phone-feedback');

        let tier = 'Retail Regular';
        const nameLower = (c.name || '').toLowerCase();
        if (nameLower.includes('simats') || nameLower.includes('saveetha') || nameLower.includes('student') || nameLower.includes('faculty')) {
            tier = 'SIMATS Institutional';
        } else if (c.tax_identifier || nameLower.includes('corp') || nameLower.includes('ltd') || nameLower.includes('enterprises')) {
            tier = 'B2B Wholesale';
        }

        // Loyalty points calculation: 1 pt per ₹100 of credit / spend
        const points = Math.floor((c.outstanding_balance_cents || 24000) / 10000) * 15;

        this.currentCustomer = {
            id: c.id,
            name: c.name,
            phone: c.phone || this.currentCustomer.phone,
            tier: tier,
            loyalty_points: points,
            is_verified: true
        };

        if (nameInput) nameInput.value = c.name;
        if (badge) {
            badge.className = `pos-tier-pill ${tier.includes('SIMATS') ? 'simats' : (tier.includes('B2B') ? 'b2b' : 'retail')}`;
            badge.innerText = tier;
        }
        if (feedback) {
            feedback.innerHTML = `
                <span id="cust-loyalty-text">Points: ${points} pts (₹${points}.00)</span>
                <div style="display: flex; gap: 6px;">
                    ${points > 0 ? `
                        <button class="shadcn-btn-secondary" style="padding: 1px 6px; font-size: 10px; color: #4ade80;" onclick="PosView.redeemLoyaltyPoints()">
                            Redeem
                        </button>
                    ` : ''}
                    <button class="shadcn-btn-secondary" style="padding: 1px 6px; font-size: 10px;" onclick="PosView.openCustomerHistoryModal()">
                        History
                    </button>
                </div>
            `;
        }

        this.playSound('scan');
        App.showToast(`Verified: ${c.name} (${tier})`, 'success');
        this.syncCustomerDisplay();
    },

    updateCustomerName(name) {
        if (name && name.trim()) {
            this.currentCustomer.name = name.trim();
            this.syncCustomerDisplay();
        }
    },

    async openCustomerHistoryModal() {
        const modal = document.getElementById('modal-customer-history');
        const list = document.getElementById('cust-history-list');
        const title = document.getElementById('cust-history-modal-title');
        if (!modal || !list) return;

        title.innerText = `History for: ${this.currentCustomer.name}`;
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">Loading purchase history from Supabase...</div>`;
        modal.style.display = 'flex';

        try {
            const invoices = await window.SupabaseClient.getInvoices();
            const filtered = invoices.filter(i => 
                (this.currentCustomer.id && i.customer_id === this.currentCustomer.id) ||
                (this.currentCustomer.phone && i.customer_phone && i.customer_phone.includes(this.currentCustomer.phone.slice(-10))) ||
                (i.customer_name && i.customer_name.toLowerCase() === this.currentCustomer.name.toLowerCase())
            );

            if (filtered.length === 0) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No previous purchases recorded for this customer.</div>`;
            } else {
                list.innerHTML = filtered.slice(0, 10).map(inv => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #16161c; border: 1px solid #24242c; border-radius: 6px; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 700; color: #fff; font-size: 13px;">${inv.invoice_number}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">${inv.invoice_date} • Mode: ${inv.payment_terms || 'CASH'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 800; font-family: monospace; color: #22c55e;">
                                ₹${(inv.grand_total / 100).toFixed(2)}
                            </div>
                            <span class="shadcn-badge ${inv.status === 'PAID' ? 'green' : 'yellow'}" style="font-size: 9px;">${inv.status}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (err) {
            list.innerHTML = `<div style="color: #ef4444; padding: 16px;">Failed to load history: ${err.message}</div>`;
        }
    },

    // --------------------------------------------------------------------------
    // DECIMAL WEIGHING SCALE / LOOSE PRODUCT CALCULATOR
    // --------------------------------------------------------------------------
    openLooseWeightModal() {
        const modal = document.getElementById('modal-loose-weight');
        if (modal) {
            this.updateWeightCalculation();
            modal.style.display = 'flex';
        }
    },

    updateWeightCalculation() {
        const sel = document.getElementById('weight-product-select');
        const qtyInput = document.getElementById('weight-qty-input');
        const unitSel = document.getElementById('weight-unit-select');
        const calcEl = document.getElementById('weight-calc-amount');
        if (!sel || !qtyInput || !calcEl) return;

        const opt = sel.options[sel.selectedIndex];
        const unitPriceCents = Number(opt?.getAttribute('data-price') || 0);
        let qty = parseFloat(qtyInput.value) || 0;
        const unit = unitSel ? unitSel.value : 'KG';

        if (unit === 'G') {
            qty = qty / 1000;
        }

        const totalCents = Math.round(qty * unitPriceCents);
        calcEl.innerText = `₹${(totalCents / 100).toFixed(2)}`;
    },

    addWeighedItemToCart() {
        const sel = document.getElementById('weight-product-select');
        const qtyInput = document.getElementById('weight-qty-input');
        const unitSel = document.getElementById('weight-unit-select');
        if (!sel || !qtyInput) return;

        const prodId = sel.value;
        const prod = this.products.find(p => p.id === prodId);
        if (!prod) return;

        let qty = parseFloat(qtyInput.value) || 1;
        const unit = unitSel ? unitSel.value : 'KG';
        if (unit === 'G') qty = qty / 1000;

        this.cart.push({
            product_id: prod.id,
            sku: prod.sku,
            name: `${prod.name} (${qty} ${unit})`,
            unit_price: prod.selling_price,
            tax_rate_bps: prod.tax_rate_bps || 1800,
            discount_bps: 0,
            quantity: qty
        });

        document.getElementById('modal-loose-weight').style.display = 'none';
        this.playSound('scan');
        this.refreshCartUI();
        App.showToast(`Added: ${prod.name} (${qty} ${unit})`, 'success');
    },

    // --------------------------------------------------------------------------
    // MULTI-COUNTER NETWORK CONTROLS
    // --------------------------------------------------------------------------
    switchCounter(counterId) {
        if (window.StoreConfig) {
            window.StoreConfig.setActiveCounter(counterId);
            this.activeCounter = window.StoreConfig.getActiveCounter();
            App.showToast(`Switched active terminal to: ${this.activeCounter.name}`, 'info');
            this.syncCustomerDisplay();
        }
    },

    showManageCountersModal() {
        const modal = document.getElementById('modal-manage-counters');
        if (modal) modal.style.display = 'flex';
    },

    addNewCounter() {
        const nameInput = document.getElementById('new-counter-name');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) return;

        if (window.StoreConfig) {
            const added = window.StoreConfig.addCounter(name);
            App.showToast(`Registered POS Counter: ${added.name}`, 'success');
            this.render(document.getElementById('main-content'));
        }
    },

    // --------------------------------------------------------------------------
    // CATALOG FILTERING & RENDERING
    // --------------------------------------------------------------------------
    setCategory(cat) {
        this.activeCategory = cat;
        const pills = document.querySelectorAll('.pos-pill');
        pills.forEach(p => {
            if (p.innerText.trim() === cat) p.classList.add('active');
            else p.classList.remove('active');
        });
        const grid = document.getElementById('pos-catalog-grid');
        if (grid) grid.innerHTML = this.renderCatalogItems(this.getFilteredProducts());
    },

    getFilteredProducts() {
        if (this.activeCategory === 'ALL') return this.products;
        return this.products.filter(p => (p.category || 'General') === this.activeCategory);
    },

    filterCatalog(q) {
        const query = (q || '').toLowerCase().trim();
        const base = this.getFilteredProducts();
        const filtered = base.filter(p => 
            p.sku.toLowerCase().includes(query) || 
            p.name.toLowerCase().includes(query) || 
            (p.barcode && p.barcode.includes(query))
        );
        const grid = document.getElementById('pos-catalog-grid');
        if (grid) grid.innerHTML = this.renderCatalogItems(filtered);
    },

    renderCatalogItems(items) {
        if (!items || items.length === 0) {
            return `<div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 40px;">No items match your search or category filter.</div>`;
        }

        return items.map(p => {
            const price = (p.selling_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            return `
                <div class="pos-item-card" onclick="PosView.addToCart('${p.id}')">
                    <div>
                        <div style="font-size: 11px; color: #60a5fa; font-weight: 700; text-transform: uppercase;">${p.category || 'General'}</div>
                        <div style="font-size: 13.5px; font-weight: 700; color: #fff; margin: 4px 0 6px 0; line-height: 1.3;">${p.name}</div>
                        <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                            SKU: ${p.sku} ${p.barcode ? `• Barcode: ${p.barcode}` : ''}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid #1c1c20;">
                        <span style="font-size: 15px; font-weight: 800; color: #22c55e; font-family: var(--font-mono);">₹${price}</span>
                        <span class="shadcn-badge blue" style="cursor: pointer;">+ Add</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // --------------------------------------------------------------------------
    // CART OPERATIONS & LIVE QUOTATIONS
    // --------------------------------------------------------------------------
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

        this.playSound('scan');
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
        this.redeemedPoints = 0;
        this.activePromo = null;
        this.promoDiscountBps = 0;
        this.refreshCartUI();
        this.syncCustomerDisplay();
    },

    refreshCartUI() {
        const el = document.getElementById('pos-cart-items');
        if (el) el.innerHTML = this.renderCartItems();
        this.updateTotals();
        this.syncCustomerDisplay();
    },

    renderCartItems() {
        if (this.cart.length === 0) {
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 180px; color: var(--text-muted); text-align: center;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 8px;">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <span>Cart is empty. Scan barcode or tap items to bill.</span>
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
                        <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                            ₹${unit} each
                            ${item.discount_bps > 0 ? `<span style="color: #4ade80;"> • ${item.discount_bps / 100}% off</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 12px; height: 26px;" onclick="PosView.updateQty(${idx}, -1)">-</button>
                        <span style="font-weight: 700; font-family: var(--font-mono); width: 26px; text-align: center; color: #fff;">${item.quantity}</span>
                        <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 12px; height: 26px;" onclick="PosView.updateQty(${idx}, 1)">+</button>
                    </div>
                    <div style="width: 80px; text-align: right; font-weight: 700; font-family: var(--font-mono); color: #fff; font-size: 13px;">
                        ₹${lineGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <button style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; font-size: 16px; line-height: 1;" onclick="PosView.removeFromCart(${idx})" title="Remove">&times;</button>
                </div>
            `;
        }).join('');
    },

    toggleInterstate(checked) {
        this.isInterState = checked;
        this.updateTotals();
        this.syncCustomerDisplay();
    },

    toggleOverride(checked) {
        this.hasManagerOverride = checked;
        this.updateTotals();
    },

    // --------------------------------------------------------------------------
    // C-ENGINE DETERMINISTIC ARITHMETIC & TAX CALCULATOR
    // --------------------------------------------------------------------------
    calculateQuotation() {
        let subtotal = 0;
        let taxable = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        let totalDiscountCents = 0;

        const computedItems = this.cart.map(item => {
            const qty = Math.max(0.001, Number(item.quantity) || 1);
            const unitPrice = Number(item.unit_price) || 0;
            const gross = Math.round(qty * unitPrice);
            subtotal += gross;

            // Combine item discount + global promo discount
            const itemDiscBps = Number(item.discount_bps) || 0;
            const effectiveDiscBps = Math.min(10000, itemDiscBps + this.promoDiscountBps);
            const discAmount = effectiveDiscBps > 0 ? Math.round((gross * effectiveDiscBps) / 10000) : 0;
            totalDiscountCents += discAmount;

            const netTaxable = Math.max(0, gross - discAmount);
            taxable += netTaxable;

            const taxRate = item.tax_rate_bps !== undefined ? Number(item.tax_rate_bps) : 1800;
            const lineTax = Math.round((netTaxable * taxRate) / 10000);

            let itemCgst = 0;
            let itemSgst = 0;
            let itemIgst = 0;

            if (this.isInterState) {
                itemIgst = lineTax;
                igst += lineTax;
            } else {
                itemCgst = Math.round(lineTax / 2);
                itemSgst = lineTax - itemCgst;
                cgst += itemCgst;
                sgst += itemSgst;
            }

            const lineTotal = netTaxable + itemCgst + itemSgst + itemIgst;

            return {
                ...item,
                quantity: qty,
                unit_price: unitPrice,
                line_gross: gross,
                discount_bps: effectiveDiscBps,
                discount_amount: discAmount,
                net_taxable: netTaxable,
                tax_rate_bps: taxRate,
                cgst_amount: itemCgst,
                sgst_amount: itemSgst,
                igst_amount: itemIgst,
                line_total: lineTotal
            };
        });

        // Deduct points redemption (₹1 per point)
        const pointsDeductionCents = Math.round((this.redeemedPoints || 0) * 100);
        totalDiscountCents += pointsDeductionCents;

        const totalTax = cgst + sgst + igst;
        const exact = Math.max(0, taxable + totalTax - pointsDeductionCents);
        const rounded = Math.round(exact / 100) * 100;
        const roundOff = rounded - exact;

        return {
            subtotal,
            discount_total: totalDiscountCents,
            taxable_amount: taxable,
            cgst_amount: cgst,
            sgst_amount: sgst,
            igst_amount: igst,
            tax_total: totalTax,
            round_off: roundOff,
            grand_total: rounded,
            items: computedItems
        };
    },

    updateTotals() {
        const totalsEl = document.getElementById('pos-totals-box');
        if (totalsEl) totalsEl.innerHTML = this.renderTotals();

        const btn = document.getElementById('pos-btn-pay');
        const quickBtn = document.getElementById('pos-btn-quick-cash');
        const formatted = this.getFormattedGrandTotal();

        if (btn) {
            btn.disabled = this.cart.length === 0;
            btn.innerText = `Split / Pay (${formatted}) [F8]`;
        }
        if (quickBtn) {
            quickBtn.disabled = this.cart.length === 0;
            quickBtn.innerText = `Fast Cash (${formatted}) [F9]`;
        }
    },

    renderTotals() {
        const q = this.calculateQuotation();
        const sub = (q.subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const tax = (q.tax_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const disc = (q.discount_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const grand = (q.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

        return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12.5px;">
                <span style="color: var(--text-muted);">Taxable Subtotal</span>
                <span style="font-family: var(--font-mono); color: #fff;">₹${sub}</span>
            </div>
            ${q.discount_total > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12.5px;">
                    <span style="color: #4ade80;">Concessions & Savings</span>
                    <span style="font-family: var(--font-mono); color: #4ade80;">-₹${disc}</span>
                </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12.5px;">
                <span style="color: var(--text-muted);">${this.isInterState ? 'IGST (18%)' : 'CGST (9%) + SGST (9%)'}</span>
                <span style="font-family: var(--font-mono); color: #60a5fa;">₹${tax}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #222226; font-size: 16px; font-weight: 800;">
                <span style="color: #fff;">Net Payable</span>
                <span style="font-family: var(--font-mono); color: #22c55e;">₹${grand}</span>
            </div>
        `;
    },

    getFormattedGrandTotal() {
        const q = this.calculateQuotation();
        return `₹${(q.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    },

    // --------------------------------------------------------------------------
    // BARCODE SCANNING & AUDIBLE FEEDBACK
    // --------------------------------------------------------------------------
    handleBarcodeKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.target;
            const code = (input.value || '').trim();
            if (!code) return;

            const match = this.products.find(p => 
                (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
                (p.sku && p.sku.toLowerCase() === code.toLowerCase()) ||
                p.name.toLowerCase() === code.toLowerCase()
            );

            if (match) {
                this.addToCart(match.id);
                input.value = '';
                input.focus();
            } else {
                this.playSound('error');
                App.showToast(`Barcode "${code}" not found in master SKU catalog`, 'danger');
                input.select();
            }
        }
    },

    // --------------------------------------------------------------------------
    // CHECKOUT MODAL, MULTI-TENDER & DENOMINATIONS
    // --------------------------------------------------------------------------
    openCheckoutModal() {
        if (this.cart.length === 0) return;
        const q = this.calculateQuotation();
        const modal = document.getElementById('modal-pos-checkout');
        const disp = document.getElementById('checkout-display-total');
        const tender = document.getElementById('checkout-tendered');
        const billedTo = document.getElementById('checkout-billed-to');

        if (disp) disp.innerText = `₹${(q.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        if (tender) tender.value = (q.grand_total / 100).toFixed(2);
        if (billedTo) billedTo.innerText = `${this.currentCustomer.name} ${this.currentCustomer.phone ? `(${this.currentCustomer.phone})` : ''}`;

        this.setCheckoutMode('SINGLE');
        this.calculateChange((q.grand_total / 100).toFixed(2));
        this.syncCustomerDisplay();

        if (modal) modal.style.display = 'flex';
    },

    closeCheckoutModal() {
        const modal = document.getElementById('modal-pos-checkout');
        if (modal) modal.style.display = 'none';
    },

    setCheckoutMode(mode) {
        this.checkoutMode = mode;
        const singleDiv = document.getElementById('checkout-mode-single');
        const splitDiv = document.getElementById('checkout-mode-split');
        if (singleDiv) singleDiv.style.display = (mode === 'SINGLE') ? 'block' : 'none';
        if (splitDiv) splitDiv.style.display = (mode === 'SPLIT') ? 'block' : 'none';

        if (mode === 'SPLIT') {
            const q = this.calculateQuotation();
            const cashInput = document.getElementById('split-cash');
            if (cashInput && !cashInput.value) {
                cashInput.value = (q.grand_total / 100).toFixed(2);
            }
            this.recalcSplitTender();
        }
    },

    setPaymentMethod(method) {
        const upiBox = document.getElementById('checkout-upi-box');
        const tenderGroup = document.getElementById('checkout-tender-group');
        const q = this.calculateQuotation();

        if (method === 'UPI') {
            if (upiBox) {
                const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
                const upiUrl = window.BarcodeQR ? window.BarcodeQR.getUpiUrl(store, { grand_total_cents: q.grand_total, invoice_number: 'LIVE-BILL' }) : '';
                const qrSvg = (window.BarcodeQR && upiUrl) ? window.BarcodeQR.qr(upiUrl, { size: 140 }) : '';
                upiBox.innerHTML = `
                    <div style="text-align: center; background: #ffffff; color: #000000; padding: 14px; border-radius: 8px; margin-bottom: 14px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e293b; margin-bottom: 6px;">Scan to Pay with Any UPI App</div>
                        <div style="display: flex; justify-content: center; margin: 6px 0;">${qrSvg}</div>
                        <div style="font-size: 12px; font-family: monospace; color: #0f172a; margin-top: 6px;">UPI ID: <strong>${store.upi_id || 'sse.retail@icici'}</strong></div>
                        <div style="font-size: 12px; font-weight: 800; color: #15803d; margin-top: 2px;">Amount: ₹${(q.grand_total / 100).toFixed(2)}</div>
                        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">GPay • PhonePe • Paytm • BHIM • Cred • Banking Apps</div>
                    </div>
                `;
                upiBox.style.display = 'block';
            }
            if (tenderGroup) tenderGroup.style.display = 'none';
        } else {
            if (upiBox) upiBox.style.display = 'none';
            if (tenderGroup) tenderGroup.style.display = 'block';
        }

        this.syncCustomerDisplay();
    },

    setExactTender() {
        const q = this.calculateQuotation();
        const tender = document.getElementById('checkout-tendered');
        if (tender) {
            tender.value = (q.grand_total / 100).toFixed(2);
            this.calculateChange(tender.value);
        }
    },

    setTenderAmount(amount) {
        const tender = document.getElementById('checkout-tendered');
        if (tender) {
            tender.value = Number(amount).toFixed(2);
            this.calculateChange(tender.value);
        }
    },

    addDenomination(delta) {
        const tender = document.getElementById('checkout-tendered');
        if (tender) {
            const current = parseFloat(tender.value || '0') || 0;
            tender.value = (current + delta).toFixed(2);
            this.calculateChange(tender.value);
        }
    },

    calculateChange(tenderedVal) {
        const q = this.calculateQuotation();
        const tendered = Math.round(parseFloat(tenderedVal || '0') * 100);
        const change = tendered - q.grand_total;
        const changeEl = document.getElementById('checkout-change-display');
        if (!changeEl) return;

        if (change >= 0) {
            changeEl.style.color = '#22c55e';
            changeEl.innerText = `Change Due to Return: ₹${(change / 100).toFixed(2)}`;
        } else {
            changeEl.style.color = '#ef4444';
            changeEl.innerText = `Amount Short: ₹${(Math.abs(change) / 100).toFixed(2)}`;
        }

        this.syncCustomerDisplay({ change_due_cents: Math.max(0, change) });
    },

    // Split Tender Calculation
    recalcSplitTender() {
        const q = this.calculateQuotation();
        const getVal = (id) => Math.round((parseFloat(document.getElementById(id)?.value || '0') || 0) * 100);

        const cash = getVal('split-cash');
        const upi = getVal('split-upi');
        const card = getVal('split-card');
        const credit = getVal('split-credit');

        this.splitTender = { cash, upi, card, credit };
        const totalPaid = cash + upi + card + credit;
        const diff = q.grand_total - totalPaid;

        const remEl = document.getElementById('split-remaining-val');
        if (remEl) {
            if (diff === 0) {
                remEl.style.color = '#22c55e';
                remEl.innerText = '₹0.00 (Fully Settled)';
            } else if (diff < 0) {
                remEl.style.color = '#4ade80';
                remEl.innerText = `Change Due: ₹${(Math.abs(diff) / 100).toFixed(2)}`;
            } else {
                remEl.style.color = '#ef4444';
                remEl.innerText = `Short: ₹${(diff / 100).toFixed(2)}`;
            }
        }
    },

    fillSplitRemaining(targetKey) {
        const q = this.calculateQuotation();
        const getVal = (id) => Math.round((parseFloat(document.getElementById(id)?.value || '0') || 0) * 100);

        let otherSum = 0;
        ['cash', 'upi', 'card', 'credit'].forEach(k => {
            if (k !== targetKey) otherSum += getVal(`split-${k}`);
        });

        const remaining = Math.max(0, q.grand_total - otherSum);
        const input = document.getElementById(`split-${targetKey}`);
        if (input) input.value = (remaining / 100).toFixed(2);
        this.recalcSplitTender();
    },

    // --------------------------------------------------------------------------
    // INSTANT 1-CLICK QUICK CASH CHECKOUT
    // --------------------------------------------------------------------------
    async quickCashCheckout() {
        if (this.cart.length === 0) return;
        const q = this.calculateQuotation();
        const quickBtn = document.getElementById('pos-btn-quick-cash');
        if (quickBtn) {
            quickBtn.disabled = true;
            quickBtn.innerText = 'Committing Sale to Supabase...';
        }

        try {
            const invoice = await window.SupabaseClient.checkoutSale({
                customer_name: this.currentCustomer.name,
                customer_phone: this.currentCustomer.phone,
                is_interstate: this.isInterState,
                counter_name: this.activeCounter ? this.activeCounter.name : 'Counter 01',
                payment_method: 'CASH',
                amount_tendered_cents: q.grand_total,
                change_due_cents: 0,
                discount_total: q.discount_total,
                warehouse_id: "20000000-0000-0000-0000-000000000001",
                items: q.items,
                subtotal: q.subtotal,
                tax_total: q.tax_total,
                cgst_amount: q.cgst_amount,
                sgst_amount: q.sgst_amount,
                igst_amount: q.igst_amount,
                round_off: q.round_off,
                grand_total: q.grand_total
            });

            this.lastInvoice = { ...invoice, quotation: q };
            this.playSound('success');
            App.showToast(`Bill ${invoice.invoice_number} saved to Supabase!`, 'success');

            if (window.PosHardware && window.PosHardware.kickCashDrawer) {
                window.PosHardware.kickCashDrawer().catch(() => {});
            }

            this.renderThermalReceipt(this.lastInvoice);
            this.clearCart();
        } catch (err) {
            this.playSound('error');
            App.showToast(`Fast checkout failed: ${err.message}`, 'danger');
        } finally {
            if (quickBtn) {
                quickBtn.disabled = this.cart.length === 0;
                quickBtn.innerText = `Fast Cash (${this.getFormattedGrandTotal()}) [F9]`;
            }
        }
    },

    // --------------------------------------------------------------------------
    // FINAL CHECKOUT EXECUTION & DATABASE COMMIT
    // --------------------------------------------------------------------------
    async handleCheckout(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-confirm-sale');
        if (btn) { btn.disabled = true; btn.innerText = 'Synchronizing with Cloud DB...'; }

        const q = this.calculateQuotation();
        let payMethod = 'CASH';
        let tenderedCents = q.grand_total;
        let changeCents = 0;

        if (this.checkoutMode === 'SPLIT') {
            const splits = [];
            if (this.splitTender.cash > 0) splits.push(`CASH: ₹${(this.splitTender.cash/100).toFixed(0)}`);
            if (this.splitTender.upi > 0) splits.push(`UPI: ₹${(this.splitTender.upi/100).toFixed(0)}`);
            if (this.splitTender.card > 0) splits.push(`CARD: ₹${(this.splitTender.card/100).toFixed(0)}`);
            if (this.splitTender.credit > 0) splits.push(`CREDIT: ₹${(this.splitTender.credit/100).toFixed(0)}`);
            payMethod = `SPLIT (${splits.join(', ')})`;
            tenderedCents = this.splitTender.cash + this.splitTender.upi + this.splitTender.card + this.splitTender.credit;
            changeCents = Math.max(0, tenderedCents - q.grand_total);
        } else {
            payMethod = document.querySelector('input[name="pay-method"]:checked')?.value || 'CASH';
            const tenderVal = document.getElementById('checkout-tendered')?.value || '0';
            tenderedCents = Math.round(parseFloat(tenderVal) * 100);
            changeCents = Math.max(0, tenderedCents - q.grand_total);
        }

        try {
            const invoice = await window.SupabaseClient.checkoutSale({
                customer_name: this.currentCustomer.name,
                customer_phone: this.currentCustomer.phone,
                is_interstate: this.isInterState,
                counter_name: this.activeCounter ? this.activeCounter.name : 'Counter 01',
                payment_method: payMethod,
                amount_tendered_cents: tenderedCents,
                change_due_cents: changeCents,
                discount_total: q.discount_total,
                warehouse_id: "20000000-0000-0000-0000-000000000001",
                items: q.items,
                subtotal: q.subtotal,
                tax_total: q.tax_total,
                cgst_amount: q.cgst_amount,
                sgst_amount: q.sgst_amount,
                igst_amount: q.igst_amount,
                round_off: q.round_off,
                grand_total: q.grand_total
            });

            this.lastInvoice = { ...invoice, quotation: q };
            this.closeCheckoutModal();
            this.playSound('success');
            App.showToast(`Bill ${invoice.invoice_number} saved to Supabase!`, 'success');

            if (window.PosHardware && window.PosHardware.kickCashDrawer) {
                window.PosHardware.kickCashDrawer().catch(() => {});
            }

            this.renderThermalReceipt(this.lastInvoice);
            this.clearCart();
        } catch (err) {
            this.playSound('error');
            App.showToast(`Checkout failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Finalize Bill & Print [Enter]'; }
        }
    },

    // --------------------------------------------------------------------------
    // RECEIPT PREVIEW, THERMAL FORMAT SWITCHER & WHATSAPP
    // --------------------------------------------------------------------------
    setReceiptFormat(format) {
        this.activeReceiptFormat = format;
        if (this.lastInvoice) {
            this.renderThermalReceipt(this.lastInvoice);
        }
    },

    renderThermalReceipt(inv) {
        const area = document.getElementById('receipt-print-area');
        const modal = document.getElementById('modal-pos-receipt');
        if (!area || !modal) return;

        const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
        const q = inv.quotation || {};

        const sub = (inv.subtotal_cents / 100).toFixed(2);
        const cgst = (q.cgst_amount / 100 || 0).toFixed(2);
        const sgst = (q.sgst_amount / 100 || 0).toFixed(2);
        const igst = (q.igst_amount / 100 || 0).toFixed(2);
        const grand = (inv.grand_total_cents / 100).toFixed(2);
        const tendered = ((inv.amount_tendered_cents || inv.grand_total_cents) / 100).toFixed(2);
        const change = ((inv.change_due_cents || 0) / 100).toFixed(2);
        const disc = ((inv.discount_cents || 0) / 100).toFixed(2);

        const barcodeSvg = window.BarcodeQR ? window.BarcodeQR.code128(inv.invoice_number, { width: 220, height: 42, showText: true }) : '';
        const upiUrl = window.BarcodeQR ? window.BarcodeQR.getUpiUrl(store, inv) : '';
        const qrSvg = (window.BarcodeQR && upiUrl) ? window.BarcodeQR.qr(upiUrl, { size: 100 }) : '';

        const slipWidth = this.activeReceiptFormat === '58mm' ? '240px' : (this.activeReceiptFormat === 'A4' ? '100%' : '320px');

        area.innerHTML = `
            <div id="printable-thermal-slip" style="width: ${slipWidth}; margin: 0 auto; background: #ffffff; color: #000000; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.35; padding: 18px 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
                <!-- Store Header -->
                <div style="text-align: center; font-weight: bold; font-size: 14px; text-transform: uppercase;">
                    ${store.shop_name || 'SSE ENTERPRISE HUB'}
                </div>
                <div style="text-align: center; font-size: 10px; margin-top: 2px;">
                    ${store.tagline || 'Retail & Distribution Hub'}
                </div>
                <div style="text-align: center; font-size: 10px; margin-top: 2px;">
                    ${store.address_line1 || ''}<br>${store.address_line2 || ''}
                </div>
                <div style="text-align: center; font-size: 10px; margin-top: 2px;">
                    Phone: ${store.phone || '+91 98765 43210'}
                </div>
                <div style="text-align: center; font-size: 10px; font-weight: bold;">
                    GSTIN: ${store.gstin || '27AABCU9603R1ZM'}
                </div>

                <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>

                <!-- Transaction Meta -->
                <div style="display: flex; justify-content: space-between;">
                    <span>Bill No :</span>
                    <strong>${inv.invoice_number}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Date/Time:</span>
                    <span>${inv.exact_timestamp || new Date().toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Station  :</span>
                    <span>${inv.counter_name || (this.activeCounter ? this.activeCounter.name : 'Counter 01')}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Cashier  :</span>
                    <span>${inv.cashier_name || 'Cashier'}</span>
                </div>

                <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>

                <!-- Customer Details -->
                <div style="display: flex; justify-content: space-between;">
                    <span>Customer:</span>
                    <strong>${inv.customer ? inv.customer.name : 'Walk-in Cash Customer'}</strong>
                </div>
                ${inv.customer && inv.customer.phone ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span>Mobile  :</span>
                        <span>${inv.customer.phone}</span>
                    </div>
                ` : ''}

                <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>

                <!-- Itemized Lines Table -->
                <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
                    <thead>
                        <tr style="border-bottom: 1px dashed #000000;">
                            <th style="text-align: left; padding-bottom: 4px;">ITEM</th>
                            <th style="text-align: center; padding-bottom: 4px;">QTY</th>
                            <th style="text-align: right; padding-bottom: 4px;">RATE</th>
                            <th style="text-align: right; padding-bottom: 4px;">AMT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(inv.items || []).map(item => `
                            <tr>
                                <td style="padding: 2px 0; max-width: 140px; word-break: break-all;">
                                    ${item.name}
                                    <div style="font-size: 9px; color: #555;">SKU: ${item.sku}</div>
                                </td>
                                <td style="text-align: center; vertical-align: top; padding: 2px 0;">${item.quantity}</td>
                                <td style="text-align: right; vertical-align: top; padding: 2px 0;">${(item.unit_price / 100).toFixed(2)}</td>
                                <td style="text-align: right; vertical-align: top; padding: 2px 0;">${((item.quantity * item.unit_price) / 100).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>

                <!-- Totals Breakdown -->
                <div style="display: flex; justify-content: space-between;">
                    <span>Taxable Base:</span>
                    <span>₹${sub}</span>
                </div>
                ${disc > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #15803d; font-weight: bold;">
                        <span>Total Savings:</span>
                        <span>-₹${disc}</span>
                    </div>
                ` : ''}
                ${q.igst_amount > 0 ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span>IGST (18%):</span>
                        <span>₹${igst}</span>
                    </div>
                ` : `
                    <div style="display: flex; justify-content: space-between;">
                        <span>CGST (9%):</span>
                        <span>₹${cgst}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>SGST (9%):</span>
                        <span>₹${sgst}</span>
                    </div>
                `}

                <div style="border-top: 1px double #000000; border-bottom: 1px double #000000; padding: 4px 0; margin: 6px 0; font-size: 13px; font-weight: bold; display: flex; justify-content: space-between;">
                    <span>NET TOTAL:</span>
                    <span>₹${grand}</span>
                </div>

                <div style="display: flex; justify-content: space-between;">
                    <span>Tender Mode :</span>
                    <span>${inv.payment_method || 'CASH'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Amount Paid :</span>
                    <span>₹${tendered}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Change Due  :</span>
                    <span>₹${change}</span>
                </div>

                <div style="border-top: 1px dashed #000000; margin: 8px 0;"></div>

                <!-- Code-128 Barcode Graphic -->
                <div style="text-align: center; margin: 10px 0 6px 0;">
                    ${barcodeSvg}
                </div>

                <!-- Dynamic UPI QR Code -->
                <div style="text-align: center; margin: 10px 0; padding: 6px; background: #ffffff; border: 1px dashed #666; border-radius: 4px;">
                    <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Scan & Pay via UPI / Verify Bill</div>
                    ${qrSvg}
                    <div style="font-size: 8.5px; color: #555; margin-top: 2px;">VPA: ${store.upi_id || 'sse.retail@icici'}</div>
                </div>

                ${store.fssai ? `<div style="text-align: center; font-size: 9px; margin-top: 4px;">FSSAI Lic: ${store.fssai}</div>` : ''}

                <div style="text-align: center; font-size: 10px; margin-top: 6px;">
                    ${store.footer_note || 'Thank you for shopping with us! Visit again.'}
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    },

    closeReceiptModal() {
        const modal = document.getElementById('modal-pos-receipt');
        if (modal) modal.style.display = 'none';
        document.getElementById('pos-barcode-scanner')?.focus();
    },

    printReceipt() {
        const content = document.getElementById('printable-thermal-slip');
        if (!content) return;

        if (window.PosHardware && (this.lastInvoice && this.lastInvoice.payment_method?.includes('CASH'))) {
            window.PosHardware.kickCashDrawer().catch(() => {});
        }

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${this.lastInvoice ? this.lastInvoice.invoice_number : 'POS'}</title>
                <style>
                    @page { size: ${this.activeReceiptFormat === '58mm' ? '58mm' : '80mm'} auto; margin: 0; }
                    body { margin: 0; padding: 10px; background: #fff; font-family: 'Courier New', Courier, monospace; }
                </style>
            </head>
            <body>
                ${content.outerHTML}
                <script>
                    window.onload = function() { window.print(); window.close(); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    downloadThermalSlip() {
        const content = document.getElementById('printable-thermal-slip');
        if (!content || !this.lastInvoice) return;

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt_${this.lastInvoice.invoice_number}</title>
    <style>body { font-family: 'Courier New', monospace; padding: 20px; }</style>
</head>
<body>
${content.outerHTML}
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt_${this.lastInvoice.invoice_number}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        App.showToast(`Receipt downloaded: Receipt_${this.lastInvoice.invoice_number}.html`, 'success');
    },

    shareWhatsAppReceipt() {
        if (!this.lastInvoice) return;
        const inv = this.lastInvoice;
        const phone = inv.customer?.phone || this.currentCustomer.phone;
        const cleanPhone = (phone || '').replace(/\D/g, '');

        const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
        const grand = (inv.grand_total_cents / 100).toFixed(2);

        const itemsText = (inv.items || []).map(i => `• ${i.name} (Qty: ${i.quantity}) - ₹${((i.quantity * i.unit_price) / 100).toFixed(2)}`).join('%0A');

        const message = `*${encodeURIComponent(store.shop_name || 'SSE ENTERPRISE')}*%0A*TAX INVOICE RECEIPT*%0A------------------------%0ABill No: *${inv.invoice_number}*%0ADate: ${encodeURIComponent(inv.exact_timestamp || new Date().toLocaleDateString())}%0ACustomer: ${encodeURIComponent(inv.customer?.name || 'Valued Customer')}%0A------------------------%0A${itemsText}%0A------------------------%0A*Net Total: ₹${grand}*%0APayment Mode: ${encodeURIComponent(inv.payment_method || 'CASH')}%0A------------------------%0AThank you for shopping with us!`;

        const waUrl = cleanPhone
            ? `https://api.whatsapp.com/send?phone=91${cleanPhone.slice(-10)}&text=${message}`
            : `https://api.whatsapp.com/send?text=${message}`;

        window.open(waUrl, '_blank');
        App.showToast('Opened WhatsApp e-Receipt Dispatch', 'success');
    }
};

window.PosView = PosView;
