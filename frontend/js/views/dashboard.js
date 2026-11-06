/**
 * ==============================================================================
 * Tabler Dark UI :: Dashboard View
 * 100% Faithful Reproduction of Reference Screenshot
 * ==============================================================================
 */

const DashboardView = {
    async render(container) {
        container.innerHTML = `
            <div class="tblr-grid">
                <!-- 1. Welcome Card -->
                <div class="tblr-card tblr-welcome-card">
                    <div class="tblr-welcome-content">
                        <h2 class="tblr-welcome-title">Welcome back, Paweł</h2>
                        <p class="tblr-welcome-desc">You have 5 new messages and 2 new notifications.</p>
                        
                        <div class="tblr-welcome-metrics">
                            <div class="tblr-welcome-metric-item">
                                <span class="tblr-welcome-label">TODAY'S SALES</span>
                                <span class="tblr-welcome-val">6,782 <span class="tblr-badge tblr-badge-success">7% ↑</span></span>
                                <div class="tblr-indicator-bar green"></div>
                            </div>
                            <div class="tblr-welcome-metric-item">
                                <span class="tblr-welcome-label">GROWTH RATE</span>
                                <span class="tblr-welcome-val">78,4% <span class="tblr-badge tblr-badge-danger">-1% ↓</span></span>
                                <div class="tblr-indicator-bar red"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Celebratory Illustration Graphic -->
                    <div class="tblr-welcome-illustration">
                        <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="60" cy="45" r="35" fill="rgba(32, 107, 196, 0.2)" />
                            <circle cx="60" cy="45" r="24" fill="#206bc4" />
                            <path d="M52 45L58 51L70 39" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                            <!-- Small decorative celebratory confetti -->
                            <rect x="25" y="25" width="4" height="4" rx="2" fill="#2fb344" />
                            <rect x="95" y="30" width="5" height="5" rx="2.5" fill="#f59f00" />
                            <rect x="30" y="65" width="4" height="4" rx="2" fill="#17a2b8" />
                            <rect x="90" y="65" width="4" height="4" rx="2" fill="#4299e1" />
                            <circle cx="60" cy="15" r="3" fill="#ffffff" opacity="0.6"/>
                        </svg>
                    </div>
                </div>

                <!-- 2. Total Users Card -->
                <div class="tblr-card" style="grid-column: span 3;">
                    <div class="tblr-card-header">
                        <span class="tblr-card-title">TOTAL USERS</span>
                    </div>
                    <div class="tblr-card-metric">
                        <span class="tblr-metric-number">75,782</span>
                        <span class="tblr-badge tblr-badge-success">2% ↑</span>
                    </div>
                    <span class="tblr-card-subtitle">24,635 users increased from last month</span>
                    <canvas id="sparkline-users" class="tblr-sparkline-canvas"></canvas>
                </div>

                <!-- 3. Active Users Gauge Card -->
                <div class="tblr-card tblr-gauge-card">
                    <div class="tblr-card-header" style="width: 100%;">
                        <span class="tblr-card-title">ACTIVE USERS</span>
                    </div>
                    <div class="tblr-card-metric">
                        <span class="tblr-metric-number">25,782</span>
                        <span class="tblr-badge tblr-badge-danger">-1% ↓</span>
                    </div>
                    
                    <div class="tblr-gauge-container">
                        <canvas id="gauge-active-users" style="width: 100%; height: 100%;"></canvas>
                        <div class="tblr-gauge-overlay">
                            <div class="tblr-gauge-sub">ACTIVE USERS</div>
                            <div class="tblr-gauge-percent">58%</div>
                        </div>
                    </div>
                </div>

                <!-- 4. Sales Metric Card -->
                <div class="tblr-card" style="grid-column: span 3;">
                    <div class="tblr-card-header">
                        <span class="tblr-card-title">SALES</span>
                        <span style="font-size: 11px; color: var(--tblr-text-muted);">Last 7 days ▾</span>
                    </div>
                    <div class="tblr-card-metric">
                        <span class="tblr-metric-number">75%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
                        <span style="font-size: 12px; color: var(--tblr-text-secondary);">Conversion rate</span>
                        <span class="tblr-badge tblr-badge-success">7% ↑</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: #233446; border-radius: 3px; margin-top: 8px; overflow: hidden;">
                        <div style="width: 75%; height: 100%; background: #206bc4; border-radius: 3px;"></div>
                    </div>
                </div>

                <!-- 5. Revenue Metric Card -->
                <div class="tblr-card" style="grid-column: span 3;">
                    <div class="tblr-card-header">
                        <span class="tblr-card-title">REVENUE</span>
                        <span style="font-size: 11px; color: var(--tblr-text-muted);">Last 7 days ▾</span>
                    </div>
                    <div class="tblr-card-metric">
                        <span class="tblr-metric-number">$4,300</span>
                        <span class="tblr-badge tblr-badge-success">8% ↑</span>
                    </div>
                    <canvas id="sparkline-revenue" class="tblr-sparkline-canvas"></canvas>
                </div>

                <!-- 6. New Clients Metric Card -->
                <div class="tblr-card" style="grid-column: span 3;">
                    <div class="tblr-card-header">
                        <span class="tblr-card-title">NEW CLIENTS</span>
                        <span style="font-size: 11px; color: var(--tblr-text-muted);">Last 7 days ▾</span>
                    </div>
                    <div class="tblr-card-metric">
                        <span class="tblr-metric-number">6,782</span>
                        <span class="tblr-badge tblr-badge-muted">0% —</span>
                    </div>
                    <canvas id="sparkline-clients" class="tblr-sparkline-canvas"></canvas>
                </div>

                <!-- 7. Active Subscriptions Metric Card -->
                <div class="tblr-card" style="grid-column: span 3;">
                    <div class="tblr-card-header">
                        <span class="tblr-card-title">ACTIVE SUBSCRIPTIONS</span>
                        <span style="font-size: 11px; color: var(--tblr-text-muted);">Last 7 days ▾</span>
                    </div>
                    <div class="tblr-card-metric">
                        <span class="tblr-metric-number">2,986</span>
                        <span class="tblr-badge tblr-badge-success">4% ↑</span>
                    </div>
                    <canvas id="histogram-subscriptions" class="tblr-sparkline-canvas"></canvas>
                </div>

                <!-- 8. Quick Stat Pill Tiles -->
                <div class="tblr-card tblr-stat-tile">
                    <div class="tblr-stat-icon-badge blue">$</div>
                    <div class="tblr-stat-info">
                        <span class="tblr-stat-title">132 Sales</span>
                        <span class="tblr-stat-sub">12 waiting payments</span>
                    </div>
                </div>

                <div class="tblr-card tblr-stat-tile">
                    <div class="tblr-stat-icon-badge green">🛒</div>
                    <div class="tblr-stat-info">
                        <span class="tblr-stat-title">78 Orders</span>
                        <span class="tblr-stat-sub">32 shipped</span>
                    </div>
                </div>

                <div class="tblr-card tblr-stat-tile">
                    <div class="tblr-stat-icon-badge dark">𝕏</div>
                    <div class="tblr-stat-info">
                        <span class="tblr-stat-title">623 Shares</span>
                        <span class="tblr-stat-sub">16 today</span>
                    </div>
                </div>

                <div class="tblr-card tblr-stat-tile">
                    <div class="tblr-stat-icon-badge blue">f</div>
                    <div class="tblr-stat-info">
                        <span class="tblr-stat-title">132 Likes</span>
                        <span class="tblr-stat-sub">21 today</span>
                    </div>
                </div>

                <!-- 9. Traffic Summary Bar Chart -->
                <div class="tblr-card" style="grid-column: span 6;">
                    <div class="tblr-card-header">
                        <span class="tblr-card-title">TRAFFIC SUMMARY</span>
                        <div style="display: flex; gap: 14px; font-size: 11px;">
                            <span style="display: flex; align-items: center; gap: 4px; color: #206bc4;">● Web</span>
                            <span style="display: flex; align-items: center; gap: 4px; color: #17a2b8;">● Social</span>
                            <span style="display: flex; align-items: center; gap: 4px; color: #2fb344;">● Other</span>
                        </div>
                    </div>
                    <canvas id="chart-traffic" class="tblr-chart-canvas"></canvas>
                </div>

                <!-- 10. Locations Map Card -->
                <div class="tblr-card" style="grid-column: span 6;">
                    <div class="tblr-card-header">
                        <span class="tblr-card-title">LOCATIONS</span>
                        <span style="font-size: 11px; color: var(--tblr-text-muted);">Active Distribution</span>
                    </div>
                    <canvas id="chart-locations" class="tblr-chart-canvas"></canvas>
                </div>
            </div>
        `;

        // Render Canvas Charts
        setTimeout(() => {
            TablerCharts.drawSparkline(
                document.getElementById('sparkline-users'),
                [32, 45, 38, 55, 62, 48, 52, 70, 65, 80, 85, 75, 90],
                '#17a2b8',
                'rgba(23, 162, 184, 0.15)'
            );

            TablerCharts.drawActiveUsersGauge(
                document.getElementById('gauge-active-users'),
                58
            );

            TablerCharts.drawSparkline(
                document.getElementById('sparkline-revenue'),
                [20, 25, 22, 35, 30, 45, 40, 58, 52, 65, 60, 75, 85],
                '#206bc4',
                'rgba(32, 107, 196, 0.18)'
            );

            TablerCharts.drawSparkline(
                document.getElementById('sparkline-clients'),
                [40, 42, 41, 48, 45, 52, 50, 55, 53, 58, 62, 60, 65],
                '#17a2b8',
                null
            );

            TablerCharts.drawHistogram(
                document.getElementById('histogram-subscriptions')
            );

            TablerCharts.drawTrafficSummary(
                document.getElementById('chart-traffic')
            );

            TablerCharts.drawLocationsMap(
                document.getElementById('chart-locations')
            );
        }, 50);
    }
};

window.DashboardView = DashboardView;

