/**
 * 对象标号编组 - Object Number Group
 * 为选中的对象按顺序添加编号标签，并将标签与对象编组绑定。
 * Args:
 *   prefix (string): 编号前缀
 *   suffix (string): 编号后缀
 *   startNum (string|number): 起始编号，支持前导 0
 *   increment (number): 编号增量
 *   sortOrder (string): 'row' 行优先 / 'column' 列优先
 *   fontSize (number): 标号字号（pt）
 *   offset (number): 标号偏移（mm）
 */
(function () {
    if (!$.hopeflow) return;

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('请先打开文档');
        }

        var doc = app.activeDocument;
        var selection = $.hopeflow.utils.requireSelection(1, '请至少选择一个对象');
        if (!selection || selection.length === 0) {
            return $.hopeflow.utils.returnError('请至少选择一个对象');
        }

        var args = $.hopeflow.utils.getArgs();
        var prefix = String(args.prefix || '');
        var suffix = String(args.suffix || '');
        var startRaw = String(args.startNum !== undefined && args.startNum !== null ? args.startNum : '1');
        var startNum = parseInt(startRaw, 10);
        var increment = parseInt(args.increment, 10);
        var sortOrder = args.sortOrder || 'row';
        var arcMode = args.arcMode === true || args.arcMode === 'true';
        var labelStyle = String(args.labelStyle || 'plain-black');
        var fontSize = parseFloat(args.fontSize);
        var offsetMm = parseFloat(args.offset);
        var mmToPt = 2.83464567;

        if (isNaN(startNum)) startNum = 1;
        if (isNaN(increment) || increment === 0) increment = 1;
        if (isNaN(fontSize) || fontSize <= 0) fontSize = 12;
        if (isNaN(offsetMm)) offsetMm = 0;
        if (offsetMm < 0) offsetMm = 0;

        var offsetPt = offsetMm * mmToPt;
        var padLength = startRaw.replace(/^-/, '').length;
        if (padLength <= 0) padLength = String(Math.abs(startNum)).length || 1;

        function getBounds(item) {
            try {
                var b = item.visibleBounds;
                if (b && b.length === 4) {
                    return {
                        left: b[0],
                        top: b[1],
                        right: b[2],
                        bottom: b[3],
                        width: b[2] - b[0],
                        height: b[1] - b[3],
                        centerX: (b[0] + b[2]) / 2,
                        centerY: (b[1] + b[3]) / 2
                    };
                }
            } catch (e) {}

            try {
                var g = item.geometricBounds;
                if (g && g.length === 4) {
                    return {
                        left: g[0],
                        top: g[1],
                        right: g[2],
                        bottom: g[3],
                        width: g[2] - g[0],
                        height: g[1] - g[3],
                        centerX: (g[0] + g[2]) / 2,
                        centerY: (g[1] + g[3]) / 2
                    };
                }
            } catch (e2) {}

            return null;
        }

        function isNestedUnderSelected(item, selected) {
            try {
                var parent = item.parent;
                while (parent && parent.typename && parent.typename !== 'Document') {
                    for (var i = 0; i < selected.length; i++) {
                        if (selected[i] === parent) {
                            return true;
                        }
                    }
                    parent = parent.parent;
                }
            } catch (e) {}
            return false;
        }

        function isProcessable(item) {
            if (!item) return false;
            if (item.locked || item.hidden || item.guides) return false;
            if (item.editable === false) return false;
            try {
                if (item.layer && item.layer.locked) return false;
                if (item.layer && item.layer.visible === false) return false;
            } catch (e) {}
            return true;
        }

        function getArcCenter(items) {
            var sumX = 0;
            var sumY = 0;

            for (var i = 0; i < items.length; i++) {
                sumX += items[i].centerX;
                sumY += items[i].centerY;
            }

            return {
                x: sumX / items.length,
                y: sumY / items.length
            };
        }

        function normalizeAngle(angle) {
            var twoPi = Math.PI * 2;
            while (angle < 0) angle += twoPi;
            while (angle >= twoPi) angle -= twoPi;
            return angle;
        }

        function circularDistance(startAngle, angle, clockwise) {
            var twoPi = Math.PI * 2;
            var diff;

            if (clockwise) {
                diff = startAngle - angle;
            } else {
                diff = angle - startAngle;
            }

            while (diff < 0) diff += twoPi;
            while (diff >= twoPi) diff -= twoPi;

            return diff;
        }

        function getArcSortConfig(items, arcCenter) {
            var startIndex = 0;
            for (var i = 1; i < items.length; i++) {
                var a = items[i];
                var s = items[startIndex];
                if (a.centerX < s.centerX - 0.0001 || (Math.abs(a.centerX - s.centerX) <= 0.0001 && a.centerY < s.centerY)) {
                    startIndex = i;
                }
            }

            var startAngle = normalizeAngle(Math.atan2(items[startIndex].centerY - arcCenter.y, items[startIndex].centerX - arcCenter.x));
            var clockwiseMax = 0;
            var counterClockwiseMax = 0;

            for (var j = 0; j < items.length; j++) {
                var angle = normalizeAngle(Math.atan2(items[j].centerY - arcCenter.y, items[j].centerX - arcCenter.x));
                var clockwiseDistance = circularDistance(startAngle, angle, true);
                var counterClockwiseDistance = circularDistance(startAngle, angle, false);
                if (clockwiseDistance > clockwiseMax) clockwiseMax = clockwiseDistance;
                if (counterClockwiseDistance > counterClockwiseMax) counterClockwiseMax = counterClockwiseDistance;
            }

            return {
                startAngle: startAngle,
                clockwise: clockwiseMax <= counterClockwiseMax
            };
        }

        function sortItems(items) {
            var arcCenter = null;
            var arcSortConfig = null;
            if (arcMode && items.length > 1) {
                arcCenter = getArcCenter(items);
                arcSortConfig = getArcSortConfig(items, arcCenter);
            }

            items.sort(function (a, b) {
                if (arcMode) {
                    var angleA = normalizeAngle(Math.atan2(a.centerY - arcCenter.y, a.centerX - arcCenter.x));
                    var angleB = normalizeAngle(Math.atan2(b.centerY - arcCenter.y, b.centerX - arcCenter.x));
                    var distanceA = circularDistance(arcSortConfig.startAngle, angleA, arcSortConfig.clockwise);
                    var distanceB = circularDistance(arcSortConfig.startAngle, angleB, arcSortConfig.clockwise);

                    if (Math.abs(distanceA - distanceB) > 0.0001) {
                        return distanceA - distanceB;
                    }

                    var radiusA = Math.sqrt(Math.pow(a.centerX - arcCenter.x, 2) + Math.pow(a.centerY - arcCenter.y, 2));
                    var radiusB = Math.sqrt(Math.pow(b.centerX - arcCenter.x, 2) + Math.pow(b.centerY - arcCenter.y, 2));
                    if (Math.abs(radiusA - radiusB) > 0.5) {
                        return radiusA - radiusB;
                    }

                    if (Math.abs(a.centerX - b.centerX) > 1) {
                        return a.centerX - b.centerX;
                    }
                    return b.centerY - a.centerY;
                }

                if (sortOrder === 'column') {
                    if (Math.abs(a.centerY - b.centerY) > 1) {
                        return b.centerY - a.centerY;
                    }
                    return a.centerX - b.centerX;
                }

                if (Math.abs(a.centerX - b.centerX) > 1) {
                    return a.centerX - b.centerX;
                }
                return b.centerY - a.centerY;
            });
        }

        function padNumber(num, size) {
            var sign = num < 0 ? '-' : '';
            var digits = String(Math.abs(num));
            while (digits.length < size) digits = '0' + digits;
            return sign + digits;
        }

        function makeBlackColor() {
            var color = new RGBColor();
            color.red = 0;
            color.green = 0;
            color.blue = 0;
            return color;
        }

        function makeRgbColor(r, g, b) {
            var color = new RGBColor();
            color.red = r;
            color.green = g;
            color.blue = b;
            return color;
        }

        function getLabelStyleConfig(styleKey) {
            var styles = {
                'plain-black': {
                    textColor: makeRgbColor(0, 0, 0),
                    createBadge: false
                },
                'plain-white': {
                    textColor: makeRgbColor(255, 255, 255),
                    createBadge: false
                },
                'badge-white': {
                    textColor: makeRgbColor(0, 0, 0),
                    createBadge: true,
                    badgeFill: makeRgbColor(255, 255, 255),
                    badgeStroke: makeRgbColor(0, 0, 0),
                    badgePadding: 4,
                    badgeStrokeWidth: 1
                },
                'badge-black': {
                    textColor: makeRgbColor(255, 255, 255),
                    createBadge: true,
                    badgeFill: makeRgbColor(0, 0, 0),
                    badgeStroke: makeRgbColor(255, 255, 255),
                    badgePadding: 4,
                    badgeStrokeWidth: 1
                },
                'badge-green': {
                    textColor: makeRgbColor(255, 255, 255),
                    createBadge: true,
                    badgeFill: makeRgbColor(102, 187, 106),
                    badgeStroke: makeRgbColor(255, 255, 255),
                    badgePadding: 4,
                    badgeStrokeWidth: 1
                }
            };

            return styles[styleKey] || styles['plain-black'];
        }

        function moveIntoGroup(item, group, place) {
            try {
                item.move(group, place);
            } catch (e) {
                try {
                    if (place === ElementPlacement.PLACEATBEGINNING) {
                        item.moveToBeginning(group);
                    } else {
                        item.moveToEnd(group);
                    }
                } catch (e2) {
                    throw e2;
                }
            }
        }

        function centerTextFrame(textFrame, centerX, centerY) {
            try {
                var gb = textFrame.geometricBounds;
                if (gb && gb.length === 4) {
                    var currentCenterX = (gb[0] + gb[2]) / 2;
                    var currentCenterY = (gb[1] + gb[3]) / 2;
                    textFrame.translate(centerX - currentCenterX, centerY - currentCenterY);
                    return;
                }
            } catch (e) {}

            try {
                textFrame.left = centerX;
                textFrame.top = centerY;
            } catch (e2) {}
        }

        function createLabelBadge(layer, textFrame, styleConfig) {
            if (!styleConfig.createBadge) return null;

            try {
                var gb = textFrame.geometricBounds;
                if (!gb || gb.length !== 4) return null;

                var textWidth = gb[2] - gb[0];
                var textHeight = gb[1] - gb[3];
                var diameter = Math.max(textWidth, textHeight) + (styleConfig.badgePadding * 2);
                var centerX = (gb[0] + gb[2]) / 2;
                var centerY = (gb[1] + gb[3]) / 2;
                var badge = layer.pathItems.ellipse(
                    centerY + (diameter / 2),
                    centerX - (diameter / 2),
                    diameter,
                    diameter
                );

                badge.stroked = true;
                badge.strokeWidth = styleConfig.badgeStrokeWidth;
                badge.strokeColor = styleConfig.badgeStroke;
                badge.filled = true;
                badge.fillColor = styleConfig.badgeFill;
                badge.name = textFrame.name + '_badge';
                return badge;
            } catch (e) {
                return null;
            }
        }

        var selected = [];
        for (var s = 0; s < selection.length; s++) {
            var current = selection[s];
            if (!isProcessable(current)) continue;
            if (isNestedUnderSelected(current, selection)) continue;
            var bounds = getBounds(current);
            if (!bounds) continue;
            selected.push({
                item: current,
                bounds: bounds,
                left: bounds.left,
                top: bounds.top,
                right: bounds.right,
                bottom: bounds.bottom,
                width: bounds.width,
                height: bounds.height,
                centerX: bounds.centerX,
                centerY: bounds.centerY
            });
        }

        if (selected.length === 0) {
            return $.hopeflow.utils.returnError('没有可处理的对象');
        }

        sortItems(selected);

        doc.selection = null;

        var styleConfig = getLabelStyleConfig(labelStyle);
        var createdGroups = [];
        var skipped = 0;

        for (var i = 0; i < selected.length; i++) {
            var entry = selected[i];
            var item = entry.item;
            var b = entry.bounds;
            var number = startNum + (i * increment);
            var numberText = prefix + padNumber(number, padLength) + suffix;
            var itemLayer = item.layer;

            try {
                var label = itemLayer.textFrames.add();
                label.contents = numberText;
                label.name = numberText;
                label.textRange.characterAttributes.size = fontSize;
                label.textRange.characterAttributes.fillColor = styleConfig.textColor;
                try {
                    label.textRange.paragraphAttributes.justification = Justification.CENTER;
                } catch (e) {}

                centerTextFrame(label, b.centerX + offsetPt, b.centerY + offsetPt);
                var badge = createLabelBadge(itemLayer, label, styleConfig);

                var group = itemLayer.groupItems.add();
                group.name = numberText;

                moveIntoGroup(item, group, ElementPlacement.PLACEATBEGINNING);
                if (badge) {
                    moveIntoGroup(badge, group, ElementPlacement.PLACEATEND);
                }
                moveIntoGroup(label, group, ElementPlacement.PLACEATEND);

                createdGroups.push(group);
            } catch (err) {
                skipped++;
            }
        }

        if (createdGroups.length === 0) {
            return $.hopeflow.utils.returnError('对象标号编组失败');
        }

        for (var j = 0; j < createdGroups.length; j++) {
            createdGroups[j].selected = true;
        }

        return $.hopeflow.utils.returnResult({
            processed: createdGroups.length,
            skipped: skipped,
            sortOrder: sortOrder
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
