/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise Customer Account & Receivables Ledger
 * 100% Live Cloud Synchronization with Supabase PostgreSQL 17
 * - Comprehensive Statement of Account (SOA) & Date-Wise Chronological Ledger
 * - Real-Time Credit Limit & Overdue Aging Analysis (0-30, 31-60, 61-90, 90+ Days)
 * - Dynamic Loyalty Tiers (Bronze, Silver, Gold, Platinum) & Lifetime Value (LTV)
 * - Direct Pay-on-Account / Balance Settlement Suite with Receipt Voucher
 * - Instant 1-Click WhatsApp Ledger Dispatcher, Email Statement & Direct POS Billing
 * ==============================================================================
 */

const CustomersView = {
    customersList: [],
    activeStatementCustomer: null,
    activeStatementData: null,

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 350px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border: 2px solid #27272a; border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <span style="font-size: 13px; color: var(--text-muted);">Syncing customer accounts and credit ledgers from Supabase...</span>
                </div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            this.customersList = await window.SupabaseClient.getCustomers();
            this.renderTable(container);
        } catch (err) {
            console.error("[Customers Load Error]", err);
            container.innerHTML = `
                <div class="shadcn-card" style="border-color: #ef4444; color: #ef4444; padding: 24px;">
                    <strong>Error loading customers from Supabase:</strong> ${err.message}<br>
                    <button class="shadcn-btn-primary" style="margin-top: 14px;" onclick="CustomersView.render(document.getElementById('main-content'))">
                        Retry Sync
                    </button>
                </div>
            `;
        }
    },

    renderTable(container) {
        const totalCustomers = this.customersList.length;
        const totalOutstanding = this.customersList.reduce((acc, c) => acc + (Number(c.outstanding_balance_cents) || 0), 0);
        const totalCreditLimit = this.customersList.reduce((acc, c) => acc + (Number(c.credit_limit_cents) || 0), 0);
        const formattedOutstanding = '₹' + (totalOutstanding / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const formattedCreditLimit = '₹' + (totalCreditLimit / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

        container.innerHTML = `
            <!-- Top Summary Cards (Responsive Auto-Fit Grid) -->
            <div class="shadcn-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 22px;">
                <div class="shadcn-metric-card" style="padding: 18px 20px; background: #16161c; border: 1px solid #22222a; border-radius: 10px; display: flex; flex-direction: column; justify-content: space-between; min-height: 112px;">
                    <span class="shadcn-metric-label" style="font-size: 11px; font-weight: 700; letter-spacing: 0.6px; color: var(--text-muted); text-transform: uppercase;">REGISTERED CLIENTS &amp; B2C</span>
                    <div class="shadcn-metric-val" style="font-size: 24px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: #ffffff;">
                        ${totalCustomers} <span style="font-size: 13px; font-weight: 400; color: var(--text-muted);">accounts</span>
                    </div>
                    <span class="shadcn-trend-pill up" style="width: fit-content; font-size: 11px; padding: 2px 8px; border-radius: 4px;">Live Cloud Synced</span>
                </div>
                <div class="shadcn-metric-card" style="padding: 18px 20px; background: #16161c; border: 1px solid #22222a; border-radius: 10px; display: flex; flex-direction: column; justify-content: space-between; min-height: 112px;">
                    <span class="shadcn-metric-label" style="font-size: 11px; font-weight: 700; letter-spacing: 0.6px; color: var(--text-muted); text-transform: uppercase;">TRADE RECEIVABLES BALANCE</span>
                    <div class="shadcn-metric-val" style="font-size: 24px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: ${totalOutstanding > 0 ? '#ef4444' : '#22c55e'};">
                        ${formattedOutstanding}
                    </div>
                    <span class="shadcn-trend-pill ${totalOutstanding > 0 ? 'down' : 'up'}" style="width: fit-content; font-size: 11px; padding: 2px 8px; border-radius: 4px;">
                        ${totalOutstanding > 0 ? 'Outstanding Debtor Ledger' : 'All Accounts Settled'}
                    </span>
                </div>
                <div class="shadcn-metric-card" style="padding: 18px 20px; background: #16161c; border: 1px solid #22222a; border-radius: 10px; display: flex; flex-direction: column; justify-content: space-between; min-height: 112px;">
                    <span class="shadcn-metric-label" style="font-size: 11px; font-weight: 700; letter-spacing: 0.6px; color: var(--text-muted); text-transform: uppercase;">TOTAL CREDIT EXTENDED</span>
                    <div class="shadcn-metric-val" style="font-size: 24px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: #60a5fa;">
                        ${formattedCreditLimit}
                    </div>
                    <span class="shadcn-trend-pill up" style="width: fit-content; font-size: 11px; padding: 2px 8px; border-radius: 4px;">Approved Credit Limit Pool</span>
                </div>
                <div class="shadcn-metric-card" style="padding: 18px 20px; background: #16161c; border: 1px solid #22222a; border-radius: 10px; display: flex; flex-direction: column; justify-content: space-between; min-height: 112px;">
                    <span class="shadcn-metric-label" style="font-size: 11px; font-weight: 700; letter-spacing: 0.6px; color: var(--text-muted); text-transform: uppercase;">GSTIN COMPLIANCE &amp; B2B</span>
                    <div class="shadcn-metric-val" style="font-size: 24px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: #c084fc;">
                        B2B + Retail POS
                    </div>
                    <span class="shadcn-trend-pill up" style="width: fit-content; font-size: 11px; padding: 2px 8px; border-radius: 4px;">Auto Mobile Linkage</span>
                </div>
            </div>

            <!-- Customer Directory Master Table Wrap -->
            <div class="shadcn-table-wrap" style="background: #141419; border: 1px solid #24242f; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div class="shadcn-table-header" style="padding: 16px 20px; border-bottom: 1px solid #22222c; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <h2 style="font-size: 17px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: -0.2px;">Customer Directory &amp; Credit Ledger (${totalCustomers})</h2>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                            Client database with Statement of Account (SOA), overdue aging, balance settlements, and POS mobile linkage
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <input type="text" id="cust-search" class="shadcn-input" placeholder="Search by name, phone, code..." style="width: 240px; height: 34px; font-size: 12px; border-radius: 6px;" oninput="CustomersView.filterTable(this.value)" />
                        <button class="shadcn-btn-primary" style="height: 34px; font-size: 12px; font-weight: 700; padding: 0 16px; background: #22c55e; border-color: #22c55e; color: #09090b;" onclick="CustomersView.showAddModal()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 5px; vertical-align: middle;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            + Add Customer
                        </button>
                    </div>
                </div>

                <div style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
                    <table class="shadcn-table" id="customers-table" style="min-width: 1240px; width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="min-width: 90px; padding: 12px 14px;">CODE</th>
                                <th style="min-width: 200px; padding: 12px 14px;">CUSTOMER / COMPANY</th>
                                <th style="min-width: 130px; padding: 12px 14px;">MOBILE / PHONE</th>
                                <th style="min-width: 140px; padding: 12px 14px;">GSTIN / TAX ID</th>
                                <th style="min-width: 90px; padding: 12px 14px;">STATE</th>
                                <th style="min-width: 150px; padding: 12px 14px;">CREDIT UTILIZATION</th>
                                <th style="min-width: 130px; padding: 12px 14px; text-align: right;">OUTSTANDING</th>
                                <th style="min-width: 80px; padding: 12px 14px; text-align: center;">STATUS</th>
                                <th style="min-width: 320px; padding: 12px 14px; text-align: right;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.customersList.length === 0 ? `
                                <tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 36px;">No customers found. Register accounts or bill via POS Cashier.</td></tr>
                            ` : this.customersList.map(c => {
                                const outCents = Number(c.outstanding_balance_cents) || 0;
                                const limitCents = Number(c.credit_limit_cents) || 0;
                                const utilPct = limitCents > 0 ? Math.min(100, Math.round((outCents / limitCents) * 100)) : 0;
                                const utilColor = utilPct >= 80 ? '#ef4444' : (utilPct >= 50 ? '#f59e0b' : '#22c55e');

                                return `
                                    <tr>
                                        <td style="padding: 12px 14px;"><span class="shadcn-badge blue" style="white-space: nowrap;">${c.code}</span></td>
                                        <td style="padding: 12px 14px;">
                                            <div style="font-weight: 700; color: #ffffff;">${c.name}</div>
                                            <div style="font-size: 11px; color: var(--text-muted);">${c.email || 'No email registered'}</div>
                                        </td>
                                        <td style="padding: 12px 14px;">
                                            ${c.phone 
                                                ? `<a href="tel:${c.phone}" style="font-family: var(--font-mono); font-size: 12px; color: #4ade80; text-decoration: none;" title="Click to Call">${c.phone}</a>` 
                                                : '<span style="color: var(--text-muted); font-size: 11px;">Not specified</span>'}
                                        </td>
                                        <td style="padding: 12px 14px;">
                                            ${c.tax_identifier ? `<span style="font-family: var(--font-mono); font-size: 11px; color: #a1a1aa;">${c.tax_identifier}</span>` : '<span style="color: var(--text-muted); font-size: 11px;">Retail (B2C)</span>'}
                                        </td>
                                        <td style="padding: 12px 14px;"><span class="shadcn-badge default" style="white-space: nowrap;">${c.state_code === '27' ? '27 - MH' : c.state_code === '29' ? '29 - KA' : c.state_code || '27'}</span></td>
                                        <td style="padding: 12px 14px;">
                                            ${limitCents > 0 ? `
                                                <div style="font-size: 11px; font-family: var(--font-mono); color: #a1a1aa; margin-bottom: 3px;">
                                                    ₹${(outCents/100).toFixed(0)} / ₹${(limitCents/100).toFixed(0)} (${utilPct}%)
                                                </div>
                                                <div style="width: 100%; height: 5px; background: #272733; border-radius: 3px; overflow: hidden;">
                                                    <div style="width: ${utilPct}%; height: 100%; background: ${utilColor};"></div>
                                                </div>
                                            ` : `<span style="font-size: 11px; color: var(--text-muted);">No credit line</span>`}
                                        </td>
                                        <td style="text-align: right; padding: 12px 14px;">
                                            <span style="font-weight: 700; font-family: var(--font-mono); font-size: 13px; color: ${outCents > 0 ? '#ef4444' : '#22c55e'};">
                                                ${c.outstanding_balance_formatted || '₹0.00'}
                                            </span>
                                        </td>
                                        <td style="text-align: center; padding: 12px 14px;">
                                            <span class="shadcn-badge ${c.is_active ? 'green' : 'red'}" style="white-space: nowrap;">
                                                ${c.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td style="text-align: right; white-space: nowrap; padding: 10px 14px;">
                                            <div style="display: flex; gap: 4px; justify-content: flex-end; align-items: center;">
                                                <button class="shadcn-btn-secondary" style="height: 26px; padding: 0 8px; font-size: 11px; font-weight: 600; color: #60a5fa; border-color: rgba(96, 165, 250, 0.4); border-radius: 4px;" onclick="CustomersView.openStatementModal('${c.id}', '${encodeURIComponent(c.name)}', '${c.phone || ''}')" title="Statement of Account (SOA) & Date-Wise Ledger">
                                                    Ledger / SOA
                                                </button>
                                                ${outCents > 0 ? `
                                                    <button class="shadcn-btn-secondary" style="height: 26px; padding: 0 8px; font-size: 11px; font-weight: 600; color: #22c55e; border-color: rgba(34, 197, 94, 0.4); border-radius: 4px;" onclick="CustomersView.openSettleModal('${c.id}', '${encodeURIComponent(c.name)}', ${outCents})" title="Record Payment / Settle Balance">
                                                        Settle ₹
                                                    </button>
                                                ` : ''}
                                                <button class="shadcn-btn-secondary" style="height: 26px; padding: 0 8px; font-size: 11px; font-weight: 600; color: #a78bfa; border-color: rgba(167, 139, 250, 0.4); border-radius: 4px;" onclick="CustomersView.openEditModal('${c.id}')" title="Edit Customer Profile & Credit Limit">
                                                    Edit
                                                </button>
                                                ${c.phone ? `
                                                    <button class="shadcn-btn-secondary" style="height: 26px; padding: 0 8px; font-size: 11px; font-weight: 600; color: #4ade80; border-color: rgba(74, 222, 128, 0.4); border-radius: 4px;" onclick="CustomersView.sendWhatsAppStatement('${c.phone}', '${encodeURIComponent(c.name)}', '${c.outstanding_balance_formatted || '₹0.00'}')" title="Send Balance Reminder on WhatsApp">
                                                        WhatsApp
                                                    </button>
                                                ` : ''}
                                                <button class="shadcn-btn-secondary" style="height: 26px; padding: 0 8px; font-size: 11px; font-weight: 600; border-radius: 4px;" onclick="CustomersView.quickPOS('${c.id}', '${encodeURIComponent(c.name)}', '${c.phone || ''}')" title="Start POS sale for this customer">
                                                    POS Bill
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- MODAL 1: STATEMENT OF ACCOUNT (SOA) & DATE-WISE FINANCIAL LEDGER -->
            <div id="modal-customer-statement" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 840px; background: #101015; border-color: #272733;">
                    <div class="shadcn-modal-header" style="border-bottom: 1px solid #1f1f26;">
                        <div>
                            <h3 class="shadcn-modal-title" id="soa-cust-title">Statement of Account (SOA)</h3>
                            <div style="font-size: 11px; color: var(--text-muted);" id="soa-cust-sub">Date-wise chronological ledger synchronized with Supabase Cloud DB</div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="shadcn-btn-secondary" style="height: 28px; font-size: 11px;" onclick="CustomersView.exportStatementCSV()">Export CSV</button>
                            <button class="shadcn-btn-secondary" style="height: 28px; font-size: 11px;" onclick="window.print()">Print</button>
                            <button class="shadcn-modal-close" onclick="document.getElementById('modal-customer-statement').style.display='none'">&times;</button>
                        </div>
                    </div>
                    <div class="shadcn-modal-body" id="soa-cust-body" style="padding: 18px; max-height: calc(85vh - 120px); overflow-y: auto;">
                        <!-- Statement Data Injected Here -->
                    </div>
                    <div class="shadcn-modal-footer" style="border-top: 1px solid #1f1f26; display: flex; justify-content: space-between; align-items: center;">
                        <div id="soa-footer-actions"></div>
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-customer-statement').style.display='none'">
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <!-- MODAL 2: PAY-ON-ACCOUNT / SETTLE OUTSTANDING BALANCE -->
            <div id="modal-settle-balance" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 480px; background: #121217; border-color: #272733;">
                    <div class="shadcn-modal-header" style="border-bottom: 1px solid #1f1f26;">
                        <div>
                            <h3 class="shadcn-modal-title">Record Customer Payment</h3>
                            <div style="font-size: 11px; color: var(--text-muted);">Credit payment against outstanding debtor ledger</div>
                        </div>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-settle-balance').style.display='none'">&times;</button>
                    </div>
                    <form onsubmit="CustomersView.handleSettleSubmit(event)">
                        <input type="hidden" id="settle-cust-id" />
                        <div class="shadcn-modal-body" style="padding: 20px;">
                            <div style="background: #171720; border: 1px solid #252533; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
                                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Customer Name</div>
                                <div id="settle-cust-name-disp" style="font-size: 14px; font-weight: 700; color: #fff; margin-top: 2px;"></div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #20202c;">
                                    <span style="font-size: 12px; color: #a1a1aa;">Current Outstanding Balance:</span>
                                    <span id="settle-cust-bal-disp" style="font-size: 16px; font-weight: 800; color: #ef4444; font-family: var(--font-mono);">₹0.00</span>
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Payment Amount (&#8377;) *</label>
                                <input type="number" step="0.01" min="1" id="settle-amount" class="shadcn-input" style="font-size: 18px; font-weight: 800; font-family: var(--font-mono); height: 42px; color: #22c55e;" required />
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Payment Mode *</label>
                                    <select id="settle-mode" class="shadcn-select" style="height: 38px;" required>
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI / QR</option>
                                        <option value="BANK_TRANSFER">Bank (NEFT / RTGS)</option>
                                        <option value="CARD">Credit / Debit Card</option>
                                        <option value="CHEQUE">Cheque / Demand Draft</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Reference / UTR No.</label>
                                    <input type="text" id="settle-ref" class="shadcn-input" placeholder="e.g. UTR-9821387" style="height: 38px;" />
                                </div>
                            </div>

                            <div style="margin-bottom: 14px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Remarks / Notes</label>
                                <input type="text" id="settle-notes" class="shadcn-input" placeholder="e.g. Full settlement against previous month invoices" style="height: 38px;" />
                            </div>
                        </div>
                        <div class="shadcn-modal-footer" style="border-top: 1px solid #1f1f26; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-settle-balance').style.display='none'">Cancel</button>
                            <button type="submit" id="btn-submit-settle" class="shadcn-btn-primary" style="background: #22c55e; border-color: #22c55e; color: #09090b; font-weight: 800;">
                                Confirm Payment in Cloud DB
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL 3: EDIT CUSTOMER PROFILE & CREDIT LIMIT -->
            <div id="modal-edit-customer" class="shadcn-modal-backdrop" style="display: none;">
                <div class="shadcn-modal-dialog" style="max-width: 520px; background: #121217; border-color: #272733;">
                    <div class="shadcn-modal-header" style="border-bottom: 1px solid #1f1f26;">
                        <div>
                            <h3 class="shadcn-modal-title">Edit Customer Profile</h3>
                            <div style="font-size: 11px; color: var(--text-muted);">Update contact info, tax identifiers, and credit limit</div>
                        </div>
                        <button class="shadcn-modal-close" onclick="document.getElementById('modal-edit-customer').style.display='none'">&times;</button>
                    </div>
                    <form onsubmit="CustomersView.handleEditSubmit(event)">
                        <input type="hidden" id="edit-cust-id" />
                        <div class="shadcn-modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 12px;">
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Customer / Company Name *</label>
                                <input type="text" id="edit-cust-name" class="shadcn-input" required />
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Mobile Number</label>
                                    <input type="tel" id="edit-cust-phone" class="shadcn-input" />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">GSTIN / Tax ID</label>
                                    <input type="text" id="edit-cust-tax" class="shadcn-input" />
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Email</label>
                                    <input type="email" id="edit-cust-email" class="shadcn-input" />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">State Code</label>
                                    <select id="edit-cust-state" class="shadcn-select">
                                        <option value="27">27 - Maharashtra</option>
                                        <option value="29">29 - Karnataka</option>
                                        <option value="07">07 - Delhi</option>
                                        <option value="33">33 - Tamil Nadu</option>
                                        <option value="24">24 - Gujarat</option>
                                    </select>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Credit Limit (&#8377;)</label>
                                    <input type="number" id="edit-cust-credit" class="shadcn-input" min="0" step="1000" />
                                </div>
                                <div>
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Account Status</label>
                                    <select id="edit-cust-status" class="shadcn-select">
                                        <option value="true">Active</option>
                                        <option value="false">Inactive / Suspended</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="shadcn-modal-footer" style="border-top: 1px solid #1f1f26; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px;">
                            <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-edit-customer').style.display='none'">Cancel</button>
                            <button type="submit" id="btn-save-cust-edit" class="shadcn-btn-primary">Save Changes in Cloud</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    filterTable(query) {
        const q = query.toLowerCase();
        const rows = document.querySelectorAll('#customers-table tbody tr');
        rows.forEach(r => {
            const text = r.innerText.toLowerCase();
            r.style.display = text.includes(q) ? '' : 'none';
        });
    },

    quickPOS(customerId, encodedName, phone) {
        const name = decodeURIComponent(encodedName || '');
        window.App.navigateTo('pos');
        setTimeout(() => {
            if (window.PosView) {
                window.PosView.currentCustomer = {
                    id: customerId,
                    name: name || 'Walk-in Retail Cash Customer',
                    phone: phone || '',
                    is_verified: true
                };
                const phoneInput = document.getElementById('pos-cust-phone');
                const nameInput = document.getElementById('pos-cust-name');
                const badge = document.getElementById('cust-sync-badge');
                if (phoneInput) phoneInput.value = phone || '';
                if (nameInput) nameInput.value = name || '';
                if (badge) { badge.className = 'pos-tier-pill simats'; badge.innerText = 'Verified Customer'; }
            }
        }, 150);
    },

    async openStatementModal(customerId, encodedName, phone) {
        const name = decodeURIComponent(encodedName || 'Customer');
        const modal = document.getElementById('modal-customer-statement');
        const title = document.getElementById('soa-cust-title');
        const sub = document.getElementById('soa-cust-sub');
        const body = document.getElementById('soa-cust-body');
        const footer = document.getElementById('soa-footer-actions');

        this.activeStatementCustomer = { id: customerId, name, phone };
        if (title) title.innerText = `Statement of Account (SOA): ${name}`;
        if (sub) sub.innerText = `Phone: ${phone || 'Unlinked'} • Financial Ledger & Aging Analysis`;
        if (body) {
            body.innerHTML = `
                <div style="display: flex; justify-content: center; padding: 40px;">
                    <div style="width: 28px; height: 28px; border: 2px solid #27272a; border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                </div>
            `;
        }
        if (modal) modal.style.display = 'flex';

        try {
            const statement = await window.SupabaseClient.getCustomerStatement(customerId);
            this.activeStatementData = statement;
            const summary = statement.summary;
            const cust = statement.customer;
            const ledger = statement.ledger;

            const balFmt = '₹' + (summary.current_balance_cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const invFmt = '₹' + (summary.total_invoiced_cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const paidFmt = '₹' + (summary.total_paid_cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const limitFmt = '₹' + (summary.credit_limit_cents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            const availFmt = '₹' + (summary.credit_available_cents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

            const aging = summary.aging || {};
            const curAgingFmt = '₹' + (aging.current / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            const d30AgingFmt = '₹' + (aging.days30 / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            const d60AgingFmt = '₹' + (aging.days60 / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            const d90AgingFmt = '₹' + (aging.days90 / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

            body.innerHTML = `
                <!-- Top SOA Header Analytics Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 18px;">
                    <div style="background: #15151c; border: 1px solid #22222c; border-radius: 8px; padding: 12px;">
                        <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase;">OUTSTANDING BALANCE</div>
                        <div style="font-size: 20px; font-weight: 800; font-family: var(--font-mono); color: ${summary.current_balance_cents > 0 ? '#ef4444' : '#22c55e'}; margin-top: 4px;">
                            ${balFmt}
                        </div>
                    </div>
                    <div style="background: #15151c; border: 1px solid #22222c; border-radius: 8px; padding: 12px;">
                        <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase;">LIFETIME INVOICED</div>
                        <div style="font-size: 20px; font-weight: 800; font-family: var(--font-mono); color: #fff; margin-top: 4px;">
                            ${invFmt}
                        </div>
                    </div>
                    <div style="background: #15151c; border: 1px solid #22222c; border-radius: 8px; padding: 12px;">
                        <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase;">TOTAL PAID / CREDITED</div>
                        <div style="font-size: 20px; font-weight: 800; font-family: var(--font-mono); color: #22c55e; margin-top: 4px;">
                            ${paidFmt}
                        </div>
                    </div>
                    <div style="background: #15151c; border: 1px solid #22222c; border-radius: 8px; padding: 12px;">
                        <div style="font-size: 10.5px; color: var(--text-muted); text-transform: uppercase;">LOYALTY TIER</div>
                        <div style="font-size: 15px; font-weight: 800; color: #a78bfa; margin-top: 4px;">
                            ${cust.loyalty_tier} (${cust.loyalty_points} pts)
                        </div>
                    </div>
                </div>

                <!-- Overdue Aging Analysis Cards -->
                <div style="background: #131318; border: 1px solid #22222c; border-radius: 8px; padding: 14px; margin-bottom: 18px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; display: flex; justify-content: space-between;">
                        <span>Overdue Aging Breakdown</span>
                        <span style="color: #60a5fa;">Credit Line: ${limitFmt} (Available: ${availFmt})</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        <div style="padding: 10px; background: #181820; border-radius: 6px; text-align: center;">
                            <div style="font-size: 10px; color: var(--text-muted);">CURRENT (0-30 D)</div>
                            <div style="font-size: 14px; font-weight: 700; color: #22c55e; font-family: var(--font-mono); margin-top: 2px;">${curAgingFmt}</div>
                        </div>
                        <div style="padding: 10px; background: #181820; border-radius: 6px; text-align: center;">
                            <div style="font-size: 10px; color: var(--text-muted);">31 - 60 DAYS</div>
                            <div style="font-size: 14px; font-weight: 700; color: #f59e0b; font-family: var(--font-mono); margin-top: 2px;">${d30AgingFmt}</div>
                        </div>
                        <div style="padding: 10px; background: #181820; border-radius: 6px; text-align: center;">
                            <div style="font-size: 10px; color: var(--text-muted);">61 - 90 DAYS</div>
                            <div style="font-size: 14px; font-weight: 700; color: #f97316; font-family: var(--font-mono); margin-top: 2px;">${d60AgingFmt}</div>
                        </div>
                        <div style="padding: 10px; background: #181820; border-radius: 6px; text-align: center;">
                            <div style="font-size: 10px; color: var(--text-muted);">90+ DAYS OVERDUE</div>
                            <div style="font-size: 14px; font-weight: 800; color: #ef4444; font-family: var(--font-mono); margin-top: 2px;">${d90AgingFmt}</div>
                        </div>
                    </div>
                </div>

                <!-- Date-Wise Ledger Table -->
                <div style="font-size: 12px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">
                    Date-Wise Transaction Ledger (${ledger.length} Entries)
                </div>
                <div style="overflow-x: auto; border: 1px solid #22222c; border-radius: 8px;">
                    <table class="shadcn-table" style="min-width: 760px; width: 100%;">
                        <thead>
                            <tr>
                                <th style="padding: 10px 12px;">DATE</th>
                                <th style="padding: 10px 12px;">TYPE</th>
                                <th style="padding: 10px 12px;">REFERENCE</th>
                                <th style="padding: 10px 12px;">DESCRIPTION</th>
                                <th style="text-align: right; padding: 10px 12px;">DEBIT (&#8377;)</th>
                                <th style="text-align: right; padding: 10px 12px;">CREDIT (&#8377;)</th>
                                <th style="text-align: right; padding: 10px 12px;">BALANCE (&#8377;)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ledger.length === 0 ? `
                                <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No ledger transactions found for this customer.</td></tr>
                            ` : ledger.map(l => {
                                const isInvoice = l.type === 'INVOICE';
                                const debitFmt = l.debit > 0 ? (l.debit / 100).toFixed(2) : '-';
                                const creditFmt = l.credit > 0 ? (l.credit / 100).toFixed(2) : '-';
                                const runFmt = (l.running_balance / 100).toFixed(2);

                                return `
                                    <tr>
                                        <td style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); padding: 10px 12px;">${l.date}</td>
                                        <td style="padding: 10px 12px;">
                                            <span class="shadcn-badge ${isInvoice ? 'blue' : 'green'}" style="font-size: 10px; padding: 1px 6px;">
                                                ${l.type}
                                            </span>
                                        </td>
                                        <td style="font-family: var(--font-mono); font-weight: 700; color: #fff; font-size: 12px; padding: 10px 12px;">${l.reference}</td>
                                        <td style="font-size: 11.5px; color: var(--text-secondary); padding: 10px 12px;">${l.description}</td>
                                        <td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: ${l.debit > 0 ? '#ef4444' : 'var(--text-muted)'}; padding: 10px 12px;">${debitFmt}</td>
                                        <td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: ${l.credit > 0 ? '#22c55e' : 'var(--text-muted)'}; padding: 10px 12px;">${creditFmt}</td>
                                        <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${l.running_balance > 0 ? '#ef4444' : '#22c55e'}; padding: 10px 12px;">₹${runFmt}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            if (footer) {
                footer.innerHTML = `
                    <div style="display: flex; gap: 8px;">
                        ${summary.current_balance_cents > 0 ? `
                            <button class="shadcn-btn-primary" style="height: 32px; font-size: 12px; background: #22c55e; border-color: #22c55e; color: #09090b; font-weight: 700;" onclick="CustomersView.openSettleModal('${customerId}', '${encodeURIComponent(name)}', ${summary.current_balance_cents})">
                                Settle Balance (&#8377;${(summary.current_balance_cents/100).toFixed(2)})
                            </button>
                        ` : ''}
                        ${phone ? `
                            <button class="shadcn-btn-secondary" style="height: 32px; font-size: 12px; color: #4ade80;" onclick="CustomersView.sendWhatsAppStatement('${phone}', '${encodeURIComponent(name)}', '${balFmt}')">
                                WhatsApp Statement
                            </button>
                        ` : ''}
                    </div>
                `;
            }
        } catch (e) {
            body.innerHTML = `<div style="color: #ef4444; padding: 20px;">Failed to load statement: ${e.message}</div>`;
        }
    },

    exportStatementCSV() {
        if (!this.activeStatementData || !this.activeStatementData.ledger) {
            window.App.showToast('No statement data to export', 'warning');
            return;
        }

        const ledger = this.activeStatementData.ledger;
        const custName = this.activeStatementCustomer ? this.activeStatementCustomer.name : 'Customer';
        let csv = `Statement of Account - ${custName}\n`;
        csv += `Generated Date: ${new Date().toLocaleDateString()}\n\n`;
        csv += `Date,Type,Reference,Description,Debit (INR),Credit (INR),Running Balance (INR)\n`;

        ledger.forEach(l => {
            const debit = (l.debit / 100).toFixed(2);
            const credit = (l.credit / 100).toFixed(2);
            const bal = (l.running_balance / 100).toFixed(2);
            csv += `"${l.date}","${l.type}","${l.reference}","${l.description.replace(/"/g, '""')}","${debit}","${credit}","${bal}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SOA_${custName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    sendWhatsAppStatement(phone, encodedName, balanceFormatted) {
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        if (!cleanPhone) {
            window.App.showToast('No valid phone number for WhatsApp', 'warning');
            return;
        }
        const name = decodeURIComponent(encodedName || 'Customer');
        const text = encodeURIComponent(
            `Dear ${name},\n\n` +
            `This is a statement update from SSE Enterprise Hub.\n` +
            `Your current outstanding balance is: ${balanceFormatted}.\n\n` +
            `Kindly clear the balance at your earliest convenience via UPI or bank transfer.\n` +
            `Thank you for your business!`
        );
        const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${text}`;
        window.open(url, '_blank');
    },

    openSettleModal(customerId, encodedName, currentBalanceCents) {
        const name = decodeURIComponent(encodedName || 'Customer');
        const modal = document.getElementById('modal-settle-balance');
        const idInput = document.getElementById('settle-cust-id');
        const nameDisp = document.getElementById('settle-cust-name-disp');
        const balDisp = document.getElementById('settle-cust-bal-disp');
        const amountInput = document.getElementById('settle-amount');

        if (idInput) idInput.value = customerId;
        if (nameDisp) nameDisp.innerText = name;
        if (balDisp) balDisp.innerText = '₹' + (currentBalanceCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (amountInput) amountInput.value = (currentBalanceCents / 100).toFixed(2);

        if (modal) modal.style.display = 'flex';
    },

    async handleSettleSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-settle');
        if (btn) { btn.disabled = true; btn.innerText = 'Recording Payment in Cloud...'; }

        const customerId = document.getElementById('settle-cust-id')?.value;
        const amount = parseFloat(document.getElementById('settle-amount')?.value || '0');
        const mode = document.getElementById('settle-mode')?.value || 'CASH';
        const ref = document.getElementById('settle-ref')?.value || `PAY-${Date.now().toString().slice(-6)}`;
        const notes = document.getElementById('settle-notes')?.value || '';

        try {
            await window.SupabaseClient.recordCustomerPayment({
                customer_id: customerId,
                amount: amount,
                payment_method: mode,
                reference_number: ref,
                notes: notes
            });

            document.getElementById('modal-settle-balance').style.display = 'none';
            window.App.showToast(`Payment of ₹${amount.toFixed(2)} recorded in Supabase!`, 'success');
            await this.render(document.getElementById('main-content'));

            // Refresh SOA modal if open
            const soaModal = document.getElementById('modal-customer-statement');
            if (soaModal && soaModal.style.display === 'flex') {
                await this.openStatementModal(customerId, encodeURIComponent(this.activeStatementCustomer?.name || ''), this.activeStatementCustomer?.phone);
            }
        } catch (err) {
            console.error("Payment settlement error", err);
            alert("Failed to record payment: " + err.message);
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = 'Confirm Payment in Cloud DB'; }
        }
    },

    openEditModal(customerId) {
        const c = this.customersList.find(x => x.id === customerId);
        if (!c) return;

        const modal = document.getElementById('modal-edit-customer');
        const idInput = document.getElementById('edit-cust-id');
        const nameInput = document.getElementById('edit-cust-name');
        const phoneInput = document.getElementById('edit-cust-phone');
        const emailInput = document.getElementById('edit-cust-email');
        const taxInput = document.getElementById('edit-cust-tax');
        const stateSelect = document.getElementById('edit-cust-state');
        const creditInput = document.getElementById('edit-cust-credit');
        const statusSelect = document.getElementById('edit-cust-status');

        if (idInput) idInput.value = c.id;
        if (nameInput) nameInput.value = c.name || '';
        if (phoneInput) phoneInput.value = c.phone || '';
        if (emailInput) emailInput.value = c.email || '';
        if (taxInput) taxInput.value = c.tax_identifier || '';
        if (stateSelect) stateSelect.value = c.state_code || '27';
        if (creditInput) creditInput.value = (Number(c.credit_limit_cents || 0) / 100).toFixed(0);
        if (statusSelect) statusSelect.value = c.is_active ? 'true' : 'false';

        if (modal) modal.style.display = 'flex';
    },

    async handleEditSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save-cust-edit');
        if (btn) { btn.disabled = true; btn.innerText = 'Updating Cloud DB...'; }

        const customerId = document.getElementById('edit-cust-id')?.value;
        const payload = {
            name: document.getElementById('edit-cust-name')?.value.trim(),
            phone: document.getElementById('edit-cust-phone')?.value.trim() || null,
            email: document.getElementById('edit-cust-email')?.value.trim() || null,
            tax_identifier: document.getElementById('edit-cust-tax')?.value.trim() || null,
            state_code: document.getElementById('edit-cust-state')?.value || '27',
            credit_limit: parseFloat(document.getElementById('edit-cust-credit')?.value || '0'),
            is_active: document.getElementById('edit-cust-status')?.value === 'true'
        };

        try {
            await window.SupabaseClient.updateCustomer(customerId, payload);
            document.getElementById('modal-edit-customer').style.display = 'none';
            window.App.showToast(`Customer "${payload.name}" updated in Supabase!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            console.error("Update customer error", err);
            alert("Failed to update customer: " + err.message);
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = 'Save Changes in Cloud'; }
        }
    },

    showAddModal() {
        const existing = document.getElementById('modal-add-customer');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-add-customer';
        modal.className = 'shadcn-modal-backdrop';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="shadcn-modal-dialog" style="max-width: 520px; background: #121217; border-color: #272733;">
                <div class="shadcn-modal-header" style="border-bottom: 1px solid #1f1f26;">
                    <div>
                        <h3 class="shadcn-modal-title">Register New Customer</h3>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                            Saves B2B account or retail mobile record directly to Supabase
                        </div>
                    </div>
                    <button class="shadcn-modal-close" onclick="document.getElementById('modal-add-customer').remove()">&times;</button>
                </div>
                <form onsubmit="CustomersView.handleAddSubmit(event)">
                    <div class="shadcn-modal-body" style="padding: 20px;">
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Customer / Company Name *</label>
                            <input type="text" id="cust-add-name" class="shadcn-input" placeholder="e.g. Acme Industrial Solutions Pvt Ltd" required />
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Mobile Number *</label>
                                <input type="tel" id="cust-add-phone" class="shadcn-input" placeholder="9820011223" required />
                            </div>
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">GSTIN / Tax ID</label>
                                <input type="text" id="cust-add-tax" class="shadcn-input" placeholder="27AAACA1234A1Z5" />
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Email</label>
                                <input type="email" id="cust-add-email" class="shadcn-input" placeholder="orders@company.com" />
                            </div>
                            <div>
                                <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">State Code</label>
                                <select id="cust-add-state" class="shadcn-select">
                                    <option value="27">27 - Maharashtra</option>
                                    <option value="29">29 - Karnataka</option>
                                    <option value="07">07 - Delhi</option>
                                    <option value="33">33 - Tamil Nadu</option>
                                    <option value="24">24 - Gujarat</option>
                                </select>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Approved Credit Limit (&#8377;)</label>
                            <input type="number" id="cust-add-credit" class="shadcn-input" placeholder="0" min="0" step="1000" />
                        </div>
                    </div>
                    <div class="shadcn-modal-footer" style="border-top: 1px solid #1f1f26; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px;">
                        <button type="button" class="shadcn-btn-secondary" onclick="document.getElementById('modal-add-customer').remove()">
                            Cancel
                        </button>
                        <button type="submit" id="cust-submit-btn" class="shadcn-btn-primary" style="background: #22c55e; border-color: #22c55e; color: #09090b; font-weight: 800;">
                            Save to Cloud DB
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async handleAddSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('cust-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        const payload = {
            name: document.getElementById('cust-add-name')?.value.trim(),
            tax_identifier: document.getElementById('cust-add-tax')?.value.trim() || null,
            email: document.getElementById('cust-add-email')?.value.trim() || null,
            phone: document.getElementById('cust-add-phone')?.value.trim() || null,
            state_code: document.getElementById('cust-add-state')?.value || '27',
            credit_limit: parseFloat(document.getElementById('cust-add-credit')?.value || '0')
        };

        try {
            await window.SupabaseClient.createCustomer(payload);
            document.getElementById('modal-add-customer')?.remove();
            window.App.showToast(`Customer "${payload.name}" saved to Supabase!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            console.error("Save customer error", err);
            alert("Failed to save customer: " + err.message);
            submitBtn.disabled = false;
            submitBtn.innerText = 'Save to Cloud DB';
        }
    }
};

window.CustomersView = CustomersView;
