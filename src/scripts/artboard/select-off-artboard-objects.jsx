/**
 * 选择画板外对象 - Select Off-Artboard Objects
 * Selects objects outside all artboards, or reverses to select inside objects.
 * Args: { mode?: 'outside'|'inside', matchMode?: 'center'|'overlap' }
 */
(function () {
    if (!$.hopeflow) return;

    function isTopLevelSelectable(item) {
        if (!item || item.locked || item.hidden) return false;
        if (item.guides) return false;
        if (!item.editable) return false;
        if (!item.layer || item.layer.locked || !item.layer.visible) return false;

        var parentType = item.parent && item.parent.typename;
        return parentType !== 'GroupItem' && parentType !== 'CompoundPathItem';
    }

    function pointInRect(x, y, rect) {
        return x >= rect[0] && x <= rect[2] && y <= rect[1] && y >= rect[3];
    }

    function overlaps(bounds, rect) {
        return bounds[0] < rect[2] &&
            bounds[2] > rect[0] &&
            bounds[3] < rect[1] &&
            bounds[1] > rect[3];
    }

    function isInsideAnyArtboard(bounds, doc, matchMode) {
        var i;

        if (matchMode === 'center') {
            var centerX = (bounds[0] + bounds[2]) / 2;
            var centerY = (bounds[1] + bounds[3]) / 2;

            for (i = 0; i < doc.artboards.length; i++) {
                if (pointInRect(centerX, centerY, doc.artboards[i].artboardRect)) {
                    return true;
                }
            }
            return false;
        }

        for (i = 0; i < doc.artboards.length; i++) {
            if (overlaps(bounds, doc.artboards[i].artboardRect)) {
                return true;
            }
        }
        return false;
    }

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('当前没有打开的文档');
        }

        var doc = app.activeDocument;
        if (!doc.artboards || doc.artboards.length === 0) {
            return $.hopeflow.utils.returnError('当前文档没有画板');
        }

        var args = $.hopeflow.utils.getArgs();
        var mode = args.mode || 'outside';
        var matchMode = args.matchMode || 'center';
        var selected = [];
        var i;

        doc.selection = null;

        for (i = 0; i < doc.pageItems.length; i++) {
            var item = doc.pageItems[i];
            if (!isTopLevelSelectable(item)) continue;

            var bounds = item.visibleBounds || item.geometricBounds;
            var inside = isInsideAnyArtboard(bounds, doc, matchMode);
            var shouldSelect = mode === 'inside' ? inside : !inside;

            if (shouldSelect) {
                item.selected = true;
                selected.push(item);
            }
        }

        return $.hopeflow.utils.returnResult({
            selected: selected.length,
            mode: mode,
            matchMode: matchMode,
            artboards: doc.artboards.length
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
