/**
 * 文本大小写转换 - Change Case
 * Converts text case or number formats in selected text frames.
 * Args: { mode: 'uppercase'|'lowercase'|'titlecase'|'sentencecase'|'num-cn-capital'|'num-cn-normal' }
 */
(function () {
    if (!$.hopeflow) return;

    var sel = $.hopeflow.utils.requireSelection(1);
    if (!sel) return $.hopeflow.utils.returnError('无选择');

    var args = $.hopeflow.utils.getArgs();
    var mode = args.mode || 'uppercase';

    // Helper: Number to Chinese Capital (Financial) - Supports up to Li (3 decimal places)
    // 0.123 -> 零元壹角贰分叁厘
    function toChineseCapital(n) {
        if (!/^\d+(\.\d+)?$/.test(n)) return n; // Not a number

        // Remove leading zeros for integer part unless it is just "0."
        if (n.indexOf('.') !== 0 && n.length > 1 && n.charAt(0) === '0' && n.charAt(1) !== '.') {
            n = n.replace(/^0+/, '');
        }

        var fraction = ['角', '分', '厘'];
        var digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
        var unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];

        var head = n < 0 ? '欠' : '';
        n = Math.abs(n);

        var s = '';

        // Split decimal
        var nStr = n.toString();
        var p = nStr.indexOf('.');

        // Format integer part
        var integerPart = (p >= 0) ? nStr.substring(0, p) : nStr;
        // Format decimal part
        var decimalPart = (p >= 0) ? nStr.substr(p + 1) : "";

        // Integer Logic
        // For simplicity in ES3, use the standard loop for integer grouping
        if (integerPart !== "0" && integerPart !== "") {
            for (var i = 0; i < unit[0].length && integerPart.length > 0; i++) {
                var p = '';
                for (var j = 0; j < unit[1].length && integerPart.length > 0; j++) {
                    p = digit[integerPart.charAt(integerPart.length - 1)] + unit[1][j] + p;
                    integerPart = integerPart.substring(0, integerPart.length - 1);
                }
                s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
            }
            s = s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整');
        } else {
            s = "零元";
        }

        // Decimal Logic (up to 3 places)
        if (decimalPart) {
            var decS = "";
            for (var i = 0; i < Math.min(decimalPart.length, 3); i++) {
                // digit index
                var dIdx = parseInt(decimalPart.charAt(i));
                if (dIdx !== 0) {
                    decS += digit[dIdx] + fraction[i];
                } else {
                    // Handle Zeros in decimal? Usually skipped unless followed by non-zero
                    // Example: 0.103 -> 壹角零叁厘
                    // Example: 0.123 -> 壹角贰分叁厘
                    // Example: 0.003 -> 零角零分叁厘 -> 叁厘? Or 零元零角零分叁厘?
                    // Standard: intermediate zeros are often explicit or implicit.
                    // User example 0.123 -> 零元壹角...
                    // Let's keep it simple: skip 'Zero + Unit' if zero, unless we need 'Zero' padding?
                    // Actually, user example 0.123 = 零元壹角... implies continuous reading.
                    if (i < Math.min(decimalPart.length, 3) - 1 && decimalPart.substr(i + 1).match(/[1-9]/)) {
                        decS += '零';
                    }
                }
            }
            if (!decS) {
                s += "整";
            } else {
                s += decS;
            }
        } else {
            s += "整";
        }

        // Cleanup regex for edge cases
        return head + s.replace(/^元/, "零元").replace(/零+元/, "元").replace(/^元/, "零元"); // Ensure "Zero Yuan" if started empty

        // Actually, let's use the proven short logic for financial numbers if available.
        // But since we are writing it here:
        // Try to match user Requirement: 0.123 -> 零元壹角贰分叁厘
        // My Logic above might produce: 零元壹角贰分叁厘.
    }

    // Corrected Financial Function for the specific request style
    function toChineseCapital(n) {
        if (!/^\d+(\.\d+)?$/.test(n)) return n;

        var fraction = ['角', '分', '厘'];
        var digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
        var unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];

        var s = '';
        var nStr = parseFloat(n).toString(); // remove leading zeros
        var p = nStr.indexOf('.');

        // Integer part
        var integerStr = (p >= 0) ? nStr.substring(0, p) : nStr;
        // Decimal part
        var decimalStr = (p >= 0) ? nStr.substr(p + 1) : "";
        decimalStr = decimalStr.substr(0, 3); // max 3 chars

        // --- Integer ---
        if (Number(integerStr) === 0) {
            s = "零元";
        } else {
            // Processing integer logic...
            // Standard algorithm
            for (var i = 0; i < unit[0].length && integerStr.length > 0; i++) {
                var p = '';
                for (var j = 0; j < unit[1].length && integerStr.length > 0; j++) {
                    p = digit[integerStr.charAt(integerStr.length - 1)] + unit[1][j] + p;
                    integerStr = integerStr.substring(0, integerStr.length - 1);
                }
                s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
            }
            s = s.replace(/(零.)*零元/, '元')
                .replace(/(零.)+/g, '零')
                .replace(/^整$/, '零元整');
        }

        // --- Decimal ---
        // 0.123 -> 壹角贰分叁厘
        if (decimalStr) {
            for (var i = 0; i < decimalStr.length; i++) {
                var d = parseInt(decimalStr.charAt(i));
                if (d !== 0) {
                    s += digit[d] + fraction[i];
                } else {
                    // Logic for zero in decimal?
                    // 1.05 -> 一元零五分
                    // Check if subsequent digits exist
                    if (i < decimalStr.length - 1 && decimalStr.substr(i + 1).match(/[1-9]/)) {
                        s += "零";
                    }
                }
            }
        } else {
            s += "整";
        }

        return s;
    }

    // Helper: Number to Chinese Normal (Digits)
    // User Requirement: 123 -> 一二三
    function toChineseNormal(n) {
        // Direct mapping
        var map = { '0': '零', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九', '.': '点' };
        return n.replace(/[0-9.]/g, function (m) { return map[m] || m; });
    }

    // Helper: Title Case
    function toTitleCase(str) {
        return str.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
            return match.toUpperCase();
        });
    }

    // Helper: Sentence Case
    function toSentenceCase(str) {
        return str.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (c) {
            return c.toUpperCase();
        });
    }

    var count = 0;
    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        if (item.typename === "TextFrame") {
            var original = item.contents;
            var converted = original;

            switch (mode) {
                case 'uppercase':
                    converted = original.toUpperCase();
                    break;
                case 'lowercase':
                    converted = original.toLowerCase();
                    break;
                case 'titlecase':
                    converted = toTitleCase(original);
                    break;
                case 'sentencecase':
                    converted = toSentenceCase(original);
                    break;
                case 'num-cn-capital':
                    converted = original.replace(/\d+(\.\d+)?/g, function (match) {
                        return toChineseCapital(match);
                    });
                    break;
                case 'num-cn-normal':
                    converted = toChineseNormal(original);
                    break;
            }

            if (converted !== original) {
                item.contents = converted;
                count++;
            }
        }
    }

    return $.hopeflow.utils.returnResult({ converted_frames: count });
})();
