/**
 * 选择相似文本框 - Select Similar Text Frames
 * Uses the first selected text frame as reference and selects similar text frames.
 * Args: { scope?: 'selection'|'document', matchFont?: boolean, matchSize?: boolean, matchColor?: boolean, matchContents?: boolean, matchKind?: boolean }
 */
(function () {
    if (!$.hopeflow) return;

    function approxEqual(a, b) {
        return Math.abs(a - b) < 0.01;
    }

    function getReferenceFrame(doc) {
        if (!doc.selection || doc.selection.length === 0) return null;
        for (var i = 0; i < doc.selection.length; i++) {
            if (doc.selection[i].typename === 'TextFrame') {
                return doc.selection[i];
            }
        }
        return null;
    }

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

    function getFrameInfo(textFrame) {
        var attrs = textFrame.textRange.characterAttributes;
        var fontName = '';
        var size = 0;
        var colorKey = 'none';
        var kind = textFrame.kind ? String(textFrame.kind) : '';

        try {
            if (attrs.textFont) {
                fontName = String(attrs.textFont.name || '');
            }
        } catch (e) {}

        try {
            size = Number(attrs.size || 0);
        } catch (e2) {}

        try {
            var fillColor = attrs.fillColor;
            if (fillColor) {
                if (fillColor.typename === 'RGBColor') {
                    colorKey = 'rgb:' + [fillColor.red, fillColor.green, fillColor.blue].join(',');
                } else if (fillColor.typename === 'CMYKColor') {
                    colorKey = 'cmyk:' + [fillColor.cyan, fillColor.magenta, fillColor.yellow, fillColor.black].join(',');
                } else if (fillColor.typename === 'GrayColor') {
                    colorKey = 'gray:' + fillColor.gray;
                } else if (fillColor.typename === 'SpotColor' && fillColor.spot) {
                    colorKey = 'spot:' + String(fillColor.spot.name || '');
                } else {
                    colorKey = String(fillColor.typename || 'unknown');
                }
            }
        } catch (e3) {}

        return {
            fontName: fontName,
            size: size,
            colorKey: colorKey,
            contents: String(textFrame.contents || ''),
            kind: kind
        };
    }

    function isSelectable(textFrame) {
        if (!textFrame || textFrame.locked || textFrame.hidden) return false;
        try {
            if (textFrame.layer && (textFrame.layer.locked || !textFrame.layer.visible)) return false;
        } catch (e) {}
        return !!textFrame.editable;
    }

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('当前没有打开的文档');
        }

        var doc = app.activeDocument;
        var args = $.hopeflow.utils.getArgs();
        var scope = args.scope || 'selection';
        var reference = getReferenceFrame(doc);

        if (!reference) {
            return $.hopeflow.utils.returnError('请先选择一个文本框作为参照');
        }

        var matchFont = args.matchFont !== false;
        var matchSize = args.matchSize !== false;
        var matchColor = args.matchColor === true;
        var matchContents = args.matchContents === true;
        var matchKind = args.matchKind === true;

        if (!matchFont && !matchSize && !matchColor && !matchContents && !matchKind) {
            return $.hopeflow.utils.returnError('请至少勾选一个匹配条件');
        }

        var refInfo = getFrameInfo(reference);
        var frames = getCandidateFrames(doc, scope);
        var selected = 0;

        doc.selection = null;

        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            if (!isSelectable(frame)) continue;

            var info = getFrameInfo(frame);
            var matched = true;

            if (matchFont && info.fontName !== refInfo.fontName) matched = false;
            if (matched && matchSize && !approxEqual(info.size, refInfo.size)) matched = false;
            if (matched && matchColor && info.colorKey !== refInfo.colorKey) matched = false;
            if (matched && matchContents && info.contents !== refInfo.contents) matched = false;
            if (matched && matchKind && info.kind !== refInfo.kind) matched = false;

            if (matched) {
                frame.selected = true;
                selected++;
            }
        }

        return $.hopeflow.utils.returnResult({
            selected: selected,
            scope: scope,
            referenceFont: refInfo.fontName,
            referenceSize: refInfo.size
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
