/**
 * 自动编号 - Auto Number
 * Automatically numbers selected text frames based on position.
 * Args:
 *   prefix (string): Text before number
 *   suffix (string): Text after number
 *   startNum (number): Starting number (default 1)
 *   increment (number): Step size (default 1)
 *   sortOrder (string): 'row' (Z-shape, top-left to right, then down) or 'column' (N-shape, top-left to down, then right)
 *   decimalPlaces (number): Min digits (padding). If 0 or null, uses startNum length.
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('请至少选择一个文本对象');

    var args = $.hopeflow.utils.getArgs();
    var prefix = args.prefix || "";
    var suffix = args.suffix || "";
    var startNum = parseInt(args.startNum) || 1;
    var increment = parseInt(args.increment) || 1;
    var sortOrder = args.sortOrder || 'row'; // 'row' or 'column'
    var manualPadding = parseInt(args.decimalPlaces) || 0;

    // Recursive function to get text frames
    function extractTextFrames(items, resultList) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.typename === "TextFrame") {
                var bounds = item.geometricBounds; // [left, top, right, bottom]
                var centerX = (bounds[0] + bounds[2]) / 2;
                var centerY = (bounds[1] + bounds[3]) / 2;
                resultList.push({
                    item: item,
                    x: centerX,
                    y: centerY
                });
            } else if (item.typename === "GroupItem") {
                extractTextFrames(item.pageItems, resultList);
            }
        }
    }

    var itemsArray = [];
    extractTextFrames(sel, itemsArray);

    if (itemsArray.length === 0) return $.hopeflow.utils.returnError('选区中没有文本对象');

    // Sort
    itemsArray.sort(function (a, b) {
        var tolerance = 1; // pt
        // AI Coordinates: Higher Y is Top. Smaller Y is Bottom.
        // So Top-to-Bottom means descending Y.

        if (sortOrder === 'row') {
            // Row-major: Primary Sort is Y (Top to Bottom), Secondary is X (Left to Right)
            // Diff Y
            var dy = a.y - b.y;
            if (Math.abs(dy) > tolerance) {
                // Return b.y - a.y for Descending (Top first)
                return b.y - a.y;
            } else {
                // Same Row: Sort Left to Right (Ascending X)
                return a.x - b.x;
            }
        } else {
            // Column-major: Primary Sort is X (Left to Right), Secondary is Y (Top to Bottom)
            var dx = a.x - b.x;
            if (Math.abs(dx) > tolerance) {
                // Left to Right
                return a.x - b.x;
            } else {
                // Same Column: Top to Bottom (Descending Y)
                return b.y - a.y;
            }
        }
    });

    // Determine padding length
    var targetLength = manualPadding > 0 ? manualPadding : String(args.startNum).length;
    // Actually standard behavior: if user types '01', length is 2. 
    // args.startNum passed as string in JSON usually, but parsed to int. 
    // We might want to pass raw string for length detection if manual padding not set?
    // Let's rely on manualPadding or simple logic:
    // If startNum is 1, length 1. If 01, length 2 (but parsed as 1).
    // Let's default to String(startNum).length unless specified.

    // Better logic: Use the "startNum" string from params if available to detect length
    if (!manualPadding && args.startNumStr) {
        targetLength = args.startNumStr.length;
    }

    function pad(num, size) {
        var s = String(num);
        while (s.length < size) s = "0" + s;
        return s;
    }

    // Renumber
    for (var i = 0; i < itemsArray.length; i++) {
        var textItem = itemsArray[i].item;
        var currentNum = startNum + (i * increment);
        var numStr = pad(currentNum, targetLength);
        textItem.contents = prefix + numStr + suffix;
    }

    return $.hopeflow.utils.returnResult({ processed_count: itemsArray.length });
})();
