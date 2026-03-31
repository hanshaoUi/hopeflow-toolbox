/**
 * 读取图层列表 - List Layers
 * Returns current document layer names for panel suggestions.
 */
(function () {
    if (!$.hopeflow) return;

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('当前没有打开的文档');
        }

        var doc = app.activeDocument;
        var layers = [];
        var seen = {};

        for (var i = 0; i < doc.layers.length; i++) {
            var name = String(doc.layers[i].name || '');
            if (name && !seen[name]) {
                seen[name] = true;
                layers.push(name);
            }
        }

        return $.hopeflow.utils.returnResult({
            layers: layers,
            total: layers.length
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
