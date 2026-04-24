/**
 * Collect artboard size data and optional preview thumbnails for table export.
 * Args:
 * {
 *   mode?: 'collect',
 *   includePreview?: boolean,
 *   thumbnailMaxPx?: number,
 *   autoSave?: boolean
 * }
 */
(function () {
    if (!$.hopeflow) return;

    function sanitizeName(name) {
        return String(name || 'artboard')
            .replace(/[\\\/:\*\?"<>\|]/g, '_')
            .replace(/\s+/g, '_');
    }

    function ensureFolder(folderPath) {
        var folder = new Folder(folderPath);
        if (!folder.exists) {
            folder.create();
        }
        return folder;
    }

    function ensureDocumentSaved(doc, autoSave) {
        if (autoSave === false) {
            return;
        }

        var fullName = null;
        try {
            fullName = doc.fullName;
        } catch (e0) { }

        if (fullName && fullName.fsName) {
            try { doc.save(); } catch (saveExistingError) { }
            return;
        }

        var saveFile = File.saveDialog('保存当前 AI 文档后继续导出', '*.ai');
        if (!saveFile) {
            throw new Error('已取消保存当前文档');
        }

        if (!/\.ai$/i.test(saveFile.name || '')) {
            saveFile = new File(saveFile.fsName + '.ai');
        }

        var saveOptions = new IllustratorSaveOptions();
        saveOptions.pdfCompatible = true;
        saveOptions.compressed = true;
        doc.saveAs(saveFile, saveOptions);
    }

    function activateDocument(doc) {
        if (!doc) {
            return;
        }

        try {
            doc.activate();
        } catch (e0) {
            try { app.activeDocument = doc; } catch (e1) { }
        }
    }

    function exportArtboardPreview(doc, artboardIndex, outputFolder, thumbMaxPx) {
        var artboard = doc.artboards[artboardIndex];
        var rect = artboard.artboardRect;
        var widthPt = rect[2] - rect[0];
        var heightPt = rect[1] - rect[3];
        var targetPx = Math.max(24, parseInt(thumbMaxPx, 10) || 96);
        var longestSide = Math.max(widthPt, heightPt, 1);
        var scalePercent = Math.min(100, Math.max(8, (targetPx / longestSide) * 100));
        var previewPath = outputFolder.fsName + '/ab_' + (artboardIndex + 1) + '_' + sanitizeName(artboard.name) + '.png';
        var previewFile = new File(previewPath);
        var tempDoc = null;
        var sourceDoc = app.activeDocument;

        try {
            doc.artboards.setActiveArtboardIndex(artboardIndex);
            doc.selection = null;
            doc.selectObjectsOnActiveArtboard();

            if (!doc.selection || doc.selection.length === 0) {
                return '';
            }

            app.copy();

            tempDoc = app.documents.add(DocumentColorSpace.RGB, Math.max(widthPt, 1), Math.max(heightPt, 1));
            tempDoc.artboards[0].artboardRect = [0, Math.max(heightPt, 1), Math.max(widthPt, 1), 0];

            activateDocument(tempDoc);
            tempDoc.artboards.setActiveArtboardIndex(0);
            app.executeMenuCommand('pasteFront');

            var pastedBounds = null;
            try {
                pastedBounds = tempDoc.visibleBounds;
            } catch (eBounds) { }

            if (pastedBounds && pastedBounds.length === 4) {
                tempDoc.artboards[0].artboardRect = [
                    pastedBounds[0],
                    pastedBounds[1],
                    pastedBounds[2],
                    pastedBounds[3]
                ];
            }

            var pngOpts = new ExportOptionsPNG24();
            pngOpts.transparency = true;
            pngOpts.artBoardClipping = true;
            pngOpts.horizontalScale = scalePercent;
            pngOpts.verticalScale = scalePercent;
            pngOpts.antiAliasing = true;
            tempDoc.exportFile(previewFile, ExportType.PNG24, pngOpts);

            return previewFile.fsName;
        } finally {
            activateDocument(tempDoc || sourceDoc);
            if (tempDoc) {
                try { tempDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (e1) { }
            }
            activateDocument(sourceDoc);
            try {
                doc.artboards.setActiveArtboardIndex(artboardIndex);
                doc.selection = null;
            } catch (e3) { }
        }
    }

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('当前没有打开的文档');
        }

        var doc = app.activeDocument;
        if (!doc.artboards || doc.artboards.length === 0) {
            return $.hopeflow.utils.returnError('当前文档没有画板');
        }

        var args = $.hopeflow.utils.getArgs();
        ensureDocumentSaved(doc, args.autoSave !== false);

        var includePreview = args.includePreview !== false;
        var thumbnailMaxPx = args.thumbnailMaxPx || 96;
        var stamp = new Date().getTime();
        var tempFolder = ensureFolder(Folder.temp.fsName + '/hopeflow_artboard_size_table_' + stamp);
        var docName = doc.name.replace(/\.[^\.]+$/, '');
        var docPath = '';
        var rows = [];

        try {
            if (doc.saved && doc.fullName && doc.fullName.parent) {
                docPath = doc.fullName.parent.fsName;
            }
        } catch (e4) { }

        for (var i = 0; i < doc.artboards.length; i++) {
            var artboard = doc.artboards[i];
            var rect = artboard.artboardRect;
            var widthPt = rect[2] - rect[0];
            var heightPt = rect[1] - rect[3];
            var previewPath = '';

            if (includePreview) {
                try {
                    previewPath = exportArtboardPreview(doc, i, tempFolder, thumbnailMaxPx);
                } catch (previewError) {
                    previewPath = '';
                }
            }

            rows.push({
                index: i + 1,
                name: String(artboard.name || ('Artboard ' + (i + 1))),
                widthPt: widthPt,
                heightPt: heightPt,
                previewPath: previewPath
            });
        }

        doc.selection = null;

        return $.hopeflow.utils.returnResult({
            mode: 'collect',
            docName: docName,
            docPath: docPath,
            tempDir: tempFolder.fsName,
            artboards: rows,
            count: rows.length
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
