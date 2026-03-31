(function () {
    // 参考线版面 - 列/行/装订线/边距/出血，路径转参考线

    var PREVIEW_LAYER_NAME = '__hf_guide_preview__';

    function getPreviewLayer(doc) {
        try {
            var layer = doc.layers.getByName(PREVIEW_LAYER_NAME);
            layer.locked = false;
            layer.visible = true;
            return layer;
        } catch (e) {
            var layer = doc.layers.add();
            layer.name = PREVIEW_LAYER_NAME;
            return layer;
        }
    }

    function removePreviewLayer(doc) {
        try {
            var layer = doc.layers.getByName(PREVIEW_LAYER_NAME);
            layer.locked = false;
            layer.remove();
        } catch (e) {}
    }

    function addGuide(doc, rect, orientation, position, targetLayer) {
        var margin = 10;
        var layer = targetLayer || doc.activeLayer;
        var line = layer.pathItems.add();
        if (orientation === 'H') {
            line.setEntirePath([
                [rect[0] - margin, position],
                [rect[2] + margin, position]
            ]);
        } else {
            line.setEntirePath([
                [position, rect[1] + margin],
                [position, rect[3] - margin]
            ]);
        }
        line.guides = true;
        return line;
    }

    function buildLayout(doc, rect, args, targetLayer) {
        var mm = $.hopeflow.utils.mmToPt;

        var mT = mm(parseFloat(args.marginTop) || 0);
        var mB = mm(parseFloat(args.marginBottom) || 0);
        var mL = mm(parseFloat(args.marginLeft) || 0);
        var mR = mm(parseFloat(args.marginRight) || 0);

        var iL = rect[0] + mL;
        var iT = rect[1] - mT;
        var iR = rect[2] - mR;
        var iB = rect[3] + mB;
        var iW = iR - iL;
        var iH = iT - iB;

        if (mT > 0) addGuide(doc, rect, 'H', iT, targetLayer);
        if (mB > 0) addGuide(doc, rect, 'H', iB, targetLayer);
        if (mL > 0) addGuide(doc, rect, 'V', iL, targetLayer);
        if (mR > 0) addGuide(doc, rect, 'V', iR, targetLayer);

        var colOn = (args.colEnabled === true || args.colEnabled === 'true');
        if (colOn) {
            var cols = parseInt(args.cols) || 1;
            var colGutter = mm(parseFloat(args.colGutter) || 0);
            if (cols >= 2 && iW > 0) {
                var colW = (iW - (cols - 1) * colGutter) / cols;
                var centerOn = (args.centerCols === true || args.centerCols === 'true');
                var totalW = cols * colW + (cols - 1) * colGutter;
                var startX = centerOn ? iL + (iW - totalW) / 2 : iL;
                for (var c = 1; c < cols; c++) {
                    var rEdge = startX + c * colW + (c - 1) * colGutter;
                    addGuide(doc, rect, 'V', rEdge, targetLayer);
                    if (colGutter > 0) addGuide(doc, rect, 'V', rEdge + colGutter, targetLayer);
                }
            }
        }

        var rowOn = (args.rowEnabled === true || args.rowEnabled === 'true');
        if (rowOn) {
            var rows = parseInt(args.rows) || 1;
            var rowGutter = mm(parseFloat(args.rowGutter) || 0);
            if (rows >= 2 && iH > 0) {
                var rowH = (iH - (rows - 1) * rowGutter) / rows;
                var totalH = rows * rowH + (rows - 1) * rowGutter;
                var centerOn2 = (args.centerCols === true || args.centerCols === 'true');
                var startY = centerOn2 ? iT - (iH - totalH) / 2 : iT;
                for (var r = 1; r < rows; r++) {
                    var bEdge = startY - r * rowH - (r - 1) * rowGutter;
                    addGuide(doc, rect, 'H', bEdge, targetLayer);
                    if (rowGutter > 0) addGuide(doc, rect, 'H', bEdge - rowGutter, targetLayer);
                }
            }
        }

        var bleed = mm(parseFloat(args.bleed) || 0);
        if (bleed > 0) {
            var bRect = [rect[0] - bleed, rect[1] + bleed, rect[2] + bleed, rect[3] - bleed];
            addGuide(doc, bRect, 'H', rect[1] + bleed, targetLayer);
            addGuide(doc, bRect, 'H', rect[3] - bleed, targetLayer);
            addGuide(doc, bRect, 'V', rect[0] - bleed, targetLayer);
            addGuide(doc, bRect, 'V', rect[2] + bleed, targetLayer);
        }
    }

    function createGuides(args) {
        var doc = app.activeDocument;
        var mode = args.mode || 'layout';
        var isPreview = (args.preview === true || args.preview === 'true');
        var isClearOnly = (args.clearOnly === true || args.clearOnly === 'true');

        if (isClearOnly) { removePreviewLayer(doc); return; }

        if (isPreview) {
            removePreviewLayer(doc);
            var previewLayer = getPreviewLayer(doc);
            var allBoards = (args.allArtboards === true || args.allArtboards === 'true');
            if (allBoards) {
                for (var p = 0; p < doc.artboards.length; p++) {
                    buildLayout(doc, doc.artboards[p].artboardRect, args, previewLayer);
                }
            } else {
                buildLayout(doc, doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect, args, previewLayer);
            }
            return;
        }

        if (mode === 'clear') {
            removePreviewLayer(doc);
            app.executeMenuCommand('clearguide');
            return;
        }

        if (mode === 'center') {
            var allAb = (args.allArtboards === true || args.allArtboards === 'true');
            if (allAb) {
                for (var c = 0; c < doc.artboards.length; c++) {
                    var cr = doc.artboards[c].artboardRect;
                    addGuide(doc, cr, 'H', (cr[1] + cr[3]) / 2);
                    addGuide(doc, cr, 'V', (cr[0] + cr[2]) / 2);
                }
            } else {
                var cr2 = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
                addGuide(doc, cr2, 'H', (cr2[1] + cr2[3]) / 2);
                addGuide(doc, cr2, 'V', (cr2[0] + cr2[2]) / 2);
            }
            return;
        }

        removePreviewLayer(doc);
        var clearFirst = (args.clearExisting === true || args.clearExisting === 'true');
        if (clearFirst) app.executeMenuCommand('clearguide');

        var allBoards2 = (args.allArtboards === true || args.allArtboards === 'true');
        if (allBoards2) {
            for (var n = 0; n < doc.artboards.length; n++) {
                buildLayout(doc, doc.artboards[n].artboardRect, args);
            }
        } else {
            buildLayout(doc, doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect, args);
        }
    }

    if ($.hopeflow) {
        var args = $.hopeflow.utils.getArgs();
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('请先打开一个文档');
        }
        createGuides(args);
        return $.hopeflow.utils.returnResult('success');
    } else {
        if (app.documents.length) createGuides({ mode: 'center' });
    }
})();
