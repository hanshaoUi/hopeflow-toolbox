(function () {
    // 面积标注
    function make_area() {
        var doc = app.activeDocument;
        var actLay = doc.activeLayer;
        var sel = doc.selection;
        var u = 2.834645669291;
        for (var i = 0; i < sel.length; i++) {
            var selInfo = sel[i].geometricBounds;
            var selL = selInfo[0];
            var selT = selInfo[1];
            var selH = Math.abs(selInfo[3] - selInfo[1]);
            var txt = actLay.textFrames.add();
            txt.contents = '周长:' + ((sel[i].length / u).toFixed(3)) + 'mm\n面积:' + ((sel[i].area / (u * u)).toFixed(3)) + 'mm^2';
            txt.position = [selL, selT - selH];
        }
        return sel.length;
    }

    if ($.hopeflow) {
        if (!app.documents.length) return $.hopeflow.utils.returnError('请先打开一个文档');
        var count = make_area();
        return $.hopeflow.utils.returnResult({ annotated: count });
    } else {
        make_area();
    }
})();
