/**
 * 大尺寸导出 - Export Large Scale
 * Modes: preview, export
 *
 * NOTE: No IIFE wrapper — `return` must reach the bridge's outer function.
 */

if (!$.hopeflow) {
    return JSON.stringify({ success: false, error: 'runtime not loaded' });
}

var args = $.hopeflow.utils.getArgs();
var mode = args.mode || 'preview';

if (!app.documents.length) {
    return $.hopeflow.utils.returnError('请先打开一个文档');
}

var doc = app.activeDocument;
var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
var abRect = ab.artboardRect; // [left, top, right, bottom]

var widthPt = abRect[2] - abRect[0];
var heightPt = abRect[1] - abRect[3];

var scale = parseFloat(args.scale) || 10;
var dpi = parseInt(args.dpi) || 72;
var format = (args.format || 'PNG').toUpperCase();
var maxPixels = parseInt(args.maxPixels) || 8000;

// Illustrator export scale limit (~776%, use 700% to be safe)
var MAX_EXPORT_SCALE = 700;

// Calculate export dimensions (px)
// 1 inch = 72 pt, so px = pt * scale * dpi / 72
var exportWidthPx = Math.round(widthPt * scale * dpi / 72);
var exportHeightPx = Math.round(heightPt * scale * dpi / 72);
var requiredScalePercent = scale * 100;

// Calculate tiles needed
// By pixel limit
var colsByPx = Math.ceil(exportWidthPx / maxPixels);
var rowsByPx = Math.ceil(exportHeightPx / maxPixels);

// By scale limit (PNG/JPEG only — TIFF uses resolution parameter)
var colsByScale = 1;
var rowsByScale = 1;
if (format !== 'TIFF') {
    colsByScale = Math.ceil(requiredScalePercent / MAX_EXPORT_SCALE);
    rowsByScale = Math.ceil(requiredScalePercent / MAX_EXPORT_SCALE);
}

var cols = Math.max(colsByPx, colsByScale);
var rows = Math.max(rowsByPx, rowsByScale);
var totalTiles = cols * rows;

var scaleLimited = (scale * 100) > MAX_EXPORT_SCALE && format !== 'TIFF';

// ============================================================
// MODE: preview
// ============================================================
if (mode === 'preview') {
    return $.hopeflow.utils.returnResult({
        docName: doc.name.replace(/\.(ai|eps|pdf)$/i, ''),
        originalSize: {
            widthMM: Math.round(widthPt * 0.352778 * 10) / 10,
            heightMM: Math.round(heightPt * 0.352778 * 10) / 10
        },
        exportSize: {
            widthMM: Math.round(widthPt * scale * 0.352778 * 10) / 10,
            heightMM: Math.round(heightPt * scale * 0.352778 * 10) / 10,
            widthPx: exportWidthPx,
            heightPx: exportHeightPx
        },
        tiles: { cols: cols, rows: rows, total: totalTiles },
        scaleLimited: scaleLimited,
        maxScalePercent: MAX_EXPORT_SCALE
    });
}

// ============================================================
// MODE: export
// ============================================================
if (mode === 'export') {
    var outputDir = args.outputDir;
    var baseName = args.baseName || 'export';

    if (!outputDir) {
        return $.hopeflow.utils.returnError('请指定输出目录');
    }

    var outputFolder = new Folder(outputDir);
    if (!outputFolder.exists) outputFolder.create();

    var originalABIndex = doc.artboards.getActiveArtboardIndex();
    var exportedFiles = [];
    var tileWidthPt = widthPt / cols;
    var tileHeightPt = heightPt / rows;

    try {
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                // Calculate tile region (pt)
                var tileLeft = abRect[0] + col * tileWidthPt;
                var tileTop = abRect[1] - row * tileHeightPt;
                var tileRight = Math.min(tileLeft + tileWidthPt, abRect[2]);
                var tileBottom = Math.max(tileTop - tileHeightPt, abRect[3]);

                // Create temporary artboard for this tile
                var tempAB = doc.artboards.add([tileLeft, tileTop, tileRight, tileBottom]);
                var tempABIndex = doc.artboards.length - 1;
                doc.artboards.setActiveArtboardIndex(tempABIndex);

                // File name: single tile → baseName, multi tile → baseName_row_col
                var fileName = totalTiles === 1
                    ? baseName
                    : baseName + '_' + row + '_' + col;

                // Use File constructor (normalizes path separators on both Mac & Windows)
                var outFile;

                if (format === 'PNG') {
                    var tileScale = Math.min(scale * 100, MAX_EXPORT_SCALE);
                    var pngOpts = new ExportOptionsPNG24();
                    pngOpts.artBoardClipping = true;
                    pngOpts.horizontalScale = tileScale;
                    pngOpts.verticalScale = tileScale;
                    pngOpts.transparency = true;
                    pngOpts.antiAliasing = true;
                    outFile = new File(outputFolder.fsName + '/' + fileName + '.png');
                    doc.exportFile(outFile, ExportType.PNG24, pngOpts);
                } else if (format === 'JPEG' || format === 'JPG') {
                    var tileScale = Math.min(scale * 100, MAX_EXPORT_SCALE);
                    var jpgOpts = new ExportOptionsJPEG();
                    jpgOpts.artBoardClipping = true;
                    jpgOpts.horizontalScale = tileScale;
                    jpgOpts.verticalScale = tileScale;
                    jpgOpts.qualitySetting = 100;
                    jpgOpts.antiAliasing = true;
                    outFile = new File(outputFolder.fsName + '/' + fileName + '.jpg');
                    doc.exportFile(outFile, ExportType.JPEG, jpgOpts);
                } else if (format === 'TIFF') {
                    var tiffOpts = new ExportOptionsTIFF();
                    tiffOpts.artboardClipping = true;
                    tiffOpts.resolution = dpi * scale;
                    tiffOpts.antiAliasing = AntiAliasingMethod.ARTOPTIMIZED;
                    // Follow document color space
                    try {
                        tiffOpts.imageColorSpace = (doc.documentColorSpace == DocumentColorSpace.CMYK)
                            ? ImageColorSpace.CMYK : ImageColorSpace.RGB;
                    } catch (e) {
                        tiffOpts.imageColorSpace = ImageColorSpace.CMYK;
                    }
                    outFile = new File(outputFolder.fsName + '/' + fileName + '.tif');
                    doc.exportFile(outFile, ExportType.TIFF, tiffOpts);
                }

                exportedFiles.push(outFile.fsName);

                // Remove temporary artboard
                doc.artboards.remove(tempABIndex);
            }
        }

        // Restore original artboard
        doc.artboards.setActiveArtboardIndex(originalABIndex);

        return $.hopeflow.utils.returnResult({
            files: exportedFiles,
            totalTiles: totalTiles,
            cols: cols,
            rows: rows,
            scaleLimited: scaleLimited
        });

    } catch (e) {
        // Cleanup: restore artboard index and remove leftover temp artboards
        try { doc.artboards.setActiveArtboardIndex(originalABIndex); } catch (e2) {}
        try {
            while (doc.artboards.length > originalABIndex + 1) {
                doc.artboards.remove(doc.artboards.length - 1);
            }
        } catch (e3) {}
        return $.hopeflow.utils.returnError('导出失败: ' + (e.message || String(e)));
    }
}

return $.hopeflow.utils.returnError('未知模式: ' + mode);
