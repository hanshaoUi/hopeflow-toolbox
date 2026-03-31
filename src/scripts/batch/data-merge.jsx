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
