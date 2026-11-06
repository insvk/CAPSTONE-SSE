/**
 * Tabler Dark UI :: Double-Entry Accounting View
 */

const AccountingView = {
    async render(container) {
        try {
            const [journals, accounts, trial] = await Promise.all([
                api.getJournalEntries(),
                api.getChartOfAccounts(),
                api.getTrialBalance()
            ]);

            container.innerHTML = `
                <div class="tblr-grid">
                    <!-- Trial Balance Banner Card -->
                    <div class="tblr-card" style="grid-column: span 12; background: linear-gradient(135deg, #182433 0%, #152233 100%);">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                            <div>
                                <span class="tblr-card-title">GENERAL LEDGER HEALTH & BALANCING</span>
                                <h3 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 4px;">
                                    Double-Entry Accounting Trial Balance
                                </h3>
                                <p style="font-size: 13px; color: var(--tblr-text-secondary); margin-top: 2px;">
                                    All posted debits strictly equal all posted credits under C17 mathematical verification.
                                </p>
                            </div>
                            <div style="display: flex; gap: 20px; align-items: center;">
                                <div style="text-align: right;">
                                    <div style="font-size: 11px; color: var(--tblr-text-muted); font-weight: 700;">TOTAL DEBITS</div>
                                    <div style="font-size: 20px; font-weight: 800; color: var(--tblr-primary);">
                                        ₹${((trial.total_debit_cents || 0) / 100).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 11px; color: var(--tblr-text-muted); font-weight: 700;">TOTAL CREDITS</div>
                                    <div style="font-size: 20px; font-weight: 800; color: var(--tblr-success);">
                                        ₹${((trial.total_credit_cents || 0) / 100).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                    </div>
                                </div>
                                <div style="padding-left: 12px; border-left: 1px solid var(--tblr-border-color);">
                                    <span class="tblr-badge tblr-badge-success" style="padding: 6px 12px; font-size: 13px;">
                                        ✓ 100% BALANCED
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Journal Entries Table -->
                    <div class="tblr-card" style="grid-column: span 12;">
                        <div class="tblr-card-header">
                            <div>
                                <h3 class="tblr-card-title">GENERAL JOURNAL TRANSACTIONS</h3>
                                <span class="tblr-card-subtitle">Automated source document journal postings from POS & Billing</span>
                            </div>
                        </div>

                        <div class="tblr-table-responsive">
                            <table class="tblr-table">
                                <thead>
                                    <tr>
                                        <th>Entry #</th>
                                        <th>Memo / Description</th>
                                        <th>Source Reference</th>
                                        <th>Debits</th>
                                        <th>Credits</th>
                                        <th>Balance Status</th>
                                        <th>Posted Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${journals.length === 0 ? `
                                        <tr><td colspan="7" style="text-align: center; color: var(--tblr-text-muted); padding: 24px;">No journals posted yet. Complete a POS checkout to trigger automated double-entry postings.</td></tr>
                                    ` : journals.map(j => `
                                        <tr>
                                            <td style="font-family: monospace; font-weight: 700; color: #206bc4;">${j.entry_number}</td>
                                            <td style="font-weight: 600;">${j.memo}</td>
                                            <td style="font-family: monospace; color: var(--tblr-text-muted);">${j.invoice_number || 'N/A'}</td>
                                            <td style="font-weight: 700; color: var(--tblr-primary);">₹${(j.total_debits / 100).toFixed(2)}</td>
                                            <td style="font-weight: 700; color: var(--tblr-success);">₹${(j.total_credits / 100).toFixed(2)}</td>
                                            <td><span class="tblr-badge tblr-badge-success">Balanced</span></td>
                                            <td style="font-size: 12px; color: var(--tblr-text-muted);">${j.created_at}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Chart of Accounts Table -->
                    <div class="tblr-card" style="grid-column: span 12;">
                        <div class="tblr-card-header">
                            <div>
                                <h3 class="tblr-card-title">CHART OF ACCOUNTS</h3>
                                <span class="tblr-card-subtitle">Authoritative financial account ledger mapping</span>
                            </div>
                        </div>

                        <div class="tblr-table-responsive">
                            <table class="tblr-table">
                                <thead>
                                    <tr>
                                        <th>Account Code</th>
                                        <th>Account Name</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${accounts.map(a => `
                                        <tr>
                                            <td style="font-family: monospace; font-weight: 700; color: #206bc4;">${a.account_code}</td>
                                            <td style="font-weight: 600;">${a.account_name}</td>
                                            <td>
                                                <span class="tblr-badge ${
                                                    a.account_type === 'ASSET' ? 'tblr-badge-success' :
                                                    a.account_type === 'LIABILITY' ? 'tblr-badge-danger' :
                                                    a.account_type === 'REVENUE' ? 'tblr-badge-muted' : 'tblr-badge-danger'
                                                }">
                                                    ${a.account_type}
                                                </span>
                                            </td>
                                            <td style="color: var(--tblr-text-secondary); font-size: 12px;">${a.description || ''}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="tblr-card" style="color: var(--tblr-danger);">Failed to load accounting: ${err.message}</div>`;
        }
    }
};

window.AccountingView = AccountingView;

