/**
 * 文本统计 - Text Statistics
 * Count characters, words, lines, and text frames in document.
 */
(function() {
    if (!$.hopeflow) return;

    var doc = app.activeDocument;
    var frames = $.hopeflow.utils.getAllTextFrames();
    var totalChars = 0, totalWords = 0, totalLines = 0;
    var fonts = {};

    for (var i = 0; i < frames.length; i++) {
        var content = frames[i].contents;
        totalChars += content.length;
        totalWords += content.split(/\s+/).length;
        totalLines += frames[i].lines.length;

        for (var j = 0; j < frames[i].textRanges.length; j++) {
            var font = frames[i].textRanges[j].characterAttributes.textFont;
            if (font) fonts[font.name] = true;
        }
    }

    return $.hopeflow.utils.returnResult({
        textFrames: frames.length,
        characters: totalChars,
        words: totalWords,
        lines: totalLines,
        fonts: Object.keys(fonts)
    });
})();
