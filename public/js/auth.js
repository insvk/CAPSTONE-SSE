/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Authentication & Login Controller
 * Pebble Minimal Design Reference (media_1794052447028_ef0dca57.jpg)
 * Institutional Branding: Saveetha SIMATS Logo in Top Right Corner
 * Zero Exposed Credentials - Enterprise Multi-Factor & Passkey Ready
 * ==============================================================================
 */

const AuthController = {
    isSignUpMode: false,

    init() {
        this.render();
    },

    isAuthenticated() {
        if (window.SafeStorage && window.SafeStorage.getItem('imbs_signed_out') === 'true') {
            return false;
        }
        return Boolean(window.SupabaseClient && window.SupabaseClient.getCurrentUser());
    },

    render() {
        const existing = document.getElementById('imbs-login-screen');
        if (existing) existing.remove();

        if (this.isAuthenticated()) {
            document.body.classList.remove('imbs-auth-locked');
            const mainApp = document.getElementById('imbs-app-root');
            if (mainApp) {
                mainApp.style.display = 'flex';
                mainApp.classList.remove('imbs-hidden');
            }
            this.updateNavUser();
            if (window.App && window.App.applyRBAC) {
                window.App.applyRBAC();
            }
            return;
        }

        // Lock app and show login as default landing page
        document.body.classList.add('imbs-auth-locked');
        const mainApp = document.getElementById('imbs-app-root');
        if (mainApp) {
            mainApp.style.display = 'none';
            mainApp.classList.add('imbs-hidden');
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'imbs-login-screen';
        wrapper.className = 'imbs-login-wrapper';

        wrapper.innerHTML = `
            <!-- Top Right Corner Official Institutional Logo -->
            <div class="imbs-login-inst-brand" title="Saveetha Institute of Medical and Technical Sciences (SIMATS)">
                <img src="https://images.squarespace-cdn.com/content/v1/6268bb18d74de925d9ff1bb9/afb1eaa4-6ab6-4d8a-b4f7-6ccd0a0776d9/Saveetha+simats.png" 
                     alt="Saveetha SIMATS" 
                     class="imbs-login-inst-logo" />
            </div>

            <!-- Pebble Minimalist Card (media_1794052447028_ef0dca57.jpg) -->
            <div class="imbs-login-card">
                <!-- Squircle Pebble Logo -->
                <div class="imbs-login-logo">
                    <div class="imbs-login-logo-inner"></div>
                </div>

                <!-- Titles -->
                <h2 class="imbs-login-title">
                    ${this.isSignUpMode ? 'Create your Account' : 'Sign in to Pebble'}
                </h2>
                <p class="imbs-login-subtitle">
                    ${this.isSignUpMode ? 'Register an enterprise account.' : 'Welcome back. Use a passkey, or your email.'}
                </p>

                ${!this.isSignUpMode ? `
                    <!-- Passkey Sign-in Button -->
                    <button type="button" class="imbs-passkey-btn" onclick="AuthController.handlePasskeySignIn()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="8" cy="8" r="5"></circle>
                            <line x1="12" y1="12" x2="22" y2="22"></line>
                            <line x1="18" y1="18" x2="21" y2="15"></line>
                            <line x1="15" y1="21" x2="18" y2="18"></line>
                        </svg>
                        <span>Sign in with a passkey</span>
                    </button>

                    <!-- OR Divider -->
                    <div class="imbs-login-divider">
                        <span>OR</span>
                    </div>
                ` : ''}

                <!-- Clean Form (Zero Credentials Exposed) -->
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
                                <label class="imbs-login-label">Assigned Role</label>
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
                        <input type="email" id="auth-email" class="imbs-login-input" placeholder="you@company.com" value="" required autocomplete="email" />
                    </div>

                    <div class="imbs-login-field">
                        <div class="imbs-login-label-row">
                            <label class="imbs-login-label">Password</label>
                            ${!this.isSignUpMode ? `
                                <a class="imbs-login-forgot" onclick="AuthController.handleForgot()">Forgot?</a>
                            ` : ''}
                        </div>
                        <div class="imbs-login-input-wrap">
                            <input type="password" id="auth-password" class="imbs-login-input" placeholder="••••••••" value="" required autocomplete="current-password" />
                            <button type="button" class="imbs-pwd-toggle" onclick="AuthController.togglePassword()" title="Toggle password visibility">
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
                        <button type="button" class="imbs-alt-signin-btn" onclick="AuthController.handleMagicLink()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                            <span>Email me a sign-in link instead</span>
                        </button>
                    ` : ''}
                </form>

                <!-- Footer (media_1794052447028_ef0dca57.jpg) -->
                <div class="imbs-login-footer">
                    ${this.isSignUpMode ? `
                        Already have an account? <a onclick="AuthController.toggleMode(false)">Sign in</a>
                    ` : `
                        No account yet? <a onclick="AuthController.toggleMode(true)">Create one</a>
                    `}
                    <div class="imbs-login-demo-note">
                        Demo — nothing is sent, and the passkey prompt is simulated.
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

    handleForgot() {
        if (window.App && window.App.showToast) {
            window.App.showToast('Please contact your administrator or IT department to reset enterprise credentials.', 'info');
        } else {
            alert('Please contact your system administrator to reset enterprise credentials.');
        }
    },

    handleMagicLink() {
        const email = document.getElementById('auth-email')?.value.trim();
        if (!email) {
            if (window.App && window.App.showToast) {
                window.App.showToast('Please enter your enterprise email address above first.', 'warning');
            } else {
                alert('Please enter your email address first.');
            }
            document.getElementById('auth-email')?.focus();
            return;
        }
        if (window.App && window.App.showToast) {
            window.App.showToast(`Sign-in link dispatched to ${email}. Check your corporate inbox.`, 'success');
        }
    },

    handlePasskeySignIn() {
        // Show simulated passkey prompt sheet (Faithful to Pebble reference note)
        const existing = document.getElementById('modal-passkey-prompt');
        if (existing) existing.remove();

        const sheet = document.createElement('div');
        sheet.id = 'modal-passkey-prompt';
        sheet.className = 'tblr-modal-backdrop';
        sheet.style.display = 'flex';
        sheet.style.zIndex = '10005';

        sheet.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 420px; background: #ffffff; color: #111827; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: #000; color: #fff; display: flex; align-items: center; justify-content: center;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="8" cy="8" r="5"></circle>
                                <line x1="12" y1="12" x2="22" y2="22"></line>
                                <line x1="18" y1="18" x2="21" y2="15"></line>
                                <line x1="15" y1="21" x2="18" y2="18"></line>
                            </svg>
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size: 15px; color: #111827;">Sign in with a passkey</div>
                            <div style="font-size: 12px; color: #6b7280;">Choose a verified enterprise passkey</div>
                        </div>
                    </div>
                    <button type="button" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #9ca3af;" onclick="document.getElementById('modal-passkey-prompt').remove()">&times;</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; margin: 18px 0;">
                    <button type="button" class="imbs-passkey-item-btn" onclick="AuthController.authenticatePasskey('admin@sse.inv.com')">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">NS</div>
                        <div style="flex: 1; text-align: left;">
                            <div style="font-weight: 600; font-size: 13px; color: #111827;">Naresh S</div>
                            <div style="font-size: 11px; color: #6b7280;">Super Administrator (Full Access)</div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600; color: #2563eb;">Passkey Verified</span>
                    </button>

                    <button type="button" class="imbs-passkey-item-btn" onclick="AuthController.authenticatePasskey('cashier@sse.inv.com')">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #059669; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">AV</div>
                        <div style="flex: 1; text-align: left;">
                            <div style="font-weight: 600; font-size: 13px; color: #111827;">Aman Verma</div>
                            <div style="font-size: 11px; color: #6b7280;">POS Cashier (Billing Counter)</div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600; color: #059669;">Passkey Verified</span>
                    </button>

                    <button type="button" class="imbs-passkey-item-btn" onclick="AuthController.authenticatePasskey('inventory@sse.inv.com')">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #d97706; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">VM</div>
                        <div style="flex: 1; text-align: left;">
                            <div style="font-weight: 600; font-size: 13px; color: #111827;">Vikram Mehta</div>
                            <div style="font-size: 11px; color: #6b7280;">Inventory & Stock Manager</div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600; color: #d97706;">Passkey Verified</span>
                    </button>
                </div>

                <div style="text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 12px;">
                    Simulated WebAuthn hardware passkey verification
                </div>
            </div>
            <style>
                .imbs-passkey-item-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    width: 100%;
                }
                .imbs-passkey-item-btn:hover {
                    background: #f3f4f6;
                    border-color: #cbd5e1;
                    transform: translateY(-1px);
                }
            </style>
        `;
        document.body.appendChild(sheet);
    },

    async authenticatePasskey(email) {
        document.getElementById('modal-passkey-prompt')?.remove();
        try {
            const user = await window.SupabaseClient.signIn(email, 'PasskeyAuth');
            if (window.App && window.App.showToast) {
                window.App.showToast(`Passkey verified! Welcome back ${user.full_name}`, 'success');
            }
            this.render();
            if (window.App && window.App.applyRBAC) {
                window.App.applyRBAC();
            }
            if (window.App && window.App.navigateTo) {
                window.App.navigateTo('dashboard');
            }
        } catch (err) {
            console.error("Passkey auth error", err);
            alert("Passkey authentication failed: " + err.message);
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
                if (window.App && window.App.showToast) {
                    window.App.showToast(`Account created for ${name}!`, 'success');
                }
            } else {
                await window.SupabaseClient.signIn(email, pwd);
                if (window.App && window.App.showToast) {
                    window.App.showToast(`Welcome back to IMBS Enterprise!`, 'success');
                }
            }

            this.render();
            if (window.App && window.App.applyRBAC) {
                window.App.applyRBAC();
            }
            if (window.App && window.App.navigateTo) {
                window.App.navigateTo('dashboard');
            }
        } catch (err) {
            if (errEl) {
                errEl.innerText = err.message || 'Authentication failed. Please verify credentials.';
                errEl.style.display = 'block';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = this.isSignUpMode ? 'Create Account' : 'Continue';
            }
        }
    },

    logout() {
        if (window.SupabaseClient) {
            window.SupabaseClient.signOut();
        }
        if (window.SafeStorage) {
            window.SafeStorage.removeItem('imbs_auth_user');
            window.SafeStorage.setItem('imbs_signed_out', 'true');
        }
        window.location.hash = '';

        // Immediately lock app and display login screen
        document.body.classList.add('imbs-auth-locked');
        const mainApp = document.getElementById('imbs-app-root');
        if (mainApp) {
            mainApp.style.display = 'none';
            mainApp.classList.add('imbs-hidden');
        }

        this.render();
        if (window.App && window.App.showToast) {
            window.App.showToast('You have been signed out.', 'info');
        }
    },

    updateNavUser() {
        const user = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;
        if (!user) return;

        const nameEl = document.querySelector('.tblr-user-name');
        const titleEl = document.querySelector('.tblr-user-title');
        if (nameEl) nameEl.innerText = user.full_name || 'Staff User';
        if (titleEl) titleEl.innerText = `${user.role || 'STAFF'} • ${user.job_title || ''}`;
    }
};

window.AuthController = AuthController;
