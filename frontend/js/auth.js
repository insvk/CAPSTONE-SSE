/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Authentication & Login Controller
 * Split-Screen Design Faithful to Reference (media_1794116255722_3a1d8df6.jpg)
 * Left Panel: Clean White (#ffffff) with SIMATS Logo, Form & Orange "Log In" Button
 * Right Panel: Space Black (#000000) with Floating Transparent SIMATS Logo,
 *              Headline: "CSA0201-INV-MGMT-BILL-SYS", and Orbit Earth at Night
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
        wrapper.className = 'imbs-split-login-wrapper';

        wrapper.innerHTML = `
            <!-- ============================================================
                 LEFT PANEL: Clean White Form (Replit Reference Layout)
                 ============================================================ -->
            <div class="imbs-login-left-pane">
                <!-- Top Brand Header -->
                <div class="imbs-split-brand-header">
                    <img src="/img/simats_logo.png" 
                         alt="Saveetha SIMATS" 
                         class="imbs-split-brand-logo" />
                    <div class="imbs-split-brand-text">
                        <span>CSA0201</span>
                        <span class="imbs-split-brand-badge">IMBS</span>
                    </div>
                </div>

                <!-- Centered Form Container -->
                <div class="imbs-split-form-container">
                    <h2 class="imbs-split-title">
                        ${this.isSignUpMode ? 'Create your account' : 'Log in to your account'}
                    </h2>

                    <!-- Main Form (Zero Exposed Credentials) -->
                    <form id="imbs-login-form" onsubmit="AuthController.handleSubmit(event)">
                        ${this.isSignUpMode ? `
                            <div class="imbs-split-field">
                                <label class="imbs-split-label">Full Name</label>
                                <input type="text" id="auth-name" class="imbs-split-input" placeholder="e.g. Ramesh Kumar" required />
                            </div>
                            <div class="imbs-split-field">
                                <label class="imbs-split-label">Assigned Role</label>
                                <select id="auth-role" class="imbs-split-input">
                                    <option value="CASHIER">POS Cashier</option>
                                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                                    <option value="STORE_MANAGER">Store Manager</option>
                                    <option value="AUDITOR">Auditor &amp; Compliance</option>
                                    <option value="SUPER_ADMIN">Super Administrator</option>
                                </select>
                            </div>
                        ` : ''}

                        <!-- EMAIL OR USERNAME Field -->
                        <div class="imbs-split-field">
                            <label class="imbs-split-label">EMAIL OR USERNAME</label>
                            <input type="text" 
                                   id="auth-email" 
                                   class="imbs-split-input" 
                                   placeholder="e.g. admin@sse.inv.com" 
                                   value="" 
                                   required 
                                   autocomplete="username" />
                        </div>

                        <!-- PASSWORD Field -->
                        <div class="imbs-split-field">
                            <label class="imbs-split-label">PASSWORD</label>
                            <div class="imbs-split-input-wrap">
                                <input type="password" 
                                       id="auth-password" 
                                       class="imbs-split-input" 
                                       placeholder="••••••••••••••••" 
                                       value="" 
                                       required 
                                       autocomplete="current-password" />
                                <button type="button" 
                                        class="imbs-split-pwd-toggle" 
                                        onclick="AuthController.togglePassword()" 
                                        title="Toggle password visibility">
                                    <svg id="pwd-eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div id="auth-error-msg" style="display: none; font-size: 12px; color: #dc2626; margin-bottom: 12px; text-align: center; font-weight: 500;"></div>

                        <!-- Primary Orange Log In Button -->
                        <button type="submit" id="auth-submit-btn" class="imbs-split-submit-btn">
                            ${this.isSignUpMode ? 'Create Account' : 'Log In'}
                        </button>

                        ${!this.isSignUpMode ? `
                            <!-- Forgot Password Link -->
                            <a class="imbs-split-forgot-link" onclick="AuthController.handleForgot()">
                                Forgot password?
                            </a>

                            <!-- Alternative Stack: Use SSO Login & Continue with Google (NO GitHub, X, Apple, Facebook) -->
                            <div class="imbs-split-alt-stack">
                                <button type="button" class="imbs-split-alt-btn" onclick="AuthController.handlePasskeySignIn()">
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="8" cy="8" r="5"></circle>
                                        <line x1="12" y1="12" x2="22" y2="22"></line>
                                        <line x1="18" y1="18" x2="21" y2="15"></line>
                                        <line x1="15" y1="21" x2="18" y2="18"></line>
                                    </svg>
                                    <span>Use SSO login</span>
                                </button>

                                <button type="button" class="imbs-split-alt-btn" onclick="AuthController.handleGoogleSignIn()">
                                    <svg width="17" height="17" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                    <span>Continue with Google</span>
                                </button>
                            </div>
                        ` : ''}

                        <!-- Sign Up Switch -->
                        <div class="imbs-split-links">
                            ${this.isSignUpMode ? `
                                Already have an account? <a onclick="AuthController.toggleMode(false)">Log in</a>
                            ` : `
                                New to IMBS? <a onclick="AuthController.toggleMode(true)">Sign up</a>
                            `}
                        </div>

                        <!-- Get Help Link -->
                        <a class="imbs-split-help-link" onclick="AuthController.handleHelp()">
                            Get help
                        </a>
                    </form>

                    <!-- Legal / Enterprise Security Notice -->
                    <div class="imbs-split-disclaimer">
                        This enterprise portal is protected by SIMATS Access Control and Cloud Security Policies. Terms of Service apply.
                    </div>
                </div>

                <!-- Footer spacing dummy for vertical alignment -->
                <div style="height: 12px;"></div>
            </div>

            <!-- ============================================================
                 RIGHT PANEL: Deep Space Black with SIMATS Logo & Earth View
                 ============================================================ -->
            <div class="imbs-login-right-pane">
                <!-- Center Hero Content -->
                <div class="imbs-right-hero-content">
                    <img src="/img/simats_logo.png" 
                         alt="Saveetha SIMATS Emblem" 
                         class="imbs-hero-logo" />
                    <h1 class="imbs-hero-title">CSA0201-INV-MGMT-BILL-SYS</h1>
                    <p class="imbs-hero-subtitle">High-Performance Enterprise Inventory Management &amp; Point of Sale Billing System</p>
                </div>

                <!-- Orbit Earth at Night View -->
                <div class="imbs-earth-night-container">
                    <img src="/img/earth_night.jpg" 
                         alt="Orbit Earth at Night" 
                         class="imbs-earth-night-img" />
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
            window.App.showToast('Please contact your administrator or IT department (admin@sse.inv.com) to reset enterprise credentials.', 'info');
        } else {
            alert('Please contact your system administrator (admin@sse.inv.com) to reset enterprise credentials.');
        }
    },

    handleHelp() {
        const existing = document.getElementById('modal-imbs-help');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-imbs-help';
        modal.className = 'tblr-modal-backdrop';
        modal.style.display = 'flex';
        modal.style.zIndex = '10006';

        modal.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 440px; background: #ffffff; color: #111827; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="/img/simats_logo.png" alt="SIMATS" style="width: 28px; height: 28px; object-fit: contain;">
                        <div>
                            <div style="font-weight: 700; font-size: 15px; color: #111827;">Enterprise Support &amp; Roles</div>
                            <div style="font-size: 12px; color: #6b7280;">CSA0201 Cloud Network</div>
                        </div>
                    </div>
                    <button type="button" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #9ca3af;" onclick="document.getElementById('modal-imbs-help').remove()">&times;</button>
                </div>

                <div style="font-size: 13px; line-height: 1.5; color: #374151; margin-bottom: 16px;">
                    Welcome to the SIMATS Inventory Management and POS Billing System. You can sign in using your enterprise email/username and password, or use SSO/Google Workspace authentication.
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 12px; margin-bottom: 16px;">
                    <div style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">Available Enterprise Roles:</div>
                    <div style="display: flex; flex-direction: column; gap: 4px; color: #475569;">
                        <div>• <strong>Lead Administrator:</strong> Full control over master products, inventory, users &amp; stores</div>
                        <div>• <strong>POS Cashier:</strong> Quick counter checkout, barcode scanning, thermal billing</div>
                        <div>• <strong>Inventory Manager:</strong> Warehouses, stock transfers, batch replenishment</div>
                        <div>• <strong>Store Manager:</strong> Purchase orders, GRN, supplier invoices</div>
                        <div>• <strong>Auditor:</strong> Read-only compliance, general ledger, tax audit reports</div>
                    </div>
                </div>

                <button type="button" class="imbs-split-submit-btn" style="margin: 0;" onclick="document.getElementById('modal-imbs-help').remove()">
                    Close Guide
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    handleGoogleSignIn() {
        const existing = document.getElementById('modal-google-prompt');
        if (existing) existing.remove();

        const sheet = document.createElement('div');
        sheet.id = 'modal-google-prompt';
        sheet.className = 'tblr-modal-backdrop';
        sheet.style.display = 'flex';
        sheet.style.zIndex = '10005';

        sheet.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 440px; background: #ffffff; color: #111827; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <svg width="22" height="22" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <div>
                            <div style="font-weight: 700; font-size: 15px; color: #111827;">Sign in with Google Workspace</div>
                            <div style="font-size: 12px; color: #6b7280;">Choose a verified SIMATS enterprise account</div>
                        </div>
                    </div>
                    <button type="button" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #9ca3af;" onclick="document.getElementById('modal-google-prompt').remove()">&times;</button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; margin: 18px 0;">
                    <button type="button" class="imbs-passkey-item-btn" onclick="AuthController.authenticateGoogle('admin@sse.inv.com')">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">NS</div>
                        <div style="flex: 1; text-align: left;">
                            <div style="font-weight: 600; font-size: 13px; color: #111827;">Naresh S (admin@sse.inv.com)</div>
                            <div style="font-size: 11px; color: #6b7280;">Super Administrator (Enterprise Full Access)</div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600; color: #2563eb;">Google SSO</span>
                    </button>

                    <button type="button" class="imbs-passkey-item-btn" onclick="AuthController.authenticateGoogle('cashier@sse.inv.com')">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: #059669; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">AV</div>
                        <div style="flex: 1; text-align: left;">
                            <div style="font-weight: 600; font-size: 13px; color: #111827;">Aman Verma (cashier@sse.inv.com)</div>
                            <div style="font-size: 11px; color: #6b7280;">Head Billing Cashier (POS Counter 1)</div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600; color: #059669;">Google SSO</span>
                    </button>

                    <button type="button" class="imbs-passkey-item-btn" onclick="AuthController.authenticateGoogle('inventory@sse.inv.com')">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: #d97706; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">VM</div>
                        <div style="flex: 1; text-align: left;">
                            <div style="font-weight: 600; font-size: 13px; color: #111827;">Vikram Mehta (inventory@sse.inv.com)</div>
                            <div style="font-size: 11px; color: #6b7280;">Warehouse &amp; Stock Manager</div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600; color: #d97706;">Google SSO</span>
                    </button>
                </div>

                <div style="text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 12px;">
                    Google OAuth 2.0 Single Sign-On for SIMATS Enterprise Domain
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

    async authenticateGoogle(email) {
        document.getElementById('modal-google-prompt')?.remove();
        try {
            const user = await window.SupabaseClient.signIn(email, 'GoogleOAuth2');
            if (window.App && window.App.showToast) {
                window.App.showToast(`Signed in with Google! Welcome back ${user.full_name}`, 'success');
            }
            this.render();
            if (window.App && window.App.applyRBAC) {
                window.App.applyRBAC();
            }
            if (window.App && window.App.navigateTo) {
                window.App.navigateTo('dashboard');
            }
        } catch (err) {
            console.error("Google SSO error", err);
            alert("Google SSO authentication failed: " + err.message);
        }
    },

    handlePasskeySignIn() {
        // Show simulated passkey prompt sheet (Faithful to Pebble/SSO reference)
        const existing = document.getElementById('modal-passkey-prompt');
        if (existing) existing.remove();

        const sheet = document.createElement('div');
        sheet.id = 'modal-passkey-prompt';
        sheet.className = 'tblr-modal-backdrop';
        sheet.style.display = 'flex';
        sheet.style.zIndex = '10005';

        sheet.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 440px; background: #ffffff; color: #111827; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25);">
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
                            <div style="font-weight: 700; font-size: 15px; color: #111827;">Sign in with Enterprise SSO</div>
                            <div style="font-size: 12px; color: #6b7280;">Choose a verified hardware passkey</div>
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
                            <div style="font-size: 11px; color: #6b7280;">Inventory &amp; Stock Manager</div>
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
        let email = document.getElementById('auth-email')?.value.trim();
        const pwd = document.getElementById('auth-password')?.value;
        const errEl = document.getElementById('auth-error-msg');
        const submitBtn = document.getElementById('auth-submit-btn');

        if (errEl) errEl.style.display = 'none';

        if (!email) {
            if (errEl) {
                errEl.innerText = 'Please enter your email or username.';
                errEl.style.display = 'block';
            }
            return;
        }

        // Support username alias auto-completion (e.g. "admin" -> "admin@sse.inv.com")
        if (!email.includes('@')) {
            const usernameMap = {
                'admin': 'admin@sse.inv.com',
                'naresh': 'admin@sse.inv.com',
                'cashier': 'cashier@sse.inv.com',
                'aman': 'cashier@sse.inv.com',
                'inventory': 'inventory@sse.inv.com',
                'vikram': 'inventory@sse.inv.com',
                'store': 'store@sse.inv.com',
                'pooja': 'store@sse.inv.com',
                'auditor': 'auditor@sse.inv.com',
                'sneha': 'auditor@sse.inv.com'
            };
            email = usernameMap[email.toLowerCase()] || `${email.toLowerCase()}@sse.inv.com`;
        }

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
                    window.App.showToast(`Welcome back to CSA0201 IMBS!`, 'success');
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
                submitBtn.innerText = this.isSignUpMode ? 'Create Account' : 'Log In';
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
