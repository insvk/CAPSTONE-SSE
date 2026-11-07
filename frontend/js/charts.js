/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Pure Canvas Charts Engine
 * Faithful to Shadcn UI Kit Reference Design (media_1794042981091_d0e45266.jpg)
 * Luminous Wave Area Graphs, Donut Ring Gauges, Sparklines & Histograms
 * ==============================================================================
 */

const Charts = {
    // 1. Projects & Stock Overview: Luminous Wave Area Chart
    // Recreates the exact multi-frequency wave from media_1794042981091_d0e45266.jpg
    drawLuminousWave(canvasId, options = {}) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width = (canvas.offsetWidth || 700) * dpr;
        const height = canvas.height = (canvas.offsetHeight || 250) * dpr;

        ctx.clearRect(0, 0, width, height);

        const paddingBottom = 30 * dpr;
        const paddingTop = 15 * dpr;
        const paddingLeft = 10 * dpr;
        const paddingRight = 10 * dpr;
        const chartW = width - paddingLeft - paddingRight;
        const chartH = height - paddingTop - paddingBottom;

        // Waveform 1: Primary High-Intensity Wave (White / Silver with Gradient Fill)
        const wave1 = options.wave1 || [30, 85, 20, 95, 45, 110, 25, 90, 35, 115, 60, 105, 30, 95, 50, 100, 40, 80, 20, 90, 35, 110, 50, 85, 30, 95, 45];
        // Waveform 2: Secondary Background Wave (Muted Grey / Silver)
        const wave2 = options.wave2 || [20, 60, 35, 75, 25, 80, 40, 65, 20, 85, 40, 70, 25, 75, 35, 70, 30, 60, 15, 70, 25, 80, 35, 65, 20, 70, 35];

        const maxVal = Math.max(...wave1, ...wave2, 120);
        const stepX = chartW / (wave1.length - 1);
        const getY = (val) => paddingTop + (chartH - (val / maxVal) * chartH);

        // Helper to draw a smooth bezier spline
        function drawSpline(points) {
            ctx.beginPath();
            ctx.moveTo(paddingLeft, getY(points[0]));
            for (let i = 1; i < points.length; i++) {
                const xPrev = paddingLeft + (i - 1) * stepX;
                const yPrev = getY(points[i - 1]);
                const xCurr = paddingLeft + i * stepX;
                const yCurr = getY(points[i]);
                const cpX = (xPrev + xCurr) / 2;
                ctx.bezierCurveTo(cpX, yPrev, cpX, yCurr, xCurr, yCurr);
            }
        }

        // Draw Wave 2 (Secondary Background Wave)
        drawSpline(wave2);
        ctx.strokeStyle = 'rgba(161, 161, 170, 0.4)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();

        // Fill Wave 2
        ctx.lineTo(paddingLeft + chartW, paddingTop + chartH);
        ctx.lineTo(paddingLeft, paddingTop + chartH);
        ctx.closePath();
        const grad2 = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartH);
        grad2.addColorStop(0, 'rgba(161, 161, 170, 0.1)');
        grad2.addColorStop(1, 'rgba(161, 161, 170, 0.0)');
        ctx.fillStyle = grad2;
        ctx.fill();

        // Draw Wave 1 (Primary High-Intensity Wave with Luminous Glow)
        drawSpline(wave1);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * dpr;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
        ctx.shadowBlur = 8 * dpr;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Fill Wave 1
        ctx.lineTo(paddingLeft + chartW, paddingTop + chartH);
        ctx.lineTo(paddingLeft, paddingTop + chartH);
        ctx.closePath();
        const grad1 = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartH);
        grad1.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        grad1.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
        grad1.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = grad1;
        ctx.fill();

        // Draw Date Labels along the X-Axis (matching screenshot)
        const dates = options.dates || ['Sep 18', 'Sep 27', 'Oct 5', 'Oct 13', 'Oct 21', 'Oct 30', 'Nov 7', 'Nov 15', 'Nov 24', 'Dec 2', 'Dec 11'];
        ctx.fillStyle = '#71717a';
        ctx.font = `${10 * dpr}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';

        const dateStep = chartW / (dates.length - 1);
        dates.forEach((d, idx) => {
            const x = paddingLeft + idx * dateStep;
            ctx.fillText(d, x, height - 8 * dpr);
        });
    },

    // 2. Project Efficiency: Partial Circular Donut Meter
    // Recreates the exact ring gauge from bottom right of media_1794042981091_d0e45266.jpg
    drawDonutMeter(canvasId, pct = 86) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(canvas.offsetWidth || 180, canvas.offsetHeight || 180);
        const width = canvas.width = size * dpr;
        const height = canvas.height = size * dpr;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = (width / 2) - 18 * dpr;
        const lineWidth = 16 * dpr;

        // Background track (Dark Charcoal Arc)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI, false);
        ctx.strokeStyle = '#1f1f23';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Active Arc (Pure Crisp White)
        const totalAngle = 1.5 * Math.PI;
        const activeEnd = 0.75 * Math.PI + (pct / 100) * totalAngle;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, activeEnd, false);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 10 * dpr;
        ctx.stroke();
        ctx.shadowBlur = 0;
    },

    // 3. Mini Sparklines & Histograms
    drawSparkline(canvasId, points = [20, 35, 28, 45, 52, 48, 60], strokeColor = '#ffffff') {
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

    drawHistogram(canvasId, values = [4, 8, 6, 12, 10, 15, 18, 14, 20, 16]) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width = (canvas.offsetWidth || 200) * dpr;
        const height = canvas.height = (canvas.offsetHeight || 40) * dpr;

        ctx.clearRect(0, 0, width, height);

        const max = Math.max(...values, 10);
        const barWidth = 4 * dpr;
        const gap = (width - (values.length * barWidth)) / Math.max(1, values.length - 1);

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < values.length; i++) {
            const h = (values[i] / max) * (height - 6 * dpr);
            const x = i * (barWidth + gap);
            const y = height - h;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, y, barWidth, h, 2 * dpr) : ctx.rect(x, y, barWidth, h);
            ctx.fill();
        }
    }
};

window.Charts = Charts;
window.IMBSCharts = Charts;
