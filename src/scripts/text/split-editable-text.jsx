/**
 * Split editable text into separate editable text frames (per character).
 * Robust mode: prefix-diff-probe positioning.
 *
 * Args:
 *   mode: fixed high_precision
 *   keepOriginal (boolean): keep original text frame, default false
 *   ignoreWhitespace (boolean): ignore whitespace chars, default true
 */
(function () {
    if (!$.hopeflow) return;

    if (!app.documents.length) {
        return $.hopeflow.utils.returnError('当前没有打开的文档');
    }

    var args = $.hopeflow.utils.getArgs() || {};
    var requestedMode = 'high_precision';
    var keepOriginal = args.keepOriginal === true || args.keepOriginal === 'true';
    var ignoreWhitespace = !(args.ignoreWhitespace === false || args.ignoreWhitespace === 'false');
    var NATIVE_PLUGIN_NAME = 'HopeFlowNative';
    var NATIVE_SELECTOR_SPLIT = 'splitEditableText';
    var NATIVE_UNAVAILABLE_KEY = '_hopeflowNativeUnavailable';

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

    function tryNativeSplit(payload) {
        try {
            if ($.hopeflow && $.hopeflow[NATIVE_UNAVAILABLE_KEY] === true) {
                return { success: false, error: 'native-plugin-unavailable-cached' };
            }
            if (typeof app.sendScriptMessage !== 'function') return null;
            var req = JSON.stringify(payload || {});
            var raw = app.sendScriptMessage(NATIVE_PLUGIN_NAME, NATIVE_SELECTOR_SPLIT, req);
            if (!raw || typeof raw !== 'string') return null;
            try {
                return JSON.parse(raw);
            } catch (parseErr) {
                return { success: false, error: 'native-response-invalid-json', raw: raw };
            }
        } catch (err) {
            var msg = err && err.message ? err.message : String(err);
            if (msg && msg.indexOf('P!Fd') >= 0 && $.hopeflow) {
                $.hopeflow[NATIVE_UNAVAILABLE_KEY] = true;
            }
            return { success: false, error: msg };
        }
    }

    function isWhitespaceChar(ch) {
        return (
            ch === ' ' ||
            ch === '\t' ||
            ch === '\u00A0' ||
            ch === '\u3000'
        );
    }

    function isSkippableChar(ch) {
        if (ch === '\r' || ch === '\n') return true;
        if (ignoreWhitespace && isWhitespaceChar(ch)) return true;
        // Even when ignoreWhitespace=false, whitespace has no stable outline geometry.
        if (isWhitespaceChar(ch)) return true;
        return false;
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

    function mergeBounds(target, b) {
        if (!b) return target;
        if (!target) {
            return {
                left: b.left,
                top: b.top,
                right: b.right,
                bottom: b.bottom
            };
        }
        if (b.left < target.left) target.left = b.left;
        if (b.top > target.top) target.top = b.top;
        if (b.right > target.right) target.right = b.right;
        if (b.bottom < target.bottom) target.bottom = b.bottom;
        return target;
    }

    function mergeBoundsList(list) {
        var merged = null;
        if (!list || !list.length) return null;
        for (var i = 0; i < list.length; i++) {
            merged = mergeBounds(merged, list[i]);
        }
        return merged;
    }

    function round2(v) {
        return Math.round(v * 100) / 100;
    }

    function boundsKey(b) {
        return round2(b.left) + '|' + round2(b.top) + '|' + round2(b.right) + '|' + round2(b.bottom);
    }

    function collectPathBounds(item, list) {
        if (!item || !list) return;

        var i;

        if (item.typename === 'GroupItem') {
            for (i = 0; i < item.pageItems.length; i++) {
                collectPathBounds(item.pageItems[i], list);
            }
            return;
        }

        if (item.typename === 'CompoundPathItem') {
            for (i = 0; i < item.pathItems.length; i++) {
                collectPathBounds(item.pathItems[i], list);
            }
            return;
        }

        if (item.typename === 'PathItem') {
            try {
                if (!item.clipping && !item.guides && (item.filled || item.stroked)) {
                    var b = readBounds(item);
                    if (b) list.push(b);
                }
            } catch (e) {}
            return;
        }
    }

    function getPrefixPathBoundsWithProbe(probe, fullText, endIndex) {
        var outlined = null;
        var list = [];

        try {
            var prefix = fullText.substring(0, endIndex + 1);
            try {
                probe.contents = prefix;
            } catch (setErr) {
                try { probe.textRange.contents = prefix; } catch (setErr2) {}
            }

            outlined = probe.createOutline();
            collectPathBounds(outlined, list);
        } catch (e) {
            list = [];
        }

        try { if (outlined) outlined.remove(); } catch (cleanup1) {}
        return list;
    }

    function getPrefixPathBounds(tf, fullText, endIndex) {
        var probe = null;
        var list = [];
        try {
            probe = tf.duplicate();
            list = getPrefixPathBoundsWithProbe(probe, fullText, endIndex);
        } catch (e) {
            list = [];
        }
        try { if (probe) probe.remove(); } catch (cleanup2) {}
        return list;
    }

    function diffAddedBounds(currentList, prevList) {
        var prevCount = {};
        var i;

        for (i = 0; i < prevList.length; i++) {
            var k = boundsKey(prevList[i]);
            prevCount[k] = (prevCount[k] || 0) + 1;
        }

        var added = [];
        for (i = 0; i < currentList.length; i++) {
            var ck = boundsKey(currentList[i]);
            if (prevCount[ck] && prevCount[ck] > 0) {
                prevCount[ck]--;
            } else {
                added.push(currentList[i]);
            }
        }

        return added;
    }

    function safeApplyCharStyle(srcTextFrame, charIndex, targetTextFrame) {
        try {
            var srcAttr = srcTextFrame.characters[charIndex].characterAttributes;
            var dstAttr = targetTextFrame.textRange.characterAttributes;

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
            // Do NOT copy stroke fields to avoid accidental stroke appearance.
        } catch (err) {}
    }

    function getFrameGlyphBounds(textFrame) {
        var probe = null;
        var outlined = null;
        var merged = null;

        try {
            probe = textFrame.duplicate();
            outlined = probe.createOutline();
            var list = [];
            collectPathBounds(outlined, list);
            merged = mergeBoundsList(list);
        } catch (e) {
            merged = null;
        }

        try { if (outlined) outlined.remove(); } catch (cleanup1) {}
        try { if (probe) probe.remove(); } catch (cleanup2) {}

        return merged;
    }

    function getInsertionPointPosition(tf, charIndex) {
        try {
            var ip = tf.insertionPoints[charIndex];
            if (!ip) return null;
            var pos = ip.position;
            if (!pos || pos.length !== 2) return null;
            return { x: pos[0], y: pos[1] };
        } catch (e) {
            return null;
        }
    }

    function positionCharFrameByInsertion(sourceTextFrame, templateFrame, ch, sourceIndex, pos) {
        var charFrame = null;
        try {
            charFrame = templateFrame ? templateFrame.duplicate() : sourceTextFrame.duplicate();
        } catch (dupErr) {
            charFrame = sourceTextFrame.duplicate();
        }

        try {
            charFrame.contents = ch;
        } catch (setErr) {
            try { charFrame.textRange.contents = ch; } catch (setErr2) {}
        }

        try {
            if (charFrame.kind === TextType.AREATEXT) {
                charFrame.convertAreaObjectToPointObject();
            }
        } catch (kindErr) {}

        safeApplyCharStyle(sourceTextFrame, sourceIndex, charFrame);

        try {
            charFrame.position = [pos.x, pos.y];
        } catch (setPosErr) {
            try {
                var cp = charFrame.position;
                if (cp && cp.length === 2) {
                    charFrame.translate(pos.x - cp[0], pos.y - cp[1]);
                }
            } catch (moveErr) {}
        }

        return charFrame;
    }

    function positionCharFrame(sourceTextFrame, templateFrame, ch, sourceIndex, targetBounds, mode) {
        var charFrame = null;
        try {
            charFrame = templateFrame ? templateFrame.duplicate() : sourceTextFrame.duplicate();
        } catch (dupErr) {
            charFrame = sourceTextFrame.duplicate();
        }

        try {
            charFrame.contents = ch;
        } catch (setErr) {
            try { charFrame.textRange.contents = ch; } catch (setErr2) {}
        }

        try {
            if (charFrame.kind === TextType.AREATEXT) {
                charFrame.convertAreaObjectToPointObject();
            }
        } catch (kindErr) {}

        safeApplyCharStyle(sourceTextFrame, sourceIndex, charFrame);

        try {
            var sourceGlyphBounds = null;
            if (mode === 'fast') {
                var cbFast = charFrame.geometricBounds;
                sourceGlyphBounds = {
                    left: cbFast[0],
                    top: cbFast[1],
                    right: cbFast[2],
                    bottom: cbFast[3]
                };
            } else {
                sourceGlyphBounds = getFrameGlyphBounds(charFrame);
                if (!sourceGlyphBounds) {
                    var cb = charFrame.geometricBounds;
                    sourceGlyphBounds = {
                        left: cb[0],
                        top: cb[1],
                        right: cb[2],
                        bottom: cb[3]
                    };
                }
            }

            var dx = targetBounds.left - sourceGlyphBounds.left;
            var dy = targetBounds.top - sourceGlyphBounds.top;
            charFrame.translate(dx, dy);
        } catch (moveErr) {}

        return charFrame;
    }

    var selection = $.hopeflow.utils.getSelection();
    if (!selection || selection.length === 0) {
        return $.hopeflow.utils.returnError('请先选择要打散的文本对象');
    }

    var textFrames = [];
    collectTextFrames(selection, textFrames);

    if (textFrames.length === 0) {
        return $.hopeflow.utils.returnError('选区中没有可处理的文本对象');
    }

    var nativeAttempted = false;
    var nativeError = '';
    var nativeReady = false;
    var nativeReason = '';
    try {
        nativeAttempted = true;
        var nativeResult = tryNativeSplit({
            mode: requestedMode,
            keepOriginal: keepOriginal,
            ignoreWhitespace: ignoreWhitespace
        });

        if (nativeResult && nativeResult.success && nativeResult.data) {
            if (nativeResult.data.native_ready === true || nativeResult.data.engine === 'native-aip') {
                nativeReady = true;
            }
            if (nativeResult.data.reason) {
                nativeReason = String(nativeResult.data.reason);
            }

            if (nativeResult.data.handled === true) {
                nativeResult.data.engine = 'native-aip';
                return $.hopeflow.utils.returnResult(nativeResult.data);
            }
        }

        if (nativeResult && nativeResult.success === false && nativeResult.error) {
            nativeError = nativeResult.error;
        }
    } catch (nativeOuterErr) {}

    // Strict native-only mode: do not run JSX split fallback.
    return $.hopeflow.utils.returnError(
        '原生打散未就绪：' + (nativeError || nativeReason || 'native-not-handled')
    );

    var processed = 0;
    var created = 0;
    var skipped = 0;
    var failed = 0;
    var glyphMismatch = 0;
    var skippedWhitespace = 0;
    var fastInsertionHits = 0;

    for (var t = textFrames.length - 1; t >= 0; t--) {
        var tf = textFrames[t];

        try {
            var text = tf.contents || '';
            if (!text.length) {
                skipped++;
                continue;
            }

            var modeForFrame = requestedMode;

            var createdThisFrame = 0;
            var prevPrefixList = [];
            var templateFrame = null;

            try {
                templateFrame = tf.duplicate();
                try {
                    templateFrame.contents = 'x';
                } catch (tplSetErr) {
                    try { templateFrame.textRange.contents = 'x'; } catch (tplSetErr2) {}
                }
            } catch (tplErr) {
                templateFrame = null;
            }

            for (var i = 0; i < text.length; i++) {
                var ch = text.charAt(i);

                if (isWhitespaceChar(ch)) skippedWhitespace++;
                if (isSkippableChar(ch)) continue;

                // createOutline() is destructive for the source text object.
                // Always use a fresh probe per character for correctness.
                var currentList = getPrefixPathBounds(tf, text, i);

                if (!currentList.length) {
                    glyphMismatch++;
                    continue;
                }

                var added = diffAddedBounds(currentList, prevPrefixList);
                if (!added.length) {
                    // Fallback: if diff failed, use the last path bound from current prefix.
                    added = [currentList[currentList.length - 1]];
                }

                var target = mergeBoundsList(added);
                prevPrefixList = currentList;

                if (!target) {
                    glyphMismatch++;
                    continue;
                }

                positionCharFrame(tf, templateFrame, ch, i, target, modeForFrame);
                created++;
                createdThisFrame++;
            }

            try { if (templateFrame) templateFrame.remove(); } catch (tplCleanupErr) {}

            if (!keepOriginal) {
                try { tf.remove(); } catch (removeErr) {}
            }

            if (createdThisFrame === 0) {
                skipped++;
            } else {
                processed++;
            }
        } catch (errFrame) {
            failed++;
        }
    }

    return $.hopeflow.utils.returnResult({
        processed_frames: processed,
        created_characters: created,
        skipped_frames: skipped,
        failed_frames: failed,
        glyph_mismatch_frames: glyphMismatch,
        skipped_whitespace_characters: skippedWhitespace,
        fast_insertion_hits: fastInsertionHits,
        keep_original: keepOriginal,
        ignore_whitespace: ignoreWhitespace,
        native_attempted: nativeAttempted,
        native_error: nativeError,
        native_ready: nativeReady,
        native_reason: nativeReason,
        requested_mode: requestedMode,
        mode: 'prefix-diff-high-precision'
    });
})();
