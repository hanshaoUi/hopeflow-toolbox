/**
 * Apply font rules by character class:
 * - CJK characters use cjkFont
 * - Latin letters and digits use latinFont
 *
 * Args:
 *   cjkFont: string
 *   latinFont: string
 *   scope: 'selection' | 'document'
 *   stylePunctuation: boolean
 */
(function () {
    if (!$.hopeflow) return;

    if (!app.documents || app.documents.length === 0) {
        return $.hopeflow.utils.returnError('当前没有打开的文档');
    }

    var args = $.hopeflow.utils.getArgs() || {};
    var cjkFontQuery = String(args.cjkFont || 'Microsoft YaHei');
    var latinFontQuery = String(args.latinFont || 'Arial');
    var scope = String(args.scope || 'selection');
    var stylePunctuation = !(args.stylePunctuation === false || args.stylePunctuation === 'false');

    function normalizeName(s) {
        return String(s || '')
            .toLowerCase()
            .replace(/[\s\-_]/g, '');
    }

    function resolveTextFont(query) {
        if (!query) return null;

        try {
            return app.textFonts.getByName(query);
        } catch (e1) {}

        var q = normalizeName(query);
        var best = null;

        for (var i = 0; i < app.textFonts.length; i++) {
            var f = app.textFonts[i];
            var name = normalizeName(f && f.name);
            var family = normalizeName(f && f.family);
            var style = normalizeName(f && f.style);
            var familyStyle = normalizeName((f && f.family ? f.family : '') + (f && f.style ? f.style : ''));

            if (name === q || family === q || familyStyle === q) {
                return f;
            }

            if (!best) {
                if (name.indexOf(q) >= 0 || family.indexOf(q) >= 0 || familyStyle.indexOf(q) >= 0 || style.indexOf(q) >= 0) {
                    best = f;
                }
            }
        }

        return best;
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
            for (var i = 0; i < doc.textFrames.length; i++) {
                frames.push(doc.textFrames[i]);
            }
            return frames;
        }

        var selection = doc.selection || [];
        if (selection.length > 0) {
            collectTextFrames(selection, frames);
            return frames;
        }

        for (var j = 0; j < doc.textFrames.length; j++) {
            frames.push(doc.textFrames[j]);
        }
        return frames;
    }

    function charCode(ch) {
        if (!ch || ch.length === 0) return -1;
        return ch.charCodeAt(0);
    }

    function isCJK(code) {
        return (
            (code >= 0x3400 && code <= 0x4DBF) ||
            (code >= 0x4E00 && code <= 0x9FFF) ||
            (code >= 0xF900 && code <= 0xFAFF) ||
            (code >= 0x3040 && code <= 0x30FF) ||
            (code >= 0xAC00 && code <= 0xD7AF)
        );
    }

    function isLatinDigit(code) {
        return (
            (code >= 0x30 && code <= 0x39) ||
            (code >= 0x41 && code <= 0x5A) ||
            (code >= 0x61 && code <= 0x7A) ||
            (code >= 0xFF10 && code <= 0xFF19) ||
            (code >= 0xFF21 && code <= 0xFF3A) ||
            (code >= 0xFF41 && code <= 0xFF5A)
        );
    }

    function isCJKPunctuation(code) {
        return (
            (code >= 0x3000 && code <= 0x303F) ||
            (code >= 0xFF01 && code <= 0xFF0F) ||
            (code >= 0xFF1A && code <= 0xFF20) ||
            (code >= 0xFF3B && code <= 0xFF40) ||
            (code >= 0xFF5B && code <= 0xFF65)
        );
    }

    function isAsciiPunctuation(code) {
        return (
            (code >= 0x21 && code <= 0x2F) ||
            (code >= 0x3A && code <= 0x40) ||
            (code >= 0x5B && code <= 0x60) ||
            (code >= 0x7B && code <= 0x7E)
        );
    }

    var cjkFont = resolveTextFont(cjkFontQuery);
    if (!cjkFont) {
        return $.hopeflow.utils.returnError('找不到中文字体: ' + cjkFontQuery);
    }

    var latinFont = resolveTextFont(latinFontQuery);
    if (!latinFont) {
        return $.hopeflow.utils.returnError('找不到英文字体: ' + latinFontQuery);
    }

    var targets = collectTargets();
    if (!targets || targets.length === 0) {
        return $.hopeflow.utils.returnError('未找到可处理的文本对象');
    }

    var processedFrames = 0;
    var modifiedFrames = 0;
    var modifiedCharacters = 0;
    var skippedFrames = 0;
    var failedCharacters = 0;

    for (var t = 0; t < targets.length; t++) {
        var tf = targets[t];
        if (!isEditableTextFrame(tf)) {
            skippedFrames++;
            continue;
        }

        var frameModified = false;
        processedFrames++;

        try {
            var chars = tf.characters;
            for (var i = 0; i < chars.length; i++) {
                var ch = chars[i].contents;
                if (!ch || ch === '\r' || ch === '\n') continue;

                var code = charCode(ch);
                if (code < 0) continue;

                var targetFont = null;
                if (isCJK(code)) {
                    targetFont = cjkFont;
                } else if (isLatinDigit(code)) {
                    targetFont = latinFont;
                } else if (stylePunctuation) {
                    if (isCJKPunctuation(code)) targetFont = cjkFont;
                    else if (isAsciiPunctuation(code)) targetFont = latinFont;
                }

                if (!targetFont) continue;

                try {
                    var attrs = chars[i].characterAttributes;
                    var currentName = attrs && attrs.textFont ? String(attrs.textFont.name || '') : '';
                    var targetName = String(targetFont.name || '');
                    if (currentName !== targetName) {
                        attrs.textFont = targetFont;
                        modifiedCharacters++;
                        frameModified = true;
                    }
                } catch (setErr) {
                    failedCharacters++;
                }
            }
        } catch (frameErr) {
            // Keep frame-level errors isolated.
        }

        if (frameModified) modifiedFrames++;
    }

    return $.hopeflow.utils.returnResult({
        processed_frames: processedFrames,
        modified_frames: modifiedFrames,
        modified_characters: modifiedCharacters,
        skipped_frames: skippedFrames,
        failed_characters: failedCharacters,
        resolved_cjk_font: String(cjkFont.name || cjkFontQuery),
        resolved_latin_font: String(latinFont.name || latinFontQuery),
        scope: scope
    });
})();
