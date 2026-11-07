/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Governance & Audit Trail View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL
 * ==============================================================================
 */

const AuditView = {
    events: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            this.events = await window.SupabaseClient.getAuditEvents();
            this.renderTable(container);
        } catch (err) {
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading audit log:</strong> ${err.message}
                </div>
            `;
        }
    },

    renderTable(container) {
        container.innerHTML = `
            <div class="tblr-card">
                <div class="tblr-card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--tblr-border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 class="tblr-card-title" style="margin: 0; font-size: 16px;">System Audit & Non-Repudiation Log (${this.events.length})</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            Immutable append-only record of all system events, authentication, and state modifications
                        </div>
                    </div>
                    <button class="tblr-btn tblr-btn-default" onclick="AuditView.render(document.getElementById('main-content'))">
                        Refresh Logs
                    </button>
                </div>

                <div class="tblr-table-responsive">
                    <table class="tblr-table">
                        <thead>
                            <tr>
                                <th>TIMESTAMP</th>
                                <th>ACTION</th>
                                <th>ENTITY TYPE</th>
                                <th>ENTITY ID</th>
                                <th>EVENT DETAILS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.events.length === 0 ? `
                                <tr><td colspan="5" style="text-align: center; color: var(--tblr-text-muted); padding: 32px;">No audit events recorded yet.</td></tr>
                            ` : this.events.map(ev => {
                                const d = new Date(ev.created_at).toLocaleString();
                                const isAuth = ev.action.startsWith('AUTH');
                                const isSale = ev.action.includes('SALE') || ev.action.includes('CHECKOUT');
                                return `
                                    <tr>
                                        <td style="font-size: 12px; color: var(--tblr-text-muted); font-family: monospace;">${d}</td>
                                        <td>
                                            <span class="tblr-badge ${isAuth ? 'tblr-badge-green' : isSale ? 'tblr-badge-blue' : 'tblr-badge-dark'}">
                                                ${ev.action}
                                            </span>
                                        </td>
                                        <td style="font-weight: 600; color: #fff;">${ev.entity_type}</td>
                                        <td style="font-family: monospace; font-size: 11px; color: var(--tblr-text-secondary);">${ev.entity_id}</td>
                                        <td style="font-size: 12px; color: #e2e8f0;">${ev.details}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

window.AuditView = AuditView;

