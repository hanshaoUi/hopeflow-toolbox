/**
 * 智能排料优化 - MAXRECTS 增强版
 * 功能：多策略排序、多角度旋转、局部优化
 */

// @include "../_runtime/utils.jsx"

// JSON polyfill
if (typeof JSON === 'undefined') {
    JSON = {
        stringify: function (obj) {
            if (obj === null) return 'null';
            if (obj === undefined) return 'undefined';
            if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
            if (typeof obj === 'string') return '"' + obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
            if (obj instanceof Array) {
                var arr = [];
                for (var i = 0; i < obj.length; i++) arr.push(JSON.stringify(obj[i]));
                return '[' + arr.join(',') + ']';
            }
            if (typeof obj === 'object') {
                var pairs = [];
                for (var k in obj) {
                    if (obj.hasOwnProperty(k)) pairs.push('"' + k + '":' + JSON.stringify(obj[k]));
                }
                return '{' + pairs.join(',') + '}';
            }
            return String(obj);
        },
        parse: function (str) { return eval('(' + str + ')'); }
    };
}

// ========== MAXRECTS 核心函数（声明在 try/catch 外，确保 ExtendScript 可提升） ==========

function nestingCreateSheet(w, h) {
    return { freeRects: [{ x: 0, y: 0, width: w, height: h }] };
}

function nestingGetRotatedSize(w, h, angle) {
    var rad = angle * Math.PI / 180;
    var cos = Math.abs(Math.cos(rad));
    var sin = Math.abs(Math.sin(rad));
    return {
        width: w * cos + h * sin,
        height: w * sin + h * cos
    };
}

function nestingFindBestRect(freeRects, w, h) {
    var bestRect = null;
    var bestScore = Infinity;

    for (var i = 0; i < freeRects.length; i++) {
        var rect = freeRects[i];
        if (rect.width >= w - 0.01 && rect.height >= h - 0.01) {
            var leftoverH = rect.height - h;
            var leftoverW = rect.width - w;
            var shortSide = Math.min(leftoverH, leftoverW);
            var score = rect.y * 1000000 + rect.x * 1000 + shortSide;

            if (score < bestScore) {
                bestScore = score;
                bestRect = rect;
            }
        }
    }

    return bestRect ? { rect: bestRect, score: bestScore } : null;
}

function nestingIsContained(a, b) {
    return a.x >= b.x - 0.01 && a.y >= b.y - 0.01 &&
        a.x + a.width <= b.x + b.width + 0.01 &&
        a.y + a.height <= b.y + b.height + 0.01;
}

function nestingPruneFreeRects(freeRects) {
    for (var i = freeRects.length - 1; i >= 0; i--) {
        for (var j = freeRects.length - 1; j >= 0; j--) {
            if (i !== j && i < freeRects.length && j < freeRects.length) {
                if (nestingIsContained(freeRects[i], freeRects[j])) {
                    freeRects.splice(i, 1);
                    break;
                }
            }
        }
    }
}

function nestingSplitFreeRects(sheet, x, y, w, h) {
    var freeRects = sheet.freeRects;
    var newRects = [];

    for (var i = freeRects.length - 1; i >= 0; i--) {
        var rect = freeRects[i];

        if (x >= rect.x + rect.width || x + w <= rect.x ||
            y >= rect.y + rect.height || y + h <= rect.y) {
            continue;
        }

        freeRects.splice(i, 1);

        if (x > rect.x) {
            newRects.push({ x: rect.x, y: rect.y, width: x - rect.x, height: rect.height });
        }
        if (x + w < rect.x + rect.width) {
            newRects.push({ x: x + w, y: rect.y, width: rect.x + rect.width - x - w, height: rect.height });
        }
        if (y > rect.y) {
            newRects.push({ x: rect.x, y: rect.y, width: rect.width, height: y - rect.y });
        }
        if (y + h < rect.y + rect.height) {
            newRects.push({ x: rect.x, y: y + h, width: rect.width, height: rect.y + rect.height - y - h });
        }
    }

    for (var j = 0; j < newRects.length; j++) {
        if (newRects[j].width > 1 && newRects[j].height > 1) {
            freeRects.push(newRects[j]);
        }
    }

    nestingPruneFreeRects(freeRects);
}

