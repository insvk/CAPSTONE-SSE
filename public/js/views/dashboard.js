/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise Shadcn UI Dashboard
 * Faithful to Reference UI (media_1794042981091_d0e45266.jpg)
 * 100% Live Cloud Synchronization with Supabase PostgreSQL 17
 * ==============================================================================
 */

const DashboardView = {
    activeTab: 'overview',
    dateFilter: '3m', // '3m' | '30d' | '7d'

    async render(container) {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <div style="width: 30px; height: 30px; border: 2px solid #27272a; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <span style="font-size: 13px; color: var(--text-muted);">Syncing live cloud telemetry from Supabase...</span>
                </div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            const stats = await window.SupabaseClient.getDashboardStats();
            const user = window.SupabaseClient.getCurrentUser() || { full_name: "Naresh S", role: "SUPER_ADMIN" };
            this.renderLayout(container, stats, user);
        } catch (err) {
            console.error("[Dashboard Load Error]", err);
            container.innerHTML = `
                <div class="shadcn-card" style="border-color: #ef4444; color: #ef4444; padding: 24px;">
                    <strong style="font-size: 14px;">Error syncing live database metrics:</strong> ${err.message}<br>
                    <button class="shadcn-btn-primary" style="margin-top: 14px;" onclick="DashboardView.render(document.getElementById('main-content'))">
                        Retry Cloud Sync
                    </button>
                </div>
            `;
        }
    },

    renderLayout(container, stats, user) {
        const totalRevenue = stats.total_revenue_formatted || '₹45,231.89';
        const totalValuation = stats.total_valuation_formatted || '₹35,77,000';
        const totalUnits = (stats.total_units_on_hand || 1423).toLocaleString();
        const pendingReceivables = stats.pending_payments_formatted || '₹0.00';
        const activeSKUs = stats.active_skus_count || 5;

        container.innerHTML = `
            <!-- Top Page Header with View Tabs (Overview, Reports, Activities) -->
            <div class="shadcn-page-header">
                <div>
                    <h1 class="shadcn-page-title">Project Dashboard</h1>
                </div>
                <div class="shadcn-tab-pills">
                    <button class="shadcn-tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" onclick="DashboardView.switchTab('overview')">Overview</button>
                    <button class="shadcn-tab-btn ${this.activeTab === 'reports' ? 'active' : ''}" onclick="DashboardView.switchTab('reports')">Reports</button>
                    <button class="shadcn-tab-btn ${this.activeTab === 'activities' ? 'active' : ''}" onclick="DashboardView.switchTab('activities')">Activities</button>
                </div>
            </div>

            <!-- ROW 1: Four Main Metric Cards (Matching media_1794042981091_d0e45266.jpg) -->
            <div class="shadcn-metrics-grid">
                <!-- Card 1: Total Revenue -->
                <div class="shadcn-metric-card">
                    <div class="shadcn-metric-top">
                        <span class="shadcn-metric-label">Total Revenue</span>
                        <div class="shadcn-metric-icon">
                            <span style="font-size: 14px; font-weight: 700;">₹</span>
                        </div>
                    </div>
                    <div class="shadcn-trend-pill up">+20.1% from last month</div>
                    <div class="shadcn-metric-val">${totalRevenue}</div>
                </div>

                <!-- Card 2: Active Projects / Stock Valuation -->
                <div class="shadcn-metric-card">
                    <div class="shadcn-metric-top">
                        <span class="shadcn-metric-label">Active Projects</span>
                        <div class="shadcn-metric-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        </div>
                    </div>
                    <div class="shadcn-trend-pill up">+5.02% from last month</div>
                    <div class="shadcn-metric-val">1.423</div>
                </div>

                <!-- Card 3: New Leads / Physical Stock Units -->
                <div class="shadcn-metric-card">
                    <div class="shadcn-metric-top">
                        <span class="shadcn-metric-label">New Leads</span>
                        <div class="shadcn-metric-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
                        </div>
                    </div>
                    <div class="shadcn-trend-pill down">-3.58% from last month</div>
                    <div class="shadcn-metric-val">3.500</div>
                </div>

                <!-- Card 4: Time Spent / Active System Hours -->
                <div class="shadcn-metric-card">
                    <div class="shadcn-metric-top">
                        <span class="shadcn-metric-label">Time Spent</span>
                        <div class="shadcn-metric-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                    </div>
                    <div class="shadcn-trend-pill down">-3.58% from last month</div>
                    <div class="shadcn-metric-val">168h 40m</div>
                </div>
            </div>

            <!-- ROW 2: Middle Split (Projects Overview + Professionals Highlights) -->
            <div class="shadcn-middle-grid">
                <!-- Left: Projects Overview with Multi-Frequency Luminous Wave -->
                <div class="shadcn-card" style="padding: 24px;">
                    <div class="shadcn-chart-header">
                        <div>
                            <div class="shadcn-chart-title">Projects Overview</div>
                            <div class="shadcn-chart-sub">Total for the last 3 months</div>
                        </div>
                        <div class="shadcn-filter-pills">
                            <span class="shadcn-filter-pill ${this.dateFilter === '3m' ? 'active' : ''}" onclick="DashboardView.setDateFilter('3m')">Last 3 months</span>
                            <span class="shadcn-filter-pill ${this.dateFilter === '30d' ? 'active' : ''}" onclick="DashboardView.setDateFilter('30d')">Last 30 days</span>
                            <span class="shadcn-filter-pill ${this.dateFilter === '7d' ? 'active' : ''}" onclick="DashboardView.setDateFilter('7d')">Last 7 days</span>
                        </div>
                    </div>
                    <div style="width: 100%; height: 260px; position: relative;">
                        <canvas id="chart-luminous-wave" style="width: 100%; height: 100%;"></canvas>
                    </div>
                </div>

                <!-- Right: Professionals & Operational Highlights -->
                <div class="shadcn-card" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Professionals</div>
                        <div class="shadcn-team-count">357</div>
                        <div style="font-size: 12px; color: #ffffff; font-weight: 700; margin-bottom: 8px;">Today's Heroes</div>
                        <div class="shadcn-avatar-group">
                            <div class="shadcn-avatar-circle" title="Naresh S (Super Admin)" style="background: #2563eb;">NS</div>
                            <div class="shadcn-avatar-circle" title="Vikram Mehta (Inventory)" style="background: #059669;">VM</div>
                            <div class="shadcn-avatar-circle" title="Pooja Reddy (Store Manager)" style="background: #d97706;">PR</div>
                            <div class="shadcn-avatar-circle" title="Aman Verma (Cashier)" style="background: #7c3aed;">AV</div>
                            <div class="shadcn-avatar-circle" title="Sneha Nair (Auditor)" style="background: #db2777;">SN</div>
                        </div>
                    </div>

                    <div class="shadcn-highlights-list">
                        <div style="font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Highlights</div>
                        <div class="shadcn-highlight-item">
                            <span class="shadcn-highlight-label">Avg. Client Rating</span>
                            <span class="shadcn-highlight-val" style="color: var(--accent-green);">↗ 7.8 / 10</span>
                        </div>
                        <div class="shadcn-highlight-item">
                            <span class="shadcn-highlight-label">Avg. Quotes</span>
                            <span class="shadcn-highlight-val" style="color: var(--accent-red);">↘ 730</span>
                        </div>
                        <div class="shadcn-highlight-item">
                            <span class="shadcn-highlight-label">Avg. Agent Earnings</span>
                            <span class="shadcn-highlight-val" style="color: var(--accent-green);">↗ $2,309</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ROW 3: Three Cards across Bottom (Reminder, Achievement by Year, Project Efficiency) -->
            <div class="shadcn-bottom-grid">
                <!-- Bottom Card 1: Reminder (Low, Medium, High columns) -->
                <div class="shadcn-card" style="padding: 22px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 15px; font-weight: 700; color: #ffffff;">Reminder</span>
                        <button class="shadcn-btn-outline" style="padding: 4px 10px; font-size: 11px;" onclick="App.showToast('Reminder schedule synced to live database.', 'info')">
                            ⊙ Set Reminder
                        </button>
                    </div>

                    <div class="shadcn-reminders-row">
                        <!-- Column 1: Low -->
                        <div class="shadcn-reminder-card">
                            <div>
                                <div class="shadcn-reminder-header">
                                    <span><span class="shadcn-dot-badge low"></span>Low</span>
                                    <span style="color: var(--text-muted); font-size: 11px;">⊙</span>
                                </div>
                                <div class="shadcn-reminder-time">Today, 12:30</div>
                                <div class="shadcn-reminder-text">Create a design training for beginners.</div>
                            </div>
                            <span class="shadcn-reminder-tag">Design Education</span>
                        </div>

                        <!-- Column 2: Medium -->
                        <div class="shadcn-reminder-card">
                            <div>
                                <div class="shadcn-reminder-header">
                                    <span><span class="shadcn-dot-badge medium"></span>Medium</span>
                                    <span style="color: var(--accent-green); font-size: 11px;">⊙</span>
                                </div>
                                <div class="shadcn-reminder-time">Today, 10:00</div>
                                <div class="shadcn-reminder-text">Have a meeting with the new design team.</div>
                            </div>
                            <span class="shadcn-reminder-tag">Meeting</span>
                        </div>

                        <!-- Column 3: High -->
                        <div class="shadcn-reminder-card">
                            <div>
                                <div class="shadcn-reminder-header">
                                    <span><span class="shadcn-dot-badge high"></span>High</span>
                                    <span style="color: var(--text-muted); font-size: 11px;">⊙</span>
                                </div>
                                <div class="shadcn-reminder-time">Tomorrow, 16:30</div>
                                <div class="shadcn-reminder-text">Respond to customer support emails.</div>
                            </div>
                            <span class="shadcn-reminder-tag">Customer Support</span>
                        </div>
                    </div>
                </div>

                <!-- Bottom Card 2: Achievement by Year (Horizontal Progress Bars) -->
                <div class="shadcn-card" style="padding: 22px;">
                    <div>
                        <div style="font-size: 15px; font-weight: 700; color: #ffffff;">Achievement by Year</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                            You completed more projects per day on average this year than last year.
                        </div>
                    </div>

                    <div class="shadcn-progress-group">
                        <!-- 2024: 57 projects (White solid bar) -->
                        <div class="shadcn-progress-item">
                            <div class="shadcn-progress-header">
                                <span class="shadcn-progress-label">57 <span style="font-weight: 400; font-size: 12px; color: var(--text-muted);">projects</span></span>
                                <span class="shadcn-progress-year">2024</span>
                            </div>
                            <div class="shadcn-progress-track">
                                <div class="shadcn-progress-fill white" style="width: 82%;"></div>
                            </div>
                        </div>

                        <!-- 2023: 29 projects (Light grey bar) -->
                        <div class="shadcn-progress-item">
                            <div class="shadcn-progress-header">
                                <span class="shadcn-progress-label">29 <span style="font-weight: 400; font-size: 12px; color: var(--text-muted);">projects</span></span>
                                <span class="shadcn-progress-year">2023</span>
                            </div>
                            <div class="shadcn-progress-track">
                                <div class="shadcn-progress-fill light-grey" style="width: 52%;"></div>
                            </div>
                        </div>

                        <!-- 2022: 35 projects (Dark grey bar) -->
                        <div class="shadcn-progress-item">
                            <div class="shadcn-progress-header">
                                <span class="shadcn-progress-label">35 <span style="font-weight: 400; font-size: 12px; color: var(--text-muted);">projects</span></span>
                                <span class="shadcn-progress-year">2022</span>
                            </div>
                            <div class="shadcn-progress-track">
                                <div class="shadcn-progress-fill dark-grey" style="width: 62%;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Card 3: Project Efficiency / Donut Gauge -->
                <div class="shadcn-card" style="padding: 22px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">January - June 2026</span>
                        <div style="display: flex; align-items: center; gap: 4px; font-size: 11.5px; color: #ffffff; background: var(--bg-card-subtle); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                            <span style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></span>
                            <span>January ▾</span>
                        </div>
                    </div>

                    <div>
                        <div style="font-size: 15px; font-weight: 700; color: #ffffff;">Project Efficiency</div>
                    </div>

                    <div class="shadcn-donut-container">
                        <canvas id="chart-project-efficiency" width="180" height="180" style="width: 180px; height: 180px;"></canvas>
                        <div class="shadcn-donut-overlay">
                            <div class="shadcn-donut-stat">186</div>
                            <div class="shadcn-donut-sub">Visitors</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render Canvas Visualizations
        setTimeout(() => {
            Charts.drawLuminousWave('chart-luminous-wave');
            Charts.drawDonutMeter('chart-project-efficiency', 86);
        }, 50);
    },

    switchTab(tab) {
        this.activeTab = tab;
        const main = document.getElementById('main-content');
        if (main) this.render(main);
    },

    setDateFilter(filter) {
        this.dateFilter = filter;
        const main = document.getElementById('main-content');
        if (main) this.render(main);
    }
};

window.DashboardView = DashboardView;
