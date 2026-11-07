/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise Barcode & QR Code Engine
 * Pure JavaScript, zero-dependency, high-resolution SVG generation
 * Supports Code 128 (1D) and QR Code Model 2 (2D) for UPI & Invoices
 * ==============================================================================
 */

(function (window) {
    'use strict';

    // --------------------------------------------------------------------------
    // CODE 128 (SET B) PATTERN LOOKUP
    // --------------------------------------------------------------------------
    const CODE128_PATTERNS = [
        '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
        '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
        '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
        '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
        '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
        '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
        '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
        '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
        '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
        '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
        '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
    ];

    function generateCode128Svg(text, opts) {
        opts = opts || {};
        const width = opts.width || 240;
        const height = opts.height || 54;
        const showText = opts.showText !== false;
        const barcodeHeight = showText ? Math.max(20, height - 16) : height;
        const color = opts.color || '#000000';
        const bgColor = opts.bgColor || '#ffffff';

        const START_B = 104;
        const STOP = 106;
        const codes = [START_B];
        let checksum = START_B;

        const sanitized = String(text || '').trim();
        for (let i = 0; i < sanitized.length; i++) {
            const code = sanitized.charCodeAt(i) - 32;
            const validCode = (code >= 0 && code <= 95) ? code : 0;
            codes.push(validCode);
            checksum += validCode * (i + 1);
        }
        codes.push(checksum % 103);
        codes.push(STOP);

        let patternStr = '';
        for (let i = 0; i < codes.length; i++) {
            patternStr += CODE128_PATTERNS[codes[i]] || '212222';
        }

        let totalModules = 0;
        for (let i = 0; i < patternStr.length; i++) {
            totalModules += parseInt(patternStr[i], 10);
        }

        const moduleWidth = width / totalModules;
        let x = 0;
        let rects = '';
        for (let i = 0; i < patternStr.length; i++) {
            const w = parseInt(patternStr[i], 10) * moduleWidth;
            if (i % 2 === 0) {
                rects += `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${barcodeHeight}" fill="${color}"/>`;
            }
            x += w;
        }

        const textSvg = showText 
            ? `<text x="${(width / 2).toFixed(2)}" y="${height - 2}" font-family="monospace, monospace" font-size="10.5" font-weight="700" text-anchor="middle" fill="${color}">${sanitized}</text>` 
            : '';

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="display:block;margin:0 auto;background:${bgColor};">${rects}${textSvg}</svg>`;
    }

    // --------------------------------------------------------------------------
    // REED-SOLOMON & GALOIS FIELD GF(256) QR ENGINE
    // --------------------------------------------------------------------------
    const GF256_EXP = new Uint8Array(512);
    const GF256_LOG = new Uint8Array(256);
    (function initGF() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            GF256_EXP[i] = x;
            GF256_LOG[x] = i;
            x <<= 1;
            if (x & 256) x ^= 0x11d;
        }
        for (let i = 255; i < 512; i++) {
            GF256_EXP[i] = GF256_EXP[i - 255];
        }
    })();

    function gfMul(x, y) {
        if (x === 0 || y === 0) return 0;
        return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
    }

    function rsGeneratorPoly(degree) {
        let poly = [1];
        for (let i = 0; i < degree; i++) {
            const root = GF256_EXP[i];
            const next = new Array(poly.length + 1).fill(0);
            for (let j = 0; j < poly.length; j++) {
                next[j] ^= gfMul(poly[j], root);
                next[j + 1] ^= poly[j];
            }
            poly = next;
        }
        return poly;
    }

    function rsCompute(data, degree) {
        const gen = rsGeneratorPoly(degree);
        const res = new Uint8Array(degree);
        for (let i = 0; i < data.length; i++) {
            const factor = data[i] ^ res[0];
            for (let j = 0; j < degree - 1; j++) {
                res[j] = res[j + 1] ^ gfMul(gen[j + 1], factor);
            }
            res[degree - 1] = gfMul(gen[degree], factor);
        }
        return res;
    }

    const QR_VERSIONS = [
        null,
        { ver: 1, size: 21, dataCW: 16, ecCW: 10, align: [] },
        { ver: 2, size: 25, dataCW: 28, ecCW: 16, align: [6, 18] },
        { ver: 3, size: 29, dataCW: 44, ecCW: 26, align: [6, 22] },
        { ver: 4, size: 33, dataCW: 64, ecCW: 36, align: [6, 26] },
        { ver: 5, size: 37, dataCW: 86, ecCW: 48, align: [6, 30] },
        { ver: 6, size: 41, dataCW: 108, ecCW: 64, align: [6, 34] }
    ];

    function generateQrSvg(text, opts) {
        opts = opts || {};
        const size = opts.size || 130;
        const color = opts.color || '#000000';
        const bgColor = opts.bgColor || '#ffffff';
        const str = String(text || '').trim();

        // 1. High-Performance Standard QR Engine (QRCodeBundle from vendor_qrcode.js)
        if (typeof window !== 'undefined' && window.QRCodeBundle && typeof window.QRCodeBundle.create === 'function') {
            try {
                const qrData = window.QRCodeBundle.create(str, { errorCorrectionLevel: opts.ecLevel || 'M' });
                const numModules = qrData.modules.size;
                const margin = typeof opts.margin === 'number' ? opts.margin : 1;
                const totalDim = numModules + margin * 2;
                const scale = size / totalDim;

                let rects = '';
                for (let r = 0; r < numModules; r++) {
                    for (let c = 0; c < numModules; c++) {
                        if (qrData.modules.get(r, c) === 1) {
                            const x = ((c + margin) * scale).toFixed(2);
                            const y = ((r + margin) * scale).toFixed(2);
                            const w = (scale * 1.02).toFixed(2);
                            rects += '<rect x=\"' + x + '\" y=\"' + y + '\" width=\"' + w + '\" height=\"' + w + '\" fill=\"' + color + '\"/>';
                        }
                    }
                }
                return '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ' + size + ' ' + size + '\" width=\"' + size + '\" height=\"' + size + '\" shape-rendering=\"crispEdges\" style=\"display:block;margin:0 auto;background:' + bgColor + ';\"><rect width=\"' + size + '\" height=\"' + size + '\" fill=\"' + bgColor + '\"/>' + rects + '</svg>';
            } catch (bundleErr) {
                console.warn('[QRCodeBundle fallback]', bundleErr);
            }
        }

        // 2. Built-in Pure JS Fallback Engine
        const utf8Bytes = [];
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            if (code < 128) utf8Bytes.push(code);
            else if (code < 2048) {
                utf8Bytes.push((code >> 6) | 192);
                utf8Bytes.push((code & 63) | 128);
            } else {
                utf8Bytes.push((code >> 12) | 224);
                utf8Bytes.push(((code >> 6) & 63) | 128);
                utf8Bytes.push((code & 63) | 128);
            }
        }

        let chosen = null;
        for (let v = 1; v < QR_VERSIONS.length; v++) {
            const spec = QR_VERSIONS[v];
            if (utf8Bytes.length + 3 <= spec.dataCW) {
                chosen = spec;
                break;
            }
        }
        if (!chosen) chosen = QR_VERSIONS[6];

        const bits = [];
        function pushBits(val, len) {
            for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
        }

        pushBits(4, 4); // Byte mode
        pushBits(utf8Bytes.length, 8); // Count indicator
        for (let i = 0; i < utf8Bytes.length; i++) pushBits(utf8Bytes[i], 8);

        const capacityBits = chosen.dataCW * 8;
        for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0);
        while (bits.length % 8 !== 0) bits.push(0);

        const dataBytes = new Uint8Array(chosen.dataCW);
        let byteIdx = 0;
        for (let i = 0; i < bits.length; i += 8) {
            let byteVal = 0;
            for (let j = 0; j < 8; j++) byteVal = (byteVal << 1) | bits[i + j];
            dataBytes[byteIdx++] = byteVal;
        }

        const pad = [0xEC, 0x11];
        let pIdx = 0;
        while (byteIdx < chosen.dataCW) {
            dataBytes[byteIdx++] = pad[pIdx % 2];
            pIdx++;
        }

        const ecBytes = rsCompute(dataBytes, chosen.ecCW);
        const allCW = new Uint8Array(chosen.dataCW + chosen.ecCW);
        allCW.set(dataBytes, 0);
        allCW.set(ecBytes, chosen.dataCW);

        const dim = chosen.size;
        const matrix = Array.from({ length: dim }, () => new Array(dim).fill(null));
        const isReserved = Array.from({ length: dim }, () => new Array(dim).fill(false));

        function setModule(r, c, val, reserved) {
            if (r >= 0 && r < dim && c >= 0 && c < dim) {
                matrix[r][c] = val;
                if (reserved !== false) isReserved[r][c] = true;
            }
        }

        function placeFinder(top, left) {
            for (let r = -1; r <= 7; r++) {
                for (let c = -1; c <= 7; c++) {
                    const mr = top + r;
                    const mc = left + c;
                    if (mr < 0 || mr >= dim || mc < 0 || mc >= dim) continue;
                    if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
                        const isDark = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
                        setModule(mr, mc, isDark ? 1 : 0);
                    } else {
                        setModule(mr, mc, 0);
                    }
                }
            }
        }
        placeFinder(0, 0);
        placeFinder(0, dim - 7);
        placeFinder(dim - 7, 0);

        if (chosen.align.length > 0) {
            const coords = chosen.align;
            for (let i = 0; i < coords.length; i++) {
                for (let j = 0; j < coords.length; j++) {
                    const ar = coords[i];
                    const ac = coords[j];
                    if (isReserved[ar][ac]) continue;
                    for (let r = -2; r <= 2; r++) {
                        for (let c = -2; c <= 2; c++) {
                            const isDark = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
                            setModule(ar + r, ac + c, isDark ? 1 : 0);
                        }
                    }
                }
            }
        }

        for (let i = 8; i < dim - 8; i++) {
            if (!isReserved[6][i]) setModule(6, i, i % 2 === 0 ? 1 : 0);
            if (!isReserved[i][6]) setModule(i, 6, i % 2 === 0 ? 1 : 0);
        }

        setModule(dim - 8, 8, 1);

        for (let i = 0; i < 9; i++) {
            if (!isReserved[8][i]) setModule(8, i, 0);
            if (!isReserved[i][8]) setModule(i, 8, 0);
        }
        for (let i = dim - 8; i < dim; i++) {
            if (!isReserved[8][i]) setModule(8, i, 0);
            if (!isReserved[i][8]) setModule(i, 8, 0);
        }

        let bitPointer = 0;
        const allBits = [];
        for (let i = 0; i < allCW.length; i++) {
            for (let j = 7; j >= 0; j--) allBits.push((allCW[i] >> j) & 1);
        }

        let upwards = true;
        for (let col = dim - 1; col > 0; col -= 2) {
            if (col === 6) col--;
            for (let rowStep = 0; rowStep < dim; rowStep++) {
                const r = upwards ? (dim - 1 - rowStep) : rowStep;
                for (let c = col; c >= col - 1; c--) {
                    if (!isReserved[r][c]) {
                        const dataBit = bitPointer < allBits.length ? allBits[bitPointer++] : 0;
                        const mask = (r + c) % 2 === 0;
                        matrix[r][c] = dataBit ^ (mask ? 1 : 0);
                    }
                }
            }
            upwards = !upwards;
        }

        const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
        const fmtCoords1 = [
            [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
            [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
        ];
        for (let i = 0; i < 15; i++) matrix[fmtCoords1[i][0]][fmtCoords1[i][1]] = formatBits[i];
        const fmtCoords2 = [
            [dim - 1, 8], [dim - 2, 8], [dim - 3, 8], [dim - 4, 8], [dim - 5, 8], [dim - 6, 8], [dim - 7, 8],
            [8, dim - 8], [8, dim - 7], [8, dim - 6], [8, dim - 5], [8, dim - 4], [8, dim - 3], [8, dim - 2], [8, dim - 1]
        ];
        for (let i = 0; i < 15; i++) matrix[fmtCoords2[i][0]][fmtCoords2[i][1]] = formatBits[i];

        const cellSize = size / dim;
        let rects = '';
        for (let r = 0; r < dim; r++) {
            for (let c = 0; c < dim; c++) {
                if (matrix[r][c] === 1) {
                    rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${color}"/>`;
                }
            }
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block;margin:0 auto;background:${bgColor};padding:4px;box-sizing:content-box;">${rects}</svg>`;
    }

    // --------------------------------------------------------------------------
    // UTILITY METHODS
    // --------------------------------------------------------------------------
    function getUpiPaymentUrl(store, invoice) {
        const upiId = (store && store.upi_id) ? store.upi_id.trim() : 'sse.retail@icici';
        const storeName = encodeURIComponent((store && store.shop_name) || 'SSE Retail');
        const amount = invoice ? ((invoice.grand_total_cents || 0) / 100).toFixed(2) : '0.00';
        const invNo = encodeURIComponent(invoice ? (invoice.invoice_number || 'POS') : 'POS');
        return `upi://pay?pa=${upiId}&pn=${storeName}&am=${amount}&cu=INR&tn=${invNo}`;
    }

    function generateBarcodeLabelHtml(product, store) {
        const sku = product.sku || 'SKU';
        const barcodeVal = product.barcode || sku;
        const name = product.name || 'Product';
        const price = ((product.selling_price_cents || product.selling_price || 0) / 100).toFixed(2);
        const shop = (store && store.shop_name) || 'SSE RETAIL HUB';

        const barcodeSvg = generateCode128Svg(barcodeVal, { width: 170, height: 38, showText: true });

        return `
            <div class="pos-barcode-label-sticker" style="width: 200px; padding: 8px; border: 1px dashed #3f3f46; background: #ffffff; color: #000000; font-family: sans-serif; text-align: center; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
                <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #333; margin-bottom: 2px;">${shop}</div>
                <div style="font-size: 11px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
                <div style="margin: 4px auto;">${barcodeSvg}</div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; padding-top: 3px; border-top: 1px solid #ddd;">
                    <span style="font-size: 9px; color: #666; font-family: monospace;">HSN: ${product.hsn_code || '8471'}</span>
                    <span style="font-size: 13px; font-weight: 800; color: #000;">MRP: ₹${price}</span>
                </div>
            </div>
        `;
    }

    function renderBarcodeToElement(element, text, opts) {
        if (typeof window !== 'undefined' && window.JsBarcode && element) {
            try {
                window.JsBarcode(element, String(text || '').trim(), {
                    format: 'CODE128',
                    width: (opts && opts.width) ? Math.max(1, Math.round(opts.width / 120)) : 1.5,
                    height: (opts && opts.height) || 40,
                    displayValue: opts ? opts.showText !== false : true,
                    fontSize: 12,
                    margin: 0
                });
                return true;
            } catch (e) {
                console.warn('[JsBarcode error]', e);
            }
        }
        return false;
    }

    window.BarcodeQR = {
        code128: generateCode128Svg,
        qr: generateQrSvg,
        getUpiUrl: getUpiPaymentUrl,
        generateBarcodeLabel: generateBarcodeLabelHtml,
        renderToElement: renderBarcodeToElement
    };

})(typeof window !== 'undefined' ? window : this);

