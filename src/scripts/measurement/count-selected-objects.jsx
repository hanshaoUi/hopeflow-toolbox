(function () {
    // 统计选中对象数量
    function countSelectedObjects() {
        if (app.documents.length === 0) return null;
        var doc = app.activeDocument;
        return doc.selection ? doc.selection.length : 0;
    }

    if ($.hopeflow) {
        var count = countSelectedObjects();
        if (count === null) return $.hopeflow.utils.returnError('请先打开一个文档');
        return $.hopeflow.utils.returnResult({ count: count });
    } else {
        if (app.documents.length === 0) { alert('请先打开一个文档。'); return; }
        var n = app.activeDocument.selection ? app.activeDocument.selection.length : 0;
        alert('选中的对象共 ' + n + ' 个。');
    }
})();
