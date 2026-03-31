/**
 * 创建边界线 (Create Boundary / Die Cut)
 * Ported from run2.json
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var padding = parseFloat(args.padding);
    if (isNaN(padding)) padding = 0;
    
    var layerName = args.layerName || "矩形";

    if (app.documents.length === 0) return $.hopeflow.utils.returnError('无文档打开');
    
    var doc = app.activeDocument;
    var selection = doc.selection;
    var rate = 2.83464567; // 1mm = 2.83464567pt

    // Helper: FXGetBounds
    function FXGetBounds(item) {
        var bounds = item.visibleBounds; // [left, top, right, bottom]
        return {
            left: bounds[0],
            top: bounds[1],
            right: bounds[2],
            bottom: bounds[3],
            width: bounds[2] - bounds[0],
            height: bounds[1] - bounds[3]
        };
    }

    // Helper: getOrCreateLayer
    function getOrCreateLayer(doc, layerName) {
        try {
            return doc.layers.getByName(layerName);
        } catch (e) {
            var newLayer = doc.layers.add();
            newLayer.name = layerName;
            return newLayer;
        }
    }

    // Helper: createOrGetSpotColor
    function createOrGetSpotColor(doc, spotName, cyan, magenta, yellow, black) {
        var spot;
        try {
            spot = doc.spots.getByName(spotName);
        } catch (e) {
            spot = doc.spots.add();
            spot.name = spotName;
            var cmykColor = new CMYKColor();
            cmykColor.cyan = cyan;
            cmykColor.magenta = magenta;
            cmykColor.yellow = yellow;
            cmykColor.black = black;
            spot.colorType = ColorModel.SPOT;
            spot.color = cmykColor;
        }
        var color = new SpotColor();
        color.spot = spot;
        color.tint = 100;
        return color;
    }

    var layer = getOrCreateLayer(doc, layerName);
    doc.activeLayer = layer;
    var spotColor = createOrGetSpotColor(doc, "tumo_rect_each", 100, 0, 0, 0);

    var count = 0;

    if (selection.length === 0) {
        // No selection -> Create for active artboard
        var idx = doc.artboards.getActiveArtboardIndex();
        var artboardRect = doc.artboards[idx].artboardRect; // [left, top, right, bottom]
        
        var left = artboardRect[0];
        var top = artboardRect[1];
        var width = artboardRect[2] - artboardRect[0];
        var height = artboardRect[1] - artboardRect[3];

        // padding apply
        // top increases, left decreases, width/height increase by 2*padding
        var newTop = top + padding * rate;
        var newLeft = left - padding * rate;
        var newWidth = width + padding * rate * 2;
        var newHeight = height + padding * rate * 2;

        var rect = doc.pathItems.rectangle(newTop, newLeft, newWidth, newHeight);
        rect.filled = false;
        rect.stroked = true;
        rect.strokeWidth = 0.5; // 0.176mm? approx 0.5pt
        rect.strokeColor = spotColor;
        rect.move(layer, ElementPlacement.PLACEATBEGINNING);
        count = 1;
    } else {
        // Selection -> Create for each item
        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            var bounds = FXGetBounds(item);
            
            var newTop = bounds.top + padding * rate;
            var newLeft = bounds.left - padding * rate;
            var newWidth = bounds.width + padding * rate * 2;
            var newHeight = bounds.height + padding * rate * 2;

            var rect = doc.pathItems.rectangle(newTop, newLeft, newWidth, newHeight);
            rect.filled = false;
            rect.stroked = true;
            rect.strokeWidth = 0.5;
            rect.strokeColor = spotColor;
            rect.move(layer, ElementPlacement.PLACEATBEGINNING);
        }
        count = selection.length;
    }

    return $.hopeflow.utils.returnResult({ message: '已创建 ' + count + ' 个边界线', count: count });
})();
