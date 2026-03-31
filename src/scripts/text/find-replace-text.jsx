/**
 * 查找替换文本 - Find and Replace Text (Batch Mode)
 * Replaces text in matching text frames using multiple rules.
 * Args: { rules: Array<{find:string, replace:string}>, action: 'find'|'replace', scope: 'all'|'one', caseSensitive: bool, wholeWord: bool }
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var rules = args.rules || [];
    if (rules.length === 0 && args.find) {
        rules.push({ find: args.find, replace: args.replace || "" });
    }

    var action = args.action || 'replace'; // 'find' or 'replace'
    // For batch/find-all, scope is implicit (selection or doc), but we keep arg for compatibility
    
    var caseSensitive = args.caseSensitive === true || args.caseSensitive === 'true';
    var wholeWord = args.wholeWord === true || args.wholeWord === 'true';

    if (rules.length === 0) return $.hopeflow.utils.returnError('请输入查找内容');
    if (app.documents.length === 0) return $.hopeflow.utils.returnError('无文档打开');

    // Recursive function to get all text frames from a container (Group, etc.)
    function getAllTextFrames(container) {
        var frames = [];
        try {
            if (container.textFrames) {
                for (var i = 0; i < container.textFrames.length; i++) {
                    frames.push(container.textFrames[i]);
                }
            }
            if (container.groupItems) {
                for (var j = 0; j < container.groupItems.length; j++) {
                    frames = frames.concat(getAllTextFrames(container.groupItems[j]));
                }
            }
        } catch (e) { }
        return frames;
    }

    var searchItems = [];
    var searchScopeName = "";

    if (app.selection.length > 0) {
        // Search within selection
        for (var i = 0; i < app.selection.length; i++) {
            var item = app.selection[i];
            if (item.typename === "TextFrame") {
                searchItems.push(item);
            } else if (item.typename === "GroupItem") {
                searchItems = searchItems.concat(getAllTextFrames(item));
            }
        }
        searchScopeName = "选区";
    } else {
        // Search whole document
        // app.activeDocument.textFrames returns a flattened list of all text frames in the document
        var docFrames = app.activeDocument.textFrames;
        for (var i = 0; i < docFrames.length; i++) {
            searchItems.push(docFrames[i]);
        }
        searchScopeName = "整个文档";
    }

    if (searchItems.length === 0) return $.hopeflow.utils.returnError('未找到文本对象 (' + searchScopeName + ')');

    function isEditable(item) {
        if (item.locked || item.hidden) return false;
        try {
            if (item.layer && (item.layer.locked || !item.layer.visible)) return false;
        } catch(e){}
        return true;
    }

    // Helper: Check for match with options
    function checkMatch(content, findStr, isCaseSensitive, isWholeWord) {
        if (!findStr) return false;
        var text = content;
        var pattern = findStr;
        
        if (!isCaseSensitive) {
            text = text.toLowerCase();
            pattern = pattern.toLowerCase();
        }

        var idx = text.indexOf(pattern);
        if (idx === -1) return false;

        if (isWholeWord) {
            // Simple whole word check (not perfect for all locales but standard for scripts)
            // Check char before and after
            // Logic handled better by Regex in loop, checking existence here
            var boundaryRegex = new RegExp("(?:^|\\s|\\W)" + $.hopeflow.utils.escapeRegExp(pattern) + "(?:$|\\s|\\W)", isCaseSensitive ? "" : "i");
            return boundaryRegex.test(content);
        }
        
        return true;
    }

    // --- Action: FIND (Batch) ---
    if (action === 'find') {
        app.selection = null; 

        var foundCount = 0;
        var itemsToSelect = [];

        for (var i = 0; i < searchItems.length; i++) {
            var tf = searchItems[i];
            if (!isEditable(tf)) continue;

            try {
                var hasMatch = false;
                for (var r = 0; r < rules.length; r++) {
                    if (checkMatch(tf.contents, rules[r].find, caseSensitive, wholeWord)) {
                        hasMatch = true;
                        foundCount++; // Simple count of frames with matches
                        break; // Found a rule that matches, no need to check other rules for THIS frame's selection
                    }
                }

                if (hasMatch) {
                    itemsToSelect.push(tf);
                }
            } catch (e) { }
        }

        for (var k = 0; k < itemsToSelect.length; k++) {
            try { itemsToSelect[k].selected = true; } catch(e){}
        }

        return $.hopeflow.utils.returnResult({ found: foundCount, selected: itemsToSelect.length, scope: searchScopeName });
    }

    // --- Action: REPLACE (Batch) ---
    if (action === 'replace') {
        var totalReplaced = 0;

        for (var i = 0; i < searchItems.length; i++) {
            var tf = searchItems[i];
            if (!isEditable(tf)) continue;

            try {
                for (var r = 0; r < rules.length; r++) {
                    var rule = rules[r];
                    var findStr = rule.find;
                    var replaceStr = rule.replace || "";
                    
                    if (!findStr) continue;

                    // Optimization: Check if present before looping
                    // Note: checkMatch is simple presence check.
                    // For replacement loop, we need exact indices.
                   
                    var content = tf.contents;
                    // We need a loop that finds indices. 
                    // If !caseSensitive, we need to search in lowercase but map to original indices.
                    
                    var searchContent = caseSensitive ? content : content.toLowerCase();
                    var searchFind = caseSensitive ? findStr : findStr.toLowerCase();

                    var idx = searchContent.lastIndexOf(searchFind);

                    while (idx !== -1) {
                        try {
                            // Whole word check if enabled
                            if (wholeWord) {
                                var beforeChar = (idx > 0) ? searchContent.charAt(idx - 1) : " ";
                                var afterChar = (idx + searchFind.length < searchContent.length) ? searchContent.charAt(idx + searchFind.length) : " ";
                                var isBoundary = /[\s\W]/.test(beforeChar) && /[\s\W]/.test(afterChar);
                                if (!isBoundary) {
                                    idx = searchContent.lastIndexOf(searchFind, idx - 1);
                                    continue;
                                }
                            }

                            // Perform replacement
                            for (var k = findStr.length - 1; k > 0; k--) {
                                var charIdx = idx + k;
                                if (charIdx < tf.characters.length) tf.characters[charIdx].remove();
                            }
                            if (idx < tf.characters.length) {
                                if (!replaceStr) tf.characters[idx].remove();
                                else tf.characters[idx].contents = replaceStr;
                            }
                            
                            totalReplaced++;
                            
                            // Re-read content for next iteration
                            // Note: This is expensive but formatting-preserving requires it
                            content = tf.contents;
                            searchContent = caseSensitive ? content : content.toLowerCase();
                            
                            idx = searchContent.lastIndexOf(searchFind, idx - 1);
                        } catch (e) { break; }
                    }
                }
            } catch (e) { }
        }
        return $.hopeflow.utils.returnResult({ replaced_count: totalReplaced, scope: searchScopeName, rule_count: rules.length });
    }
})();
