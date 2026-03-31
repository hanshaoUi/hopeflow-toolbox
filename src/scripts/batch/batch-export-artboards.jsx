/**
 * 批量导出画板 - Batch Export Artboards
 * Export all or selected artboards as PNG/SVG/PDF.
 * Args: { format: 'png'|'svg'|'pdf', dpi?: number, outputDir?: string, prefix?: string }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var format = args.format || 'png';
    var dpi = args.dpi || 300;
    var doc = app.activeDocument;
    var outputDir = args.outputDir || doc.fullName.parent.fsName;
    var prefix = args.prefix || doc.name.replace(/\.[^.]+$/, '');
    var exported = 0;

    for (var i = 0; i < doc.artboards.length; i++) {
        doc.artboards.setActiveArtboardIndex(i);
        var abName = doc.artboards[i].name;
        var fileName = prefix + '_' + abName;

        var destFile = new File(outputDir + '/' + fileName);

        if (format === 'png') {
            var pngOpts = new ExportOptionsPNG24();
            pngOpts.artBoardClipping = true;
            pngOpts.horizontalScale = (dpi / 72) * 100;
            pngOpts.verticalScale = (dpi / 72) * 100;
            pngOpts.transparency = true;
            doc.exportFile(new File(destFile + '.png'), ExportType.PNG24, pngOpts);
        } else if (format === 'svg') {
            var svgOpts = new ExportOptionsSVG();
            svgOpts.artBoardClipping = true;
            doc.exportFile(new File(destFile + '.svg'), ExportType.SVG, svgOpts);
        } else if (format === 'pdf') {
            var pdfOpts = new PDFSaveOptions();
            pdfOpts.artboardRange = String(i + 1);
            doc.saveAs(new File(destFile + '.pdf'), pdfOpts);
        }

        exported++;
    }

    return $.hopeflow.utils.returnResult({ exported: exported, format: format, outputDir: outputDir });
})();
