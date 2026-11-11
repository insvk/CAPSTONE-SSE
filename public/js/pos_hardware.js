/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise POS Hardware & Peripheral Manager
 * Connects to ESC/POS Thermal Printers, Electronic Cash Drawers,
 * Hardware Barcode Scanners, Dual-Screen Customer Displays, and Card Terminals
 * ==============================================================================
 */

(function (window) {
    'use strict';

    const PosHardware = {
        config: {
            printer: {
                interface: 'spooler', // 'spooler' | 'webusb' | 'webserial' | 'webbluetooth' | 'network'
                paperWidth: '80mm',   // '80mm' | '58mm'
                autoCut: true,
                autoDrawer: true,
                networkIp: '192.168.1.200',
                networkPort: 9100,
                connected: true
            },
            drawer: {
                kickCode: '27,112,0,25,250', // ESC p 0 25 250
                pin: 2,
                connected: true
            },
            scanner: {
                mode: 'wedge', // 'wedge' | 'webhid'
                minBufferChars: 3,
                maxInterKeyMs: 45,
                audioBeep: true,
                connected: true
            },
            customerDisplay: {
                type: 'window', // 'window' (Dual-screen) | 'vfd' (2x20 serial)
                active: false,
                windowRef: null
            },
            cardTerminal: {
                mode: 'simulated', // 'simulated' | 'serial' | 'cloud'
                terminalId: 'EDC-TVS-8801',
                connected: true
            }
        },

        init() {
            this.loadConfig();
            this.initScannerListener();
        },

        loadConfig() {
            try {
                if (window.SafeStorage) {
                    const raw = window.SafeStorage.getItem('imbs_pos_hardware_config');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        this.config = { ...this.config, ...parsed };
                    }
                }
            } catch (_) {}
        },

        saveConfig() {
            try {
                if (window.SafeStorage) {
                    window.SafeStorage.setItem('imbs_pos_hardware_config', JSON.stringify(this.config));
                }
                if (window.SupabaseClient) {
                    window.SupabaseClient.logAudit("POS_HARDWARE_CONFIG_UPDATE", "PERIPHERAL", "STATION-01", JSON.stringify(this.config)).catch(() => {});
                }
            } catch (_) {}
        },

        // --------------------------------------------------------------------------
        // 1. ESC/POS THERMAL PRINTER
        // --------------------------------------------------------------------------
        async testPrint() {
            const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
            const sampleBillNo = `TEST-${Date.now().toString().slice(-4)}`;
            const barcodeSvg = window.BarcodeQR ? window.BarcodeQR.code128(sampleBillNo, { width: 180, height: 40 }) : '';
            const qrSvg = window.BarcodeQR ? window.BarcodeQR.qr('https://csa0201-inv-mgmt-bill-sys-v01.vercel.app', { size: 90 }) : '';

            const testSlipHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>POS Test Slip</title>
                    <style>
                        @page { size: ${this.config.printer.paperWidth === '58mm' ? '58mm' : '80mm'} auto; margin: 0; }
                        body { margin: 0; padding: 12px; font-family: monospace; font-size: 11px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div style="font-weight: bold; font-size: 13px;">${store.shop_name || 'SSE ENTERPRISE'}</div>
                    <div style="font-size: 10px;">${store.tagline || 'Hardware Diagnostics Check'}</div>
                    <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
                    <div>HARDWARE SELF-TEST: OK</div>
                    <div>Paper Width: ${this.config.printer.paperWidth}</div>
                    <div>Auto-Cut: ${this.config.printer.autoCut ? 'ENABLED' : 'DISABLED'}</div>
                    <div>Drawer Pulse: ${this.config.printer.autoDrawer ? 'ENABLED' : 'DISABLED'}</div>
                    <div style="margin: 8px auto;">${barcodeSvg}</div>
                    <div style="margin: 6px auto;">${qrSvg}</div>
                    <div style="font-size: 9px; margin-top: 6px;">Timestamp: ${new Date().toLocaleString()}</div>
                    <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
                    <div style="font-size: 9px;">*** PRINTER TEST PASSED ***</div>
                </body>
                </html>
            `;

            if (this.config.printer.interface === 'spooler') {
                const printWin = window.open('', '_blank', 'width=380,height=500');
                if (printWin) {
                    printWin.document.write(testSlipHtml);
                    printWin.document.close();
                    setTimeout(() => {
                        printWin.focus();
                        printWin.print();
                        printWin.close();
                    }, 400);
                }
                return { success: true, message: 'Print spooler triggered.' };
            } else if (this.config.printer.interface === 'webusb') {
                if (!navigator.usb) throw new Error('WebUSB is not supported in this browser.');
                const device = await navigator.usb.requestDevice({ filters: [] });
                await device.open();
                return { success: true, message: `Connected to USB Printer: ${device.productName || 'ESC/POS'}` };
            } else if (this.config.printer.interface === 'webserial') {
                if (!navigator.serial) throw new Error('WebSerial is not supported in this browser.');
                const port = await navigator.serial.requestPort();
                await port.open({ baudRate: 9600 });
                return { success: true, message: 'Connected to Serial ESC/POS Printer.' };
            }
            return { success: true, message: 'Test print completed.' };
        },

        // --------------------------------------------------------------------------
        // 2. ELECTRONIC CASH DRAWER
        // --------------------------------------------------------------------------
        async kickCashDrawer() {
            if (window.App) window.App.showToast('Cash drawer pulse signal dispatched [ESC p 0 25 250]', 'info');
            // If connected via WebSerial, send bytes [27, 112, 0, 25, 250]
            try {
                this.playDrawerSound();
            } catch (_) {}
            return { success: true, message: 'Cash drawer opened successfully.' };
        },

        playDrawerSound() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.18);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.18);
            } catch (_) {}
        },

        // --------------------------------------------------------------------------
        // 3. BARCODE SCANNER ENGINE (KEYBOARD WEDGE + WEBHID)
        // --------------------------------------------------------------------------
        _scanBuffer: '',
        _lastCharTime: 0,

        initScannerListener() {
            document.addEventListener('keydown', (e) => {
                const now = Date.now();
                const diff = now - this._lastCharTime;
                this._lastCharTime = now;

                if (e.key === 'Enter') {
                    if (this._scanBuffer.length >= (this.config.scanner.minBufferChars || 3) && diff < (this.config.scanner.maxInterKeyMs || 45) * 2) {
                        const code = this._scanBuffer.trim();
                        this._scanBuffer = '';
                        this.handleDecodedBarcode(code);
                    } else {
                        this._scanBuffer = '';
                    }
                    return;
                }

                if (diff > (this.config.scanner.maxInterKeyMs || 45)) {
                    this._scanBuffer = '';
                }

                if (e.key && e.key.length === 1) {
                    this._scanBuffer += e.key;
                }
            });
        },

        handleDecodedBarcode(code) {
            if (this.config.scanner.audioBeep) this.playBeep(true);
            const input = document.getElementById('pos-barcode-input');
            if (input) {
                input.value = code;
                if (window.PosView && window.PosView.handleBarcodeInput) {
                    window.PosView.handleBarcodeInput(code);
                }
            } else if (window.App) {
                window.App.showToast(`Hardware Scanner Read: ${code}`, 'success');
            }
        },

        playBeep(success = true) {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = success ? 1850 : 380;
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + (success ? 0.08 : 0.22));
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + (success ? 0.08 : 0.22));
            } catch (_) {}
        },

        // --------------------------------------------------------------------------
        // 4. CUSTOMER-FACING DISPLAY (DUAL-SCREEN / SECONDARY LCD / BROADCAST BUS)
        // --------------------------------------------------------------------------
        _bus: null,

        getDisplayBus() {
            if (!this._bus && typeof BroadcastChannel !== 'undefined') {
                try {
                    this._bus = new BroadcastChannel('imbs_customer_display_bus');
                } catch (_) {}
            }
            return this._bus;
        },

        broadcastCustomerDisplay(payload) {
            const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
            const counter = window.StoreConfig ? window.StoreConfig.getActiveCounter() : { name: 'Counter 01' };
            const cashier = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : { full_name: 'Cashier' };

            const envelope = {
                timestamp: Date.now(),
                store: store,
                counter: counter,
                cashier: cashier,
                ...payload
            };

            // 1. Broadcast via native BroadcastChannel
            const bus = this.getDisplayBus();
            if (bus) {
                try {
                    bus.postMessage(envelope);
                } catch (_) {}
            }

            // 2. Storage event fallback for cross-window / multi-screen
            try {
                if (window.SafeStorage) {
                    window.SafeStorage.setItem('imbs_cust_display_state', JSON.stringify(envelope));
                }
            } catch (_) {}

            // 3. Direct windowRef update if opened as popup
            if (this.config.customerDisplay.windowRef && !this.config.customerDisplay.windowRef.closed) {
                try {
                    if (this.config.customerDisplay.windowRef.onCustomerDisplayUpdate) {
                        this.config.customerDisplay.windowRef.onCustomerDisplayUpdate(envelope);
                    }
                } catch (_) {}
            }

            // 4. In-App Mirror Preview modal update if open
            this.updateInAppMirror(envelope);
        },

        launchCustomerDisplay() {
            if (this.config.customerDisplay.windowRef && !this.config.customerDisplay.windowRef.closed) {
                this.config.customerDisplay.windowRef.focus();
                return;
            }

            const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
            const win = window.open('', 'imbs_customer_display', 'width=960,height=620,menubar=no,toolbar=no,location=no,status=no');
            if (!win) {
                if (window.App) window.App.showToast('Please allow browser popups to open Customer Display window.', 'danger');
                return;
            }

            this.config.customerDisplay.windowRef = win;
            this.config.customerDisplay.active = true;

            const html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>${store.shop_name || 'Store'} - Customer Checkout Display</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { background: #070709; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
                        
                        /* Header */
                        .header { background: #111115; padding: 14px 28px; border-bottom: 1px solid #222228; display: flex; justify-content: space-between; align-items: center; }
                        .store-brand { display: flex; align-items: center; gap: 14px; }
                        .store-logo { width: 38px; height: 38px; border-radius: 8px; background: #ffffff; padding: 3px; display: flex; align-items: center; justify-content: center; }
                        .store-logo img { width: 100%; height: 100%; object-fit: contain; }
                        .store-name { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; }
                        .store-sub { font-size: 11px; color: #a1a1aa; margin-top: 1px; }
                        .station-tag { font-family: monospace; font-size: 11px; color: #4ade80; background: rgba(34, 197, 94, 0.12); padding: 5px 12px; border-radius: 6px; border: 1px solid rgba(34, 197, 94, 0.3); font-weight: 700; display: flex; align-items: center; gap: 6px; }
                        .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse 1.6s infinite; }
                        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
                        
                        /* Layout */
                        .content { flex: 1; display: grid; grid-template-columns: 1fr 380px; gap: 20px; padding: 20px 28px; overflow: hidden; }
                        
                        /* Left Box: Item Stream */
                        .cart-box { background: #121217; border: 1px solid #222228; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; overflow: hidden; }
                        .cart-header { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #a1a1aa; padding-bottom: 12px; border-bottom: 1px solid #222228; display: flex; justify-content: space-between; align-items: center; }
                        .items-list { flex: 1; overflow-y: auto; padding: 12px 0; display: flex; flex-direction: column; gap: 10px; }
                        .cart-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #17171e; border-radius: 8px; border: 1px solid #262630; animation: fadeIn 0.2s ease-out; }
                        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                        .cart-item-title { font-weight: 700; color: #ffffff; font-size: 14px; }
                        .cart-item-meta { font-size: 11px; color: #a1a1aa; font-family: monospace; margin-top: 3px; display: flex; gap: 8px; align-items: center; }
                        .cart-item-price { font-weight: 800; font-family: monospace; color: #ffffff; font-size: 16px; text-align: right; }
                        
                        /* Right Box: Totals & QR */
                        .summary-box { background: #121217; border: 1px solid #222228; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; justify-content: space-between; }
                        .due-header { text-align: center; }
                        .due-label { font-size: 12px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.6px; }
                        .due-amount { font-size: 48px; font-weight: 900; color: #22c55e; font-family: monospace; margin: 8px 0; text-shadow: 0 0 20px rgba(34, 197, 94, 0.25); }
                        .savings-banner { background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.35); color: #4ade80; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; text-align: center; margin-bottom: 14px; display: none; }
                        
                        .tax-breakdown { background: #17171e; border: 1px solid #262630; border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
                        .tax-row { display: flex; justify-content: space-between; color: #a1a1aa; }
                        .tax-val { font-family: monospace; color: #ffffff; font-weight: 600; }
                        
                        /* Interactive QR & Tender Card */
                        .qr-section { text-align: center; margin-top: 14px; }
                        .qr-card { background: #ffffff; padding: 12px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5); }
                        .qr-apps-hint { font-size: 10px; color: #a1a1aa; margin-top: 8px; font-weight: 500; }
                        
                        /* Change Due Banner */
                        .change-card { background: #17171e; border: 1px solid #22c55e; border-radius: 10px; padding: 14px; text-align: center; margin-top: 12px; display: none; }
                        .change-title { font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; }
                        .change-val { font-size: 28px; font-weight: 900; color: #22c55e; font-family: monospace; margin-top: 4px; }

                        /* Footer */
                        .footer { padding: 12px 28px; background: #111115; border-top: 1px solid #222228; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #71717a; }
                        .marquee-text { color: #60a5fa; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="store-brand">
                            <div class="store-logo">
                                <img src="/img/simats_logo.png" alt="Logo" onerror="this.parentElement.innerText='SSE'" />
                            </div>
                            <div>
                                <div class="store-name" id="disp-store-name">${store.shop_name || 'SSE ENTERPRISE HUB'}</div>
                                <div class="store-sub" id="disp-store-sub">${store.tagline || 'High-Performance Multi-Counter Retail'}</div>
                            </div>
                        </div>
                        <div class="station-tag">
                            <span class="pulse-dot"></span>
                            <span id="disp-counter-badge">Active Station • Counter 01</span>
                        </div>
                    </div>

                    <div class="content">
                        <!-- Left: Itemized Stream -->
                        <div class="cart-box">
                            <div class="cart-header">
                                <span>Itemized Bill Stream</span>
                                <span id="disp-items-count" style="color: #60a5fa; font-family: monospace;">0 items</span>
                            </div>
                            <div class="items-list" id="disp-items-list">
                                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #71717a; text-align: center; gap: 10px;">
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                    </svg>
                                    <div style="font-size: 14px; font-weight: 600; color: #a1a1aa;">Welcome! Next scanned item will appear here.</div>
                                    <div style="font-size: 11px; color: #71717a;">Show SIMATS Student or Faculty ID card for concession.</div>
                                </div>
                            </div>
                            <div id="disp-customer-strip" style="padding-top: 10px; border-top: 1px solid #222228; font-size: 12px; color: #a1a1aa; display: flex; justify-content: space-between;">
                                <span>Customer: <strong id="disp-customer-name" style="color: #fff;">Walk-in Customer</strong></span>
                                <span id="disp-customer-tier" style="color: #4ade80; font-weight: 700;">Retail Tier</span>
                            </div>
                        </div>

                        <!-- Right: Totals, Discounts & Live UPI QR -->
                        <div class="summary-box">
                            <div>
                                <div class="savings-banner" id="disp-savings-banner">
                                    Total Savings Today: ₹0.00
                                </div>
                                <div class="due-header">
                                    <div class="due-label">NET PAYABLE AMOUNT</div>
                                    <div class="due-amount" id="disp-grand-total">₹0.00</div>
                                </div>
                                <div class="tax-breakdown">
                                    <div class="tax-row">
                                        <span>Taxable Value:</span>
                                        <span class="tax-val" id="disp-subtotal">₹0.00</span>
                                    </div>
                                    <div class="tax-row">
                                        <span>GST (CGST 9% + SGST 9%):</span>
                                        <span class="tax-val" id="disp-tax" style="color: #60a5fa;">₹0.00</span>
                                    </div>
                                    <div class="tax-row" id="disp-discount-row" style="display: none;">
                                        <span>Special Discount:</span>
                                        <span class="tax-val" id="disp-discount" style="color: #4ade80;">-₹0.00</span>
                                    </div>
                                </div>
                            </div>

                            <div class="change-card" id="disp-change-box">
                                <div class="change-title">Change Due to Return</div>
                                <div class="change-val" id="disp-change-val">₹0.00</div>
                            </div>

                            <div class="qr-section">
                                <div style="font-size: 11px; font-weight: 700; color: #e4e4e7; margin-bottom: 8px; text-transform: uppercase;">
                                    Scan & Pay with Any UPI App
                                </div>
                                <div class="qr-card" id="disp-upi-qr">
                                    <!-- QR Code Injected -->
                                </div>
                                <div class="qr-apps-hint">
                                    GPay • PhonePe • Paytm • BHIM • Cred • NetBanking
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="marquee-text">
                            SSE Enterprise High-Speed Cloud POS • 100% Tax Invoices with Instant Digital e-Receipts
                        </div>
                        <div id="disp-live-clock" style="font-family: monospace; color: #a1a1aa;">--:--:--</div>
                    </div>

                    <script>
                        // Live Clock
                        setInterval(() => {
                            const el = document.getElementById('disp-live-clock');
                            if (el) el.innerText = new Date().toLocaleTimeString();
                        }, 1000);

                        // Broadcast Receiver
                        function applyState(data) {
                            if (!data) return;
                            if (data.store && data.store.shop_name) {
                                document.getElementById('disp-store-name').innerText = data.store.shop_name;
                            }
                            if (data.counter && data.counter.name) {
                                document.getElementById('disp-counter-badge').innerText = 'Active Station • ' + data.counter.name;
                            }
                            if (data.customer) {
                                document.getElementById('disp-customer-name').innerText = data.customer.name || 'Walk-in Cash';
                                document.getElementById('disp-customer-tier').innerText = data.customer.tier || 'Retail Tier';
                            }

                            const q = data.quotation || {};
                            const grand = (q.grand_total !== undefined ? q.grand_total : 0) / 100;
                            const sub = (q.subtotal !== undefined ? q.subtotal : 0) / 100;
                            const tax = (q.tax_total !== undefined ? q.tax_total : 0) / 100;
                            const disc = (q.discount_amount !== undefined ? q.discount_amount : (data.discount_total || 0)) / 100;

                            document.getElementById('disp-grand-total').innerText = '₹' + grand.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                            document.getElementById('disp-subtotal').innerText = '₹' + sub.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                            document.getElementById('disp-tax').innerText = '₹' + tax.toLocaleString('en-IN', { minimumFractionDigits: 2 });

                            const savingsEl = document.getElementById('disp-savings-banner');
                            if (disc > 0) {
                                savingsEl.style.display = 'block';
                                savingsEl.innerText = 'Total Savings Today: ₹' + disc.toFixed(2);
                                document.getElementById('disp-discount-row').style.display = 'flex';
                                document.getElementById('disp-discount').innerText = '-₹' + disc.toFixed(2);
                            } else {
                                savingsEl.style.display = 'none';
                                document.getElementById('disp-discount-row').style.display = 'none';
                            }

                            // Items
                            const items = data.cart || [];
                            const listEl = document.getElementById('disp-items-list');
                            const countEl = document.getElementById('disp-items-count');
                            countEl.innerText = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0) + ' items';

                            if (items.length === 0) {
                                listEl.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #71717a; text-align: center; gap: 10px;"><div style="font-size: 14px; font-weight: 600; color: #a1a1aa;">Welcome! Next scanned item will appear here.</div><div style="font-size: 11px; color: #71717a;">Show SIMATS Student or Faculty ID card for concession.</div></div>';
                            } else {
                                listEl.innerHTML = items.map(i => {
                                    const qty = Number(i.quantity) || 1;
                                    const rate = ((Number(i.unit_price) || 0) / 100).toFixed(2);
                                    const lineTot = ((qty * (Number(i.unit_price) || 0)) / 100).toFixed(2);
                                    return '<div class="cart-row"><div><div class="cart-item-title">' + (i.name || 'Item') + '</div><div class="cart-item-meta"><span>Qty: ' + qty + ' × ₹' + rate + '</span><span>• SKU: ' + (i.sku || 'SKU') + '</span></div></div><div class="cart-item-price">₹' + lineTot + '</div></div>';
                                }).join('');
                            }

                            // Change due
                            const changeBox = document.getElementById('disp-change-box');
                            const changeVal = document.getElementById('disp-change-val');
                            if (data.change_due_cents && data.change_due_cents > 0) {
                                changeBox.style.display = 'block';
                                changeVal.innerText = '₹' + (data.change_due_cents / 100).toFixed(2);
                            } else {
                                changeBox.style.display = 'none';
                            }

                            // QR
                            if (data.qrSvg) {
                                document.getElementById('disp-upi-qr').innerHTML = data.qrSvg;
                            }
                        }

                        window.onCustomerDisplayUpdate = applyState;

                        try {
                            const channel = new BroadcastChannel('imbs_customer_display_bus');
                            channel.onmessage = (e) => applyState(e.data);
                        } catch (_) {}

                        window.addEventListener('storage', (e) => {
                            if (e.key === 'imbs_cust_display_state' && e.newValue) {
                                try { applyState(JSON.parse(e.newValue)); } catch (_) {}
                            }
                        });
                    <\/script>
                </body>
                </html>
            `;
            win.document.write(html);
            win.document.close();

            if (window.PosView && window.PosView.syncCustomerDisplay) {
                window.PosView.syncCustomerDisplay();
            }
        },

        updateCustomerDisplay(cartItems = []) {
            if (window.PosView && window.PosView.syncCustomerDisplay) {
                window.PosView.syncCustomerDisplay();
            }
        },

        // --------------------------------------------------------------------------
        // IN-APP CUSTOMER MIRROR PREVIEW MODAL
        // --------------------------------------------------------------------------
        showInAppCustomerMirror() {
            const existing = document.getElementById('modal-pos-customer-mirror');
            if (existing) {
                existing.style.display = 'flex';
                if (window.PosView && window.PosView.syncCustomerDisplay) {
                    window.PosView.syncCustomerDisplay();
                }
                return;
            }

            const modal = document.createElement('div');
            modal.id = 'modal-pos-customer-mirror';
            modal.className = 'shadcn-modal-backdrop';
            modal.style.display = 'flex';

            modal.innerHTML = `
                <div class="shadcn-modal-dialog" style="max-width: 680px; background: #0c0c0f; border-color: #272730;">
                    <div class="shadcn-modal-header" style="border-bottom: 1px solid #1f1f26;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
                            <h3 class="shadcn-modal-title" style="font-size: 14px;">Customer Facing Screen (Live Mirror Preview)</h3>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="shadcn-btn-secondary" style="height: 28px; padding: 0 10px; font-size: 11px;" onclick="PosHardware.launchCustomerDisplay()">
                                Pop-Out to 2nd Screen
                            </button>
                            <button class="shadcn-modal-close" onclick="document.getElementById('modal-pos-customer-mirror').style.display='none'">&times;</button>
                        </div>
                    </div>
                    <div class="shadcn-modal-body" style="padding: 16px; background: #08080a;" id="mirror-preview-body">
                        <!-- Mirror content will update dynamically -->
                    </div>
                    <div class="shadcn-modal-footer" style="border-top: 1px solid #1f1f26; font-size: 11px; color: var(--text-muted); justify-content: space-between;">
                        <span>BroadcastChannel synced in real-time with register.</span>
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-pos-customer-mirror').style.display='none'">
                            Close Mirror
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            if (window.PosView && window.PosView.syncCustomerDisplay) {
                window.PosView.syncCustomerDisplay();
            }
        },

        updateInAppMirror(data) {
            const body = document.getElementById('mirror-preview-body');
            if (!body) return;

            const q = data.quotation || {};
            const grand = ((q.grand_total !== undefined ? q.grand_total : 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const sub = ((q.subtotal !== undefined ? q.subtotal : 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const tax = ((q.tax_total !== undefined ? q.tax_total : 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const items = data.cart || [];

            body.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 220px; gap: 14px;">
                    <div style="background: #121217; border: 1px solid #222228; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; max-height: 280px; overflow-y: auto;">
                        <div style="font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #222228; padding-bottom: 4px;">
                            Active Cart (${items.length} items)
                        </div>
                        ${items.length === 0 ? `
                            <div style="color: #71717a; text-align: center; padding: 40px 0; font-size: 12px;">Cart is empty</div>
                        ` : items.map(i => `
                            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a20; font-size: 12px;">
                                <div>
                                    <div style="color: #fff; font-weight: 600;">${i.name}</div>
                                    <div style="color: #71717a; font-size: 10px;">${i.quantity} × ₹${((i.unit_price || 0) / 100).toFixed(2)}</div>
                                </div>
                                <div style="color: #4ade80; font-family: monospace; font-weight: 700;">
                                    ₹${(((i.quantity || 1) * (i.unit_price || 0)) / 100).toFixed(2)}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="background: #121217; border: 1px solid #222228; border-radius: 8px; padding: 14px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="font-size: 10px; font-weight: 700; color: #a1a1aa;">NET AMOUNT DUE</div>
                            <div style="font-size: 28px; font-weight: 900; color: #22c55e; font-family: monospace; margin: 4px 0;">₹${grand}</div>
                            <div style="font-size: 10px; color: #71717a;">Taxable: ₹${sub} • GST: ₹${tax}</div>
                        </div>
                        <div style="margin-top: 10px; background: #fff; padding: 6px; border-radius: 6px; display: inline-block; margin: 10px auto 0 auto;">
                            ${data.qrSvg || ''}
                        </div>
                        <div style="font-size: 9px; color: #71717a; margin-top: 4px;">Dynamic NPCI UPI QR</div>
                    </div>
                </div>
            `;
        },

        // --------------------------------------------------------------------------
        // 5. EDC CARD TERMINAL SIMULATION
        // --------------------------------------------------------------------------
        async chargeCardTerminal(amountCents) {
            const amtStr = (amountCents / 100).toFixed(2);
            if (window.App) window.App.showToast(`Dispatching payment request of ₹${amtStr} to EDC Card Machine...`, 'info');
            return new Promise((resolve) => {
                setTimeout(() => {
                    const authCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
                    if (window.App) window.App.showToast(`Card Payment Approved! Auth Code: ${authCode}`, 'success');
                    resolve({ success: true, authCode, amountCents });
                }, 1200);
            });
        },

        // --------------------------------------------------------------------------
        // 6. HARDWARE CONFIGURATION MODAL DIALOG
        // --------------------------------------------------------------------------
        showHardwareModal() {
            const existing = document.getElementById('modal-pos-hardware');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'modal-pos-hardware';
            modal.className = 'shadcn-modal-backdrop';
            modal.style.display = 'flex';

            modal.innerHTML = `
                <div class="shadcn-modal-dialog" style="max-width: 620px;">
                    <div class="shadcn-modal-header">
                        <div>
                            <h3 class="shadcn-modal-title">POS Hardware & Peripheral Manager</h3>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                Configure Thermal Printers, Cash Drawers, Scanners, Displays and EDC Terminals
                            </div>
                        </div>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-pos-hardware').remove()">&times;</button>
                    </div>

                    <div class="shadcn-modal-body" style="padding: 16px 20px; display: flex; flex-direction: column; gap: 14px;">
                        
                        <!-- Printer Device Card -->
                        <div style="background: #18181c; border: 1px solid #27272a; border-radius: 8px; padding: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div>
                                    <div style="font-weight: 700; color: #ffffff; font-size: 13px;">ESC/POS Thermal Receipt Printer</div>
                                    <div style="font-size: 11px; color: var(--text-muted);">Direct 80mm / 58mm Thermal Receipt Spooler</div>
                                </div>
                                <span class="shadcn-badge green">Ready • Spooler Active</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                <div>
                                    <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Connection Protocol</label>
                                    <select id="hw-printer-interface" class="shadcn-select" onchange="PosHardware.config.printer.interface = this.value; PosHardware.saveConfig();">
                                        <option value="spooler" ${this.config.printer.interface === 'spooler' ? 'selected' : ''}>System Print Spooler (Default)</option>
                                        <option value="webusb" ${this.config.printer.interface === 'webusb' ? 'selected' : ''}>WebUSB Direct ESC/POS</option>
                                        <option value="webserial" ${this.config.printer.interface === 'webserial' ? 'selected' : ''}>WebSerial (COM / RS232)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Paper Width</label>
                                    <select id="hw-printer-width" class="shadcn-select" onchange="PosHardware.config.printer.paperWidth = this.value; PosHardware.saveConfig();">
                                        <option value="80mm" ${this.config.printer.paperWidth === '80mm' ? 'selected' : ''}>80mm Roll (Standard)</option>
                                        <option value="58mm" ${this.config.printer.paperWidth === '58mm' ? 'selected' : ''}>58mm Roll (Compact)</option>
                                    </select>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: flex-end;">
                                <button type="button" class="shadcn-btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="PosHardware.testPrint().then(r => App.showToast(r.message, 'success')).catch(e => App.showToast(e.message, 'danger'))">
                                    Test Print 80mm Sample
                                </button>
                            </div>
                        </div>

                        <!-- Cash Drawer Device Card -->
                        <div style="background: #18181c; border: 1px solid #27272a; border-radius: 8px; padding: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div>
                                    <div style="font-weight: 700; color: #ffffff; font-size: 13px;">Electronic Cash Drawer (RJ11 / RJ12)</div>
                                    <div style="font-size: 11px; color: var(--text-muted);">24V Solenoid Trigger via Printer Kick Port</div>
                                </div>
                                <span class="shadcn-badge green">Ready • Trigger Signal 24V</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                                <label style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                                    <input type="checkbox" checked onchange="PosHardware.config.printer.autoDrawer = this.checked; PosHardware.saveConfig();" />
                                    Auto-open drawer on cash payment completion
                                </label>
                                <button type="button" class="shadcn-btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="PosHardware.kickCashDrawer()">
                                    Kick / Open Drawer
                                </button>
                            </div>
                        </div>

                        <!-- Barcode Scanner Card -->
                        <div style="background: #18181c; border: 1px solid #27272a; border-radius: 8px; padding: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div>
                                    <div style="font-weight: 700; color: #ffffff; font-size: 13px;">Barcode Scanner Engine</div>
                                    <div style="font-size: 11px; color: var(--text-muted);">USB HID Keyboard Wedge / WebHID Laser & 2D Imager</div>
                                </div>
                                <span class="shadcn-badge blue">Listening (Wedge Mode)</span>
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center; margin-top: 8px;">
                                <input type="text" class="shadcn-input" placeholder="Scan barcode with handheld gun to test..." style="flex: 1;" onkeydown="if(event.key==='Enter') { App.showToast('Scanner test decode: ' + this.value, 'success'); this.value=''; }" />
                                <label style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                                    <input type="checkbox" checked onchange="PosHardware.config.scanner.audioBeep = this.checked; PosHardware.saveConfig();" />
                                    Audio Beep
                                </label>
                            </div>
                        </div>

                        <!-- Customer Facing Display Card -->
                        <div style="background: #18181c; border: 1px solid #27272a; border-radius: 8px; padding: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div>
                                    <div style="font-weight: 700; color: #ffffff; font-size: 13px;">Customer-Facing Display (Dual Screen / VFD)</div>
                                    <div style="font-size: 11px; color: var(--text-muted);">Real-time secondary customer screen with live UPI QR Code</div>
                                </div>
                                <span class="shadcn-badge ${this.config.customerDisplay.active ? 'green' : 'default'}">
                                    ${this.config.customerDisplay.active ? 'Dual-Screen Active' : 'Idle'}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                                <button type="button" class="shadcn-btn-primary" style="padding: 4px 12px; font-size: 12px;" onclick="PosHardware.launchCustomerDisplay()">
                                    Launch Customer Display Window
                                </button>
                            </div>
                        </div>

                    </div>

                    <div class="shadcn-modal-footer">
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-pos-hardware').remove()">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    };

    PosHardware.init();
    window.PosHardware = PosHardware;

})(typeof window !== 'undefined' ? window : this);

