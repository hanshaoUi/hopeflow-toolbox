/**
 * 文本格式整理 - Format Text
 * 12 toggleable formatting rules: punctuation width, quote conversion,
 * CJK-Western spacing, whitespace cleanup, etc.
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();

    function toBool(v) {
        return v === true || v === 'true';
    }

    // Read flags
    var punctToHalf            = toBool(args.punctToHalf);
    var punctToFull            = toBool(args.punctToFull);
    var numLetterToHalf        = toBool(args.numLetterToHalf);
    var quoteToCJK             = toBool(args.quoteToCJK);
    var quoteToWestern         = toBool(args.quoteToWestern);
    var spaceAfterHalfPunct    = toBool(args.spaceAfterHalfPunct);
    var spaceCJKWestern        = toBool(args.spaceCJKWestern);
    var removeSpaceBeforePunct = toBool(args.removeSpaceBeforePunct);
    var mergeSpaces            = toBool(args.mergeSpaces);
    var trimLineWhitespace     = toBool(args.trimLineWhitespace);
    var mergeEmptyLines        = toBool(args.mergeEmptyLines);
    var removeAllSpaces        = toBool(args.removeAllSpaces);

    // Check if any rule is enabled
    var anyEnabled = punctToHalf || punctToFull || numLetterToHalf ||
        quoteToCJK || quoteToWestern || spaceAfterHalfPunct ||
        spaceCJKWestern || removeSpaceBeforePunct || mergeSpaces ||
        trimLineWhitespace || mergeEmptyLines || removeAllSpaces;

    if (!anyEnabled) {
        return $.hopeflow.utils.returnError('请至少开启一项格式化规则');
    }

    // --- Fullwidth / Halfwidth maps ---
    var fullPunctToHalfMap = {
        '\uFF0C': ',',  // ，
        '\u3002': '.',  // 。
        '\uFF1B': ';',  // ；
        '\uFF1A': ':',  // ：
        '\uFF01': '!',  // ！
        '\uFF1F': '?',  // ？
        '\u3001': ',',  // 、
        '\uFF08': '(',  // （
        '\uFF09': ')',  // ）
        '\u3010': '[',  // 【
        '\u3011': ']',  // 】
        '\u2014': '-',  // —
        '\u2026': '...' // …
    };

    var halfPunctToFullMap = {
        ',': '\uFF0C',
        ';': '\uFF1B',
        ':': '\uFF1A',
        '!': '\uFF01',
        '?': '\uFF1F',
        '(': '\uFF08',
        ')': '\uFF09'
    };
    // Note: '.' handled specially to avoid decimals

    // --- Format a single string ---
    function formatText(text) {
        var s = text;

        // ========== Phase 1: Character width conversion ==========

        // 1. numLetterToHalf: fullwidth digits/letters -> halfwidth
        if (numLetterToHalf) {
            s = s.replace(/[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]/g, function (ch) {
                return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
            });
        }

        // 2. punctToFull takes priority over punctToHalf (mutually exclusive)
        if (punctToFull) {
            // Half-width punctuation -> Full-width
            s = s.replace(/[,;:!?()]/g, function (ch) {
                return halfPunctToFullMap[ch] || ch;
            });
            // Period: exclude decimals (digit.digit)
            s = s.replace(/([^0-9])\.([^0-9])/g, function (m, before, after) {
                return before + '\u3002' + after;
            });
            // Period at start of string
            s = s.replace(/^\.([^0-9])/, function (m, after) {
                return '\u3002' + after;
            });
            // Period at end of string
            s = s.replace(/([^0-9])\.$/, function (m, before) {
                return before + '\u3002';
            });
        } else if (punctToHalf) {
            // Full-width punctuation -> Half-width
            var fullPunctRe = /[\uFF0C\u3002\uFF1B\uFF1A\uFF01\uFF1F\u3001\uFF08\uFF09\u3010\u3011\u2014\u2026]/g;
            s = s.replace(fullPunctRe, function (ch) {
                return fullPunctToHalfMap[ch] || ch;
            });
        }

        // ========== Phase 2: Quote conversion ==========
        // quoteToCJK takes priority over quoteToWestern (mutually exclusive)
        if (quoteToCJK) {
            // Curly/straight double quotes -> corner brackets
            s = s.replace(/[\u201C\u201D\u0022]/g, function (ch) {
                // We need state to alternate open/close
                return ch; // placeholder, handled below
            });
            // Use stateful replacement for double quotes
            s = (function (str) {
                var open = true;
                // Replace curly double quotes
                str = str.replace(/[\u201C\u201D]/g, function () {
                    var r = open ? '\u300C' : '\u300D';
                    open = !open;
                    return r;
                });
                // Replace straight double quotes
                open = true;
                str = str.replace(/\u0022/g, function () {
                    var r = open ? '\u300C' : '\u300D';
                    open = !open;
                    return r;
                });
                return str;
            })(s);
            // Curly/straight single quotes -> double corner brackets
            s = (function (str) {
                var open = true;
                str = str.replace(/[\u2018\u2019]/g, function () {
                    var r = open ? '\u300E' : '\u300F';
                    open = !open;
                    return r;
                });
                open = true;
                str = str.replace(/\u0027/g, function () {
                    var r = open ? '\u300E' : '\u300F';
                    open = !open;
                    return r;
                });
                return str;
            })(s);
        } else if (quoteToWestern) {
            // Corner brackets -> curly quotes
            s = s.replace(/\u300C/g, '\u201C');  // 「 -> "
            s = s.replace(/\u300D/g, '\u201D');  // 」 -> "
            s = s.replace(/\u300E/g, '\u2018');  // 『 -> '
            s = s.replace(/\u300F/g, '\u2019');  // 』 -> '
        }

        // ========== Phase 3: Space cleanup (remove before add) ==========

        // 4. removeAllSpaces: if enabled, skip Phase 4
        if (removeAllSpaces) {
            s = s.replace(/ /g, '');
            // Also remove ideographic space
            s = s.replace(/\u3000/g, '');
        } else {
            // 5. removeSpaceBeforePunct
            if (removeSpaceBeforePunct) {
                s = s.replace(/ +([,.\u3002\uFF0C;;\uFF1B::\uFF1A!!\uFF01??\uFF1F\u3001))\uFF09\]\u3011])/g, '$1');
            }

            // 6. mergeSpaces
            if (mergeSpaces) {
                s = s.replace(/ {2,}/g, ' ');
                s = s.replace(/\u3000{2,}/g, '\u3000');
            }

            // ========== Phase 4: Space insertion ==========

            // 7. spaceAfterHalfPunct
            if (spaceAfterHalfPunct) {
                s = s.replace(/([,;:!?])([^ \r\n,;:!?\u201C\u201D\u2018\u2019\u300C\u300D\u300E\u300F])/g, '$1 $2');
            }

            // 8. spaceCJKWestern
            if (spaceCJKWestern) {
                // CJK followed by Western char
                s = s.replace(/([\u4E00-\u9FFF\u3400-\u4DBF])([A-Za-z0-9])/g, '$1 $2');
                // Western char followed by CJK
                s = s.replace(/([A-Za-z0-9])([\u4E00-\u9FFF\u3400-\u4DBF])/g, '$1 $2');
            }
        }

        // ========== Phase 5: Line-level cleanup ==========

        // 9. trimLineWhitespace
        if (trimLineWhitespace) {
            var lines = s.split('\n');
            for (var i = 0; i < lines.length; i++) {
                // Trim leading and trailing spaces/tabs
                lines[i] = lines[i].replace(/^[\t ]+|[\t ]+$/g, '');
            }
            s = lines.join('\n');
        }

        // 10. mergeEmptyLines
        if (mergeEmptyLines) {
            s = s.replace(/\n{3,}/g, '\n\n');
        }

        return s;
    }

    // --- Collect text frames ---
    function collectTextFrames(items, result) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.typename === 'GroupItem') {
                collectTextFrames(item.pageItems, result);
            } else if (item.typename === 'TextFrame') {
                result.push(item);
            }
        }
    }

    // --- Determine scope ---
    var doc = app.activeDocument;
    var frames = [];

    if (doc.selection && doc.selection.length > 0) {
        collectTextFrames(doc.selection, frames);
    }

    if (frames.length === 0) {
        // Fallback: all text frames in document
        for (var i = 0; i < doc.textFrames.length; i++) {
            frames.push(doc.textFrames[i]);
        }
    }

    if (frames.length === 0) {
        return $.hopeflow.utils.returnError('未找到可处理的文本框');
    }

    // --- Process ---
    var count = 0;
    for (var i = 0; i < frames.length; i++) {
        var original = frames[i].contents;
        var formatted = formatText(original);
        if (formatted !== original) {
            frames[i].contents = formatted;
            count++;
        }
    }

    return $.hopeflow.utils.returnResult({
        processed_frames: frames.length,
        modified_frames: count
    });
})();
