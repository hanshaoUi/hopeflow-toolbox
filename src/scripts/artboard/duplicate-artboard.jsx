/**
 * 复制画板 - Duplicate Artboard with Content
 * Creates a copy of the active artboard with all its content.
 * Args: { direction: 'right'|'below', gap?: number, count?: number }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var direction = args.direction || 'right';
    var gap = args.gap || $.hopeflow.utils.mmToPt(10);
    var count = args.count || 1;

    var doc = app.activeDocument;
    var srcIdx = doc.artboards.getActiveArtboardIndex();
    var srcAb = doc.artboards[srcIdx];
    var srcRect = srcAb.artboardRect;
    var abWidth = srcRect[2] - srcRect[0];
    var abHeight = srcRect[1] - srcRect[3];
    var srcItems = $.hopeflow.utils.getItemsOnArtboard(srcIdx);

    for (var n = 0; n < count; n++) {
        var offsetX = direction === 'right' ? (abWidth + gap) * (n + 1) : 0;
        var offsetY = direction === 'below' ? -(abHeight + gap) * (n + 1) : 0;

        var newAb = doc.artboards.add([
            srcRect[0] + offsetX,
            srcRect[1] + offsetY,
            srcRect[2] + offsetX,
            srcRect[3] + offsetY
        ]);
        newAb.name = srcAb.name + ' copy ' + (n + 1);

        // Duplicate items to new position
        for (var i = 0; i < srcItems.length; i++) {
            var dup = srcItems[i].duplicate();
            dup.translate(offsetX, offsetY);
        }
    }

    return $.hopeflow.utils.returnResult({ created: count });
})();
