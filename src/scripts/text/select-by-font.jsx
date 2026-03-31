/**
 * 按字体选择文本 - Select By Font
 * Select text frames containing the target font.
 * Args: { fontName: string, scope?: 'selection'|'document' }
 */
(function () {
    if (!$.hopeflow) return;

    function getCandidateFrames(doc, scope) {
        var frames = [];
        var i;

        if (scope === 'selection' && doc.selection && doc.selection.length > 0) {
            for (i = 0; i < doc.selection.length; i++) {
                if (doc.selection[i].typename === 'TextFrame') {
                    frames.push(doc.selection[i]);
                }
            }
            if (frames.length > 0) {
                return frames;
            }
        }

        for (i = 0; i < doc.textFrames.length; i++) {
            frames.push(doc.textFrames[i]);
        }
        return frames;
    }

    function frameUsesFont(textFrame, targetFontName) {
        try {
            if (textFrame.textRange &&
                textFrame.textRange.characterAttributes &&
                textFrame.textRange.characterAttributes.textFont &&
                String(textFrame.textRange.characterAttributes.textFont.name || '') === targetFontName) {
                return true;
            }
        } catch (e) {}

        try {
            var ranges = textFrame.textRanges;
            for (var i = 0; i < ranges.length; i++) {
                var textFont = ranges[i].characterAttributes && ranges[i].characterAttributes.textFont;
                if (textFont && String(textFont.name || '') === targetFontName) {
                    return true;
                }
            }
        } catch (e2) {}

        return false;
    }

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('当前没有打开的文档');
        }

        var doc = app.activeDocument;
        var args = $.hopeflow.utils.getArgs();
        var fontName = String(args.fontName || '').replace(/^\s+|\s+$/g, '');
        var scope = args.scope || 'selection';

        if (!fontName) {
            return $.hopeflow.utils.returnError('请先选择字体');
        }

        var frames = getCandidateFrames(doc, scope);
        var selected = 0;

        doc.selection = null;

        for (var i = 0; i < frames.length; i++) {
            if (frameUsesFont(frames[i], fontName)) {
                frames[i].selected = true;
                selected++;
            }
        }

        return $.hopeflow.utils.returnResult({
            fontName: fontName,
            scope: scope,
            selected: selected
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
