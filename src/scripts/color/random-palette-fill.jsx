/**
 * 随机色卡填充 - Random Palette Fill
 * Fills/strokes selected artwork with random colors from a user supplied palette.
 * Args: {
 *   palette: string,
 *   target?: 'fill'|'stroke'|'both',
 *   includeGroups?: boolean,
 *   seed?: number
 * }
 */
(function () {
    if (!$.hopeflow) return;

    var selection = $.hopeflow.utils.requireSelection(1, '请先选择至少一个对象');
    var args = $.hopeflow.utils.getArgs();
    var paletteInput = args.palette;
    var target = args.target || 'fill';
    var includeGroups = args.includeGroups !== false;
    var seed = Number(args.seed || 0);
    var doc = app.activeDocument;

    if (!paletteInput || String(paletteInput).replace(/\s+/g, '') === '') {
        return $.hopeflow.utils.returnError('请输入至少一个色卡条目');
    }

    function createRandom(seedValue) {
        var state = seedValue && isFinite(seedValue) ? Math.floor(Math.abs(seedValue)) : (new Date()).getTime();
        if (state === 0) state = 1;
        return function () {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    }

    function trim(value) {
        return String(value).replace(/^\s+|\s+$/g, '');
    }

    function cloneColor(color) {
        if (!color || !color.typename) return null;

        if (color.typename === 'RGBColor') {
            return $.hopeflow.utils.rgbColor(color.red, color.green, color.blue);
        }
        if (color.typename === 'CMYKColor') {
            return $.hopeflow.utils.cmykColor(color.cyan, color.magenta, color.yellow, color.black);
        }
        if (color.typename === 'GrayColor') {
            var gray = new GrayColor();
            gray.gray = color.gray;
            return gray;
        }
        if (color.typename === 'SpotColor') {
            var spot = new SpotColor();
            spot.spot = color.spot;
            spot.tint = color.tint;
            return spot;
        }
        return null;
    }

    function parseHex(token) {
        var hex = token.replace(/^#/, '');
        if (/^[0-9a-fA-F]{3}$/.test(hex)) {
            hex = hex.charAt(0) + hex.charAt(0) +
                  hex.charAt(1) + hex.charAt(1) +
                  hex.charAt(2) + hex.charAt(2);
        }
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
        return $.hopeflow.utils.hexToRgb('#' + hex);
    }

    function parseRgb(token) {
        var match = token.match(/^rgb\(\s*([\d.]+)\s*[,，]\s*([\d.]+)\s*[,，]\s*([\d.]+)\s*\)$/i);
        if (!match) return null;
        return $.hopeflow.utils.rgbColor(
            Math.max(0, Math.min(255, Number(match[1]))),
            Math.max(0, Math.min(255, Number(match[2]))),
            Math.max(0, Math.min(255, Number(match[3])))
        );
    }

    function parseCmyk(token) {
        var match = token.match(/^cmyk\(\s*([\d.]+)\s*[,，]\s*([\d.]+)\s*[,，]\s*([\d.]+)\s*[,，]\s*([\d.]+)\s*\)$/i);
        if (!match) return null;
        return $.hopeflow.utils.cmykColor(
            Math.max(0, Math.min(100, Number(match[1]))),
            Math.max(0, Math.min(100, Number(match[2]))),
            Math.max(0, Math.min(100, Number(match[3]))),
            Math.max(0, Math.min(100, Number(match[4])))
        );
    }

    function getColorFromSwatch(name) {
        try {
            var swatch = doc.swatches.getByName(name);
            return cloneColor(swatch.color);
        } catch (e) {
            return null;
        }
    }

    function parsePalette(input) {
        var raw = String(input || '');
        var tokens = [];
        var buffer = '';
        var depth = 0;
        var colors = [];
        var invalid = [];

        function pushToken() {
            var token = trim(buffer);
            if (token) tokens.push(token);
            buffer = '';
        }

        for (var i = 0; i < raw.length; i++) {
            var ch = raw.charAt(i);

            if (ch === '(') {
                depth++;
                buffer += ch;
                continue;
            }

            if (ch === ')') {
                depth = Math.max(0, depth - 1);
                buffer += ch;
                continue;
            }

            if ((ch === '\n' || ch === '\r' || ch === ';' || ch === '；' || ch === ',') && depth === 0) {
                pushToken();
                continue;
            }

            buffer += ch;
        }

        pushToken();

        for (var j = 0; j < tokens.length; j++) {
            var token = trim(tokens[j]);
            if (!token) continue;

            var color = parseHex(token) || parseRgb(token) || parseCmyk(token) || getColorFromSwatch(token);
            if (color) {
                colors.push(color);
            } else {
                invalid.push(token);
            }
        }

        return {
            colors: colors,
            invalid: invalid
        };
    }

    function collectTargets(item, result) {
        if (!item || item.locked || item.hidden) return;

        if (item.typename === 'GroupItem') {
            if (!includeGroups) return;
            for (var i = 0; i < item.pageItems.length; i++) {
                collectTargets(item.pageItems[i], result);
            }
            return;
        }

        if (item.typename === 'CompoundPathItem') {
            if (item.pathItems && item.pathItems.length > 0) {
                result.push(item.pathItems[0]);
            }
            return;
        }

        if (item.typename === 'PathItem') {
            result.push(item);
        }
    }

    function applyColor(item, color) {
        var changed = false;

        if ((target === 'fill' || target === 'both') && item.filled !== undefined) {
            item.filled = true;
            item.fillColor = cloneColor(color) || color;
            changed = true;
        }

        if ((target === 'stroke' || target === 'both') && item.stroked !== undefined) {
            item.stroked = true;
            item.strokeColor = cloneColor(color) || color;
            changed = true;
        }

        return changed;
    }

    var paletteResult = parsePalette(paletteInput);
    if (!paletteResult.colors.length) {
        return $.hopeflow.utils.returnError('没有解析出可用颜色，请输入色板名、#RRGGBB、RGB(...) 或 CMYK(...)');
    }

    var targets = [];
    for (var i = 0; i < selection.length; i++) {
        collectTargets(selection[i], targets);
    }

    if (!targets.length) {
        return $.hopeflow.utils.returnError('当前选区中没有可填充的路径对象');
    }

    var random = createRandom(seed);
    var applied = 0;

    for (var j = 0; j < targets.length; j++) {
        var picked = paletteResult.colors[Math.floor(random() * paletteResult.colors.length)];
        if (applyColor(targets[j], picked)) {
            applied++;
        }
    }

    return $.hopeflow.utils.returnResult({
        applied: applied,
        paletteSize: paletteResult.colors.length,
        invalidEntries: paletteResult.invalid
    });
})();
