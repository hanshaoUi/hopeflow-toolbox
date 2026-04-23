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

    function formatNumber(value, digits) {
        var text = Number(value).toFixed(digits);
        return digits > 0 ? text.replace(/\.?0+$/, '') : text;
    }

    function getLength(curve, divNum) {
        var divUnit = 1 / divNum;
        var m = [
            curve[3][0] - curve[0][0] + 3 * (curve[1][0] - curve[2][0]),
            curve[0][0] - 2 * curve[1][0] + curve[2][0],
            curve[1][0] - curve[0][0]
        ];
        var n = [
            curve[3][1] - curve[0][1] + 3 * (curve[1][1] - curve[2][1]),
            curve[0][1] - 2 * curve[1][1] + curve[2][1],
            curve[1][1] - curve[0][1]
        ];
        var k = [
            m[0] * m[0] + n[0] * n[0],
            4 * (m[0] * m[1] + n[0] * n[1]),
            2 * ((m[0] * m[2] + n[0] * n[2]) + 2 * (m[1] * m[1] + n[1] * n[1])),
            4 * (m[1] * m[2] + n[1] * n[2]),
            m[2] * m[2] + n[2] * n[2]
        ];
        var fc = function (t, coeffs) {
            return Math.sqrt(t * (t * (t * (t * coeffs[0] + coeffs[1]) + coeffs[2]) + coeffs[3]) + coeffs[4]) || 0;
        };
        var total = 0;
        var i;
        for (i = 1; i < divNum; i += 2) total += fc(i * divUnit, k);
        total *= 2;
        for (i = 2; i < divNum; i += 2) total += fc(i * divUnit, k);
        return (fc(0, k) + fc(1, k) + total * 2) * divUnit;
    }

    function getPathLength(item, useNativeProperty, divNum) {
        if (useNativeProperty && typeof item.length === 'number') {
            return item.length;
        }

        var total = 0;
        var points = item.pathPoints;
        for (var j = 0; j < points.length; j++) {
            var k;
            if (j === points.length - 1) {
                if (item.closed) k = 0;
                else break;
            } else {
                k = j + 1;
            }

            total += getLength([
                points[j].anchor,
                points[j].rightDirection,
                points[k].leftDirection,
                points[k].anchor
            ], divNum);
        }
        return total;
    }

    function writeResultAsText(layer, content, fontName, fontSize, position, results) {
        var tx = layer.textFrames.add();
        tx.contents = content;
        with (tx.textRange) {
            with (characterAttributes) {
                size = fontSize;
                try {
                    textFont = textFonts.getByName(fontName);
                } catch (e) {}
            }
            with (paragraphAttributes) {
                justification = Justification.LEFT;
                autoLeadingAmount = 120;
            }
        }
        tx.position = [position[0] - tx.width / 2, position[1] + tx.height / 2];
        results.push(tx);
    }

    function findCenter(item) {
        var bounds = item.geometricBounds;
        return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
    }

    function extractPaths(items, minPointCount, paths) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.typename === 'PathItem' && !item.guides && !item.clipping) {
                if (minPointCount && item.pathPoints.length <= minPointCount) continue;
                paths.push(item);
            } else if (item.typename === 'GroupItem') {
                extractPaths(item.pageItems, minPointCount, paths);
            } else if (item.typename === 'CompoundPathItem') {
                extractPaths(item.pathItems, minPointCount, paths);
            }
        }
    }

    function measurePathLength() {
        if (!app.documents.length) {
            throw new Error('请先打开一个文档');
        }

        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) {
            throw new Error('请先选择路径对象');
        }

        var args = getArgs();
        var unit = normalizeUnit(args.unit);
        var scale = toNumber(args.scale, 1);
        var digit = Math.max(0, Math.round(toNumber(args.digit, 2)));
        var useNativeProperty = !(version.indexOf('10') === 0 || version.indexOf('11') === 0 || version.indexOf('12') === 0);
        var fontSize = 12;
        var fontName = 'MyriadPro-Regular';
        var divNum = 1024;
        var paths = [];
        var results = [];
        var totalLengthPt = 0;

        if (!isFinite(scale) || scale <= 0) scale = 1;

        extractPaths(doc.selection, 1, paths);
        if (paths.length < 1) {
            throw new Error('请先选择路径对象');
        }

        var layer = doc.activeLayer;
        if (layer.locked || !layer.visible) layer = paths[0].layer;
        if (layer.locked) layer.locked = false;
        if (!layer.visible) layer.visible = true;

        for (var i = 0; i < paths.length; i++) {
            var pathLengthPt = getPathLength(paths[i], useNativeProperty, divNum);
            totalLengthPt += pathLengthPt;

            var displayLength = convertPtLength(pathLengthPt, unit) * scale;
            writeResultAsText(
                layer,
                formatNumber(displayLength, digit) + unit,
                fontName,
                fontSize,
                findCenter(paths[i]),
                results
            );
        }

        if (paths.length > 1) {
            var totalDisplay = convertPtLength(totalLengthPt, unit) * scale;
            var totalPos = findCenter(paths[paths.length - 1]);
            totalPos[1] -= fontSize;
            writeResultAsText(
                layer,
                '所有路径总长度: ' + formatNumber(totalDisplay, digit) + unit,
                fontName,
                fontSize,
                totalPos,
                results
            );
        }

        doc.selection = results.concat(paths);
        return {
            annotated: paths.length,
            unit: unit,
            scale: scale,
            digit: digit
        };
    }

    try {
        var result = measurePathLength();
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
