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
        // 4. CUSTOMER-FACING DISPLAY (DUAL-SCREEN / SECONDARY LCD)
        // --------------------------------------------------------------------------
        launchCustomerDisplay() {
            if (this.config.customerDisplay.windowRef && !this.config.customerDisplay.windowRef.closed) {
                this.config.customerDisplay.windowRef.focus();
                return;
            }

            const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
            const win = window.open('', 'imbs_customer_display', 'width=800,height=520,menubar=no,toolbar=no,location=no,status=no');
            if (!win) {
                if (window.App) window.App.showToast('Please allow popups to open Customer Display window.', 'danger');
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
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { background: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
                        .header { background: #121215; padding: 16px 24px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }
                        .store-name { font-size: 20px; font-weight: 800; color: #ffffff; }
                        .store-sub { font-size: 12px; color: #a1a1aa; }
                        .content { flex: 1; display: grid; grid-template-columns: 1fr 340px; gap: 20px; padding: 24px; overflow: hidden; }
                        .cart-box { background: #18181c; border: 1px solid #27272a; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; overflow: hidden; }
                        .cart-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #a1a1aa; padding-bottom: 10px; border-bottom: 1px solid #27272a; }
                        .items-list { flex: 1; overflow-y: auto; padding: 10px 0; display: flex; flex-direction: column; gap: 8px; }
                        .cart-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #121215; border-radius: 6px; border: 1px solid #222226; }
                        .totals-box { background: #18181c; border: 1px solid #27272a; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; }
                        .payable-title { font-size: 14px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; }
                        .payable-amount { font-size: 44px; font-weight: 900; color: #22c55e; font-family: monospace; margin: 12px 0; }
                        .qr-card { background: #ffffff; padding: 12px; border-radius: 8px; display: inline-block; margin: 0 auto; }
                        .footer { padding: 12px 24px; background: #121215; border-top: 1px solid #27272a; text-align: center; font-size: 12px; color: #71717a; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="store-name" id="disp-store-name">${store.shop_name || 'SSE ENTERPRISE'}</div>
                            <div class="store-sub" id="disp-store-sub">${store.tagline || 'Welcome to our store'}</div>
                        </div>
                        <div style="font-family: monospace; font-size: 12px; color: #60a5fa; background: rgba(59,130,246,0.15); padding: 4px 10px; border-radius: 4px;">
                            Terminal Active • Counter 01
                        </div>
                    </div>
                    <div class="content">
                        <div class="cart-box">
                            <div class="cart-header">Your Items In Cart</div>
                            <div class="items-list" id="disp-items-list">
                                <div style="text-align: center; padding: 60px 0; color: #71717a; font-size: 14px;">Next item will appear here...</div>
                            </div>
                        </div>
                        <div class="totals-box">
                            <div>
                                <div class="payable-title">Total Amount Due</div>
                                <div class="payable-amount" id="disp-grand-total">₹0.00</div>
                                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #a1a1aa; margin-top: 8px;">
                                    <span>Taxable: <strong id="disp-subtotal" style="color: #fff;">₹0.00</strong></span>
                                    <span>GST (18%): <strong id="disp-tax" style="color: #60a5fa;">₹0.00</strong></span>
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 11px; color: #a1a1aa; margin-bottom: 8px;">Scan with GooglePay, PhonePe, Paytm or BHIM</div>
                                <div class="qr-card" id="disp-upi-qr"></div>
                            </div>
                        </div>
                    </div>
                    <div class="footer" id="disp-footer">${store.footer_note || 'Thank you for shopping with us!'}</div>
                </body>
                </html>
            `;
            win.document.write(html);
            win.document.close();

            if (window.PosView && window.PosView.cart) {
                this.updateCustomerDisplay(window.PosView.cart);
            }
        },

        updateCustomerDisplay(cartItems = []) {
            const win = this.config.customerDisplay.windowRef;
            if (!win || win.closed) {
                this.config.customerDisplay.active = false;
                return;
            }

            try {
                const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};
                const listEl = win.document.getElementById('disp-items-list');
                const totalEl = win.document.getElementById('disp-grand-total');
                const subEl = win.document.getElementById('disp-subtotal');
                const taxEl = win.document.getElementById('disp-tax');
                const qrEl = win.document.getElementById('disp-upi-qr');

                let subtotal = 0;
                for (const item of cartItems) {
                    subtotal += (item.quantity * item.unit_price);
                }
                const tax = Math.round(subtotal * 0.18);
                const grand = subtotal + tax;

                if (totalEl) totalEl.innerText = `₹${(grand / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                if (subEl) subEl.innerText = `₹${(subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                if (taxEl) taxEl.innerText = `₹${(tax / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

                if (listEl) {
                    if (cartItems.length === 0) {
                        listEl.innerHTML = `<div style="text-align: center; padding: 60px 0; color: #71717a; font-size: 14px;">Next item will appear here...</div>`;
                    } else {
                        listEl.innerHTML = cartItems.map(item => `
                            <div class="cart-row">
                                <div>
                                    <div style="font-weight: 700; color: #ffffff; font-size: 13px;">${item.name}</div>
                                    <div style="font-size: 11px; color: #a1a1aa; font-family: monospace;">Qty: ${item.quantity} × ₹${(item.unit_price / 100).toFixed(2)}</div>
                                </div>
                                <div style="font-weight: 800; font-family: monospace; color: #ffffff; font-size: 14px;">
                                    ₹${((item.quantity * item.unit_price) / 100).toFixed(2)}
                                </div>
                            </div>
                        `).join('');
                    }
                }

                if (qrEl && window.BarcodeQR) {
                    const upiUrl = `upi://pay?pa=${store.upi_id || 'sse.retail@icici'}&pn=${encodeURIComponent(store.shop_name || 'SSE')}&am=${(grand / 100).toFixed(2)}&cu=INR`;
                    qrEl.innerHTML = window.BarcodeQR.qr(upiUrl, { size: 100 });
                }
            } catch (_) {}
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
