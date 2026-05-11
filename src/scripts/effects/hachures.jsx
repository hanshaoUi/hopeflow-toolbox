/**
 * 矢量排线 (Vector Hatching)
 * Ported from Christian Condamine's Hachures.jsx (dialog removed, params via panel).
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();

    function boolArg(v) { return v === true || v === 'true'; }

    var SENTINEL_NAME = '__hf_hachures_sentinel__';
    var TEMP_RECT_NOTE = '__hf_hachures_temp_artboard__';

    function findSentinel() {
        if (!app.documents.length) return null;
        var d = app.activeDocument;
        for (var i = 0; i < d.layers.length; i++) {
            if (d.layers[i].name === SENTINEL_NAME) return d.layers[i];
        }
        return null;
    }
    function cleanupTempArtboardRects() {
        if (!app.documents.length) return;
        var d = app.activeDocument;
        for (var l = 0; l < d.layers.length; l++) {
            var lyr = d.layers[l];
            var toRemove = [];
            try {
                for (var p = 0; p < lyr.pathItems.length; p++) {
                    try {
                        if (lyr.pathItems[p].note === TEMP_RECT_NOTE) toRemove.push(lyr.pathItems[p]);
                    } catch (e) {}
                }
            } catch (e) {}
            for (var r = 0; r < toRemove.length; r++) {
                try { toRemove[r].remove(); } catch (e) {}
            }
        }
    }
    function rollbackToBeforeSentinel() {
        // Undo operations one by one until the sentinel layer is gone, meaning we've
        // unwound everything from the previous preview pass (including any menu-command
        // steps that wouldn't be reverted by a single app.undo()).
        var guard = 200;
        while (guard-- > 0) {
            if (!findSentinel()) break;
            try { app.undo(); } catch (e) { break; }
        }
        // For artboard mode the temp rect we created is now resurrected by undo;
        // remove it so the next run starts fresh.
        cleanupTempArtboardRects();
        // app.undo() doesn't always restore item-level selection cleanly (especially
        // after menu commands like Make Planet X). Re-select the source object using
        // the persisted reference so the next run has a valid selection target.
        try {
            if ($.hopeflow._hachuresState && $.hopeflow._hachuresState.source && app.documents.length > 0) {
                var d2 = app.activeDocument;
                d2.selection = null;
                $.hopeflow._hachuresState.source.selected = true;
            }
        } catch (e) {}
        return !findSentinel();
    }

    // Live-preview support: undo prior preview before running, then optionally bail out
    if (boolArg(args.shouldUndo)) {
        rollbackToBeforeSentinel();
    }
    if (boolArg(args.clearOnly)) {
        return $.hopeflow.utils.returnResult({ message: '已清理预览', cleared: true });
    }
    // Commit-only: keep the current preview as the final result, just remove the sentinel
    if (boolArg(args.commitPreview)) {
        if (app.documents.length > 0) {
            var s = findSentinel();
            if (s) { try { s.remove(); } catch (e) {} }
        }
        return $.hopeflow.utils.returnResult({ message: '已保留预览结果', committed: true });
    }

    var spacingMm = parseFloat(args.spacing); if (isNaN(spacingMm) || spacingMm <= 0) spacingMm = 4;
    var angleDeg  = parseFloat(args.angle);   if (isNaN(angleDeg))  angleDeg  = 45;
    var thickMm   = parseFloat(args.thickness); if (isNaN(thickMm) || thickMm <= 0) thickMm = 0.5;
    var curveType = String(args.curveType || 'A').toUpperCase();
    var preserveColor = args.preserveColor === true || args.preserveColor === 'true';
    var customColor = String(args.customColor || '#000000');
    var strokeCapName = String(args.strokeCap || 'butt');
    var jitterPct = parseFloat(args.spacingJitter); if (isNaN(jitterPct) || jitterPct < 0) jitterPct = 0;
    var targetMode = String(args.target || 'selection');

    function parseHex(hex) {
        var s = String(hex || '').replace('#', '');
        if (s.length === 3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
        if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
        var c = new RGBColor();
        c.red = parseInt(s.substr(0,2), 16);
        c.green = parseInt(s.substr(2,2), 16);
        c.blue = parseInt(s.substr(4,2), 16);
        return c;
    }
    var strokeCapValue;
    if (strokeCapName === 'round') strokeCapValue = StrokeCap.ROUNDENDCAP;
    else if (strokeCapName === 'projecting') strokeCapValue = StrokeCap.PROJECTINGENDCAP;
    else strokeCapValue = StrokeCap.BUTTENDCAP;

    if (app.documents.length === 0) return $.hopeflow.utils.returnError('请先打开文档');
    var doc = app.activeDocument;

    var coeff = 2.834645;
    var spacing = spacingMm * coeff;
    var epTrait = thickMm * coeff;
    var coulDefaut = new RGBColor(); coulDefaut.red = 0; coulDefaut.green = 0; coulDefaut.blue = 0;

    // Determine target source — either user's selection or the active artboard
    var target = null;
    var typeObj;
    var monCalque;
    var couleur = null;
    var originalStrokedP = false, originalFilledP = false;

    if (targetMode === 'activeArtboard') {
        if (!doc.artboards || doc.artboards.length === 0) {
            return $.hopeflow.utils.returnError('当前文档没有画板');
        }
        typeObj = 'P';
        monCalque = doc.activeLayer;
        // target rectangle is created inside the try block (so it falls in the undoable range)
    } else {
        var sel = doc.selection;
        if (!sel || sel.length !== 1) return $.hopeflow.utils.returnError('请选择 1 个路径或复合路径');
        target = sel[0];
        if (target.typename === 'PathItem') typeObj = 'P';
        else if (target.typename === 'CompoundPathItem') typeObj = 'C';
        else return $.hopeflow.utils.returnError('仅支持路径 (PathItem) 或复合路径 (CompoundPathItem)');
        monCalque = target.layer;
        // READ source colors WITHOUT modifying yet
        if (typeObj === 'P') {
            originalStrokedP = target.stroked;
            originalFilledP = target.filled;
            couleur = target.stroked ? target.strokeColor : target.fillColor;
        } else {
            var first = target.pathItems[0];
            couleur = first.stroked ? first.strokeColor : first.fillColor;
        }
    }

    // Line color: preserve only works in selection mode (no source color in artboard mode)
    var lineColor;
    if (preserveColor && couleur) {
        lineColor = couleur;
    } else {
        var parsed = parseHex(customColor);
        lineColor = parsed || coulDefaut;
    }

    function gBN(t, name) {
        if (t === 'C') return monCalque.compoundPathItems.getByName(name);
        if (t === 'G') return monCalque.groupItems.getByName(name);
        return monCalque.pathItems.getByName(name);
    }

    try {
        // For preview mode: drop a sentinel layer as the FIRST reversible op so we can
        // multi-undo back to this exact state later (handles menu-command undo barriers).
        if (boolArg(args.preview)) {
            var sentinel = doc.layers.add();
            sentinel.name = SENTINEL_NAME;
            try { sentinel.move(doc, ElementPlacement.PLACEATEND); } catch (e) {}
            try { doc.activeLayer = monCalque; } catch (e) {}
        }

        // For artboard mode: create the temp rectangle as the source. Note-tag it so
        // rollback knows to remove the resurrected copy if any.
        if (targetMode === 'activeArtboard') {
            var abIdx = doc.artboards.getActiveArtboardIndex();
            var abRect = doc.artboards[abIdx].artboardRect; // [left, top, right, bottom]
            var abLeft = abRect[0];
            var abTop = abRect[1];
            var abW = abRect[2] - abRect[0];
            var abH = abRect[1] - abRect[3];
            target = monCalque.pathItems.rectangle(abTop, abLeft, abW, abH);
            target.filled = false;
            target.stroked = true;
            target.strokeWidth = 0.5;
            target.strokeColor = lineColor;
            target.note = TEMP_RECT_NOTE;
            if (boolArg(args.preview)) {
                $.hopeflow._hachuresState = { source: target };
            }
        }

        // Ensure target is selected for app.copy() to work
        try { doc.selection = null; target.selected = true; } catch (e) {}

        // NOW apply writes to the source — these happen INSIDE the undoable range so
        // rollback fully reverts them (previously they ran before the sentinel and
        // survived rollback, leaving filled=false and an extra stroke on the source).
        if (typeObj === 'P' && targetMode === 'selection') {
            if (originalStrokedP) {
                target.filled = false;
            } else {
                target.filled = false;
                target.strokeColor = couleur;
            }
        }

        // Compute dimensions now that target exists
        var perim = target.width * 2 + target.height;
        var x0 = target.left;
        var y0 = target.top;
        var L0 = target.width;
        var H0 = target.height;

        var p1x = 0, p1y = 0, p2x = 0, p2y = 0;
        switch (curveType) {
            case 'A': break;
            case 'B': p2x = perim / -1.8; p2y = perim / 1.8; break;
            case 'C': p2y = perim / 1.8; break;
            case 'D': p1x = perim / 1.8;  p1y = perim / -1.8; p2x = perim / 1.8;  p2y = perim / 1.8; break;
            case 'E': p1x = perim / 1.8;  p1y = perim / -1.8; p2x = perim / -1.8; p2y = perim / 1.8; break;
            case 'F': p1x = perim / 1.8;  p1y = perim / 1.8;  p2x = perim / -1.8; p2y = perim / -1.8; break;
            case 'G': p1x = perim / 1.8;  p2x = perim / -1.8; p2y = perim / 1.8; break;
            case 'H': p1x = perim / 1.8;  p2x = perim / -1.8; p2y = perim / -1.8; break;
            case 'I': p1x = perim / 1.8;  p1y = perim / 1.8;  p2x = perim / -1.8; break;
            case 'J': p1x = perim / 1.8;  p1y = perim / -1.8; p2x = perim / -1.8; break;
        }
        target.name = 'baseSelection';

        app.copy();
        app.executeMenuCommand('pasteFront');
        var copy = doc.selection[0];
        copy.name = 'copieBaseSelection';

        if (copy.typename === 'PathItem') {
            copy.filled = true; copy.stroked = false;
        } else {
            for (var n = 0; n < copy.pathItems.length; n++) {
                copy.pathItems[n].filled = true;
                copy.pathItems[n].stroked = false;
            }
        }

        var grpHachures = monCalque.groupItems.add();
        grpHachures.name = 'grpHachures';
        var lineCount = Math.ceil(perim / spacing);
        var jitterRatio = jitterPct / 100;
        for (var i = 0; i < lineCount; i++) {
            var yOffset = spacing * i;
            if (jitterRatio > 0 && i > 0) {
                yOffset += (Math.random() - 0.5) * spacing * jitterRatio;
            }
            var line = grpHachures.pathItems.add();
            line.name = 'ligne' + i;
            var pa = line.pathPoints.add();
            pa.anchor = [x0, y0 - yOffset];
            pa.rightDirection = pa.leftDirection = [pa.anchor[0] + p1x, pa.anchor[1] + p1y];
            var pb = line.pathPoints.add();
            pb.anchor = [x0 + perim, y0 - yOffset];
            pb.rightDirection = pb.leftDirection = [pb.anchor[0] + p2x, pb.anchor[1] + p2y];
            line.stroked = true;
            line.strokeWidth = epTrait;
            line.strokeColor = lineColor;
            try { line.strokeCap = strokeCapValue; } catch (e) {}
        }

        grpHachures.rotate(angleDeg, true, false, false, false, Transformation.CENTER);
        grpHachures.left = x0 - (grpHachures.width - L0) / 2;
        grpHachures.top  = y0 + (grpHachures.height - H0) / 2;

        var gb = grpHachures.geometricBounds;
        var mask = monCalque.pathItems.add();
        mask.name = 'masque';
        mask.setEntirePath([
            [gb[0] - 10, gb[1] + 10],
            [gb[0] - 10, gb[3] - 10],
            [gb[2] + 10, gb[3] - 10],
            [gb[2] + 10, gb[1] + 10]
        ]);
        mask.closed = true;

        monCalque.selection = null;
        var grpTmp = monCalque.groupItems.add();
        gBN(typeObj, 'copieBaseSelection').move(grpTmp, ElementPlacement.PLACEATBEGINNING);
        gBN('P', 'masque').move(grpTmp, ElementPlacement.PLACEATBEGINNING);
        grpTmp.selected = true;
        app.executeMenuCommand('compoundPath');
        gBN('G', 'grpHachures').selected = true;
        app.executeMenuCommand('ungroup');
        if (typeObj === 'P') app.executeMenuCommand('ungroup');
        app.executeMenuCommand('Make Planet X');
        app.executeMenuCommand('Expand Planet X');
        app.executeMenuCommand('ungroup');

        var afterSel = doc.selection;
        var killIdx = 0;
        for (var j = 0; j < afterSel.length; j++) {
            var item = afterSel[j];
            if (item.pageItems && item.pageItems.length > 0) {
                var head = item.pageItems[0];
                if (head.typename === 'CompoundPathItem') killIdx = j;
                else if (head.filled === true) killIdx = j;
            }
        }
        if (afterSel[killIdx]) afterSel[killIdx].remove();

        // For selection mode: restore source name. For artboard mode: remove the temp rect entirely.
        try {
            var sourceFinal = gBN(typeObj, 'baseSelection');
            if (targetMode === 'activeArtboard') {
                sourceFinal.remove();
            } else {
                sourceFinal.name = '';
            }
        } catch (e) {}

        // Non-preview (final commit) runs: clean up any leftover sentinel
        if (!boolArg(args.preview)) {
            try {
                var leftover = findSentinel();
                if (leftover) leftover.remove();
            } catch (e) {}
        }

        return $.hopeflow.utils.returnResult({
            message: '已生成 ' + lineCount + ' 条排线',
            lines: lineCount
        });
    } catch (err) {
        return $.hopeflow.utils.returnError('排线失败：' + (err.message || err));
    }
})();
