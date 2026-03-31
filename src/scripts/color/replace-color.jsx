/**
 * 替换颜色 - Replace Color
 * Replaces a specific HEX color in selected objects.
 * Args: { findHex: string, replaceHex: string }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var findHex = args.findHex;
    var replaceHex = args.replaceHex;

    if (!findHex || !replaceHex) return $.hopeflow.utils.returnError('请输入颜色值');

    // Helper to convert HEX to RGB
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);
        var c = new RGBColor();
        c.red = r; c.green = g; c.blue = b;
        return c;
    }

    // Note: Comparing colors in AI is tricky due to color spaces (CMYK vs RGB).
    // This script assumes RGB document for simplicity or approximate matching.
    // Real production scripts check document color space.

    // For now, implement simple RGB match.
    // TODO: Add CMYK support if document is CMYK.

    var targetColor = hexToRgb(findHex);
    var replaceColor = hexToRgb(replaceHex);

    var count = 0;

    function isSameColor(c1, c2) {
        // Approximate tolerance
        return Math.abs(c1.red - c2.red) < 2 &&
            Math.abs(c1.green - c2.green) < 2 &&
            Math.abs(c1.blue - c2.blue) < 2;
    }

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        if (item.filled && item.fillColor.typename === 'RGBColor') {
            if (isSameColor(item.fillColor, targetColor)) {
                item.fillColor = replaceColor;
                count++;
            }
        }
        if (item.stroked && item.strokeColor.typename === 'RGBColor') {
            if (isSameColor(item.strokeColor, targetColor)) {
                item.strokeColor = replaceColor;
                count++;
            }
        }
    }

    return $.hopeflow.utils.returnResult({ processed: count });
})();
