/**
 * 等间距分布 - Distribute Spacing
 * Distributes selected objects with fixed spacing (converted to document units) or auto-calculated equal spacing.
 * Args: { axis: 'x'|'y', spacing?: number, centerAlign?: boolean }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(3, '请至少选择 3 个对象以进行分布');
    if (!sel) return $.hopeflow.utils.returnError('选择不足');

    var args = $.hopeflow.utils.getArgs();
    var axis = args.axis || 'x';
    var inputSpacing = args.spacing; // can be undefined/null/empty string
    var centerAlign = args.centerAlign !== false; // default true

    // 1. Get objects and bounds
    var items = [];
    for (var i = 0; i < sel.length; i++) {
        items.push({
            item: sel[i],
            bounds: $.hopeflow.utils.getBounds([sel[i]])
        });
    }

    // 2. Sort items by position
    if (axis === 'x') {
        items.sort(function (a, b) { return a.bounds.left - b.bounds.left; });
    } else {
        // For Y, in AI coordinates (Cartesian logic often used in scripting but API is top-down?) 
        // AI DOM: bounds[1] is TOP. Higher value is HIGHER up? 
        // No, standard AI coordinate system: Y increases UPWARDS.
        // BUT most scripts assume top-down visual sorting. 
        // Let's check geometricBounds: [Left, Top, Right, Bottom].
        // Usually Top > Bottom.
        // So sorting by Top DESCENDING = Visual Top to Bottom?
        // Let's sort by Top DESCENDING for "Visual Top to Bottom" distribution.
        items.sort(function (a, b) { return b.bounds.top - a.bounds.top; });
    }

    // 3. Determine Spacing (in Points)
    var gap = 0;

    // Check if user provided a specific spacing value
    var isFixedSpacing = (inputSpacing !== undefined && inputSpacing !== null && inputSpacing !== "");

    if (isFixedSpacing) {
        // Convert input unit to Points
        var val = parseFloat(inputSpacing);
        if (isNaN(val)) val = 0;

        var rulerUnits = app.activeDocument.rulerUnits;
        var unitStr = "pt"; // default

        switch (rulerUnits) {
            case RulerUnits.Millimeters: unitStr = "mm"; break;
            case RulerUnits.Centimeters: unitStr = "cm"; break;
            case RulerUnits.Inches: unitStr = "in"; break;
            case RulerUnits.Points: unitStr = "pt"; break;
            case RulerUnits.Picas: unitStr = "pc"; break;
            case RulerUnits.Pixels: unitStr = "px"; break;
        }

        // Convert: e.g. UnitValue(10, "mm").as("pt")
        gap = new UnitValue(val, unitStr).as("pt");
    } else {
        // Auto-Calculate Equal Spacing
        // Gap = (Total Visual Span - Sum of Object Dimensions) / (N - 1)

        var totalDim = 0;
        for (var i = 0; i < items.length; i++) {
            totalDim += (axis === 'x' ? items[i].bounds.width : items[i].bounds.height);
        }

        var startEdge, endEdge;
        if (axis === 'x') {
            startEdge = items[0].bounds.left;
            endEdge = items[items.length - 1].bounds.left + items[items.length - 1].bounds.width; // Right edge of last item
        } else {
            // Y Axis: Start = Top of First, End = Bottom of Last
            startEdge = items[0].bounds.top;
            endEdge = items[items.length - 1].bounds.bottom;
            // Note: startEdge > endEdge in AI coords
        }

        var totalSpan = Math.abs(startEdge - endEdge);
        var totalGapSpace = totalSpan - totalDim;
        gap = totalGapSpace / (items.length - 1);
    }

    // 4. Apply Positions
    // We keep the first item fixed.
    var currentPos;

    if (axis === 'x') {
        currentPos = items[0].bounds.left + items[0].bounds.width + gap;
        for (var i = 1; i < items.length; i++) {
            // Move item to currentPos
            var dX = currentPos - items[i].bounds.left;
            items[i].item.translate(dX, 0);

            // Advance
            currentPos += items[i].bounds.width + gap;
        }
    } else {
        // Y Axis (Top to Bottom)
        // currentPos starts at (First Bottom - Gap) ?
        // item[0].top is highest. 
        // Next item top should be: item[0].bottom - gap (since Y goes up)
        // Wait, "Space between items" means Bottom of A -> Top of B.
        // Y coords: Top = 100, Bottom = 90. Height = 10.
        // Item B: Top should be 90 - gap.

        currentPos = items[0].bounds.bottom - gap;

        for (var i = 1; i < items.length; i++) {
            // Target Top for this item is currentPos
            var dY = currentPos - items[i].bounds.top;
            items[i].item.translate(0, dY);

            // Advance: Next target top is (This Item Bottom - gap)
            // This Item Bottom = (This Item Top - Height) ? 
            // Better: get new bounds or calculate
            // Since we just translated, we know the new Top is currentPos.
            // New Bottom = currentPos - items[i].bounds.height.

            currentPos = (currentPos - items[i].bounds.height) - gap;
        }
    }

    // 5. Center Align (perpendicular to distribution axis)
    if (centerAlign) {
        // Recalculate bounds after distribution
        var sumCenter = 0;
        for (var i = 0; i < items.length; i++) {
            var b = $.hopeflow.utils.getBounds([items[i].item]);
            if (axis === 'x') {
                // Align vertical centers
                sumCenter += b.top - b.height / 2;
            } else {
                // Align horizontal centers
                sumCenter += b.left + b.width / 2;
            }
        }
        var avgCenter = sumCenter / items.length;

        for (var i = 0; i < items.length; i++) {
            var b = $.hopeflow.utils.getBounds([items[i].item]);
            if (axis === 'x') {
                var itemCenter = b.top - b.height / 2;
                items[i].item.translate(0, avgCenter - itemCenter);
            } else {
                var itemCenter = b.left + b.width / 2;
                items[i].item.translate(avgCenter - itemCenter, 0);
            }
        }
    }

    return $.hopeflow.utils.returnResult({ distributed: items.length, axis: axis, spacingPt: gap });
})();
