/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Staff & RBAC Access Control View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL 17
 * Supports Full Employee Profile, Avatar/PFP, and RBAC Management
 * ==============================================================================
 */

const StaffView = {
    staffList: [],

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
                <div style="width: 28px; height: 28px; border: 3px solid #233446; border-top-color: #206bc4; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            </div>
        `;

        try {
            this.staffList = await window.SupabaseClient.getStaff();
            this.renderTable(container);
        } catch (err) {
            console.error("[Staff Load Error]", err);
            container.innerHTML = `
                <div class="tblr-card" style="padding: 24px; color: #ff6b6b; border: 1px solid #d63939;">
                    <strong>Error loading staff from Supabase:</strong> ${err.message}<br>
                    <button class="tblr-btn tblr-btn-primary" style="margin-top: 12px;" onclick="StaffView.render(document.getElementById('main-content'))">Retry Sync</button>
                </div>
            `;
        }
    },

    renderTable(container) {
        const total = this.staffList.length;
        const admins = this.staffList.filter(s => s.role === 'SUPER_ADMIN').length;
        const managers = this.staffList.filter(s => s.role === 'INVENTORY_MANAGER' || s.role === 'STORE_MANAGER').length;
        const cashiers = this.staffList.filter(s => s.role === 'CASHIER').length;
        const auditors = this.staffList.filter(s => s.role === 'AUDITOR').length;

        container.innerHTML = `
            <!-- Top Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px;">
                <div class="tblr-card" style="padding: 14px 18px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase;">Total Staff</div>
                    <div style="font-size: 22px; font-weight: 700; color: #fff; margin-top: 4px;">${total} Users</div>
                    <div style="font-size: 11px; color: #2fb344; margin-top: 2px;">Active in Supabase</div>
                </div>
                <div class="tblr-card" style="padding: 14px 18px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase;">Super Admins</div>
                    <div style="font-size: 22px; font-weight: 700; color: #206bc4; margin-top: 4px;">${admins}</div>
                    <div style="font-size: 11px; color: var(--tblr-text-muted); margin-top: 2px;">Unrestricted access</div>
                </div>
                <div class="tblr-card" style="padding: 14px 18px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase;">Managers</div>
                    <div style="font-size: 22px; font-weight: 700; color: #f59f00; margin-top: 4px;">${managers}</div>
                    <div style="font-size: 11px; color: var(--tblr-text-muted); margin-top: 2px;">Inventory & Store</div>
                </div>
                <div class="tblr-card" style="padding: 14px 18px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase;">Cashiers & POS</div>
                    <div style="font-size: 22px; font-weight: 700; color: #2fb344; margin-top: 4px;">${cashiers}</div>
                    <div style="font-size: 11px; color: var(--tblr-text-muted); margin-top: 2px;">Billing Register</div>
                </div>
                <div class="tblr-card" style="padding: 14px 18px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--tblr-text-muted); text-transform: uppercase;">Auditors</div>
                    <div style="font-size: 22px; font-weight: 700; color: #ae3ec9; margin-top: 4px;">${auditors}</div>
                    <div style="font-size: 11px; color: var(--tblr-text-muted); margin-top: 2px;">Compliance & Ledger</div>
                </div>
            </div>

            <!-- Staff Directory Card -->
            <div class="tblr-card">
                <div class="tblr-card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--tblr-border-color);">
                    <div>
                        <h3 class="tblr-card-title" style="margin: 0; font-size: 16px;">Staff & Access Control (${total})</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            Cloud database synchronization for employee names, job titles, avatars & RBAC permissions
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="staff-search" class="tblr-form-control" placeholder="Search staff members..." style="max-width: 200px;" oninput="StaffView.filterTable(this.value)" />
                        <button class="tblr-btn tblr-btn-primary" onclick="StaffView.showAddModal()">
                            + Add Staff Member
                        </button>
                    </div>
                </div>

                <div class="tblr-table-responsive">
                    <table class="tblr-table" id="staff-table">
                        <thead>
                            <tr>
                                <th>STAFF MEMBER & PHOTO</th>
                                <th>EMAIL</th>
                                <th>JOB TITLE</th>
                                <th>RBAC ROLE</th>
                                <th>PERMISSIONS SCOPE</th>
                                <th>STATUS</th>
                                <th style="text-align: right;">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.staffList.length === 0 ? `
                                <tr><td colspan="7" style="text-align: center; color: var(--tblr-text-muted); padding: 32px;">No staff records found. Click '+ Add Staff Member' to configure staff RBAC.</td></tr>
                            ` : this.staffList.map(s => {
                                let badgeClass = 'tblr-badge-default';
                                let scope = 'Standard';
                                if (s.role === 'SUPER_ADMIN') {
                                    badgeClass = 'tblr-badge-blue';
                                    scope = 'Full Access (All Modules)';
                                } else if (s.role === 'INVENTORY_MANAGER') {
                                    badgeClass = 'tblr-badge-yellow';
                                    scope = 'Inventory, Stock, Catalog';
                                } else if (s.role === 'STORE_MANAGER') {
                                    badgeClass = 'tblr-badge-yellow';
                                    scope = 'Procurement, GRN, Stock';
                                } else if (s.role === 'CASHIER') {
                                    badgeClass = 'tblr-badge-green';
                                    scope = 'POS Billing, Invoices';
                                } else if (s.role === 'AUDITOR') {
                                    badgeClass = 'tblr-badge-purple';
                                    scope = 'Audit Logs, Ledger, GL';
                                }

                                const initials = s.full_name ? s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';
                                const avatarHtml = s.avatar_url 
                                    ? `<img src="${s.avatar_url}" alt="${s.full_name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid rgba(255,255,255,0.2);" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width: 36px; height: 36px; border-radius: 50%; background: #233446; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;\\'>${initials}</div>'">`
                                    : `<div style="width: 36px; height: 36px; border-radius: 50%; background: #233446; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;">${initials}</div>`;

                                return `
                                    <tr>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 12px;">
                                                <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                                                    ${avatarHtml}
                                                </div>
                                                <div>
                                                    <div style="font-weight: 600; color: #fff; font-size: 13.5px;">${s.full_name}</div>
                                                    <div style="font-size: 11px; color: var(--tblr-text-muted);">${s.job_title}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span style="font-size: 13px; font-family: monospace;">${s.email}</span></td>
                                        <td><span style="font-size: 12px; color: var(--tblr-text-secondary);">${s.job_title}</span></td>
                                        <td><span class="tblr-badge ${badgeClass}">${s.role}</span></td>
                                        <td><span style="font-size: 12px; color: var(--tblr-text-muted);">${scope}</span></td>
                                        <td>
                                            <span class="tblr-badge ${s.is_active ? 'tblr-badge-green' : 'tblr-badge-red'}">
                                                ${s.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style="text-align: right; white-space: nowrap;">
                                            <button class="tblr-btn tblr-btn-sm tblr-btn-warning" style="margin-right: 6px; font-weight: 600;" title="Edit / Reset password in Supabase Cloud" onclick="StaffView.showPasswordModal('${s.id}')">
                                                🔑 Password
                                            </button>
                                            <button class="tblr-btn tblr-btn-sm tblr-btn-primary" style="margin-right: 6px;" title="Edit employee name, title, role or profile picture" onclick="StaffView.showEditModal('${s.id}')">
                                                Edit
                                            </button>
                                            <button class="tblr-btn tblr-btn-sm tblr-btn-default" title="Sign in as this user" onclick="StaffView.switchUser('${s.email}', '${s.role}', '${s.full_name.replace(/'/g, "\\'")}')">
                                                Switch User
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    filterTable(query) {
        const q = query.toLowerCase();
        const rows = document.querySelectorAll('#staff-table tbody tr');
        rows.forEach(r => {
            const text = r.innerText.toLowerCase();
            r.style.display = text.includes(q) ? '' : 'none';
        });
    },

    async switchUser(email, role, name) {
        try {
            await window.SupabaseClient.signIn(email, 'Password');
            window.App.showToast(`Switched active user to ${name} (${role})`, 'success');
            window.AuthController.updateNavUser();
            window.App.applyRBAC();
            window.App.navigateTo('dashboard');
        } catch (err) {
            console.error("Switch user error", err);
        }
    },

    showPasswordModal(staffId) {
        const staff = this.staffList.find(s => s.id === staffId);
        if (!staff) {
            window.App.showToast("Staff record not found.", "danger");
            return;
        }

        const existing = document.getElementById('modal-password-staff');
        if (existing) existing.remove();

        const currentUser = window.SupabaseClient ? window.SupabaseClient.getCurrentUser() : null;
        const isSelf = currentUser && (currentUser.id === staff.id || currentUser.email === staff.email);
        const initials = staff.full_name ? staff.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';

        const modal = document.createElement('div');
        modal.id = 'modal-password-staff';
        modal.className = 'tblr-modal-backdrop';
        modal.style.display = 'flex';
        modal.style.zIndex = '10006';

        modal.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 480px; background: #121215; border: 1px solid #27272a; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
                <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 18px;">🔑</span>
                            <h3 class="tblr-modal-title" style="color: #fff; margin: 0; font-size: 16px;">
                                ${isSelf ? 'Change My Account Password' : `Change Password: ${staff.full_name}`}
                            </h3>
                            ${isSelf ? '<span class="tblr-badge tblr-badge-blue" style="font-size: 10px;">Your Account</span>' : ''}
                        </div>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 4px;">
                            Directly updates the encrypted password_hash in Supabase PostgreSQL Cloud
                        </div>
                    </div>
                    <button class="tblr-modal-close" onclick="document.getElementById('modal-password-staff').remove()">&times;</button>
                </div>
                <form onsubmit="StaffView.handlePasswordSubmit(event, '${staff.id}', '${staff.email.replace(/'/g, "\\'")}')">
                    <div class="tblr-modal-body" style="padding: 20px;">
                        <!-- Target Account Card -->
                        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px; padding: 12px 14px; background: #18181c; border: 1px solid #27272a; border-radius: 8px;">
                            <div style="width: 42px; height: 42px; border-radius: 50%; background: #233446; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                ${staff.avatar_url ? `<img src="${staff.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.remove()">` : ''}
                                <span>${initials}</span>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; color: #fff; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${staff.full_name}
                                </div>
                                <div style="font-size: 12px; color: var(--tblr-text-muted); font-family: monospace;">
                                    ${staff.email} • <span class="tblr-badge tblr-badge-blue" style="font-size: 10px;">${staff.role}</span>
                                </div>
                            </div>
                        </div>

                        <!-- New Password Field -->
                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: flex; justify-content: space-between;">
                                <span>New Password *</span>
                                <span style="font-size: 11px; color: var(--tblr-text-muted);">Min. 4 characters</span>
                            </label>
                            <div style="position: relative;">
                                <input type="password" id="staff-pwd-new" class="shadcn-input" placeholder="Enter new password" required autocomplete="new-password" style="padding-right: 40px;" />
                                <button type="button" onclick="StaffView.togglePwdVisibility('staff-pwd-new')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #71717a; cursor: pointer; padding: 4px;">
                                    👁️
                                </button>
                            </div>
                        </div>

                        <!-- Confirm Password Field -->
                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Confirm New Password *</label>
                            <div style="position: relative;">
                                <input type="password" id="staff-pwd-confirm" class="shadcn-input" placeholder="Repeat new password" required autocomplete="new-password" style="padding-right: 40px;" />
                                <button type="button" onclick="StaffView.togglePwdVisibility('staff-pwd-confirm')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #71717a; cursor: pointer; padding: 4px;">
                                    👁️
                                </button>
                            </div>
                        </div>

                        <!-- Quick Presets -->
                        <div style="margin-bottom: 16px;">
                            <div style="font-size: 11px; font-weight: 600; color: var(--tblr-text-muted); margin-bottom: 6px; text-transform: uppercase;">
                                Quick Strong Password Presets:
                            </div>
                            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                <button type="button" class="tblr-btn tblr-btn-sm tblr-btn-default" style="font-size: 11px; padding: 2px 8px;" onclick="StaffView.setPresetPassword('Admin@Password26')">
                                    Admin@Password26
                                </button>
                                <button type="button" class="tblr-btn tblr-btn-sm tblr-btn-default" style="font-size: 11px; padding: 2px 8px;" onclick="StaffView.setPresetPassword('Apex@2026!k9')">
                                    Apex@2026!k9
                                </button>
                                <button type="button" class="tblr-btn tblr-btn-sm tblr-btn-default" style="font-size: 11px; padding: 2px 8px;" onclick="StaffView.setPresetPassword('Cashier@123')">
                                    Cashier@123
                                </button>
                                <button type="button" class="tblr-btn tblr-btn-sm tblr-btn-default" style="font-size: 11px; padding: 2px 8px; color: #38bdf8;" onclick="StaffView.generateRandomPassword()">
                                    ⚡ Generate Random
                                </button>
                            </div>
                        </div>

                        <div style="background: rgba(32, 107, 196, 0.08); border: 1px solid rgba(32, 107, 196, 0.2); border-radius: 8px; padding: 10px 12px; font-size: 11.5px; color: #93c5fd; line-height: 1.4;">
                            ℹ️ <strong>Cloud Persistence Note:</strong> This change is written directly to the Supabase PostgreSQL database. The user will be required to authenticate with this new password on their next sign-in.
                        </div>
                    </div>
                    <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                        <button type="button" class="tblr-btn tblr-btn-default" onclick="document.getElementById('modal-password-staff').remove()">
                            Cancel
                        </button>
                        <button type="submit" id="staff-pwd-submit-btn" class="tblr-btn tblr-btn-primary" style="background: #206bc4; font-weight: 600;">
                            Save Password in Cloud
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('staff-pwd-new')?.focus(), 50);
    },

    togglePwdVisibility(fieldId) {
        const f = document.getElementById(fieldId);
        if (f) f.type = f.type === 'password' ? 'text' : 'password';
    },

    setPresetPassword(pwd) {
        const p1 = document.getElementById('staff-pwd-new');
        const p2 = document.getElementById('staff-pwd-confirm');
        if (p1) p1.value = pwd;
        if (p2) p2.value = pwd;
    },

    generateRandomPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let pwd = '';
        for (let i = 0; i < 12; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.setPresetPassword(pwd);
        window.App.showToast('Generated strong password: ' + pwd, 'info');
    },

    async handlePasswordSubmit(e, staffId, email) {
        e.preventDefault();
        const p1 = document.getElementById('staff-pwd-new')?.value;
        const p2 = document.getElementById('staff-pwd-confirm')?.value;
        const submitBtn = document.getElementById('staff-pwd-submit-btn');

        if (!p1 || p1.length < 4) {
            window.App.showToast("Password must be at least 4 characters long.", "danger");
            return;
        }

        if (p1 !== p2) {
            window.App.showToast("Passwords do not match. Please re-enter.", "danger");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Writing to Cloud Database...';
        }

        try {
            await window.SupabaseClient.updateUserPassword(staffId, p1);
            document.getElementById('modal-password-staff')?.remove();

            const currentUser = window.SupabaseClient.getCurrentUser();
            const isSelf = currentUser && (currentUser.id === staffId || currentUser.email === email);

            if (isSelf) {
                window.App.showToast("Your password was updated in Supabase! Use it for all future logins.", "success");
            } else {
                window.App.showToast(`Password for ${email} updated successfully in Supabase Cloud!`, "success");
            }
        } catch (err) {
            console.error("Change password error", err);
            window.App.showToast("Failed to update password: " + err.message, "danger");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Save Password in Cloud';
            }
        }
    },

    showEditModal(staffId) {
        const staff = this.staffList.find(s => s.id === staffId);
        if (!staff) {
            window.App.showToast("Staff record not found.", "danger");
            return;
        }

        const existing = document.getElementById('modal-edit-staff');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-edit-staff';
        modal.className = 'tblr-modal-backdrop';
        modal.style.display = 'flex';

        const initials = staff.full_name ? staff.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';
        const currentAvatar = staff.avatar_url || '';

        modal.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 520px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                    <div>
                        <h3 class="tblr-modal-title" style="color: #fff; margin: 0; font-size: 16px;">Edit Employee Profile & Photo</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            Updates employee name, title, profile picture (PFP) and role in Supabase PostgreSQL
                        </div>
                    </div>
                    <button class="tblr-modal-close" onclick="document.getElementById('modal-edit-staff').remove()">&times;</button>
                </div>
                <form onsubmit="StaffView.handleEditSubmit(event, '${staff.id}')">
                    <div class="tblr-modal-body" style="padding: 20px;">
                        <!-- Avatar Preview & Preset Picker -->
                        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 18px; padding: 12px; background: #18181c; border: 1px solid #27272a; border-radius: 8px;">
                            <div id="staff-edit-preview-box" style="width: 58px; height: 58px; border-radius: 50%; overflow: hidden; background: #27272a; border: 2px solid #3f3f46; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                ${currentAvatar 
                                    ? `<img src="${currentAvatar}" id="staff-edit-img-preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; document.getElementById('staff-edit-init-preview').style.display='flex';" />
                                       <span id="staff-edit-init-preview" style="display: none; color: #fff; font-weight: 700; font-size: 18px;">${initials}</span>`
                                    : `<span id="staff-edit-init-preview" style="color: #fff; font-weight: 700; font-size: 18px;">${initials}</span>
                                       <img src="" id="staff-edit-img-preview" style="display: none; width: 100%; height: 100%; object-fit: cover;" />`
                                }
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 4px;">Quick Avatar Presets (Click to Select)</div>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <button type="button" class="tblr-btn tblr-btn-sm tblr-btn-default" style="padding: 2px 8px; font-size: 11px;" onclick="StaffView.setPresetAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')">
                                        Executive
                                    </button>
                                    <button type="button" class="tblr-btn tblr-btn-sm tblr-btn-default" style="padding: 2px 8px; font-size: 11px;" onclick="StaffView.setPresetAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')">
                                        Manager
                                    </button>
                                    <button type="button" class="tblr-btn tblr-btn-sm tblr-btn-default" style="padding: 2px 8px; font-size: 11px;" onclick="StaffView.setPresetAvatar('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150')">
                                        Specialist
                                    </button>
                                    <button type="button" class="tblr-btn tblr-btn-sm tblr-btn-default" style="padding: 2px 8px; font-size: 11px;" onclick="StaffView.setPresetAvatar('https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(staff.full_name)}')">
                                        Modern Bot
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Profile Photo / Avatar Image URL</label>
                            <input type="url" id="staff-edit-avatar" class="shadcn-input" placeholder="https://example.com/avatar.jpg or paste URL" value="${currentAvatar}" oninput="StaffView.updatePreviewImage(this.value)" />
                            <div style="font-size: 11px; color: var(--tblr-text-muted); margin-top: 4px;">Paste an image link or select one of the presets above.</div>
                        </div>

                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Full Name *</label>
                            <input type="text" id="staff-edit-name" class="shadcn-input" value="${staff.full_name || ''}" required />
                        </div>

                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Job Title</label>
                            <input type="text" id="staff-edit-title" class="shadcn-input" value="${staff.job_title || ''}" />
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                            <div>
                                <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">RBAC Role</label>
                                <select id="staff-edit-role" class="shadcn-select">
                                    <option value="SUPER_ADMIN" ${staff.role === 'SUPER_ADMIN' ? 'selected' : ''}>Super Administrator</option>
                                    <option value="INVENTORY_MANAGER" ${staff.role === 'INVENTORY_MANAGER' ? 'selected' : ''}>Inventory Manager</option>
                                    <option value="STORE_MANAGER" ${staff.role === 'STORE_MANAGER' ? 'selected' : ''}>Store Manager</option>
                                    <option value="CASHIER" ${staff.role === 'CASHIER' ? 'selected' : ''}>POS Cashier</option>
                                    <option value="AUDITOR" ${staff.role === 'AUDITOR' ? 'selected' : ''}>Auditor & Compliance</option>
                                </select>
                            </div>
                            <div>
                                <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Account Status</label>
                                <select id="staff-edit-status" class="shadcn-select">
                                    <option value="true" ${staff.is_active ? 'selected' : ''}>Active</option>
                                    <option value="false" ${!staff.is_active ? 'selected' : ''}>Disabled</option>
                                </select>
                            </div>
                        </div>

                        <!-- Optional Password Change inside Edit Profile -->
                        <div class="tblr-form-group" style="margin-bottom: 14px; padding-top: 10px; border-top: 1px solid #27272a;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: flex; justify-content: space-between;">
                                <span>Change Password in Cloud (Optional)</span>
                                <span style="font-size: 11px; color: var(--tblr-text-muted);">Leave empty to keep current</span>
                            </label>
                            <input type="password" id="staff-edit-pwd" class="shadcn-input" placeholder="Enter new password to update in Supabase" autocomplete="new-password" />
                        </div>

                        <div style="font-size: 11px; color: var(--tblr-text-muted);">
                            Account Email: <strong>${staff.email}</strong> (immutable primary enterprise identifier)
                        </div>
                    </div>
                    <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #222226;">
                        <button type="button" class="tblr-btn tblr-btn-default" onclick="document.getElementById('modal-edit-staff').remove()">
                            Cancel
                        </button>
                        <button type="submit" id="staff-edit-submit-btn" class="tblr-btn tblr-btn-primary">
                            Save Changes to Supabase
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    setPresetAvatar(url) {
        const input = document.getElementById('staff-edit-avatar');
        if (input) {
            input.value = url;
            this.updatePreviewImage(url);
        }
    },

    updatePreviewImage(url) {
        const img = document.getElementById('staff-edit-img-preview');
        const init = document.getElementById('staff-edit-init-preview');
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
            if (init) init.style.display = 'flex';
        }
    },

    async handleEditSubmit(e, staffId) {
        e.preventDefault();
        const submitBtn = document.getElementById('staff-edit-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Saving to Supabase...';
        }

        const fullName = document.getElementById('staff-edit-name')?.value.trim();
        const jobTitle = document.getElementById('staff-edit-title')?.value.trim();
        const avatarUrl = document.getElementById('staff-edit-avatar')?.value.trim();
        const role = document.getElementById('staff-edit-role')?.value;
        const isActive = document.getElementById('staff-edit-status')?.value === 'true';
        const newPassword = document.getElementById('staff-edit-pwd')?.value.trim();

        try {
            const updatePayload = {
                full_name: fullName,
                job_title: jobTitle,
                avatar_url: avatarUrl,
                role: role,
                is_active: isActive
            };
            if (newPassword && newPassword.length >= 4) {
                updatePayload.password = newPassword;
            }

            await window.SupabaseClient.updateUserProfile(staffId, updatePayload);

            document.getElementById('modal-edit-staff')?.remove();
            window.App.showToast(`Updated profile for ${fullName} in cloud database!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            console.error("Save staff error", err);
            window.App.showToast("Failed to save changes: " + err.message, "danger");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Save Changes to Supabase';
            }
        }
    },

    showAddModal() {
        const existing = document.getElementById('modal-add-staff');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-add-staff';
        modal.className = 'tblr-modal-backdrop';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 480px; background: #121215; border: 1px solid #27272a; border-radius: 12px;">
                <div class="tblr-modal-header" style="border-bottom: 1px solid #222226; padding: 16px 20px;">
                    <div>
                        <h3 class="tblr-modal-title" style="color: #fff; margin: 0; font-size: 16px;">Add Staff Member</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            Creates a new staff profile and assigns an RBAC role in Supabase
                        </div>
                    </div>
                    <button class="tblr-modal-close" onclick="document.getElementById('modal-add-staff').remove()">&times;</button>
                </div>
                <form onsubmit="StaffView.handleAddSubmit(event)">
                    <div class="tblr-modal-body" style="padding: 20px;">
                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Full Name *</label>
                            <input type="text" id="staff-add-name" class="shadcn-input" placeholder="e.g. Ramesh Kumar" required />
                        </div>
                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Email Address *</label>
                            <input type="email" id="staff-add-email" class="shadcn-input" placeholder="ramesh@sse.inv.com" required />
                        </div>
                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Job Title</label>
                            <input type="text" id="staff-add-title" class="shadcn-input" placeholder="e.g. Senior Inventory Specialist" />
                        </div>
                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Profile Photo / Avatar URL (Optional)</label>
                            <input type="url" id="staff-add-avatar" class="shadcn-input" placeholder="https://..." />
                        </div>
                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Initial Cloud Password</label>
                            <input type="password" id="staff-add-password" class="shadcn-input" placeholder="Default: Password@123" value="Password@123" required />
                        </div>
                        <div class="tblr-form-group" style="margin-bottom: 14px;">
                            <label class="tblr-form-label" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block;">Role-Based Access Control (RBAC) Role *</label>
                            <select id="staff-add-role" class="shadcn-select" required>
                                <option value="SUPER_ADMIN">SUPER_ADMIN (Full Complete Access)</option>
                                <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Inventory, Catalog, Balances)</option>
                                <option value="STORE_MANAGER">STORE_MANAGER (Procurement, Suppliers, GRN)</option>
                                <option value="CASHIER" selected>CASHIER (POS Register, Sales Invoicing)</option>
                                <option value="AUDITOR">AUDITOR (Compliance, Double-Entry GL, Audit Trail)</option>
                            </select>
                        </div>
                    </div>
                    <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px; padding: 16px 20px; border-top: 1px solid #222226;">
                        <button type="button" class="tblr-btn tblr-btn-default" onclick="document.getElementById('modal-add-staff').remove()">
                            Cancel
                        </button>
                        <button type="submit" id="staff-submit-btn" class="tblr-btn tblr-btn-primary">
                            Create Staff User
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async handleAddSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('staff-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating...';

        const payload = {
            full_name: document.getElementById('staff-add-name')?.value.trim(),
            email: document.getElementById('staff-add-email')?.value.trim(),
            job_title: document.getElementById('staff-add-title')?.value.trim() || 'Staff Member',
            avatar_url: document.getElementById('staff-add-avatar')?.value.trim() || null,
            password: document.getElementById('staff-add-password')?.value.trim() || 'Password@123',
            role: document.getElementById('staff-add-role')?.value || 'CASHIER'
        };

        try {
            await window.SupabaseClient.createStaff(payload);
            document.getElementById('modal-add-staff')?.remove();
            window.App.showToast(`Staff user "${payload.full_name}" registered with role ${payload.role}!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            console.error("Create staff error", err);
            window.App.showToast("Failed to create staff member: " + err.message, "danger");
            submitBtn.disabled = false;
            submitBtn.innerText = 'Create Staff User';
        }
    }
};

window.StaffView = StaffView;
