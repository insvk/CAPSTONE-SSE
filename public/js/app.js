/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Main Application Controller & Router
 * Shadcn UI Kit Dark Theme & 100% Live Supabase Cloud Sync
 * ==============================================================================
 */

const App = {
    currentView: 'dashboard',

    init() {
        this.bindEvents();
        // Load dynamic store configuration from cloud DB
        if (window.StoreConfig && window.StoreConfig.loadFromCloud) {
            window.StoreConfig.loadFromCloud().catch(() => {});
        }
        // Check authentication
        if (window.AuthController) {
            window.AuthController.init();
        }

        if (!window.AuthController || window.AuthController.isAuthenticated()) {
            this.updateUserDisplay();
            this.applyRBAC();
            this.navigateTo(this.currentView || 'dashboard');
        }
    },

    bindEvents() {
        // Sidebar Navigation Clicks
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.shadcn-nav-item[data-view], .tblr-nav-link[data-view]');
            if (navItem) {
                e.preventDefault();
                const view = navItem.getAttribute('data-view');
                if (view) {
                    this.navigateTo(view);
                }
            }
        });

        // Sidebar Toggle Button
        const toggleBtn = document.getElementById('btn-sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const sidebar = document.getElementById('app-sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('collapsed');
                }
            });
        }

        // Theme toggle button
        const themeBtn = document.getElementById('btn-theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Global Keydown shortcuts (Ctrl+K or ⌘K)
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const search = document.getElementById('global-search-input');
                if (search) {
                    search.focus();
                    search.select();
                } else {
                    this.navigateTo('pos');
                }
            }
        });
    },

    updateUserDisplay() {
        const user = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;
        if (!user) return;

        const name = user.full_name || 'Naresh S';
        const email = user.email || 'admin@sse.inv.com';
        const role = user.role || 'SUPER_ADMIN';
        const avatarUrl = user.avatar_url;

        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NS';

        // Update Sidebar User Card
        const sideName = document.getElementById('sidebar-user-name');
        const sideEmail = document.getElementById('sidebar-user-email');
        const sideAvatar = document.getElementById('sidebar-user-avatar');

        if (sideName) sideName.innerText = name;
        if (sideEmail) sideEmail.innerText = email;
        if (sideAvatar) {
            if (avatarUrl) {
                sideAvatar.innerHTML = `<img src="${avatarUrl}" alt="${name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.innerText='${initials}'">`;
            } else {
                sideAvatar.innerText = initials;
            }
        }

        // Update Modal User Card
        const menuName = document.getElementById('user-menu-name');
        const menuEmail = document.getElementById('user-menu-email');
        const menuAvatar = document.getElementById('user-menu-avatar');
        const menuRole = document.getElementById('user-menu-role');

        if (menuName) menuName.innerText = name;
        if (menuEmail) menuEmail.innerText = email;
        if (menuAvatar) {
            if (avatarUrl) {
                menuAvatar.innerHTML = `<img src="${avatarUrl}" alt="${name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.innerText='${initials}'">`;
            } else {
                menuAvatar.innerText = initials;
            }
        }
        if (menuRole) menuRole.innerText = role;
    },

    openEditMyProfileModal() {
        this.closeUserMenu();
        const user = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;
        if (!user) return;

        const modal = document.getElementById('modal-edit-my-profile');
        if (!modal) return;

        const nameInput = document.getElementById('my-profile-name');
        const titleInput = document.getElementById('my-profile-title');
        const avatarInput = document.getElementById('my-profile-avatar-url');

        if (nameInput) nameInput.value = user.full_name || '';
        if (titleInput) titleInput.value = user.job_title || '';
        if (avatarInput) avatarInput.value = user.avatar_url || '';

        this.updateMyAvatarPreview(user.avatar_url);
        modal.style.display = 'flex';
    },

    closeEditMyProfileModal() {
        const modal = document.getElementById('modal-edit-my-profile');
        if (modal) modal.style.display = 'none';
    },

    setMyAvatarPreset(url) {
        const input = document.getElementById('my-profile-avatar-url');
        if (input) {
            input.value = url;
            this.updateMyAvatarPreview(url);
        }
    },

    updateMyAvatarPreview(url) {
        const user = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;
        const initials = user && user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'NS';
        const img = document.getElementById('my-profile-img-preview');
        const init = document.getElementById('my-profile-init-preview');

        if (url && url.trim()) {
            if (img) {
                img.src = url.trim();
                img.style.display = 'block';
                img.onerror = () => {
                    img.style.display = 'none';
                    if (init) init.style.display = 'flex';
                };
            }
            if (init) init.style.display = 'none';
        } else {
            if (img) img.style.display = 'none';
            if (init) {
                init.innerText = initials;
                init.style.display = 'flex';
            }
        }
    },

    async saveMyProfile(e) {
        e.preventDefault();
        const user = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;
        if (!user) return;

        const btn = document.getElementById('btn-save-my-profile');
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Saving to Supabase...';
        }

        const fullName = document.getElementById('my-profile-name')?.value.trim();
        const jobTitle = document.getElementById('my-profile-title')?.value.trim();
        const avatarUrl = document.getElementById('my-profile-avatar-url')?.value.trim();

        try {
            await window.SupabaseClient.updateUserProfile(user.id, {
                full_name: fullName,
                job_title: jobTitle,
                avatar_url: avatarUrl
            });

            this.closeEditMyProfileModal();
            this.showToast('Profile and avatar updated in Supabase cloud!', 'success');
            this.updateUserDisplay();

            // Refresh current view if it's staff or dashboard
            if (this.currentView === 'staff' && window.StaffView) {
                window.StaffView.render(document.getElementById('main-content'));
            } else if (this.currentView === 'dashboard' && window.DashboardView) {
                window.DashboardView.render(document.getElementById('main-content'));
            }
        } catch (err) {
            console.error("Save my profile error", err);
            this.showToast("Failed to save profile: " + err.message, "danger");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Save Profile & Photo';
            }
        }
    },

    navigateTo(viewName) {
        if (!window.AuthController.isAuthenticated()) {
            window.AuthController.render();
            return;
        }

        this.currentView = viewName;

        // Update active nav links in Left Sidebar
        document.querySelectorAll('.shadcn-nav-item, .tblr-nav-link').forEach(link => {
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        this.updateUserDisplay();

        try {
            switch (viewName) {
                case 'dashboard':
                    DashboardView.render(mainContent);
                    break;

                case 'products':
                    ProductsView.render(mainContent);
                    break;

                case 'inventory':
                    InventoryView.render(mainContent);
                    break;

                case 'procurement':
                    ProcurementView.render(mainContent);
                    break;

                case 'pos':
                    PosView.render(mainContent);
                    break;

                case 'invoices':
                    InvoicesView.render(mainContent);
                    break;

                case 'accounting':
                    AccountingView.render(mainContent);
                    break;

                case 'audit':
                    AuditView.render(mainContent);
                    break;

                case 'customers':
                    CustomersView.render(mainContent);
                    break;

                case 'staff':
                    StaffView.render(mainContent);
                    break;

                case 'c_inspector':
                    if (window.CInspectorView) {
                        CInspectorView.render(mainContent);
                    }
                    break;

                default:
                    this.navigateTo('dashboard');
                    break;
            }
        } catch (err) {
            console.error(`[Router Render Error: ${viewName}]`, err);
            mainContent.innerHTML = `
                <div class="shadcn-card" style="border-color: #ef4444; color: #ef4444; padding: 24px;">
                    <h3 style="margin: 0 0 8px 0; color: #ffffff;">Failed to render view: ${viewName}</h3>
                    <p style="color: var(--text-muted); font-size: 13px; margin: 0 0 16px 0;">${err.message}</p>
                    <button class="shadcn-btn-primary" onclick="App.navigateTo('${viewName}')">Retry View</button>
                </div>
            `;
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

        document.querySelectorAll('.shadcn-nav-item[data-view]').forEach(item => {
            const view = item.getAttribute('data-view');
            if (view && !allowed.includes(view)) {
                item.style.display = 'none';
            } else {
                item.style.display = 'flex';
            }
        });

        // If current view is not allowed for this role, auto-navigate to their primary view
        if (!allowed.includes(this.currentView)) {
            const defaultView = allowed[0] || 'pos';
            this.navigateTo(defaultView);
        }
    },

    handleSearchKey(e) {
        if (e.key === 'Enter') {
            const q = e.target.value.trim();
            if (!q) return;

            // Navigate to products and filter
            this.navigateTo('products');
            setTimeout(() => {
                const search = document.getElementById('prod-search-input');
                if (search && window.ProductsView) {
                    search.value = q;
                    window.ProductsView.filterProducts(q);
                }
            }, 100);
        }
    },

    async exportData() {
        this.showToast('Generating enterprise CSV report from live Supabase cloud...', 'info');
        try {
            const [balances, invoices] = await Promise.all([
                window.SupabaseClient.getInventoryBalances(),
                window.SupabaseClient.getInvoices()
            ]);

            const rows = [
                ['--- INVENTORY BALANCES & VALUATION ---'],
                ['SKU', 'Product Name', 'Warehouse', 'On Hand', 'Reserved', 'Unit WAC (INR)', 'Total Valuation (INR)', 'Low Stock'],
                ...balances.map(b => [
                    `"${b.sku}"`,
                    `"${b.product_name}"`,
                    `"${b.warehouse_name}"`,
                    b.quantity_on_hand,
                    b.quantity_reserved,
                    (b.weighted_avg_cost / 100).toFixed(2),
                    ((b.quantity_on_hand * b.weighted_avg_cost) / 100).toFixed(2),
                    b.is_low_stock ? 'YES' : 'NO'
                ]),
                [],
                ['--- SALES & TAX INVOICES ---'],
                ['Invoice #', 'Date', 'Customer', 'Subtotal (INR)', 'Tax GST (INR)', 'Grand Total (INR)', 'Status'],
                ...invoices.map(inv => [
                    `"${inv.invoice_number}"`,
                    `"${inv.invoice_date}"`,
                    `"${inv.customer_name}"`,
                    (inv.subtotal / 100).toFixed(2),
                    (inv.tax_amount / 100).toFixed(2),
                    (inv.grand_total / 100).toFixed(2),
                    inv.status
                ])
            ];

            const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `IMBS_Enterprise_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            this.showToast('Export complete: IMBS_Enterprise_Report.csv downloaded.', 'success');
        } catch (err) {
            console.error('[Export error]', err);
            this.showToast('Export failed: ' + err.message, 'danger');
        }
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = (current === 'dark') ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        this.showToast(`Switched to ${next} theme`, 'info');
    },

    showToast(message, type = 'info') {
        let container = document.getElementById('tblr-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'tblr-toast-container';
            container.className = 'tblr-toast-container';
            container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bg = type === 'success' ? '#15803d' : type === 'danger' ? '#b91c1c' : '#1e293b';
        toast.style.cssText = `background: ${bg}; color: #ffffff; padding: 10px 16px; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; border: 1px solid rgba(255,255,255,0.1); animation: slideIn 0.2s ease-out;`;
        toast.innerHTML = `
            <span>${message}</span>
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
        const user = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;
        if (!user) return;

        const modal = document.getElementById('modal-user-menu');
        if (modal) {
            this.updateUserDisplay();
            modal.style.display = 'flex';
        }
    },

    closeUserMenu() {
        const modal = document.getElementById('modal-user-menu');
        if (modal) modal.style.display = 'none';
    },

    openStoreProfileModal() {
        const modal = document.getElementById('modal-store-profile');
        if (modal) {
            const p = window.StoreConfig ? window.StoreConfig.getProfile() : {};
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            };
            setVal('cfg-store-name', p.shop_name);
            setVal('cfg-store-tagline', p.tagline);
            setVal('cfg-store-addr1', p.address_line1);
            setVal('cfg-store-addr2', p.address_line2);
            setVal('cfg-store-phone', p.phone);
            setVal('cfg-store-email', p.email);
            setVal('cfg-store-gstin', p.gstin);
            setVal('cfg-store-fssai', p.fssai);
            setVal('cfg-store-upi', p.upi_id || 'sse.retail@icici');
            setVal('cfg-store-footer', p.footer_note);
            modal.style.display = 'flex';
        }
    },

    closeStoreProfileModal() {
        const modal = document.getElementById('modal-store-profile');
        if (modal) modal.style.display = 'none';
    },

    async saveStoreProfile(e) {
        if (e) e.preventDefault();
        const getVal = (id) => document.getElementById(id)?.value.trim() || '';
        const payload = {
            shop_name: getVal('cfg-store-name') || 'SSE Enterprise Hub & Retail',
            tagline: getVal('cfg-store-tagline') || 'High-Performance Multi-Counter POS',
            address_line1: getVal('cfg-store-addr1') || 'Plot 42, Tech Park Avenue, BKC Complex',
            address_line2: getVal('cfg-store-addr2') || 'Mumbai, Maharashtra - 400051',
            phone: getVal('cfg-store-phone') || '+91 98765 43210',
            email: getVal('cfg-store-email') || 'contact@sse.inv.com',
            gstin: getVal('cfg-store-gstin') || '27AABCU9603R1ZM',
            fssai: getVal('cfg-store-fssai') || '',
            upi_id: getVal('cfg-store-upi') || 'sse.retail@icici',
            footer_note: getVal('cfg-store-footer') || 'Thank you for shopping with SSE Enterprise! Visit again.'
        };

        if (window.StoreConfig) {
            await window.StoreConfig.saveProfile(payload);
            this.showToast('Store details saved to Supabase cloud! All printed bills updated.', 'success');
            this.closeStoreProfileModal();
            if (this.currentView === 'pos' && window.PosView) {
                window.PosView.render(document.getElementById('main-content'));
            } else if (this.currentView === 'invoices' && window.InvoicesView) {
                window.InvoicesView.render(document.getElementById('main-content'));
            }
        }
    },

    openCloudModal() {
        const modal = document.getElementById('modal-cloud-settings');
        if (modal) {
            const urlInput = document.getElementById('cfg-supabase-url');
            const keyInput = document.getElementById('cfg-supabase-anon-key');
            if (urlInput) urlInput.value = window.SupabaseClient.getUrl();
            if (keyInput) keyInput.value = window.SupabaseClient.getKey();
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
            resEl.style.background = 'rgba(59, 130, 246, 0.15)';
            resEl.style.color = '#60a5fa';
            resEl.innerText = 'Connecting to Supabase PostgreSQL 17...';
        }
        try {
            const urlInput = document.getElementById('cfg-supabase-url')?.value.trim();
            const keyInput = document.getElementById('cfg-supabase-anon-key')?.value.trim();
            let products;
            if (urlInput && keyInput && (urlInput !== window.SupabaseClient.getUrl() || keyInput !== window.SupabaseClient.getKey())) {
                const testUrl = `${urlInput.replace(/\/$/, '')}/rest/v1/products?select=id,sku,name&limit=5`;
                const resp = await fetch(testUrl, {
                    headers: { 'apikey': keyInput, 'Authorization': `Bearer ${keyInput}` }
                });
                if (!resp.ok) {
                    const txt = await resp.text();
                    throw new Error(`[Supabase Error ${resp.status}] ${txt}`);
                }
                products = await resp.json();
            } else {
                products = await window.SupabaseClient.getProducts();
            }

            if (resEl) {
                resEl.style.background = 'rgba(34, 197, 94, 0.15)';
                resEl.style.color = '#4ade80';
                resEl.innerText = `Connected! Live DB responded with ${products.length} products.`;
            }
        } catch (err) {
            if (resEl) {
                resEl.style.background = 'rgba(239, 68, 68, 0.15)';
                resEl.style.color = '#f87171';
                resEl.innerText = `Error connecting: ${err.message}`;
            }
        }
    },

    saveCloudConfig() {
        const url = document.getElementById('cfg-supabase-url')?.value.trim();
        const key = document.getElementById('cfg-supabase-anon-key')?.value.trim();
        if (url && key) {
            window.SafeStorage.setItem('imbs_supabase_url', url);
            window.SafeStorage.setItem('imbs_supabase_anon_key', key);
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
        if (keyInput) keyInput.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdGt3ZGtwYW54YnVleHRycGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5NzM5MTksImV4cCI6MjEwOTU0OTkxOX0.MI0VyIiU9uUO1lo9nf_fnTk-htATdRBisZlmM4IelIE';
        window.SafeStorage.removeItem('imbs_supabase_url');
        window.SafeStorage.removeItem('imbs_supabase_anon_key');
        this.showToast('Reset to default project credentials.', 'info');
    },

    logout() {
        this.closeUserMenu();
        if (window.AuthController) {
            window.AuthController.logout();
        }
    }
};

window.App = App;

// Resilient initialization that works whether loaded before or after DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
