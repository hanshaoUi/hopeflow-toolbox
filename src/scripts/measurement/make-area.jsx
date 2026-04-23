(function () {
    function getArgs() {
        return $.hopeflow ? ($.hopeflow.utils.getArgs() || {}) : {};
    }

    function getDocumentUnit() {
        if ($.hopeflow && $.hopeflow.utils.getRulerUnitsString) {
            return $.hopeflow.utils.getRulerUnitsString() || 'pt';
        }

        if (!app.documents.length) return 'pt';
        switch (app.activeDocument.rulerUnits) {
            case RulerUnits.Millimeters: return 'mm';
            case RulerUnits.Centimeters: return 'cm';
            case RulerUnits.Inches: return 'in';
            case RulerUnits.Points: return 'pt';
            case RulerUnits.Picas: return 'pc';
            case RulerUnits.Pixels: return 'px';
            default: return 'pt';
        }
    }

    function normalizeUnit(unit) {
        var value = String(unit || 'doc').toLowerCase();
        if (value === 'doc') return getDocumentUnit();
        switch (value) {
            case 'pt':
            case 'mm':
            case 'cm':
            case 'm':
            case 'in':
            case 'px':
            case 'pc':
                return value;
            default:
                return 'pt';
        }
    }

    function toNumber(value, fallback) {
        var parsed = parseFloat(value);
        return isNaN(parsed) ? fallback : parsed;
    }

    function convertPtLength(pt, unit) {
        switch (unit) {
            case 'mm': return pt * 0.35277778;
            case 'cm': return pt * 0.035277778;
            case 'm': return pt * 0.00035277778;
            case 'in': return pt / 72;
            case 'px': return pt * (96 / 72);
            case 'pc': return pt / 12;
            case 'pt':
            default:
                return pt;
        }
    }

    function convertPtArea(ptArea, unit) {
        var lengthFactor = convertPtLength(1, unit);
        return ptArea * lengthFactor * lengthFactor;
    }

    function formatNumber(value, digits) {
        var text = Number(value).toFixed(digits);
        return digits > 0 ? text.replace(/\.?0+$/, '') : text;
    }

    function getAreaSuffix(unit) {
        return unit + '2';
    }

    function applySuperscriptToLastChar(textFrame) {
        try {
            if (!textFrame || !textFrame.characters || textFrame.characters.length < 1) return;
            var lastChar = textFrame.characters[textFrame.characters.length - 1];
            var baseSize = parseFloat(textFrame.textRange.characterAttributes.size);
            if (!isFinite(baseSize) || baseSize <= 0) baseSize = 12;

            lastChar.characterAttributes.size = baseSize * 0.7;
            lastChar.characterAttributes.baselineShift = baseSize * 0.35;
        } catch (e) {}
    }

    function getMetrics(item) {
        if (!item) return null;

        if (item.typename === 'PathItem') {
            return {
                perimeterPt: typeof item.length === 'number' ? item.length : 0,
                areaPt2: Math.abs(typeof item.area === 'number' ? item.area : 0),
                bounds: item.geometricBounds
            };
        }

        if (item.typename === 'CompoundPathItem') {
            var totalLength = 0;
            var signedArea = 0;
            var hasPath = false;

            for (var i = 0; i < item.pathItems.length; i++) {
                var path = item.pathItems[i];
                if (!path || path.guides || path.clipping) continue;
                hasPath = true;
                totalLength += typeof path.length === 'number' ? path.length : 0;
                signedArea += typeof path.area === 'number' ? path.area : 0;
            }

            if (!hasPath) return null;
            return {
                perimeterPt: totalLength,
                areaPt2: Math.abs(signedArea),
                bounds: item.geometricBounds
            };
        }

        return null;
    }

    function makeArea() {
        if (!app.documents.length) {
            throw new Error('请先打开一个文档');
        }

        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) {
            throw new Error('请先选择对象');
        }

        var args = getArgs();
        var unit = normalizeUnit(args.unit);
        var scale = toNumber(args.scale, 1);
        var digit = Math.max(0, Math.round(toNumber(args.digit, 3)));
        var layer = doc.activeLayer;
        var processed = 0;

        if (!isFinite(scale) || scale <= 0) scale = 1;
        if (layer.locked) layer.locked = false;
        if (!layer.visible) layer.visible = true;

        for (var i = 0; i < doc.selection.length; i++) {
            var metrics = getMetrics(doc.selection[i]);
            if (!metrics) continue;

            var bounds = metrics.bounds;
            var left = bounds[0];
            var top = bounds[1];
            var height = Math.abs(bounds[3] - bounds[1]);
            var perimeter = convertPtLength(metrics.perimeterPt, unit) * scale;
            var area = convertPtArea(metrics.areaPt2, unit) * scale * scale;
            var text = layer.textFrames.add();

            text.contents =
                '周长: ' + formatNumber(perimeter, digit) + unit +
                '\n面积: ' + formatNumber(area, digit) + getAreaSuffix(unit);
            text.position = [left, top - height];
            applySuperscriptToLastChar(text);
            processed++;
        }

        if (processed < 1) {
            throw new Error('请选择路径或复合路径对象');
        }

        return {
            annotated: processed,
            unit: unit,
            scale: scale,
            digit: digit
        };
    }

    try {
        var result = makeArea();
        if ($.hopeflow) {
            return $.hopeflow.utils.returnResult(result);
        }
    } catch (e) {
        if ($.hopeflow) {
            return $.hopeflow.utils.returnError(String(e.message || e));
        }
        alert(String(e.message || e));
    }
})();
