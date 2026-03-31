/**
 * Paragraph layout formatter.
 *
 * Args:
 *   scope: 'selection' | 'document'
 *   alignment: 'preserve' | 'left' | 'center' | 'right' | 'justify'
 *   lineSpacingPt: number
 *   spaceBeforePt: number
 *   spaceAfterPt: number
 *   indentMode: 'chars' | 'pt'
 *   indentChars: number
 *   firstLineIndentPt: number
 *   applyLineSpacing: boolean
 *   applyParagraphSpacing: boolean
 *   applyFirstLineIndent: boolean
 */
(function () {
    if (!$.hopeflow) return;

    if (!app.documents || app.documents.length === 0) {
        return $.hopeflow.utils.returnError('当前没有打开的文档');
    }

    var args = $.hopeflow.utils.getArgs() || {};

    function toBool(v) {
        return v === true || v === 'true';
    }

    function toNumber(v, fallback) {
        var n = parseFloat(v);
        return isNaN(n) ? fallback : n;
    }

    var scope = String(args.scope || 'selection');
    var alignment = String(args.alignment || 'preserve');
    var lineSpacingPt = toNumber(args.lineSpacingPt, 18);
    var spaceBeforePt = toNumber(args.spaceBeforePt, 0);
    var spaceAfterPt = toNumber(args.spaceAfterPt, 0);
    var indentMode = String(args.indentMode || 'chars');
    var indentChars = toNumber(args.indentChars, 2);
    var firstLineIndentPt = toNumber(args.firstLineIndentPt, 0);
    var applyLineSpacing = toBool(args.applyLineSpacing);
    var applyParagraphSpacing = toBool(args.applyParagraphSpacing);
    var applyFirstLineIndent = toBool(args.applyFirstLineIndent);

    if (alignment !== 'preserve' &&
        alignment !== 'left' &&
        alignment !== 'center' &&
        alignment !== 'right' &&
        alignment !== 'justify') {
        alignment = 'preserve';
    }

    if (indentMode !== 'chars' && indentMode !== 'pt') {
        indentMode = 'chars';
    }

    if (applyLineSpacing && lineSpacingPt <= 0) {
        return $.hopeflow.utils.returnError('行距必须大于 0');
    }

    if (applyFirstLineIndent && indentMode === 'chars' && indentChars < 0) {
        return $.hopeflow.utils.returnError('首行缩进字符数不能为负');
    }

    var hasAnyOperation =
        alignment !== 'preserve' ||
        applyLineSpacing ||
        applyParagraphSpacing ||
        applyFirstLineIndent;

    if (!hasAnyOperation) {
        return $.hopeflow.utils.returnError('请至少启用一项排版设置');
    }

    function resolveJustification(mode) {
        if (mode === 'left') return Justification.LEFT;
        if (mode === 'center') return Justification.CENTER;
        if (mode === 'right') return Justification.RIGHT;
        if (mode === 'justify') {
            if (typeof Justification.FULLJUSTIFYLASTLINELEFT !== 'undefined') {
                return Justification.FULLJUSTIFYLASTLINELEFT;
            }
            if (typeof Justification.FULLJUSTIFY !== 'undefined') {
                return Justification.FULLJUSTIFY;
            }
        }
        return null;
    }

    function isWhitespaceChar(ch) {
        return ch === ' ' || ch === '\t' || ch === '\u00A0' || ch === '\u3000' || ch === '\r' || ch === '\n';
    }

    function safeFontSizeFromChar(ch, fallback) {
        try {
            var sz = parseFloat(ch.characterAttributes.size);
            if (!isNaN(sz) && sz > 0) return sz;
        } catch (e) {}
        return fallback;
    }

    function getParagraphBaseSize(para, fallback) {
        try {
            var chars = para.characters;
            for (var i = 0; i < chars.length; i++) {
                var c = chars[i].contents;
                if (!isWhitespaceChar(c)) {
                    return safeFontSizeFromChar(chars[i], fallback);
                }
            }
        } catch (eChars) {}

        try {
            var s = parseFloat(para.characterAttributes.size);
            if (!isNaN(s) && s > 0) return s;
        } catch (eParaSize) {}

        return fallback;
    }

    function applyParagraphIndentByChars(tf, charsCount) {
        var applied = 0;
        var baseFallback = 12;
        try {
            var frameSize = parseFloat(tf.textRange.characterAttributes.size);
            if (!isNaN(frameSize) && frameSize > 0) baseFallback = frameSize;
        } catch (eFrameSize) {}

        try {
            var paragraphs = tf.paragraphs;
            if (!paragraphs || paragraphs.length === 0) return 0;

            for (var p = 0; p < paragraphs.length; p++) {
                var para = paragraphs[p];
                var paraSize = getParagraphBaseSize(para, baseFallback);
                var indentPt = paraSize * charsCount;
                try {
                    para.paragraphAttributes.firstLineIndent = indentPt;
                    applied++;
                } catch (eSetParaIndent) {}
            }
        } catch (eParagraphs) {
            return 0;
        }

        return applied;
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
        }

        if (frames.length === 0) {
            for (var j = 0; j < doc.textFrames.length; j++) {
                frames.push(doc.textFrames[j]);
            }
        }

        return frames;
    }

    function isProcessableTextFrame(tf) {
        try {
            if (!tf) return false;
            if (tf.locked || tf.hidden) return false;
            if (tf.layer && (tf.layer.locked || !tf.layer.visible)) return false;
            return true;
        } catch (e) {
            return false;
        }
    }

    var targets = collectTargets();
    if (!targets || targets.length === 0) {
        return $.hopeflow.utils.returnError('未找到可处理的文本对象');
    }

    var justification = resolveJustification(alignment);
    var processedFrames = 0;
    var modifiedFrames = 0;
    var skippedFrames = 0;
    var failedFrames = 0;

    for (var t = 0; t < targets.length; t++) {
        var tf = targets[t];
        if (!isProcessableTextFrame(tf)) {
            skippedFrames++;
            continue;
        }

        processedFrames++;

        try {
            var tr = tf.textRange;
            if (!tr) {
                failedFrames++;
                continue;
            }

            var changed = false;

            if (justification !== null) {
                try {
                    tr.paragraphAttributes.justification = justification;
                    changed = true;
                } catch (eJustify) {}
            }

            if (applyParagraphSpacing) {
                try {
                    tr.paragraphAttributes.spaceBefore = spaceBeforePt;
                    changed = true;
                } catch (eBefore) {}
                try {
                    tr.paragraphAttributes.spaceAfter = spaceAfterPt;
                    changed = true;
                } catch (eAfter) {}
            }

            if (applyFirstLineIndent) {
                if (indentMode === 'chars') {
                    if (applyParagraphIndentByChars(tf, indentChars) > 0) {
                        changed = true;
                    }
                } else {
                    try {
                        tr.paragraphAttributes.firstLineIndent = firstLineIndentPt;
                        changed = true;
                    } catch (eIndentPt) {}
                }
            }

            if (applyLineSpacing) {
                try { tr.characterAttributes.autoLeading = false; } catch (eAutoLeading) {}
                try {
                    tr.characterAttributes.leading = lineSpacingPt;
                    changed = true;
                } catch (eLeading) {}
            }

            if (changed) {
                modifiedFrames++;
            }
        } catch (frameErr) {
            failedFrames++;
        }
    }

    return $.hopeflow.utils.returnResult({
        processed_frames: processedFrames,
        modified_frames: modifiedFrames,
        skipped_frames: skippedFrames,
        failed_frames: failedFrames,
        scope: scope,
        alignment: alignment,
        apply_line_spacing: applyLineSpacing,
        apply_paragraph_spacing: applyParagraphSpacing,
        apply_first_line_indent: applyFirstLineIndent,
        indent_mode: indentMode,
        indent_chars: indentChars
    });
})();
