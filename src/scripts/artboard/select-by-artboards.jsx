/**
 * 按画板选择对象 - Select By Artboards
 * Select page items that overlap or are fully inside one or more artboards.
 * Args: { target?: 'current'|'all'|'custom', artboards?: string, matchMode?: 'overlap'|'inside' }
 */
(function () {
    if (!$.hopeflow) return;

    function overlaps(itemRect, artboardRect) {
        return itemRect[0] < artboardRect[2] &&
            itemRect[2] > artboardRect[0] &&
            itemRect[3] < artboardRect[1] &&
            itemRect[1] > artboardRect[3];
    }

    function fullyInside(itemRect, artboardRect) {
        return itemRect[0] >= artboardRect[0] &&
            itemRect[2] <= artboardRect[2] &&
            itemRect[1] <= artboardRect[1] &&
            itemRect[3] >= artboardRect[3];
    }

    function parseArtboardSpec(spec, maxCount) {
        var raw = String(spec || '').replace(/\s+/g, '');
        if (!raw) {
            throw new Error('请填写画板编号，例如 1,3,5-8');
        }

        var indices = {};
        var parts = raw.split(',');
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (!part) continue;

            if (part.indexOf('-') >= 0) {
                var range = part.split('-');
                if (range.length !== 2) {
                    throw new Error('画板范围格式无效: ' + part);
                }

                var start = parseInt(range[0], 10);
                var end = parseInt(range[1], 10);
                if (isNaN(start) || isNaN(end)) {
                    throw new Error('画板范围格式无效: ' + part);
                }
                if (start > end) {
                    var tmp = start;
                    start = end;
                    end = tmp;
                }

                for (var n = start; n <= end; n++) {
                    if (n < 1 || n > maxCount) {
                        throw new Error('画板编号超出范围: ' + n);
                    }
                    indices[n - 1] = true;
                }
            } else {
                var index = parseInt(part, 10);
                if (isNaN(index)) {
                    throw new Error('画板编号格式无效: ' + part);
                }
                if (index < 1 || index > maxCount) {
                    throw new Error('画板编号超出范围: ' + index);
                }
                indices[index - 1] = true;
            }
        }

        var result = [];
        for (var key in indices) {
            if (indices.hasOwnProperty(key)) {
                result.push(parseInt(key, 10));
            }
        }
        result.sort(function (a, b) { return a - b; });
        return result;
    }

    function getTargetArtboardIndexes(doc, args) {
        var target = args.target || 'current';
        if (target === 'all') {
            var all = [];
            for (var i = 0; i < doc.artboards.length; i++) {
                all.push(i);
            }
            return all;
        }
        if (target === 'custom') {
            return parseArtboardSpec(args.artboards, doc.artboards.length);
        }
        return [doc.artboards.getActiveArtboardIndex()];
    }

    function isTopLevelSelectable(item) {
        if (item.locked || item.hidden) return false;
        if (item.guides) return false;
        if (!item.editable) return false;

        var parentType = item.parent && item.parent.typename;
        return parentType !== 'GroupItem' && parentType !== 'CompoundPathItem';
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
        var mode = args.matchMode || 'overlap';
        var artboardIndexes = getTargetArtboardIndexes(doc, args);

        doc.selection = null;

        var selected = [];
        for (var i = 0; i < doc.pageItems.length; i++) {
            var item = doc.pageItems[i];
            if (!isTopLevelSelectable(item)) continue;

            var bounds = item.visibleBounds || item.geometricBounds;
            var matched = false;

            for (var j = 0; j < artboardIndexes.length; j++) {
                var artboardRect = doc.artboards[artboardIndexes[j]].artboardRect;
                if (mode === 'inside' ? fullyInside(bounds, artboardRect) : overlaps(bounds, artboardRect)) {
                    matched = true;
                    break;
                }
            }

            if (matched) {
                item.selected = true;
                selected.push(item);
            }
        }

        var selectedNames = [];
        for (var k = 0; k < artboardIndexes.length; k++) {
            selectedNames.push(doc.artboards[artboardIndexes[k]].name || ('画板 ' + (artboardIndexes[k] + 1)));
        }

        return $.hopeflow.utils.returnResult({
            selected: selected.length,
            artboards: artboardIndexes.length,
            artboardIndexes: artboardIndexes,
            artboardNames: selectedNames,
            matchMode: mode
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
