/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Double-Entry Accounting & General Ledger View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL
 * ==============================================================================
 */

const AccountingView = {
    journals: [],
    accounts: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            const [j, a] = await Promise.all([
                window.SupabaseClient.getJournalEntries(),
                window.SupabaseClient.getChartOfAccounts()
            ]);
            this.journals = j;
            this.accounts = a;
            this.renderView(container);
        } catch (err) {
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading accounting ledger:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderView(container) {
        let totalDebits = 0;
        let totalCredits = 0;

        this.journals.forEach(j => {
            totalDebits += Number(j.total_debit) || 0;
            totalCredits += Number(j.total_credit) || 0;
        });

        const isBalanced = totalDebits === totalCredits;
        const debitsFmt = (totalDebits / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const creditsFmt = (totalCredits / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

        container.innerHTML = `
            <!-- Invariant Status Banner -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 20px;">
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">TOTAL POSTED DEBITS</div>
                    <div style="font-size: 22px; font-weight: 800; color: #206bc4; margin-top: 4px; font-family: monospace;">₹${debitsFmt}</div>
                </div>
                <div class="tblr-card" style="padding: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">TOTAL POSTED CREDITS</div>
                    <div style="font-size: 22px; font-weight: 800; color: #2fb344; margin-top: 4px; font-family: monospace;">₹${creditsFmt}</div>
                </div>
                <div class="tblr-card" style="padding: 16px; border-left: 4px solid ${isBalanced ? '#2fb344' : '#d63939'};">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--tblr-text-muted); font-weight: 700;">DOUBLE-ENTRY INVARIANT</div>
                    <div style="font-size: 18px; font-weight: 800; color: ${isBalanced ? '#2fb344' : '#ff6b6b'}; margin-top: 6px;">
                        ${isBalanced ? '✓ 100% BALANCED (ΣD ≡ ΣC)' : '✕ UNBALANCED RESIDUAL'}
                    </div>
                </div>
            </div>

            <!-- Journal Entries Table -->
            <div class="tblr-card" style="margin-bottom: 24px;">
                <div class="tblr-card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--tblr-border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 class="tblr-card-title" style="margin: 0; font-size: 16px;">Posted Journal Entries (${this.journals.length})</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            Immutable double-entry transaction journal with automated tax and revenue distribution
                        </div>
                    </div>
                    <button class="tblr-btn tblr-btn-default" onclick="AccountingView.render(document.getElementById('main-content'))">
                        ↻ Refresh Ledger
                    </button>
                </div>

                <div class="tblr-table-responsive">
                    <table class="tblr-table">
                        <thead>
                            <tr>
                                <th>ENTRY NO / DATE</th>
                                <th>SOURCE / NARRATION</th>
                                <th>DEBIT & CREDIT LINES</th>
                                <th style="text-align: right;">TOTAL (₹)</th>
                                <th style="text-align: center;">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.journals.length === 0 ? `
                                <tr><td colspan="5" style="text-align: center; color: var(--tblr-text-muted); padding: 32px;">No journal entries posted yet.</td></tr>
                            ` : this.journals.map(j => {
                                const tot = (j.total_debit / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                                return `
                                    <tr>
                                        <td style="vertical-align: top;">
                                            <div style="font-weight: 700; font-family: monospace; color: #fff;">${j.entry_number}</div>
                                            <div style="font-size: 11px; color: var(--tblr-text-muted);">${j.entry_date}</div>
                                        </td>
                                        <td style="vertical-align: top;">
                                            <div style="font-weight: 600; color: #e2e8f0;">${j.narration}</div>
                                            <div style="font-size: 11px; color: var(--tblr-primary); font-family: monospace;">Doc: ${j.source_document || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div style="font-size: 12px; font-family: monospace; line-height: 1.6;">
                                                ${(j.lines || []).map(l => {
                                                    const isDeb = l.debit > 0;
                                                    const amt = isDeb ? (l.debit / 100).toFixed(2) : (l.credit / 100).toFixed(2);
                                                    return `
                                                        <div style="display: flex; justify-content: space-between; gap: 16px; color: ${isDeb ? '#93c5fd' : '#86efac'};">
                                                            <span>${isDeb ? 'Dr' : '&nbsp;&nbsp;Cr'} ${l.account_code} - ${l.account_name}</span>
                                                            <span style="font-weight: bold;">₹${amt}</span>
                                                        </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </td>
                                        <td style="text-align: right; vertical-align: top; font-weight: 800; font-family: monospace; color: #2fb344;">
                                            ₹${tot}
                                        </td>
                                        <td style="text-align: center; vertical-align: top;">
                                            <span class="tblr-badge tblr-badge-green">${j.status}</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Chart of Accounts -->
            <div class="tblr-card">
                <div class="tblr-card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--tblr-border-color);">
                    <h3 class="tblr-card-title" style="margin: 0; font-size: 15px;">Standard Chart of Accounts</h3>
                </div>
                <div class="tblr-table-responsive">
                    <table class="tblr-table">
                        <thead>
                            <tr>
                                <th>ACCOUNT CODE</th>
                                <th>ACCOUNT NAME</th>
                                <th>CLASSIFICATION</th>
                                <th style="text-align: center;">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.accounts.map(a => `
                                <tr>
                                    <td style="font-weight: 700; font-family: monospace; color: #fff;">${a.code}</td>
                                    <td style="color: #e2e8f0; font-weight: 600;">${a.name}</td>
                                    <td><span class="tblr-badge tblr-badge-blue">${a.account_type}</span></td>
                                    <td style="text-align: center;"><span class="tblr-badge tblr-badge-green">ACTIVE</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

window.AccountingView = AccountingView;
