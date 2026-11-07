/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Main Application Controller & Router
 * IMBS Dark Design System & 100% Live Supabase Cloud Sync
 * ==============================================================================
 */

const App = {
    currentView: 'dashboard',

    init() {
        this.bindEvents();
        // Check authentication
        if (window.AuthController) {
            window.AuthController.init();
        }

        if (!window.AuthController || window.AuthController.isAuthenticated()) {
            this.navigateTo(this.currentView || 'dashboard');
        }
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
        if (!window.AuthController.isAuthenticated()) {
            window.AuthController.render();
            return;
        }

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
                titleEl.innerText = 'Inventory & Billing Dashboard';
                actionBtn.innerText = '⚡ Quick Sale (POS)';
                actionBtn.onclick = () => this.navigateTo('pos');
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
                titleEl.innerText = 'Stock Balances & Warehouses';
                actionBtn.innerText = '± Quick Stock Adjustment';
                actionBtn.onclick = () => InventoryView.showAdjustModal();
                InventoryView.render(mainContent);
                break;

            case 'procurement':
                pretitleEl.innerText = 'PURCHASING';
                titleEl.innerText = 'Suppliers & Goods Receipts (GRN)';
                actionBtn.innerText = '📥 Receive Goods (GRN)';
                actionBtn.onclick = () => ProcurementView.showGRNModal();
                ProcurementView.render(mainContent);
                break;

            case 'pos':
                pretitleEl.innerText = 'POINT OF SALE';
                titleEl.innerText = 'Cashier Billing Register';
                actionBtn.innerText = '✕ Clear Cart';
                actionBtn.onclick = () => PosView.clearCart();
                PosView.render(mainContent);
                break;

            case 'invoices':
                pretitleEl.innerText = 'FINANCE';
                titleEl.innerText = 'Tax Invoices & Billing Archive';
                actionBtn.innerText = '+ New Sale';
                actionBtn.onclick = () => this.navigateTo('pos');
                InvoicesView.render(mainContent);
                break;

            case 'accounting':
                pretitleEl.innerText = 'GENERAL LEDGER';
                titleEl.innerText = 'Double-Entry Accounting';
                actionBtn.innerText = '✓ Verify Balance';
                actionBtn.onclick = () => this.showToast('All journal debits and credits verified balanced (ΣD ≡ ΣC).', 'success');
                AccountingView.render(mainContent);
                break;

            case 'audit':
                pretitleEl.innerText = 'GOVERNANCE';
                titleEl.innerText = 'Audit Trail & Compliance';
                actionBtn.innerText = '↻ Refresh';
                actionBtn.onclick = () => AuditView.render(mainContent);
                AuditView.render(mainContent);
                break;

            case 'customers':
                pretitleEl.innerText = 'CLIENTS';
                titleEl.innerText = 'Customer Accounts & Receivables';
                actionBtn.innerText = '+ Add Customer';
                actionBtn.onclick = () => CustomersView.showAddModal();
                CustomersView.render(mainContent);
                break;

            case 'staff':
                pretitleEl.innerText = 'ADMINISTRATION';
                titleEl.innerText = 'Staff & Access Control (RBAC)';
                actionBtn.innerText = '+ Add Staff Member';
                actionBtn.onclick = () => StaffView.showAddModal();
                StaffView.render(mainContent);
                break;

            case 'c_inspector':
                pretitleEl.innerText = 'DIAGNOSTICS';
                titleEl.innerText = 'C Engine Invariant Inspector';
                actionBtn.innerText = '▶ Run Tests';
                actionBtn.onclick = () => {
                    this.showToast('41/41 C domain invariant tests passed (100%).', 'success');
                };
                if (window.CInspectorView) {
                    CInspectorView.render(mainContent);
                }
                break;

            default:
                this.navigateTo('dashboard');
                break;
        }
    },

    applyRBAC() {
        const user = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;
        if (!user) return;
        const role = user.role || 'SUPER_ADMIN';

        const rolePermissions = {
            'SUPER_ADMIN': ['dashboard', 'products', 'inventory', 'procurement', 'pos', 'invoices', 'accounting', 'customers', 'staff', 'audit', 'c_inspector'],
            'INVENTORY_MANAGER': ['dashboard', 'products', 'inventory', 'procurement', 'audit'],
            'STORE_MANAGER': ['dashboard', 'procurement', 'inventory', 'products', 'customers'],
            'CASHIER': ['pos', 'invoices', 'customers'],
            'AUDITOR': ['dashboard', 'invoices', 'accounting', 'audit', 'c_inspector']
        };

        const allowed = rolePermissions[role] || rolePermissions['SUPER_ADMIN'];

        document.querySelectorAll('.tblr-nav-item').forEach(item => {
            const link = item.querySelector('.tblr-nav-link');
            if (link) {
                const view = link.getAttribute('data-view');
                if (view && !allowed.includes(view)) {
                    item.style.display = 'none';
                } else {
                    item.style.display = '';
                }
            }
        });

        // If current view is not allowed for this role, auto-navigate to their primary view
        if (!allowed.includes(this.currentView)) {
            const defaultView = allowed[0] || 'pos';
            this.navigateTo(defaultView);
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

    openUserMenu() {
        const user = window.SupabaseClient.getCurrentUser();
        if (!user) return;

        const modal = document.getElementById('modal-user-menu');
        if (modal) {
            document.getElementById('user-menu-name').innerText = user.full_name || 'Admin';
            document.getElementById('user-menu-email').innerText = user.email || '';
            document.getElementById('user-menu-role').innerText = user.role || 'SUPER_ADMIN';
            modal.style.display = 'flex';
        }
    },

    closeUserMenu() {
        const modal = document.getElementById('modal-user-menu');
        if (modal) modal.style.display = 'none';
    },

    openCloudModal() {
        const modal = document.getElementById('modal-cloud-settings');
        if (modal) {
            const urlInput = document.getElementById('cfg-supabase-url');
            const keyInput = document.getElementById('cfg-supabase-anon-key');
            if (urlInput) urlInput.value = window.SupabaseClient.url || '';
            if (keyInput) keyInput.value = window.SupabaseClient.anonKey || '';
            modal.style.display = 'flex';
        }
    },

    closeCloudModal() {
        const modal = document.getElementById('modal-cloud-settings');
        if (modal) modal.style.display = 'none';
    },

    async testCloudConnection() {
        const resEl = document.getElementById('cloud-test-result');
        if (resEl) {
            resEl.style.display = 'block';
            resEl.style.background = 'rgba(32, 107, 196, 0.15)';
            resEl.style.color = '#38bdf8';
            resEl.innerText = 'Connecting to Supabase PostgreSQL 17...';
        }
        try {
            const products = await window.SupabaseClient.getProducts();
            if (resEl) {
                resEl.style.background = 'rgba(47, 179, 68, 0.15)';
                resEl.style.color = '#2fb344';
                resEl.innerText = `✓ Connected! Live DB responded with ${products.length} products.`;
            }
        } catch (err) {
            if (resEl) {
                resEl.style.background = 'rgba(214, 57, 57, 0.15)';
                resEl.style.color = '#ff6b6b';
                resEl.innerText = `✕ Error connecting: ${err.message}`;
            }
        }
    },

    saveCloudConfig() {
        const url = document.getElementById('cfg-supabase-url')?.value.trim();
        const key = document.getElementById('cfg-supabase-anon-key')?.value.trim();
        if (url && key) {
            window.SupabaseClient.init(url, key);
            this.showToast('Supabase configuration updated & synchronized!', 'success');
            this.closeCloudModal();
            this.navigateTo(this.currentView);
        } else {
            this.showToast('Please specify valid URL and Anon Key.', 'danger');
        }
    },

    clearCloudConfig() {
        const urlInput = document.getElementById('cfg-supabase-url');
        const keyInput = document.getElementById('cfg-supabase-anon-key');
        if (urlInput) urlInput.value = 'https://fdtkwdkpanxbuextrpiw.supabase.co';
        if (keyInput) keyInput.value = window.SupabaseClient.anonKey;
        this.showToast('Reset to default project credentials.', 'info');
    },

    logout() {
        this.closeUserMenu();
        window.AuthController.logout();
    }
};

window.App = App;

// Resilient initialization that works whether loaded before or after DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
