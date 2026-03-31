(function () {
    //打开多页PDF
    function doSomethingHeadless(filePath, from, to) {
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
        var fileRef = File(filePath);
        var idoc = app.documents.add();
        var pdfOptions = app.preferences.PDFFileOptions;
        pdfOptions.pDFCropToBox = PDFBoxType.PDFBOUNDINGBOX;
        var spacing = 10;
        var arrPagesInfo = [];
        var firstabRect, abRect;

        for (var j = from; j <= to; j++) {
            pdfOptions.pageToOpen = j;
            try {
                var pdfDoc = open(fileRef, DocumentColorSpace.RGB);
                var pdfLayer = pdfDoc.activeLayer;
                var items = pdfLayer.pageItems;
                var tempGrp = pdfDoc.groupItems.add();
                tempGrp.name = "Page " + j;
                for (var i = items.length-1; i > 0; i--) items[i].move(tempGrp, ElementPlacement.PLACEATBEGINNING);
                var pdfw = pdfDoc.width; var pdfh = pdfDoc.height;
                var activeAB = pdfDoc.artboards[0];
                var pdfLeft = activeAB.artboardRect[0]; var pdfTop = activeAB.artboardRect[1];
                if (j == from) { firstabRect = activeAB.artboardRect; abRect = firstabRect; }
                else {
                    if ((abRect[2]+spacing+pdfw) >= 8494) {
                        var ableft=firstabRect[0]; var abtop=firstabRect[3]-spacing;
                        var abright=ableft+pdfw; var abbottom=abtop-pdfh;
                        firstabRect=[ableft,abtop,abright,abbottom];
                    } else { ableft=abRect[2]+spacing; abtop=abRect[1]; abright=ableft+pdfw; abbottom=abtop-pdfh; }
                    abRect=[ableft,abtop,abright,abbottom];
                }
                var deltaX=tempGrp.left-pdfLeft; var deltaY=pdfTop-tempGrp.top;
                arrPagesInfo.unshift([tempGrp.name,deltaX,deltaY,abRect]);
                tempGrp.duplicate(idoc, ElementPlacement.PLACEATBEGINNING);
                pdfDoc.close(SaveOptions.DONOTSAVECHANGES);
            } catch (e) { continue; }
        }

        var ilayer = idoc.layers[idoc.layers.length-1];
        for (var k = arrPagesInfo.length-1; k >= 0; k--) {
            var newAB = idoc.artboards.add(arrPagesInfo[k][3]);
            var newLayer = idoc.layers.add(); newLayer.name = arrPagesInfo[k][0];
            var igroup = ilayer.groupItems[k];
            igroup.left = newAB.artboardRect[0]+arrPagesInfo[k][1];
            igroup.top = newAB.artboardRect[1]-arrPagesInfo[k][2];
            igroup.move(newLayer, ElementPlacement.PLACEATEND);
        }
        idoc.artboards[0].remove(); ilayer.remove();
        app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;
        return arrPagesInfo.length;
    }

    function openPDF(defaultFrom, defaultTo, preSelectedFile) {
        var win = new Window("dialog", "打开多页PDF @HOPE");
        win.orientation="column"; win.alignChildren=["start","top"]; win.spacing=10; win.margins=16;
        var fileGroup = win.add("group"); fileGroup.orientation="column"; fileGroup.alignChildren="left";
        fileGroup.add("statictext", undefined, "选择PDF文件:");
        var pathGroup = fileGroup.add("group");
        var txtPath = pathGroup.add("edittext", undefined, preSelectedFile ? preSelectedFile.fsName : "请选择文件...", {readonly:true});
        txtPath.characters = 35;
        var btnSelect = pathGroup.add("button", undefined, "选择...");
        if (preSelectedFile) btnSelect.enabled = false;
        var pagePanel = win.add("panel", undefined, "导入页面范围"); pagePanel.alignChildren="left";
        var rangeGroup = pagePanel.add("group");
        rangeGroup.add("statictext", undefined, "从:");
        var startPage = rangeGroup.add("edittext", undefined, defaultFrom || "1"); startPage.characters=5;
        rangeGroup.add("statictext", undefined, "到:");
        var endPage = rangeGroup.add("edittext", undefined, defaultTo || "1"); endPage.characters=5;
        var btnGroup = win.add("group"); btnGroup.alignment="center";
        var btnOk = btnGroup.add("button", undefined, "确定", {name:"ok"});
        btnGroup.add("button", undefined, "取消", {name:"cancel"});
        btnSelect.onClick = function() { var f=File.openDialog("选择PDF文件...","*.pdf"); if(f) txtPath.text=f.fsName; };
        btnOk.onClick = function() {
            var filePath=txtPath.text;
            if (filePath==""||filePath=="请选择文件...") { alert("请先选择 PDF 文件"); return; }
            var from=parseInt(startPage.text); var to=parseInt(endPage.text);
            if (isNaN(from)||isNaN(to)||from<1||to<from) { alert("请输入有效的页面范围。"); return; }
            var n = doSomethingHeadless(filePath, from, to);
            alert("成功打开 " + n + " 页");
            win.close();
        };
        win.center(); win.show();
    }

    if ($.hopeflow) {
        var args = $.hopeflow.utils.getArgs();
        var fromDefault = parseInt(args.fromPage) || 1;
        var toDefault = parseInt(args.toPage) || 1;
        var fileRef = File.openDialog("选择PDF文件...", "*.pdf");
        if (fileRef) {
            doSomethingHeadless(fileRef.fsName, fromDefault, toDefault);
            return $.hopeflow.utils.returnResult('success');
        }
    } else if (!$.hopeflow) {
        openPDF();
    }
})();
