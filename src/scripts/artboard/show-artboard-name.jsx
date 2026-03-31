/**
 * 显示画板名称 - Show Artboard Name
 * Creates a text frame showing the target artboard's name and size
 */
(function () {
    if (!$.hopeflow) return;

    var doc = app.activeDocument;
    var artboards = doc.artboards;

    if (artboards.length === 0) {
        return $.hopeflow.utils.returnError('当前文档没有画板');
    }

    var args = $.hopeflow.utils.getArgs();
    var target = args.target || 'all'; // 'current' or 'all'

    var count = 0;
    var unit = $.hopeflow.utils.getRulerUnitsString();

    // Set black fill
    var blackColor = new RGBColor();
    blackColor.red = 0;
    blackColor.green = 0;
    blackColor.blue = 0;

    function processArtboard(ab) {
        var abName = ab.name;
        var rect = ab.artboardRect;

        // Calculate size
        var width = Math.abs(rect[2] - rect[0]);
        var height = Math.abs(rect[1] - rect[3]);

        var unitValWidth = new UnitValue(width, 'pt');
        var dispWidth = Math.round(unitValWidth.as(unit));

        var unitValHeight = new UnitValue(height, 'pt');
        var dispHeight = Math.round(unitValHeight.as(unit));

        // Create text frame
        var textFrame = doc.textFrames.add();
        textFrame.contents = abName + '\r' + dispWidth + unit + ' × ' + dispHeight + unit;

        // Set text properties
        textFrame.textRange.characterAttributes.size = 24;
        textFrame.textRange.characterAttributes.fillColor = blackColor;

        // Position OUTSIDE artboard - above and to the left
        textFrame.top = rect[1] + 50; // Above the artboard (Y increases upward in AI)
        textFrame.left = rect[0]; // Align with left edge

        count++;
    }

    if (target === 'all') {
        for (var i = 0; i < artboards.length; i++) {
            processArtboard(artboards[i]);
        }
    } else {
        var activeIndex = artboards.getActiveArtboardIndex();
        processArtboard(artboards[activeIndex]);
    }

    return $.hopeflow.utils.returnResult({
        processed: count,
        target: target
    });
})();
