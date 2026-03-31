/**
 * 提取色板 - Extract Color Palette from Selection
 * Extracts unique colors from selected objects.
 */
(function() {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var colors = [];
    var seen = {};

    function addColor(color) {
        if (!color) return;
        var key;
        if (color.typename === 'CMYKColor') {
            key = 'cmyk:' + Math.round(color.cyan) + ',' + Math.round(color.magenta) + ',' +
                  Math.round(color.yellow) + ',' + Math.round(color.black);
            if (!seen[key]) {
                seen[key] = true;
                colors.push({ type: 'cmyk', c: Math.round(color.cyan), m: Math.round(color.magenta),
                               y: Math.round(color.yellow), k: Math.round(color.black) });
            }
        } else if (color.typename === 'RGBColor') {
            key = 'rgb:' + Math.round(color.red) + ',' + Math.round(color.green) + ',' + Math.round(color.blue);
            if (!seen[key]) {
                seen[key] = true;
                colors.push({ type: 'rgb', r: Math.round(color.red), g: Math.round(color.green),
                               b: Math.round(color.blue) });
            }
        } else if (color.typename === 'SpotColor') {
            key = 'spot:' + color.spot.name;
            if (!seen[key]) {
                seen[key] = true;
                colors.push({ type: 'spot', name: color.spot.name });
            }
        }
    }

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        if (item.filled) addColor(item.fillColor);
        if (item.stroked) addColor(item.strokeColor);
    }

    return $.hopeflow.utils.returnResult({ colors: colors, count: colors.length });
})();
