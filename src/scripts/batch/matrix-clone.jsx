/**
 * 矩阵克隆 - Matrix Clone
 * Clone objects in a matrix pattern (rows x columns)
 * Args: [rows, cols, rowGap, colGap]
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var rows   = (args && args.rows   !== undefined) ? parseInt(args.rows)    : 5;
    var cols   = (args && args.cols   !== undefined) ? parseInt(args.cols)    : 10;
    var rowGap = (args && args.rowGap !== undefined) ? parseFloat(args.rowGap) : 1;
    var colGap = (args && args.colGap !== undefined) ? parseFloat(args.colGap) : 1;

    var rate = 2.83464566929133; // pt to mm conversion

    // =========================================================================
    // --- 辅助函数 ---
    // =========================================================================

    function FXGetBounds(items, hasStroke, limit) {
        limit = limit || 2000;
        var bounds = {
            left: Infinity,
            top: -Infinity,
            right: -Infinity,
            bottom: Infinity,
            maxWidth: 0,
            maxHeight: 0
        };

        if (!items) return bounds;

        function getBounds(item) {
            try {
                if (!item) return;

                if (item.typename === 'TextFrame' || item.typename === 'TextPath' || item.typename === 'TextArtItem') {
                    var textBounds = hasStroke ? item.visibleBounds : item.geometricBounds;
                    if (textBounds && textBounds.length === 4) {
                        updateBounds(textBounds);
                    }
                    return;
                }

                if (item instanceof Array) {
                    for (var j = 0; j < item.length && j < limit; j++) {
                        getBounds(item[j]);
                    }
                    return;
                }

                if (item.typename === 'GroupItem') {
                    if (item.pageItems && item.pageItems.length < limit) {
                        if (item.clipped && item.pageItems.length > 0) {
                            var firstItem = item.pageItems[0];
                            if (firstItem) {
                                var firstItemBounds = hasStroke ? firstItem.visibleBounds : firstItem.geometricBounds;
                                if (firstItemBounds && firstItemBounds.length === 4) {
                                    updateBounds(firstItemBounds);
                                }
                            }
                        } else {
                            for (var i = 0; i < item.pageItems.length; i++) {
                                getBounds(item.pageItems[i]);
                            }
                        }
                    }
                    return;
                }

                if (item.geometricBounds || item.visibleBounds) {
                    var itemBounds = hasStroke ? item.visibleBounds : item.geometricBounds;
                    if (itemBounds && itemBounds.length === 4) {
                        updateBounds(itemBounds);
                    }
                }
            } catch (e) {
                try {
                    if (items && items.geometricBounds && items.geometricBounds.length === 4) {
                        bounds = {
                            left: items.geometricBounds[0],
                            top: items.geometricBounds[1],
                            right: items.geometricBounds[2],
                            bottom: items.geometricBounds[3],
                            maxWidth: Math.abs(items.geometricBounds[2] - items.geometricBounds[0]),
                            maxHeight: Math.abs(items.geometricBounds[1] - items.geometricBounds[3])
                        };
                    }
                } catch (backupError) {}
            }
        }

        function updateBounds(itemBounds) {
            if (!itemBounds || itemBounds.length !== 4 ||
                isNaN(itemBounds[0]) || isNaN(itemBounds[1]) ||
                isNaN(itemBounds[2]) || isNaN(itemBounds[3])) {
                return;
            }

            bounds.left = Math.min(bounds.left, itemBounds[0]);
            bounds.top = Math.max(bounds.top, itemBounds[1]);
            bounds.right = Math.max(bounds.right, itemBounds[2]);
            bounds.bottom = Math.min(bounds.bottom, itemBounds[3]);
            bounds.maxWidth = Math.max(bounds.maxWidth, Math.abs(itemBounds[2] - itemBounds[0]));
            bounds.maxHeight = Math.max(bounds.maxHeight, Math.abs(itemBounds[1] - itemBounds[3]));
        }

        getBounds(items);

        if (bounds.left === Infinity || bounds.bottom === Infinity ||
            bounds.right === -Infinity || bounds.top === -Infinity) {
            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                maxWidth: 0,
                maxHeight: 0
            };
        }

        return bounds;
    }

    // =========================================================================
    // --- 主函数 ---
    // =========================================================================

    function main() {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('没有打开的文档');
        }

        var doc = app.activeDocument;
        var sel = doc.selection;

        if (!sel || sel.length !== 1) {
            return $.hopeflow.utils.returnError('请选择一个对象或编组');
        }

        var sourceItem = sel[0];
        var layer = doc.activeLayer;
        var group = layer.groupItems.add();

        var bounds = FXGetBounds(sourceItem);
        var itemWidth = bounds.right - bounds.left;
        var itemHeight = bounds.top - bounds.bottom;

        var xShift = bounds.left - sourceItem.left;
        var yShift = bounds.top - sourceItem.top;

        var rowGapPt = rowGap * rate;
        var colGapPt = colGap * rate;

        var batchSize = 10;
        var rowBatches = Math.ceil(rows / batchSize);
        var colBatches = Math.ceil(cols / batchSize);

        var batchGroup = layer.groupItems.add();

        var actualBatchRows = Math.min(batchSize, rows);
        var actualBatchCols = Math.min(batchSize, cols);

        for (var i = 0; i < actualBatchCols; i++) {
            for (var j = 0; j < actualBatchRows; j++) {
                var clone = sourceItem.duplicate();
                clone.moveToBeginning(batchGroup);
                clone.position = [
                    bounds.left - xShift + i * (itemWidth + colGapPt),
                    bounds.top - yShift - j * (itemHeight + rowGapPt)
                ];
            }
        }

        var batchWidth = actualBatchCols * itemWidth + (actualBatchCols - 1) * colGapPt;
        var batchHeight = actualBatchRows * itemHeight + (actualBatchRows - 1) * rowGapPt;

        for (var batchCol = 0; batchCol < colBatches; batchCol++) {
            for (var batchRow = 0; batchRow < rowBatches; batchRow++) {
                if (batchCol === 0 && batchRow === 0) {
                    batchGroup.moveToBeginning(group);
                    continue;
                }

                var thisRows = (batchRow < rowBatches - 1) ? batchSize : (rows % batchSize || batchSize);
                var thisCols = (batchCol < colBatches - 1) ? batchSize : (cols % batchSize || batchSize);

                if (thisRows <= 0 || thisCols <= 0) continue;

                if (thisRows === actualBatchRows && thisCols === actualBatchCols) {
                    var batchClone = batchGroup.duplicate();
                    batchClone.moveToBeginning(group);
                    batchClone.position = [
                        bounds.left - xShift + batchCol * batchSize * (itemWidth + colGapPt),
                        bounds.top - yShift - batchRow * batchSize * (itemHeight + rowGapPt)
                    ];
                } else {
                    for (var i = 0; i < thisCols; i++) {
                        for (var j = 0; j < thisRows; j++) {
                            var clone = sourceItem.duplicate();
                            clone.moveToBeginning(group);
                            clone.position = [
                                bounds.left - xShift + (batchCol * batchSize + i) * (itemWidth + colGapPt),
                                bounds.top - yShift - (batchRow * batchSize + j) * (itemHeight + rowGapPt)
                            ];
                        }
                    }
                }
            }
        }

        sourceItem.remove();

        return $.hopeflow.utils.returnResult({
            success: true,
            message: '矩阵克隆成功: ' + rows + ' 行 x ' + cols + ' 列'
        });
    }

    try {
        return main();
    } catch (e) {
        return $.hopeflow.utils.returnError('矩阵克隆失败: ' + e.message);
    }
})();
