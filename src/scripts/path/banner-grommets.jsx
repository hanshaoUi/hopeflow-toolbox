/**
 * Banner Grommets
 * Adds circles along selection bounds or artboard edges.
 */
(function () {
    if (!$.hopeflow) return;

    function numberArg(value, fallback) {
        var n = parseFloat(value);
        return isNaN(n) ? fallback : n;
    }

    function intArg(value, fallback) {
        var n = parseInt(value, 10);
        return isNaN(n) ? fallback : Math.max(0, n);
    }

    function boolArg(value) {
        return value === true || value === 'true';
    }

    function clampPercent(value, fallback) {
        var n = numberArg(value, fallback);
        if (n < 0) return 0;
        if (n > 100) return 100;
        return n;
    }

    function getSelectionBounds(selection) {
        var left = Infinity;
        var top = -Infinity;
        var right = -Infinity;
        var bottom = Infinity;

        for (var i = 0; i < selection.length; i++) {
            var b = selection[i].visibleBounds;
            if (b[0] < left) left = b[0];
            if (b[1] > top) top = b[1];
            if (b[2] > right) right = b[2];
            if (b[3] < bottom) bottom = b[3];
        }

        return makeBounds(left, top, right, bottom);
    }

    function getArtboardBounds(doc, index) {
        var rect = doc.artboards[index].artboardRect;
        return makeBounds(rect[0], rect[1], rect[2], rect[3]);
    }

    function makeBounds(left, top, right, bottom) {
        return {
            left: left,
            top: top,
            right: right,
            bottom: bottom,
            width: right - left,
            height: top - bottom
        };
    }

    function getOrCreateLayer(doc, name) {
        try {
            return doc.layers.getByName(name);
        } catch (e) {
            var layer = doc.layers.add();
            layer.name = name;
            return layer;
        }
    }

    function cmykColor(c, m, y, k) {
        var color = new CMYKColor();
        color.cyan = c;
        color.magenta = m;
        color.yellow = y;
        color.black = k;
        return color;
    }

    function getColor(args) {
        if (args.colorPreset === 'white') return cmykColor(0, 0, 0, 0);
        if (args.colorPreset === 'customCmyk') {
            return cmykColor(
                clampPercent(args.cyan, 0),
                clampPercent(args.magenta, 0),
                clampPercent(args.yellow, 0),
                clampPercent(args.black, 100)
            );
        }
        return cmykColor(0, 0, 0, 100);
    }

    function getCountsForBounds(bounds, args) {
        if (args.countMode === 'spacing') {
            var spacingPt = Math.max(1, numberArg(args.spacing, 500)) * args.mmToPt;
            return {
                top: Math.max(2, Math.floor(bounds.width / spacingPt) + 1),
                right: Math.max(2, Math.floor(bounds.height / spacingPt) + 1),
                bottom: Math.max(2, Math.floor(bounds.width / spacingPt) + 1),
                left: Math.max(2, Math.floor(bounds.height / spacingPt) + 1)
            };
        }

        var preset = args.countPreset || 'custom';
        var common = intArg(args.commonCount, 5);
        var horizontal = intArg(args.horizontalCount, 5);
        var vertical = intArg(args.verticalCount, 4);

        if (preset === 'allSame') {
            return { top: common, right: common, bottom: common, left: common };
        }

        if (preset === 'horizontalVertical') {
            return { top: horizontal, right: vertical, bottom: horizontal, left: vertical };
        }

        if (preset === 'topBottomOnly') {
            return { top: horizontal, right: 0, bottom: horizontal, left: 0 };
        }

        if (preset === 'leftRightOnly') {
            return { top: 0, right: vertical, bottom: 0, left: vertical };
        }

        return {
            top: intArg(args.topCount, 5),
            right: intArg(args.rightCount, 4),
            bottom: intArg(args.bottomCount, 5),
            left: intArg(args.leftCount, 4)
        };
    }

    function addEdgePoints(points, bounds, edge, count) {
        if (count <= 0) return;

        for (var i = 0; i < count; i++) {
            var t = count === 1 ? 0.5 : i / (count - 1);
            var x;
            var y;

            if (edge === 'top') {
                x = bounds.left + bounds.width * t;
                y = bounds.top;
            } else if (edge === 'right') {
                x = bounds.right;
                y = bounds.top - bounds.height * t;
            } else if (edge === 'bottom') {
                x = bounds.left + bounds.width * t;
                y = bounds.bottom;
            } else {
                x = bounds.left;
                y = bounds.top - bounds.height * t;
            }

            points.push({ x: x, y: y });
        }
    }

    function keyForPoint(point) {
        return Math.round(point.x * 1000) + ',' + Math.round(point.y * 1000);
    }

    function makePlacementBounds(bounds, centerDistance, position) {
        if (position === 'inside') {
            if (centerDistance * 2 > bounds.width || centerDistance * 2 > bounds.height) {
                return null;
            }
            return makeBounds(
                bounds.left + centerDistance,
                bounds.top - centerDistance,
                bounds.right - centerDistance,
                bounds.bottom + centerDistance
            );
        }

        return makeBounds(
            bounds.left - centerDistance,
            bounds.top + centerDistance,
            bounds.right + centerDistance,
            bounds.bottom - centerDistance
        );
    }

    function createCircles(layer, bounds, args) {
        var placementBounds = makePlacementBounds(bounds, args.centerDistance, args.position);
        if (!placementBounds) return { created: 0, skipped: true };

        var counts = getCountsForBounds(placementBounds, args);
        if (counts.top + counts.right + counts.bottom + counts.left <= 0) {
            return { created: 0, skipped: true };
        }

        var rawPoints = [];
        addEdgePoints(rawPoints, placementBounds, 'top', counts.top);
        addEdgePoints(rawPoints, placementBounds, 'right', counts.right);
        addEdgePoints(rawPoints, placementBounds, 'bottom', counts.bottom);
        addEdgePoints(rawPoints, placementBounds, 'left', counts.left);

        var seen = {};
        var created = 0;

        for (var i = 0; i < rawPoints.length; i++) {
            var point = rawPoints[i];
            var key = keyForPoint(point);
            if (seen[key]) continue;
            seen[key] = true;

            var circle = layer.pathItems.ellipse(
                point.y + args.radius,
                point.x - args.radius,
                args.diameter,
                args.diameter
            );

            circle.filled = args.appearance !== 'stroke';
            circle.stroked = args.appearance !== 'fill';
            if (circle.filled) circle.fillColor = args.color;
            if (circle.stroked) {
                circle.strokeColor = args.color;
                circle.strokeWidth = args.strokeWidth;
            }
            created++;
        }

        return { created: created, skipped: false };
    }

    var rawArgs = $.hopeflow.utils.getArgs();

    if (boolArg(rawArgs.shouldUndo)) {
        try { app.undo(); } catch (e) {}
    }

    if (boolArg(rawArgs.clearOnly)) {
        return $.hopeflow.utils.returnResult({
            message: '已清理预览',
            count: 0
        });
    }

    if (app.documents.length === 0) {
        return $.hopeflow.utils.returnError('没有打开的文档');
    }

    var mmToPt = 2.83464567;
    var diameterMM = numberArg(rawArgs.diameter, 8);
    if (diameterMM <= 0) {
        return $.hopeflow.utils.returnError('圆直径必须大于 0');
    }

    var doc = app.activeDocument;
    var target = rawArgs.target || 'selectionOrActiveArtboard';
    var layerName = rawArgs.layerName || '喷绘打扣';
    if (boolArg(rawArgs.preview)) layerName = layerName + ' 预览';

    var layer = getOrCreateLayer(doc, layerName);
    try { layer.locked = false; } catch (e1) {}
    try { layer.visible = true; } catch (e2) {}

    var diameter = diameterMM * mmToPt;
    var radius = diameter / 2;
    var margin = Math.max(0, numberArg(rawArgs.margin, 0)) * mmToPt;
    var args = {
        mmToPt: mmToPt,
        countMode: rawArgs.countMode || 'count',
        spacing: rawArgs.spacing,
        countPreset: rawArgs.countPreset || 'custom',
        commonCount: rawArgs.commonCount,
        horizontalCount: rawArgs.horizontalCount,
        verticalCount: rawArgs.verticalCount,
        topCount: rawArgs.topCount,
        rightCount: rawArgs.rightCount,
        bottomCount: rawArgs.bottomCount,
        leftCount: rawArgs.leftCount,
        diameter: diameter,
        radius: radius,
        centerDistance: radius + margin,
        position: rawArgs.position === 'outside' ? 'outside' : 'inside',
        appearance: rawArgs.appearance || 'fill',
        strokeWidth: Math.max(0, numberArg(rawArgs.strokeWidth, 0.3)) * mmToPt,
        color: getColor(rawArgs)
    };

    var ranges = [];
    if (target === 'allArtboards') {
        for (var ai = 0; ai < doc.artboards.length; ai++) {
            ranges.push(getArtboardBounds(doc, ai));
        }
    } else if (target === 'activeArtboard') {
        ranges.push(getArtboardBounds(doc, doc.artboards.getActiveArtboardIndex()));
    } else if (doc.selection && doc.selection.length > 0) {
        ranges.push(getSelectionBounds(doc.selection));
    } else {
        ranges.push(getArtboardBounds(doc, doc.artboards.getActiveArtboardIndex()));
    }

    var createdTotal = 0;
    var skippedTotal = 0;
    for (var ri = 0; ri < ranges.length; ri++) {
        var bounds = ranges[ri];
        if (bounds.width <= 0 || bounds.height <= 0) {
            skippedTotal++;
            continue;
        }
        var result = createCircles(layer, bounds, args);
        createdTotal += result.created;
        if (result.skipped) skippedTotal++;
    }

    if (createdTotal <= 0) {
        return $.hopeflow.utils.returnError('没有生成打扣圆，请检查数量、间距或画面内位置设置');
    }

    return $.hopeflow.utils.returnResult({
        message: (boolArg(rawArgs.preview) ? '已预览 ' : '已添加 ') + createdTotal + ' 个打扣圆',
        count: createdTotal,
        skipped: skippedTotal,
        target: target
    });
})();
