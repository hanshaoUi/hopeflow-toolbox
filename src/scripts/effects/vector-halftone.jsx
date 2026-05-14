/**
 * Vector Halftone Gen - panelized Nobu Design script.
 * Args: width, height, shape, mode, density, ratio, gradientAngle, patternRotation, randomRemove, seed
 */
(function () {
    if (!$.hopeflow) return;

    function num(value, fallback) {
        var n = parseFloat(value);
        return isNaN(n) ? fallback : n;
    }

    function intNum(value, fallback) {
        var n = parseInt(value, 10);
        return isNaN(n) ? fallback : n;
    }

    function docUnit() {
        return $.hopeflow.utils.getRulerUnitsString() || 'pt';
    }

    function unitToPt(value, fallback) {
        var n = num(value, fallback);
        try {
            return new UnitValue(n, docUnit()).as('pt');
        } catch (e) {
            return n;
        }
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function organicNoise(x, y) {
        var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
        return n - Math.floor(n);
    }

    function black() {
        var c = new RGBColor();
        c.red = 0;
        c.green = 0;
        c.blue = 0;
        return c;
    }

    try {
        var args = $.hopeflow.utils.getArgs();

        if (args.shouldUndo === true || args.shouldUndo === 'true') {
            try { app.undo(); } catch (undoError) {}
        }

        if (args.clearOnly === true || args.clearOnly === 'true') {
            return $.hopeflow.utils.returnResult({
                message: '已清理预览',
                count: 0
            });
        }

        if (app.documents.length < 1) throw new Error('请先打开 Illustrator 文档');

        var doc = app.activeDocument;
        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var rect = ab.artboardRect;
        var abW = Math.abs(rect[2] - rect[0]);
        var abH = Math.abs(rect[1] - rect[3]);

        var w = Math.max(1, unitToPt(args.width, abW));
        var h = Math.max(1, unitToPt(args.height, abH));
        var shape = String(args.shape || 'circle');
        var mode = String(args.mode || 'linear');
        var density = Math.max(2, intNum(args.density, 30));
        var ratio = clamp(num(args.ratio, 0.8), 0.01, 3);
        var gradAngle = num(args.gradientAngle, 90);
        var pattRotation = num(args.patternRotation, 0);
        var randomRemove = clamp(num(args.randomRemove, 0), 0, 95);
        var seed = num(args.seed, 1);
        var maxItems = Math.max(1, intNum(args.maxItems, 8000));

        var centerX = (rect[0] + rect[2]) / 2;
        var centerY = (rect[1] + rect[3]) / 2;
        var spacing = w / density;
        var estimated = Math.ceil((Math.max(w, h) * 2 / spacing) * (Math.max(w, h) * 2 / spacing));
        if (estimated > maxItems * 2) {
            throw new Error('半调点数量可能过大，请降低密度或缩小区域。');
        }

        var group = doc.activeLayer.groupItems.add();
        group.name = 'Nobu 矢量半调';

        var gRad = (gradAngle - 90) * Math.PI / 180;
        var gDirX = Math.cos(gRad);
        var gDirY = Math.sin(gRad);
        var pRad = pattRotation * Math.PI / 180;
        var cosP = Math.cos(pRad);
        var sinP = Math.sin(pRad);
        var limit = Math.max(w, h) * 2;
        var fill = black();
        var made = 0;

        for (var i = -limit / 2; i < limit / 2; i += spacing) {
            for (var j = -limit / 2; j < limit / 2; j += spacing) {
                if (randomRemove > 0) {
                    var nVal = organicNoise((i + seed) / 40.0, (j + seed) / 40.0);
                    if (nVal < randomRemove / 100) continue;
                }

                var posX = centerX + (i * cosP - j * sinP);
                var posY = centerY + (i * sinP + j * cosP);
                if (posX < centerX - w / 2 || posX > centerX + w / 2 || posY > centerY + h / 2 || posY < centerY - h / 2) continue;

                var factor = 0;
                if (mode === 'radial') {
                    var maxDist = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h / 2, 2));
                    var dist = Math.sqrt(Math.pow(posX - centerX, 2) + Math.pow(posY - centerY, 2));
                    factor = 1 - (dist / maxDist);
                } else {
                    var relX = posX - centerX;
                    var relY = posY - centerY;
                    var projection = (relX * gDirX + relY * gDirY);
                    var maxProj = (w / 2 * Math.abs(gDirX) + h / 2 * Math.abs(gDirY));
                    factor = (projection + maxProj) / (maxProj * 2);
                }

                factor = clamp(factor, 0, 1);
                var size = spacing * ratio * factor;
                if (size < 0.2) continue;
                if (made >= maxItems) throw new Error('已达到 ' + maxItems + ' 个半调点上限，请降低密度。');

                var item = shape === 'square'
                    ? group.pathItems.rectangle(posY + size / 2, posX - size / 2, size, size)
                    : group.pathItems.ellipse(posY + size / 2, posX - size / 2, size, size);
                if (shape === 'square') item.rotate(pattRotation);
                item.filled = true;
                item.stroked = false;
                item.fillColor = fill;
                made++;
            }
        }

        app.redraw();
        return $.hopeflow.utils.returnResult({
            created: made,
            message: (args.preview === true || args.preview === 'true' ? '已预览 ' : '已生成 ') + made + ' 个半调点'
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(e.message || String(e));
    }
})();
