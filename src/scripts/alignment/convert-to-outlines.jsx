/**
 * 转曲/扩展 - Convert to Outlines / Expand
 * Converts text to outlines and expands stroked paths.
 * Args: none
 */
(function () {
    if (!$.hopeflow) return;

    var doc = app.activeDocument;

    // Check selection, if empty select all
    if (doc.selection.length === 0) {
        app.executeMenuCommand('selectall');
    }

    var sel = doc.selection;
    if (!sel || sel.length === 0) return $.hopeflow.utils.returnError('无对象可操作');

    var textCount = 0;
    var expandCount = 0;

    // 1. Convert Text to Outlines
    // Process in reverse order to handle index changes
    for (var i = sel.length - 1; i >= 0; i--) {
        var item = sel[i];
        try {
            if (item.typename === 'TextFrame') {
                item.createOutline();
                textCount++;
            } else if (item.typename === 'GroupItem') {
                // Recursively find text frames in groups
                var texts = [];
                collectTextFrames(item, texts);
                for (var j = texts.length - 1; j >= 0; j--) {
                    texts[j].createOutline();
                    textCount++;
                }
            }
        } catch (e) { /* skip items that can't be converted */ }
    }

    // 2. Expand Appearance & Outline Strokes
    // Select everything currently in selection (including new outlines)
    // In Illustrator, createOutline() usually keeps the new object selected if the original was selected, 
    // but safe to rely on app.selection for the menu commands.

    // Attempt Expand Appearance (Object > Expand Appearance)
    // Handles specific effects, blends, envelopes
    try {
        app.executeMenuCommand('expandStyle');
        expandCount++;
    } catch (e) { }

    // Attempt Outline Stroke (Object > Path > Outline Stroke)
    // Handles standard strokes
    try {
        app.executeMenuCommand('outline');
        expandCount++;
    } catch (e) { }

    return $.hopeflow.utils.returnResult({
        textConverted: textCount,
        actionsPerformed: expandCount > 0 ? 'Expanded & Outlined' : 'None'
    });

    function collectTextFrames(group, result) {
        if (!group || !group.pageItems) return;
        for (var i = 0; i < group.pageItems.length; i++) {
            var child = group.pageItems[i];
            if (child.typename === 'TextFrame') {
                result.push(child);
            } else if (child.typename === 'GroupItem') {
                collectTextFrames(child, result);
            }
        }
    }
})();
