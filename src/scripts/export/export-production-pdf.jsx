/**
 * 导出生产PDF - Export Production PDF
 * Export high-quality PDF for production/printing
 * Args: {
 *   preset?: 'print'|'press'|'smallest',
 *   compatibility?: 'acrobat4'|'acrobat5'|'acrobat6'|'acrobat7'|'acrobat8',
 *   colorConversion?: 'none'|'cmyk'|'rgb',
 *   embedFonts?: boolean,
 *   compressArt?: boolean,
 *   preserveEditability?: boolean
 * }
 */
(function () {
    if (!$.hopeflow) return;

    var doc = app.activeDocument;
    var args = $.hopeflow.utils.getArgs();

    // Get parameters with defaults
    var preset = args.preset || 'press'; // 'print', 'press', 'smallest'
    var compatibility = args.compatibility || 'acrobat5'; // PDF 1.4
    var colorConversion = args.colorConversion || 'none';
    var embedFonts = args.embedFonts !== false; // default true
    var compressArt = args.compressArt !== false; // default true
    var preserveEditability = args.preserveEditability === true; // default false

    try {
        // Determine save location
        var defaultName = doc.name.replace(/\.[^\.]+$/, '') + '_production.pdf';
        var saveFile = File.saveDialog('保存生产PDF', '*.pdf');

        if (!saveFile) {
            return $.hopeflow.utils.returnError('用户取消');
        }

        // Ensure .pdf extension
        if (!/\.pdf$/i.test(saveFile.name)) {
            saveFile = new File(saveFile.fsName + '.pdf');
        }

        // Create PDF save options
        var pdfSaveOpts = new PDFSaveOptions();

        // Set compatibility
        switch (compatibility) {
            case 'acrobat4':
                pdfSaveOpts.compatibility = PDFCompatibility.ACROBAT4;
                break;
            case 'acrobat5':
                pdfSaveOpts.compatibility = PDFCompatibility.ACROBAT5;
                break;
            case 'acrobat6':
                pdfSaveOpts.compatibility = PDFCompatibility.ACROBAT6;
                break;
            case 'acrobat7':
                pdfSaveOpts.compatibility = PDFCompatibility.ACROBAT7;
                break;
            case 'acrobat8':
                pdfSaveOpts.compatibility = PDFCompatibility.ACROBAT8;
                break;
            default:
                pdfSaveOpts.compatibility = PDFCompatibility.ACROBAT5;
        }

        // Set preset-based options
        if (preset === 'press') {
            // High Quality Print preset - removed pDFPreset as it may cause issues
            pdfSaveOpts.colorCompression = CompressionQuality.None;
            pdfSaveOpts.colorDownsampling = 300;
            pdfSaveOpts.colorDownsamplingMethod = DownsampleMethod.NODOWNSAMPLE;
            pdfSaveOpts.grayscaleCompression = CompressionQuality.None;
            pdfSaveOpts.grayscaleDownsampling = 300;
            pdfSaveOpts.monochromeCompression = MonochromeCompression.CCIT4;
            pdfSaveOpts.monochromeDownsampling = 1200;
        } else if (preset === 'print') {
            // Standard print quality
            pdfSaveOpts.colorCompression = CompressionQuality.AUTOMATICJPEGHIGH;
            pdfSaveOpts.colorDownsampling = 150;
            pdfSaveOpts.colorDownsamplingMethod = DownsampleMethod.BICUBICDOWNSAMPLE;
            pdfSaveOpts.grayscaleCompression = CompressionQuality.AUTOMATICJPEGHIGH;
            pdfSaveOpts.grayscaleDownsampling = 150;
        } else if (preset === 'smallest') {
            // Smallest file size
            pdfSaveOpts.colorCompression = CompressionQuality.AUTOMATICJPEGMINIMUM;
            pdfSaveOpts.colorDownsampling = 72;
            pdfSaveOpts.colorDownsamplingMethod = DownsampleMethod.AVERAGEDOWNSAMPLE;
            pdfSaveOpts.grayscaleCompression = CompressionQuality.AUTOMATICJPEGMINIMUM;
            pdfSaveOpts.grayscaleDownsampling = 72;
        }

        // Color conversion
        switch (colorConversion) {
            case 'cmyk':
                pdfSaveOpts.colorConversionID = ColorConversion.COLORCONVERSIONTOCMYK;
                pdfSaveOpts.colorDestinationID = ColorDestination.COLORDESTINATIONDOCCMYK;
                break;
            case 'rgb':
                pdfSaveOpts.colorConversionID = ColorConversion.COLORCONVERSIONTORGB;
                pdfSaveOpts.colorDestinationID = ColorDestination.COLORDESTINATIONDOCRGB;
                break;
            default:
                pdfSaveOpts.colorConversionID = ColorConversion.None;
        }

        // Font embedding
        if (embedFonts) {
            pdfSaveOpts.fontSubsetThreshold = 100; // Embed all fonts
        } else {
            pdfSaveOpts.fontSubsetThreshold = 0; // Don't embed
        }

        // Compression
        if (compressArt) {
            pdfSaveOpts.compressArt = true;
        } else {
            pdfSaveOpts.compressArt = false;
        }

        // Editability
        if (preserveEditability) {
            pdfSaveOpts.preserveEditability = true;
        } else {
            pdfSaveOpts.preserveEditability = false;
        }

        // Additional quality settings
        pdfSaveOpts.generateThumbnails = true;
        pdfSaveOpts.optimization = true;
        pdfSaveOpts.viewAfterSaving = false;

        // Artboard settings
        pdfSaveOpts.artboardRange = ''; // All artboards

        // Bleed settings (if document has bleed)
        pdfSaveOpts.bleedLink = true;
        pdfSaveOpts.bleedOffsetRect = [
            doc.documentBleedOffset[0],
            doc.documentBleedOffset[1],
            doc.documentBleedOffset[2],
            doc.documentBleedOffset[3]
        ];

        // Marks and bleeds
        pdfSaveOpts.trimMarks = false;
        pdfSaveOpts.registrationMarks = false;
        pdfSaveOpts.colorBars = false;
        pdfSaveOpts.pageInformation = false;

        // Save the PDF
        doc.saveAs(saveFile, pdfSaveOpts);

        return $.hopeflow.utils.returnResult({
            success: true,
            path: saveFile.fsName,
            preset: preset,
            compatibility: compatibility,
            message: 'PDF导出成功'
        });

    } catch (e) {
        return $.hopeflow.utils.returnError('PDF导出失败: ' + e.message);
    }
})();
