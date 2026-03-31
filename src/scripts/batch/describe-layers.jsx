/**
 * 图层概览 - Describe Layers
 * Returns layer names, lock/visibility state and item counts for the current document.
 */
(function () {
    if (!$.hopeflow) return;

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('当前没有打开的文档');
        }

        var doc = app.activeDocument;
        var layers = [];

        for (var i = 0; i < doc.layers.length; i++) {
            var layer = doc.layers[i];
            layers.push({
                name: String(layer.name || ''),
                locked: !!layer.locked,
                visible: !!layer.visible,
                itemCount: layer.pageItems ? layer.pageItems.length : 0
            });
        }

        return $.hopeflow.utils.returnResult({
            layers: layers,
            total: layers.length
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
