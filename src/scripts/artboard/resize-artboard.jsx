/**
 * 调整画板大小 - Resize Artboard
 * Resize artboard to specific dimensions or standard sizes.
 * Args: { width?: number, height?: number, preset?: string, unit?: 'mm'|'px'|'in' }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var doc = app.activeDocument;
    var idx = doc.artboards.getActiveArtboardIndex();
    var ab = doc.artboards[idx];
    var rect = ab.artboardRect;

    var presets = {
        'A4': { w: 210, h: 297 },
        'A3': { w: 297, h: 420 },
        'A5': { w: 148, h: 210 },
        'B5': { w: 176, h: 250 },
        'Letter': { w: 215.9, h: 279.4 },
        'Business Card': { w: 90, h: 54 }
    };

    var widthPt, heightPt;

    if (args.preset && presets[args.preset]) {
        widthPt = $.hopeflow.utils.mmToPt(presets[args.preset].w);
        heightPt = $.hopeflow.utils.mmToPt(presets[args.preset].h);
    } else {
        var unit = args.unit || 'mm';
        var w = args.width || $.hopeflow.utils.ptToMm(rect[2] - rect[0]);
        var h = args.height || $.hopeflow.utils.ptToMm(rect[1] - rect[3]);

        if (unit === 'mm') {
            widthPt = $.hopeflow.utils.mmToPt(w);
            heightPt = $.hopeflow.utils.mmToPt(h);
        } else if (unit === 'in') {
            widthPt = $.hopeflow.utils.inchToPt(w);
            heightPt = $.hopeflow.utils.inchToPt(h);
        } else {
            widthPt = $.hopeflow.utils.ptToPx(w) * (72 / 96);
            heightPt = $.hopeflow.utils.ptToPx(h) * (72 / 96);
        }
    }

    // Center the resize around current center
    var cx = (rect[0] + rect[2]) / 2;
    var cy = (rect[1] + rect[3]) / 2;

    ab.artboardRect = [
        cx - widthPt / 2,
        cy + heightPt / 2,
        cx + widthPt / 2,
        cy - heightPt / 2
    ];

    return $.hopeflow.utils.returnResult({
        width: $.hopeflow.utils.ptToMm(widthPt),
        height: $.hopeflow.utils.ptToMm(heightPt)
    });
})();
