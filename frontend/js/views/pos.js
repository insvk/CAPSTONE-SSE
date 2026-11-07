/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise High-Speed POS Billing Register
 * Barcode Scanner Integration, Multi-Counter Network, Mobile Customer Sync,
 * Sequential Bill Numbering, Thermal Receipt Print & Download
 * 100% Live Cloud Synchronization with Supabase PostgreSQL 17
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
        is_verified: false
    },
    activeCounter: null,
    lastInvoice: null,

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 350px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border: 2px solid #27272a; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <span style="font-size: 13px; color: var(--text-muted);">Initializing high-speed POS terminal & catalog...</span>
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
            this.activeCounter = window.StoreConfig ? window.StoreConfig.getActiveCounter() : { id: 'CTR-01', name: 'Counter 01 - Front Desk' };
            this.renderLayout(container);
        } catch (err) {
            container.innerHTML = `
                <div class="shadcn-card" style="border-color: #ef4444; color: #ef4444; padding: 24px;">
                    <strong>Error loading POS catalog:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderLayout(container) {
        const categories = ['ALL', ...new Set(this.products.map(p => p.category || 'General'))];
        const storeProfile = window.StoreConfig ? window.StoreConfig.getProfile() : { shop_name: 'SSE Enterprise Hub' };
        const counters = window.StoreConfig ? window.StoreConfig.getCounters() : [];

        container.innerHTML = `
            <!-- POS Top Station Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px 18px; background: #121215; border: 1px solid #222226; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border-radius: 6px; background: #22c55e; color: #09090b; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <div>
                        <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${storeProfile.shop_name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">GSTIN: <span style="font-family: monospace; color: #a1a1aa;">${storeProfile.gstin}</span> • POS Terminal</div>
                    </div>
                </div>

                <!-- Multi-Counter Station Switcher -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Active Station:</span>
                        <select id="pos-counter-select" class="shadcn-select" style="width: 220px; height: 32px; font-size: 12px; font-weight: 600;" onchange="PosView.switchCounter(this.value)">
                            ${counters.map(c => `
                                <option value="${c.id}" ${c.id === this.activeCounter.id ? 'selected' : ''}>
                                    ${c.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <button class="shadcn-btn-secondary" style="height: 32px; padding: 0 10px; font-size: 12px;" onclick="PosView.showManageCountersModal()" title="Configure Multi-Counter Network">
                        Counters
                    </button>
                    <button class="shadcn-btn-secondary" style="height: 32px; padding: 0 10px; font-size: 12px;" onclick="PosHardware.showHardwareModal()" title="Configure Thermal Printer, Cash Drawer, Barcode Gun & Displays">
                        Hardware & Devices
                    </button>
                    <button class="shadcn-btn-secondary" style="height: 32px; padding: 0 10px; font-size: 12px;" onclick="App.openStoreProfileModal()" title="Edit Store Details on Printed Bill">
                        Store Profile
                    </button>
                </div>
            </div>

            <div class="pos-container">
                <!-- Left Column: Catalog & Barcode Scanner Panel -->
                <div class="pos-catalog-panel">
                    <!-- High-Speed Barcode & Search Bar -->
                    <div style="display: grid; grid-template-columns: 1fr 180px; gap: 10px;">
                        <div style="position: relative;">
                            <input type="text" id="pos-barcode-scanner" class="shadcn-input" placeholder="Scan Barcode (EAN-13) or enter SKU & press Enter..." style="height: 42px; font-size: 13px; padding-left: 36px; border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.15);" onkeydown="PosView.handleBarcodeKeydown(event)" autofocus />
                            <svg style="position: absolute; left: 12px; top: 13px; color: #3b82f6;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"/>
                            </svg>
                        </div>
                        <input type="text" id="pos-search" class="shadcn-input" placeholder="Filter products..." style="height: 42px;" oninput="PosView.filterCatalog(this.value)" />
                    </div>

                    <!-- Category Filter Tabs -->
                    <div class="pos-category-pills">
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

                <!-- Right Column: Active Bill, Customer Mobile Capture & Checkout -->
                <div class="pos-cart-panel">
                    <!-- Customer Mobile & Name Header -->
                    <div style="padding: 14px 16px; background: #18181c; border-bottom: 1px solid #222226;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 12px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</span>
                            <span id="cust-sync-badge" class="shadcn-badge ${this.currentCustomer.phone ? 'green' : 'default'}" style="font-size: 10px;">
                                ${this.currentCustomer.phone ? 'Registered Customer' : 'Walk-in Cash'}
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
                            <div>
                                <input type="tel" id="pos-cust-phone" class="shadcn-input" placeholder="Mobile Number" style="height: 32px; font-size: 12px; font-family: monospace;" value="${this.currentCustomer.phone || ''}" oninput="PosView.handlePhoneLookup(this.value)" />
                            </div>
                            <div>
                                <input type="text" id="pos-cust-name" class="shadcn-input" placeholder="Customer Name" style="height: 32px; font-size: 12px;" value="${this.currentCustomer.name || 'Walk-in Retail Cash Customer'}" onchange="PosView.updateCustomerName(this.value)" />
                            </div>
                        </div>
                        <div id="cust-phone-feedback" style="font-size: 11px; color: var(--text-muted); margin-top: 4px; min-height: 14px;">
                            Enter 10-digit mobile to sync past purchases and order ledger.
                        </div>
                    </div>

                    <!-- Active Bill Cart Items -->
                    <div class="pos-cart-header" style="padding: 10px 16px;">
                        <span style="font-weight: 700; color: #fff; font-size: 13px;">Active Cart (${this.cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                        <button class="shadcn-btn-secondary" style="padding: 2px 8px; font-size: 11px; color: #ef4444;" onclick="PosView.clearCart()">
                            Clear All
                        </button>
                    </div>

                    <div class="pos-cart-items-wrap" id="pos-cart-items">
                        ${this.renderCartItems()}
                    </div>

                    <!-- Discount & Tax Invariant Controls -->
                    <div style="padding: 8px 14px; background: #121215; border-top: 1px solid #222226; display: flex; justify-content: space-between; align-items: center; font-size: 11.5px;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-secondary);">
                            <input type="checkbox" id="pos-interstate" onchange="PosView.toggleInterstate(this.checked)" ${this.isInterState ? 'checked' : ''} />
                            Inter-State (IGST 18%)
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--accent-amber);">
                            <input type="checkbox" id="pos-override" onchange="PosView.toggleOverride(this.checked)" ${this.hasManagerOverride ? 'checked' : ''} />
                            Override (>20%)
                        </label>
                    </div>

                    <!-- Totals Breakdown -->
                    <div class="pos-totals-box" id="pos-totals-box">
                        ${this.renderTotals()}
                    </div>

                    <!-- Checkout Button -->
                    <button class="pos-btn-checkout" id="pos-btn-pay" onclick="PosView.openCheckoutModal()" ${this.cart.length === 0 ? 'disabled' : ''}>
                        Pay & Print Bill (${this.getFormattedGrandTotal()})
                    </button>
                </div>
            </div>

            <!-- Modal 1: Payment Checkout Dialog -->
            <div id="modal-pos-checkout" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 440px;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title">Settle Bill & Finalize Sale</h3>
                            <div style="font-size: 11px; color: var(--text-muted);" id="checkout-station-label">
                                Terminal: ${this.activeCounter.name}
                            </div>
                        </div>
                        <button class="shadcn-modal-close" onclick="PosView.closeCheckoutModal()">Close</button>
                    </div>
                    <form onsubmit="PosView.handleCheckout(event)">
                        <div class="shadcn-modal-body">
                            <div style="text-align: center; margin-bottom: 16px; background: #18181c; padding: 16px; border-radius: 8px; border: 1px solid #222226;">
                                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">NET AMOUNT DUE</div>
                                <div style="font-size: 32px; font-weight: 800; color: #22c55e; font-family: var(--font-mono);" id="checkout-display-total">
                                    ${this.getFormattedGrandTotal()}
                                </div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                    Billed to: <strong id="checkout-billed-to" style="color: #ffffff;">${this.currentCustomer.name}</strong>
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: block;">Payment Tender Method</label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                                    <label class="shadcn-btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; padding: 8px;">
                                        <input type="radio" name="pay-method" value="CASH" checked onchange="PosView.setPaymentMethod('CASH')" /> Cash
                                    </label>
                                    <label class="shadcn-btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; padding: 8px;">
                                        <input type="radio" name="pay-method" value="UPI" onchange="PosView.setPaymentMethod('UPI')" /> UPI / QR
                                    </label>
                                    <label class="shadcn-btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; padding: 8px;">
                                        <input type="radio" name="pay-method" value="CARD" onchange="PosView.setPaymentMethod('CARD')" /> Card
                                    </label>
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Amount Tendered by Customer (INR)</label>
                                <input type="number" step="0.01" id="checkout-tendered" class="shadcn-input" style="font-size: 18px; font-weight: 700; font-family: var(--font-mono); height: 42px;" oninput="PosView.calculateChange(this.value)" />
                                <div id="checkout-change-display" style="font-size: 13px; color: #22c55e; margin-top: 6px; font-weight: 600;"></div>
                            </div>
                        </div>
                        <div class="shadcn-modal-footer">
                            <button type="button" class="shadcn-btn-secondary" onclick="PosView.closeCheckoutModal()">Cancel</button>
                            <button type="submit" id="btn-confirm-sale" class="shadcn-btn-primary" style="background: #22c55e; color: #09090b; border-color: #22c55e;">
                                Finalize Bill & Print
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal 2: 80mm Thermal Receipt Document & Instant Download -->
            <div id="modal-pos-receipt" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 440px;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title">Tax Invoice Thermal Receipt</h3>
                            <div style="font-size: 11px; color: var(--text-muted);">Unique Sequential Bill Generated</div>
                        </div>
                        <button class="shadcn-modal-close" onclick="PosView.closeReceiptModal()">Close</button>
                    </div>
                    <div class="shadcn-modal-body" style="padding: 16px; background: #000000; overflow-x: auto;">
                        <div id="receipt-print-area">
                            <!-- Thermal Receipt Rendered Here -->
                        </div>
                    </div>
                    <div class="shadcn-modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                        <button type="button" class="shadcn-btn-secondary" onclick="PosView.closeReceiptModal()">
                            Close
                        </button>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="PosView.downloadThermalSlip()">
                                Download Slip
                            </button>
                            <button type="button" class="shadcn-btn-primary" onclick="PosView.printReceipt()">
                                Print Receipt (80mm)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal 3: Manage Multi-Counter Network -->
            <div id="modal-manage-counters" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 480px;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title">Multi-Counter Station Network</h3>
                            <div style="font-size: 11px; color: var(--text-muted);">Assign dedicated POS counters across retail hubs</div>
                        </div>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-manage-counters').style.display='none'">&times;</button>
                    </div>
                    <div class="shadcn-modal-body">
                        <div style="margin-bottom: 16px;">
                            <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: block;">Active Counters in System</label>
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
                        </div>

                        <div style="padding-top: 14px; border-top: 1px solid #222226;">
                            <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: block;">+ Add New Counter Station</label>
                            <div style="display: grid; grid-template-columns: 1fr 100px; gap: 8px;">
                                <input type="text" id="new-counter-name" class="shadcn-input" placeholder="e.g. Counter 05 - Drive Thru" />
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
    },

    // --------------------------------------------------------------------------
    // BARCODE SCANNING & AUDIBLE FEEDBACK
    // --------------------------------------------------------------------------
    playScanBeep(isSuccess = true) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (isSuccess) {
                osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch crisp beep
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else {
                osc.frequency.setValueAtTime(300, ctx.currentTime); // Low buzz for not found
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.18);
            }
        } catch (_) {}
    },

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
                this.playScanBeep(true);
                this.addToCart(match.id);
                App.showToast(`Scanned: ${match.name}`, 'success');
                input.value = '';
                input.focus();
            } else {
                this.playScanBeep(false);
                App.showToast(`Barcode "${code}" not found in catalog`, 'danger');
                input.select();
            }
        }
    },

    // --------------------------------------------------------------------------
    // CUSTOMER MOBILE NUMBER REAL-TIME LOOKUP
    // --------------------------------------------------------------------------
    async handlePhoneLookup(rawPhone) {
        const phone = rawPhone.replace(/\D/g, ''); // Numbers only
        this.currentCustomer.phone = phone;

        const badge = document.getElementById('cust-sync-badge');
        const feedback = document.getElementById('cust-phone-feedback');
        const nameInput = document.getElementById('pos-cust-name');

        if (phone.length < 10) {
            if (badge) { badge.className = 'shadcn-badge default'; badge.innerText = 'Walk-in Cash'; }
            if (feedback) feedback.innerText = `Enter 10-digit mobile number (${phone.length}/10)...`;
            return;
        }

        // Search local cache first
        const match = this.customers.find(c => c.phone && c.phone.replace(/\D/g, '').endsWith(phone.slice(-10)));
        if (match) {
            this.currentCustomer = {
                id: match.id,
                name: match.name,
                phone: match.phone || phone,
                is_verified: true
            };
            if (nameInput) nameInput.value = match.name;
            if (badge) { badge.className = 'shadcn-badge green'; badge.innerText = 'Verified Customer'; }
            if (feedback) feedback.innerHTML = `<span style="color: #4ade80;">Found: <strong>${match.name}</strong> • ${match.code}</span>`;
            App.showToast(`Found verified customer: ${match.name}`, 'success');
            return;
        }

        // Query Supabase directly
        try {
            if (feedback) feedback.innerText = 'Searching Supabase customer registry...';
            const res = await window.SupabaseClient.restRequest(`customers?phone=ilike.*${phone.slice(-10)}*&limit=1`);
            if (res && res.length > 0) {
                const c = res[0];
                this.currentCustomer = {
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    is_verified: true
                };
                if (nameInput) nameInput.value = c.name;
                if (badge) { badge.className = 'shadcn-badge green'; badge.innerText = 'Verified Customer'; }
                if (feedback) feedback.innerHTML = `<span style="color: #4ade80;">Found: <strong>${c.name}</strong> • ${c.code}</span>`;
                return;
            }
        } catch (_) {}

        // New customer
        if (badge) { badge.className = 'shadcn-badge yellow'; badge.innerText = '+ New Customer'; }
        if (feedback) feedback.innerHTML = `<span style="color: #fbbf24;">New Customer: Enter customer name to register upon checkout.</span>`;
    },

    updateCustomerName(name) {
        if (name && name.trim()) {
            this.currentCustomer.name = name.trim();
        }
    },

    // --------------------------------------------------------------------------
    // MULTI-COUNTER NETWORK CONTROLS
    // --------------------------------------------------------------------------
    switchCounter(counterId) {
        if (window.StoreConfig) {
            window.StoreConfig.setActiveCounter(counterId);
            this.activeCounter = window.StoreConfig.getActiveCounter();
            App.showToast(`Switched active terminal to: ${this.activeCounter.name}`, 'info');
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
            return `<div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 40px;">No products match your search or category filter.</div>`;
        }

        return items.map(p => {
            const price = (p.selling_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            return `
                <div class="pos-item-card" onclick="PosView.addToCart('${p.id}')">
                    <div>
                        <div style="font-size: 11px; color: #60a5fa; font-weight: 700; text-transform: uppercase;">${p.category || 'General'}</div>
                        <div style="font-size: 14px; font-weight: 700; color: #fff; margin: 4px 0 6px 0; line-height: 1.3;">${p.name}</div>
                        <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                            SKU: ${p.sku} ${p.barcode ? `• Barcode: ${p.barcode}` : ''}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #1c1c20;">
                        <span style="font-size: 15px; font-weight: 800; color: #22c55e; font-family: var(--font-mono);">₹${price}</span>
                        <span class="shadcn-badge blue" style="cursor: pointer;">+ Add</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // --------------------------------------------------------------------------
    // CART OPERATIONS & DETERMINISTIC TAX CALCULATIONS
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
        if (window.PosHardware && window.PosHardware.updateCustomerDisplay) {
            window.PosHardware.updateCustomerDisplay(this.cart);
        }
    },

    renderCartItems() {
        if (this.cart.length === 0) {
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 180px; color: var(--text-muted);">
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
                        <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">₹${unit} each</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 12px; height: 26px;" onclick="PosView.updateQty(${idx}, -1)">-</button>
                        <span style="font-weight: 700; font-family: var(--font-mono); width: 24px; text-align: center; color: #fff;">${item.quantity}</span>
                        <button class="shadcn-btn-secondary" style="padding: 2px 7px; font-size: 12px; height: 26px;" onclick="PosView.updateQty(${idx}, 1)">+</button>
                    </div>
                    <div style="width: 85px; text-align: right; font-weight: 700; font-family: var(--font-mono); color: #fff;">
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

        const computedItems = this.cart.map(item => {
            const qty = Math.max(1, Number(item.quantity) || 1);
            const unitPrice = Number(item.unit_price) || 0;
            const gross = qty * unitPrice;
            subtotal += gross;

            const discBps = Number(item.discount_bps) || 0;
            const discAmount = discBps > 0 ? Math.round((gross * discBps) / 10000) : 0;
            const netTaxable = gross - discAmount;
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
                discount_bps: discBps,
                discount_amount: discAmount,
                net_taxable: netTaxable,
                tax_rate_bps: taxRate,
                cgst_amount: itemCgst,
                sgst_amount: itemSgst,
                igst_amount: itemIgst,
                line_total: lineTotal
            };
        });

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
            grand_total: rounded,
            items: computedItems
        };
    },

    updateTotals() {
        const totalsEl = document.getElementById('pos-totals-box');
        if (totalsEl) totalsEl.innerHTML = this.renderTotals();

        const btn = document.getElementById('pos-btn-pay');
        if (btn) {
            btn.disabled = this.cart.length === 0;
            btn.innerText = `Pay & Print Bill (${this.getFormattedGrandTotal()})`;
        }
    },

    renderTotals() {
        const q = this.calculateQuotation();
        const sub = (q.subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const tax = (q.tax_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const grand = (q.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

        return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span style="color: var(--text-muted);">Taxable Base</span>
                <span style="font-family: var(--font-mono); color: #fff;">₹${sub}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span style="color: var(--text-muted);">${this.isInterState ? 'IGST (18%)' : 'CGST (9%) + SGST (9%)'}</span>
                <span style="font-family: var(--font-mono); color: #60a5fa;">₹${tax}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid #222226; font-size: 16px; font-weight: 800;">
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
    // CHECKOUT MODAL & CHANGE DUE
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
        this.calculateChange((q.grand_total / 100).toFixed(2));

        if (modal) modal.style.display = 'flex';
    },

    closeCheckoutModal() {
        const modal = document.getElementById('modal-pos-checkout');
        if (modal) modal.style.display = 'none';
    },

    setPaymentMethod(method) {
        // Handled via radio checked
    },

    calculateChange(tenderedVal) {
        const q = this.calculateQuotation();
        const tendered = Math.round(parseFloat(tenderedVal || '0') * 100);
        const change = tendered - q.grand_total;
        const changeEl = document.getElementById('checkout-change-display');
        if (!changeEl) return;

        if (change >= 0) {
            changeEl.style.color = '#22c55e';
            changeEl.innerText = `Change Due to Customer: ₹${(change / 100).toFixed(2)}`;
        } else {
            changeEl.style.color = '#ef4444';
            changeEl.innerText = `Amount Short: ₹${(Math.abs(change) / 100).toFixed(2)}`;
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
        const payMethod = document.querySelector('input[name="pay-method"]:checked')?.value || 'CASH';
        const tenderedVal = document.getElementById('checkout-tendered')?.value || '0';
        const tenderedCents = Math.round(parseFloat(tenderedVal) * 100);
        const changeCents = Math.max(0, tenderedCents - q.grand_total);

        try {
            // Settle with Supabase
            const invoice = await window.SupabaseClient.checkoutSale({
                customer_name: this.currentCustomer.name,
                customer_phone: this.currentCustomer.phone,
                is_interstate: this.isInterState,
                counter_name: this.activeCounter ? this.activeCounter.name : 'Counter 01',
                payment_method: payMethod,
                amount_tendered_cents: tenderedCents,
                change_due_cents: changeCents,
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
            App.showToast(`Bill ${invoice.invoice_number} saved to Supabase!`, 'success');
            
            // Show Thermal Receipt
            this.renderThermalReceipt(this.lastInvoice);
            this.clearCart();
        } catch (err) {
            App.showToast(`Checkout failed: ${err.message}`, 'danger');
            if (btn) { btn.disabled = false; btn.innerText = 'Generate Bill & Print Receipt'; }
        }
    },

    // --------------------------------------------------------------------------
    // THERMAL RECEIPT RENDERING, PRINTING & FILE DOWNLOAD
    // --------------------------------------------------------------------------
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

        // Generate dynamic SVG Barcode & QR Code
        const barcodeSvg = window.BarcodeQR ? window.BarcodeQR.code128(inv.invoice_number, { width: 220, height: 42, showText: true }) : '';
        const upiUrl = window.BarcodeQR ? window.BarcodeQR.getUpiUrl(store, inv) : '';
        const qrSvg = (window.BarcodeQR && upiUrl) ? window.BarcodeQR.qr(upiUrl, { size: 100 }) : '';

        area.innerHTML = `
            <div id="printable-thermal-slip" style="width: 320px; margin: 0 auto; background: #ffffff; color: #000000; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.35; padding: 18px 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
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
                    <span>${inv.cashier_name || 'Aman Verma'}</span>
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
                    <span>Taxable Value:</span>
                    <span>₹${sub}</span>
                </div>
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

                <!-- Dynamic UPI QR Code for instant smartphone payment -->
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
    },

    printReceipt() {
        const content = document.getElementById('printable-thermal-slip');
        if (!content) return;

        // Auto-open cash drawer on receipt print if cash payment
        if (window.PosHardware && (this.lastInvoice && this.lastInvoice.payment_method === 'CASH')) {
            window.PosHardware.kickCashDrawer().catch(() => {});
        }

        const printWindow = window.open('', '_blank', 'width=380,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${this.lastInvoice ? this.lastInvoice.invoice_number : 'POS'}</title>
                <style>
                    @page { size: 80mm auto; margin: 0; }
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
    }
};

window.PosView = PosView;
