/**
 * Convert to Outlines / Expand
 * Converts text to outlines and expands strokes/appearances into paths.
 * Args: none
 */
(function () {
    if (!$.hopeflow) return;

    if (!app.documents.length) {
        return $.hopeflow.utils.returnError('No active document');
    }

    var doc = app.activeDocument;

    if (doc.selection.length === 0) {
        app.executeMenuCommand('selectall');
    }

    var sel = doc.selection;
    if (!sel || sel.length === 0) {
        return $.hopeflow.utils.returnError('No objects to process');
    }

    var textCount = 0;
    var expandCount = 0;
    var expandCommands = [];
    var itemsToExpand = [];
    var createdOutlines = [];

    for (var i = sel.length - 1; i >= 0; i--) {
        var item = sel[i];
        try {
            if (item.typename === 'TextFrame') {
                var outlined = item.createOutline();
                if (outlined) createdOutlines.push(outlined);
                textCount++;
            } else if (item.typename === 'GroupItem') {
                itemsToExpand.push(item);
                var texts = [];
                collectTextFrames(item, texts);
                for (var j = texts.length - 1; j >= 0; j--) {
                    var groupOutlined = texts[j].createOutline();
                    if (groupOutlined) createdOutlines.push(groupOutlined);
                    textCount++;
                }
            } else {
                itemsToExpand.push(item);
            }
        } catch (e) { }
    }

    // createOutline() can replace or narrow the active selection. Restore a
    // selection that includes the original non-text objects plus new outlines
    // before running expansion commands.
    selectItems(itemsToExpand.concat(createdOutlines));

    // Simulate Object > Expand for strokes/objects without opening the Expand
    // dialog, then expand the live appearance into editable paths.
    runMenuCommand('Live Outline Object');
    runMenuCommand('Live Outline Stroke');
    runMenuCommand('expandStyle');

    // Fallbacks for Illustrator versions/objects that respond to the older
    // menu command route.
    runMenuCommand('outline');
    runMenuCommand('expandStyle');

    return $.hopeflow.utils.returnResult({
        textConverted: textCount,
        expandCommands: expandCommands,
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

    function selectItems(items) {
        app.selection = null;
        for (var i = 0; i < items.length; i++) {
            try {
                if (items[i] && !items[i].locked && !items[i].hidden) {
                    items[i].selected = true;
                }
            } catch (e) { }
        }
    }

    function runMenuCommand(commandName) {
        try {
            if (!doc.selection || doc.selection.length === 0) {
                selectItems(itemsToExpand.concat(createdOutlines));
            }
            app.executeMenuCommand(commandName);
            expandCount++;
            expandCommands.push(commandName);
        } catch (e) { }
    }
})();
