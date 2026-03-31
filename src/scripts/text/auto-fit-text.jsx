/**
 * 自动适配文本框 - Auto Fit Text / Convert Text Type
 * Converts between Point Text and Area Text
 * Args: { mode: 'point' | 'area' }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var mode = args.mode || 'point';

    var count = 0;
    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        if (item.typename === "TextFrame") {
            if (mode === 'point' && item.kind === TextType.AREATEXT) {
                // Check Illustrator version or usage. convertAreaObjectToPointObject is standard in recent versions
                try {
                    item.convertAreaObjectToPointObject();
                    count++;
                } catch (e) {
                    // ignore or try legacy method?
                }
            } else if (mode === 'area' && item.kind === TextType.POINTTEXT) {
                try {
                    item.convertPointObjectToAreaObject();
                    count++;
                } catch (e) {
                }
            }
        }
    }

    return $.hopeflow.utils.returnResult({ converted_count: count });
})();
