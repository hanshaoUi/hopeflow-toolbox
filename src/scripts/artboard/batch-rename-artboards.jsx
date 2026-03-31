/**
 * 批量重命名画板 - Batch Rename Artboards
 * Renames all artboards with pattern, prefix, suffix, and optional size
 * Args: { namePattern, prefix, suffix, startNum, includeSize, sizeUnit }
 */
(function () {
    if (!$.hopeflow) return;

    var doc = app.activeDocument;
    var artboards = doc.artboards;

    if (artboards.length === 0) {
        return $.hopeflow.utils.returnError('当前文档没有画板');
    }

    var args = $.hopeflow.utils.getArgs();
    var namePattern = args.namePattern || '画板#';
    var prefix = args.prefix || '';
    var suffix = args.suffix || '';
    var startNum = args.startNum !== undefined ? parseInt(args.startNum) : 1;
    var includeSize = args.includeSize || false;
    var sizeUnit = args.sizeUnit || 'mm';
    var scaleVal = parseFloat(args.scale);
    var scale = (scaleVal && !isNaN(scaleVal)) ? scaleVal : 1;

    // Unit conversion factors from points
    var unitConversions = {
        'pt': 1,
        'px': 1,
        'mm': 0.352778,
        'cm': 0.0352778,
        'in': 0.0138889
    };

    var conversion = unitConversions[sizeUnit] || unitConversions['mm'];

    // Padding function for numbers
    function pad(num, length) {
        var str = '' + num;
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }

    // Format dimension with appropriate precision
    function formatDim(value) {
        if (Math.abs(value - Math.round(value)) < 0.01) {
            return Math.round(value);
        }
        return parseFloat(value.toFixed(2));
    }

    // Rename artboards
    for (var i = 0; i < artboards.length; i++) {
        var ab = artboards[i];
        var num = startNum + i;

        // Replace # with padded number
        var pattern = namePattern.replace('#', pad(num, 1));

        // Build name components
        var parts = [];

        if (prefix) parts.push(prefix);
        parts.push(pattern);
        if (includeSize) {
            var rect = ab.artboardRect;
            var width = Math.abs(rect[2] - rect[0]);
            var height = Math.abs(rect[1] - rect[3]);

            // Apply unit conversion AND user scale
            var dispWidth = formatDim(width * conversion * scale);
            var dispHeight = formatDim(height * conversion * scale);

            parts.push(dispWidth + 'x' + dispHeight + sizeUnit);
        }
        if (suffix) parts.push(suffix);

        // Join with hyphen
        ab.name = parts.join('-');
    }

    return $.hopeflow.utils.returnResult({ renamed: artboards.length });
})();
