/**
 * Make Envelopes With Tops
 * Use the last selected item as the source artwork and make envelope
 * distortions from every valid item selected before it.
 */
(function () {
    if (!$.hopeflow) return;

    if (parseInt(app.version, 10) < 16) {
        return $.hopeflow.utils.returnError('此功能需要 Illustrator CS6 或更高版本');
    }

    if (app.documents.length === 0) {
        return $.hopeflow.utils.returnError('请先打开一个文档');
    }

    if (!app.selection || app.selection.length < 2 || app.selection.typename === 'TextRange') {
        return $.hopeflow.utils.returnError('请至少选择两个对象，最后选择的对象作为封套内容');
    }

    var doc = app.activeDocument;
    var originalSelection = [];
    for (var i = 0; i < app.selection.length; i++) {
        originalSelection.push(app.selection[i]);
    }

    var sourceItem = originalSelection[originalSelection.length - 1];
    var madeCount = 0;
    var skippedCount = 0;

    function isRightType(item) {
        var types = ['PathItem', 'CompoundPathItem', 'GroupItem', 'MeshItem', 'SymbolItem'];
        for (var i = 0; i < types.length; i++) {
            if (item.typename === types[i]) return true;
        }
        return false;
    }

    for (var j = originalSelection.length - 2; j >= 0; j--) {
        var container = originalSelection[j];

        if (!isRightType(container)) {
            skippedCount++;
            continue;
        }

        doc.selection = null;

        var duplicatedSource = sourceItem.duplicate();
        duplicatedSource.selected = true;
        container.selected = true;

        app.executeMenuCommand('Make Envelope');
        madeCount++;
    }

    doc.selection = null;

    if (madeCount === 0) {
        return $.hopeflow.utils.returnError('未找到可作为封套外形的对象');
    }

    var message = '已创建 ' + madeCount + ' 个封套变形';
    if (skippedCount > 0) {
        message += '，跳过 ' + skippedCount + ' 个不支持的对象';
    }

    return $.hopeflow.utils.returnResult({
        message: message,
        count: madeCount,
        skipped: skippedCount
    });
})();
