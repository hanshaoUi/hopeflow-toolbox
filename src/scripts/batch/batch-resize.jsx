/**
 * 智能缩放 - Smart Resize
 * Upgrades batch resize with independent X/Y scale, target dimensions,
 * anchor point control, and stroke/pattern/gradient scaling options.
 * Backward compatible with legacy args: { mode: 'scale'|'width'|'height', value: number }
 */
(function () {
    if (!$.hopeflow) return;

    function toNumber(value, fallback) {
        var num = Number(value);
        return isNaN(num) ? fallback : num;
    }

    function toPositiveNumber(value) {
        if (value === '' || value === null || typeof value === 'undefined') return null;
        var num = Number(value);
        if (isNaN(num) || num <= 0) return null;
        return num;
    }

    function toPoints(value) {
        var unit = $.hopeflow.utils.getRulerUnitsString() || 'pt';
        return new UnitValue(Number(value), unit).as('pt');
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

    function getResizePlan(item, args) {
        var mode = String(args.mode || 'scale');
        var lockAspect = args.lockAspect !== false;
        var scaleX = 100;
        var scaleY = 100;

        if (mode === 'width' || mode === 'height') {
            var legacyTarget = toPositiveNumber(args.value);
            if (!legacyTarget) return null;
            var legacyTargetPt = toPoints(legacyTarget);
            if (mode === 'width') {
                if (!item.width) return null;
                scaleX = scaleY = (legacyTargetPt / item.width) * 100;
            } else {
                if (!item.height) return null;
                scaleX = scaleY = (legacyTargetPt / item.height) * 100;
            }
            return { scaleX: scaleX, scaleY: scaleY };
        }

        if (mode === 'size') {
            var targetWidth = toPositiveNumber(args.targetWidth);
            var targetHeight = toPositiveNumber(args.targetHeight);
            var targetWidthPt = targetWidth ? toPoints(targetWidth) : null;
            var targetHeightPt = targetHeight ? toPoints(targetHeight) : null;

            if (!targetWidthPt && !targetHeightPt) {
                return null;
            }

            if (lockAspect) {
                if (targetWidthPt) {
                    if (!item.width) return null;
                    scaleX = scaleY = (targetWidthPt / item.width) * 100;
                } else {
                    if (!item.height) return null;
                    scaleX = scaleY = (targetHeightPt / item.height) * 100;
                }
            } else {
                if (targetWidthPt) {
                    if (!item.width) return null;
                    scaleX = (targetWidthPt / item.width) * 100;
                }
                if (targetHeightPt) {
                    if (!item.height) return null;
                    scaleY = (targetHeightPt / item.height) * 100;
                }
            }

            return { scaleX: scaleX, scaleY: scaleY };
        }

        var legacyScale = toNumber(args.value, 100);
        scaleX = toNumber(args.scaleX, legacyScale);
        scaleY = lockAspect ? scaleX : toNumber(args.scaleY, scaleX);
        return { scaleX: scaleX, scaleY: scaleY };
    }

    try {
        var sel = $.hopeflow.utils.requireSelection(1);
        if (!sel) return $.hopeflow.utils.returnError('无选择');

        var args = $.hopeflow.utils.getArgs();
        var anchor = getAnchorPoint(args.anchor);
        var scalePatterns = args.scalePatterns !== false;
        var scaleGradients = args.scaleGradients !== false;
        var scaleStrokes = args.scaleStrokes !== false;
        var processed = 0;
        var skipped = 0;

        for (var i = 0; i < sel.length; i++) {
            var item = sel[i];
            var plan = getResizePlan(item, args);

            if (!plan) {
                skipped++;
                continue;
            }

            var lineScale = scaleStrokes ? (Math.abs(plan.scaleX) + Math.abs(plan.scaleY)) / 2 : 100;

            item.resize(
                plan.scaleX,
                plan.scaleY,
                true,
                scalePatterns,
                scaleGradients,
                true,
                lineScale,
                anchor
            );

            processed++;
        }

        if (!processed) {
            return $.hopeflow.utils.returnError('没有可处理的对象，或目标尺寸无效');
        }

        return $.hopeflow.utils.returnResult({
            processed: processed,
            skipped: skipped,
            mode: String(args.mode || 'scale'),
            anchor: String(args.anchor || '5'),
            scaleStrokes: scaleStrokes,
            scalePatterns: scalePatterns,
            scaleGradients: scaleGradients
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
