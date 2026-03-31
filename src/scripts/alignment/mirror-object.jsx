/**
 * 镜像 - Mirror Object
 * Mirrors selected objects horizontally or vertically around their collective center.
 * Args: { direction: 'horizontal'|'vertical' }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1, '请至少选择 1 个对象');
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var direction = args.direction || 'horizontal';

    // Get collective bounds center
    var bounds = $.hopeflow.utils.getBounds(sel);
    var cx = bounds.left + bounds.width / 2;
    var cy = bounds.top - bounds.height / 2;

    // Build transformation matrix
    // Illustrator transform: item.transform(matrix)
    // Horizontal mirror: scale(-1, 1) around center
    // Vertical mirror: scale(1, -1) around center
    if (direction === 'horizontal') {
        // Reflect horizontally: flip across vertical axis through center
        for (var i = 0; i < sel.length; i++) {
            var item = sel[i];
            var itemBounds = $.hopeflow.utils.getBounds([item]);
            var itemCx = itemBounds.left + itemBounds.width / 2;

            // Mirror: new center X = cx + (cx - itemCx) = 2*cx - itemCx
            var newCx = 2 * cx - itemCx;
            var dx = newCx - itemCx;

            // Resize -100% horizontal (flip) then translate
            var matrix = app.getScaleMatrix(-100, 100);
            item.transform(matrix, true, true, true, true, true, Transformation.CENTER);
            item.translate(dx, 0);
        }
    } else {
        // Reflect vertically: flip across horizontal axis through center
        for (var i = 0; i < sel.length; i++) {
            var item = sel[i];
            var itemBounds = $.hopeflow.utils.getBounds([item]);
            var itemCy = itemBounds.top - itemBounds.height / 2;

            var newCy = 2 * cy - itemCy;
            var dy = newCy - itemCy;

            var matrix = app.getScaleMatrix(100, -100);
            item.transform(matrix, true, true, true, true, true, Transformation.CENTER);
            item.translate(0, dy);
        }
    }

    return $.hopeflow.utils.returnResult({ mirrored: sel.length, direction: direction });
})();
