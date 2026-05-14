/*
  Based on MaskArtboards.jsx for Adobe Illustrator by Sergey Osokin.
  Original script is MIT licensed: https://github.com/creold/illustrator-scripts

  HopeFlow panel version:
  Creates clipping masks for visible, unlocked objects on selected artboards.
  Args: {
    target?: 'current'|'all'|'custom',
    artboards?: string,
    bleedMode?: 'fixed'|'relative',
    bleedUnit?: 'pt'|'mm'|'cm'|'in'|'px',
    sameBleed?: boolean,
    top?: number,
    bottom?: number,
    left?: number,
    right?: number
  }
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
        var target = args.target || 'current';
        var i;

        if (target === 'all') {
            var all = [];
            for (i = 0; i < doc.artboards.length; i++) all.push(i);
            return all;
        }

        if (target === 'custom') {
            return parseArtboardSpec(args.artboards, doc.artboards.length);
        }

        return [doc.artboards.getActiveArtboardIndex()];
    }

    function toNumber(value, fallback) {
        var n = parseFloat(String(value));
        return isNaN(n) ? fallback : n;
    }

    function convertToPoints(value, unit) {
        unit = unit || 'mm';
        try {
            return UnitValue(value, unit).as('pt');
        } catch (e) {
            return value;
        }
    }

    function buildMaskParams(args) {
        var isFixed = (args.bleedMode || 'fixed') === 'fixed';
        var sameBleed = args.sameBleed !== false;
        var unit = args.bleedUnit || 'mm';
        var top = toNumber(args.top, 0);
        var bottom = sameBleed ? top : toNumber(args.bottom, 0);
        var left = sameBleed ? top : toNumber(args.left, 0);
        var right = sameBleed ? top : toNumber(args.right, 0);

        if (isFixed) {
            top = convertToPoints(top, unit);
            bottom = convertToPoints(bottom, unit);
            left = convertToPoints(left, unit);
            right = convertToPoints(right, unit);
        } else {
            top = Math.max(top, -49);
            bottom = Math.max(bottom, -49);
            left = Math.max(left, -49);
            right = Math.max(right, -49);
        }

        return {
            isFixed: isFixed,
            top: top,
            bottom: bottom,
            left: left,
            right: right
        };
    }

    function getArtboardData(artboard) {
        var rect = artboard.artboardRect;
        return {
            left: rect[0],
            top: rect[1],
            right: rect[2],
            bottom: rect[3],
            width: Math.abs(rect[2] - rect[0]),
            height: Math.abs(rect[1] - rect[3])
        };
    }

    function calculateRect(abData, params) {
        var rect = {};

        if (params.isFixed) {
            rect.width = abData.width + params.left + params.right;
            rect.height = abData.height + params.top + params.bottom;
            rect.top = abData.top + params.top;
            rect.left = abData.left - params.left;
        } else {
            var minSide = Math.min(abData.width, abData.height);
            var padLeft = minSide * params.left / 100;
            var padRight = minSide * params.right / 100;
            var padTop = minSide * params.top / 100;
            var padBottom = minSide * params.bottom / 100;

            rect.width = abData.width + padLeft + padRight;
            rect.height = abData.height + padTop + padBottom;
            rect.top = abData.top + padTop;
            rect.left = abData.left - padLeft;
        }

        return rect;
    }

    function isMaskable(item) {
        if (!item || item.locked || item.hidden) return false;
        if (item.guides) return false;
        if (!item.editable) return false;
        if (!item.layer || item.layer.locked || !item.layer.visible) return false;
        if (item.name === '__hopeflow_artboard_mask__') return false;
        return true;
    }

    function collectSelectedItems() {
        var result = [];
        var selection = app.selection || [];
        for (var i = 0; i < selection.length; i++) {
            if (isMaskable(selection[i])) result.push(selection[i]);
        }
        return result;
    }

    function makeNoColor() {
        return new NoColor();
    }

    function maskArtboard(doc, artboardIndex, params) {
        app.selection = null;
        doc.artboards.setActiveArtboardIndex(artboardIndex);
        doc.selectObjectsOnActiveArtboard();

        var items = collectSelectedItems();
        app.selection = null;
        if (!items.length) {
            return { masked: false, items: 0, reason: '画板内没有可处理对象' };
        }

        var rectData = calculateRect(getArtboardData(doc.artboards[artboardIndex]), params);
        if (rectData.width <= 0 || rectData.height <= 0) {
            return { masked: false, items: items.length, reason: '蒙版尺寸无效' };
        }

        var targetLayer = items[0].layer;
        targetLayer.locked = false;
        targetLayer.visible = true;

        var clipGroup = targetLayer.groupItems.add();
        clipGroup.name = doc.artboards[artboardIndex].name || ('画板 ' + (artboardIndex + 1));

        var clipRect = targetLayer.pathItems.rectangle(
            rectData.top,
            rectData.left,
            rectData.width,
            rectData.height
        );
        clipRect.name = '__hopeflow_artboard_mask__';
        clipRect.filled = false;
        clipRect.stroked = false;
        clipRect.fillColor = makeNoColor();
        clipRect.strokeColor = makeNoColor();

        for (var i = 0; i < items.length; i++) {
            items[i].move(clipGroup, ElementPlacement.PLACEATEND);
        }

        clipRect.move(clipGroup, ElementPlacement.PLACEATBEGINNING);
        clipGroup.clipped = true;
        clipGroup.selected = true;

        if (clipGroup.pageItems.length < 2) {
            clipGroup.remove();
            return { masked: false, items: items.length, reason: '有效对象不足' };
        }

        return { masked: true, items: items.length };
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
        var params = buildMaskParams(args);
        var originalArtboard = doc.artboards.getActiveArtboardIndex();
        var artboardIndexes = getTargetArtboardIndexes(doc, args);
        var maskedArtboards = 0;
        var totalItems = 0;
        var skipped = [];

        for (var i = 0; i < artboardIndexes.length; i++) {
            var artboardIndex = artboardIndexes[i];
            var result = maskArtboard(doc, artboardIndex, params);
            if (result.masked) {
                maskedArtboards++;
                totalItems += result.items;
            } else {
                skipped.push({
                    index: artboardIndex + 1,
                    reason: result.reason
                });
            }
        }

        try {
            doc.artboards.setActiveArtboardIndex(originalArtboard);
        } catch (restoreErr) {}

        return $.hopeflow.utils.returnResult({
            artboards: artboardIndexes.length,
            maskedArtboards: maskedArtboards,
            items: totalItems,
            skipped: skipped,
            message: '已为 ' + maskedArtboards + ' 个画板创建剪切蒙版'
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