function runMaxRects(parts, sheetW, sheetH, spacing, angles) {
    var placements = [];
    var sheets = [nestingCreateSheet(sheetW, sheetH)];
    var totalArea = 0;

    for (var pi = 0; pi < parts.length; pi++) {
        var part = parts[pi];
        totalArea += part.area;

        var bestSheet = -1;
        var bestRect = null;
        var bestRotation = 0;
        var bestScore = Infinity;

        for (var si = 0; si < sheets.length; si++) {
            var sheet = sheets[si];

            for (var ai = 0; ai < angles.length; ai++) {
                var angle = angles[ai];
                var rotSize = nestingGetRotatedSize(part.width, part.height, angle);
                var tw = rotSize.width + spacing;
                var th = rotSize.height + spacing;

                if (tw > sheetW + 0.01 || th > sheetH + 0.01) continue;

                var result = nestingFindBestRect(sheet.freeRects, tw, th);
                if (result) {
                    var score = si * 100000000 + result.score;
                    if (score < bestScore) {
                        bestScore = score;
                        bestSheet = si;
                        bestRect = result.rect;
                        bestRotation = angle;
                    }
                }
            }
        }

        if (bestSheet < 0) {
            bestSheet = sheets.length;
            sheets.push(nestingCreateSheet(sheetW, sheetH));

            for (var ai2 = 0; ai2 < angles.length; ai2++) {
                var angle2 = angles[ai2];
                var rotSize2 = nestingGetRotatedSize(part.width, part.height, angle2);
                var tw2 = rotSize2.width + spacing;
                var th2 = rotSize2.height + spacing;

                if (tw2 <= sheetW && th2 <= sheetH) {
                    bestRect = sheets[bestSheet].freeRects[0];
                    bestRotation = angle2;
                    break;
                }
            }
        }

        if (bestRect) {
            var actualSize = nestingGetRotatedSize(part.width, part.height, bestRotation);
            var actualW = actualSize.width + spacing;
            var actualH = actualSize.height + spacing;

            placements.push({
                part: part,
                x: bestRect.x,
                y: bestRect.y,
                rotation: bestRotation,
                sheetIndex: bestSheet
            });

            nestingSplitFreeRects(sheets[bestSheet], bestRect.x, bestRect.y, actualW, actualH);
        }
    }

    var sheetCount = sheets.length;
    var utilization = totalArea / (sheetCount * sheetW * sheetH);

    return { placements: placements, sheetCount: sheetCount, utilization: utilization };
}

function nestingCreateReport(doc, itemCount, sheetCount, info, startX, startY, sheetWidth, sheetGap) {
    var layer = doc.layers.add();
    layer.name = '\u6392\u6599\u62a5\u544a';

    var reportX = startX + sheetCount * (sheetWidth + sheetGap);
    var text = layer.textFrames.add();
    text.position = [reportX, startY];

    var lines = [
        '===============================',
        '      MAXRECTS \u667a\u80fd\u6392\u6599\u62a5\u544a',
        '===============================',
        '',
        '\u3010\u677f\u6750\u4fe1\u606f\u3011',
        '  \u5c3a\u5bf8: ' + info.sheetWidth + ' \xd7 ' + info.sheetHeight + ' mm',
        '  \u8fb9\u8ddd: ' + info.margin + ' mm',
        '  \u95f4\u8ddd: ' + info.spacing + ' mm',
        '  \u6570\u91cf: ' + sheetCount + ' \u5757',
        '',
        '\u3010\u6392\u6599\u7edf\u8ba1\u3011',
        '  \u96f6\u4ef6\u6570\u91cf: ' + itemCount + ' \u4e2a',
        '  \u6750\u6599\u5229\u7528\u7387: ' + info.utilization + '%',
        '  \u65cb\u8f6c\u96f6\u4ef6: ' + info.rotatedCount + ' \u4e2a',
        ''
    ];

    if (info.oversizedItems.length > 0) {
        lines.push('\u3010\u8df3\u8fc7\u7684\u8d85\u5c3a\u5bf8\u96f6\u4ef6\u3011');
        for (var i = 0; i < info.oversizedItems.length; i++) {
            var oi = info.oversizedItems[i];
            lines.push('  ' + oi.name + ': ' + oi.width + '\xd7' + oi.height + 'mm');
        }
        lines.push('');
    }

    lines.push('===============================');
    lines.push('  ' + new Date().toLocaleString());
    lines.push('===============================');

    text.contents = lines.join('\n');
    try { text.textRange.characterAttributes.size = 11; } catch (e) { }
}

