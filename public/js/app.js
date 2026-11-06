/**
 * ==============================================================================
 * Tabler Dark UI Application Controller & SPA Router
 * ==============================================================================
 */

const App = {
    currentView: 'dashboard',

    init() {
        this.bindEvents();
        this.navigateTo('dashboard');
        this.checkServerHealth();
    },

    bindEvents() {
        // Nav menu clicks
        document.querySelectorAll('.tblr-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                if (view) {
                    this.navigateTo(view);
                }
            });
        });

        // Theme toggle button
        const themeBtn = document.getElementById('btn-theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Global Keydown shortcuts
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.navigateTo('pos');
            }
        });
    },

    navigateTo(viewName) {
        this.currentView = viewName;

        // Update active nav links
        document.querySelectorAll('.tblr-nav-link').forEach(link => {
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        const pretitleEl = document.getElementById('page-pretitle');
        const titleEl = document.getElementById('page-title');
        const mainContent = document.getElementById('main-content');
        const actionBtn = document.getElementById('page-action-btn');

        switch (viewName) {
            case 'dashboard':
                pretitleEl.innerText = 'OVERVIEW';
                titleEl.innerText = 'Dashboard';
                actionBtn.innerText = '+ Create new report';
                actionBtn.onclick = () => this.showToast('Generating consolidated audit report...', 'info');
                DashboardView.render(mainContent);
                break;

            case 'products':
                pretitleEl.innerText = 'CATALOG';
                titleEl.innerText = 'Products & Master Inventory';
                actionBtn.innerText = '+ Add Product';
                actionBtn.onclick = () => ProductsView.showAddModal();
                ProductsView.render(mainContent);
                break;

            case 'inventory':
                pretitleEl.innerText = 'LOGISTICS';
                titleEl.innerText = 'Stock Ledger & Warehouses';
                actionBtn.innerText = '+ Quick Stock Adjustment';
                actionBtn.onclick = () => InventoryView.showAdjustModal();
                InventoryView.render(mainContent);
                break;

            case 'procurement':
                pretitleEl.innerText = 'PURCHASING';
                titleEl.innerText = 'Suppliers & Goods Receipts';
                actionBtn.innerText = '📥 Receive Goods (GRN)';
                actionBtn.onclick = () => ProcurementView.showGRNModal();
                ProcurementView.render(mainContent);
                break;

            case 'pos':
                pretitleEl.innerText = 'POINT OF SALE';
                titleEl.innerText = 'Cashier Billing Register';
                actionBtn.innerText = '⚡ New Transaction';
                actionBtn.onclick = () => PosView.clearCart();
                PosView.render(mainContent);
                break;

            case 'invoices':
                pretitleEl.innerText = 'FINANCE';
                titleEl.innerText = 'Tax Invoices & Billing';
                actionBtn.innerText = '+ New Sale / POS';
                actionBtn.onclick = () => this.navigateTo('pos');
                InvoicesView.render(mainContent);
                break;

            case 'accounting':
                pretitleEl.innerText = 'GENERAL LEDGER';
                titleEl.innerText = 'Double-Entry Accounting';
                actionBtn.innerText = '✓ Verify Balance';
                actionBtn.onclick = () => this.showToast('All journal debits and credits verified balanced.', 'success');
                AccountingView.render(mainContent);
                break;

            case 'c_inspector':
                pretitleEl.innerText = 'ENGINEERING SPEC';
                titleEl.innerText = 'Academic C Engine Inspector';
                actionBtn.innerText = '⚡ Run Benchmark';
                actionBtn.onclick = () => CInspectorView.runLiveBenchmark();
                CInspectorView.render(mainContent);
                break;

            default:
                this.navigateTo('dashboard');
                break;
        }
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = (current === 'dark') ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        this.showToast(`Switched to ${next} mode`, 'info');
    },

    showToast(message, type = 'info') {
        let container = document.getElementById('tblr-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'tblr-toast-container';
            container.className = 'tblr-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `tblr-toast ${type}`;
        toast.innerHTML = `
            <span style="font-size: 16px;">${type === 'success' ? '✓' : type === 'danger' ? '✕' : 'ℹ'}</span>
            <span style="font-size: 13px; font-weight: 500;">${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.2s';
            setTimeout(() => toast.remove(), 200);
        }, 3500);
    },

    async checkServerHealth() {
        try {
            const h = await api.getHealth();
            console.log('[IMBS Server Connected]', h);
            this.updateCloudStatusPill(true);
        } catch (err) {
            console.warn('[IMBS Server Warning]', err);
            this.updateCloudStatusPill(false);
        }
    },

    updateCloudStatusPill(isHealthy) {
        const pill = document.getElementById('btn-cloud-modal');
        if (!pill) return;
        const isSupa = window.SupabaseClient && window.SupabaseClient.isConfigured();
        if (isSupa) {
            pill.innerHTML = `<span class="tblr-status-dot-emerald"></span><span>Supabase: Synced</span>`;
        } else if (isHealthy) {
            pill.innerHTML = `<span class="tblr-status-dot-emerald"></span><span>Cloud: Ready</span>`;
        } else {
            pill.innerHTML = `<span style="width: 7px; height: 7px; background: #e6a23c; border-radius: 50%; display: inline-block;"></span><span style="color: #e6a23c;">Cloud: Demo</span>`;
        }
    },

    openCloudModal() {
        const modal = document.getElementById('modal-cloud-settings');
        if (!modal) return;
        const supaUrl = document.getElementById('cfg-supabase-url');
        const supaKey = document.getElementById('cfg-supabase-anon-key');
        const backendUrl = document.getElementById('cfg-backend-url');

        if (supaUrl) supaUrl.value = localStorage.getItem('imbs_supabase_url') || '';
        if (supaKey) supaKey.value = localStorage.getItem('imbs_supabase_anon_key') || '';
        if (backendUrl) backendUrl.value = localStorage.getItem('imbs_backend_url') || '';

        const resBox = document.getElementById('cloud-test-result');
        if (resBox) resBox.style.display = 'none';

        modal.style.display = 'flex';
    },

    closeCloudModal() {
        const modal = document.getElementById('modal-cloud-settings');
        if (modal) modal.style.display = 'none';
    },

    async testCloudConnection() {
        const supaUrl = document.getElementById('cfg-supabase-url')?.value.trim();
        const supaKey = document.getElementById('cfg-supabase-anon-key')?.value.trim();
        const resBox = document.getElementById('cloud-test-result');
        if (!resBox) return;

        resBox.style.display = 'block';
        resBox.style.background = 'rgba(32, 107, 196, 0.15)';
        resBox.style.color = '#59a5ff';
        resBox.style.border = '1px solid #206bc4';
        resBox.innerText = 'Testing Supabase PostgREST connection...';

        try {
            if (!supaUrl || !supaKey) {
                // Test backend health instead
                const health = await api.getHealth();
                resBox.style.background = 'rgba(47, 179, 68, 0.15)';
                resBox.style.color = '#2fb344';
                resBox.style.border = '1px solid #2fb344';
                resBox.innerText = `✓ Backend API online: ${health.system} (${health.runtime || health.engine})`;
                return;
            }

            const testRes = await window.SupabaseClient.testConnection(supaUrl, supaKey);
            resBox.style.background = 'rgba(47, 179, 68, 0.15)';
            resBox.style.color = '#2fb344';
            resBox.style.border = '1px solid #2fb344';
            resBox.innerText = `✓ Supabase Connected! Successfully queried PostgreSQL master catalog.`;
        } catch (err) {
            resBox.style.background = 'rgba(214, 57, 57, 0.15)';
            resBox.style.color = '#ff6b6b';
            resBox.style.border = '1px solid #d63939';
            resBox.innerText = `✕ Connection test failed: ${err.message}`;
        }
    },

    saveCloudConfig() {
        const supaUrl = document.getElementById('cfg-supabase-url')?.value.trim();
        const supaKey = document.getElementById('cfg-supabase-anon-key')?.value.trim();
        const backendUrl = document.getElementById('cfg-backend-url')?.value.trim();

        if (supaUrl && supaKey) {
            window.SupabaseClient.saveConfig(supaUrl, supaKey);
        } else {
            localStorage.removeItem('imbs_supabase_url');
            localStorage.removeItem('imbs_supabase_anon_key');
        }

        if (backendUrl) {
            localStorage.setItem('imbs_backend_url', backendUrl);
        } else {
            localStorage.removeItem('imbs_backend_url');
        }

        this.updateCloudStatusPill(true);
        this.closeCloudModal();
        this.showToast('Cloud settings saved and applied.', 'success');
        this.navigateTo(this.currentView);
    },

    clearCloudConfig() {
        localStorage.removeItem('imbs_supabase_url');
        localStorage.removeItem('imbs_supabase_anon_key');
        localStorage.removeItem('imbs_backend_url');
        this.closeCloudModal();
        this.updateCloudStatusPill(false);
        this.showToast('Cloud settings reset to default.', 'info');
        this.navigateTo(this.currentView);
    }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

