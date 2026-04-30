/**
 * 数据合并 - Data Merge
 * CSV-driven batch generation using Illustrator Variables system.
 * Modes: scan, createDataSets, exportSingle
 *
 * NOTE: No IIFE wrapper — `return` must reach the bridge's outer function.
 */

if (!$.hopeflow) {
    // Can't use returnError here because $.hopeflow is not loaded
    return JSON.stringify({ success: false, error: 'runtime not loaded' });
}

var args = $.hopeflow.utils.getArgs();
var mode = args.mode || 'scan';

if (!app.documents.length) {
    return $.hopeflow.utils.returnError('没有打开的文档');
}

var doc = app.activeDocument;

// ============================================================
// ES3-compatible helpers
// ============================================================

function indexOf(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === value) return i;
    }
    return -1;
}

function findNamedItem(doc, name) {
    for (var i = 0; i < doc.pageItems.length; i++) {
        if (doc.pageItems[i].name === name) {
            return doc.pageItems[i];
        }
    }
    return null;
}

function findTextFrame(doc, name, index) {
    if (name && name !== '') {
        for (var i = 0; i < doc.textFrames.length; i++) {
            if (doc.textFrames[i].name === name) {
                return doc.textFrames[i];
            }
        }
    }
    if (index !== undefined && index >= 0 && index < doc.textFrames.length) {
        return doc.textFrames[index];
    }
    return null;
}

function findPlacedItem(doc, name, index) {
    if (name && name !== '') {
        for (var i = 0; i < doc.placedItems.length; i++) {
            if (doc.placedItems[i].name === name) {
                return doc.placedItems[i];
            }
        }
    }
    if (index !== undefined && index >= 0 && index < doc.placedItems.length) {
        return doc.placedItems[index];
    }
    return null;
}

