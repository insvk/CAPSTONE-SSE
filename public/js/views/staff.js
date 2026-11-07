/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Staff & RBAC Access Control View
 * 100% Live Cloud Synchronization with Supabase PostgreSQL
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
                            Role-Based Access Control (RBAC) enforced across all billing and inventory views
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
                                <th>STAFF MEMBER</th>
                                <th>EMAIL</th>
                                <th>JOB TITLE</th>
                                <th>RBAC ROLE</th>
                                <th>PERMISSIONS SCOPE</th>
                                <th>STATUS</th>
                                <th style="text-align: right;">QUICK SWITCH</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.staffList.map(s => {
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

                                return `
                                    <tr>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="width: 32px; height: 32px; border-radius: 50%; background: #233446; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;">
                                                    ${initials}
                                                </div>
                                                <div style="font-weight: 600; color: #fff;">${s.full_name}</div>
                                            </div>
                                        </td>
                                        <td><span style="font-size: 13px;">${s.email}</span></td>
                                        <td><span style="font-size: 12px; color: var(--tblr-text-secondary);">${s.job_title}</span></td>
                                        <td><span class="tblr-badge ${badgeClass}">${s.role}</span></td>
                                        <td><span style="font-size: 12px; color: var(--tblr-text-muted);">${scope}</span></td>
                                        <td>
                                            <span class="tblr-badge ${s.is_active ? 'tblr-badge-green' : 'tblr-badge-red'}">
                                                ${s.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style="text-align: right;">
                                            <button class="tblr-btn tblr-btn-sm tblr-btn-default" title="Sign in as this user" onclick="StaffView.switchUser('${s.email}', '${s.role}', '${s.full_name}')">
                                                Switch ⇄
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

    showAddModal() {
        const existing = document.getElementById('modal-add-staff');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-add-staff';
        modal.className = 'tblr-modal-backdrop';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="tblr-modal-dialog" style="max-width: 480px;">
                <div class="tblr-modal-header">
                    <div>
                        <h3 class="tblr-modal-title">Add Staff Member</h3>
                        <div style="font-size: 12px; color: var(--tblr-text-muted); margin-top: 2px;">
                            Creates a new staff profile and assigns an RBAC role in Supabase
                        </div>
                    </div>
                    <button class="tblr-modal-close" onclick="document.getElementById('modal-add-staff').remove()">✕</button>
                </div>
                <form onsubmit="StaffView.handleAddSubmit(event)">
                    <div class="tblr-modal-body">
                        <div class="tblr-form-group">
                            <label class="tblr-form-label">Full Name *</label>
                            <input type="text" id="staff-add-name" class="tblr-form-control" placeholder="e.g. Ramesh Kumar" required />
                        </div>
                        <div class="tblr-form-group">
                            <label class="tblr-form-label">Email Address *</label>
                            <input type="email" id="staff-add-email" class="tblr-form-control" placeholder="ramesh@apex.com" required />
                        </div>
                        <div class="tblr-form-group">
                            <label class="tblr-form-label">Job Title</label>
                            <input type="text" id="staff-add-title" class="tblr-form-control" placeholder="e.g. Senior Inventory Specialist" />
                        </div>
                        <div class="tblr-form-group">
                            <label class="tblr-form-label">Role-Based Access Control (RBAC) Role *</label>
                            <select id="staff-add-role" class="tblr-form-control" required>
                                <option value="SUPER_ADMIN">SUPER_ADMIN (Full Complete Access)</option>
                                <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Inventory, Catalog, Balances)</option>
                                <option value="STORE_MANAGER">STORE_MANAGER (Procurement, Suppliers, GRN)</option>
                                <option value="CASHIER" selected>CASHIER (POS Register, Sales Invoicing)</option>
                                <option value="AUDITOR">AUDITOR (Compliance, Double-Entry GL, Audit Trail)</option>
                            </select>
                        </div>
                    </div>
                    <div class="tblr-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
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
            role: document.getElementById('staff-add-role')?.value || 'CASHIER'
        };

        try {
            await window.SupabaseClient.createStaff(payload);
            document.getElementById('modal-add-staff')?.remove();
            window.App.showToast(`Staff user "${payload.full_name}" registered with role ${payload.role}!`, 'success');
            await this.render(document.getElementById('main-content'));
        } catch (err) {
            console.error("Create staff error", err);
            alert("Failed to create staff member: " + err.message);
            submitBtn.disabled = false;
            submitBtn.innerText = 'Create Staff User';
        }
    }
};

window.StaffView = StaffView;
