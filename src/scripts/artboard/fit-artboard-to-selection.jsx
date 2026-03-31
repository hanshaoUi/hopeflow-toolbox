/**
 * 画板适应选区 - Fit Artboard to Selection
 * Resizes the active artboard to fit selected objects with optional padding.
 * Args: { padding?: number }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var inputPadding = args.padding || 0;
    var unit = $.hopeflow.utils.getRulerUnitsString();
    var padding = new UnitValue(inputPadding, unit).as("pt");
    var bounds = $.hopeflow.utils.getBounds(sel);

    var doc = app.activeDocument;
    var idx = doc.artboards.getActiveArtboardIndex();
    var ab = doc.artboards[idx];

    ab.artboardRect = [
        bounds.left - padding,
        bounds.top + padding,
        bounds.right + padding,
        bounds.bottom - padding
    ];

    return $.hopeflow.utils.returnResult({
        width: $.hopeflow.utils.ptToMm(bounds.width + padding * 2),
        height: $.hopeflow.utils.ptToMm(bounds.height + padding * 2)
    });
})();
