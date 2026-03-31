/**
 * 创建网格 - Create Grid
 * Creates a grid of rectangles or guides.
 * Args: { rows: number, cols: number, width: number, height: number, gapX?: number, gapY?: number, type?: 'rectangles'|'guides' }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var rows = args.rows || 3;
    var cols = args.cols || 3;
    var cellW = $.hopeflow.utils.mmToPt(args.width || 50);
    var cellH = $.hopeflow.utils.mmToPt(args.height || 50);
    var gapX = $.hopeflow.utils.mmToPt(args.gapX || 5);
    var gapY = $.hopeflow.utils.mmToPt(args.gapY || 5);
    var type = args.type || 'rectangles';

    var doc = app.activeDocument;
    var ab = $.hopeflow.utils.getActiveArtboardBounds();
    var startX = ab.left + 20;
    var startY = ab.top - 20;

    var layer = $.hopeflow.utils.getOrCreateLayer('Grid');
    var created = 0;

    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var x = startX + c * (cellW + gapX);
            var y = startY - r * (cellH + gapY);

            if (type === 'rectangles') {
                var rect = layer.pathItems.rectangle(y, x, cellW, cellH);
                rect.filled = false;
                rect.stroked = true;
                rect.strokeWidth = 0.5;
                created++;
            }
        }
    }

    return $.hopeflow.utils.returnResult({ created: created, rows: rows, cols: cols });
})();
