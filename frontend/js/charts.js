/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Pure Canvas Charts
 * Faithful to Tabler Dark Reference UI (media_1794037675531_2457a7e7.webp)
 * ==============================================================================
 */

const Charts = {
    // 1. Smooth Wavy Area Sparkline (Total Stock Valuation)
    drawWaveArea(canvasId, points = [55, 62, 58, 65, 72, 68, 75, 82, 80, 88]) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width = (canvas.offsetWidth || 300) * dpr;
        const height = canvas.height = (canvas.offsetHeight || 60) * dpr;

        ctx.clearRect(0, 0, width, height);

        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = (max - min) || 1;
        const stepX = width / (points.length - 1);
        const getY = (val) => height - 8 * dpr - ((val - min) / range) * (height - 16 * dpr);

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

        ctx.strokeStyle = '#206bc4';
        ctx.lineWidth = 2.5 * dpr;
        ctx.stroke();

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(32, 107, 196, 0.15)';
        ctx.fill();
    },

    // 2. Semi-Donut Radial Gauge (Active Users / Inventory Capacity)
    drawGauge(canvasId, ratio = 0.58) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width = (canvas.offsetWidth || 140) * dpr;
        const height = canvas.height = (canvas.offsetHeight || 90) * dpr;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height - 10 * dpr;
        const radius = Math.min(width, height * 1.8) * 0.42;
        const lineWidth = 10 * dpr;

        // Dark track arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false);
        ctx.strokeStyle = '#233446';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Cyan/Blue active arc
        const activeAngle = Math.PI + Math.max(0.05, Math.min(1, ratio)) * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, activeAngle, false);
        ctx.strokeStyle = '#206bc4';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    },

    // 3. Mini Line Sparkline
    drawSparkline(canvasId, points = [20, 35, 28, 45, 52, 48, 60], strokeColor = '#206bc4') {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width = (canvas.offsetWidth || 200) * dpr;
        const height = canvas.height = (canvas.offsetHeight || 40) * dpr;

        ctx.clearRect(0, 0, width, height);

        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = (max - min) || 1;
        const stepX = width / (points.length - 1);
        const getY = (val) => height - 4 * dpr - ((val - min) / range) * (height - 8 * dpr);

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

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
    },

    // 4. Micro Histogram (Vertical bars)
    drawHistogram(canvasId, values = [4, 8, 6, 12, 10, 15, 18, 14, 20, 16]) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width = (canvas.offsetWidth || 200) * dpr;
        const height = canvas.height = (canvas.offsetHeight || 40) * dpr;

        ctx.clearRect(0, 0, width, height);

        const max = Math.max(...values, 10);
        const barWidth = 3 * dpr;
        const gap = (width - (values.length * barWidth)) / Math.max(1, values.length - 1);

        ctx.fillStyle = '#206bc4';
        for (let i = 0; i < values.length; i++) {
            const h = (values[i] / max) * (height - 6 * dpr);
            const x = i * (barWidth + gap);
            const y = height - h;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, y, barWidth, h, 2 * dpr) : ctx.rect(x, y, barWidth, h);
            ctx.fill();
        }
    },

    // 5. Grouped Bar Chart (Category Stock Levels)
    drawGroupedBars(canvasId, categoryMap = {}) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width = (canvas.offsetWidth || 600) * dpr;
        const height = canvas.height = (canvas.offsetHeight || 220) * dpr;

        ctx.clearRect(0, 0, width, height);

        const paddingLeft = 40 * dpr;
        const paddingBottom = 30 * dpr;
        const chartW = width - paddingLeft - 20 * dpr;
        const chartH = height - paddingBottom - 10 * dpr;

        // Grid lines (0, 20, 40, 60, 80, 100)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#64748b';
        ctx.font = `${10 * dpr}px -apple-system, sans-serif`;
        ctx.textAlign = 'right';

        for (let i = 0; i <= 5; i++) {
            const val = i * 20;
            const y = height - paddingBottom - (i / 5) * chartH;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(width - 20 * dpr, y);
            ctx.stroke();
            ctx.fillText(val.toString(), paddingLeft - 8 * dpr, y + 4 * dpr);
        }

        // Multi-color grouped bars
        const groups = [
            [25, 45, 15], [30, 55, 20], [45, 60, 35], [50, 70, 40],
            [60, 80, 50], [75, 85, 65], [65, 90, 75], [80, 95, 85]
        ];

        const groupStep = chartW / groups.length;
        const barW = 6 * dpr;

        groups.forEach((grp, idx) => {
            const baseX = paddingLeft + idx * groupStep + (groupStep - (barW * 3 + 4 * dpr)) / 2;

            // Bar 1: Blue
            const h1 = (grp[0] / 100) * chartH;
            ctx.fillStyle = '#206bc4';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(baseX, height - paddingBottom - h1, barW, h1, [2 * dpr, 2 * dpr, 0, 0]) : ctx.rect(baseX, height - paddingBottom - h1, barW, h1);
            ctx.fill();

            // Bar 2: Cyan
            const h2 = (grp[1] / 100) * chartH;
            ctx.fillStyle = '#17a2b8';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(baseX + barW + 2 * dpr, height - paddingBottom - h2, barW, h2, [2 * dpr, 2 * dpr, 0, 0]) : ctx.rect(baseX + barW + 2 * dpr, height - paddingBottom - h2, barW, h2);
            ctx.fill();

            // Bar 3: Green
            const h3 = (grp[2] / 100) * chartH;
            ctx.fillStyle = '#2fb344';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(baseX + (barW + 2 * dpr) * 2, height - paddingBottom - h3, barW, h3, [2 * dpr, 2 * dpr, 0, 0]) : ctx.rect(baseX + (barW + 2 * dpr) * 2, height - paddingBottom - h3, barW, h3);
            ctx.fill();
        });
    },

    // 6. Regional Distribution Map
    drawRegionalMap(canvasId) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width = (canvas.offsetWidth || 380) * dpr;
        const height = canvas.height = (canvas.offsetHeight || 220) * dpr;

        ctx.clearRect(0, 0, width, height);

        // Map Silhouette Contours
        ctx.fillStyle = 'rgba(32, 107, 196, 0.12)';
        ctx.strokeStyle = '#206bc4';
        ctx.lineWidth = 1.5;

        // Continents / Region blocks
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(width * 0.08, height * 0.15, width * 0.25, height * 0.45, 10 * dpr) : ctx.rect(width * 0.08, height * 0.15, width * 0.25, height * 0.45);
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(width * 0.22, height * 0.55, width * 0.16, height * 0.35, 10 * dpr) : ctx.rect(width * 0.22, height * 0.55, width * 0.16, height * 0.35);
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(width * 0.48, height * 0.18, width * 0.42, height * 0.65, 14 * dpr) : ctx.rect(width * 0.48, height * 0.18, width * 0.42, height * 0.65);
        ctx.fillStyle = 'rgba(32, 107, 196, 0.25)';
        ctx.fill(); ctx.stroke();

        // Pulsing Warehouse Hubs
        const hubs = [
            { x: width * 0.68, y: height * 0.45, name: 'Mumbai HQ' },
            { x: width * 0.72, y: height * 0.62, name: 'Bengaluru Hub' }
        ];

        hubs.forEach(hub => {
            ctx.beginPath();
            ctx.arc(hub.x, hub.y, 8 * dpr, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(47, 179, 68, 0.3)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(hub.x, hub.y, 3.5 * dpr, 0, 2 * Math.PI);
            ctx.fillStyle = '#2fb344';
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${9 * dpr}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(hub.name, hub.x + 8 * dpr, hub.y + 3 * dpr);
        });
    }
};

window.Charts = Charts;
window.TablerCharts = Charts;
