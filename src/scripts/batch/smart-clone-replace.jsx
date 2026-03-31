/**
 * 智能克隆/替换 - Smart Clone Replace
 * Clone the top object to other object positions with smart alignment
 * Args: { alignPosition, scaleMode, groupPenetrate, followRotate, syncFill, syncStroke, replaceTarget, groupResult }
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();

    // 支持新的对象参数格式
    var pos = args.alignPosition ? parseInt(args.alignPosition) : 5; // 对齐参考点：1-9
    var scaleMode = args.scaleMode || 'none'; // 缩放模式

    // 根据缩放模式设置配置
    var config = {
        replaceTarget: args.replaceTarget !== undefined ? args.replaceTarget : false,
        groupResult: args.groupResult !== undefined ? args.groupResult : false,
        groupPenetrate: args.groupPenetrate !== undefined ? args.groupPenetrate : true,
        followRotate: args.followRotate !== undefined ? args.followRotate : true,
        equalCover: scaleMode === 'equalCover',
        equalContain: scaleMode === 'equalContain',
        equalWidth: scaleMode === 'equalWidth',
        equalHeight: scaleMode === 'equalHeight',
        targetWidth: scaleMode === 'targetWidth',
        targetHeight: scaleMode === 'targetHeight',
        syncFill: args.syncFill !== undefined ? args.syncFill : false,
        syncStroke: args.syncStroke !== undefined ? args.syncStroke : false
    };

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

    function FXRecurse(itemsArr, callback, config) {
        config = config || {};
        var items = [];
        for (var i = 0; i < itemsArr.length; i++) {
            items.push(itemsArr[i]);
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (item.typename === "GroupItem") {
                if ((item.clipped && config.clipped) || (!item.clipped && config.group)) {
                    callback(item);
                } else {
                    FXRecurse(item.pageItems, callback, config);
                }
            } else if (item.typename === "CompoundPathItem") {
                if (config.compound && item.pathItems.length === 0) {
                    callback(item);
                } else {
                    FXRecurse(item.pathItems, callback, config);
                }
            } else {
                callback(item);
            }
        }
    }

    function FXGetTopAndRestItems(groupPenetrate) {
        var selection = app.activeDocument.selection;
        var topItem = null;
        var topBounds = null;
        var restItemsArr = [];
        var recursedRestItemsArr = [];

        var itemsWithBounds = [];
        for (var i = 0; i < selection.length; i++) {
            var b = FXGetBounds([selection[i]]);
            itemsWithBounds.push({ item: selection[i], bounds: b });
        }

        for (var i = 0; i < itemsWithBounds.length; i++) {
            var cur = itemsWithBounds[i];
            if (topItem === null || cur.bounds.top > topBounds.top) {
                if (topItem !== null) {
                    restItemsArr.push(topItem);
                }
                topItem = cur.item;
                topBounds = cur.bounds;
            } else {
                restItemsArr.push(cur.item);
            }
        }

        recursedRestItemsArr = restItemsArr.slice(0);
        if (groupPenetrate) {
            recursedRestItemsArr = [];
            FXRecurse(restItemsArr, function(item) {
                recursedRestItemsArr.push(item);
            });
        }

        return { topItem: topItem, restItems: recursedRestItemsArr };
    }

    function swapLayer(e, E) {
        var m = e.parent.pathItems.add();
        m.move(e, ElementPlacement.PLACEBEFORE);
        e.move(E, ElementPlacement.PLACEBEFORE);
        m.remove();
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

        if (!sel || sel.length === 0) {
            return $.hopeflow.utils.returnError('请至少选择一个对象');
        }

        var items = FXGetTopAndRestItems(config.groupPenetrate);
        var topItem = items.topItem;
        var restItems = items.restItems;

        if (!topItem || restItems.length === 0) {
            return $.hopeflow.utils.returnError('需要至少两个对象');
        }

        var group = null;
        if (config.groupResult) {
            group = doc.activeLayer.groupItems.add();
            group.name = 'cloneGroup';
        }

        var topBounds = FXGetBounds([topItem]);
        var topWidth = topBounds.right - topBounds.left;
        var topHeight = topBounds.top - topBounds.bottom;

        for (var i = 0; i < restItems.length; i++) {
            var target = restItems[i];
            var dup = topItem.duplicate();
            dup.name = 'dup' + i;

            if (config.followRotate) {
                try {
                    var angle = 0;
                    if (target.typename === 'GroupItem') {
                        var pathItem = null;
                        FXRecurse(target.pageItems, function(pageItem) {
                            if (pageItem.typename === 'PathItem' && !pathItem) {
                                pathItem = pageItem;
                            }
                        });
                        if (pathItem && pathItem.tags) {
                            if (pathItem.tags[0] && pathItem.tags[0].value) {
                                angle = pathItem.tags[0].value * 180 / Math.PI;
                            } else {
                                var tag = pathItem.tags.getByName('TumoRotationAngle');
                                if (tag) {
                                    angle = tag.value * 180 / Math.PI || 0;
                                }
                            }
                        }
                    } else {
                        if (target.tags) {
                            if (target.tags[0] && target.tags[0].value) {
                                angle = target.tags[0].value * 180 / Math.PI;
                            } else {
                                var tag = target.tags.getByName('TumoRotationAngle');
                                if (tag) {
                                    angle = tag.value * 180 / Math.PI || 0;
                                }
                            }
                        }
                    }
                    dup.rotate(angle);
                    var tag = dup.tags.add();
                    tag.name = 'TumoRotationAngle';
                    tag.value = angle / 180 * Math.PI;
                } catch (e) {
                    dup.rotate(0);
                }
            }

            var tBounds = FXGetBounds([target]);
            var targetWidth = tBounds.right - tBounds.left;
            var targetHeight = tBounds.top - tBounds.bottom;

            if (config.equalCover) {
                var scale = Math.max(targetWidth / topWidth, targetHeight / topHeight);
                dup.width = Math.abs(topItem.geometricBounds[2] - topItem.geometricBounds[0]) * scale;
                dup.height = Math.abs(topItem.geometricBounds[3] - topItem.geometricBounds[1]) * scale;
            }
            if (config.equalContain) {
                var scale = Math.min(targetWidth / topWidth, targetHeight / topHeight);
                dup.width = Math.abs(topItem.geometricBounds[2] - topItem.geometricBounds[0]) * scale;
                dup.height = Math.abs(topItem.geometricBounds[3] - topItem.geometricBounds[1]) * scale;
            }
            if (config.equalWidth) {
                var scale = targetWidth / topWidth;
                dup.width = Math.abs(topItem.geometricBounds[2] - topItem.geometricBounds[0]) * scale;
                dup.height = Math.abs(topItem.geometricBounds[3] - topItem.geometricBounds[1]) * scale;
            }
            if (config.equalHeight) {
                var scale = targetHeight / topHeight;
                dup.width = Math.abs(topItem.geometricBounds[2] - topItem.geometricBounds[0]) * scale;
                dup.height = Math.abs(topItem.geometricBounds[3] - topItem.geometricBounds[1]) * scale;
            }
            if (config.targetWidth) {
                var scale = targetWidth / topWidth;
                dup.width = Math.abs(topItem.geometricBounds[2] - topItem.geometricBounds[0]) * scale;
            }
            if (config.targetHeight) {
                var scale = targetHeight / topHeight;
                dup.height = Math.abs(topItem.geometricBounds[3] - topItem.geometricBounds[1]) * scale;
            }
            if (config.syncFill) {
                dup.fillColor = target.fillColor;
            }
            if (config.syncStroke) {
                if (target.stroked) {
                    dup.strokeWidth = target.strokeWidth;
                }
                dup.strokeColor = target.strokeColor;
            }

            var dBounds = FXGetBounds([dup]);
            var dupWidth = dBounds.right - dBounds.left;
            var dupHeight = dBounds.top - dBounds.bottom;

            var targetAnchor;
            switch (pos) {
                case 1: targetAnchor = [tBounds.left, tBounds.top]; break;
                case 2: targetAnchor = [tBounds.left + targetWidth/2, tBounds.top]; break;
                case 3: targetAnchor = [tBounds.left + targetWidth, tBounds.top]; break;
                case 4: targetAnchor = [tBounds.left, tBounds.top - targetHeight/2]; break;
                case 5: targetAnchor = [tBounds.left + targetWidth/2, tBounds.top - targetHeight/2]; break;
                case 6: targetAnchor = [tBounds.left + targetWidth, tBounds.top - targetHeight/2]; break;
                case 7: targetAnchor = [tBounds.left, tBounds.top - targetHeight]; break;
                case 8: targetAnchor = [tBounds.left + targetWidth/2, tBounds.top - targetHeight]; break;
                case 9: targetAnchor = [tBounds.left + targetWidth, tBounds.top - targetHeight]; break;
                default: targetAnchor = [tBounds.left, tBounds.top]; break;
            }

            var dupAnchor;
            switch (pos) {
                case 1: dupAnchor = [dBounds.left, dBounds.top]; break;
                case 2: dupAnchor = [dBounds.left + dupWidth/2, dBounds.top]; break;
                case 3: dupAnchor = [dBounds.left + dupWidth, dBounds.top]; break;
                case 4: dupAnchor = [dBounds.left, dBounds.top - dupHeight/2]; break;
                case 5: dupAnchor = [dBounds.left + dupWidth/2, dBounds.top - dupHeight/2]; break;
                case 6: dupAnchor = [dBounds.left + dupWidth, dBounds.top - dupHeight/2]; break;
                case 7: dupAnchor = [dBounds.left, dBounds.top - dupHeight]; break;
                case 8: dupAnchor = [dBounds.left + dupWidth/2, dBounds.top - dupHeight]; break;
                case 9: dupAnchor = [dBounds.left + dupWidth, dBounds.top - dupHeight]; break;
                default: dupAnchor = [dBounds.left, dBounds.top]; break;
            }

            var curPos = dup.position;
            var offsetX = curPos[0] - dupAnchor[0];
            var offsetY = curPos[1] - dupAnchor[1];

            dup.position = [targetAnchor[0] + offsetX, targetAnchor[1] + offsetY];

            swapLayer(dup, target);

            if (config.groupResult) {
                dup.moveToBeginning(group);
            }

            if (config.replaceTarget) {
                target.remove();
            }
        }

        return $.hopeflow.utils.returnResult({
            success: true,
            message: '克隆成功'
        });
    }

    try {
        return main();
    } catch (e) {
        return $.hopeflow.utils.returnError('克隆失败: ' + e.message);
    }
})();
