/**
 * 创建正多边形 - Create Polygon
 * Creates a regular polygon.
 * Args: { sides: number, radius: number }
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var sides = args.sides || 6;
    var inputRadius = args.radius || 50;

    var unit = $.hopeflow.utils.getRulerUnitsString();
    var radius = new UnitValue(inputRadius, unit).as('pt');

    var doc = app.activeDocument;

    // Calculate center based on view center or artboard center
    var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var abRect = ab.artboardRect; // L, T, R, B
    var cx = (abRect[0] + abRect[2]) / 2;
    var cy = (abRect[1] + abRect[3]) / 2;
    var top = cy + radius;
    var left = cx - radius;

    // doc.pathItems.polygon(centerX, centerY, radius, sides)
    // AI API: polygon(centerX, centerY, radius, sides, reversed?)
    // Note: AI coordinates Y increases UP. But polygon API usually expects center.
    // Let's try standard API.

    var poly = doc.pathItems.polygon(cx, cy, radius, sides);

    return $.hopeflow.utils.returnResult({ created: 1, type: 'polygon' });
})();