// ========== 主逻辑 ==========

var __nestingResult__ = (function () {
    try {
        var args = typeof __ARGS__ !== 'undefined' ? __ARGS__ : {};

        var preset = args.preset || 'custom';
        var presets = {
            '1220x2440': { width: 1220, height: 2440 },
            '1000x2000': { width: 1000, height: 2000 },
            '1524x3048': { width: 1524, height: 3048 },
            '915x1830': { width: 915, height: 1830 }
        };

        var sheetWidthMM, sheetHeightMM;
        if (preset !== 'custom' && presets[preset]) {
            sheetWidthMM = presets[preset].width;
            sheetHeightMM = presets[preset].height;
        } else {
            sheetWidthMM = args.sheetWidth || 1220;
            sheetHeightMM = args.sheetHeight || 2440;
        }

        var spacingMM = args.spacing || 5;
        var marginMM = args.margin || 10;
        var allowRotation = args.allowRotation !== false;
        var generateReport = args.generateReport === true;

        var MM_TO_PT = 2.834645669291339;
        var sheetWidth = sheetWidthMM * MM_TO_PT;
        var sheetHeight = sheetHeightMM * MM_TO_PT;
        var spacing = spacingMM * MM_TO_PT;
        var margin = marginMM * MM_TO_PT;

        var usableWidth = sheetWidth - 2 * margin;
        var usableHeight = sheetHeight - 2 * margin;

        var doc = app.activeDocument;
        var selection = doc.selection;

        if (!selection || selection.length < 2) {
            return JSON.stringify({ success: false, error: '\u8bf7\u81f3\u5c11\u9009\u62e92\u4e2a\u5bf9\u8c61\u8fdb\u884c\u6392\u6599' });
        }

        // 提取零件
        var parts = [];
        var oversizedItems = [];

        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            var b = item.geometricBounds;
            var w = Math.abs(b[2] - b[0]);
            var h = Math.abs(b[1] - b[3]);

            var canFit = (w <= usableWidth && h <= usableHeight) ||
                (allowRotation && h <= usableWidth && w <= usableHeight);

            if (!canFit) {
                oversizedItems.push({
                    index: i + 1,
                    name: item.name || ('\u5bf9\u8c61' + (i + 1)),
                    width: (w / MM_TO_PT).toFixed(1),
                    height: (h / MM_TO_PT).toFixed(1)
                });
                continue;
            }

            parts.push({
                index: i,
                item: item,
                width: w,
                height: h,
                area: w * h,
                perimeter: 2 * (w + h),
                maxSide: Math.max(w, h),
                minSide: Math.min(w, h)
            });
        }

        if (parts.length === 0) {
            return JSON.stringify({ success: false, error: '\u6ca1\u6709\u53ef\u6392\u5217\u7684\u5bf9\u8c61' });
        }

        // 多策略排料
        var strategies = [
            function (a, b) { return b.area - a.area; },
            function (a, b) { return b.maxSide - a.maxSide; },
            function (a, b) { return b.height - a.height; },
            function (a, b) { return b.width - a.width; },
            function (a, b) { return b.perimeter - a.perimeter; }
        ];

        var bestResult = null;
        var bestSheetCount = Infinity;
        var bestUtilization = 0;

        var angles = allowRotation ? [0, 90] : [0];

        for (var si = 0; si < strategies.length; si++) {
            var sortedParts = parts.slice();
            sortedParts.sort(strategies[si]);

            var result = runMaxRects(sortedParts, usableWidth, usableHeight, spacing, angles);

            var isBetter = false;
            if (result.sheetCount < bestSheetCount) {
                isBetter = true;
            } else if (result.sheetCount === bestSheetCount && result.utilization > bestUtilization) {
                isBetter = true;
            }

            if (isBetter) {
                bestResult = result;
                bestSheetCount = result.sheetCount;
                bestUtilization = result.utilization;
            }
        }

        if (!bestResult || bestResult.placements.length === 0) {
            return JSON.stringify({ success: false, error: '\u6392\u6599\u5931\u8d25' });
        }

        // 应用结果
        var placements = bestResult.placements;
        var sheetGap = 30 * MM_TO_PT;
        var sheetCount = bestResult.sheetCount;
        var oldArtboardCount = doc.artboards.length;

        var CANVAS_HALF_PT = 2850 * MM_TO_PT;
        var canvasMargin = 200 * MM_TO_PT;
        var startX = -CANVAS_HALF_PT + canvasMargin;
        var startY = CANVAS_HALF_PT - canvasMargin;

        var MAX_CANVAS_PT = CANVAS_HALF_PT * 2;
        var maxCols = Math.max(1, Math.floor(MAX_CANVAS_PT / (sheetWidth + sheetGap)));
        var maxRows = Math.max(1, Math.floor(MAX_CANVAS_PT / (sheetHeight + sheetGap)));
        var maxSheets = maxCols * maxRows;
        if (sheetCount > maxSheets) sheetCount = maxSheets;

        var createdSheets = 0;
        var canvasLimit = CANVAS_HALF_PT - canvasMargin;

        for (var s = 0; s < sheetCount; s++) {
            var col = s % maxCols;
            var row = Math.floor(s / maxCols);
            var abLeft = startX + col * (sheetWidth + sheetGap);
            var abTop = startY - row * (sheetHeight + sheetGap);
            var abRight = abLeft + sheetWidth;
            var abBottom = abTop - sheetHeight;

            if (abRight > canvasLimit || abBottom < -canvasLimit) {
                break;
            }

            try {
                var newAb = doc.artboards.add([abLeft, abTop, abRight, abBottom]);
                newAb.name = '\u6392\u6599-\u677f\u6750' + (s + 1);
                createdSheets++;
            } catch (abErr) {
                break;
            }
        }

        sheetCount = createdSheets > 0 ? createdSheets : 1;

        // 移动对象
        var rotatedCount = 0;
        for (var mi = 0; mi < placements.length; mi++) {
            var p = placements[mi];
            var part = p.part;
            if (!part || !part.item) continue;
            var pItem = part.item;

            try {
                if (pItem.locked) pItem.locked = false;
                if (pItem.hidden) pItem.hidden = false;

                var pSheetIndex = p.sheetIndex;
                if (pSheetIndex >= sheetCount) pSheetIndex = sheetCount - 1;
                if (pSheetIndex < 0) pSheetIndex = 0;

                var pCol = pSheetIndex % maxCols;
                var pRow = Math.floor(pSheetIndex / maxCols);
                var sheetLeft = startX + pCol * (sheetWidth + sheetGap);
                var sheetTop = startY - pRow * (sheetHeight + sheetGap);

                if (p.rotation !== 0) {
                    pItem.rotate(p.rotation);
                    rotatedCount++;
                }

                var itemBounds = pItem.geometricBounds;
                var targetX = sheetLeft + margin + p.x;
                var targetY = sheetTop - margin - p.y;
                pItem.translate(targetX - itemBounds[0], targetY - itemBounds[1]);
            } catch (e) { }
        }

        // 删除旧画板
        for (var delIdx = oldArtboardCount - 1; delIdx >= 0; delIdx--) {
            try { doc.artboards.remove(delIdx); } catch (e) { }
        }

        // 统计
        var totalArea = 0;
        for (var ti = 0; ti < parts.length; ti++) totalArea += parts[ti].area;
        var utilization = (totalArea / (sheetCount * usableWidth * usableHeight) * 100).toFixed(1);

        if (generateReport) {
            nestingCreateReport(doc, placements.length, sheetCount, {
                sheetWidth: sheetWidthMM, sheetHeight: sheetHeightMM,
                spacing: spacingMM, margin: marginMM,
                utilization: utilization, rotatedCount: rotatedCount,
                oversizedItems: oversizedItems
            }, startX, startY, sheetWidth, sheetGap);
        }

        return JSON.stringify({
            success: true,
            data: {
                itemCount: placements.length,
                sheetCount: sheetCount,
                utilization: utilization + '%',
                rotatedCount: rotatedCount,
                skipped: oversizedItems.length
            }
        });

    } catch (mainError) {
        return JSON.stringify({ success: false, error: mainError.message || String(mainError) });
    }
})();

if (typeof $.hopeflow !== 'undefined') {
    $.hopeflow._lastResult = __nestingResult__;
}
