/**
 * Export each artboard as an individual AI file.
 * Args: {
 *   outputLocation?: 'document'|'desktop'|'custom',
 *   createSubfolder?: boolean,
 *   overwrite?: boolean,
 *   pdfCompatible?: boolean
 * }
 */
(function () {
    if (!$.hopeflow) return;

    if (!app.documents.length) {
        return $.hopeflow.utils.returnError('Please open an Illustrator document first.');
    }

    var doc = app.activeDocument;
    var args = $.hopeflow.utils.getArgs();

    if (!doc.artboards || doc.artboards.length === 0) {
        return $.hopeflow.utils.returnError('The current document has no artboards.');
    }

    if (!doc.saved || !doc.fullName) {
        return $.hopeflow.utils.returnError('Please save the current document before exporting artboards as AI files.');
    }

    function getBaseName(name) {
        return String(name || 'Untitled').replace(/\.[^\.]+$/, '');
    }

    function trimName(value) {
        return String(value || '').replace(/^\s+|\s+$/g, '');
    }

    function sanitizeFileName(name, fallback) {
        var safe = trimName(name || fallback || 'Artboard');
        safe = safe.replace(/[\\\/:\*\?"<>\|]/g, '_');
        safe = safe.replace(/[\x00-\x1f]/g, '_');
        safe = safe.replace(/^\.+|\.+$/g, '');
        safe = trimName(safe);
        if (!safe) safe = fallback || 'Artboard';
        if (safe.length > 120) safe = safe.substring(0, 120);
        return safe;
    }

    function ensureFolder(folder) {
        if (!folder.exists && !folder.create()) {
            throw new Error('Unable to create export folder: ' + folder.fsName);
        }
        return folder;
    }

    function getOutputFolder() {
        var location = args.outputLocation || 'document';
        var folder = null;

        if (location === 'desktop') {
            folder = Folder.desktop;
        } else if (location === 'custom') {
            folder = Folder.selectDialog('Select AI export folder');
            if (!folder) return null;
        } else {
            folder = doc.path;
        }

        if (args.createSubfolder !== false) {
            folder = new Folder(folder.fsName + '/' + sanitizeFileName(getBaseName(doc.name), 'Artboards') + '_AI');
        }

        return ensureFolder(folder);
    }

    function getUniqueFile(folder, baseName, extension, overwrite) {
        var file = new File(folder.fsName + '/' + baseName + extension);
        if (overwrite || !file.exists) return file;

        var index = 2;
        while (file.exists) {
            file = new File(folder.fsName + '/' + baseName + '_' + index + extension);
            index++;
        }
        return file;
    }

    function makeAIOptions(artboardNumber) {
        var options = new IllustratorSaveOptions();
        options.pdfCompatible = args.pdfCompatible !== false;
        options.compressed = true;
        options.embedICCProfile = true;
        options.saveMultipleArtboards = true;
        options.artboardRange = String(artboardNumber);
        return options;
    }

    var outputFolder = null;
    try {
        outputFolder = getOutputFolder();
    } catch (folderError) {
        return $.hopeflow.utils.returnError(folderError.message || String(folderError));
    }

    if (!outputFolder) {
        return $.hopeflow.utils.returnError('User canceled.');
    }

    var originalFile = new File(doc.fullName.fsName);
    var originalArtboardIndex = doc.artboards.getActiveArtboardIndex();
    var artboardCount = doc.artboards.length;
    var artboardNames = [];
    var exported = [];
    var failed = [];
    var previousInteractionLevel = app.userInteractionLevel;

    for (var n = 0; n < artboardCount; n++) {
        artboardNames.push(doc.artboards[n].name || ('Artboard_' + (n + 1)));
    }

    try {
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

        for (var i = 0; i < artboardCount; i++) {
            var fallbackName = 'Artboard_' + (i + 1);
            var fileBaseName = sanitizeFileName(artboardNames[i], fallbackName);
            var saveFile = getUniqueFile(outputFolder, fileBaseName, '.ai', args.overwrite === true);

            try {
                doc.artboards.setActiveArtboardIndex(i);
                doc.saveAs(saveFile, makeAIOptions(i + 1));
                exported.push({
                    index: i + 1,
                    name: artboardNames[i],
                    path: saveFile.fsName
                });
            } catch (itemError) {
                failed.push({
                    index: i + 1,
                    name: artboardNames[i],
                    error: itemError.message || String(itemError)
                });
            }
        }
    } catch (e) {
        return $.hopeflow.utils.returnError('Export AI failed: ' + (e.message || String(e)));
    } finally {
        app.userInteractionLevel = previousInteractionLevel;
        try {
            if (app.documents.length) {
                app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
            }
            doc = app.open(originalFile);
            doc.artboards.setActiveArtboardIndex(Math.min(originalArtboardIndex, doc.artboards.length - 1));
        } catch (restoreError) {}
    }

    if (exported.length === 0 && failed.length > 0) {
        var firstError = failed[0].error || 'Unknown error';
        return $.hopeflow.utils.returnError('No AI files were exported. First failure: ' + firstError);
    }

    return $.hopeflow.utils.returnResult({
        count: exported.length,
        failedCount: failed.length,
        folder: outputFolder.fsName,
        files: exported,
        failed: failed
    });
})();
