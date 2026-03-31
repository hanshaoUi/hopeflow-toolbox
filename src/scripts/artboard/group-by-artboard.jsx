/**
 * 按画板分组对象 - Group By Artboard
 * Groups top-level page items into per-artboard groups.
 * Args: { target?: 'current'|'all'|'custom', artboards?: string, nameMode?: 'artboard-name'|'artboard-index', prefix?: string }
 */
(function () {
    if (!$.hopeflow) return;

    function parseArtboardSpec(spec, maxCount) {
        var raw = String(spec || '').replace(/\s+/g, '');
        if (!raw) {
            throw new Error('请填写画板编号，例如 1,3,5-8');
        }

        var indices = {};
        var parts = raw.split(',');
        var i;

        for (i = 0; i < parts.length; i++) {
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
                    var temp = start;
                    start = end;
                    end = temp;
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
        var target = args.target || 'all';
        var i;

        if (target === 'current') {
            return [doc.artboards.getActiveArtboardIndex()];
        }

        if (target === 'custom') {
            return parseArtboardSpec(args.artboards, doc.artboards.length);
        }

        var result = [];
        for (i = 0; i < doc.artboards.length; i++) {
            result.push(i);
        }
        return result;
    }

    function isTopLevelSelectable(item) {
        if (!item || item.locked || item.hidden) return false;
        if (item.guides) return false;
        if (!item.editable) return false;
        if (!item.layer || item.layer.locked || !item.layer.visible) return false;

        var parentType = item.parent && item.parent.typename;
        return parentType !== 'GroupItem' && parentType !== 'CompoundPathItem';
    }

    function pointInArtboard(x, y, rect) {
        return x >= rect[0] && x <= rect[2] && y <= rect[1] && y >= rect[3];
    }

    function overlaps(bounds, rect) {
        return bounds[0] < rect[2] &&
            bounds[2] > rect[0] &&
            bounds[3] < rect[1] &&
            bounds[1] > rect[3];
    }

    function findAssignedArtboard(bounds, targetIndexes, doc) {
        var centerX = (bounds[0] + bounds[2]) / 2;
        var centerY = (bounds[1] + bounds[3]) / 2;
        var i;

        for (i = 0; i < targetIndexes.length; i++) {
            var centerRect = doc.artboards[targetIndexes[i]].artboardRect;
            if (pointInArtboard(centerX, centerY, centerRect)) {
                return targetIndexes[i];
            }
        }

        for (i = 0; i < targetIndexes.length; i++) {
            var overlapRect = doc.artboards[targetIndexes[i]].artboardRect;
            if (overlaps(bounds, overlapRect)) {
                return targetIndexes[i];
            }
        }

        return -1;
    }

    function buildGroupName(artboard, artboardIndex, args) {
        var prefix = String(args.prefix || '');
        var nameMode = args.nameMode || 'artboard-name';

        if (nameMode === 'artboard-index') {
            return prefix + '画板 ' + (artboardIndex + 1);
        }

        return prefix + String(artboard.name || ('画板 ' + (artboardIndex + 1)));
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
        var targetIndexes = getTargetArtboardIndexes(doc, args);
        var assignments = {};
        var i;

        for (i = 0; i < targetIndexes.length; i++) {
            assignments[targetIndexes[i]] = [];
        }

        for (i = 0; i < doc.pageItems.length; i++) {
            var item = doc.pageItems[i];
            if (!isTopLevelSelectable(item)) continue;

            var bounds = item.visibleBounds || item.geometricBounds;
            var assignedIndex = findAssignedArtboard(bounds, targetIndexes, doc);

            if (assignedIndex >= 0) {
                assignments[assignedIndex].push(item);
            }
        }

        doc.selection = null;

        var createdGroups = [];
        var totalItems = 0;

        for (i = 0; i < targetIndexes.length; i++) {
            var artboardIndex = targetIndexes[i];
            var items = assignments[artboardIndex];

            if (!items || items.length === 0) {
                continue;
            }

            var group = items[0].layer.groupItems.add();
            group.name = buildGroupName(doc.artboards[artboardIndex], artboardIndex, args);

            for (var j = items.length - 1; j >= 0; j--) {
                items[j].moveToBeginning(group);
            }

            createdGroups.push(group);
            totalItems += items.length;
        }

        for (i = 0; i < createdGroups.length; i++) {
            createdGroups[i].selected = true;
        }

        return $.hopeflow.utils.returnResult({
            groups: createdGroups.length,
            items: totalItems,
            artboards: targetIndexes.length
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
