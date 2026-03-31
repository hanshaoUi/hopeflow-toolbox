/**
 * 查找替换颜色 - Find and Replace Color
 * Replaces a specific fill/stroke color across all objects.
 * Args: { findColor: {c,m,y,k}|{r,g,b}, replaceColor: {c,m,y,k}|{r,g,b}, tolerance?: number, target: 'fill'|'stroke'|'both' }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    if (!args.findColor || !args.replaceColor) {
        return $.hopeflow.utils.returnError('请指定查找颜色和替换颜色');
    }

    var tolerance = args.tolerance || 5;
    var target = args.target || 'both';
    var doc = app.activeDocument;
    var count = 0;

    var replaceColorObj;
    if (args.replaceColor.c !== undefined) {
        replaceColorObj = $.hopeflow.utils.cmykColor(
            args.replaceColor.c, args.replaceColor.m,
            args.replaceColor.y, args.replaceColor.k
        );
    } else {
        replaceColorObj = $.hopeflow.utils.rgbColor(
            args.replaceColor.r, args.replaceColor.g, args.replaceColor.b
        );
    }

    function colorsMatch(a, find) {
        if (!a) return false;
        if (find.c !== undefined && a.typename === 'CMYKColor') {
            return Math.abs(a.cyan - find.c) <= tolerance &&
                   Math.abs(a.magenta - find.m) <= tolerance &&
                   Math.abs(a.yellow - find.y) <= tolerance &&
                   Math.abs(a.black - find.k) <= tolerance;
        }
        if (find.r !== undefined && a.typename === 'RGBColor') {
            return Math.abs(a.red - find.r) <= tolerance &&
                   Math.abs(a.green - find.g) <= tolerance &&
                   Math.abs(a.blue - find.b) <= tolerance;
        }
        return false;
    }

    for (var i = 0; i < doc.pageItems.length; i++) {
        var item = doc.pageItems[i];
        if (item.typename === 'PathItem') {
            if ((target === 'fill' || target === 'both') && item.filled) {
                if (colorsMatch(item.fillColor, args.findColor)) {
                    item.fillColor = replaceColorObj;
                    count++;
                }
            }
            if ((target === 'stroke' || target === 'both') && item.stroked) {
                if (colorsMatch(item.strokeColor, args.findColor)) {
                    item.strokeColor = replaceColorObj;
                    count++;
                }
            }
        }
    }

    return $.hopeflow.utils.returnResult({ replaced: count });
})();
