/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Authentication & Login Controller
 * Pebble Minimal Design Reference (media_1794037798392_8defb2c3.jpg)
 * Role-Based Access Control (RBAC) Supported for All 5 Enterprise Roles
 * ==============================================================================
 */

const AuthController = {
    isSignUpMode: false,

    init() {
        this.render();
    },

    isAuthenticated() {
        return Boolean(window.SupabaseClient && window.SupabaseClient.getCurrentUser());
    },

    render() {
        const existing = document.getElementById('imbs-login-screen');
        if (existing) existing.remove();

        if (this.isAuthenticated()) {
            document.body.classList.remove('imbs-auth-locked');
            const mainApp = document.getElementById('imbs-app-root');
            if (mainApp) mainApp.style.display = 'block';
            this.updateNavUser();
            if (window.App && window.App.applyRBAC) {
                window.App.applyRBAC();
            }
            return;
        }

        // Lock app and show login
        document.body.classList.add('imbs-auth-locked');
        const mainApp = document.getElementById('imbs-app-root');
        if (mainApp) mainApp.style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.id = 'imbs-login-screen';
        wrapper.className = 'imbs-login-wrapper';

        wrapper.innerHTML = `
            <div class="imbs-login-card">
                <!-- Logo -->
                <div class="imbs-login-logo">
                    <div class="imbs-login-logo-inner"></div>
                </div>

                <!-- Titles -->
                <h2 class="imbs-login-title">
                    ${this.isSignUpMode ? 'Create your Account' : 'Sign in to IMBS'}
                </h2>
                <p class="imbs-login-subtitle">
                    ${this.isSignUpMode ? 'Register an enterprise account.' : 'Welcome back. Select your role or use email.'}
                </p>

                <!-- RBAC Role Quick Switcher Pills -->
                ${!this.isSignUpMode ? `
                    <div style="margin-bottom: 18px;">
                        <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase; margin-bottom: 8px; text-align: center;">
                            Select RBAC Role to Login
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <button type="button" class="imbs-role-pill-btn active" onclick="AuthController.loginAsRole('admin@apex.com', 'Admin@Password26', 'SUPER_ADMIN')">
                                <span style="font-size: 14px;">👑</span>
                                <div style="text-align: left; flex: 1;">
                                    <div style="font-weight: 600; font-size: 12px; color: #fff;">Super Administrator (Naresh S)</div>
                                    <div style="font-size: 10px; color: #94a3b8;">admin@apex.com • Full complete access</div>
                                </div>
                                <span class="tblr-badge tblr-badge-blue" style="font-size: 9px;">ADMIN</span>
                            </button>

                            <button type="button" class="imbs-role-pill-btn" onclick="AuthController.loginAsRole('inventory@apex.com', 'Manager@2026', 'INVENTORY_MANAGER')">
                                <span style="font-size: 14px;">📦</span>
                                <div style="text-align: left; flex: 1;">
                                    <div style="font-weight: 600; font-size: 12px; color: #fff;">Inventory Manager (Vikram Mehta)</div>
                                    <div style="font-size: 10px; color: #94a3b8;">inventory@apex.com • Stock, WAC, Catalog</div>
                                </div>
                                <span class="tblr-badge tblr-badge-yellow" style="font-size: 9px;">INVENTORY</span>
                            </button>

                            <button type="button" class="imbs-role-pill-btn" onclick="AuthController.loginAsRole('store@apex.com', 'Manager@2026', 'STORE_MANAGER')">
                                <span style="font-size: 14px;">🛒</span>
                                <div style="text-align: left; flex: 1;">
                                    <div style="font-weight: 600; font-size: 12px; color: #fff;">Store Manager (Pooja Reddy)</div>
                                    <div style="font-size: 10px; color: #94a3b8;">store@apex.com • Procurement, GRN, Suppliers</div>
                                </div>
                                <span class="tblr-badge tblr-badge-yellow" style="font-size: 9px;">STORE</span>
                            </button>

                            <button type="button" class="imbs-role-pill-btn" onclick="AuthController.loginAsRole('cashier@apex.com', 'Cashier@2026', 'CASHIER')">
                                <span style="font-size: 14px;">💳</span>
                                <div style="text-align: left; flex: 1;">
                                    <div style="font-weight: 600; font-size: 12px; color: #fff;">POS Cashier (Aman Verma)</div>
                                    <div style="font-size: 10px; color: #94a3b8;">cashier@apex.com • Billing counter, Receipts</div>
                                </div>
                                <span class="tblr-badge tblr-badge-green" style="font-size: 9px;">POS</span>
                            </button>

                            <button type="button" class="imbs-role-pill-btn" onclick="AuthController.loginAsRole('auditor@apex.com', 'Auditor@2026', 'AUDITOR')">
                                <span style="font-size: 14px;">🔍</span>
                                <div style="text-align: left; flex: 1;">
                                    <div style="font-weight: 600; font-size: 12px; color: #fff;">Auditor & Compliance (Sneha Nair)</div>
                                    <div style="font-size: 10px; color: #94a3b8;">auditor@apex.com • General Ledger, Audit Logs</div>
                                </div>
                                <span class="tblr-badge tblr-badge-purple" style="font-size: 9px;">AUDIT</span>
                            </button>
                        </div>

                        <div class="imbs-login-divider" style="margin-top: 14px;">
                            <span>OR ENTER CREDENTIALS</span>
                        </div>
                    </div>
                ` : ''}

                <!-- Login / Signup Form -->
                <form id="imbs-login-form" onsubmit="AuthController.handleSubmit(event)">
                    ${this.isSignUpMode ? `
                        <div class="imbs-login-field">
                            <div class="imbs-login-label-row">
                                <label class="imbs-login-label">Full Name</label>
                            </div>
                            <input type="text" id="auth-name" class="imbs-login-input" placeholder="e.g. Ramesh Kumar" required />
                        </div>
                        <div class="imbs-login-field">
                            <div class="imbs-login-label-row">
                                <label class="imbs-login-label">Assigned RBAC Role</label>
                            </div>
                            <select id="auth-role" class="imbs-login-input">
                                <option value="CASHIER">POS Cashier</option>
                                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                                <option value="STORE_MANAGER">Store Manager</option>
                                <option value="AUDITOR">Auditor</option>
                                <option value="SUPER_ADMIN">Super Administrator</option>
                            </select>
                        </div>
                    ` : ''}

                    <div class="imbs-login-field">
                        <div class="imbs-login-label-row">
                            <label class="imbs-login-label">Email</label>
                        </div>
                        <input type="email" id="auth-email" class="imbs-login-input" placeholder="admin@apex.com" value="${this.isSignUpMode ? '' : 'admin@apex.com'}" required />
                    </div>

                    <div class="imbs-login-field">
                        <div class="imbs-login-label-row">
                            <label class="imbs-login-label">Password</label>
                            ${!this.isSignUpMode ? `
                                <a class="imbs-login-forgot" onclick="App.showToast('Click any of the role buttons above to login immediately.', 'info')">Forgot?</a>
                            ` : ''}
                        </div>
                        <div class="imbs-login-input-wrap">
                            <input type="password" id="auth-password" class="imbs-login-input" placeholder="••••••••" value="${this.isSignUpMode ? '' : 'Admin@Password26'}" required />
                            <button type="button" class="imbs-pwd-toggle" onclick="AuthController.togglePassword()">
                                <svg id="pwd-eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div id="auth-error-msg" style="display: none; font-size: 12px; color: #dc2626; margin-bottom: 12px; text-align: center;"></div>

                    <button type="submit" id="auth-submit-btn" class="imbs-login-submit-btn">
                        ${this.isSignUpMode ? 'Create Account' : 'Continue'}
                    </button>
                </form>

                <!-- Footer -->
                <div class="imbs-login-footer">
                    ${this.isSignUpMode ? `
                        Already have an account? <a onclick="AuthController.toggleMode(false)">Sign in</a>
                    ` : `
                        No account yet? <a onclick="AuthController.toggleMode(true)">Create one</a>
                    `}
                    <div class="imbs-login-demo-note">
                        Connected live to Supabase PostgreSQL 17 Cloud Database.
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);
    },

    toggleMode(isSignUp) {
        this.isSignUpMode = isSignUp;
        this.render();
    },

    togglePassword() {
        const input = document.getElementById('auth-password');
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    async loginAsRole(email, password, roleCode) {
        const errEl = document.getElementById('auth-error-msg');
        if (errEl) errEl.style.display = 'none';

        try {
            const user = await window.SupabaseClient.signIn(email, password);
            window.App.showToast(`Logged in as ${user.full_name} (${user.role})`, 'success');
            this.render();
            window.App.applyRBAC();
            window.App.navigateTo('dashboard');
        } catch (err) {
            console.error("Login as role error", err);
            if (errEl) {
                errEl.innerText = err.message || 'Login failed.';
                errEl.style.display = 'block';
            }
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        const email = document.getElementById('auth-email')?.value.trim();
        const pwd = document.getElementById('auth-password')?.value;
        const errEl = document.getElementById('auth-error-msg');
        const submitBtn = document.getElementById('auth-submit-btn');

        if (errEl) errEl.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Verifying...';
        }

        try {
            if (this.isSignUpMode) {
                const name = document.getElementById('auth-name')?.value.trim() || 'New Staff';
                const role = document.getElementById('auth-role')?.value || 'CASHIER';
                await window.SupabaseClient.signUp(email, pwd, name, role, role);
                App.showToast(`Account created for ${name}!`, 'success');
            } else {
                await window.SupabaseClient.signIn(email, pwd);
                App.showToast(`Welcome back to IMBS!`, 'success');
            }

            this.render();
            window.App.applyRBAC();
            App.navigateTo('dashboard');
        } catch (err) {
            if (errEl) {
                errEl.innerText = err.message || 'Authentication failed.';
                errEl.style.display = 'block';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = this.isSignUpMode ? 'Create Account' : 'Continue';
            }
        }
    },

    logout() {
        window.SupabaseClient.signOut();
        App.showToast('You have been signed out.', 'info');
        this.render();
    },

    updateNavUser() {
        const user = window.SupabaseClient.getCurrentUser();
        if (!user) return;

        const nameEl = document.querySelector('.tblr-user-name');
        const titleEl = document.querySelector('.tblr-user-title');
        if (nameEl) nameEl.innerText = user.full_name || 'Staff User';
        if (titleEl) titleEl.innerText = `${user.role || 'STAFF'} • ${user.job_title || ''}`;
    }
};

window.AuthController = AuthController;
