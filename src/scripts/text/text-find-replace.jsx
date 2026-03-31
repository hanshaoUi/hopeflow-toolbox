/**
 * 文本查找替换 - Text Find and Replace
 * Args: { find: string, replace: string, caseSensitive?: boolean }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    if (!args.find) return $.hopeflow.utils.returnError('请指定查找文本');

    var count = $.hopeflow.utils.findReplaceText(args.find, args.replace || '', {
        caseSensitive: args.caseSensitive
    });

    return $.hopeflow.utils.returnResult({ replaced: count });
})();
