/**
 * 多图层选择器 - Multi Layer Selector
 * Selects objects from one or more layer names.
 * Args: { layerNames?: string[], includeLockedLayers?: boolean, includeHiddenLayers?: boolean }
 */
(function () {
    if (!$.hopeflow) return;

    function findLayerByName(doc, name) {
        for (var i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === name) {
                return doc.layers[i];
            }
        }
        return null;
    }

    function canSelectItem(item, includeLockedLayers, includeHiddenLayers) {
        if (!item) return false;
        if (!includeLockedLayers && item.locked) return false;
        if (!includeHiddenLayers && item.hidden) return false;
        if (item.guides) return false;
        return !!item.editable;
    }

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('当前没有打开的文档');
        }

        var doc = app.activeDocument;
        var args = $.hopeflow.utils.getArgs();
        var names = args.layerNames || [];
        var includeLockedLayers = args.includeLockedLayers === true;
        var includeHiddenLayers = args.includeHiddenLayers === true;

        if (!names || !names.length) {
            return $.hopeflow.utils.returnError('请至少选择一个图层');
        }

        doc.selection = null;

        var selectedCount = 0;
        var matchedLayers = 0;
        var missing = [];

        for (var i = 0; i < names.length; i++) {
            var layer = findLayerByName(doc, names[i]);
            if (!layer) {
                missing.push(names[i]);
                continue;
            }

            if (!includeLockedLayers && layer.locked) continue;
            if (!includeHiddenLayers && !layer.visible) continue;

            matchedLayers++;

            for (var j = 0; j < layer.pageItems.length; j++) {
                var item = layer.pageItems[j];
                if (!canSelectItem(item, includeLockedLayers, includeHiddenLayers)) continue;
                item.selected = true;
                selectedCount++;
            }
        }

        return $.hopeflow.utils.returnResult({
            layers: matchedLayers,
            selected: selectedCount,
            missing: missing
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
