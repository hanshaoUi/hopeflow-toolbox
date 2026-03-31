/**
 * 批量重命名图层 - Batch Rename Layers
 * Rename layers with pattern, sequence numbers, find/replace.
 * Args: { pattern?: string, prefix?: string, suffix?: string, find?: string, replace?: string, startNum?: number }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var doc = app.activeDocument;
    var count = 0;

    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        var newName = layer.name;

        if (args.find && args.replace !== undefined) {
            newName = newName.split(args.find).join(args.replace);
        }

        if (args.pattern) {
            var num = (args.startNum || 1) + i;
            newName = args.pattern
                .replace('{name}', layer.name)
                .replace('{num}', String(num))
                .replace('{num2}', (num < 10 ? '0' : '') + num);
        }

        if (args.prefix) newName = args.prefix + newName;
        if (args.suffix) newName = newName + args.suffix;

        if (newName !== layer.name) {
            layer.name = newName;
            count++;
        }
    }

    return $.hopeflow.utils.returnResult({ renamed: count });
})();
