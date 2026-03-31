/**
 * 出血/偏移路径 (Offset Path / Bleed)
 * Ported from run.json
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var bleedOffset = parseFloat(args.offset);
    if (isNaN(bleedOffset)) bleedOffset = 3; // Default 3mm

    var includeImages = args.includeImages === true || args.includeImages === 'true';
    var releaseCompound = args.releaseCompound === true || args.releaseCompound === 'true';

    if (app.documents.length === 0) return $.hopeflow.utils.returnError('无文档打开');
    if (app.selection.length === 0) return $.hopeflow.utils.returnError('请先选择对象');

    var doc = app.activeDocument;

    // Convert mm to pt
    var bleedOffsetPt = bleedOffset * 2.83465;
    if (bleedOffsetPt === 0) bleedOffsetPt = 0.00001;

    // Helper: FXDoAction
    function FXDoAction(actionCode) {
        var folder = new Folder('~/Documents/TumoData');
        if (!folder.exists) {
            folder.create();
        }
        var aiaName = '/tumo' + new Date().getTime() + '.aia';
        var tmp = File(folder + aiaName);
        tmp.open('w');
        tmp.write(actionCode);
        tmp.close();
        
        try {
            app.loadAction(tmp);
            app.doScript("bb", "b", false);
            app.unloadAction("b", "");
        } catch(e) {
            // alert(e);
        } finally {
            tmp.remove();
        }
    }

    // Helper: FXRecurse
    function FXRecurse(itemsArr, callback, config) {
        config = config || {};
        var items = [];
        for (var i = 0; i < itemsArr.length; i++) {
            items.push(itemsArr[i]);
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.typename === "GroupItem") {
                if ((item.clipped && config.clipped) || (!item.clipped && config.group)) {
                    callback(item);
                } else {
                    FXRecurse(item.pageItems, callback, config);
                }
            } else if (item.typename === "CompoundPathItem") {
                if (config.compound) {
                    callback(item);
                } else {
                    FXRecurse(item.pathItems, callback, config);
                }
            } else {
                callback(item);
            }
        }
    }

    // Process Images
    if (includeImages) {
        FXRecurse(doc.selection, function (item) {
            if (item.typename === "RasterItem") {
                var maskGroup = doc.groupItems.add();
                var rect = maskGroup.pathItems.rectangle(item.top, item.left, item.width, item.height);
                rect.filled = true;
                item.move(maskGroup, ElementPlacement.PLACEATEND);
                maskGroup.clipped = true;
                maskGroup.selected = true;
            }
        });
    }

    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

    // Define Action String (From run.json)
    // Note: The action code string from run.json uses "bleedOffsetPt" variable concatenation.
    // I need to reconstruct the string carefully.
    
    var releaseActionCode = "/version 3\n" +
        "/name [ 1\n" +
        "62\n" +
        "]\n" +
        "/isOpen 1\n" +
        "/actionCount 1\n" +
        "/action-1 {\n" +
        "/name [ 2\n" +
        "6262\n" +
        "]\n" +
        "/keyIndex 0\n" +
        "/colorIndex 0\n" +
        "/isOpen 1\n" +
        "/eventCount 10\n" +
        "/event-1 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_offset)\n" +
        "/localizedName [ 11\n" +
        "4f66667365742050617468\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 1\n" +
        "/showDialog 0\n" +
        "/parameterCount 3\n" +
        "/parameter-1 { /key 1868985204 /showInPalette -1 /type (unit real) /value " + bleedOffsetPt + " /unit 592476268 }\n" +
        "/parameter-2 { /key 1835627634 /showInPalette -1 /type (real) /value 4.0 }\n" +
        "/parameter-3 { /key 1785623664 /showInPalette -1 /type (enumerated) /name [ 5 526f756e64 ] /value 0 }\n" +
        "}\n" +
        "/event-2 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_pathfinder)\n" +
        "/localizedName [ 10\n" +
        "5061746866696e646572\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 1\n" +
        "/parameter-1 { /key 1851878757 /showInPalette -1 /type (enumerated) /name [ 3 416464 ] /value 0 }\n" +
        "}\n" +
        "/event-3 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (adobe_releaseCompound)\n" +
        "/localizedName [ 21\n" +
        "52656c6561736520436f6d706f756e642050617468\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 0\n" +
        "}\n" +
        "/event-4 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_pathfinder)\n" +
        "/localizedName [ 10\n" +
        "5061746866696e646572\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 1\n" +
        "/parameter-1 { /key 1851878757 /showInPalette -1 /type (enumerated) /name [ 3 416464 ] /value 0 }\n" +
        "}\n" +
        "/event-5 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_setColor)\n" +
        "/localizedName [ 9\n" +
        "53657420636f6c6f72\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 2\n" +
        "/parameter-1 { /key 1768186740 /showInPalette -1 /type (ustring) /value [ 10 46696c6c20636f6c6f72 ] }\n" +
        "/parameter-2 { /key 1718185068 /showInPalette -1 /type (boolean) /value 1 }\n" +
        "}\n" +
        "/event-6 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_swatches)\n" +
        "/localizedName [ 8\n" +
        "5377617463686573\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 1\n" +
        "/parameter-1 { /key 1937204072 /showInPalette -1 /type (ustring) /value [ 6 5b4e6f6e655d ] }\n" +
        "}\n" +
        "/event-7 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_setColor)\n" +
        "/localizedName [ 9\n" +
        "53657420636f6c6f72\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 2\n" +
        "/parameter-1 { /key 1768186740 /showInPalette -1 /type (ustring) /value [ 12 5374726f6b6520636f6c6f72 ] }\n" +
        "/parameter-2 { /key 1718185068 /showInPalette -1 /type (boolean) /value 0 }\n" +
        "}\n" +
        "/event-8 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_swatches)\n" +
        "/localizedName [ 8\n" +
        "5377617463686573\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 1\n" +
        "/parameter-1 { /key 1937204072 /showInPalette -1 /type (ustring) /value [ 20 74756d6f5f6175746f5f6f66667365745f637574 ] }\n" +
        "}\n" +
        "/event-9 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (adobe_cut)\n" +
        "/localizedName [ 3\n" +
        "437574\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 0\n" +
        "}\n" +
        "/event-10 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (adobe_pasteInFront)\n" +
        "/localizedName [ 14\n" +
        "506173746520696e2046726f6e74\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 0\n" +
        "}\n" +
        "}\n";

    var noReleaseActionCode = "/version 3\n" +
        "/name [ 1\n" +
        "62\n" +
        "]\n" +
        "/isOpen 1\n" +
        "/actionCount 1\n" +
        "/action-1 {\n" +
        "/name [ 2\n" +
        "6262\n" +
        "]\n" +
        "/keyIndex 0\n" +
        "/colorIndex 0\n" +
        "/isOpen 1\n" +
        "/eventCount 8\n" +
        "/event-1 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_offset)\n" +
        "/localizedName [ 11\n" +
        "4f66667365742050617468\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 1\n" +
        "/showDialog 0\n" +
        "/parameterCount 3\n" +
        "/parameter-1 { /key 1868985204 /showInPalette -1 /type (unit real) /value " + bleedOffsetPt + " /unit 592476268 }\n" +
        "/parameter-2 { /key 1835627634 /showInPalette -1 /type (real) /value 4.0 }\n" +
        "/parameter-3 { /key 1785623664 /showInPalette -1 /type (enumerated) /name [ 5 526f756e64 ] /value 0 }\n" +
        "}\n" +
        "/event-2 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_pathfinder)\n" +
        "/localizedName [ 10\n" +
        "5061746866696e646572\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 1\n" +
        "/parameter-1 { /key 1851878757 /showInPalette -1 /type (enumerated) /name [ 3 416464 ] /value 0 }\n" +
        "}\n" +
        "/event-3 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_setColor)\n" +
        "/localizedName [ 9\n" +
        "53657420636f6c6f72\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 2\n" +
        "/parameter-1 { /key 1768186740 /showInPalette -1 /type (ustring) /value [ 10 46696c6c20636f6c6f72 ] }\n" +
        "/parameter-2 { /key 1718185068 /showInPalette -1 /type (boolean) /value 1 }\n" +
        "}\n" +
        "/event-4 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_swatches)\n" +
        "/localizedName [ 8\n" +
        "5377617463686573\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 1\n" +
        "/parameter-1 { /key 1937204072 /showInPalette -1 /type (ustring) /value [ 6 5b4e6f6e655d ] }\n" +
        "}\n" +
        "/event-5 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_setColor)\n" +
        "/localizedName [ 9\n" +
        "53657420636f6c6f72\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 2\n" +
        "/parameter-1 { /key 1768186740 /showInPalette -1 /type (ustring) /value [ 12 5374726f6b6520636f6c6f72 ] }\n" +
        "/parameter-2 { /key 1718185068 /showInPalette -1 /type (boolean) /value 0 }\n" +
        "}\n" +
        "/event-6 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (ai_plugin_swatches)\n" +
        "/localizedName [ 8\n" +
        "5377617463686573\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 1\n" +
        "/parameter-1 { /key 1937204072 /showInPalette -1 /type (ustring) /value [ 20 74756d6f5f6175746f5f6f66667365745f637574 ] }\n" +
        "}\n" +
        "/event-7 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (adobe_cut)\n" +
        "/localizedName [ 3\n" +
        "437574\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 0\n" +
        "}\n" +
        "/event-8 {\n" +
        "/useRulersIn1stQuadrant 0\n" +
        "/internalName (adobe_pasteInFront)\n" +
        "/localizedName [ 14\n" +
        "506173746520696e2046726f6e74\n" +
        "]\n" +
        "/isOpen 0\n" +
        "/isOn 1\n" +
        "/hasDialog 0\n" +
        "/parameterCount 0\n" +
        "}\n" +
        "}\n";

    // Setup Spot Color
    var newColor = new SpotColor();
    newColor.tint = 100;
    var spot = null;
    var cmykColor = new CMYKColor();
    cmykColor.cyan = 0; cmykColor.magenta = 100; cmykColor.yellow = 0; cmykColor.black = 0;

    try {
        spot = doc.spots.getByName("tumo_auto_offset_cut");
    } catch (e) {
        spot = null;
    }
    if (spot) {
        newColor.spot = spot;
    } else {
        newColor.spot = doc.spots.add();
        newColor.spot.name = "tumo_auto_offset_cut";
        newColor.spot.colorType = ColorModel.SPOT;
        newColor.spot.color = cmykColor;
    }

    var actionCode = releaseCompound ? releaseActionCode : noReleaseActionCode;

    FXDoAction(actionCode);

    // Filter to layer
    var cutLayer = null;
    try {
        cutLayer = doc.layers.getByName("tumo_auto_offset_cut_layer");
    } catch (e) {
        cutLayer = doc.layers.add();
        cutLayer.name = "tumo_auto_offset_cut_layer";
    }

    FXRecurse(doc.selection, function (item) {
        if (item.typename === "PathItem" && item.strokeColor && item.strokeColor.spot && item.strokeColor.spot.name === "tumo_auto_offset_cut") {
            item.move(cutLayer, ElementPlacement.PLACEATEND);
        }
        if (item.typename === "CompoundPathItem") {
            try {
                var tempItem = item.pathItems[0];
                if (tempItem.strokeColor && tempItem.strokeColor.spot && tempItem.strokeColor.spot.name === "tumo_auto_offset_cut") {
                    item.move(cutLayer, ElementPlacement.PLACEATEND);
                }
            } catch(e){}
        }
    }, {
        compound: true,
    });

    app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;
    return $.hopeflow.utils.returnResult({ message: '执行成功' });
})();
