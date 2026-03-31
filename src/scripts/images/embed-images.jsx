(function () {
    //一键嵌入图片
    function embedImages() {
        try { app.activeDocument; } catch (e) { return false; }
        var doc = app.activeDocument;
        var num = doc.placedItems.length;
        if (!num) return 0;
        var success = [];
        while (doc.placedItems.length) {
            try { setEmbed(doc, success); } catch (e) {}
        }
        return success.length;

        function setEmbed(doc, success) {
            for (var i = 0; i < doc.placedItems.length; i++) {
                doc.placedItems[i].embed();
                success.push("1");
            }
        }
    }

    if ($.hopeflow) {
        var result = embedImages();
        if (result === false) return $.hopeflow.utils.returnError('请先打开一个文档');
        return $.hopeflow.utils.returnResult({ embedded: result });
    } else {
        var n = embedImages();
        if (n === false) { alert("请至少打开一个文档.", "提示"); return; }
        if (n === 0) { alert("当前未嵌入的链接对象数量为\"0\"", "运行结束"); return; }
        alert("共完成嵌入 " + n + " 个对象。", "完成");
    }
})();
