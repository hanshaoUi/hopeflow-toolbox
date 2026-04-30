/**
 * Blob Shape Generator
 * Creates one organic blob shape similar to gradients.app/blob.
 */
(function () {
    if (!$.hopeflow) return;

    if (app.documents.length === 0) {
        return $.hopeflow.utils.returnError('No document open');
    }

    var doc = app.activeDocument;
    var args = $.hopeflow.utils.getArgs();
    var PREVIEW_LAYER_NAME = '__hf_blob_preview__';

    function num(value, fallback, min, max) {
        var n = parseFloat(value);
        if (isNaN(n)) n = fallback;
        if (typeof min === 'number' && n < min) n = min;
        if (typeof max === 'number' && n > max) n = max;
        return n;
    }

    function intNum(value, fallback, min, max) {
        return Math.round(num(value, fallback, min, max));
    }

    var edges = intNum(args.edges, 8, 3, 32);
    var smoothness = num(args.smoothness, 70, 0, 100) / 100;
    var irregularity = num(args.irregularity, 48, 0, 100) / 100;
    var sizeMm = num(args.size, 80, 1, 2000);
    var sizePt = sizeMm * 2.83464567;
    var fillType = args.fillType || 'gradient';
    var colorA = args.colorA || '#FFA500';
    var colorB = args.colorB || '#FF6347';
    var strokeWidth = num(args.strokeWidth, 2, 0, 1000);
    var region = args.region || 'artboard';
    var seed = intNum(args.seed, 914783, 0, 2147483646);
    var isPreview = args.preview === true || args.preview === 'true';
    var clearOnly = args.clearOnly === true || args.clearOnly === 'true';

    var state = seed > 0 ? seed : 914783;

    function random() {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    }

    function between(min, max) {
        return min + random() * (max - min);
    }

    function removePreviewLayer() {
        try {
            var layer = doc.layers.getByName(PREVIEW_LAYER_NAME);
            layer.locked = false;
            layer.visible = true;
            layer.remove();
        } catch (e) {}
    }

    function getPreviewLayer() {
        try {
            var layer = doc.layers.getByName(PREVIEW_LAYER_NAME);
            layer.locked = false;
            layer.visible = true;
            return layer;
        } catch (e) {
            var created = doc.layers.add();
            created.name = PREVIEW_LAYER_NAME;
            return created;
        }
    }

    if (clearOnly) {
        removePreviewLayer();
        return $.hopeflow.utils.returnResult({ cleared: true });
    }

    function cleanHex(hex, fallback) {
        hex = String(hex || '').replace(/\s/g, '');
        if (hex.charAt(0) === '#') hex = hex.substring(1);
        if (hex.length === 3) {
            hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
        }
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) hex = fallback.replace('#', '');
        return hex;
    }

    function hexToRgb(hex, fallback) {
        hex = cleanHex(hex, fallback);
        var color = new RGBColor();
        color.red = parseInt(hex.substring(0, 2), 16);
        color.green = parseInt(hex.substring(2, 4), 16);
        color.blue = parseInt(hex.substring(4, 6), 16);
        return color;
    }

    function selectionBounds() {
        if (!doc.selection || doc.selection.length === 0) return null;
        var left = Infinity;
        var top = -Infinity;
        var right = -Infinity;
        var bottom = Infinity;

        for (var i = 0; i < doc.selection.length; i++) {
            try {
                var b = doc.selection[i].visibleBounds;
                if (b[0] < left) left = b[0];
                if (b[1] > top) top = b[1];
                if (b[2] > right) right = b[2];
                if (b[3] < bottom) bottom = b[3];
            } catch (e) {}
        }

        if (left === Infinity) return null;
        return [left, top, right, bottom];
    }

    function artboardBounds() {
        return doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
    }

    var bounds = region === 'selection' ? selectionBounds() : null;
    if (!bounds) bounds = artboardBounds();

    var centerX = (bounds[0] + bounds[2]) / 2;
    var centerY = (bounds[1] + bounds[3]) / 2;
    var maxWidth = Math.abs(bounds[2] - bounds[0]) * 0.82;
    var maxHeight = Math.abs(bounds[1] - bounds[3]) * 0.82;
    var diameter = Math.min(sizePt, maxWidth, maxHeight);
    if (diameter <= 0) diameter = sizePt;

    function buildPoints() {
        var points = [];
        var radius = diameter / 2;
        var angleStep = Math.PI * 2 / edges;
        var angleJitter = angleStep * irregularity * 0.38;

        for (var i = 0; i < edges; i++) {
            var angle = -Math.PI / 2 + i * angleStep + between(-angleJitter, angleJitter);
            var r = radius * between(1 - irregularity * 0.42, 1 + irregularity * 0.42);
            var stretchX = between(0.84, 1.18);
            var stretchY = between(0.84, 1.18);

            points.push([
                centerX + Math.cos(angle) * r * stretchX,
                centerY + Math.sin(angle) * r * stretchY
            ]);
        }

        return points;
    }

    function dist(a, b) {
        var dx = b[0] - a[0];
        var dy = b[1] - a[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    function applyHandles(path, points) {
        if (smoothness <= 0.01) {
            for (var i = 0; i < path.pathPoints.length; i++) {
                path.pathPoints[i].pointType = PointType.CORNER;
            }
            return;
        }

        var handleScale = 0.10 + smoothness * 0.34;
        for (var j = 0; j < points.length; j++) {
            var prev = points[(j - 1 + points.length) % points.length];
            var curr = points[j];
            var next = points[(j + 1) % points.length];
            var tangent = Math.atan2(next[1] - prev[1], next[0] - prev[0]);
            var leftLen = dist(curr, prev) * handleScale;
            var rightLen = dist(curr, next) * handleScale;
            var point = path.pathPoints[j];

            point.leftDirection = [
                curr[0] - Math.cos(tangent) * leftLen,
                curr[1] - Math.sin(tangent) * leftLen
            ];
            point.rightDirection = [
                curr[0] + Math.cos(tangent) * rightLen,
                curr[1] + Math.sin(tangent) * rightLen
            ];
            point.pointType = PointType.SMOOTH;
        }
    }

    function makeGradientColor() {
        var gradient = doc.gradients.add();
        gradient.name = 'Blob Gradient ' + state;
        gradient.type = GradientType.LINEAR;
        gradient.gradientStops[0].rampPoint = 0;
        gradient.gradientStops[0].color = hexToRgb(colorA, '#FFA500');
        gradient.gradientStops[1].rampPoint = 100;
        gradient.gradientStops[1].color = hexToRgb(colorB, '#FF6347');

        var gradientColor = new GradientColor();
        gradientColor.gradient = gradient;
        gradientColor.angle = -35;
        return gradientColor;
    }

    var points = buildPoints();
    if (isPreview) {
        removePreviewLayer();
        doc.activeLayer = getPreviewLayer();
    } else {
        removePreviewLayer();
    }

    var blob = doc.pathItems.add();
    blob.setEntirePath(points);
    blob.closed = true;

    if (fillType === 'outline') {
        blob.filled = false;
        blob.stroked = true;
        blob.strokeWidth = strokeWidth;
        blob.strokeColor = hexToRgb(colorA, '#1E90FF');
    } else if (fillType === 'solid') {
        blob.filled = true;
        blob.fillColor = hexToRgb(colorA, '#FFA500');
        blob.stroked = strokeWidth > 0;
        if (blob.stroked) {
            blob.strokeWidth = strokeWidth;
            blob.strokeColor = hexToRgb(colorB, '#FF6347');
        }
    } else {
        blob.filled = true;
        blob.fillColor = makeGradientColor();
        blob.stroked = false;
    }

    applyHandles(blob, points);

    if (isPreview) {
        try {
            doc.activeLayer.locked = true;
        } catch (e) {}
        return $.hopeflow.utils.returnResult({
            preview: true,
            seed: state,
            edges: edges
        });
    }

    doc.selection = null;
    blob.selected = true;

    return $.hopeflow.utils.returnResult({
        message: 'Blob shape created',
        seed: state,
        edges: edges
    });
})();