function generateFileName(pattern, rowData, headers, rowIndex) {
    var result = pattern;
    result = result.replace(/\{#\}/g, String(rowIndex + 1));
    for (var i = 0; i < headers.length; i++) {
        var placeholder = '{' + headers[i] + '}';
        while (result.indexOf(placeholder) !== -1) {
            result = result.replace(placeholder, rowData[i] || '');
        }
    }
    result = result.replace(/[:\/\\*\?"><\|]/g, '_');
    return result;
}

function trimString(value) {
    return String(value == null ? '' : value).replace(/^\s+|\s+$/g, '');
}

function duplicateRGBColor(color) {
    if (!color) return null;
    var dup = new RGBColor();
    dup.red = color.red;
    dup.green = color.green;
    dup.blue = color.blue;
    return dup;
}

function hexToRGBColor(hex) {
    var normalized = trimString(hex);
    if (!normalized) return null;
    if (normalized.charAt(0) === '#') normalized = normalized.substring(1);
    if (normalized.length === 3) {
        normalized = normalized.charAt(0) + normalized.charAt(0) +
            normalized.charAt(1) + normalized.charAt(1) +
            normalized.charAt(2) + normalized.charAt(2);
    }
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

    var color = new RGBColor();
    color.red = parseInt(normalized.substring(0, 2), 16);
    color.green = parseInt(normalized.substring(2, 4), 16);
    color.blue = parseInt(normalized.substring(4, 6), 16);
    return color;
}

function buildExactMatchRanges(text, pattern) {
    var ranges = [];
    var fromIndex = 0;
    if (!pattern) return ranges;

    while (fromIndex < text.length) {
        var matchIndex = text.indexOf(pattern, fromIndex);
        if (matchIndex < 0) break;
        ranges.push({ start: matchIndex, end: matchIndex + pattern.length });
        fromIndex = matchIndex + Math.max(pattern.length, 1);
    }

    return ranges;
}

function createGlobalRegex(spec) {
    var pattern = spec;
    var flags = 'g';
    if (pattern.charAt(0) === '/') {
        var lastSlash = pattern.lastIndexOf('/');
        if (lastSlash > 0) {
            pattern = pattern.substring(1, lastSlash);
            flags = spec.substring(lastSlash + 1) || 'g';
        }
    }
    if (flags.indexOf('g') < 0) flags += 'g';
    return new RegExp(pattern, flags);
}

function buildRegexMatchRanges(text, pattern) {
    var ranges = [];
    var regex;
    try {
        regex = createGlobalRegex(pattern);
    } catch (e) {
        return ranges;
    }

    var match;
    while ((match = regex.exec(text)) !== null) {
        var matchText = match[0] || '';
        if (!matchText.length) {
            regex.lastIndex++;
            continue;
        }
        ranges.push({ start: match.index, end: match.index + matchText.length });
    }

    return ranges;
}

function normalizeTextStyleRules(rawRules) {
    var rules = [];
    if (!rawRules || rawRules.length === undefined) return rules;

    for (var i = 0; i < rawRules.length; i++) {
        var raw = rawRules[i];
        if (!raw) continue;

        var pattern = trimString(raw.pattern);
        var applyColor = raw.applyColor === true || raw.applyColor === 'true';
        var applySize = raw.applySize === true || raw.applySize === 'true';
        var sizePt = parseFloat(raw.sizePt);
        var color = applyColor ? hexToRGBColor(raw.colorHex) : null;

        if (!pattern) continue;
        if (applyColor && !color) applyColor = false;
        if (applySize && !(sizePt > 0)) applySize = false;
        if (!applyColor && !applySize) continue;

        rules.push({
            column: raw.column && raw.column !== '' ? String(raw.column) : '__ALL_TEXT__',
            matchMode: raw.matchMode === 'regex' ? 'regex' : 'exact',
            pattern: pattern,
            applyColor: applyColor,
            color: color,
            applySize: applySize,
            sizePt: sizePt
        });
    }

    return rules;
}

function applyTextStyleRules(textFrame, columnName, styleRules) {
    if (!textFrame || !styleRules || !styleRules.length) return 0;

    var contents = '';
    try { contents = String(textFrame.contents || ''); } catch (e) {}
    if (!contents) return 0;

    var appliedMatches = 0;
    for (var ri = 0; ri < styleRules.length; ri++) {
        var rule = styleRules[ri];
        if (rule.column !== '__ALL_TEXT__' && rule.column !== columnName) continue;

        var ranges = rule.matchMode === 'regex'
            ? buildRegexMatchRanges(contents, rule.pattern)
            : buildExactMatchRanges(contents, rule.pattern);

        if (!ranges.length) continue;

        for (var rj = 0; rj < ranges.length; rj++) {
            var range = ranges[rj];
            var end = range.end;
            if (end > textFrame.characters.length) end = textFrame.characters.length;

            for (var ci = range.start; ci < end; ci++) {
                try {
                    var attrs = textFrame.characters[ci].characterAttributes;
                    if (rule.applyColor && rule.color) attrs.fillColor = duplicateRGBColor(rule.color);
                    if (rule.applySize) attrs.size = rule.sizePt;
                } catch (charErr) {}
            }

            appliedMatches++;
        }
    }

    return appliedMatches;
}

function applyRowDataToDocument(doc, mappings, rowData, headers, csvDir, textStyleRules) {
    for (var ai = 0; ai < mappings.length; ai++) {
        var mp = mappings[ai];
        if (mp.type === 'UNMAPPED') continue;

        var ci = typeof mp._columnIndex === 'number' ? mp._columnIndex : indexOf(headers, mp.column);
        if (ci < 0 || ci >= rowData.length) continue;
        var cellVal = rowData[ci];

        if (mp.type === 'TEXTUAL') {
            var tfE = mp._targetItem || findTextFrame(doc, mp.targetName, mp.targetIndex);
            if (tfE) {
                tfE.contents = cellVal == null ? '' : String(cellVal);
                applyTextStyleRules(tfE, mp.column, textStyleRules);
            }
        } else if (mp.type === 'IMAGE') {
            var plE = mp._targetItem || findPlacedItem(doc, mp.targetName, mp.targetIndex);
            if (plE && cellVal) {
                var imgFile2 = new File(cellVal);
                if (!imgFile2.exists && csvDir) {
                    imgFile2 = new File(csvDir + '/' + cellVal);
                }
                if (imgFile2.exists) {
                    var origBounds = plE.geometricBounds;
                    var origW = origBounds[2] - origBounds[0];
                    var origH = origBounds[1] - origBounds[3];

                    plE.file = imgFile2;

                    var newBounds = plE.geometricBounds;
                    var newW = newBounds[2] - newBounds[0];
                    var newH = newBounds[1] - newBounds[3];

                    if (newW > 0 && newH > 0) {
                        plE.resize((origW / newW) * 100, (origH / newH) * 100);
                    }
                    plE.position = [origBounds[0], origBounds[1]];
                }
            }
        } else if (mp.type === 'VISIBILITY') {
            var cleanN = mp.column.replace(/^#/, '');
            var itE = mp._targetItem || findNamedItem(doc, cleanN);
            if (!itE && mp.targetName) itE = findNamedItem(doc, mp.targetName);
            if (itE) {
                var bv = String(cellVal).toLowerCase();
                itE.hidden = !(bv === 'true' || bv === '1' || bv === 'yes');
            }
        }
    }
}

function createPdfSaveOptions() {
    var pdfOpts = new PDFSaveOptions();
    pdfOpts.compatibility = PDFCompatibility.ACROBAT7;
    pdfOpts.preserveEditability = false;
    pdfOpts.generateThumbnails = true;
    return pdfOpts;
}

function exportCurrentRow(doc, outputFolder, fileName, exportSettings) {
    var format = (exportSettings.format || 'PDF').toUpperCase();
    var dpi = parseInt(exportSettings.dpi) || 300;

    if (format === 'PDF') {
        var pdfFile = new File(outputFolder.fsName + '/' + fileName + '.pdf');
        doc.saveAs(pdfFile, createPdfSaveOptions());
        return pdfFile.fsName;
    } else if (format === 'PNG') {
        var pngFile = new File(outputFolder.fsName + '/' + fileName + '.png');
        var pngOpts = new ExportOptionsPNG24();
        pngOpts.artBoardClipping = true;
        pngOpts.transparency = true;
        pngOpts.horizontalScale = (dpi / 72) * 100;
        pngOpts.verticalScale = (dpi / 72) * 100;
        doc.exportFile(pngFile, ExportType.PNG24, pngOpts);
        return pngFile.fsName;
    } else if (format === 'JPG' || format === 'JPEG') {
        var jpgFile = new File(outputFolder.fsName + '/' + fileName + '.jpg');
        var jpgOpts = new ExportOptionsJPEG();
        jpgOpts.artBoardClipping = true;
        jpgOpts.qualitySetting = 80;
        jpgOpts.horizontalScale = (dpi / 72) * 100;
        jpgOpts.verticalScale = (dpi / 72) * 100;
        doc.exportFile(jpgFile, ExportType.JPEG, jpgOpts);
        return jpgFile.fsName;
    }

    throw new Error('Unsupported export format: ' + format);
}

function getActiveArtboardRect(doc) {
    var artboardIndex = doc.artboards.getActiveArtboardIndex();
    return doc.artboards[artboardIndex].artboardRect;
}

function getPagedArtboardRect(index, pageWidth, pageHeight) {
    var gap = 20;
    var columns = 10;
    var col = index % columns;
    var row = Math.floor(index / columns);
    var left = col * (pageWidth + gap);
    var top = -row * (pageHeight + gap);
    return [left, top, left + pageWidth, top - pageHeight];
}

function duplicateTopLevelArtwork(sourceDoc, targetDoc, sourceRect, targetRect) {
    var dx = targetRect[0] - sourceRect[0];
    var dy = targetRect[1] - sourceRect[1];
    var targetLayer = targetDoc.layers[0];

    for (var i = 0; i < sourceDoc.pageItems.length; i++) {
        var item = sourceDoc.pageItems[i];
        if (!item || !item.parent || item.parent.typename !== 'Layer') continue;

        var parentLayer = item.parent;
        var wasLocked = false;
        var layerWasLocked = false;
        try {
            if (item.hidden) continue;
            try {
                wasLocked = item.locked;
                item.locked = false;
            } catch (itemLockErr) {}
            try {
                layerWasLocked = parentLayer.locked;
                parentLayer.locked = false;
            } catch (layerLockErr) {}
            var copy = item.duplicate(targetLayer, ElementPlacement.PLACEATEND);
            copy.translate(dx, dy);
        } catch (dupErr) {
        } finally {
            try {
                item.locked = wasLocked;
            } catch (restoreItemLockErr) {}
            try {
                parentLayer.locked = layerWasLocked;
            } catch (restoreLayerLockErr) {}
        }
    }
}

function sanitizeFileBase(value) {
    var base = trimString(value || 'data-merge');
    if (!base) base = 'data-merge';
    return base.replace(/[:\/\\*\?"><\|]/g, '_');
}

function createMergedPdfFile(outputFolder, baseName, startIndex, count, totalRows) {
    var safeBase = sanitizeFileBase(baseName);
    var suffix = totalRows > count ? '_' + (startIndex + 1) + '-' + (startIndex + count) : '';
    return new File(outputFolder.fsName + '/' + safeBase + suffix + '.pdf');
}

function prepareMappings(doc, mappings, headers) {
    for (var pm = 0; pm < mappings.length; pm++) {
        var prepared = mappings[pm];
        if (!prepared.column || trimString(prepared.column) === '') {
            prepared._columnIndex = -1;
            prepared._targetItem = null;
            continue;
        }
        prepared._columnIndex = indexOf(headers, prepared.column);
        if (prepared.type === 'TEXTUAL') {
            prepared._targetItem = findTextFrame(doc, prepared.targetName, prepared.targetIndex);
        } else if (prepared.type === 'IMAGE') {
            prepared._targetItem = findPlacedItem(doc, prepared.targetName, prepared.targetIndex);
        } else if (prepared.type === 'VISIBILITY') {
            var preparedName = prepared.column.replace(/^#/, '');
            prepared._targetItem = findNamedItem(doc, preparedName);
            if (!prepared._targetItem && prepared.targetName) {
                prepared._targetItem = findNamedItem(doc, prepared.targetName);
            }
        }
    }
}

function isMappedTopLevelItem(item, mappings) {
    for (var mi = 0; mi < mappings.length; mi++) {
        if (mappings[mi]._targetItem === item) return true;
    }
    return false;
}

function duplicateStaticBackground(sourceDoc, targetDoc, sourceRect, targetRect, mappings) {
    var dx = targetRect[0] - sourceRect[0];
    var dy = targetRect[1] - sourceRect[1];
    var targetLayer = targetDoc.layers[0];

    for (var i = 0; i < sourceDoc.pageItems.length; i++) {
        var item = sourceDoc.pageItems[i];
        if (!item || !item.parent || item.parent.typename !== 'Layer') continue;
        if (isMappedTopLevelItem(item, mappings)) continue;

        try {
            if (item.hidden) continue;
            var copy = item.duplicate(targetLayer, ElementPlacement.PLACEATEND);
            copy.translate(dx, dy);
        } catch (dupErr) {}
    }
}

function colorToHex(color) {
    try {
        if (!color) return '#000000';
        if (color.typename === 'RGBColor') {
            return '#' +
                ('0' + Math.round(color.red).toString(16)).slice(-2) +
                ('0' + Math.round(color.green).toString(16)).slice(-2) +
                ('0' + Math.round(color.blue).toString(16)).slice(-2);
        }
        if (color.typename === 'CMYKColor') {
            var c = color.cyan / 100;
            var m = color.magenta / 100;
            var y = color.yellow / 100;
            var k = color.black / 100;
            var r = Math.round(255 * (1 - c) * (1 - k));
            var g = Math.round(255 * (1 - m) * (1 - k));
            var b = Math.round(255 * (1 - y) * (1 - k));
            return '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2);
        }
    } catch (e) {}
    return '#000000';
}

function getTextAlignment(textFrame) {
    try {
        var justification = textFrame.textRange.paragraphAttributes.justification;
        if (justification === Justification.CENTER) return 'center';
        if (justification === Justification.RIGHT) return 'right';
        if (justification === Justification.FULLJUSTIFY ||
            justification === Justification.FULLJUSTIFYLASTLINECENTER ||
            justification === Justification.FULLJUSTIFYLASTLINELEFT ||
            justification === Justification.FULLJUSTIFYLASTLINERIGHT) {
            return 'justify';
        }
    } catch (e) {}
    return 'left';
}

function exportBackgroundPdfByHidingDynamicItems(doc, mappings, outputFile) {
    var hiddenStates = [];
    var activeArtboardIndex = doc.artboards.getActiveArtboardIndex();

    try {
        for (var i = 0; i < mappings.length; i++) {
            var item = mappings[i]._targetItem;
            if (!item || (mappings[i].type !== 'TEXTUAL' && mappings[i].type !== 'IMAGE')) continue;

            try {
                hiddenStates.push({ item: item, hidden: item.hidden });
                item.hidden = true;
            } catch (hideErr) {}
        }

        var bgPdfOpts = createPdfSaveOptions();
        bgPdfOpts.artboardRange = String(activeArtboardIndex + 1);
        doc.saveAs(outputFile, bgPdfOpts);
    } finally {
        for (var j = 0; j < hiddenStates.length; j++) {
            try {
                hiddenStates[j].item.hidden = hiddenStates[j].hidden;
            } catch (restoreErr) {}
        }
    }
}

/**
 * 导出前景 PDF：仅保留在 pageItems 中位于动态元素之前（索引更小 = 更上层）的静态元素。
 * 动态元素和低层级静态元素都被隐藏。
 * foregroundPageItemIndices 是一个包含前景元素在 pageItems 中索引的数组。
 */
function exportForegroundPdf(doc, mappings, foregroundPageItemIndices, outputFile) {
    var hiddenStates = [];
    var activeArtboardIndex = doc.artboards.getActiveArtboardIndex();

    // 建立前景索引查找表
    var fgIndexMap = {};
    for (var k = 0; k < foregroundPageItemIndices.length; k++) {
        fgIndexMap[foregroundPageItemIndices[k]] = true;
    }

    try {
        for (var i = 0; i < doc.pageItems.length; i++) {
            var item = doc.pageItems[i];
            if (!item) continue;

            // 只保留前景元素，其余全部隐藏
            if (!fgIndexMap[i]) {
                try {
                    hiddenStates.push({ item: item, hidden: item.hidden });
                    item.hidden = true;
                } catch (he) {}
            }
        }

        var fgPdfOpts = createPdfSaveOptions();
        fgPdfOpts.artboardRange = String(activeArtboardIndex + 1);
        doc.saveAs(outputFile, fgPdfOpts);
    } finally {
        for (var j = 0; j < hiddenStates.length; j++) {
            try {
                hiddenStates[j].item.hidden = hiddenStates[j].hidden;
            } catch (restoreErr) {}
        }
    }
}

function getItemLayerName(item) {
    try {
        if (item.layer && item.layer.name) return item.layer.name;
    } catch (e) {}
    try {
        if (item.parent && item.parent.name) return item.parent.name;
    } catch (parentErr) {}
    return '';
}

function getItemTypeName(item) {
    try {
        return item.typename || '';
    } catch (e) {}
    return '';
}

function getItemZOrder(item) {
    try {
        if (typeof item.zOrderPosition !== 'undefined') return item.zOrderPosition;
    } catch (e) {}
    return -1;
}

function getRelativeBounds(item, sourceRect) {
    try {
        var b = item.geometricBounds;
        return {
            left: b[0] - sourceRect[0],
            top: sourceRect[1] - b[1],
            right: b[2] - sourceRect[0],
            bottom: sourceRect[1] - b[3]
        };
    } catch (e) {}
    return null;
}

function getStaticDebugItems(doc, mappings, sourceRect) {
    var items = [];
    var maxItems = 300;

    for (var i = 0; i < doc.pageItems.length && items.length < maxItems; i++) {
        var item = doc.pageItems[i];
        if (!item) continue;
        if (isMappedTopLevelItem(item, mappings)) continue;

        var bounds = getRelativeBounds(item, sourceRect);
        if (!bounds) continue;

        var hidden = false;
        try { hidden = !!item.hidden; } catch (hiddenErr) {}
        if (hidden) continue;

        items.push({
            name: item.name || '',
            type: getItemTypeName(item),
            zOrder: getItemZOrder(item),
            layerName: getItemLayerName(item),
            bounds: bounds
        });
    }

    return items;
}

// ============================================================
// MODE: scan
// ============================================================
if (mode === 'scan') {
    var textFrames = [];
    for (var ti = 0; ti < doc.textFrames.length; ti++) {
        var tf = doc.textFrames[ti];
        var content = '';
        try { content = tf.contents; } catch (e) {}
        if (content.length > 50) content = content.substring(0, 50) + '...';
        textFrames.push({ name: tf.name || '', content: content, index: ti });
    }

    var placedItems = [];
    for (var pi = 0; pi < doc.placedItems.length; pi++) {
        var pl = doc.placedItems[pi];
        var plFile = '';
        try { plFile = pl.file ? pl.file.name : ''; } catch (e) {}
        placedItems.push({ name: pl.name || '', content: plFile, index: pi });
    }

    var namedItems = [];
    for (var ni = 0; ni < doc.pageItems.length; ni++) {
        var item = doc.pageItems[ni];
        if (item.name && item.name !== '') {
            namedItems.push({ name: item.name, index: ni });
        }
    }

    return $.hopeflow.utils.returnResult({
        textFrames: textFrames,
        placedItems: placedItems,
        namedItems: namedItems
    });
}

// ============================================================
// MODE: createDataSets
// ============================================================
if (mode === 'createDataSets') {
    var mappings = args.mappings;
    var csvData = args.csvData;
    var headers = args.headers;
    var textStyleRules = normalizeTextStyleRules(args.textStyleRules);

    if (!mappings || !csvData || !headers) {
        return $.hopeflow.utils.returnError('缺少映射或数据参数');
    }

    var step = 'init';
    try {
        // 1. Clear existing DataSets first (must remove datasets before variables)
        step = '清除旧数据集';
        try {
            while (doc.dataSets.length > 0) {
                doc.dataSets[0].remove();
            }
        } catch (e) {
            // dataSets might be empty or not supported — ok to continue
        }

        step = '清除旧变量';
        try {
            while (doc.variables.length > 0) {
                doc.variables[0].remove();
            }
        } catch (e) {
            // variables might be empty — ok to continue
        }

        // 2. Create Variables and bind to objects
        var boundCount = 0;
        for (var mi = 0; mi < mappings.length; mi++) {
            var mapping = mappings[mi];
            if (mapping.type === 'UNMAPPED') continue;

            var varName = mapping.column;
            step = '创建变量: ' + varName;

            var newVar = doc.variables.add();
            newVar.name = varName;

            if (mapping.type === 'TEXTUAL') {
                newVar.kind = VariableKind.TEXTUAL;
                var tf2 = findTextFrame(doc, mapping.targetName, mapping.targetIndex);
                if (tf2) {
                    step = '绑定文本变量: ' + varName + ' -> ' + (mapping.targetName || '#' + mapping.targetIndex);
                    tf2.contentVariable = newVar;
                    boundCount++;
                }
            } else if (mapping.type === 'IMAGE') {
                newVar.kind = VariableKind.IMAGE;
                var pl2 = findPlacedItem(doc, mapping.targetName, mapping.targetIndex);
                if (pl2) {
                    step = '绑定图像变量: ' + varName;
                    pl2.contentVariable = newVar;
                    boundCount++;
                }
            } else if (mapping.type === 'VISIBILITY') {
                newVar.kind = VariableKind.VISIBILITY;
                var cleanName = mapping.column.replace(/^#/, '');
                var item2 = findNamedItem(doc, cleanName);
                if (!item2 && mapping.targetName) {
                    item2 = findNamedItem(doc, mapping.targetName);
                }
                if (item2) {
                    step = '绑定可见性变量: ' + varName;
                    item2.visibilityVariable = newVar;
                    boundCount++;
                }
            }
        }

        if (boundCount === 0) {
            return $.hopeflow.utils.returnError('没有成功绑定任何变量到文档对象');
        }

        // 3. Create DataSets — set values then capture
        var created = 0;
        for (var ri = 0; ri < csvData.length; ri++) {
            var row = csvData[ri];
            step = '设置第 ' + (ri + 1) + ' 行数据';

            for (var vi = 0; vi < mappings.length; vi++) {
                var m = mappings[vi];
                if (m.type === 'UNMAPPED') continue;

                var colIdx = indexOf(headers, m.column);
                if (colIdx < 0 || colIdx >= row.length) continue;
                var val = row[colIdx];

                if (m.type === 'TEXTUAL') {
                    var tf3 = findTextFrame(doc, m.targetName, m.targetIndex);
                    if (tf3) {
                        try {
                            tf3.contents = val == null ? '' : String(val);
                            applyTextStyleRules(tf3, m.column, textStyleRules);
                        } catch (e) {}
                    }
                } else if (m.type === 'IMAGE') {
                    var pl3 = findPlacedItem(doc, m.targetName, m.targetIndex);
                    if (pl3 && val) {
                        try {
                            var imgFile = new File(val);
                            if (imgFile.exists) pl3.file = imgFile;
                        } catch (e) {}
                    }
                } else if (m.type === 'VISIBILITY') {
                    var cleanName2 = m.column.replace(/^#/, '');
                    var item3 = findNamedItem(doc, cleanName2);
                    if (!item3 && m.targetName) item3 = findNamedItem(doc, m.targetName);
                    if (item3) {
                        var boolVal = String(val).toLowerCase();
                        item3.hidden = !(boolVal === 'true' || boolVal === '1' || boolVal === 'yes');
                    }
                }
            }

            // Capture as DataSet
            step = '添加数据集 #' + (ri + 1);
            var dsName = 'Row_' + (ri + 1);
            if (row.length > 0 && row[0]) {
                dsName = String(row[0]).substring(0, 30);
            }
            var ds = doc.dataSets.add();
            ds.name = dsName;
            created++;
        }

        // Show first dataset
        step = '显示数据集';
        if (doc.dataSets.length > 0) {
            doc.dataSets[0].display();
        }

        return $.hopeflow.utils.returnResult({
            datasetsCreated: created,
            variablesCreated: doc.variables.length
        });

    } catch (e) {
        return $.hopeflow.utils.returnError('创建数据集失败 [' + step + ']: ' + (e.message || String(e)));
    }
}

// ============================================================
// MODE: exportPythonTemplate
// ============================================================
if (mode === 'exportPythonTemplate') {
    var mappingsP = args.mappings;
    var headersP = args.headers || [];
    var exportSettingsP = args.exportSettings;
    var templateNameP = args.templateName || 'data-merge-template';

    if (!mappingsP || !exportSettingsP || !exportSettingsP.outputFolder) {
        return $.hopeflow.utils.returnError('Missing Python template parameters');
    }

    var outputFolderP = new Folder(exportSettingsP.outputFolder);
    if (!outputFolderP.exists) outputFolderP.create();

    prepareMappings(doc, mappingsP, headersP);

    var sourceRectP = getActiveArtboardRect(doc);
    var pageWidthP = sourceRectP[2] - sourceRectP[0];
    var pageHeightP = sourceRectP[1] - sourceRectP[3];
    try {
        // 在 Illustrator 中，pageItems[0] 是最靠前（最上层）的元素。
        // 找到所有动态元素在 pageItems 中的最小索引（最上层动态元素）。
        // 索引比它更小的非动态元素就是“前景”，需要盖在动态内容之上。
        var minDynamicIndex = doc.pageItems.length;
        for (var fp = 0; fp < mappingsP.length; fp++) {
            var tgt = mappingsP[fp]._targetItem;
            if (!tgt) continue;
            // 查找动态元素在 pageItems 中的索引
            for (var pi = 0; pi < doc.pageItems.length; pi++) {
                if (doc.pageItems[pi] === tgt) {
                    if (pi < minDynamicIndex) minDynamicIndex = pi;
                    break;
                }
            }
        }

        // 收集位于动态元素前面（上层）的可见非动态元素索引
        var foregroundIndices = [];
        for (var si = 0; si < minDynamicIndex; si++) {
            var sItem = doc.pageItems[si];
            if (!sItem) continue;
            if (isMappedTopLevelItem(sItem, mappingsP)) continue;
            var sHidden = false;
            try { sHidden = !!sItem.hidden; } catch (she) {}
            if (!sHidden) {
                foregroundIndices.push(si);
            }
        }

        var hasForeground = foregroundIndices.length > 0;

        var backgroundFileP = new File(outputFolderP.fsName + '/' + sanitizeFileBase(templateNameP) + '_background.pdf');
        exportBackgroundPdfByHidingDynamicItems(doc, mappingsP, backgroundFileP);

        // 如果存在前景元素，额外导出前景 PDF
        var foregroundFileP = null;
        if (hasForeground) {
            foregroundFileP = new File(outputFolderP.fsName + '/' + sanitizeFileBase(templateNameP) + '_foreground.pdf');
            try {
                exportForegroundPdf(doc, mappingsP, foregroundIndices, foregroundFileP);
            } catch (fgErr) {
                foregroundFileP = null; // 前景导出失败时静默降级
            }
        }

        var fieldsP = [];
        for (var fp2 = 0; fp2 < mappingsP.length; fp2++) {
            var mapP = mappingsP[fp2];
            if (!mapP.column || trimString(mapP.column) === '') continue;
            var targetP = mapP._targetItem;
            if (!targetP || (mapP.type !== 'TEXTUAL' && mapP.type !== 'IMAGE')) continue;

            var bP = targetP.geometricBounds;
            var fieldP = {
                column: mapP.column,
                type: mapP.type,
                targetName: mapP.targetName || '',
                targetIndex: mapP.targetIndex,
                zOrder: typeof targetP.zOrderPosition !== 'undefined' ? targetP.zOrderPosition : -1,
                layerName: getItemLayerName(targetP),
                bounds: {
                    left: bP[0] - sourceRectP[0],
                    top: sourceRectP[1] - bP[1],
                    right: bP[2] - sourceRectP[0],
                    bottom: sourceRectP[1] - bP[3]
                }
            };

            if (mapP.type === 'TEXTUAL') {
                try {
                    var attrsP = targetP.textRange.characterAttributes;
                    fieldP.fontSize = attrsP.size || 12;
                    fieldP.color = colorToHex(attrsP.fillColor);
                    fieldP.fontName = attrsP.textFont ? attrsP.textFont.name : '';
                    fieldP.fontFamily = attrsP.textFont ? attrsP.textFont.family : '';
                    fieldP.fontStyle = attrsP.textFont ? attrsP.textFont.style : '';
                    fieldP.alignment = getTextAlignment(targetP);
                } catch (textAttrErrP) {
                    fieldP.fontSize = 12;
                    fieldP.color = '#000000';
                    fieldP.fontName = '';
                    fieldP.fontFamily = '';
                    fieldP.fontStyle = '';
                    fieldP.alignment = 'left';
                }
            }

            fieldsP.push(fieldP);
        }

        return $.hopeflow.utils.returnResult({
            backgroundPdf: backgroundFileP.fsName,
            foregroundPdf: foregroundFileP ? foregroundFileP.fsName : null,
            page: { width: pageWidthP, height: pageHeightP },
            fields: fieldsP,
            debug: {
                staticItems: getStaticDebugItems(doc, mappingsP, sourceRectP),
                minDynamicPageItemIndex: minDynamicIndex,
                foregroundCount: foregroundIndices.length,
                hasForeground: hasForeground
            }
        });
    } catch (templateErrP) {
        return $.hopeflow.utils.returnError('Python template export failed: ' + (templateErrP.message || String(templateErrP)));
    }
}

// ============================================================
// MODE: exportMergedPdf
// ============================================================
if (mode === 'exportMergedPdf') {
    var mappingsM = args.mappings;
    var csvDataM = args.csvData;
    var headersM = args.headers;
    var startIndexM = args.startIndex || 0;
    var totalRowsM = args.totalRows || (csvDataM ? csvDataM.length : 0);
    var exportSettingsM = args.exportSettings;
    var csvDirM = args.csvDir || '';
    var mergedFileNameM = args.mergedFileName || 'data-merge';
    var textStyleRulesM = normalizeTextStyleRules(args.textStyleRules);

    if (!mappingsM || !csvDataM || !headersM || !exportSettingsM) {
        return $.hopeflow.utils.returnError('Missing merged PDF export parameters');
    }

    var outputFolderM = new Folder(exportSettingsM.outputFolder);
    if (!outputFolderM.exists) outputFolderM.create();

    var sourceRectM = getActiveArtboardRect(doc);
    var pageWidthM = sourceRectM[2] - sourceRectM[0];
    var pageHeightM = sourceRectM[1] - sourceRectM[3];
    if (!(pageWidthM > 0) || !(pageHeightM > 0)) {
        return $.hopeflow.utils.returnError('Invalid active artboard size');
    }

    for (var mm = 0; mm < mappingsM.length; mm++) {
        var preparedM = mappingsM[mm];
        preparedM._columnIndex = indexOf(headersM, preparedM.column);
        if (preparedM.type === 'TEXTUAL') {
            preparedM._targetItem = findTextFrame(doc, preparedM.targetName, preparedM.targetIndex);
        } else if (preparedM.type === 'IMAGE') {
            preparedM._targetItem = findPlacedItem(doc, preparedM.targetName, preparedM.targetIndex);
        } else if (preparedM.type === 'VISIBILITY') {
            var preparedNameM = preparedM.column.replace(/^#/, '');
            preparedM._targetItem = findNamedItem(doc, preparedNameM);
            if (!preparedM._targetItem && preparedM.targetName) {
                preparedM._targetItem = findNamedItem(doc, preparedM.targetName);
            }
        }
    }

    var tempDocM = null;
    try {
        tempDocM = app.documents.add(doc.documentColorSpace, pageWidthM, pageHeightM);

        for (var mi = 0; mi < csvDataM.length; mi++) {
            var targetRectM = getPagedArtboardRect(mi, pageWidthM, pageHeightM);
            if (mi === 0) {
                tempDocM.artboards[0].artboardRect = targetRectM;
            } else {
                tempDocM.artboards.add(targetRectM);
            }

            try {
                tempDocM.artboards[mi].name = generateFileName(
                    exportSettingsM.fileNamePattern || '{#}',
                    csvDataM[mi], headersM, startIndexM + mi
                );
            } catch (nameErrM) {}

            applyRowDataToDocument(doc, mappingsM, csvDataM[mi], headersM, csvDirM, textStyleRulesM);
            duplicateTopLevelArtwork(doc, tempDocM, sourceRectM, targetRectM);
        }

        var mergedFileM = createMergedPdfFile(outputFolderM, mergedFileNameM, startIndexM, csvDataM.length, totalRowsM);
        var mergedPdfOptsM = createPdfSaveOptions();
        mergedPdfOptsM.artboardRange = '1-' + csvDataM.length;
        tempDocM.saveAs(mergedFileM, mergedPdfOptsM);
        tempDocM.close(SaveOptions.DONOTSAVECHANGES);
        tempDocM = null;

        return $.hopeflow.utils.returnResult({
            exported: csvDataM.length,
            failed: 0,
            files: [mergedFileM.fsName],
            merged: true
        });
    } catch (mergedErrM) {
        try {
            if (tempDocM) tempDocM.close(SaveOptions.DONOTSAVECHANGES);
        } catch (closeErrM) {}
        return $.hopeflow.utils.returnError('Merged PDF export failed: ' + (mergedErrM.message || String(mergedErrM)));
    }
}

// ============================================================
// MODE: exportBatch
// ============================================================
if (mode === 'exportBatch') {
    var mappingsB = args.mappings;
    var csvDataB = args.csvData;
    var headersB = args.headers;
    var startIndexB = args.startIndex || 0;
    var exportSettingsB = args.exportSettings;
    var csvDirB = args.csvDir || '';
    var textStyleRulesB = normalizeTextStyleRules(args.textStyleRules);

    if (!mappingsB || !csvDataB || !headersB || !exportSettingsB) {
        return $.hopeflow.utils.returnError('Missing batch export parameters');
    }

    var outputFolderB = new Folder(exportSettingsB.outputFolder);
    if (!outputFolderB.exists) outputFolderB.create();

    var successCountB = 0;
    var failCountB = 0;
    var errorsB = [];
    var filesB = [];

    for (var pm = 0; pm < mappingsB.length; pm++) {
        var prepared = mappingsB[pm];
        prepared._columnIndex = indexOf(headersB, prepared.column);
        if (prepared.type === 'TEXTUAL') {
            prepared._targetItem = findTextFrame(doc, prepared.targetName, prepared.targetIndex);
        } else if (prepared.type === 'IMAGE') {
            prepared._targetItem = findPlacedItem(doc, prepared.targetName, prepared.targetIndex);
        } else if (prepared.type === 'VISIBILITY') {
            var preparedName = prepared.column.replace(/^#/, '');
            prepared._targetItem = findNamedItem(doc, preparedName);
            if (!prepared._targetItem && prepared.targetName) {
                prepared._targetItem = findNamedItem(doc, prepared.targetName);
            }
        }
    }

    for (var bi = 0; bi < csvDataB.length; bi++) {
        try {
            var rowB = csvDataB[bi];
            var rowIndexB = startIndexB + bi;

            applyRowDataToDocument(doc, mappingsB, rowB, headersB, csvDirB, textStyleRulesB);

            var fileNameB = generateFileName(
                exportSettingsB.fileNamePattern || '{#}',
                rowB, headersB, rowIndexB
            );
            var filePathB = exportCurrentRow(doc, outputFolderB, fileNameB, exportSettingsB);

            filesB.push(filePathB);
            successCountB++;
        } catch (rowErrB) {
            failCountB++;
            if (errorsB.length < 20) {
                errorsB.push({
                    row: startIndexB + bi + 1,
                    error: rowErrB.message || String(rowErrB)
                });
            }
        }
    }

    return $.hopeflow.utils.returnResult({
        exported: successCountB,
        failed: failCountB,
        files: filesB,
        errors: errorsB
    });
}

// ============================================================
// MODE: exportSingle
// ============================================================
if (mode === 'exportSingle') {
    var mappings2 = args.mappings;
    var rowData = args.rowData;
    var headers2 = args.headers;
    var rowIndex = args.rowIndex || 0;
    var exportSettings = args.exportSettings;
    var csvDir = args.csvDir || '';
    var textStyleRules2 = normalizeTextStyleRules(args.textStyleRules);

    if (!mappings2 || !rowData || !headers2 || !exportSettings) {
        return $.hopeflow.utils.returnError('缺少导出参数');
    }

    try {
        // 1. Apply data
        for (var ai = 0; ai < mappings2.length; ai++) {
            var mp = mappings2[ai];
            if (mp.type === 'UNMAPPED') continue;

            var ci = indexOf(headers2, mp.column);
            if (ci < 0 || ci >= rowData.length) continue;
            var cellVal = rowData[ci];

            if (mp.type === 'TEXTUAL') {
                var tfE = findTextFrame(doc, mp.targetName, mp.targetIndex);
                if (tfE) {
                    tfE.contents = cellVal == null ? '' : String(cellVal);
                    applyTextStyleRules(tfE, mp.column, textStyleRules2);
                }
            } else if (mp.type === 'IMAGE') {
                var plE = findPlacedItem(doc, mp.targetName, mp.targetIndex);
                if (plE && cellVal) {
                    var imgFile2 = new File(cellVal);
                    if (!imgFile2.exists && csvDir) {
                        imgFile2 = new File(csvDir + '/' + cellVal);
                    }
                    if (imgFile2.exists) {
                        var origBounds = plE.geometricBounds;
                        var origW = origBounds[2] - origBounds[0];
                        var origH = origBounds[1] - origBounds[3];

                        plE.file = imgFile2;

                        var newBounds = plE.geometricBounds;
                        var newW = newBounds[2] - newBounds[0];
                        var newH = newBounds[1] - newBounds[3];

                        if (newW > 0 && newH > 0) {
                            plE.resize((origW / newW) * 100, (origH / newH) * 100);
                        }
                        plE.position = [origBounds[0], origBounds[1]];
                    }
                }
            } else if (mp.type === 'VISIBILITY') {
                var cleanN = mp.column.replace(/^#/, '');
                var itE = findNamedItem(doc, cleanN);
                if (!itE && mp.targetName) itE = findNamedItem(doc, mp.targetName);
                if (itE) {
                    var bv = String(cellVal).toLowerCase();
                    itE.hidden = !(bv === 'true' || bv === '1' || bv === 'yes');
                }
            }
        }

        // 2. File name
        var fileName = generateFileName(
            exportSettings.fileNamePattern || '{#}',
            rowData, headers2, rowIndex
        );

        var outputFolder = new Folder(exportSettings.outputFolder);
        if (!outputFolder.exists) outputFolder.create();

        var format = (exportSettings.format || 'PDF').toUpperCase();
        var dpi = parseInt(exportSettings.dpi) || 300;

        // 3. Export
        if (format === 'PDF') {
            var pdfFile = new File(outputFolder.fsName + '/' + fileName + '.pdf');
            var pdfOpts = new PDFSaveOptions();
            pdfOpts.compatibility = PDFCompatibility.ACROBAT7;
            pdfOpts.preserveEditability = false;
            pdfOpts.generateThumbnails = true;
            doc.saveAs(pdfFile, pdfOpts);

            return $.hopeflow.utils.returnResult({
                exported: true, filePath: pdfFile.fsName, needsReopen: true
            });
        } else if (format === 'PNG') {
            var pngFile = new File(outputFolder.fsName + '/' + fileName + '.png');
            var pngOpts = new ExportOptionsPNG24();
            pngOpts.artBoardClipping = true;
            pngOpts.transparency = true;
            pngOpts.horizontalScale = (dpi / 72) * 100;
            pngOpts.verticalScale = (dpi / 72) * 100;
            doc.exportFile(pngFile, ExportType.PNG24, pngOpts);

            return $.hopeflow.utils.returnResult({
                exported: true, filePath: pngFile.fsName, needsReopen: false
            });
        } else if (format === 'JPG' || format === 'JPEG') {
            var jpgFile = new File(outputFolder.fsName + '/' + fileName + '.jpg');
            var jpgOpts = new ExportOptionsJPEG();
            jpgOpts.artBoardClipping = true;
            jpgOpts.qualitySetting = 80;
            jpgOpts.horizontalScale = (dpi / 72) * 100;
            jpgOpts.verticalScale = (dpi / 72) * 100;
            doc.exportFile(jpgFile, ExportType.JPEG, jpgOpts);

            return $.hopeflow.utils.returnResult({
                exported: true, filePath: jpgFile.fsName, needsReopen: false
            });
        } else {
            return $.hopeflow.utils.returnError('不支持的导出格式: ' + format);
        }

    } catch (e) {
        return $.hopeflow.utils.returnError('导出失败: ' + (e.message || String(e)));
    }
}

return $.hopeflow.utils.returnError('未知模式: ' + mode);
