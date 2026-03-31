/**
 * 锁定/解锁 - Lock / Unlock Objects
 * Locks or unlocks selected objects.
 * Args: { action: 'lock'|'unlock' }
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var action = args.action || 'lock';

    var doc = app.activeDocument;
    var count = 0;

    if (action === 'unlock') {
        // Unlock all locked items on the active artboard (or entire doc)
        // Since locked items can't be selected, iterate all page items
        var items = doc.pageItems;
        for (var i = 0; i < items.length; i++) {
            if (items[i].locked) {
                items[i].locked = false;
                count++;
            }
        }
    } else {
        // Lock selected items
        var sel = $.hopeflow.utils.requireSelection(1, '请至少选择 1 个对象来锁定');
        if (!sel) return $.hopeflow.utils.returnError('无选择');

        for (var i = 0; i < sel.length; i++) {
            sel[i].locked = true;
            count++;
        }
    }

    return $.hopeflow.utils.returnResult({ action: action, count: count });
})();
