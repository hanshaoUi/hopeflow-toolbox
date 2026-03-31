(function () {
// 尺寸标注 - Dimension Annotation v3.0
// Based on original v2.5 with headless execution and real-time preview support

function make_size(params) {
    var layName = "尺寸标注层";
    var PREVIEW_GROUP = "__preview_dimension__";

    // ========== Headless Mode (called from CEP panel) ==========
    if (params && params.headless) {
        // Clear-only mode: remove preview annotations and return
        if (params.clearOnly) {
            try {
                var doc = app.activeDocument;
                var layer = doc.layers[layName];
                layer.locked = false;
                for (var i = layer.groupItems.length - 1; i >= 0; i--) {
                    if (layer.groupItems[i].name === PREVIEW_GROUP) {
                        layer.groupItems[i].remove();
                    }
                }
            } catch (e) {}
            return;
        }

        // Validate app state
        if (app.documents.length === 0) return;
        if (app.activeDocument.selection.length === 0) return;

        // Execute dimensions
        _executeDimensions(params, layName, PREVIEW_GROUP);
        return;
    }

    // ========== Standalone GUI Mode (fallback) ==========
    // When run directly in ExtendScript without CEP panel
    if (app.documents.length === 0) { alert("请先打开文档。", "错误提示"); return; }
    if (app.activeDocument.selection.length === 0) { alert("请先选择标注对象。", "错误提示"); return; }

    var VersionInfo = "v3.0";
    var color = new CMYKColor();

    // Defaults (with env persistence)
    var topCheck = false;
    var defaultTopCheck = $.getenv("Specify_defaultTopCheck") ? _toBool($.getenv("Specify_defaultTopCheck")) : topCheck;
    var rightCheck = false;
    var defaultRightCheck = $.getenv("Specify_defaultRightCheck") ? _toBool($.getenv("Specify_defaultRightCheck")) : rightCheck;
    var bottomCheck = false;
    var defaultBottomCheck = $.getenv("Specify_defaultBottomCheck") ? _toBool($.getenv("Specify_defaultBottomCheck")) : bottomCheck;
    var leftCheck = false;
    var defaultLeftCheck = $.getenv("Specify_defaultLeftCheck") ? _toBool($.getenv("Specify_defaultLeftCheck")) : leftCheck;
    var eachLength = true;
    var defaultEachLength = $.getenv("Specify_defaultEachLength") ? _toBool($.getenv("Specify_defaultEachLength")) : eachLength;
    var betweenLength = false;
    var defaultObjBetween = $.getenv("Specify_defaultObjBetween") ? _toBool($.getenv("Specify_defaultObjBetween")) : betweenLength;
    var overallLength = false;
    var defaultOverallLength = $.getenv("Specify_defaultOverallLength") ? _toBool($.getenv("Specify_defaultOverallLength")) : overallLength;
    var setFontSize = 12;
    var defaultFontSize = $.getenv("Specify_defaultFontSize") ? $.getenv("Specify_defaultFontSize") : setFontSize;
    var setUnitMode = 0;
    var defaultUnitMode = $.getenv("Specify_defaultUnitMode") ? $.getenv("Specify_defaultUnitMode") : setUnitMode;
    var setScale = 0;
    var defaultScale = $.getenv("Specify_defaultScale") ? $.getenv("Specify_defaultScale") : setScale;
    var setFaceFont = 0;
    var defaultFontFace = $.getenv("Specify_defaultFontFace") ? $.getenv("Specify_defaultFontFace") : setFaceFont;
    var setDecimals = 2;
    var defaultDecimals = $.getenv("Specify_defaultDecimals") ? $.getenv("Specify_defaultDecimals") : setDecimals;
    var setLineWeight = 0.5;
    var defaultLineWeight = $.getenv("Specify_defaultLineWeight") ? $.getenv("Specify_defaultLineWeight") : setLineWeight;
    var setgap = 3;
    var defaultlineGap = $.getenv("Specify_defaultlineGap") ? $.getenv("Specify_defaultlineGap") : setgap;
    var setDoubleLine = 8;
    var defaultDoubleLine = $.getenv("Specify_defaultDoubleLine") ? $.getenv("Specify_defaultDoubleLine") : setDoubleLine;
    var setArrow = false;
    var defaultArrow = $.getenv("Specify_defaultArrow") ? _toBool($.getenv("Specify_defaultArrow")) : setArrow;
    var setAsizeSize = 6;
    var defaultTriangleSize = $.getenv("Specify_defaultTriangleSize") ? $.getenv("Specify_defaultTriangleSize") : setAsizeSize;
    var setArrowSealing = false;
    var defaultArrowSealing = $.getenv("Specify_defaultArrowSealing") ? _toBool($.getenv("Specify_defaultArrowSealing")) : setArrowSealing;
    var setCyan = 0;
    var defaultColorCyan = $.getenv("Specify_defaultColorCyan") ? $.getenv("Specify_defaultColorCyan") : setCyan;
    var setMagenta = 100;
    var defaultColorMagenta = $.getenv("Specify_defaultColorMagenta") ? $.getenv("Specify_defaultColorMagenta") : setMagenta;
    var setYellow = 100;
    var defaultColorYellow = $.getenv("Specify_defaultColorYellow") ? $.getenv("Specify_defaultColorYellow") : setYellow;
    var setBlack = 10;
    var defaultColorBlack = $.getenv("Specify_defaultColorBlack") ? $.getenv("Specify_defaultColorBlack") : setBlack;
    var setUnits = false;
    var defaultUnits = $.getenv("Specify_defaultUnits") ? _toBool($.getenv("Specify_defaultUnits")) : setUnits;
    var lineStrokes = false;
    var defaultLineStrokes = $.getenv("Specify_defaultLineStrokes") ? _toBool($.getenv("Specify_defaultLineStrokes")) : lineStrokes;
    var setlockedLay = false;
    var defaultlockedLay = $.getenv("Specify_defaultlockedLay") ? _toBool($.getenv("Specify_defaultlockedLay")) : setlockedLay;
    var fontNamelist = "";

    // Build ScriptUI Dialog
    var win = new Window("dialog", "标注尺寸 " + VersionInfo, undefined, { closeButton: false });
    win.alignChildren = "left";

    // --- Dimension Panel ---
    var dimensionPanel = win.add("panel", undefined, "选择标注边");
    dimensionPanel.orientation = "column";
    dimensionPanel.alignment = "fill";
    dimensionPanel.margins = [20, 20, 20, 10];

    var dimensionGroup = dimensionPanel.add("group");
    dimensionGroup.orientation = "row";
    var bottomCheckbox = dimensionGroup.add("checkbox", undefined, "下边");
    bottomCheckbox.value = defaultBottomCheck;
    var leftCheckbox = dimensionGroup.add("checkbox", undefined, "左边");
    leftCheckbox.value = defaultLeftCheck;
    var topCheckbox = dimensionGroup.add("checkbox", undefined, "上边");
    topCheckbox.value = defaultTopCheck;
    var rightCheckbox = dimensionGroup.add("checkbox", undefined, "右边");
    rightCheckbox.value = defaultRightCheck;

    var selectAllGroup = dimensionPanel.add("group");
    selectAllGroup.orientation = "row";
    var selectAllCheckbox = selectAllGroup.add("checkbox", undefined, "四边");
    selectAllCheckbox.value = false;
    selectAllCheckbox.onClick = function () {
        bottomCheckbox.value = leftCheckbox.value = topCheckbox.value = rightCheckbox.value = selectAllCheckbox.value;
        bottomCheckbox.enabled = leftCheckbox.enabled = topCheckbox.enabled = rightCheckbox.enabled = !selectAllCheckbox.value;
    };

    // --- Options Panel ---
    var optionsPanel = win.add("panel", undefined, "设置选项");
    optionsPanel.margins = 20;
    optionsPanel.orientation = "column";

    var modeChecksGroup = optionsPanel.add("group");
    modeChecksGroup.orientation = "row";
    modeChecksGroup.alignment = "left";
    var eachSizeCheck = modeChecksGroup.add("checkbox", undefined, "单体标注");
    eachSizeCheck.value = defaultEachLength;
    var betweenCheckbox = modeChecksGroup.add("checkbox", undefined, "间距标注");
    betweenCheckbox.value = defaultObjBetween;
    var entiretySizeCheck = modeChecksGroup.add("checkbox", undefined, "总距离标注");
    entiretySizeCheck.value = defaultOverallLength;

    var customScaleGroup = optionsPanel.add("group");
    customScaleGroup.orientation = "row";
    customScaleGroup.alignment = "left";
    customScaleGroup.add("statictext", undefined, "单位:");
    var unitModeList = customScaleGroup.add("dropdownlist", [50, 10, 145, 30]);
    var unitItems = ["自动-auto", "毫米-mm", "厘米-cm", "米-m", "磅-pt", "像素-px", "英寸-in", "英尺-ft", "派卡-pc"];
    for (var j = 0; j < unitItems.length; j++) {
        unitModeList.add("item", unitItems[j]);
        if (j == 0) unitModeList.add("separator");
    }
    unitModeList.selection = defaultUnitMode;

    customScaleGroup.add("statictext", undefined, "比例:");
    var customScaleDropdown = customScaleGroup.add("dropdownlist", [50, 10, 120, 30]);
    for (var n = 1; n <= 10; n++) {
        customScaleDropdown.add("item", "1/" + n);
        if (n == 1) customScaleDropdown.add("separator");
    }
    customScaleDropdown.add("separator");
    var extraScales = [15, 20, 25, 50, 100, 150, 200, 300];
    for (var es = 0; es < extraScales.length; es++) customScaleDropdown.add("item", "1/" + extraScales[es]);
    customScaleDropdown.selection = defaultScale;

    var textFontGroup = optionsPanel.add("group");
    textFontGroup.orientation = "row";
    textFontGroup.alignment = "left";
    textFontGroup.add("statictext", undefined, "字体:");
    var fontdrplist = textFontGroup.add("dropdownlist", [50, 10, 267, 30]);
    var fontItems = ["系统默认", "微软雅黑", "黑体", "宋体", "Arial", "Arial-Bold", "ArialUnicode", "Tahoma", "Tahoma-Bold", "Times New Roman", "Times New Roman-Bold"];
    var fontNameMap = ["", "MicrosoftYaHei", "Simhei", "simsun", "ArialMT", "Arial-BoldMT", "ArialUnicodeMS", "Tahoma", "Tahoma-Bold", "TimesNewRomanPSMT", "TimesNewRomanPS-BoldMT"];
    for (var fi = 0; fi < fontItems.length; fi++) {
        fontdrplist.add("item", fontItems[fi]);
        if (fi == 0) fontdrplist.add("separator");
    }
    fontdrplist.selection = defaultFontFace;
    fontNamelist = fontNameMap[fontdrplist.selection.index] || "";
    fontdrplist.onChange = function () { fontNamelist = fontNameMap[fontdrplist.selection.index] || ""; };

    var textSiteGroup = optionsPanel.add("group");
    textSiteGroup.orientation = "row";
    textSiteGroup.alignment = "left";
    textSiteGroup.add("statictext", undefined, "字号大小:");
    var fontSizeInput = textSiteGroup.add("edittext", undefined, defaultFontSize);
    fontSizeInput.characters = 6;
    textSiteGroup.add("statictext", undefined, "小数位数:");
    var decimalPlacesInput = textSiteGroup.add("edittext", undefined, defaultDecimals);
    decimalPlacesInput.characters = 6;

    var lineGroup = optionsPanel.add("group");
    lineGroup.orientation = "row";
    lineGroup.alignment = "left";
    lineGroup.add("statictext", undefined, "标线宽度:");
    var lineWeightInput = lineGroup.add("edittext", undefined, defaultLineWeight);
    lineWeightInput.characters = 6;
    lineGroup.add("statictext", undefined, "标线距离:");
    var lineGapInput = lineGroup.add("edittext", undefined, defaultlineGap);
    lineGapInput.characters = 6;

    var lineGroup2 = optionsPanel.add("group");
    lineGroup2.orientation = "row";
    lineGroup2.alignment = "left";
    lineGroup2.add("statictext", undefined, "界线长:");
    var doubleLineInput = lineGroup2.add("edittext", undefined, defaultDoubleLine);
    doubleLineInput.characters = 3;
    var arrowCheckbox = lineGroup2.add("checkbox", undefined, "箭头:");
    arrowCheckbox.value = defaultArrow;
    lineGroup2.add("statictext", undefined, "");
    var triangleSizeInput = lineGroup2.add("edittext", undefined, defaultTriangleSize);
    triangleSizeInput.characters = 3;
    var arrowSealingCheckbox = lineGroup2.add("checkbox", undefined, "实心");
    arrowSealingCheckbox.value = defaultArrowSealing;

    arrowCheckbox.onClick = function () {
        triangleSizeInput.enabled = arrowCheckbox.value;
        arrowSealingCheckbox.enabled = arrowCheckbox.value;
        if (!arrowCheckbox.value) arrowSealingCheckbox.value = false;
    };
    triangleSizeInput.enabled = arrowCheckbox.value;
    arrowSealingCheckbox.enabled = arrowCheckbox.value;

    var colorGroup = optionsPanel.add("group");
    colorGroup.orientation = "row";
    colorGroup.alignment = "left";
    colorGroup.add("statictext", undefined, "标注颜色:");
    var colorInputCyan = colorGroup.add("edittext", undefined, defaultColorCyan);
    colorInputCyan.characters = 4;
    var colorInputMagenta = colorGroup.add("edittext", undefined, defaultColorMagenta);
    colorInputMagenta.characters = 4;
    var colorInputYellow = colorGroup.add("edittext", undefined, defaultColorYellow);
    colorInputYellow.characters = 4;
    var colorInputBlack = colorGroup.add("edittext", undefined, defaultColorBlack);
    colorInputBlack.characters = 4;

    var checkOptionGroup = optionsPanel.add("group");
    checkOptionGroup.orientation = "row";
    checkOptionGroup.alignment = "left";
    var textUnitsCheck = checkOptionGroup.add("checkbox", undefined, "单位后缀");
    textUnitsCheck.value = defaultUnits;
    var lineStrokeCheckbox = checkOptionGroup.add("checkbox", undefined, "包含描边");
    lineStrokeCheckbox.value = defaultLineStrokes;
    var lockedLay = checkOptionGroup.add("checkbox", undefined, "锁标注层");
    lockedLay.value = defaultlockedLay;

    // Buttons
    var buttonGroup = win.add("group");
    buttonGroup.alignment = "center";
    var ok_button = buttonGroup.add("button", undefined, "确定");
    var cancel_button = buttonGroup.add("button", undefined, "退出");
    ok_button.size = cancel_button.size = [80, 25];

    ok_button.onClick = function () {
        // Save env
        $.setenv("Specify_defaultTopCheck", topCheckbox.value);
        $.setenv("Specify_defaultRightCheck", rightCheckbox.value);
        $.setenv("Specify_defaultBottomCheck", bottomCheckbox.value);
        $.setenv("Specify_defaultLeftCheck", leftCheckbox.value);
        $.setenv("Specify_defaultEachLength", eachSizeCheck.value);
        $.setenv("Specify_defaultObjBetween", betweenCheckbox.value);
        $.setenv("Specify_defaultOverallLength", entiretySizeCheck.value);
        $.setenv("Specify_defaultUnitMode", unitModeList.selection.index);
        $.setenv("Specify_defaultScale", customScaleDropdown.selection.index);
        $.setenv("Specify_defaultFontFace", fontdrplist.selection.index);
        $.setenv("Specify_defaultFontSize", fontSizeInput.text);
        $.setenv("Specify_defaultDecimals", decimalPlacesInput.text);
        $.setenv("Specify_defaultLineWeight", lineWeightInput.text);
        $.setenv("Specify_defaultlineGap", lineGapInput.text);
        $.setenv("Specify_defaultDoubleLine", doubleLineInput.text);
        $.setenv("Specify_defaultTriangleSize", triangleSizeInput.text);
        $.setenv("Specify_defaultArrow", arrowCheckbox.value);
        $.setenv("Specify_defaultArrowSealing", arrowSealingCheckbox.value);
        $.setenv("Specify_defaultColorCyan", colorInputCyan.text);
        $.setenv("Specify_defaultColorMagenta", colorInputMagenta.text);
        $.setenv("Specify_defaultColorYellow", colorInputYellow.text);
        $.setenv("Specify_defaultColorBlack", colorInputBlack.text);
        $.setenv("Specify_defaultUnits", textUnitsCheck.value);
        $.setenv("Specify_defaultLineStrokes", lineStrokeCheckbox.value);
        $.setenv("Specify_defaultlockedLay", lockedLay.value);

        var theUnitStr = unitModeList.selection.toString().replace(/[^a-zA-Z]/g, "");
        var theScale = parseInt(customScaleDropdown.selection.toString().replace(/1\//g, "").replace(/[^0-9]/g, ""));

        color.cyan = parseInt(colorInputCyan.text) || 0;
        color.magenta = parseInt(colorInputMagenta.text) || 0;
        color.yellow = parseInt(colorInputYellow.text) || 0;
        color.black = parseInt(colorInputBlack.text) || 0;

        _executeDimensions({
            top: topCheckbox.value,
            bottom: bottomCheckbox.value,
            left: leftCheckbox.value,
            right: rightCheckbox.value,
            mode: eachSizeCheck.value ? 'each' : (betweenCheckbox.value ? 'between' : (entiretySizeCheck.value ? 'entire' : 'each')),
            fontSize: parseFloat(fontSizeInput.text) || 12,
            unitIndex: unitModeList.selection.index,
            decimals: parseInt(decimalPlacesInput.text) || 2,
            lineWeight: parseFloat(lineWeightInput.text) || 0.5,
            gap: parseFloat(lineGapInput.text) || 3,
            doubleLine: parseFloat(doubleLineInput.text) || 8,
            arrow: arrowCheckbox.value,
            arrowSize: parseFloat(triangleSizeInput.text) || 6,
            arrowSealing: arrowSealingCheckbox.value,
            cyan: parseInt(colorInputCyan.text) || 0,
            magenta: parseInt(colorInputMagenta.text) || 0,
            yellow: parseInt(colorInputYellow.text) || 0,
            black: parseInt(colorInputBlack.text) || 0,
            showUnits: textUnitsCheck.value,
            includeStroke: lineStrokeCheckbox.value,
            lockLayer: lockedLay.value,
            scale: theScale,
            fontFace: fontNamelist,
            preview: false
        }, layName, PREVIEW_GROUP);

        win.close();
    };

    cancel_button.onClick = function () { win.close(); };
    win.show();
}


// ================================================================
// Core Execution Logic
// ================================================================
function _executeDimensions(p, layName, PREVIEW_GROUP) {
    var doc = app.activeDocument;
    var sel = doc.selection;

    // --- Configuration ---
    var color = new CMYKColor();
    color.cyan = _num(p.cyan, 0);
    color.magenta = _num(p.magenta, 100);
    color.yellow = _num(p.yellow, 100);
    color.black = _num(p.black, 10);

    var tsize = _num(p.fontSize, 12);
    var decimals = _num(p.decimals, 2);
    var LineW = _num(p.lineWeight, 0.5);
    var setgap = _num(p.gap, 3);
    var Gaps = setgap;
    var Gap = setgap;
    var limitLen = _num(p.doubleLine, 8);
    var asize = _num(p.arrowSize, 6);
    var scale = _num(p.scale, 1);
    var unitConvert = _getUnitStr(_num(p.unitIndex, 0));
    var fontNamelist = p.fontFace || "";
    var showArrow = _bool(p.arrow);
    var arrowSealing = _bool(p.arrowSealing);
    var showUnits = _bool(p.showUnits);
    var includeStroke = _bool(p.includeStroke);
    var lockLayer = _bool(p.lockLayer);
    var isPreview = _bool(p.preview);

    var doTop = _bool(p.top);
    var doBottom = _bool(p.bottom);
    var doLeft = _bool(p.left);
    var doRight = _bool(p.right);

    var eachSizes = (p.mode === 'each');
    var betweenSize = (p.mode === 'between');
    var entiretySize = (p.mode === 'entire');

    if (!doTop && !doBottom && !doLeft && !doRight) return;
    if (!eachSizes && !betweenSize && !entiretySize) return;

    // --- Set up annotation layer ---
    var specsLayer;
    try {
        specsLayer = doc.layers[layName];
        specsLayer.locked = false;
        specsLayer.visible = true;
    } catch (err) {
        specsLayer = doc.layers.add();
        specsLayer.name = layName;
    }

    // Preview: remove old preview groups
    if (isPreview) {
        for (var i = specsLayer.groupItems.length - 1; i >= 0; i--) {
            try {
                if (specsLayer.groupItems[i].name === PREVIEW_GROUP) {
                    specsLayer.groupItems[i].remove();
                }
            } catch (e) {}
        }
    }

    var itemsGroup = specsLayer.groupItems.add();
    if (isPreview) {
        itemsGroup.name = PREVIEW_GROUP;
    }

    var labelGroupNames = "";

    // --- Execute based on mode ---
    if (sel.length > 0 && eachSizes) {
        labelGroupNames = "单体";
        if (doTop) Each_DIMENSIONS(sel[0], "Top");
        if (doLeft) Each_DIMENSIONS(sel[0], "Left");
        if (doRight) Each_DIMENSIONS(sel[0], "Right");
        if (doBottom) Each_DIMENSIONS(sel[0], "Bottom");
    }

    if (sel.length == 2 && betweenSize) {
        labelGroupNames = "间距";
        if (doTop) Double_DIMENSIONS(sel[0], sel[1], "Top");
        if (doLeft) Double_DIMENSIONS(sel[0], sel[1], "Left");
        if (doRight) Double_DIMENSIONS(sel[0], sel[1], "Right");
        if (doBottom) Double_DIMENSIONS(sel[0], sel[1], "Bottom");
    } else if (sel.length !== 2 && betweenSize) {
        // Skip silently in headless mode
    }

    if (sel.length > 1 && entiretySize) {
        labelGroupNames = "总距";
        if (doTop) Entirety_DIMENSIONS(sel[0], "Top");
        if (doLeft) Entirety_DIMENSIONS(sel[0], "Left");
        if (doRight) Entirety_DIMENSIONS(sel[0], "Right");
        if (doBottom) Entirety_DIMENSIONS(sel[0], "Bottom");
    }

    // Lock layer (not during preview)
    if (lockLayer && !isPreview) {
        specsLayer.locked = true;
    }

    // ============================================================
    // Each Object Dimensions (单体标注)
    // ============================================================
    function Each_DIMENSIONS(item, where) {
        var bound = new Array();
        for (var i = 0; i < sel.length; i += 1) {
            var a = NO_CLIP_BOUNDS(sel[i]);
            if (includeStroke) {
                bound[0] = a[4]; bound[1] = a[5]; bound[2] = a[6]; bound[3] = a[7];
            } else {
                bound[0] = a[0]; bound[1] = a[1]; bound[2] = a[2]; bound[3] = a[3];
            }
            linedraw(bound, where);
        }
    }

    // ============================================================
    // Between Two Objects Dimensions (间距标注)
    // ============================================================
    function Double_DIMENSIONS(item1, item2, where) {
        var bound = new Array();
        for (var i = 1; i < sel.length; i += 1) {
            var a = NO_CLIP_BOUNDS(sel[i]);
            if (includeStroke) {
                a[0] = a[4]; a[1] = a[5]; a[2] = a[6]; a[3] = a[7];
            }
            var b = NO_CLIP_BOUNDS(sel[i - 1]);
            if (includeStroke) {
                b[0] = b[4]; b[1] = b[5]; b[2] = b[6]; b[3] = b[7];
            }

            // --- First segment ---
            if (where == "Top" || where == "Bottom") {
                if (b[0] > a[0]) {
                    if (b[0] > a[2]) {
                        bound[0] = a[2]; bound[2] = a[0];
                    } else {
                        bound[0] = b[2]; bound[2] = a[2];
                    }
                } else {
                    if (a[0] >= b[0]) {
                        if (a[0] > b[2]) {
                            bound[0] = a[2]; bound[2] = a[0];
                        } else {
                            bound[0] = a[2]; bound[2] = b[2];
                        }
                    }
                }
                bound[1] = Math.max(a[1], b[1]);
                bound[3] = Math.min(a[3], b[3]);
            } else if (where == "Left" || where == "Right") {
                if (b[3] > a[3]) {
                    if (b[3] > a[1]) {
                        bound[3] = a[1]; bound[1] = a[3];
                    } else {
                        bound[3] = b[1]; bound[1] = a[1];
                    }
                } else {
                    if (a[3] >= b[3]) {
                        if (a[3] > b[1]) {
                            bound[3] = a[1]; bound[1] = a[3];
                        } else {
                            bound[3] = a[1]; bound[1] = b[1];
                        }
                    }
                }
                bound[0] = Math.min(a[0], b[0]);
                bound[2] = Math.max(a[2], b[2]);
            }
            Gap = tsize + limitLen + Gaps;
            linedraw(bound, where);

            // --- Second segment (gap/overlap) ---
            if (where == "Top" || where == "Bottom") {
                if (b[0] > a[0]) {
                    if (b[0] > a[2]) { bound[0] = a[2]; }
                    else { bound[0] = b[0]; }
                } else {
                    if (a[0] >= b[0]) {
                        if (a[0] > b[2]) { bound[0] = b[2]; }
                        else { bound[0] = a[0]; }
                    }
                }
                if (b[2] > a[2]) {
                    if (b[0] > a[2]) { bound[2] = b[0]; }
                    else { bound[2] = a[2]; }
                } else {
                    if (a[2] >= b[2]) {
                        if (a[0] > b[2]) { bound[2] = a[0]; }
                        else { bound[2] = b[2]; }
                    }
                }
                bound[1] = Math.max(a[1], b[1]);
                bound[3] = Math.min(a[3], b[3]);
            } else if (where == "Left" || where == "Right") {
                if (b[1] > a[1]) {
                    if (b[3] > a[1]) { bound[1] = b[3]; }
                    else { bound[1] = a[1]; }
                } else {
                    if (a[1] >= b[1]) {
                        if (a[3] > b[1]) { bound[1] = a[3]; }
                        else { bound[1] = b[1]; }
                    }
                }
                if (b[3] > a[3]) {
                    if (b[3] > a[1]) { bound[3] = a[1]; }
                    else { bound[3] = b[3]; }
                } else {
                    if (a[3] >= b[3]) {
                        if (a[3] > b[1]) { bound[3] = b[1]; }
                        else { bound[3] = a[3]; }
                    }
                }
                bound[0] = Math.min(a[0], b[0]);
                bound[2] = Math.max(a[2], b[2]);
            }
            Gap = tsize + limitLen + Gaps;
            linedraw(bound, where);

            // --- Third segment ---
            if (where == "Top" || where == "Bottom") {
                if (b[0] > a[0]) {
                    if (b[0] > a[2]) {
                        bound[0] = b[2]; bound[2] = b[0];
                    } else {
                        bound[0] = b[0]; bound[2] = a[0];
                    }
                } else {
                    if (a[0] >= b[0]) {
                        if (a[0] > b[2]) {
                            bound[0] = b[2]; bound[2] = b[0];
                        } else {
                            bound[0] = a[0]; bound[2] = b[0];
                        }
                    }
                }
                bound[1] = Math.max(a[1], b[1]);
                bound[3] = Math.min(a[3], b[3]);
            } else if (where == "Left" || where == "Right") {
                if (b[3] > a[3]) {
                    if (b[3] > a[1]) {
                        bound[3] = b[1]; bound[1] = b[3];
                    } else {
                        bound[3] = b[3]; bound[1] = a[3];
                    }
                } else {
                    if (a[3] >= b[3]) {
                        if (a[3] > b[1]) {
                            bound[3] = b[1]; bound[1] = b[3];
                        } else {
                            bound[3] = a[3]; bound[1] = b[3];
                        }
                    }
                }
                bound[0] = Math.min(a[0], b[0]);
                bound[2] = Math.max(a[2], b[2]);
            }
            Gap = tsize + limitLen + Gaps;
            linedraw(bound, where);
        }
    }

    // ============================================================
    // Total Span Dimensions (总距离标注)
    // ============================================================
    function Entirety_DIMENSIONS(item1, where) {
        var bound = new Array();
        var n = sel.length;
        if (n > 0) {
            bound = NO_CLIP_BOUNDS(sel[0]);
            if (includeStroke) {
                bound[0] = bound[4]; bound[1] = bound[5]; bound[2] = bound[6]; bound[3] = bound[7];
            }
        }
        if (n > 1) {
            for (var i = 1; i < sel.length; i += 1) {
                var b = NO_CLIP_BOUNDS(sel[i]);
                if (includeStroke) {
                    b[0] = b[4]; b[1] = b[5]; b[2] = b[6]; b[3] = b[7];
                }
                if (bound[0] > b[0]) bound[0] = b[0];
                if (bound[1] < b[1]) bound[1] = b[1];
                if (bound[2] < b[2]) bound[2] = b[2];
                if (bound[3] > b[3]) bound[3] = b[3];
            }
        }
        Gap = ((tsize + limitLen) * 2) + Gaps;
        linedraw(bound, where);
    }

    // ============================================================
    // Line Drawing (creates dimension line + boundary lines + arrows + text)
    // ============================================================
    function Lineadd(geo) {
        var line = itemsGroup.pathItems.add();
        line.setEntirePath(geo);
        line.stroked = true;
        line.strokeWidth = LineW;
        line.strokeColor = color;
        line.filled = false;
        line.strokeCap = StrokeCap.BUTTENDCAP;
        return line;
    }

    function arrowsAdd(geoAR) {
        var arrow = itemsGroup.pathItems.add();
        arrow.setEntirePath(geoAR);
        if (arrowSealing) {
            arrow.stroked = false;
            arrow.filled = true;
            arrow.fillColor = color;
            arrow.closed = true;
        } else {
            arrow.stroked = true;
            arrow.strokeWidth = LineW;
            arrow.strokeColor = color;
            arrow.filled = false;
            arrow.strokeJoin = StrokeJoin.ROUNDENDJOIN;
            arrow.strokeCap = StrokeCap.BUTTENDCAP;
            arrow.closed = false;
        }
        return arrow;
    }

    function linedraw(bound, where) {
        var x = bound[0];
        var y = bound[1];
        var w = bound[2] - bound[0];
        var h = bound[1] - bound[3];
        var xa, xb, ya, yb;

        if (w < 0) { xa = x + w; xb = x - w; }
        else { xa = xb = x; }
        if (h < 0) { ya = y - h; yb = y + h; }
        else { ya = yb = y; }

        // --- Horizontal dimensions (Top / Bottom) ---
        if (w != 0) {
            if (where == "Top") {
                var topGroup = specsLayer.groupItems.add();
                topGroup.name = "上_" + labelGroupNames;
                var tL1 = new Lineadd([[x, y + (limitLen / 2) + Gap], [x + w, y + (limitLen / 2) + Gap]]);
                var tL2 = new Lineadd([[x, y + limitLen + Gap], [x, y + Gap]]);
                var tL3 = new Lineadd([[x + w, y + limitLen + Gap], [x + w, y + Gap]]);
                tL1.move(topGroup, ElementPlacement.PLACEATBEGINNING);
                tL2.move(topGroup, ElementPlacement.PLACEATEND);
                tL3.move(topGroup, ElementPlacement.PLACEATEND);
                if (showArrow) {
                    var tA1 = new arrowsAdd([
                        [xa + asize, (y + (limitLen / 2) + Gap) - (asize / 2)],
                        [xa, y + (limitLen / 2) + Gap],
                        [xa + asize, y + (limitLen / 2) + Gap + (asize / 2)]
                    ]);
                    var tA2 = new arrowsAdd([
                        [(xb + w) - asize, (y + (limitLen / 2) + Gap) - (asize / 2)],
                        [xb + w, y + (limitLen / 2) + Gap],
                        [(xb + w) - asize, y + (limitLen / 2) + Gap + (asize / 2)]
                    ]);
                    tA1.move(topGroup, ElementPlacement.PLACEATEND);
                    tA2.move(topGroup, ElementPlacement.PLACEATEND);
                }
                var textInfo = specTextLabel(w, x + (w / 2), y + (limitLen / 2) + Gap + LineW, unitConvert);
                textInfo.top += textInfo.height;
                textInfo.left -= (textInfo.width / 2);
                textInfo.move(topGroup, ElementPlacement.PLACEATBEGINNING);
                topGroup.move(itemsGroup, ElementPlacement.PLACEATEND);
            }
            if (where == "Bottom") {
                var bottomGroup = specsLayer.groupItems.add();
                bottomGroup.name = "下_" + labelGroupNames;
                var bL1 = new Lineadd([[x, (y - h) - ((limitLen / 2) + Gap)], [x + w, (y - h) - ((limitLen / 2) + Gap)]]);
                var bL2 = new Lineadd([[x, ((y - h) - limitLen) - Gap], [x, (y - h) - Gap]]);
                var bL3 = new Lineadd([[x + w, ((y - h) - limitLen) - Gap], [x + w, (y - h) - Gap]]);
                bL1.move(bottomGroup, ElementPlacement.PLACEATBEGINNING);
                bL2.move(bottomGroup, ElementPlacement.PLACEATEND);
                bL3.move(bottomGroup, ElementPlacement.PLACEATEND);
                if (showArrow) {
                    var bA1 = new arrowsAdd([
                        [xa + asize, ((y - h) - ((limitLen / 2) + Gap)) - (asize / 2)],
                        [xa, (y - h) - ((limitLen / 2) + Gap)],
                        [xa + asize, ((y - h) - ((limitLen / 2) + Gap)) + (asize / 2)]
                    ]);
                    var bA2 = new arrowsAdd([
                        [(xb + w) - asize, ((y - h) - ((limitLen / 2) + Gap)) - (asize / 2)],
                        [xb + w, (y - h) - ((limitLen / 2) + Gap)],
                        [(xb + w) - asize, ((y - h) - ((limitLen / 2) + Gap)) + (asize / 2)]
                    ]);
                    bA1.move(bottomGroup, ElementPlacement.PLACEATEND);
                    bA2.move(bottomGroup, ElementPlacement.PLACEATEND);
                }
                var textInfo = specTextLabel(w, x + (w / 2), ((y - h) - (limitLen / 2)) - (Gap + LineW), unitConvert);
                textInfo.left -= (textInfo.width / 2);
                textInfo.move(bottomGroup, ElementPlacement.PLACEATBEGINNING);
                bottomGroup.move(itemsGroup, ElementPlacement.PLACEATEND);
            }
        }

        // --- Vertical dimensions (Left / Right) ---
        if (h != 0) {
            if (where == "Left") {
                var leftGroup = specsLayer.groupItems.add();
                leftGroup.name = "左_" + labelGroupNames;
                var lL1 = new Lineadd([[x - ((limitLen / 2) + Gap), y], [x - ((limitLen / 2) + Gap), y - h]]);
                var lL2 = new Lineadd([[(x - limitLen) - Gap, y], [x - Gap, y]]);
                var lL3 = new Lineadd([[(x - limitLen) - Gap, y - h], [x - Gap, y - h]]);
                lL1.move(leftGroup, ElementPlacement.PLACEATBEGINNING);
                lL2.move(leftGroup, ElementPlacement.PLACEATEND);
                lL3.move(leftGroup, ElementPlacement.PLACEATEND);
                if (showArrow) {
                    var lA1 = new arrowsAdd([
                        [(x - ((limitLen / 2) + Gap)) - (asize / 2), ya - asize],
                        [x - ((limitLen / 2) + Gap), ya],
                        [(x - ((limitLen / 2) + Gap)) + (asize / 2), ya - asize]
                    ]);
                    var lA2 = new arrowsAdd([
                        [(x - ((limitLen / 2) + Gap)) - (asize / 2), (yb - h) + asize],
                        [x - ((limitLen / 2) + Gap), yb - h],
                        [(x - ((limitLen / 2) + Gap)) + (asize / 2), (yb - h) + asize]
                    ]);
                    lA1.move(leftGroup, ElementPlacement.PLACEATEND);
                    lA2.move(leftGroup, ElementPlacement.PLACEATEND);
                }
                var textInfo = specTextLabel(h, x - ((limitLen / 2) + Gap + LineW), y - (h / 2), unitConvert);
                textInfo.rotate(-90, true, false, false, false, Transformation.BOTTOMLEFT);
                textInfo.top += textInfo.width;
                textInfo.top += (textInfo.height / 2);
                textInfo.left -= textInfo.width;
                textInfo.move(leftGroup, ElementPlacement.PLACEATBEGINNING);
                leftGroup.move(itemsGroup, ElementPlacement.PLACEATEND);
            }
            if (where == "Right") {
                var rightGroup = specsLayer.groupItems.add();
                rightGroup.name = "右_" + labelGroupNames;
                var rL1 = new Lineadd([[x + w + (limitLen / 2) + Gap, y], [x + w + (limitLen / 2) + Gap, y - h]]);
                var rL2 = new Lineadd([[x + w + limitLen + Gap, y], [x + w + Gap, y]]);
                var rL3 = new Lineadd([[x + w + limitLen + Gap, y - h], [x + w + Gap, y - h]]);
                rL1.move(rightGroup, ElementPlacement.PLACEATBEGINNING);
                rL2.move(rightGroup, ElementPlacement.PLACEATEND);
                rL3.move(rightGroup, ElementPlacement.PLACEATEND);
                if (showArrow) {
                    var rA1 = new arrowsAdd([
                        [(x + w + (limitLen / 2) + Gap) - (asize / 2), ya - asize],
                        [x + w + (limitLen / 2) + Gap, ya],
                        [x + w + (limitLen / 2) + Gap + (asize / 2), ya - asize]
                    ]);
                    var rA2 = new arrowsAdd([
                        [(x + w + (limitLen / 2) + Gap) - (asize / 2), (yb - h) + asize],
                        [x + w + (limitLen / 2) + Gap, yb - h],
                        [x + w + (limitLen / 2) + Gap + (asize / 2), (yb - h) + asize]
                    ]);
                    rA1.move(rightGroup, ElementPlacement.PLACEATEND);
                    rA2.move(rightGroup, ElementPlacement.PLACEATEND);
                }
                var textInfo = specTextLabel(h, x + w + (limitLen / 2) + Gap + LineW, y - (h / 2), unitConvert);
                textInfo.rotate(-90, true, false, false, false, Transformation.BOTTOMLEFT);
                textInfo.top += textInfo.width;
                textInfo.top += (textInfo.height / 2);
                textInfo.move(rightGroup, ElementPlacement.PLACEATBEGINNING);
                rightGroup.move(itemsGroup, ElementPlacement.PLACEATEND);
            }
        }
    }

    // ============================================================
    // Text Label with Unit Conversion
    // ============================================================
    function specTextLabel(val, x, y, wheres) {
        var textInfo = doc.textFrames.add();
        textInfo.textRange.characterAttributes.size = tsize;
        textInfo.textRange.characterAttributes.fillColor = color;
        textInfo.textRange.characterAttributes.alignment = StyleRunAlignmentType.center;
        try {
            if (fontNamelist && fontNamelist !== "") {
                textInfo.textRange.characterAttributes.textFont = app.textFonts.getByName(fontNamelist);
            }
        } catch (e) {}

        var value = val * scale;
        var unitsInfo = "";
        switch (wheres) {
            case "auto":
                switch (doc.rulerUnits) {
                    case RulerUnits.Millimeters:
                        value = new UnitValue(value, "pt").as("mm"); value = value.toFixed(decimals); unitsInfo = " mm"; break;
                    case RulerUnits.Centimeters:
                        value = new UnitValue(value, "pt").as("cm"); value = value.toFixed(decimals); unitsInfo = " cm"; break;
                    case RulerUnits.Pixels:
                        value = new UnitValue(value, "pt").as("px"); value = value.toFixed(decimals); unitsInfo = " px"; break;
                    case RulerUnits.Inches:
                        value = new UnitValue(value, "pt").as("in"); value = value.toFixed(decimals); unitsInfo = " in"; break;
                    case RulerUnits.Picas:
                        value = new UnitValue(value, "pt").as("pc");
                        var vd = value - Math.floor(value); vd = 12 * vd;
                        value = Math.floor(value) + "p" + vd.toFixed(decimals); unitsInfo = ""; break;
                    default:
                        value = new UnitValue(value, "pt").as("pt"); value = value.toFixed(decimals); unitsInfo = " pt";
                }
                break;
            case "mm":
                value = new UnitValue(value, "pt").as("mm"); value = value.toFixed(decimals); unitsInfo = " mm"; break;
            case "cm":
                value = new UnitValue(value, "pt").as("cm"); value = value.toFixed(decimals); unitsInfo = " cm"; break;
            case "m":
                value = new UnitValue(value, "pt").as("mm"); value = (value / 1000).toFixed(decimals); unitsInfo = " m"; break;
            case "pt":
                value = new UnitValue(value, "pt").as("pt"); value = value.toFixed(decimals); unitsInfo = " pt"; break;
            case "px":
                value = new UnitValue(value, "pt").as("px"); value = value.toFixed(decimals); unitsInfo = " px"; break;
            case "in":
                value = new UnitValue(value, "pt").as("in"); value = value.toFixed(decimals); unitsInfo = " in"; break;
            case "ft":
                value = new UnitValue(value, "pt").as("in"); value = (value / 12).toFixed(decimals); unitsInfo = " ft"; break;
            case "pc":
                value = new UnitValue(value, "pt").as("pc");
                var vd = value - Math.floor(value); vd = 12 * vd;
                value = Math.floor(value) + "p" + vd.toFixed(decimals); unitsInfo = ""; break;
        }
        if (showUnits) {
            textInfo.contents = value.toString().replace(/-/g, "") + unitsInfo;
        } else {
            textInfo.contents = value.toString().replace(/-/g, "");
        }
        textInfo.top = y;
        textInfo.left = x;
        return textInfo;
    }
}


// ================================================================
// Utility Functions
// ================================================================

function NO_CLIP_BOUNDS(the_obj) {
    var NO_CLIP_OBJECTS_AND_MASKS = new Array();
    GET_NO_CLIP_OBJECTS_AND_MASKS(the_obj);
    var v_left = [], g_left = [], v_top = [], g_top = [];
    var v_right = [], g_right = [], v_bottom = [], g_bottom = [];
    for (var i = 0; i < NO_CLIP_OBJECTS_AND_MASKS.length; i += 1) {
        g_left[i] = NO_CLIP_OBJECTS_AND_MASKS[i].geometricBounds[0];
        v_left[i] = NO_CLIP_OBJECTS_AND_MASKS[i].visibleBounds[0];
        g_top[i] = NO_CLIP_OBJECTS_AND_MASKS[i].geometricBounds[1];
        v_top[i] = NO_CLIP_OBJECTS_AND_MASKS[i].visibleBounds[1];
        g_right[i] = NO_CLIP_OBJECTS_AND_MASKS[i].geometricBounds[2];
        v_right[i] = NO_CLIP_OBJECTS_AND_MASKS[i].visibleBounds[2];
        g_bottom[i] = NO_CLIP_OBJECTS_AND_MASKS[i].geometricBounds[3];
        v_bottom[i] = NO_CLIP_OBJECTS_AND_MASKS[i].visibleBounds[3];
    }
    return [
        _minArr(g_left), _maxArr(g_top), _maxArr(g_right), _minArr(g_bottom),
        _minArr(v_left), _maxArr(v_top), _maxArr(v_right), _minArr(v_bottom)
    ];

    function GET_NO_CLIP_OBJECTS_AND_MASKS(the_obj) {
        if (IS_CLIP(the_obj)) {
            NO_CLIP_OBJECTS_AND_MASKS.push(the_obj.pageItems[0]);
            return;
        }
        if (the_obj.constructor.name == "GroupItem") {
            try {
                var N_sub_obj = the_obj.pageItems.length;
                for (var i = 0; i < N_sub_obj; i += 1) {
                    GET_NO_CLIP_OBJECTS_AND_MASKS(the_obj.pageItems[i]);
                }
            } catch (error) {}
            return;
        }
        NO_CLIP_OBJECTS_AND_MASKS.push(the_obj);
    }
}

function IS_CLIP(the_obj) {
    try {
        if (the_obj.constructor.name == "GroupItem" && the_obj.clipped) return true;
    } catch (error) {}
    return false;
}

function _maxArr(arr) {
    var m = arr[0];
    for (var i = 1; i < arr.length; i++) { if (arr[i] > m) m = arr[i]; }
    return m;
}

function _minArr(arr) {
    var m = arr[0];
    for (var i = 1; i < arr.length; i++) { if (arr[i] < m) m = arr[i]; }
    return m;
}

function _num(v, d) {
    if (v === undefined || v === null || v === '') return d;
    var n = Number(v);
    return isNaN(n) ? d : n;
}

function _bool(v) {
    if (v === true || v === 'true') return true;
    return false;
}

function _toBool(str) {
    return str && str.toLowerCase() === "true";
}

function _getUnitStr(index) {
    var units = ["auto", "mm", "cm", "m", "pt", "px", "in", "ft", "pc"];
    return (index >= 0 && index < units.length) ? units[index] : "auto";
}


// ================================================================
// HEADLESS WRAPPER (called from CEP panel via $.hopeflow runtime)
// ================================================================
if (typeof $.hopeflow !== 'undefined') {
    var args = $.hopeflow.utils.getArgs();
    make_size({
        headless: true,
        top: args.top === 'true' || args.top === true,
        bottom: args.bottom === 'true' || args.bottom === true,
        left: args.left === 'true' || args.left === true,
        right: args.right === 'true' || args.right === true,
        mode: args.mode || 'each',
        fontSize: args.fontSize,
        unitIndex: args.unitIndex,
        decimals: args.decimals,
        lineWeight: args.lineWeight,
        gap: args.gap,
        doubleLine: args.doubleLine,
        arrow: args.arrow === 'true' || args.arrow === true,
        arrowSize: args.arrowSize,
        arrowSealing: args.arrowSealing === 'true' || args.arrowSealing === true,
        cyan: args.cyan,
        magenta: args.magenta,
        yellow: args.yellow,
        black: args.black,
        showUnits: args.showUnits === 'true' || args.showUnits === true,
        includeStroke: args.includeStroke === 'true' || args.includeStroke === true,
        lockLayer: args.lockLayer === 'true' || args.lockLayer === true,
        scale: args.scale,
        fontFace: args.fontFace || '',
        preview: args.preview === 'true' || args.preview === true,
        clearOnly: args.clearOnly === 'true' || args.clearOnly === true
    });
    return $.hopeflow.utils.returnResult('success');
} else if (typeof $.hopeflow === 'undefined') {
    // Standalone mode (run directly in ExtendScript)
    make_size();
}
})();
