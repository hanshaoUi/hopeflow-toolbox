/**
 * 对齐到画板 - Align Selection to Artboard
 * Aligns selected objects to artboard edges or center.
 * Args: { alignment: 'center'|'left'|'right'|'top'|'bottom'|'h-center'|'v-center'|'top-left'|... }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1, '请至少选择 1 个对象');
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var alignment = args.alignment || 'center';
    var ab = $.hopeflow.utils.getActiveArtboardBounds();

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        var bounds = $.hopeflow.utils.getBounds([item]);

        switch (alignment) {
            case 'left':
                // Left Middle: Left X, Center Y
                $.hopeflow.utils.moveTo(item, ab.left, ab.top - (ab.height - bounds.height) / 2);
                break;
            case 'right':
                // Right Middle: Right X, Center Y
                $.hopeflow.utils.moveTo(item, ab.right - bounds.width, ab.top - (ab.height - bounds.height) / 2);
                break;
            case 'top':
                // Top Center: Center X, Top Y
                $.hopeflow.utils.moveTo(item, ab.left + (ab.width - bounds.width) / 2, ab.top);
                break;
            case 'bottom':
                // Bottom Center: Center X, Bottom Y
                $.hopeflow.utils.moveTo(item, ab.left + (ab.width - bounds.width) / 2, ab.bottom + bounds.height);
                break;
            case 'top-left':
                $.hopeflow.utils.moveTo(item, ab.left, ab.top);
                break;
            case 'top-right':
                $.hopeflow.utils.moveTo(item, ab.right - bounds.width, ab.top);
                break;
            case 'bottom-left':
                $.hopeflow.utils.moveTo(item, ab.left, ab.bottom + bounds.height);
                break;
            case 'bottom-right':
                $.hopeflow.utils.moveTo(item, ab.right - bounds.width, ab.bottom + bounds.height);
                break;
            case 'h-center':
                $.hopeflow.utils.moveTo(item, ab.left + (ab.width - bounds.width) / 2, bounds.top);
                break;
            case 'v-center':
                $.hopeflow.utils.moveTo(item, bounds.left, ab.top - (ab.height - bounds.height) / 2);
                break;
            case 'center':
            default:
                $.hopeflow.utils.centerInBounds(item, ab);
                break;
        }
    }

    return $.hopeflow.utils.returnResult({ aligned: sel.length, alignment: alignment });
})();
