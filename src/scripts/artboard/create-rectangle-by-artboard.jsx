/**
 * 按画板创建矩形 - Create Rectangle by Artboard
 * Creates a rectangle matching each artboard's bounds
 */
(function () {
    if (!$.hopeflow) return;

    var doc = app.activeDocument;
    var artboards = doc.artboards;

    if (artboards.length === 0) {
        return $.hopeflow.utils.returnError('当前文档没有画板');
    }

    var count = 0;
    for (var i = 0; i < artboards.length; i++) {
        var ab = artboards[i];
        var rect = ab.artboardRect; // [left, top, right, bottom]

        var top = rect[1];
        var left = rect[0];
        var width = rect[2] - rect[0];
        var height = rect[1] - rect[3];

        doc.pathItems.rectangle(top, left, width, height);
        count++;
    }

    return $.hopeflow.utils.returnResult({ created: count });
})();
