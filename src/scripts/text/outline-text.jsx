/**
 * 文本转曲 - Convert Text to Outlines
 * Converts selected or all text frames to outlines.
 * Args: { scope: 'selection'|'all' }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var scope = args.scope || 'selection';
    var doc = app.activeDocument;
    var frames;
    var count = 0;

    if (scope === 'all') {
        frames = $.hopeflow.utils.getAllTextFrames();
    } else {
        frames = $.hopeflow.utils.getSelection('TextFrame');
        if (frames.length === 0) {
            return $.hopeflow.utils.returnError('请选择文本对象');
        }
    }

    // Process in reverse to avoid index shifting
    for (var i = frames.length - 1; i >= 0; i--) {
        try {
            frames[i].createOutline();
            count++;
        } catch(e) {
            // Some text frames may fail (empty, locked, etc.)
        }
    }

    return $.hopeflow.utils.returnResult({ outlined: count });
})();
