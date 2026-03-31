/**
 * 文字样式规则
 * Args:
 *   scope: 'selection' | 'document'
 *   rules: Array<{
 *     matchMode: 'exact' | 'regex',
 *     pattern: string,
 *     applyColor: boolean,
 *     colorHex: string,
 *     applySize: boolean,
 *     sizePt?: number
 *   }>
 */
(function () {
    if (!$.hopeflow) return;

    if (!app.documents || app.documents.length === 0) {
        return $.hopeflow.utils.returnError('当前没有打开的文档');
    }

    var args = $.hopeflow.utils.getArgs() || {};
    var scope = String(args.scope || 'selection');
    var rules = normalizeRules(args.rules || []);

    if (!rules.length) {
        return $.hopeflow.utils.returnError('请至少添加一条有效规则');
    }

    function trimString(value) {
        return String(value == null ? '' : value).replace(/^\s+|\s+$/g, '');
    }

    function collectTextFrames(items, out) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item) continue;
            if (item.typename === 'TextFrame') {
                out.push(item);
            } else if (item.typename === 'GroupItem') {
                collectTextFrames(item.pageItems, out);
            }
        }
    }

    function collectTargets() {
        var doc = app.activeDocument;
        var frames = [];
        if (scope === 'document') {
            for (var i = 0; i < doc.textFrames.length; i++) frames.push(doc.textFrames[i]);
            return frames;
        }

        var selection = doc.selection || [];
        if (selection.length > 0) {
            collectTextFrames(selection, frames);
            return frames;
        }

        for (var j = 0; j < doc.textFrames.length; j++) frames.push(doc.textFrames[j]);
        return frames;
    }

    function isEditableTextFrame(tf) {
        try {
            if (!tf) return false;
            if (tf.locked || tf.hidden) return false;
            if (tf.layer && (tf.layer.locked || !tf.layer.visible)) return false;
            return true;
        } catch (e) {
            return false;
        }
    }

    function hexToRGBColor(hex) {
        var normalized = trimString(hex);
        if (!normalized) return null;
        if (normalized.charAt(0) === '#') normalized = normalized.substring(1);
        if (normalized.length === 3) {
            normalized = normalized.charAt(0) + normalized.charAt(0) +
                normalized.charAt(1) + normalized.charAt(1) +
                normalized.charAt(2) + normalized.charAt(2);
        }
        if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

        var color = new RGBColor();
        color.red = parseInt(normalized.substring(0, 2), 16);
        color.green = parseInt(normalized.substring(2, 4), 16);
        color.blue = parseInt(normalized.substring(4, 6), 16);
        return color;
    }

    function duplicateRGBColor(color) {
        if (!color) return null;
        var dup = new RGBColor();
        dup.red = color.red;
        dup.green = color.green;
        dup.blue = color.blue;
        return dup;
    }

    function createGlobalRegex(spec) {
        var pattern = spec;
        var flags = 'g';
        if (pattern.charAt(0) === '/') {
            var lastSlash = pattern.lastIndexOf('/');
            if (lastSlash > 0) {
                pattern = pattern.substring(1, lastSlash);
                flags = spec.substring(lastSlash + 1) || 'g';
            }
        }
        if (flags.indexOf('g') < 0) flags += 'g';
        return new RegExp(pattern, flags);
    }

    function buildExactMatchRanges(text, pattern) {
        var ranges = [];
        var fromIndex = 0;
        if (!pattern) return ranges;

        while (fromIndex < text.length) {
            var matchIndex = text.indexOf(pattern, fromIndex);
            if (matchIndex < 0) break;
            ranges.push({ start: matchIndex, end: matchIndex + pattern.length });
            fromIndex = matchIndex + Math.max(pattern.length, 1);
        }

        return ranges;
    }

    function buildRegexMatchRanges(text, pattern) {
        var ranges = [];
        var regex;
        try {
            regex = createGlobalRegex(pattern);
        } catch (e) {
            return ranges;
        }

        var match;
        while ((match = regex.exec(text)) !== null) {
            var matchText = match[0] || '';
            if (!matchText.length) {
                regex.lastIndex++;
                continue;
            }
            ranges.push({ start: match.index, end: match.index + matchText.length });
        }

        return ranges;
    }

    function normalizeRules(rawRules) {
        var normalized = [];
        if (!rawRules || rawRules.length === undefined) return normalized;

        for (var i = 0; i < rawRules.length; i++) {
            var raw = rawRules[i];
            if (!raw) continue;

            var pattern = trimString(raw.pattern);
            var applyColor = raw.applyColor === true || raw.applyColor === 'true';
            var applySize = raw.applySize === true || raw.applySize === 'true';
            var sizePt = parseFloat(raw.sizePt);
            var color = applyColor ? hexToRGBColor(raw.colorHex) : null;

            if (!pattern) continue;
            if (applyColor && !color) applyColor = false;
            if (applySize && !(sizePt > 0)) applySize = false;
            if (!applyColor && !applySize) continue;

            normalized.push({
                matchMode: raw.matchMode === 'regex' ? 'regex' : 'exact',
                pattern: pattern,
                applyColor: applyColor,
                color: color,
                applySize: applySize,
                sizePt: sizePt
            });
        }

        return normalized;
    }

    function applyRulesToFrame(textFrame, frameRules) {
        var contents = '';
        try { contents = String(textFrame.contents || ''); } catch (e) {}
        if (!contents) return { matched: 0, modified: 0 };

        var matchedRanges = 0;
        var modifiedChars = 0;

        for (var ri = 0; ri < frameRules.length; ri++) {
            var rule = frameRules[ri];
            var ranges = rule.matchMode === 'regex'
                ? buildRegexMatchRanges(contents, rule.pattern)
                : buildExactMatchRanges(contents, rule.pattern);

            if (!ranges.length) continue;

            for (var rj = 0; rj < ranges.length; rj++) {
                var range = ranges[rj];
                var end = range.end;
                if (end > textFrame.characters.length) end = textFrame.characters.length;

                for (var ci = range.start; ci < end; ci++) {
                    try {
                        var attrs = textFrame.characters[ci].characterAttributes;
                        if (rule.applyColor && rule.color) attrs.fillColor = duplicateRGBColor(rule.color);
                        if (rule.applySize) attrs.size = rule.sizePt;
                        modifiedChars++;
                    } catch (charErr) {}
                }

                matchedRanges++;
            }
        }

        return { matched: matchedRanges, modified: modifiedChars };
    }

    var targets = collectTargets();
    if (!targets || targets.length === 0) {
        return $.hopeflow.utils.returnError('未找到可处理的文本对象');
    }

    var processedFrames = 0;
    var skippedFrames = 0;
    var matchedRanges = 0;
    var modifiedCharacters = 0;

    for (var t = 0; t < targets.length; t++) {
        var tf = targets[t];
        if (!isEditableTextFrame(tf)) {
            skippedFrames++;
            continue;
        }

        try {
            var stats = applyRulesToFrame(tf, rules);
            processedFrames++;
            matchedRanges += stats.matched;
            modifiedCharacters += stats.modified;
        } catch (frameErr) {}
    }

    return $.hopeflow.utils.returnResult({
        processed_frames: processedFrames,
        skipped_frames: skippedFrames,
        matched_ranges: matchedRanges,
        modified_characters: modifiedCharacters,
        rule_count: rules.length,
        scope: scope
    });
})();
