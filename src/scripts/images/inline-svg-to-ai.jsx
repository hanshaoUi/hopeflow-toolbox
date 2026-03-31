(function () {
    /*
      名称: inlineSVGToAI.jsx
      作者: Alexander Ladygin
    */
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

    function main() {
        if (app.documents.length == 0) { alert("错误: \n请先打开一个文档，然后再试。"); return; }
        uiDialog().show();
    }

    function uiDialog() {
        var win = new Window("dialog", "内联SVG转AI", undefined);
        win.orientation="column"; win.alignChildren=["center","top"]; win.spacing=10; win.margins=16;
        var winPanel = win.add("panel"); winPanel.text="SVG导入"; winPanel.orientation="column";
        winPanel.alignChildren=["left","top"]; winPanel.spacing=10; winPanel.margins=10;
        winPanel.add("statictext", undefined, "请粘贴您的SVG代码:");
        var SVGCode = winPanel.add("edittext", [0,0,400,200], "", {multiline:true, scrolling:true});
        var insertOpen = winPanel.add("checkbox", undefined, '通过"打开"插入（避免AI崩溃）');
        insertOpen.value = true;
        var winButtonsGroup = win.add("group"); winButtonsGroup.orientation="row"; winButtonsGroup.spacing=10;
        var closeButton = winButtonsGroup.add("button", undefined, "取消"); closeButton.preferredSize.width=120;
        var pasteButton = winButtonsGroup.add("button", undefined, "粘贴"); pasteButton.preferredSize.width=120;
        closeButton.onClick = function() { win.close(); };
        pasteButton.onClick = function() {
            var code = SVGCode.text;
            if (code) { importSVG(code, insertOpen.value); win.close(); }
            else { alert("您没有插入SVG代码。"); }
        };
        return win;
    }

    function importSVG(string, useOpenParam) {
        var svgFile = new File("" + Folder.temp + "/inlineSVGtoAI.svg");
        var backDoc = activeDocument;
        svgFile.open("w"); svgFile.write(string); svgFile.close();
        var shouldOpen = (useOpenParam !== undefined) ? useOpenParam : true;
        if (!shouldOpen && (activeDocument.importFile instanceof Function)) {
            activeDocument.importFile(svgFile, false, false, false);
        } else {
            app.open(svgFile);
            var l=activeDocument.layers; var i=l.length;
            while (i--) l[i].hasSelectedArtwork=true;
            app.copy(); activeDocument.close(SaveOptions.DONOTSAVECHANGES);
            backDoc.activate(); app.paste();
        }
        $.sleep(500);
        if (svgFile.exists) svgFile.remove();
    }

    if ($.hopeflow) {
        var args = $.hopeflow.utils.getArgs();
        var svgCode = args.svgCode;
        var useOpen = args.useOpen === 'true' || args.useOpen === true;
        if (svgCode) {
            importSVG(svgCode, useOpen);
            return $.hopeflow.utils.returnResult('success');
        } else {
            main();
        }
    } else if (!$.hopeflow) {
        try { main(); } catch (e) { alert("inlineSVGToAI: 发生了未知错误。"); }
    }
})();
