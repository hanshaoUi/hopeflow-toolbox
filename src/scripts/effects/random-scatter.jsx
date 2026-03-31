/**
 * 随机散布 - Random Scatter
 * Scatters selected objects randomly within a range.
 * Args: { distance: number }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var inputDist = args.distance || 50;

    var unit = $.hopeflow.utils.getRulerUnitsString();
    var maxDist = new UnitValue(inputDist, unit).as('pt');

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];

        // Random x/y between -max and +max
        var dx = (Math.random() * 2 - 1) * maxDist;
        var dy = (Math.random() * 2 - 1) * maxDist;

        item.translate(dx, dy);

        // Optional: Random rotation
        if (args.rotate) {
            item.rotate(Math.random() * 360);
        }

        // Optional: Random scale
        if (args.scale) {
            var s = 50 + Math.random() * 100; // 50-150%
            item.resize(s, s);
        }
    }

    return $.hopeflow.utils.returnResult({ scattered: sel.length });
})();
