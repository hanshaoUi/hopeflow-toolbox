/**
 * 从选区创建画板 - Create Artboards from Selection
 * Creates a new artboard for each selected object.
 * Args: { padding?: number }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var inputPadding = args.padding !== undefined ? args.padding : 0;

    var unit = $.hopeflow.utils.getRulerUnitsString();
    var padding = new UnitValue(inputPadding, unit).as("pt");

    var doc = app.activeDocument;
    var count = 0;

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        var bounds = item.visibleBounds;

        var rect = [
            bounds[0] - padding,
            bounds[1] + padding,
            bounds[2] + padding,
            bounds[3] - padding
        ];

        doc.artboards.add(rect);
        count++;
    }

    return $.hopeflow.utils.returnResult({ created: count });
})();
