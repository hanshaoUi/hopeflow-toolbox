/**
 * 填充描边互换 - Swap Fill and Stroke Colors
 * Swaps fill and stroke colors on selected objects.
 */
(function() {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var count = 0;
    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        if (item.typename === 'PathItem' || item.typename === 'CompoundPathItem') {
            var tempFill = item.fillColor;
            var tempStroke = item.strokeColor;
            var wasFilled = item.filled;
            var wasStroked = item.stroked;

            item.fillColor = tempStroke;
            item.strokeColor = tempFill;
            item.filled = wasStroked;
            item.stroked = wasFilled;
            count++;
        }
    }

    return $.hopeflow.utils.returnResult({ swapped: count });
})();
