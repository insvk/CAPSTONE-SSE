/**
 * Tabler Dark UI :: Invoices & Billing History View
 */

const InvoicesView = {
    async render(container) {
        try {
            const invoices = await api.getInvoices();

            container.innerHTML = `
                <div class="tblr-card">
                    <div class="tblr-card-header">
                        <div>
                            <h3 class="tblr-card-title">TAX INVOICES & BILLING REGISTRY</h3>
                            <span class="tblr-card-subtitle">Permanent immutable ledger of customer sales invoices</span>
                        </div>
                        <button class="tblr-btn tblr-btn-primary" onclick="App.navigateTo('pos')">
                            + New Sale / POS Checkout
                        </button>
                    </div>

                    <div class="tblr-table-responsive">
                        <table class="tblr-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Taxable Base</th>
                                    <th>GST Breakdown</th>
                                    <th>Grand Total</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoices.length === 0 ? `
                                    <tr><td colspan="8" style="text-align: center; color: var(--tblr-text-muted); padding: 30px;">No invoices issued yet. Perform a checkout from the POS Terminal.</td></tr>
                                ` : invoices.map(inv => `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 700; color: #206bc4; font-family: monospace;">${inv.invoice_number}</div>
                                        </td>
                                        <td>
                                            <div style="font-weight: 600;">${inv.customer_name || 'Retail Customer'}</div>
                                            <div style="font-size: 11px; color: var(--tblr-text-muted);">${inv.customer_id}</div>
                                        </td>
                                        <td style="color: var(--tblr-text-secondary); font-size: 12px;">${inv.invoice_date}</td>
                                        <td>₹${(inv.taxable_subtotal_cents / 100).toFixed(2)}</td>
                                        <td>
                                            <span style="font-size: 11px; color: var(--tblr-text-muted);">
                                                C: ₹${(inv.total_cgst_cents / 100).toFixed(2)} | S: ₹${(inv.total_sgst_cents / 100).toFixed(2)}
                                            </span>
                                        </td>
                                        <td style="font-weight: 700; color: #ffffff; font-size: 14px;">
                                            ₹${(inv.grand_total_cents / 100).toFixed(2)}
                                        </td>
                                        <td>
                                            <span class="tblr-badge tblr-badge-success">${inv.status}</span>
                                        </td>
                                        <td>
                                            <button class="tblr-btn tblr-btn-sm tblr-btn-default" onclick="InvoicesView.viewInvoice('${inv.invoice_number}')">
                                                👁 View & Print
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Print Modal Container -->
                <div id="modal-invoice-viewer" class="tblr-modal-backdrop">
                    <div class="tblr-modal invoice-print-modal" style="max-width: 720px;">
                        <div class="tblr-modal-header">
                            <h4 class="tblr-modal-title">Official Tax Invoice</h4>
                            <div style="display: flex; gap: 8px;">
                                <button class="tblr-btn tblr-btn-primary tblr-btn-sm" onclick="window.print()">🖨 Print Invoice</button>
                                <button class="tblr-modal-close" onclick="InvoicesView.closeModal()">✕</button>
                            </div>
                        </div>
                        <div class="tblr-modal-body">
                            <div id="invoice-viewer-content" class="invoice-print-container"></div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="tblr-card" style="color: var(--tblr-danger);">Failed to load invoices: ${err.message}</div>`;
        }
    },

    async viewInvoice(invoiceNumber) {
        try {
            const inv = await api.getInvoiceById(invoiceNumber);
            const content = document.getElementById('invoice-viewer-content');
            content.innerHTML = `
                <div class="invoice-header-row">
                    <div>
                        <div class="invoice-company-title">Apex Industrial & Retail Systems Ltd.</div>
                        <div style="font-size: 11px; color: #475569;">108 Industrial Expressway, Tech Corridor, Chennai - 600001</div>
                        <div style="font-size: 11px; color: #475569;">GSTIN: 33AAAAA0000A1Z5 | Phone: +91 44 2800 1234</div>
                    </div>
                    <div class="invoice-meta-block">
                        <div class="invoice-number">${inv.invoice_number}</div>
                        <div style="font-size: 12px; font-weight: 600;">ORIGINAL TAX INVOICE</div>
                        <div style="font-size: 11px; color: #475569;">Date: ${inv.invoice_date}</div>
                        <div style="font-size: 11px; color: #475569;">Status: <strong style="color: #16a34a;">${inv.status}</strong></div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; margin-bottom: 16px;">
                    <div>
                        <strong>Billed To:</strong><br>
                        ${inv.customer_name}<br>
                        Customer Ref: ${inv.customer_id}
                    </div>
                    <div style="text-align: right;">
                        <strong>Place of Supply:</strong> Tamil Nadu (State Code 33)<br>
                        <strong>Payment Status:</strong> Fully Paid
                    </div>
                </div>

                <table class="invoice-print-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Taxable</th>
                            <th>CGST</th>
                            <th>SGST</th>
                            <th>Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(inv.lines || []).map((l, idx) => `
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
                            <span>Discounts Applied:</span>
                            <span>-₹${(inv.total_discount_cents / 100).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Total GST (18%):</span>
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
                    Cryptographically generated & verified by C-First Domain Engine. Double-entry balanced.
                </div>
            `;
            document.getElementById('modal-invoice-viewer').classList.add('show');
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    closeModal() {
        document.getElementById('modal-invoice-viewer').classList.remove('show');
    }
};

window.InvoicesView = InvoicesView;

