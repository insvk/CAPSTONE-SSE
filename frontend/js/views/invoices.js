/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Tax Invoices, Categorized Billing & Analytics Hub
 * 100% Live Cloud Synchronization with Supabase PostgreSQL 17
 * Includes:
 *   - Options to Clear / Reset TOTAL BILLED REVENUE & PAYMENTS SETTLED
 *   - Universal Categorization of all transactions & invoices
 *   - Multi-dimensional Analytics with Period-over-Period comparisons
 *   - Export & Download Suite (CSV, JSON, GST Tax Reports)
 * ==============================================================================
 */

const InvoicesView = {
    invoices: [],
    activeTab: 'table', // 'table' | 'analytics'
    filterPayment: 'ALL',
    filterCustomerTier: 'ALL',
    filterStatus: 'ALL',
    filterCounter: 'ALL',
    filterPeriod: 'ALL', // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'
    searchQuery: '',

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #27272a; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            this.invoices = await window.SupabaseClient.getInvoices();
            this.renderView(container);
        } catch (err) {
            container.innerHTML = `
                <div class="shadcn-card" style="padding: 24px; color: #ef4444; border: 1px solid #dc2626;">
                    <strong>Error loading invoices from Supabase:</strong> ${err.message}
                </div>
            `;
        }
    },

    getFilteredInvoices() {
        return (this.invoices || []).filter(inv => {
            // Payment filter
            if (this.filterPayment !== 'ALL' && inv.category_payment !== this.filterPayment) {
                return false;
            }
            // Customer tier filter
            if (this.filterCustomerTier !== 'ALL' && inv.category_customer !== this.filterCustomerTier) {
                return false;
            }
            // Status filter
            if (this.filterStatus !== 'ALL') {
                if (this.filterStatus === 'PAID' && inv.status !== 'PAID') return false;
                if (this.filterStatus === 'UNPAID' && inv.status === 'PAID') return false;
            }
            // Counter filter
            if (this.filterCounter !== 'ALL' && !inv.category_counter.includes(this.filterCounter)) {
                return false;
            }
            // Period filter
            if (this.filterPeriod !== 'ALL') {
                const invDate = new Date(inv.invoice_date);
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                if (this.filterPeriod === 'TODAY' && inv.invoice_date !== todayStr) return false;
                if (this.filterPeriod === 'WEEK') {
                    const diffDays = (now - invDate) / (1000 * 60 * 60 * 24);
                    if (diffDays > 7) return false;
                }
                if (this.filterPeriod === 'MONTH') {
                    if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) return false;
                }
            }
            // Search query
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const matchInv = (inv.invoice_number || '').toLowerCase().includes(q);
                const matchCust = (inv.customer_name || '').toLowerCase().includes(q);
                const matchPhone = (inv.customer_phone || '').toLowerCase().includes(q);
                const matchGstin = (inv.customer_gstin || '').toLowerCase().includes(q);
                if (!matchInv && !matchCust && !matchPhone && !matchGstin) return false;
            }
            return true;
        });
    },

    renderView(container) {
        let totalBilled = 0;
        let totalPaid = 0;
        let totalDue = 0;

        this.invoices.forEach(inv => {
            totalBilled += (Number(inv.grand_total) || 0);
            totalPaid += (Number(inv.paid_amount) || 0);
            totalDue += (Number(inv.balance_due) || 0);
        });

        const billedFmt = (totalBilled / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const paidFmt = (totalPaid / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const dueFmt = (totalDue / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

        container.innerHTML = `
            <!-- Top Summary Stats with Clear Controls -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 20px;">
                <div class="shadcn-card" style="padding: 16px; border-left: 4px solid #3b82f6;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">TOTAL BILLED REVENUE</div>
                            <div style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 4px;">₹${billedFmt}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${this.invoices.length} invoices registered</div>
                        </div>
                        <button class="shadcn-btn-secondary" style="font-size: 11px; padding: 4px 8px; color: #ef4444; border-color: rgba(239, 68, 68, 0.35);" onclick="InvoicesView.showClearModal('ALL')" title="Clear Total Billed Revenue & Invoices">
                            Clear Revenue
                        </button>
                    </div>
                </div>

                <div class="shadcn-card" style="padding: 16px; border-left: 4px solid #22c55e;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">PAYMENTS SETTLED</div>
                            <div style="font-size: 24px; font-weight: 800; color: #22c55e; margin-top: 4px;">₹${paidFmt}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Collected cash, UPI &amp; card</div>
                        </div>
                        <button class="shadcn-btn-secondary" style="font-size: 11px; padding: 4px 8px; color: #f59e0b; border-color: rgba(245, 158, 11, 0.35);" onclick="InvoicesView.showClearModal('PAYMENTS')" title="Reset Settled Payments to ₹0">
                            Clear Settled
                        </button>
                    </div>
                </div>

                <div class="shadcn-card" style="padding: 16px; border-left: 4px solid ${totalDue > 0 ? '#ef4444' : '#22c55e'};">
                    <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">OUTSTANDING RECEIVABLES</div>
                    <div style="font-size: 24px; font-weight: 800; color: ${totalDue > 0 ? '#ef4444' : '#22c55e'}; margin-top: 4px;">₹${dueFmt}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Pending customer credit dues</div>
                </div>
            </div>

            <!-- Tab Navigation & Action Center -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; gap: 8px;">
                    <button class="shadcn-btn ${this.activeTab === 'table' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}" onclick="InvoicesView.switchTab('table')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                        Categorized Invoices (${this.invoices.length})
                    </button>
                    <button class="shadcn-btn ${this.activeTab === 'analytics' ? 'shadcn-btn-primary' : 'shadcn-btn-secondary'}" onclick="InvoicesView.switchTab('analytics')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        Analytics &amp; Comparisons Hub
                    </button>
                </div>

                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <!-- Download Suite -->
                    <button class="shadcn-btn-secondary" onclick="InvoicesView.downloadInvoicesCsv()" title="Download Full Categorized Invoices (CSV)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export CSV
                    </button>
                    <button class="shadcn-btn-secondary" onclick="InvoicesView.downloadAnalyticsJson()" title="Download Analytics Dataset (JSON)">
                        Export JSON
                    </button>
                    <button class="shadcn-btn-secondary" onclick="InvoicesView.downloadGstReportCsv()" title="Download GST Tax Reconciliation Schedule">
                        GST Schedule
                    </button>
                    <button class="shadcn-btn-primary" onclick="App.navigateTo('pos')">
                        + New Sale / POS Checkout
                    </button>
                </div>
            </div>

            ${this.activeTab === 'table' ? this.renderTableView() : this.renderAnalyticsView()}

            <!-- Clear / Reset Confirmation Modal -->
            <div id="modal-clear-billing" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 520px; background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #ffffff;">Financial Record Reset</h3>
                                <div style="font-size: 12px; color: var(--text-muted);">Cloud Database Telemetry Management</div>
                            </div>
                        </div>
                        <button type="button" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #a1a1aa;" onclick="InvoicesView.closeClearModal()">&times;</button>
                    </div>

                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 12px 14px; margin-bottom: 18px; font-size: 12px; color: #fca5a5; line-height: 1.5;">
                        <strong>Enterprise Warning:</strong> This operation clears billing telemetry from Supabase Cloud. Download a backup first to preserve financial records.
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="font-size: 12px; font-weight: 600; color: #e4e4e7; display: block; margin-bottom: 8px;">Select Clear Operation:</label>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: #27272a; border-radius: 8px; cursor: pointer;">
                                <input type="radio" name="clear-mode" value="ALL" checked style="margin-top: 3px;" />
                                <div>
                                    <div style="font-size: 13px; font-weight: 600; color: #ffffff;">Clear Total Billed Revenue &amp; All Invoices</div>
                                    <div style="font-size: 11px; color: #a1a1aa;">Resets both Total Billed Revenue and Payments Settled to ₹0 across the entire system.</div>
                                </div>
                            </label>
                            <label style="display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: #27272a; border-radius: 8px; cursor: pointer;">
                                <input type="radio" name="clear-mode" value="PAYMENTS" style="margin-top: 3px;" />
                                <div>
                                    <div style="font-size: 13px; font-weight: 600; color: #ffffff;">Clear Settled Payments Only</div>
                                    <div style="font-size: 11px; color: #a1a1aa;">Resets settled collections to ₹0 while keeping invoices as outstanding receivables.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 18px;">
                        <button type="button" class="shadcn-btn-secondary" style="width: 100%; font-size: 12px;" onclick="InvoicesView.downloadInvoicesCsv()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download Safety Backup Snapshot (CSV) Before Proceeding
                        </button>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; display: block; margin-bottom: 6px;">
                            Confirmation (Type "CLEAR" to proceed):
                        </label>
                        <input type="text" id="clear-confirm-input" class="shadcn-input" placeholder="Type CLEAR" oninput="InvoicesView.validateClearInput()" style="width: 100%;" />
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="shadcn-btn-secondary" onclick="InvoicesView.closeClearModal()">Cancel</button>
                        <button type="button" id="btn-execute-clear" class="shadcn-btn" style="background: #ef4444; color: #fff; font-weight: 600;" disabled onclick="InvoicesView.executeClear()">
                            Confirm Permanent Reset
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tax Invoice Document Modal -->
            <div id="modal-invoice-detail" class="tblr-modal-backdrop" style="display: none;">
                <div class="tblr-modal-dialog" style="max-width: 650px;">
                    <div class="tblr-modal-header">
                        <h3 class="tblr-modal-title">Tax Invoice Document</h3>
                        <button class="tblr-modal-close" onclick="InvoicesView.closeDetailModal()">&times;</button>
                    </div>
                    <div class="tblr-modal-body" id="invoice-doc-body"></div>
                    <div class="tblr-modal-footer">
                        <button type="button" class="tblr-btn tblr-btn-default" onclick="InvoicesView.closeDetailModal()">Close</button>
                        <button type="button" class="tblr-btn tblr-btn-primary" onclick="window.print()">Print Invoice</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderTableView() {
        const filtered = this.getFilteredInvoices();

        return `
            <div class="shadcn-card" style="padding: 16px; margin-bottom: 16px;">
                <!-- Filter Pills Row 1: Payment Method & Customer Tier -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Payment Mode:</span>
                        ${['ALL', 'CASH', 'UPI_QR', 'CARD', 'SPLIT_COMBO'].map(pm => `
                            <button class="shadcn-btn-secondary ${this.filterPayment === pm ? 'active' : ''}" 
                                    style="padding: 3px 9px; font-size: 11px; border-radius: 6px; ${this.filterPayment === pm ? 'background: #3b82f6; color: #fff; border-color: #3b82f6;' : ''}"
                                    onclick="InvoicesView.setFilterPayment('${pm}')">
                                ${pm === 'UPI_QR' ? 'UPI QR' : pm.replace('_', ' ')}
                            </button>
                        `).join('')}
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Customer Segment:</span>
                        ${['ALL', 'Retail Walk-in', 'SIMATS Institutional', 'B2B Wholesale'].map(seg => `
                            <button class="shadcn-btn-secondary ${this.filterCustomerTier === seg ? 'active' : ''}" 
                                    style="padding: 3px 9px; font-size: 11px; border-radius: 6px; ${this.filterCustomerTier === seg ? 'background: #10b981; color: #fff; border-color: #10b981;' : ''}"
                                    onclick="InvoicesView.setFilterCustomerTier('${seg}')">
                                ${seg.replace(' Institutional', '').replace(' Walk-in', '')}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Filter Controls Row 2: Search, Counter & Period -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div style="flex: 1; min-width: 260px;">
                        <input type="text" class="shadcn-input" placeholder="Search by Invoice No, Customer, Mobile, GSTIN..." 
                               value="${this.searchQuery}" oninput="InvoicesView.setSearch(this.value)" style="width: 100%; height: 34px;" />
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <select class="shadcn-select" style="height: 34px; font-size: 12px;" onchange="InvoicesView.setFilterPeriod(this.value)">
                            <option value="ALL" ${this.filterPeriod === 'ALL' ? 'selected' : ''}>All Time</option>
                            <option value="TODAY" ${this.filterPeriod === 'TODAY' ? 'selected' : ''}>Today</option>
                            <option value="WEEK" ${this.filterPeriod === 'WEEK' ? 'selected' : ''}>Last 7 Days</option>
                            <option value="MONTH" ${this.filterPeriod === 'MONTH' ? 'selected' : ''}>This Month</option>
                        </select>

                        <select class="shadcn-select" style="height: 34px; font-size: 12px;" onchange="InvoicesView.setFilterStatus(this.value)">
                            <option value="ALL" ${this.filterStatus === 'ALL' ? 'selected' : ''}>All Statuses</option>
                            <option value="PAID" ${this.filterStatus === 'PAID' ? 'selected' : ''}>Paid Only</option>
                            <option value="UNPAID" ${this.filterStatus === 'UNPAID' ? 'selected' : ''}>Unpaid / Credit</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Invoices Data Table -->
            <div class="shadcn-card" style="padding: 0; overflow: hidden;">
                <div class="tblr-table-responsive">
                    <table class="tblr-table" style="margin: 0; width: 100%;">
                        <thead>
                            <tr style="background: #18181b;">
                                <th style="padding: 12px 14px;">INVOICE NO &amp; STATION</th>
                                <th style="padding: 12px 14px;">CUSTOMER &amp; CATEGORY</th>
                                <th style="padding: 12px 14px;">PAYMENT MODE</th>
                                <th style="padding: 12px 14px; text-align: right;">SUBTOTAL</th>
                                <th style="padding: 12px 14px; text-align: right;">GST TAX</th>
                                <th style="padding: 12px 14px; text-align: right;">GRAND TOTAL</th>
                                <th style="padding: 12px 14px; text-align: center;">SETTLEMENT</th>
                                <th style="padding: 12px 14px; text-align: center;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderRows(filtered)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderRows(filtered) {
        if (!filtered || filtered.length === 0) {
            return `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">No invoices match your categorization criteria.</td></tr>`;
        }

        return filtered.map((inv, idx) => {
            const sub = (inv.subtotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const tax = (inv.tax_amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const grand = (inv.grand_total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const isPaid = inv.status === 'PAID';

            // Payment badge color
            let pmColor = '#3b82f6';
            if (inv.category_payment === 'CASH') pmColor = '#10b981';
            else if (inv.category_payment === 'UPI_QR') pmColor = '#8b5cf6';
            else if (inv.category_payment === 'CARD') pmColor = '#f59e0b';
            else if (inv.category_payment === 'SPLIT_COMBO') pmColor = '#ec4899';

            // Customer badge
            let custBadgeBg = 'rgba(255,255,255,0.06)';
            let custBadgeColor = '#a1a1aa';
            if (inv.category_customer === 'SIMATS Institutional') {
                custBadgeBg = 'rgba(59, 130, 246, 0.15)';
                custBadgeColor = '#60a5fa';
            } else if (inv.category_customer === 'B2B Wholesale') {
                custBadgeBg = 'rgba(16, 185, 129, 0.15)';
                custBadgeColor = '#34d399';
            }

            return `
                <tr style="border-bottom: 1px solid #27272a;">
                    <td style="padding: 12px 14px;">
                        <div style="font-weight: 700; font-family: monospace; color: #ffffff;">${inv.invoice_number}</div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                            ${inv.category_counter} • ${inv.invoice_date}
                        </div>
                    </td>
                    <td style="padding: 12px 14px;">
                        <div style="font-weight: 600; color: #f4f4f5;">${inv.customer_name}</div>
                        <div style="margin-top: 3px;">
                            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${custBadgeBg}; color: ${custBadgeColor};">
                                ${inv.category_customer}
                            </span>
                        </div>
                    </td>
                    <td style="padding: 12px 14px;">
                        <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: ${pmColor}22; color: ${pmColor}; border: 1px solid ${pmColor}44;">
                            ${inv.category_payment.replace('_', ' ')}
                        </span>
                        <div style="font-size: 10px; color: var(--text-muted); margin-top: 3px;">${inv.category_value_tier}</div>
                    </td>
                    <td style="padding: 12px 14px; text-align: right; font-family: monospace; color: #a1a1aa;">₹${sub}</td>
                    <td style="padding: 12px 14px; text-align: right; font-family: monospace; color: #3b82f6;">₹${tax}</td>
                    <td style="padding: 12px 14px; text-align: right; font-weight: 800; font-family: monospace; color: #22c55e; font-size: 14px;">₹${grand}</td>
                    <td style="padding: 12px 14px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: ${isPaid ? '#22c55e22' : '#ef444422'}; color: ${isPaid ? '#22c55e' : '#ef4444'};">
                            ${inv.status}
                        </span>
                    </td>
                    <td style="padding: 12px 14px; text-align: center;">
                        <button class="shadcn-btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="InvoicesView.showInvoiceDetail(${idx})">
                            View / Print
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderAnalyticsView() {
        const invoices = this.invoices || [];

        // 1. Payment Methods Breakdown
        const paymentMap = {};
        // 2. Customer Tier Breakdown
        const customerMap = {};
        // 3. Counter Breakdown
        const counterMap = {};
        // 4. Category Revenue Breakdown
        const categoryRevMap = {};
        // 5. Value Tier Breakdown
        const valueTierMap = {};

        let totalRev = 0;
        let totalTax = 0;

        invoices.forEach(inv => {
            const grand = inv.grand_total / 100;
            const tax = (inv.tax_amount || 0) / 100;
            totalRev += grand;
            totalTax += tax;

            paymentMap[inv.category_payment] = (paymentMap[inv.category_payment] || 0) + grand;
            customerMap[inv.category_customer] = (customerMap[inv.category_customer] || 0) + grand;
            counterMap[inv.category_counter] = (counterMap[inv.category_counter] || 0) + grand;
            valueTierMap[inv.category_value_tier] = (valueTierMap[inv.category_value_tier] || 0) + 1;

            (inv.category_products || ['General Hardware']).forEach(cat => {
                categoryRevMap[cat] = (categoryRevMap[cat] || 0) + grand;
            });
        });

        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
                <!-- Card 1: Revenue by Product Category -->
                <div class="shadcn-card" style="padding: 20px;">
                    <h4 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
                        <span>Revenue by Product Category</span>
                        <span style="font-size: 11px; color: var(--text-muted);">Share %</span>
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${Object.entries(categoryRevMap).map(([cat, val]) => {
                            const pct = totalRev > 0 ? Math.round((val / totalRev) * 100) : 0;
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                        <span style="font-weight: 600; color: #e4e4e7;">${cat}</span>
                                        <span style="font-family: monospace; color: #22c55e;">₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${pct}%)</span>
                                    </div>
                                    <div style="height: 6px; background: #27272a; border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${pct}%; height: 100%; background: #3b82f6; border-radius: 3px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Card 2: Payment Channel Comparison -->
                <div class="shadcn-card" style="padding: 20px;">
                    <h4 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
                        <span>Payment Channel Comparison</span>
                        <span style="font-size: 11px; color: var(--text-muted);">Cash vs Digital</span>
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${Object.entries(paymentMap).map(([pm, val]) => {
                            const pct = totalRev > 0 ? Math.round((val / totalRev) * 100) : 0;
                            let barColor = '#3b82f6';
                            if (pm === 'CASH') barColor = '#10b981';
                            else if (pm === 'UPI_QR') barColor = '#8b5cf6';
                            else if (pm === 'CARD') barColor = '#f59e0b';
                            else if (pm === 'SPLIT_COMBO') barColor = '#ec4899';
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                        <span style="font-weight: 600; color: #e4e4e7;">${pm.replace('_', ' ')}</span>
                                        <span style="font-family: monospace; color: ${barColor};">₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${pct}%)</span>
                                    </div>
                                    <div style="height: 6px; background: #27272a; border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${pct}%; height: 100%; background: ${barColor}; border-radius: 3px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Card 3: Customer Segment Comparison -->
                <div class="shadcn-card" style="padding: 20px;">
                    <h4 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
                        <span>Customer Segment Comparison</span>
                        <span style="font-size: 11px; color: var(--text-muted);">Retail vs SIMATS</span>
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${Object.entries(customerMap).map(([seg, val]) => {
                            const pct = totalRev > 0 ? Math.round((val / totalRev) * 100) : 0;
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                        <span style="font-weight: 600; color: #e4e4e7;">${seg}</span>
                                        <span style="font-family: monospace; color: #34d399;">₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${pct}%)</span>
                                    </div>
                                    <div style="height: 6px; background: #27272a; border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${pct}%; height: 100%; background: #10b981; border-radius: 3px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Card 4: Station / Counter Performance -->
                <div class="shadcn-card" style="padding: 20px;">
                    <h4 style="margin: 0 0 14px 0; font-size: 14px; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
                        <span>POS Counter Station Comparison</span>
                        <span style="font-size: 11px; color: var(--text-muted);">Throughput</span>
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${Object.entries(counterMap).map(([ctr, val]) => {
                            const pct = totalRev > 0 ? Math.round((val / totalRev) * 100) : 0;
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                        <span style="font-weight: 600; color: #e4e4e7;">${ctr}</span>
                                        <span style="font-family: monospace; color: #f59e0b;">₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${pct}%)</span>
                                    </div>
                                    <div style="height: 6px; background: #27272a; border-radius: 3px; overflow: hidden;">
                                        <div style="width: ${pct}%; height: 100%; background: #f59e0b; border-radius: 3px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    switchTab(tab) {
        this.activeTab = tab;
        const container = document.getElementById('imbs-main-view');
        if (container) this.renderView(container);
    },

    setFilterPayment(val) {
        this.filterPayment = val;
        const container = document.getElementById('imbs-main-view');
        if (container) this.renderView(container);
    },

    setFilterCustomerTier(val) {
        this.filterCustomerTier = val;
        const container = document.getElementById('imbs-main-view');
        if (container) this.renderView(container);
    },

    setFilterPeriod(val) {
        this.filterPeriod = val;
        const container = document.getElementById('imbs-main-view');
        if (container) this.renderView(container);
    },

    setFilterStatus(val) {
        this.filterStatus = val;
        const container = document.getElementById('imbs-main-view');
        if (container) this.renderView(container);
    },

    setSearch(q) {
        this.searchQuery = q.trim();
        const container = document.getElementById('imbs-main-view');
        if (container) this.renderView(container);
    },

    // --------------------------------------------------------------------------
    // CLEAR & RESET REVENUE & SETTLED PAYMENTS MODAL
    // --------------------------------------------------------------------------
    showClearModal(defaultMode = 'ALL') {
        const modal = document.getElementById('modal-clear-billing');
        if (!modal) return;
        const radios = modal.querySelectorAll('input[name="clear-mode"]');
        radios.forEach(r => {
            if (r.value === defaultMode) r.checked = true;
        });
        const inp = document.getElementById('clear-confirm-input');
        if (inp) inp.value = '';
        const btn = document.getElementById('btn-execute-clear');
        if (btn) btn.disabled = true;
        modal.style.display = 'flex';
    },

    closeClearModal() {
        const modal = document.getElementById('modal-clear-billing');
        if (modal) modal.style.display = 'none';
    },

    validateClearInput() {
        const inp = document.getElementById('clear-confirm-input')?.value.trim();
        const btn = document.getElementById('btn-execute-clear');
        if (btn) {
            btn.disabled = inp !== 'CLEAR';
        }
    },

    async executeClear() {
        const modal = document.getElementById('modal-clear-billing');
        const selectedMode = modal.querySelector('input[name="clear-mode"]:checked')?.value || 'ALL';
        const btn = document.getElementById('btn-execute-clear');
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Clearing Telemetry...';
        }

        try {
            if (selectedMode === 'ALL') {
                await window.SupabaseClient.clearAllBillingRecords();
                if (window.App && window.App.showToast) {
                    window.App.showToast("Total Billed Revenue & Invoices cleared successfully! (Reset to ₹0)", "success");
                }
            } else {
                await window.SupabaseClient.clearSettledPaymentsOnly();
                if (window.App && window.App.showToast) {
                    window.App.showToast("Payments Settled cleared successfully! (Reset to ₹0)", "success");
                }
            }

            this.closeClearModal();
            // Refresh invoices
            const container = document.getElementById('imbs-main-view');
            await this.render(container);

            // Also refresh dashboard telemetry if active
            if (window.DashboardView && window.DashboardView.refreshData) {
                window.DashboardView.refreshData().catch(() => {});
            }
        } catch (err) {
            alert("Error clearing records: " + err.message);
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Confirm Permanent Reset';
            }
        }
    },

    // --------------------------------------------------------------------------
    // EXPORT & DOWNLOAD SUITE
    // --------------------------------------------------------------------------
    downloadInvoicesCsv() {
        const invoices = this.invoices || [];
        if (invoices.length === 0) {
            alert("No invoice records to download.");
            return;
        }

        const headers = [
            "Invoice Number",
            "Date",
            "Customer Name",
            "Customer Segment",
            "Payment Method",
            "Station Counter",
            "Value Tier",
            "Subtotal (INR)",
            "GST Tax (INR)",
            "Grand Total (INR)",
            "Paid Amount (INR)",
            "Balance Due (INR)",
            "Settlement Status"
        ];

        const rows = invoices.map(inv => [
            `"${inv.invoice_number}"`,
            `"${inv.invoice_date}"`,
            `"${(inv.customer_name || '').replace(/"/g, '""')}"`,
            `"${inv.category_customer}"`,
            `"${inv.category_payment}"`,
            `"${inv.category_counter}"`,
            `"${inv.category_value_tier}"`,
            (inv.subtotal / 100).toFixed(2),
            (inv.tax_amount / 100).toFixed(2),
            (inv.grand_total / 100).toFixed(2),
            (inv.paid_amount / 100).toFixed(2),
            (inv.balance_due / 100).toFixed(2),
            `"${inv.status}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `IMBS_Invoices_Categorized_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    downloadAnalyticsJson() {
        const invoices = this.invoices || [];
        const dataset = {
            metadata: {
                system: "CSA0201-INV-MGMT-BILL-SYS",
                exported_at: new Date().toISOString(),
                total_invoices_count: invoices.length,
                organization: "Saveetha SIMATS Enterprise"
            },
            invoices: invoices
        };

        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataset, null, 2));
        const link = document.createElement("a");
        link.setAttribute("href", jsonStr);
        link.setAttribute("download", `IMBS_Billing_Analytics_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    downloadGstReportCsv() {
        const invoices = this.invoices || [];
        const headers = ["Invoice No", "Date", "Customer Name", "Customer GSTIN", "Taxable Value (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total GST (INR)", "Invoice Total (INR)"];
        const rows = invoices.map(inv => {
            const tax = inv.tax_amount / 100;
            const halfTax = (tax / 2).toFixed(2);
            return [
                `"${inv.invoice_number}"`,
                `"${inv.invoice_date}"`,
                `"${(inv.customer_name || '').replace(/"/g, '""')}"`,
                `"${inv.customer_gstin || 'UNREGISTERED'}"`,
                (inv.subtotal / 100).toFixed(2),
                halfTax,
                halfTax,
                "0.00",
                tax.toFixed(2),
                (inv.grand_total / 100).toFixed(2)
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `IMBS_GST_Tax_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    showInvoiceDetail(idx) {
        const inv = this.invoices[idx];
        if (!inv) return;

        const sub = (inv.subtotal / 100).toFixed(2);
        const tax = (inv.tax_amount / 100).toFixed(2);
        const grand = (inv.grand_total / 100).toFixed(2);
        const store = window.StoreConfig ? window.StoreConfig.getProfile() : {};

        const barcodeSvg = window.BarcodeQR ? window.BarcodeQR.code128(inv.invoice_number, { width: 220, height: 42, showText: true }) : '';
        const upiUrl = window.BarcodeQR ? window.BarcodeQR.getUpiUrl(store, { grand_total_cents: inv.grand_total, invoice_number: inv.invoice_number }) : '';
        const qrSvg = (window.BarcodeQR && upiUrl) ? window.BarcodeQR.qr(upiUrl, { size: 90 }) : '';

        const body = document.getElementById('invoice-doc-body');
        if (!body) return;

        body.innerHTML = `
            <div style="background: #ffffff; color: #111; padding: 24px; border-radius: 8px; font-family: sans-serif; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
                    <div>
                        <h2 style="margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase;">TAX INVOICE</h2>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Original for Recipient • Sequential Bill</div>
                        <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 2px;">GSTIN Compliant Document • ${inv.category_counter}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 15px; color: #0f172a;">${store.shop_name || 'SSE ENTERPRISE'}</div>
                        <div style="font-size: 11px; color: #64748b;">${store.tagline || ''}</div>
                        <div style="font-size: 11px; color: #64748b;">${store.address_line1 || ''}, ${store.address_line2 || ''}</div>
                        <div style="font-size: 11px; font-weight: 700; color: #0f172a;">GSTIN: ${store.gstin || '27AABCU9603R1ZM'}</div>
                        <div style="font-size: 11px; color: #64748b;">Phone: ${store.phone || '+91 98765 43210'}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div>
                        <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">BILLED TO:</div>
                        <div style="font-weight: bold; font-size: 14px; margin-top: 2px;">${inv.customer_name || 'Walk-in Cash Customer'}</div>
                        <div style="font-size: 12px; color: #475569;">Segment: ${inv.category_customer}</div>
                    </div>
                    <div style="text-align: right;">
                        <div><strong>Invoice No:</strong> ${inv.invoice_number}</div>
                        <div><strong>Invoice Date:</strong> ${inv.invoice_date}</div>
                        <div><strong>Payment Mode:</strong> <span style="font-weight: bold; color: #2563eb;">${inv.category_payment.replace('_', ' ')}</span></div>
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
                                <td style="padding: 8px;">Standard Merchandize Item</td>
                                <td style="text-align: center; padding: 8px;">1</td>
                                <td style="text-align: right; padding: 8px;">₹${sub}</td>
                                <td style="text-align: right; padding: 8px;">₹${sub}</td>
                            </tr>
                        `}
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                    <div style="display: flex; gap: 16px; align-items: center;">
                        <div style="text-align: center;">
                            ${qrSvg}
                            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">UPI / QR Verification</div>
                        </div>
                        <div>
                            ${barcodeSvg}
                        </div>
                    </div>
                    <div style="width: 240px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                            <span>Subtotal:</span><span>₹${sub}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                            <span>GST Tax:</span><span>₹${tax}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-top: 2px solid #0f172a; font-weight: bold; font-size: 15px;">
                            <span>Total Due:</span><span>₹${grand}</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 18px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
                    ${store.footer_note || 'Thank you for shopping with us!'}
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
