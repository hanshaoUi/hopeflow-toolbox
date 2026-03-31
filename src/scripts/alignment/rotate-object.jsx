/**
 * 智能旋转 - Smart Rotate
 * Rotates selected objects with arbitrary angle, anchor point,
 * duplicate mode, and fill/pattern/gradient control.
 * Backward compatible with legacy args: { direction: 'cw'|'ccw' }
 */
(function () {
    if (!$.hopeflow) return;

    function toNumber(value, fallback) {
        var num = Number(value);
        return isNaN(num) ? fallback : num;
    }

    function getAnchorPoint(anchor) {
        switch (String(anchor || '5')) {
            case '1': return Transformation.TOPLEFT;
            case '2': return Transformation.TOP;
            case '3': return Transformation.TOPRIGHT;
            case '4': return Transformation.LEFT;
            case '5': return Transformation.CENTER;
            case '6': return Transformation.RIGHT;
            case '7': return Transformation.BOTTOMLEFT;
            case '8': return Transformation.BOTTOM;
            case '9': return Transformation.BOTTOMRIGHT;
            default: return Transformation.CENTER;
        }
    }

    try {
        var doc = app.activeDocument;
        var selection = doc.selection;

        if (!selection || selection.length === 0) {
            return $.hopeflow.utils.returnError('请先选择对象');
        }

        var args = $.hopeflow.utils.getArgs();
        var angle = toNumber(args.angle, null);

        if (angle === null) {
            var direction = args.direction || 'cw';
            angle = direction === 'ccw' ? 90 : -90;
        }

        var rotatePatterns = args.rotatePatterns !== false;
        var rotateGradients = args.rotateGradients !== false;
        var rotateStrokePatterns = args.rotateStrokePatterns !== false;
        var duplicate = args.duplicate === true;
        var anchor = getAnchorPoint(args.anchor);
        var processed = 0;

        doc.selection = null;

        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            var target = duplicate ? item.duplicate() : item;

            target.rotate(
                angle,
                true,
                rotatePatterns,
                rotateGradients,
                rotateStrokePatterns,
                anchor
            );

            target.selected = true;
            processed++;
        }

        return $.hopeflow.utils.returnResult({
            rotated: processed,
            angle: angle,
            duplicate: duplicate,
            anchor: String(args.anchor || '5'),
            rotatePatterns: rotatePatterns,
            rotateGradients: rotateGradients,
            rotateStrokePatterns: rotateStrokePatterns
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
