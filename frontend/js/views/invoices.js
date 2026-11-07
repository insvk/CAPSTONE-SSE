/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Tax Invoices & Billing Archive View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL
 * ==============================================================================
 */

const InvoicesView = {
    invoices: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            this.invoices = await window.SupabaseClient.getInvoices();
            this.renderTable(container);
        } catch (err) {
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading invoices from Supabase:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderTable(container) {
        let totalBilled = 0;
        let totalPaid = 0;
        let totalDue = 0;

        this.invoices.forEach(inv => {
            totalBilled += inv.grand_total;
            totalPaid += inv.paid_amount;
            totalDue += inv.balance_due;
        });

        const billedFmt = (totalBilled / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const paidFmt = (totalPaid / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const dueFmt = (totalDue / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

        container.innerHTML = `
            <!-- Summary Stats -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px;">
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">TOTAL BILLED REVENUE</div>
                    <div style="font-size: 22px; font-weight: 800; color: #fff; margin-top: 4px;">₹${billedFmt}</div>
                </div>
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">PAYMENTS SETTLED</div>
                    <div style="font-size: 22px; font-weight: 800; color: #2fb344; margin-top: 4px;">₹${paidFmt}</div>
                </div>
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">OUTSTANDING RECEIVABLES</div>
                    <div style="font-size: 22px; font-weight: 800; color: ${totalDue > 0 ? '#ff6b6b' : '#2fb344'}; margin-top: 4px;">₹${dueFmt}</div>
                </div>
            </div>

            <div class="tblr-card">
                <div class="tblr-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--tblr-border-color);">
                    <div>
                        <h3 class="tblr-card-title" style="margin: 0; font-size: 16px;">Tax Invoices (${this.invoices.length})</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            GST Tax compliant corporate and retail invoice ledger
                        </div>
                    </div>
                    <button class="tblr-btn tblr-btn-primary" onclick="App.navigateTo('pos')">
                        + New Sale / Checkout
                    </button>
                </div>

                <div class="tblr-table-responsive">
                    <table class="tblr-table">
                        <thead>
                            <tr>
                                <th>INVOICE NUMBER</th>
                                <th>CUSTOMER NAME</th>
                                <th>DATE</th>
                                <th style="text-align: right;">SUBTOTAL</th>
                                <th style="text-align: right;">GST TAX</th>
                                <th style="text-align: right;">GRAND TOTAL</th>
                                <th style="text-align: center;">STATUS</th>
                                <th style="text-align: center;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderRows()}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tax Invoice Modal -->
            <div id="modal-invoice-detail" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 650px;">
                    <div class="tblr-modal-header">
                        <h3 class="tblr-modal-title">Tax Invoice Document</h3>
                        <button class="tblr-modal-close" onclick="InvoicesView.closeDetailModal()">✕</button>
                    </div>
                    <div class="tblr-modal-body" id="invoice-doc-body">
                        <!-- Invoice Document -->
                    </div>
                    <div class="tblr-modal-footer">
                        <button type="button" class="tblr-btn tblr-btn-default" onclick="InvoicesView.closeDetailModal()">Close</button>
                        <button type="button" class="tblr-btn tblr-btn-primary" onclick="window.print()">🖨 Print Invoice</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderRows() {
        if (!this.invoices || this.invoices.length === 0) {
            return `<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--tblr-text-muted);">No invoices recorded yet. Start a sale via POS Cashier.</td></tr>`;
        }

        return this.invoices.map((inv, idx) => {
            const sub = (inv.subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const tax = (inv.tax_amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const grand = (inv.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const isPaid = inv.status === 'PAID';

            return `
                <tr>
                    <td style="font-weight: 700; font-family: monospace; color: #fff;">${inv.invoice_number}</td>
                    <td style="font-weight: 600; color: #e2e8f0;">${inv.customer_name}</td>
                    <td style="font-size: 12px; color: var(--tblr-text-muted);">${inv.invoice_date}</td>
                    <td style="text-align: right; font-family: monospace; color: var(--tblr-text-secondary);">₹${sub}</td>
                    <td style="text-align: right; font-family: monospace; color: var(--tblr-primary);">₹${tax}</td>
                    <td style="text-align: right; font-weight: 800; font-family: monospace; color: #2fb344;">₹${grand}</td>
                    <td style="text-align: center;">
                        <span class="tblr-badge ${isPaid ? 'tblr-badge-green' : 'tblr-badge-red'}">
                            ${inv.status}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <button class="tblr-btn tblr-btn-default" style="padding: 4px 8px; font-size: 11px;" onclick="InvoicesView.showInvoiceDetail(${idx})">
                            View / Print
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    showInvoiceDetail(idx) {
        const inv = this.invoices[idx];
        if (!inv) return;

        const sub = (inv.subtotal / 100).toFixed(2);
        const tax = (inv.tax_amount / 100).toFixed(2);
        const grand = (inv.grand_total / 100).toFixed(2);

        const body = document.getElementById('invoice-doc-body');
        if (!body) return;

        body.innerHTML = `
            <div style="background: #ffffff; color: #111; padding: 24px; border-radius: 8px; font-family: sans-serif; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
                    <div>
                        <h2 style="margin: 0; font-size: 18px; color: #0f172a;">TAX INVOICE</h2>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Original for Recipient</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 14px; color: #206bc4;">Apex Global Enterprises Ltd</div>
                        <div style="font-size: 11px; color: #64748b;">GSTIN: 27AABCU9603R1ZM</div>
                        <div style="font-size: 11px; color: #64748b;">BKC Complex, Mumbai - 400051</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div>
                        <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">BILLED TO:</div>
                        <div style="font-weight: bold; font-size: 14px; margin-top: 2px;">${inv.customer_name}</div>
                        <div style="font-size: 12px; color: #475569;">State: Maharashtra (27)</div>
                    </div>
                    <div style="text-align: right;">
                        <div><strong>Invoice No:</strong> ${inv.invoice_number}</div>
                        <div><strong>Invoice Date:</strong> ${inv.invoice_date}</div>
                        <div><strong>Status:</strong> <span style="color: green; font-weight: bold;">${inv.status}</span></div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                            <th style="text-align: left; padding: 8px;">Description</th>
                            <th style="text-align: center; padding: 8px;">Qty</th>
                            <th style="text-align: right; padding: 8px;">Unit Price</th>
                            <th style="text-align: right; padding: 8px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(inv.lines && inv.lines.length > 0) ? inv.lines.map(l => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 8px;">${l.products ? l.products.name : 'Item'}</td>
                                <td style="text-align: center; padding: 8px;">${l.quantity}</td>
                                <td style="text-align: right; padding: 8px;">₹${(l.unit_price_cents / 100).toFixed(2)}</td>
                                <td style="text-align: right; padding: 8px;">₹${(l.line_total_cents / 100).toFixed(2)}</td>
                            </tr>
                        `).join('') : `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 8px;">Hardware Merchandize Item</td>
                                <td style="text-align: center; padding: 8px;">1</td>
                                <td style="text-align: right; padding: 8px;">₹${sub}</td>
                                <td style="text-align: right; padding: 8px;">₹${sub}</td>
                            </tr>
                        `}
                    </tbody>
                </table>

                <div style="display: flex; justify-content: flex-end;">
                    <div style="width: 240px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                            <span>Subtotal:</span><span>₹${sub}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                            <span>GST Tax (CGST+SGST):</span><span>₹${tax}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 2px solid #0f172a; font-weight: bold; font-size: 15px;">
                            <span>Total Due:</span><span>₹${grand}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = document.getElementById('modal-invoice-detail');
        if (modal) modal.style.display = 'flex';
    },

    closeDetailModal() {
        const modal = document.getElementById('modal-invoice-detail');
        if (modal) modal.style.display = 'none';
    }
};

window.InvoicesView = InvoicesView;
