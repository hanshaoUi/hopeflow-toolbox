/**
 * 读取当前文档色板 - List Swatches
 * Returns supported swatches with preview colors for panel suggestions.
 */
(function () {
    if (!$.hopeflow) return;

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('当前没有打开的文档');
        }

        var doc = app.activeDocument;
        var swatches = [];
        var seen = {};

        function isSupportedColor(color) {
            if (!color || !color.typename) return false;
            return color.typename === 'RGBColor'
                || color.typename === 'CMYKColor'
                || color.typename === 'GrayColor'
                || color.typename === 'SpotColor';
        }

        function clamp(value, min, max) {
            if (value < min) return min;
            if (value > max) return max;
            return value;
        }

        function toHex(value) {
            var rounded = Math.round(clamp(value, 0, 255));
            var hex = rounded.toString(16);
            return hex.length < 2 ? '0' + hex : hex;
        }

        function rgbHex(r, g, b) {
            return '#' + toHex(r) + toHex(g) + toHex(b);
        }

        function cmykToHex(c, m, y, k) {
            var cyan = clamp(c, 0, 100) / 100;
            var magenta = clamp(m, 0, 100) / 100;
            var yellow = clamp(y, 0, 100) / 100;
            var black = clamp(k, 0, 100) / 100;
            var r = 255 * (1 - cyan) * (1 - black);
            var g = 255 * (1 - magenta) * (1 - black);
            var b = 255 * (1 - yellow) * (1 - black);
            return rgbHex(r, g, b);
        }

        function describeColor(color) {
            if (!color || !color.typename) return null;

            if (color.typename === 'RGBColor') {
                return {
                    preview: rgbHex(color.red, color.green, color.blue),
                    detail: 'RGB(' + Math.round(color.red) + ', ' + Math.round(color.green) + ', ' + Math.round(color.blue) + ')'
                };
            }

            if (color.typename === 'CMYKColor') {
                return {
                    preview: cmykToHex(color.cyan, color.magenta, color.yellow, color.black),
                    detail: 'CMYK('
                        + Math.round(color.cyan) + ', '
                        + Math.round(color.magenta) + ', '
                        + Math.round(color.yellow) + ', '
                        + Math.round(color.black) + ')'
                };
            }

            if (color.typename === 'GrayColor') {
                var v = 255 * (1 - clamp(color.gray, 0, 100) / 100);
                return {
                    preview: rgbHex(v, v, v),
                    detail: 'Gray(' + Math.round(color.gray) + '%)'
                };
            }

            if (color.typename === 'SpotColor') {
                var spotInfo = describeColor(color.spot && color.spot.color ? color.spot.color : null);
                if (!spotInfo) return null;
                return {
                    preview: spotInfo.preview,
                    detail: 'Spot: ' + String(color.spot.name || '') + (color.tint !== undefined ? ' / Tint ' + Math.round(color.tint) + '%' : '')
                };
            }

            return null;
        }

        for (var i = 0; i < doc.swatches.length; i++) {
            var swatch = doc.swatches[i];
            var name = String(swatch.name || '').replace(/^\s+|\s+$/g, '');
            var info = isSupportedColor(swatch.color) ? describeColor(swatch.color) : null;
            if (!name || seen[name] || !info) continue;
            seen[name] = true;
            swatches.push({
                name: name,
                preview: info.preview,
                detail: info.detail
            });
        }

        return $.hopeflow.utils.returnResult({
            swatches: swatches,
            total: swatches.length
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(String(e.message || e));
    }
})();
