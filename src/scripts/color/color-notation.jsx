/**
 * 颜色标注 - Color Notation
 * Annotates colors in selected objects with color blocks and labels
 */
(function () {
    // Authentication check
    if (!$.hopeflow) return;

    // Constants
    var NEW_LAYER_NAME = "颜色标注";
    var DEFAULT_SIGNATURE = "";
    var FONTS = ['AdobeHeitiStd-Regular', 'MyriadPro-Regular', 'Arial', 'MicrosoftYaHei', 'PingFangSC-Regular'];
    var FALLBACK_FONT = null; // We'll find one safe font to use globally to avoid repeated errors

    // Get parameters from plugin
    var args = $.hopeflow.utils.getArgs();
    var CONFIG = {
        drawBackground: args.drawBackground !== undefined ? args.drawBackground : true,
        centralPlacement: args.centralPlacement !== undefined ? args.centralPlacement : true
    };

    // Main program
    var doc = app.activeDocument;
    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var selection = doc.selection;

    // Check selection
    if (!selection || selection.length === 0) {
        return $.hopeflow.utils.returnError("请先选择对象！");
    }

    var processedColors = {};
    var totalColors = 0;
    var blocksTop = 20;
    var blocksRight = 245;

    // Setup layer
    var newLayer = setupLayer(CONFIG.centralPlacement);
    var group = newLayer.groupItems.add();

    // Expand artboard only for central placement
    if (CONFIG.centralPlacement) {
        var artboardRect = artboard.artboardRect;
        artboard.artboardRect = [
            artboardRect[0],
            artboardRect[1],
            artboardRect[2] + blocksRight,
            artboardRect[3]
        ];
    }

    var artboardRight = artboard.artboardRect[2];
    var artboardTop = artboard.artboardRect[1];
    var yPos = artboardTop - blocksTop;
    var xOffset = artboardRight - 245;

    // Store object color groups
    var objectColorGroups = [];

    // Safe font finder
    function getSafeFont() {
        if (FALLBACK_FONT) return FALLBACK_FONT;
        for (var i = 0; i < FONTS.length; i++) {
            try {
                FALLBACK_FONT = app.textFonts.getByName(FONTS[i]);
                return FALLBACK_FONT;
            } catch (e) { }
        }
        // Absolute fallback to first available
        try {
            FALLBACK_FONT = app.textFonts[0];
            return FALLBACK_FONT;
        } catch (e) {
            return null; // Should never happen unless AI is completely broken
        }
    }

    // Main flow
    try {
        if (CONFIG.centralPlacement) {
            // Central placement mode
            processSelection(selection);
            if (totalColors > 0) {
                if (CONFIG.drawBackground) {
                    drawBackground();
                }
            } else {
                newLayer.remove();
                return $.hopeflow.utils.returnError("未检测到颜色信息（可能只有无色对象）！");
            }
        } else {
            // Object-adjacent placement mode
            processSelectionForObjectPlacement(selection);
            if (objectColorGroups.length === 0) {
                return $.hopeflow.utils.returnError("未检测到可用颜色信息！");
            }
        }
    } catch (e) {
        if (CONFIG.centralPlacement) {
            try { newLayer.remove(); } catch (ex) { }
        }
        return $.hopeflow.utils.returnError("处理颜色图例错误: " + e.message + " (Line: " + e.line + ")");
    }

    return $.hopeflow.utils.returnResult({
        totalColors: totalColors,
        mode: CONFIG.centralPlacement ? 'central' : 'object-adjacent'
    });

    // ============================================================
    // Function Definitions
    // ============================================================

    function setupLayer(clearLayer) {
        var layer;
        try {
            layer = doc.layers.getByName(NEW_LAYER_NAME);
            if (clearLayer) {
                blocksRight = 0;
                layer.remove();
                layer = doc.layers.add();
                layer.name = NEW_LAYER_NAME;
            }
        } catch (e) {
            layer = doc.layers.add();
            layer.name = NEW_LAYER_NAME;
        }
        return layer;
    }

    // Central placement mode selection processing
    function processSelection(items) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (item.typename === 'PathItem' && (!item.fillColor || item.fillColor.typename === 'NoColor')) {
                continue;
            }

            switch (item.typename) {
                case 'PathItem':
                    processColor(item, false);
                    break;
                case 'GroupItem':
                    processSelection(item.pageItems);
                    break;
                case 'CompoundPathItem':
                    processSelection(item.pathItems);
                    break;
                case 'TextFrame':
                    processColor(item, true);
                    break;
            }
        }
    }

    // Object-adjacent placement mode selection processing
    function processSelectionForObjectPlacement(items) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (item.typename === 'PathItem' && (!item.fillColor || item.fillColor.typename === 'NoColor')) {
                continue;
            }

            switch (item.typename) {
                case 'PathItem':
                    processObjectColor(item, false);
                    break;
                case 'GroupItem':
                    var groupColors = {};
                    collectGroupColors(item, groupColors);
                    if (hasProperties(groupColors)) {
                        createObjectColorNotation(item, groupColors);
                    }
                    break;
                case 'CompoundPathItem':
                    processObjectColor(item, false);
                    break;
                case 'TextFrame':
                    processObjectColor(item, true);
                    break;
            }
        }
    }

    // Check if object has properties (ES3 compatible)
    function hasProperties(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                return true;
            }
        }
        return false;
    }

    // Get object keys (ES3 compatible)
    function getObjectKeys(obj) {
        var keys = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    // Collect all colors in group
    function collectGroupColors(group, colorMap) {
        for (var i = 0; i < group.pageItems.length; i++) {
            var item = group.pageItems[i];

            switch (item.typename) {
                case 'PathItem':
                    if (item.fillColor && item.fillColor.typename !== 'NoColor') {
                        addToColorMap(item.fillColor, false, colorMap);
                    }
                    break;
                case 'GroupItem':
                    collectGroupColors(item, colorMap);
                    break;
                case 'CompoundPathItem':
                    for (var j = 0; j < item.pathItems.length; j++) {
                        var pathItem = item.pathItems[j];
                        if (pathItem.fillColor && pathItem.fillColor.typename !== 'NoColor') {
                            addToColorMap(pathItem.fillColor, false, colorMap);
                        }
                    }
                    break;
                case 'TextFrame':
                    if (item.textRange.characterAttributes.fillColor &&
                        item.textRange.characterAttributes.fillColor.typename !== 'NoColor') {
                        addToColorMap(item.textRange.characterAttributes.fillColor, true, colorMap);
                    }
                    break;
            }
        }
    }

    // Add color to color map
    function addToColorMap(colorObj, isText, colorMap) {
        var colorType = colorObj.typename;
        var colorKey;

        switch (colorType) {
            case 'CMYKColor':
                var cyan = Math.round(colorObj.cyan || 0);
                var magenta = Math.round(colorObj.magenta || 0);
                var yellow = Math.round(colorObj.yellow || 0);
                var black = Math.round(colorObj.black || 0);

                colorKey = "CMYK_" + cyan + "_" + magenta + "_" + yellow + "_" + black;
                if (!colorMap[colorKey]) {
                    colorMap[colorKey] = {
                        color: colorObj,
                        type: "CMYKColor",
                        values: [cyan, magenta, yellow, black]
                    };
                }
                break;

            case 'RGBColor':
                var red = Math.round(colorObj.red || 0);
                var green = Math.round(colorObj.green || 0);
                var blue = Math.round(colorObj.blue || 0);

                colorKey = "RGB_" + red + "_" + green + "_" + blue;
                if (!colorMap[colorKey]) {
                    colorMap[colorKey] = {
                        color: colorObj,
                        type: "RGBColor",
                        values: [red, green, blue]
                    };
                }
                break;

            case 'SpotColor':
                var spotName = colorObj.spot.name;
                var spotTint = Math.round(colorObj.tint || 0);

                colorKey = "SPOT_" + spotName + "_" + spotTint;
                if (!colorMap[colorKey]) {
                    colorMap[colorKey] = {
                        color: colorObj,
                        type: "SpotColor",
                        values: [spotName, spotTint]
                    };
                }
                break;

            case 'GradientColor':
                colorKey = "GRADIENT_" + (isText ? "text" : "path") + "_" + i;
                if (!colorMap[colorKey]) {
                    colorMap[colorKey] = {
                        color: colorObj,
                        type: "GradientColor",
                        values: ["渐变色"]
                    };
                }
                break;

            case 'PatternColor':
                var patternName = colorObj.pattern.name;
                colorKey = "PATTERN_" + patternName;
                if (!colorMap[colorKey]) {
                    colorMap[colorKey] = {
                        color: colorObj,
                        type: "PatternColor",
                        values: [patternName]
                    };
                }
                break;
        }
    }

    // Process color for single object
    function processObjectColor(item, isText) {
        var colorObj = isText ? item.textRange.characterAttributes.fillColor : item.fillColor;
        if (!colorObj || colorObj.typename === 'NoColor') {
            return;
        }

        var colorMap = {};
        addToColorMap(colorObj, isText, colorMap);

        if (hasProperties(colorMap)) {
            createObjectColorNotation(item, colorMap);
        }
    }

    // Create color notation near object
    function createObjectColorNotation(item, colorMap) {
        var colorKeys = getObjectKeys(colorMap);
        if (colorKeys.length === 0) return;

        var objectGroup = group.groupItems.add();
        var bounds = item.geometricBounds;
        var left = bounds[0];
        var bottom = bounds[3];

        var blockSize = 15;
        var spacing = 5;
        var blockX = left;
        var blockY = bottom - blockSize - spacing;

        for (var i = 0; i < colorKeys.length; i++) {
            var colorInfo = colorMap[colorKeys[i]];

            var colorSquare = doc.pathItems.roundedRectangle(
                blockY + blockSize,
                blockX,
                blockSize,
                blockSize,
                2,
                2
            );

            if (colorInfo.type === "GradientColor" || colorInfo.type === "PatternColor") {
                colorSquare.fillColor = createCMYKColor(0, 0, 0, 30);

                var symbolText = doc.textFrames.add();
                var symbolColor = createCMYKColor(0, 0, 0, 100);

                symbolText.contents = colorInfo.type === "GradientColor" ? "G" : "P";
                symbolText.left = blockX + 4;
                symbolText.top = blockY + blockSize - 3;
                var safeFnt = getSafeFont();
                symbolText.textRange.characterAttributes.size = 8;
                if (safeFnt) symbolText.textRange.characterAttributes.textFont = safeFnt;
                symbolText.textRange.characterAttributes.fillColor = symbolColor;
                symbolText.moveToBeginning(objectGroup);
            } else {
                colorSquare.fillColor = colorInfo.color;
            }

            colorSquare.stroked = false;

            var textFrame = doc.textFrames.add();
            var textColor = createCMYKColor(0, 0, 0, 70);

            var safeFnt2 = getSafeFont();
            textFrame.textRange.characterAttributes.size = 7;
            textFrame.textRange.characterAttributes.fillColor = textColor;
            if (safeFnt2) textFrame.textRange.characterAttributes.textFont = safeFnt2;

            switch (colorInfo.type) {
                case "CMYKColor":
                    textFrame.contents = "CMYK(" + colorInfo.values[0] + "," + colorInfo.values[1] + "," +
                        colorInfo.values[2] + "," + colorInfo.values[3] + ")";
                    break;
                case "RGBColor":
                    textFrame.contents = "RGB(" + colorInfo.values[0] + "," + colorInfo.values[1] + "," + colorInfo.values[2] + ")";
                    break;
                case "SpotColor":
                    textFrame.contents = colorInfo.values[0] + " " + colorInfo.values[1] + "%";
                    break;
                case "GradientColor":
                    textFrame.contents = "渐变";
                    break;
                case "PatternColor":
                    textFrame.contents = "图案";
                    break;
            }

            textFrame.left = blockX + blockSize + spacing;
            textFrame.top = blockY + blockSize / 2 + textFrame.height / 2;

            blockX += blockSize + textFrame.width + spacing * 2;

            colorSquare.moveToBeginning(objectGroup);
            textFrame.moveToBeginning(objectGroup);
        }

        objectColorGroups.push(objectGroup);
    }

    function processColor(item, isText) {
        var colorObj = isText ? item.textRange.characterAttributes.fillColor : item.fillColor;
        if (!colorObj || colorObj.typename === 'NoColor') {
            return;
        }

        var colorType = colorObj.typename;
        var colorKey, colorValues;

        switch (colorType) {
            case 'CMYKColor':
                var cyan = Math.round(colorObj.cyan || 0);
                var magenta = Math.round(colorObj.magenta || 0);
                var yellow = Math.round(colorObj.yellow || 0);
                var black = Math.round(colorObj.black || 0);

                if (isText) {
                    item.textRange.characterAttributes.fillColor.cyan = cyan;
                    item.textRange.characterAttributes.fillColor.magenta = magenta;
                    item.textRange.characterAttributes.fillColor.yellow = yellow;
                    item.textRange.characterAttributes.fillColor.black = black;
                } else {
                    item.fillColor.cyan = cyan;
                    item.fillColor.magenta = magenta;
                    item.fillColor.yellow = yellow;
                    item.fillColor.black = black;
                }

                colorKey = "CMYK_" + cyan + "_" + magenta + "_" + yellow + "_" + black;
                colorValues = [cyan, magenta, yellow, black];
                break;

            case 'RGBColor':
                var red = Math.round(colorObj.red || 0);
                var green = Math.round(colorObj.green || 0);
                var blue = Math.round(colorObj.blue || 0);

                if (isText) {
                    item.textRange.characterAttributes.fillColor.red = red;
                    item.textRange.characterAttributes.fillColor.green = green;
                    item.textRange.characterAttributes.fillColor.blue = blue;
                } else {
                    item.fillColor.red = red;
                    item.fillColor.green = green;
                    item.fillColor.blue = blue;
                }

                colorKey = "RGB_" + red + "_" + green + "_" + blue;
                colorValues = [red, green, blue];
                break;

            case 'SpotColor':
                var spotName = colorObj.spot.name;
                var spotTint = Math.round(colorObj.tint || 0);

                if (isText) {
                    item.textRange.characterAttributes.fillColor.tint = spotTint;
                } else {
                    item.fillColor.tint = spotTint;
                }

                colorKey = "SPOT_" + spotName + "_" + spotTint;
                colorValues = [spotName, spotTint];
                break;

            case 'GradientColor':
                colorKey = "GRADIENT_" + (isText ? "text" : "path") + "_" + i;
                colorValues = ["渐变色"];
                break;

            case 'PatternColor':
                var patternName = colorObj.pattern.name;
                colorKey = "PATTERN_" + patternName;
                colorValues = [patternName];
                break;

            default:
                return;
        }

        if (processedColors[colorKey]) {
            return;
        }

        drawColorBlock(colorObj, colorType, colorValues);
        processedColors[colorKey] = true;
    }

    function drawColorBlock(color, colorType, colorValues) {
        var colorText = "";

        switch (colorType) {
            case "CMYKColor":
                colorText = "CMYK(" + colorValues[0] + "%, " + colorValues[1] + "%, " +
                    colorValues[2] + "%, " + colorValues[3] + "%)";
                break;
            case "RGBColor":
                colorText = "RGB(" + colorValues[0] + ", " + colorValues[1] + ", " + colorValues[2] + ")";
                break;
            case "SpotColor":
                colorText = "专色 " + colorValues[0] + " " + colorValues[1] + "%";
                break;
            case "GradientColor":
                colorText = "渐变色";
                break;
            case "PatternColor":
                colorText = "图案 " + colorValues[0];
                break;
        }

        var textFrame = doc.textFrames.add();
        var textColor = createCMYKColor(0, 0, 0, 50);

        var safeFnt3 = getSafeFont();
        textFrame.contents = colorText;
        textFrame.left = xOffset + 30;
        textFrame.textRange.characterAttributes.size = 12;
        textFrame.textRange.characterAttributes.fillColor = textColor;
        if (safeFnt3) textFrame.textRange.characterAttributes.textFont = safeFnt3;

        var textHeight = textFrame.textRange.characterAttributes.size;
        textFrame.top = yPos - textHeight / 2 - 7;

        var colorSquare = doc.pathItems.roundedRectangle(yPos, xOffset, 20, 20, 5, 5);

        if (colorType === "GradientColor" || colorType === "PatternColor") {
            colorSquare.fillColor = createCMYKColor(0, 0, 0, 30);

            var symbolText = doc.textFrames.add();
            var symbolColor = createCMYKColor(0, 0, 0, 100);

            var safeFnt4 = getSafeFont();
            symbolText.contents = colorType === "GradientColor" ? "G" : "P";
            symbolText.left = xOffset + 7;
            symbolText.top = yPos - 5;
            symbolText.textRange.characterAttributes.size = 10;
            if (safeFnt4) symbolText.textRange.characterAttributes.textFont = safeFnt4;
            symbolText.textRange.characterAttributes.fillColor = symbolColor;
            symbolText.moveToBeginning(group);
        } else {
            colorSquare.fillColor = color;
        }

        colorSquare.stroked = false;
        colorSquare.top = yPos - 10;

        yPos -= 30;
        totalColors++;

        textFrame.moveToBeginning(group);
        colorSquare.moveToBeginning(group);
    }

    function drawBackground() {
        var left = xOffset - 10;
        var top = artboardTop - blocksTop;
        var width = 235;
        var height = 30 * totalColors + 10;

        var bg = createRoundedRect(left, top, width, height, 10, 10, 0, 0);
        var bgBottom = createRoundedRect(left, top - height, width, 20, 0, 0, 10, 10);

        bg.fillColor = createCMYKColor(0, 0, 0, 10);
        bg.stroked = false;

        bgBottom.fillColor = createCMYKColor(0, 0, 0, 90);
        bgBottom.stroked = false;

        var safeFnt5 = getSafeFont();
        var totalText = doc.textFrames.add();
        totalText.textRange.characterAttributes.size = 8;
        totalText.textRange.characterAttributes.fillColor = createCMYKColor(0, 0, 0, 0);
        if (safeFnt5) totalText.textRange.characterAttributes.textFont = safeFnt5;
        totalText.left = xOffset;
        totalText.top = artboardTop - 30 * totalColors - blocksTop - 16;
        totalText.contents = "共" + totalColors + "种颜色";

        bg.moveToEnd(group);
        bgBottom.moveToEnd(group);
        totalText.moveToBeginning(group);
        group.moveToBeginning(newLayer);
    }

    // Utility functions
    function createCMYKColor(c, m, y, k) {
        var color = new CMYKColor();
        color.cyan = c;
        color.magenta = m;
        color.yellow = y;
        color.black = k;
        return color;
    }

    function createRoundedRect(left, top, width, height, leftTopRadius, rightTopRadius, rightBottomRadius, leftBottomRadius) {
        var path = doc.pathItems.add();

        var LBOffset = leftBottomRadius * 0.554;
        var LTOffset = leftTopRadius * 0.554;
        var RTOffset = rightTopRadius * 0.554;
        var RBOffset = rightBottomRadius * 0.554;

        path.setEntirePath([
            [left + leftBottomRadius, top - height],
            [left, top - height + leftBottomRadius],
            [left, top - leftTopRadius],
            [left + leftTopRadius, top],
            [left + width - rightTopRadius, top],
            [left + width, top - rightTopRadius],
            [left + width, top - height + rightBottomRadius],
            [left + width - rightBottomRadius, top - height]
        ]);

        path.pathPoints[0].rightDirection = [left - LBOffset + leftBottomRadius, top - height];
        path.pathPoints[1].leftDirection = [left, top - height - LBOffset + leftBottomRadius];
        path.pathPoints[2].rightDirection = [left, top - leftTopRadius + LTOffset];
        path.pathPoints[3].leftDirection = [left + leftTopRadius - LTOffset, top];
        path.pathPoints[4].rightDirection = [left + width + RTOffset - rightTopRadius, top];
        path.pathPoints[5].leftDirection = [left + width, top - rightTopRadius + RTOffset];
        path.pathPoints[6].rightDirection = [left + width, top - height + rightBottomRadius - RBOffset];
        path.pathPoints[7].leftDirection = [left + width - rightBottomRadius + RBOffset, top - height];

        path.closed = true;
        return path;
    }
})();
