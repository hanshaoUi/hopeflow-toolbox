/**
 * SCD Graphic Relief
 *
 * Panel mode creates its own text and parallel lines. Selection mode still
 * accepts existing line/text artwork. Preview output lives on a dedicated layer.
 */
(function () {
    if (!$.hopeflow) return;

    var PREVIEW_LAYER_NAME = '__hf_graphic_relief_preview__';
    var TEMP_LAYER_NAME = '__hf_graphic_relief_temp__';
    $.hopeflow._graphicReliefCache = $.hopeflow._graphicReliefCache || {};

    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function toNumber(value, fallback) {
        var n = parseFloat(value);
        return isNaN(n) ? fallback : n;
    }
    function toInt(value, fallback) {
        var n = parseInt(value, 10);
        return isNaN(n) ? fallback : n;
    }
    function boolArg(value, fallback) {
        if (value === true || value === 'true') return true;
        if (value === false || value === 'false') return false;
        return fallback;
    }
    function mmToPt(mm) { return mm / 0.352778; }

    function hexToRgb(hex) {
        var s = String(hex || '').replace('#', '');
        if (s.length === 3) s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
        if (!/^[0-9a-fA-F]{6}$/.test(s)) s = '29AEEA';
        var c = new RGBColor();
        c.red = parseInt(s.substr(0, 2), 16);
        c.green = parseInt(s.substr(2, 2), 16);
        c.blue = parseInt(s.substr(4, 2), 16);
        return c;
    }

    function getActiveArtboardBounds(doc) {
        var idx = doc.artboards.getActiveArtboardIndex();
        var r = doc.artboards[idx].artboardRect;
        return { left: r[0], top: r[1], right: r[2], bottom: r[3], width: r[2] - r[0], height: r[1] - r[3] };
    }

    function makePanelCacheKey(args, ab, precision) {
        return [
            'panel',
            String(args.text || 'SCD'),
            String(args.fontName || ''),
            String(toNumber(args.fontSize, 88)),
            String(toNumber(args.textX, 50)),
            String(toNumber(args.textY, 45)),
            String(Math.round(precision * 1000) / 1000),
            String(Math.round(ab.left * 100) / 100),
            String(Math.round(ab.top * 100) / 100),
            String(Math.round(ab.width * 100) / 100),
            String(Math.round(ab.height * 100) / 100)
        ].join('|');
    }

    function clonePolygons(polygons) {
        var out = [];
        for (var i = 0; i < polygons.length; i++) {
            var poly = polygons[i];
            var copy = [];
            for (var j = 0; j < poly.length; j++) copy.push([poly[j][0], poly[j][1]]);
            out.push(copy);
        }
        return out;
    }

    function getOrCreateLayer(doc, name) {
        try {
            var layer = doc.layers.getByName(name);
            layer.locked = false;
            layer.visible = true;
            return layer;
        } catch (e) {
            var created = doc.layers.add();
            created.name = name;
            return created;
        }
    }

    function removeLayer(doc, name) {
        try {
            var layer = doc.layers.getByName(name);
            layer.locked = false;
            layer.visible = true;
            layer.remove();
        } catch (e) {}
    }

    function makeStroke(colorHex) {
        return hexToRgb(colorHex || '#29AEEA');
    }

    function makeNoColor() {
        try { return new NoColor(); } catch (e) { return null; }
    }

    function cubicPoint(p0, p1, p2, p3, t) {
        var mt = 1 - t, mt2 = mt * mt, t2 = t * t;
        return [
            mt2 * mt * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t2 * t * p3[0],
            mt2 * mt * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t2 * t * p3[1]
        ];
    }

    function dist(a, b) {
        var dx = b[0] - a[0], dy = b[1] - a[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    function pathToPolygon(pathItem, precision) {
        if (!pathItem || !pathItem.closed || pathItem.pathPoints.length < 3) return null;
        var points = [];
        var count = pathItem.pathPoints.length;
        for (var i = 0; i < count; i++) {
            var cur = pathItem.pathPoints[i];
            var next = pathItem.pathPoints[(i + 1) % count];
            var p0 = cur.anchor;
            var p1 = cur.rightDirection;
            var p2 = next.leftDirection;
            var p3 = next.anchor;
            var approx = dist(p0, p3) + dist(p0, p1) * 0.35 + dist(p2, p3) * 0.35;
            var steps = Math.max(2, Math.min(24, Math.ceil(approx / Math.max(1, precision))));
            if (i === 0) points.push([p0[0], p0[1]]);
            for (var s = 1; s <= steps; s++) points.push(cubicPoint(p0, p1, p2, p3, s / steps));
        }
        return points.length >= 3 ? points : null;
    }

    function collectPolygons(item, out, precision) {
        if (!item) return;
        if (item.typename === 'PathItem') {
            var poly = pathToPolygon(item, precision);
            if (poly) out.push(poly);
            return;
        }
        if (item.typename === 'CompoundPathItem') {
            for (var i = 0; i < item.pathItems.length; i++) collectPolygons(item.pathItems[i], out, precision);
            return;
        }
        if (item.typename === 'GroupItem') {
            for (var j = 0; j < item.pageItems.length; j++) collectPolygons(item.pageItems[j], out, precision);
        }
    }

    function createPanelText(doc, layer, args, ab) {
        var text = String(args.text || 'SCD');
        var fontSize = Math.max(4, toNumber(args.fontSize, 88));
        var xPct = clamp(toNumber(args.textX, 50), 0, 100) / 100;
        var yPct = clamp(toNumber(args.textY, 45), 0, 100) / 100;
        var tf = layer.textFrames.add();
        tf.contents = text;
        tf.textRange.characterAttributes.size = fontSize;
        try {
            var fontName = String(args.fontName || '');
            if (fontName) tf.textRange.characterAttributes.textFont = app.textFonts.getByName(fontName);
        } catch (e) {}
        tf.position = [ab.left + ab.width * xPct, ab.top - ab.height * yPct];
        try { tf.textRange.justification = Justification.CENTER; } catch (e2) {}
        var b = tf.geometricBounds;
        var cx = (b[0] + b[2]) / 2;
        var cy = (b[1] + b[3]) / 2;
        var targetX = ab.left + ab.width * xPct;
        var targetY = ab.top - ab.height * yPct;
        tf.translate(targetX - cx, targetY - cy);
        return tf;
    }

    function duplicateShapeToTemp(item, tempLayer) {
        var dup = item.duplicate(tempLayer, ElementPlacement.PLACEATBEGINNING);
        if (dup.typename === 'TextFrame') {
            try { dup = dup.createOutline(); } catch (e) {}
        }
        return dup;
    }

    function makePanelPolygons(doc, args, ab, precision) {
        var cacheKey = makePanelCacheKey(args, ab, precision);
        var cached = $.hopeflow._graphicReliefCache[cacheKey];
        if (cached && cached.polygons && cached.geometry) {
            return {
                polygons: cached.polygons,
                geometry: cached.geometry,
                cacheHit: true
            };
        }

        var tempLayer = getOrCreateLayer(doc, TEMP_LAYER_NAME);
        var polygons = [];
        try {
            var tf = createPanelText(doc, tempLayer, args, ab);
            var outlined = tf.createOutline();
            collectPolygons(outlined, polygons, precision);
        } finally {
            removeLayer(doc, TEMP_LAYER_NAME);
        }
        var geometry = buildGeometry(polygons);
        $.hopeflow._graphicReliefCache = {};
        $.hopeflow._graphicReliefCache[cacheKey] = {
            polygons: clonePolygons(polygons),
            geometry: geometry
        };
        return { polygons: polygons, geometry: geometry, cacheHit: false };
    }

    function collectSelectedItems(item, out) {
        if (!item) return;
        if (item.typename === 'GroupItem') {
            for (var i = 0; i < item.pageItems.length; i++) collectSelectedItems(item.pageItems[i], out);
        } else {
            out.push(item);
        }
    }

    function getPathBounds(pathItem) {
        var b = pathItem.geometricBounds;
        return { left: b[0], top: b[1], right: b[2], bottom: b[3], width: b[2] - b[0], height: b[1] - b[3] };
    }

    function isHorizontalLine(item, toleranceDeg, minLength) {
        if (!item || item.typename !== 'PathItem' || item.closed || item.pathPoints.length < 2) return false;
        var first = item.pathPoints[0].anchor;
        var last = item.pathPoints[item.pathPoints.length - 1].anchor;
        var dx = last[0] - first[0], dy = last[1] - first[1];
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < minLength) return false;
        var angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
        angle = Math.min(angle, Math.abs(180 - angle));
        if (angle > toleranceDeg) return false;
        var b = getPathBounds(item);
        return b.width >= minLength && b.width >= Math.max(1, b.height) * 8;
    }

    function lineInfo(line) {
        var first = line.pathPoints[0].anchor;
        var last = line.pathPoints[line.pathPoints.length - 1].anchor;
        return {
            left: Math.min(first[0], last[0]),
            right: Math.max(first[0], last[0]),
            y: (first[1] + last[1]) / 2,
            strokeWidth: line.strokeWidth || 1,
            strokeColor: line.strokeColor
        };
    }

    function makeSelectionSources(doc, args, precision) {
        var raw = [];
        var sel = doc.selection || [];
        for (var i = 0; i < sel.length; i++) collectSelectedItems(sel[i], raw);
        var lines = [];
        var shapes = [];
        var tolerance = clamp(toNumber(args.lineTolerance, 3), 0.2, 20);
        var minLength = mmToPt(Math.max(1, toNumber(args.minLineLength, 30)));
        for (var r = 0; r < raw.length; r++) {
            if (isHorizontalLine(raw[r], tolerance, minLength)) lines.push(lineInfo(raw[r]));
            else if (raw[r].typename === 'TextFrame' || raw[r].typename === 'PathItem' || raw[r].typename === 'CompoundPathItem') shapes.push(raw[r]);
        }
        if (!lines.length) throw new Error('未找到水平平行线');
        if (!shapes.length) throw new Error('未找到文字或图形');

        var tempLayer = getOrCreateLayer(doc, TEMP_LAYER_NAME);
        var polygons = [];
        try {
            for (var s = 0; s < shapes.length; s++) collectPolygons(duplicateShapeToTemp(shapes[s], tempLayer), polygons, precision);
        } finally {
            removeLayer(doc, TEMP_LAYER_NAME);
        }
        return { lines: lines, polygons: polygons };
    }

    function makePanelLines(args, ab, strokeColor) {
        var rows = Math.max(2, toInt(args.lineCount, 64));
        var previewLimit = toInt(args.previewLineLimit, 0);
        if (previewLimit > 0) rows = Math.min(rows, previewLimit);
        var spacing = mmToPt(Math.max(0.5, toNumber(args.lineSpacing, 4)));
        var widthPct = clamp(toNumber(args.widthPct, 88), 10, 120) / 100;
        var yPct = clamp(toNumber(args.lineCenterY, 55), 0, 100) / 100;
        var width = ab.width * widthPct;
        var left = ab.left + (ab.width - width) / 2;
        var right = left + width;
        var centerY = ab.top - ab.height * yPct;
        var topY = centerY + (rows - 1) * spacing / 2;
        var sw = Math.max(0.1, toNumber(args.strokeWidth, 1));
        var lines = [];
        for (var i = 0; i < rows; i++) {
            lines.push({ left: left, right: right, y: topY - i * spacing, strokeWidth: sw, strokeColor: strokeColor });
        }
        return lines;
    }

    function buildGeometry(polygons) {
        var segments = [];
        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (var p = 0; p < polygons.length; p++) {
            var poly = polygons[p];
            for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                var a = poly[j], b = poly[i];
                if (Math.abs(a[0] - b[0]) < 0.001 && Math.abs(a[1] - b[1]) < 0.001) continue;
                segments.push({
                    x1: a[0], y1: a[1],
                    x2: b[0], y2: b[1],
                    minX: Math.min(a[0], b[0]),
                    maxX: Math.max(a[0], b[0]),
                    minY: Math.min(a[1], b[1]),
                    maxY: Math.max(a[1], b[1])
                });
                var seg = segments[segments.length - 1];
                if (seg.minX < minX) minX = seg.minX;
                if (seg.maxX > maxX) maxX = seg.maxX;
                if (seg.minY < minY) minY = seg.minY;
                if (seg.maxY > maxY) maxY = seg.maxY;
            }
        }
        var bucketCount = 96;
        var xBuckets = [];
        var yBuckets = [];
        for (var b = 0; b < bucketCount; b++) {
            xBuckets.push([]);
            yBuckets.push([]);
        }
        var xSpan = Math.max(1, maxX - minX);
        var ySpan = Math.max(1, maxY - minY);
        for (var s = 0; s < segments.length; s++) {
            var seg2 = segments[s];
            var xs = clamp(Math.floor((seg2.minX - minX) / xSpan * bucketCount), 0, bucketCount - 1);
            var xe = clamp(Math.floor((seg2.maxX - minX) / xSpan * bucketCount), 0, bucketCount - 1);
            var ys = clamp(Math.floor((seg2.minY - minY) / ySpan * bucketCount), 0, bucketCount - 1);
            var ye = clamp(Math.floor((seg2.maxY - minY) / ySpan * bucketCount), 0, bucketCount - 1);
            for (var xb = xs; xb <= xe; xb++) xBuckets[xb].push(seg2);
            for (var yb = ys; yb <= ye; yb++) yBuckets[yb].push(seg2);
        }
        return {
            segments: segments,
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY,
            bucketCount: bucketCount,
            xBuckets: xBuckets,
            yBuckets: yBuckets
        };
    }

    function getYBucket(geometry, y) {
        if (y < geometry.minY || y > geometry.maxY) return [];
        var idx = clamp(Math.floor((y - geometry.minY) / Math.max(1, geometry.maxY - geometry.minY) * geometry.bucketCount), 0, geometry.bucketCount - 1);
        return geometry.yBuckets[idx];
    }

    function getXBucket(geometry, x) {
        if (x < geometry.minX || x > geometry.maxX) return [];
        var idx = clamp(Math.floor((x - geometry.minX) / Math.max(1, geometry.maxX - geometry.minX) * geometry.bucketCount), 0, geometry.bucketCount - 1);
        return geometry.xBuckets[idx];
    }

    function getIntervalsAtY(geometry, y, left, right) {
        var segments = getYBucket(geometry, y);
        var xs = [];
        for (var i = 0; i < segments.length; i++) {
            var s = segments[i];
            if (s.maxY <= y || s.minY > y) continue;
            if (Math.abs(s.y2 - s.y1) < 0.001) continue;
            var t = (y - s.y1) / (s.y2 - s.y1);
            var x = s.x1 + t * (s.x2 - s.x1);
            if (x >= left && x <= right) xs.push(x);
        }
        xs.sort(function (a, b) { return a - b; });
        var intervals = [];
        for (var k = 0; k + 1 < xs.length; k += 2) {
            var a = Math.max(left, xs[k]);
            var b = Math.min(right, xs[k + 1]);
            if (b - a > 0.1) intervals.push([a, b]);
        }
        return intervals;
    }

    function uniqueSorted(values, minGap) {
        values.sort(function (a, b) { return a - b; });
        var out = [];
        for (var i = 0; i < values.length; i++) {
            if (!out.length || Math.abs(values[i] - out[out.length - 1]) >= minGap) out.push(values[i]);
        }
        return out;
    }

    function surfaceYAt(geometry, x, baseY, clearance, strength, profile) {
        var segments = getXBucket(geometry, x);
        var allYs = [];
        for (var p = 0; p < segments.length; p++) {
            var s = segments[p];
            if (s.maxX <= x || s.minX > x) continue;
            if (Math.abs(s.x2 - s.x1) < 0.001) continue;
            var t = (x - s.x1) / (s.x2 - s.x1);
            allYs.push(s.y1 + t * (s.y2 - s.y1));
        }
        allYs.sort(function (a, b) { return a - b; });
        for (var i = 0; i + 1 < allYs.length; i += 2) {
            var bottom = allYs[i];
            var top = allYs[i + 1];
            if (baseY >= bottom && baseY <= top) {
                if (profile === 'split') {
                    var mid = (top + bottom) / 2;
                    if (baseY >= mid) {
                        return baseY + (top - baseY) * strength + clearance;
                    }
                    return baseY - (baseY - bottom) * strength - clearance;
                }
                return baseY + (top - baseY) * strength + clearance;
            }
        }
        return baseY;
    }

    function smoothSeries(values, passes) {
        var out = values.slice(0);
        for (var p = 0; p < passes; p++) {
            var next = out.slice(0);
            for (var i = 1; i < out.length - 1; i++) next[i] = out[i - 1] * 0.25 + out[i] * 0.5 + out[i + 1] * 0.25;
            out = next;
        }
        return out;
    }

    function buildReliefPoints(line, geometry, args) {
        if (line.y < geometry.minY || line.y > geometry.maxY || line.right < geometry.minX || line.left > geometry.maxX) {
            return [[line.left, line.y], [line.right, line.y]];
        }
        var quality = String(args.quality || 'balanced');
        var defaultStep = quality === 'fast' ? 1.8 : (quality === 'fine' ? 0.6 : 0.9);
        var sampleStep = mmToPt(Math.max(0.3, toNumber(args.sampleStep, defaultStep)));
        var clearance = mmToPt(toNumber(args.clearance, 0.8));
        var edgeInset = mmToPt(Math.max(0.05, toNumber(args.edgeInset, 0.35)));
        var strength = clamp(toNumber(args.embossStrength, 82), 0, 100) / 100;
        var profile = String(args.reliefProfile || 'split');
        var smoothing = Math.max(0, Math.min(8, toInt(args.smoothing, 2)));
        var intervals = getIntervalsAtY(geometry, line.y, line.left, line.right);
        if (!intervals.length) return [[line.left, line.y], [line.right, line.y]];

        var xs = [line.left, line.right];
        for (var n = 0; n < intervals.length; n++) {
            var a = intervals[n][0], b = intervals[n][1];
            xs.push(clamp(a - edgeInset, line.left, line.right));
            xs.push(a);
            xs.push(clamp(a + edgeInset, line.left, line.right));
            var count = Math.max(1, Math.ceil((b - a) / sampleStep));
            for (var i = 1; i < count; i++) {
                xs.push(a + (b - a) * (i / count));
            }
            xs.push(clamp(b - edgeInset, line.left, line.right));
            xs.push(b);
            xs.push(clamp(b + edgeInset, line.left, line.right));
        }
        xs = uniqueSorted(xs, 0.05);

        var ys = [];
        for (var y = 0; y < xs.length; y++) {
            ys.push(surfaceYAt(geometry, xs[y], line.y, clearance, strength, profile));
        }
        ys = smoothSeries(ys, smoothing);
        var points = [];
        var minDelta = 0.02;
        for (var j = 0; j < xs.length; j++) {
            if (j > 0 && Math.abs(ys[j] - points[points.length - 1][1]) < minDelta && j < xs.length - 1) {
                if (j % 3 !== 0) continue;
            }
            points.push([xs[j], ys[j]]);
        }
        return points;
    }

    function addPolyline(container, points, strokeWidth, strokeColor) {
        var p = container.pathItems.add();
        p.setEntirePath(points);
        p.closed = false;
        p.filled = false;
        p.stroked = true;
        p.strokeWidth = strokeWidth;
        p.strokeColor = strokeColor;
        try { p.strokeCap = StrokeCap.ROUNDENDCAP; } catch (e) {}
        try { p.strokeJoin = StrokeJoin.ROUNDENDJOIN; } catch (e2) {}
        return p;
    }

    function addPanelTextReference(doc, container, args, ab) {
        if (!boolArg(args.showTextReference, false)) return;
        var item = createPanelText(doc, container.layer || doc.activeLayer, args, ab);
        try { item.opacity = 18; } catch (e) {}
        try { item.move(container, ElementPlacement.PLACEATBEGINNING); } catch (e2) {}
    }

    function buildSources(doc, args) {
        var ab = getActiveArtboardBounds(doc);
        var precision = mmToPt(Math.max(0.2, toNumber(args.curvePrecision, 0.8)));
        var color = makeStroke(args.customColor || '#29AEEA');
        var sourceMode = String(args.sourceMode || 'panel');
        var sources = sourceMode === 'selection'
            ? makeSelectionSources(doc, args, precision)
            : makePanelPolygons(doc, args, ab, precision);
        var lines = sourceMode === 'selection'
            ? sources.lines
            : makePanelLines(args, ab, color);
        if (!sources.polygons.length) throw new Error('无法生成文字/图形轮廓');
        return {
            ab: ab,
            color: color,
            sourceMode: sourceMode,
            polygons: sources.polygons,
            lines: lines
        };
    }

    function exportNativeInput(doc, args) {
        var source = buildSources(doc, args);
        var nativeLines = [];
        for (var i = 0; i < source.lines.length; i++) {
            nativeLines.push({
                left: source.lines[i].left,
                right: source.lines[i].right,
                y: source.lines[i].y,
                strokeWidth: source.lines[i].strokeWidth || 1
            });
        }
        $.hopeflow._graphicReliefNativeLineStyles = [];
        for (var st = 0; st < source.lines.length; st++) {
            $.hopeflow._graphicReliefNativeLineStyles.push({
                strokeWidth: source.lines[st].strokeWidth || 1,
                strokeColor: source.lines[st].strokeColor || makeStroke(args.customColor || '#29AEEA')
            });
        }
        var quality = String(args.quality || 'balanced');
        var defaultStep = quality === 'fast' ? 1.8 : (quality === 'fine' ? 0.6 : 0.9);
        return {
            polygons: source.polygons,
            lines: nativeLines,
            params: {
                sampleStep: mmToPt(Math.max(0.3, toNumber(args.sampleStep, defaultStep))),
                edgeInset: mmToPt(Math.max(0.05, toNumber(args.edgeInset, 0.35))),
                clearance: mmToPt(toNumber(args.clearance, 0.8)),
                strength: clamp(toNumber(args.embossStrength, 82), 0, 100) / 100,
                smoothing: Math.max(0, Math.min(8, toInt(args.smoothing, 2))),
                split: String(args.reliefProfile || 'split') === 'split'
            }
        };
    }

    function readJsonFile(filePath) {
        var f = new File(filePath);
        if (!f.exists) throw new Error('Native 输出文件不存在');
        f.encoding = 'UTF-8';
        if (!f.open('r')) throw new Error('无法读取 Native 输出文件');
        var text = f.read();
        f.close();
        return JSON.parse(text);
    }

    function importNativeOutput(doc, args, preview) {
        var nativeOutput = readJsonFile(String(args.nativeOutputPath || ''));
        if (!nativeOutput || nativeOutput.success === false) {
            throw new Error(nativeOutput && nativeOutput.error ? nativeOutput.error : 'Native 计算失败');
        }
        var ab = getActiveArtboardBounds(doc);
        var color = makeStroke(args.customColor || '#29AEEA');
        var strokeWidth = Math.max(0.1, toNumber(args.strokeWidth, 1));
        var targetLayer = preview ? getOrCreateLayer(doc, PREVIEW_LAYER_NAME) : doc.activeLayer;
        var group = targetLayer.groupItems.add();
        group.name = preview ? 'SCD Graphic Relief Preview' : 'SCD Graphic Relief';
        if (String(args.sourceMode || 'panel') !== 'selection') addPanelTextReference(doc, group, args, ab);

        var generated = 0;
        var nativeLines = nativeOutput.lines || [];
        var styles = $.hopeflow._graphicReliefNativeLineStyles || [];
        for (var i = 0; i < nativeLines.length; i++) {
            if (!nativeLines[i] || nativeLines[i].length < 2) continue;
            var style = styles[i] || {};
            addPolyline(group, nativeLines[i], style.strokeWidth || strokeWidth, style.strokeColor || color);
            generated++;
        }
        if (preview) {
            try { targetLayer.locked = true; } catch (e) {}
        }
        return {
            generated: generated,
            affected: nativeOutput.affected || 0
        };
    }

    function build(doc, targetLayer, args, preview) {
        var source = buildSources(doc, args);
        var ab = source.ab;
        var color = source.color;
        var sourceMode = source.sourceMode;
        var lines = source.lines;
        var polygons = source.polygons;
        if (!polygons.length) throw new Error('无法生成文字/图形轮廓');
        var geometry = buildGeometry(polygons);
        if (!geometry.segments.length) throw new Error('无法生成有效轮廓边');

        var group = targetLayer.groupItems.add();
        group.name = preview ? 'SCD Graphic Relief Preview' : 'SCD Graphic Relief';
        if (sourceMode !== 'selection') addPanelTextReference(doc, group, args, ab);

        var includeFlat = boolArg(args.includeUnchanged, true);
        var generated = 0;
        var affected = 0;
        for (var i = 0; i < lines.length; i++) {
            var pts = buildReliefPoints(lines[i], geometry, args);
            var lineAffected = false;
            for (var p = 0; p < pts.length; p++) {
                if (Math.abs(pts[p][1] - lines[i].y) > 0.1) {
                    lineAffected = true;
                    break;
                }
            }
            if (!lineAffected && !includeFlat) continue;
            addPolyline(group, pts, lines[i].strokeWidth, lines[i].strokeColor || color);
            generated++;
            if (lineAffected) affected++;
        }
        return { generated: generated, affected: affected, polygons: polygons.length };
    }

    try {
        if (!app.documents.length) return $.hopeflow.utils.returnError('请先打开文档');
        var doc = app.activeDocument;
        var args = $.hopeflow.utils.getArgs();
        var mode = String(args.mode || 'create');

        if (mode === 'clearPreview' || boolArg(args.clearOnly, false)) {
            removeLayer(doc, PREVIEW_LAYER_NAME);
            return $.hopeflow.utils.returnResult({ message: '已清除图形浮雕预览', cleared: true });
        }

        if (mode === 'exportNativeInput') {
            return $.hopeflow.utils.returnResult({
                nativeInput: exportNativeInput(doc, args)
            });
        }

        if (mode === 'importNativeOutput') {
            removeLayer(doc, PREVIEW_LAYER_NAME);
            var importResult = importNativeOutput(doc, args, boolArg(args.nativePreview, false));
            return $.hopeflow.utils.returnResult({
                message: boolArg(args.nativePreview, false) ? '已生成 Native 图形浮雕预览' : '已生成 Native 图形浮雕',
                generated: importResult.generated,
                affected: importResult.affected
            });
        }

        var preview = mode === 'preview' || boolArg(args.preview, false);
        if (preview) {
            removeLayer(doc, PREVIEW_LAYER_NAME);
            var previewLayer = getOrCreateLayer(doc, PREVIEW_LAYER_NAME);
            var previewResult = build(doc, previewLayer, args, true);
            try { previewLayer.locked = true; } catch (e) {}
            return $.hopeflow.utils.returnResult({
                message: '已生成图形浮雕预览',
                preview: true,
                generated: previewResult.generated,
                affected: previewResult.affected
            });
        }

        removeLayer(doc, PREVIEW_LAYER_NAME);
        var result = build(doc, doc.activeLayer, args, false);
        if (result.generated <= 0) return $.hopeflow.utils.returnError('没有生成线条，请增加行数或打开“保留平直线”');
        return $.hopeflow.utils.returnResult({
            message: '已生成图形浮雕',
            generated: result.generated,
            affected: result.affected,
            polygons: result.polygons
        });
    } catch (error) {
        return $.hopeflow.utils.returnError('图形浮雕执行失败：' + (error.message || error));
    }
})();
