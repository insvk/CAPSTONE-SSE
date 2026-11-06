/**
 * ==============================================================================
 * Tabler Dark UI Pure Canvas Charts
 * Zero dependencies, ultra-lightweight, 100% offline & pixel-perfect
 * ==============================================================================
 */

const TablerCharts = {
    // 1. Wavy Line Sparkline (as in Total Users, Revenue, New Clients)
    drawSparkline(canvas, points, strokeColor = '#206bc4', fillColor = 'rgba(32, 107, 196, 0.15)') {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 300;
        const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 50;

        ctx.clearRect(0, 0, width, height);

        if (!points || points.length < 2) return;
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = (max - min) || 1;

        const stepX = width / (points.length - 1);
        const getY = (val) => height - 6 - ((val - min) / range) * (height - 12);

        // Path
        ctx.beginPath();
        ctx.moveTo(0, getY(points[0]));
        for (let i = 1; i < points.length; i++) {
            const xPrev = (i - 1) * stepX;
            const yPrev = getY(points[i - 1]);
            const xCurr = i * stepX;
            const yCurr = getY(points[i]);
            const cpX = (xPrev + xCurr) / 2;
            ctx.bezierCurveTo(cpX, yPrev, cpX, yCurr, xCurr, yCurr);
        }

        // Stroke
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5 * window.devicePixelRatio;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Area Fill
        if (fillColor) {
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
    },

    // 2. Active Users Semi-Circular Gauge (Radial arc gauge)
    drawActiveUsersGauge(canvas, percent = 58) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 280;
        const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 180;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height - 10 * window.devicePixelRatio;
        const radius = Math.min(width, height * 1.8) * 0.42;
        const lineWidth = 12 * window.devicePixelRatio;

        // Background track arc (dark slate)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false);
        ctx.strokeStyle = '#233446';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glowing Cyan active arc
        const activeAngle = Math.PI + (percent / 100) * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, activeAngle, false);
        ctx.strokeStyle = '#17a2b8';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    },

    // 3. Micro Histogram / Vertical Bars (Active Subscriptions)
    drawHistogram(canvas, values = [12, 18, 14, 25, 30, 22, 19, 28, 35, 42, 38, 48, 52, 40, 45, 60, 55, 65, 70, 62, 58, 64, 75, 80]) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 300;
        const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 50;

        ctx.clearRect(0, 0, width, height);

        const max = Math.max(...values, 100);
        const barWidth = 3 * window.devicePixelRatio;
        const gap = (width - (values.length * barWidth)) / (values.length - 1);

        ctx.fillStyle = '#206bc4';
        for (let i = 0; i < values.length; i++) {
            const h = (values[i] / max) * (height - 6);
            const x = i * (barWidth + gap);
            const y = height - h;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, h, 2);
            ctx.fill();
        }
    },

    // 4. Traffic Summary Grouped Bar Chart
    drawTrafficSummary(canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600;
        const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 220;

        ctx.clearRect(0, 0, width, height);

        const paddingLeft = 40 * window.devicePixelRatio;
        const paddingBottom = 30 * window.devicePixelRatio;
        const chartW = width - paddingLeft - 20;
        const chartH = height - paddingBottom - 10;

        // Draw horizontal grid lines (0, 20, 40, 60, 80, 100)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#64748b';
        ctx.font = `${10 * window.devicePixelRatio}px -apple-system, sans-serif`;
        ctx.textAlign = 'right';

        for (let i = 0; i <= 5; i++) {
            const val = i * 20;
            const y = height - paddingBottom - (i / 5) * chartH;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();
            ctx.fillText(val.toString(), paddingLeft - 8, y + 4);
        }

        // Mock bar groups (Web: #206bc4, Social: #17a2b8, Other: #2fb344)
        const groups = [
            [25, 45, 15], [30, 55, 20], [45, 60, 35], [50, 70, 40],
            [60, 80, 50], [75, 85, 65], [65, 90, 75], [80, 95, 85]
        ];

        const groupStep = chartW / groups.length;
        const barW = 6 * window.devicePixelRatio;

        groups.forEach((grp, idx) => {
            const baseX = paddingLeft + idx * groupStep + (groupStep - (barW * 3 + 4)) / 2;

            // Bar 1: Web (Blue)
            const h1 = (grp[0] / 100) * chartH;
            ctx.fillStyle = '#206bc4';
            ctx.beginPath();
            ctx.roundRect(baseX, height - paddingBottom - h1, barW, h1, [2, 2, 0, 0]);
            ctx.fill();

            // Bar 2: Social (Cyan)
            const h2 = (grp[1] / 100) * chartH;
            ctx.fillStyle = '#17a2b8';
            ctx.beginPath();
            ctx.roundRect(baseX + barW + 2, height - paddingBottom - h2, barW, h2, [2, 2, 0, 0]);
            ctx.fill();

            // Bar 3: Other (Green)
            const h3 = (grp[2] / 100) * chartH;
            ctx.fillStyle = '#2fb344';
            ctx.beginPath();
            ctx.roundRect(baseX + (barW + 2) * 2, height - paddingBottom - h3, barW, h3, [2, 2, 0, 0]);
            ctx.fill();
        });
    },

    // 5. Locations Regional Map Vector Graphic
    drawLocationsMap(canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio || 600;
        const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio || 220;

        ctx.clearRect(0, 0, width, height);

        // Dark background map outlines silhouette
        ctx.fillStyle = 'rgba(32, 107, 196, 0.12)';
        ctx.strokeStyle = '#206bc4';
        ctx.lineWidth = 1.5;

        // Simplified World Continents Silhouettes
        // North America
        ctx.beginPath();
        ctx.roundRect(width * 0.1, height * 0.18, width * 0.22, height * 0.45, 12);
        ctx.fill(); ctx.stroke();

        // South America
        ctx.beginPath();
        ctx.roundRect(width * 0.25, height * 0.55, width * 0.14, height * 0.35, 12);
        ctx.fill(); ctx.stroke();

        // Europe
        ctx.beginPath();
        ctx.roundRect(width * 0.45, height * 0.15, width * 0.15, height * 0.3, 10);
        ctx.fill(); ctx.stroke();

        // Africa
        ctx.beginPath();
        ctx.roundRect(width * 0.46, height * 0.45, width * 0.16, height * 0.4, 14);
        ctx.fill(); ctx.stroke();

        // Asia / India
        ctx.beginPath();
        ctx.roundRect(width * 0.62, height * 0.18, width * 0.28, height * 0.5, 16);
        ctx.fillStyle = 'rgba(32, 107, 196, 0.3)';
        ctx.fill(); ctx.stroke();

        // Active Branch Beacon Points (Glowing Pulse)
        const hubs = [
            { x: width * 0.72, y: height * 0.5, name: 'HQ / Metro Main (Chennai)' },
            { x: width * 0.68, y: height * 0.42, name: 'Western Hub (Mumbai)' },
            { x: width * 0.52, y: height * 0.3, name: 'Europe Gateway' },
            { x: width * 0.22, y: height * 0.35, name: 'Americas Hub' }
        ];

        hubs.forEach(hub => {
            // Glow
            ctx.beginPath();
            ctx.arc(hub.x, hub.y, 8 * window.devicePixelRatio, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(47, 179, 68, 0.25)';
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(hub.x, hub.y, 3.5 * window.devicePixelRatio, 0, 2 * Math.PI);
            ctx.fillStyle = '#2fb344';
            ctx.fill();
        });
    }
};

window.TablerCharts = TablerCharts;

