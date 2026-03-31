/**
 * 导出选区为PNG - Export Selection as PNG
 * Args: { dpi?: number, scale?: number, transparent?: boolean, outputPath?: string }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var format = (args.format || 'png').toLowerCase(); // 'png' or 'jpg'
    var scale = parseFloat(args.scale || '100');
    var doc = app.activeDocument;

    // Calculate scaling factor (100% = 1.0, but for export options, usually 72 dpi base)
    // For PNG24, horizontalScale/verticalScale uses percentage (100.0 = 100%)

    // Choose output path
    var ext = (format === 'jpg') ? 'jpg' : 'png';
    var outputPath = args.outputPath || (doc.fullName.parent.fsName + '/export_selection_' + new Date().getTime() + '.' + ext);
    var exportFile = new File(outputPath);

    // Group selection temporarily for export
    // Warning: Moving items can be risky with complex structures, but is standard for "selection only" export in older AI ver
    // Better approach: Copy to new temp document? Copying is safer for original doc but slower.
    // Let's stick to temp group for now, but handle with care.
    // Actually, creating a temp doc and pasting is safer for preserving original hierarchy, but selection export often does this.
    // Let's modify approach to "Copy to New Document" to match "Export Selection" behavior more robustly without messing up current doc.

    var tempDoc;
    try {
        // 1. Copy selection
        app.copy();

        // 2. Create temp document
        // Use logic to determine size? Or just arbitrary and then fit artboard.
        tempDoc = app.documents.add(DocumentColorSpace.RGB);

        // 3. Paste
        app.executeMenuCommand('pasteFront');

        // 4. Fit Artboard to artwork
        tempDoc.artboards[0].artboardRect = tempDoc.visibleBounds;

        // 5. Export
        if (format === 'jpg') {
            var jpgOpts = new ExportOptionsJPEG();
            jpgOpts.antiAliasing = true;
            jpgOpts.qualitySetting = 80;
            jpgOpts.horizontalScale = scale;
            jpgOpts.verticalScale = scale;
            jpgOpts.artBoardClipping = true;
            tempDoc.exportFile(exportFile, ExportType.JPEG, jpgOpts);
        } else {
            var pngOpts = new ExportOptionsPNG24();
            pngOpts.transparency = true;
            pngOpts.horizontalScale = scale;
            pngOpts.verticalScale = scale;
            pngOpts.artBoardClipping = true;
            tempDoc.exportFile(exportFile, ExportType.PNG24, pngOpts);
        }

        return $.hopeflow.utils.returnResult({ exported: outputPath });

    } catch (e) {
        return $.hopeflow.utils.returnError(e.message);
    } finally {
        if (tempDoc) tempDoc.close(SaveOptions.DONOTSAVECHANGES);
    }
})();
