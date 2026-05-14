/**
 * Hexagon Grid Gen - panelized Nobu Design script.
 * Args: radius, orientation, autoFill, rows, columns, scatter, addIsometric, seed, maxItems
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

    function seededRandom(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function black() {
        var c = new RGBColor();
        c.red = 0;
        c.green = 0;
        c.blue = 0;
        return c;
    }

    function createHexGrid(doc, args) {
        var radius = Math.max(1, unitToPt(args.radius, 50));
        var isPointy = String(args.orientation || 'flat') === 'pointy';
        var autoFill = args.autoFill !== false;
        var scatter = Math.max(0, Math.min(100, num(args.scatter, 0)));
        var useIso = args.addIsometric === true;
        var maxItems = Math.max(1, intNum(args.maxItems, 3000));
        var seed = num(args.seed, 1);

        var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var ab = artboard.artboardRect;
        var abWidth = Math.abs(ab[2] - ab[0]);
        var abHeight = Math.abs(ab[1] - ab[3]);
        var rows;
        var cols;

        if (autoFill) {
            if (isPointy) {
                cols = Math.ceil(abWidth / (Math.sqrt(3) * radius)) + 1;
                rows = Math.ceil(abHeight / (radius * 1.5)) + 1;
            } else {
                cols = Math.ceil(abWidth / (radius * 1.5)) + 1;
                rows = Math.ceil(abHeight / (Math.sqrt(3) * radius)) + 1;
            }
        } else {
            rows = Math.max(1, intNum(args.rows, 10));
            cols = Math.max(1, intNum(args.columns, 10));
        }

        if (rows * cols > maxItems) {
            throw new Error('预计生成 ' + (rows * cols) + ' 个单元，超过上限 ' + maxItems + '。请增大半径或降低行列数。');
        }

        var group = doc.activeLayer.groupItems.add();
        group.name = 'Nobu 六边形网格';

        var hDist = isPointy ? Math.sqrt(3) * radius : radius * 1.5;
        var vDist = isPointy ? radius * 1.5 : Math.sqrt(3) * radius;
        var stroke = black();
        var made = 0;
        var localSeed = seed;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                if (seededRandom(localSeed++) * 100 < scatter) continue;

                var xPos = c * hDist;
                var yPos = r * vDist;
                if (isPointy) {
                    if (r % 2 === 1) xPos += hDist / 2;
                } else if (c % 2 === 1) {
                    yPos += vDist / 2;
                }

                var cellGroup = group.groupItems.add();
                var hex = cellGroup.pathItems.polygon(0, 0, radius, 6);
                if (isPointy) hex.rotate(30);
                hex.position = [xPos, -yPos];
                hex.filled = false;
                hex.stroked = true;
                hex.strokeColor = stroke;
                hex.strokeWidth = Math.max(0.1, unitToPt(args.strokeWidth, 1));

                if (useIso) {
                    var points = hex.pathPoints;
                    for (var i = 0; i < 3; i++) {
                        var line = cellGroup.pathItems.add();
                        line.setEntirePath([points[i].anchor, points[i + 3].anchor]);
                        line.filled = false;
                        line.stroked = true;
                        line.strokeColor = stroke;
                        line.strokeWidth = Math.max(0.1, hex.strokeWidth * 0.5);
                    }
                }
                made++;
            }
        }

        var abCenterX = (ab[0] + ab[2]) / 2;
        var abCenterY = (ab[1] + ab[3]) / 2;
        group.position = [abCenterX - (group.width / 2), abCenterY + (group.height / 2)];

        return { group: group, count: made, rows: rows, columns: cols };
    }

    try {
        var rawArgs = $.hopeflow.utils.getArgs();

        if (rawArgs.shouldUndo === true || rawArgs.shouldUndo === 'true') {
            try { app.undo(); } catch (undoError) {}
        }

        if (rawArgs.clearOnly === true || rawArgs.clearOnly === 'true') {
            return $.hopeflow.utils.returnResult({
                message: '已清理预览',
                count: 0
            });
        }

        if (app.documents.length < 1) throw new Error('请先打开 Illustrator 文档');
        var result = createHexGrid(app.activeDocument, rawArgs);
        app.redraw();
        return $.hopeflow.utils.returnResult({
            created: result.count,
            message: (rawArgs.preview === true || rawArgs.preview === 'true' ? '已预览 ' : '已生成 ') + result.count + ' 个六边形单元'
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(e.message || String(e));
    }
})();
