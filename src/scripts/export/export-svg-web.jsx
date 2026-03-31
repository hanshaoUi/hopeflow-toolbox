/**
 * 导出Web SVG - Export Optimized SVG for Web
 * Args: { minify?: boolean, inlineStyles?: boolean, outputPath?: string }
 */
(function() {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var doc = app.activeDocument;
    var outputPath = args.outputPath || (doc.fullName.parent.fsName + '/' + doc.name.replace(/\.[^.]+$/, '') + '.svg');

    var opts = new ExportOptionsSVG();
    opts.embedRasterImages = true;
    opts.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
    opts.fontSubsetting = SVGFontSubsetting.None;
    opts.documentEncoding = SVGDocumentEncoding.UTF8;
    opts.coordinatePrecision = 2;
    opts.DTD = SVGDTDVersion.SVG1_1;

    if (args.inlineStyles) {
        opts.cssProperties = SVGCSSPropertyLocation.STYLEELEMENTS;
    }

    doc.exportFile(new File(outputPath), ExportType.SVG, opts);

    return $.hopeflow.utils.returnResult({ exported: outputPath });
})();
