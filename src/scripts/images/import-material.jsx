#target illustrator

    /**
     * Import a file at the given path into the active document.
     */
    (function () {
        if (!$.hopeflow) {
            alert("HopeFlow runtime not initialized.");
            return;
        }

        var args = $.hopeflow.utils.getArgs();
        var filePath = args.path;

        if (!filePath) {
            return $.hopeflow.utils.returnError("No file path provided.");
        }

        var fileRef = new File(filePath);
        if (!fileRef.exists) {
            return $.hopeflow.utils.returnError("File does not exist: " + filePath);
        }

        if (app.documents.length === 0) {
            // If no document open, just open the file
            app.open(fileRef);
            return $.hopeflow.utils.returnResult("success");
        }

        var doc = app.activeDocument;
        var ext = filePath.split('.').pop().toLowerCase();

        try {
            if (ext === 'svg') {
                // For SVG, open the file and copy contents to current doc
                var svgDoc = app.open(fileRef);
                if (svgDoc.pageItems.length > 0) {
                    // Select all and copy
                    svgDoc.selectObjectsOnActiveArtboard();
                    app.executeMenuCommand('copy');
                    svgDoc.close(SaveOptions.DONOTSAVECHANGES);
                    // Paste into original doc
                    app.activeDocument = doc;
                    app.executeMenuCommand('paste');
                } else {
                    svgDoc.close(SaveOptions.DONOTSAVECHANGES);
                }
            } else if (ext === 'ai' || ext === 'eps') {
                // For AI files, we might want to place them or open them.
                // The request says "import to current document".
                var placed = doc.placedItems.add();
                placed.file = fileRef;
            } else if (ext === 'pdf') {
                // PDF: open as new document (Illustrator can edit PDF natively)
                app.open(fileRef);
            } else if (ext === 'psd' || ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'tif' || ext === 'tiff') {
                var placed = doc.placedItems.add();
                placed.file = fileRef;
            } else {
                return $.hopeflow.utils.returnError("Unsupported file type: " + ext);
            }

            return $.hopeflow.utils.returnResult("success");
        } catch (e) {
            return $.hopeflow.utils.returnError("Import failed: " + e.message);
        }
    })();
