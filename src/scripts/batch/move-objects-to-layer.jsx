/**
 * 移动对象到图层 - Move Objects To Layer
 * Moves or duplicates selected top-level objects to a target layer.
 * Args: { layerName: string, action?: 'move'|'copy', createIfMissing?: boolean, unlockTargetLayer?: boolean, showTargetLayer?: boolean }
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

    function getTargetLayer(doc, args) {
        var layerName = String(args.layerName || '');
        if (!layerName) {
            throw new Error('请填写目标图层名');
        }

        var layer = findLayerByName(doc, layerName);
        if (!layer) {
            if (!args.createIfMissing) {
                throw new Error('目标图层不存在: ' + layerName);
            }
            layer = doc.layers.add();
            layer.name = layerName;
        }

        if (args.unlockTargetLayer !== false) {
            layer.locked = false;
        }
        if (args.showTargetLayer !== false) {
            layer.visible = true;
        }

        return layer;
    }

    function isMovable(item) {
        if (!item || item.locked || item.hidden) return false;
        if (!item.editable) return false;
        if (item.guides) return false;
        return true;
    }

    function moveToLayer(item, layer) {
        try {
            item.move(layer, ElementPlacement.PLACEATBEGINNING);
        } catch (e) {
            item.moveToBeginning(layer);
        }
    }

    function duplicateToLayer(item, layer) {
        var copy = item.duplicate();
        try {
            copy.move(layer, ElementPlacement.PLACEATBEGINNING);
        } catch (e) {
            copy.moveToBeginning(layer);
        }
        return copy;
    }

    try {
        var selection = $.hopeflow.utils.requireSelection(1);
        if (!selection) return $.hopeflow.utils.returnError('无选择');

        var doc = app.activeDocument;
        var args = $.hopeflow.utils.getArgs();
        var action = args.action || 'move';
        var targetLayer = getTargetLayer(doc, args);
        var items = [];
        var i;

        for (i = 0; i < selection.length; i++) {
            if (isMovable(selection[i])) {
                items.push(selection[i]);
            }
        }

        if (!items.length) {
            return $.hopeflow.utils.returnError('没有可处理的对象');
        }

        doc.selection = null;

        var processed = 0;
        var createdCopies = [];

        for (i = 0; i < items.length; i++) {
            var item = items[i];

            if (action === 'copy') {
                createdCopies.push(duplicateToLayer(item, targetLayer));
            } else {
                moveToLayer(item, targetLayer);
            }
            processed++;
        }

        if (action === 'copy') {
            for (i = 0; i < createdCopies.length; i++) {
                createdCopies[i].selected = true;
            }
        } else {
            for (i = 0; i < items.length; i++) {
                items[i].selected = true;
            }
        }

        return $.hopeflow.utils.returnResult({
            action: action,
            processed: processed,
            targetLayer: targetLayer.name
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
