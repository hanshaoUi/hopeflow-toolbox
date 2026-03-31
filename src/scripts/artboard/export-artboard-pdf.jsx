/**
 * 导出当前画板为PDF - Export Artboard as PDF
 * Exports the active artboard to a PDF file
 */
(function () {
    if (!$.hopeflow) return;

    var doc = app.activeDocument;

    if (doc.artboards.length === 0) {
        return $.hopeflow.utils.returnError('当前文档没有画板');
    }

    // Check if document is saved
    if (!doc.saved || !doc.path) {
        return $.hopeflow.utils.returnError('请先保存文档');
    }

    // Get active artboard
    var activeIndex = doc.artboards.getActiveArtboardIndex();
    var ab = doc.artboards[activeIndex];
    var abName = ab.name;

    // Get document path
    var docPath = doc.path;
    var docName = doc.name.replace(/\.[^\.]+$/, ''); // Remove extension

    // Set PDF save path
    var pdfFile = new File(docPath + '/' + docName + '_' + abName + '.pdf');

    // Set PDF save options
    var pdfOptions = new PDFSaveOptions();
    pdfOptions.compatibility = PDFCompatibility.ACROBAT5;
    pdfOptions.generateThumbnails = true;
    pdfOptions.preserveEditability = false;

    // Export only active artboard
    pdfOptions.artboardRange = String(activeIndex + 1);

    // Save as PDF
    // Note: saveAs will save the document as PDF, so we need to handle this carefully
    doc.saveAs(pdfFile, pdfOptions);

    return $.hopeflow.utils.returnResult({
        exported: abName,
        path: pdfFile.fsName
    });
})();
