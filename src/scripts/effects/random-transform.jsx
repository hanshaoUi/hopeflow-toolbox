/**
 * 随机变换 - Random Transform
 * Apply random rotation, scale, and position offsets to selected objects.
 * Args: { maxRotation?: number, maxScale?: number, maxOffset?: number }
 */
(function() {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var maxRot = args.maxRotation || 15;
    var maxScale = args.maxScale || 20;
    var maxOffset = $.hopeflow.utils.mmToPt(args.maxOffset || 5);

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];

        // Random rotation
        if (maxRot > 0) {
            item.rotate(rand(-maxRot, maxRot));
        }

        // Random scale
        if (maxScale > 0) {
            var scale = 100 + rand(-maxScale, maxScale);
            item.resize(scale, scale);
        }

        // Random offset
        if (maxOffset > 0) {
            item.translate(rand(-maxOffset, maxOffset), rand(-maxOffset, maxOffset));
        }
    }

    return $.hopeflow.utils.returnResult({ transformed: sel.length });
})();
