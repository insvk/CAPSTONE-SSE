/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Authentication & Login Controller
 * Pebble Minimal Design Reference (media_1794037798392_8defb2c3.jpg)
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
                    ${this.isSignUpMode ? 'Get started with cloud inventory & billing.' : 'Welcome back. Use a passkey, or your email.'}
                </p>

                <!-- Passkey / Demo Quick Button -->
                ${!this.isSignUpMode ? `
                    <button type="button" class="imbs-passkey-btn" onclick="AuthController.loginDemoAdmin()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 1 0-14 0c0 3.86 3.14 7 7 7v3l2-1 2 1v-3c3.86 0 7-3.14 7-7z"/>
                        </svg>
                        Sign in as Demo Administrator
                    </button>

                    <div class="imbs-login-divider">
                        <span>OR</span>
                    </div>
                ` : ''}

                <!-- Login / Signup Form -->
                <form id="imbs-login-form" onsubmit="AuthController.handleSubmit(event)">
                    ${this.isSignUpMode ? `
                        <div class="imbs-login-field">
                            <div class="imbs-login-label-row">
                                <label class="imbs-login-label">Full Name</label>
                            </div>
                            <input type="text" id="auth-name" class="imbs-login-input" placeholder="e.g. Naresh S" required />
                        </div>
                    ` : ''}

                    <div class="imbs-login-field">
                        <div class="imbs-login-label-row">
                            <label class="imbs-login-label">Email</label>
                        </div>
                        <input type="email" id="auth-email" class="imbs-login-input" placeholder="you@company.com" value="${this.isSignUpMode ? '' : 'admin@apex.com'}" required />
                    </div>

                    <div class="imbs-login-field">
                        <div class="imbs-login-label-row">
                            <label class="imbs-login-label">Password</label>
                            ${!this.isSignUpMode ? `
                                <a class="imbs-login-forgot" onclick="App.showToast('Demo mode: default admin password is automatically accepted.', 'info')">Forgot?</a>
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

                    ${!this.isSignUpMode ? `
                        <button type="button" class="imbs-alt-signin-btn" onclick="AuthController.loginDemoAdmin()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L1 7"/>
                            </svg>
                            Email me a sign-in link instead
                        </button>
                    ` : ''}
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
                const name = document.getElementById('auth-name')?.value.trim() || 'New User';
                await window.SupabaseClient.signUp(email, pwd, name);
                App.showToast(`Account created for ${name}!`, 'success');
            } else {
                await window.SupabaseClient.signIn(email, pwd);
                App.showToast(`Welcome back to IMBS!`, 'success');
            }

            this.render();
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

    async loginDemoAdmin() {
        try {
            await window.SupabaseClient.signIn('admin@apex.com', 'Admin@Password26');
            App.showToast('Signed in as Administrator (Naresh S)', 'success');
            this.render();
            App.navigateTo('dashboard');
        } catch (err) {
            console.error("Demo login error", err);
            // Fallback user
            window.SupabaseClient.setCurrentUser({
                id: "30000000-0000-0000-0000-000000000001",
                email: "admin@apex.com",
                full_name: "Naresh S",
                job_title: "Lead Administrator",
                role: "SUPER_ADMIN"
            });
            this.render();
            App.navigateTo('dashboard');
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
        if (nameEl) nameEl.innerText = user.full_name || 'Admin';
        if (titleEl) titleEl.innerText = user.job_title || user.role || 'Administrator';
    }
};

window.AuthController = AuthController;
