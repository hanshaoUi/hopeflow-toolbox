/**
 * 批量重命名 - Batch Rename
 * Renames selected objects based on a template.
 * Args: { template: string, startIndex: number }
 * Template supports {n} for number.
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var template = args.template || 'Item {n}';
    var startIdx = args.startIndex !== undefined ? args.startIndex : 1;

    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        var name = template.replace('{n}', startIdx + i);
        item.name = name;
    }

    return $.hopeflow.utils.returnResult({ processed: sel.length });
})();
