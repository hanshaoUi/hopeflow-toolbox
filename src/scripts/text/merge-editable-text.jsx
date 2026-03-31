/**
 * Merge split editable text fragments back into a single editable text frame.
 *
 * Args:
 *   removeOriginal (boolean): remove source fragments after merge, default true
 *   inferSpaces (boolean): infer spaces from horizontal gaps, default true
 *   lineTolerancePt (number): line grouping tolerance in pt, 0 for auto
 */
(function () {
    if (!$.hopeflow) return;

    if (!app.documents.length) {
        return $.hopeflow.utils.returnError('当前没有打开的文档');
    }

    var args = $.hopeflow.utils.getArgs() || {};
    var removeOriginal = !(args.removeOriginal === false || args.removeOriginal === 'false');
    var inferSpaces = !(args.inferSpaces === false || args.inferSpaces === 'false');
    var lineTolerancePt = parseFloat(args.lineTolerancePt);
    if (isNaN(lineTolerancePt) || lineTolerancePt < 0) lineTolerancePt = 0;

    function collectTextFrames(items, result) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item) continue;
            if (item.typename === 'TextFrame') {
                result.push(item);
            } else if (item.typename === 'GroupItem') {
                collectTextFrames(item.pageItems, result);
            }
        }
    }

    function readBounds(item) {
        try {
            var b = item.visibleBounds || item.geometricBounds;
            if (b && b.length === 4) {
                return {
                    left: b[0],
                    top: b[1],
                    right: b[2],
                    bottom: b[3]
                };
            }
        } catch (e) {}
        return null;
    }

    function copyCharStyle(srcTextFrame, srcCharIndex, dstTextFrame, dstCharIndex) {
        try {
            if (!srcTextFrame || !dstTextFrame) return;
            if (srcTextFrame.characters.length <= 0 || dstTextFrame.characters.length <= 0) return;

            var safeSrcIndex = srcCharIndex;
            if (safeSrcIndex < 0) safeSrcIndex = 0;
            if (safeSrcIndex >= srcTextFrame.characters.length) {
                safeSrcIndex = srcTextFrame.characters.length - 1;
            }

            if (dstCharIndex < 0 || dstCharIndex >= dstTextFrame.characters.length) return;

            var srcAttr = srcTextFrame.characters[safeSrcIndex].characterAttributes;
            var dstAttr = dstTextFrame.characters[dstCharIndex].characterAttributes;

            try { dstAttr.textFont = srcAttr.textFont; } catch (e1) {}
            try { dstAttr.size = srcAttr.size; } catch (e2) {}
            try { dstAttr.tracking = srcAttr.tracking; } catch (e3) {}
            try { dstAttr.horizontalScale = srcAttr.horizontalScale; } catch (e4) {}
            try { dstAttr.verticalScale = srcAttr.verticalScale; } catch (e5) {}
            try { dstAttr.baselineShift = srcAttr.baselineShift; } catch (e6) {}
            try { dstAttr.capitalization = srcAttr.capitalization; } catch (e7) {}
            try { dstAttr.underline = srcAttr.underline; } catch (e8) {}
            try { dstAttr.strikeThrough = srcAttr.strikeThrough; } catch (e9) {}
            try { dstAttr.noBreak = srcAttr.noBreak; } catch (e10) {}
            try { dstAttr.fillColor = srcAttr.fillColor; } catch (e11) {}
            // Keep stroke disabled to avoid accidental stroke style carryover.
            try { dstAttr.stroked = false; } catch (e12) {}
        } catch (err) {}
    }

    function median(values) {
        if (!values || values.length === 0) return 0;
        var sorted = values.slice().sort(function (a, b) { return a - b; });
        var mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 1) return sorted[mid];
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    function buildLineGroups(fragments, tolerance) {
        var sorted = fragments.slice().sort(function (a, b) {
            var dy = b.top - a.top;
            if (Math.abs(dy) > 0.2) return dy;
            return a.left - b.left;
        });

        var lines = [];
        for (var i = 0; i < sorted.length; i++) {
            var frag = sorted[i];
            var matched = null;
            var bestDist = 1e12;

            for (var j = 0; j < lines.length; j++) {
                var dist = Math.abs(frag.top - lines[j].top);
                if (dist <= tolerance && dist < bestDist) {
                    matched = lines[j];
                    bestDist = dist;
                }
            }

            if (!matched) {
                lines.push({ top: frag.top, items: [frag] });
            } else {
                matched.items.push(frag);
                matched.top = (matched.top * (matched.items.length - 1) + frag.top) / matched.items.length;
            }
        }

        lines.sort(function (a, b) { return b.top - a.top; });
        for (var k = 0; k < lines.length; k++) {
            lines[k].items.sort(function (a, b) { return a.left - b.left; });
        }

        return lines;
    }

    var selection = $.hopeflow.utils.getSelection();
    if (!selection || selection.length === 0) {
        return $.hopeflow.utils.returnError('请先选择要合并的文本对象');
    }

    var textFrames = [];
    collectTextFrames(selection, textFrames);

    if (textFrames.length < 2) {
        return $.hopeflow.utils.returnError('至少需要选择两个文本对象进行合并');
    }

    var fragments = [];
    var i;
    var minLeft = 1e12;
    var maxTop = -1e12;
    var totalHeight = 0;

    for (i = 0; i < textFrames.length; i++) {
        var tf = textFrames[i];
        var text = '';
        try { text = tf.contents || ''; } catch (eText) { text = ''; }
        if (!text.length) continue;

        var b = readBounds(tf);
        if (!b) continue;

        var h = Math.max(0.01, b.top - b.bottom);
        var w = Math.max(0.01, b.right - b.left);

        fragments.push({
            frame: tf,
            text: text,
            left: b.left,
            top: b.top,
            right: b.right,
            bottom: b.bottom,
            width: w,
            height: h
        });

        if (b.left < minLeft) minLeft = b.left;
        if (b.top > maxTop) maxTop = b.top;
        totalHeight += h;
    }

    if (fragments.length < 2) {
        return $.hopeflow.utils.returnError('选区中可用于合并的文本对象不足两个');
    }

    var avgHeight = totalHeight / fragments.length;
    var tolerance = lineTolerancePt > 0 ? lineTolerancePt : Math.max(2, avgHeight * 0.6);
    var lines = buildLineGroups(fragments, tolerance);

    var charWidths = [];
    for (i = 0; i < fragments.length; i++) {
        if (fragments[i].text.length === 1 && fragments[i].width > 0) {
            charWidths.push(fragments[i].width);
        }
    }
    var spaceUnit = median(charWidths);
    if (!spaceUnit || spaceUnit <= 0) spaceUnit = Math.max(2, avgHeight * 0.35);
    var spaceThreshold = spaceUnit * 1.25;

    var mergedText = '';
    var styleRuns = [];

    for (var li = 0; li < lines.length; li++) {
        var line = lines[li];

        for (var fi = 0; fi < line.items.length; fi++) {
            var frag = line.items[fi];

            if (fi > 0 && inferSpaces) {
                var prev = line.items[fi - 1];
                var gap = frag.left - prev.right;
                if (gap > spaceThreshold) {
                    var spaceCount = Math.max(1, Math.round(gap / Math.max(1, spaceUnit)));
                    for (var si = 0; si < spaceCount; si++) {
                        mergedText += ' ';
                    }
                }
            }

            var runStart = mergedText.length;
            mergedText += frag.text;
            var runEnd = mergedText.length;

            styleRuns.push({
                frame: frag.frame,
                start: runStart,
                end: runEnd
            });
        }

        if (li < lines.length - 1) {
            mergedText += '\r';
        }
    }

    if (!mergedText.length) {
        return $.hopeflow.utils.returnError('合并后文本为空');
    }

    var doc = app.activeDocument;
    var mergedFrame = doc.textFrames.pointText([minLeft, maxTop]);
    mergedFrame.contents = mergedText;

    for (i = 0; i < styleRuns.length; i++) {
        var run = styleRuns[i];
        var srcFrame = run.frame;

        for (var ci = run.start; ci < run.end; ci++) {
            copyCharStyle(srcFrame, ci - run.start, mergedFrame, ci);
        }
    }

    if (removeOriginal) {
        for (i = 0; i < fragments.length; i++) {
            try { fragments[i].frame.remove(); } catch (eRemove) {}
        }
    }

    try {
        mergedFrame.selected = true;
    } catch (eSel) {}

    return $.hopeflow.utils.returnResult({
        merged_fragments: fragments.length,
        output_lines: lines.length,
        output_characters: mergedText.length,
        inferred_spaces: inferSpaces,
        removed_original: removeOriginal,
        line_tolerance_pt: tolerance,
        mode: 'position-merge'
    });
})();
