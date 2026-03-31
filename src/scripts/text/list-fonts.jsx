/**
 * Return all installed Illustrator text font names.
 */
(function () {
    if (!$.hopeflow) return;

    try {
        var seen = {};
        var names = [];
        var fonts = app.textFonts;

        for (var i = 0; i < fonts.length; i++) {
            var n = String(fonts[i].name || '');
            if (n && !seen[n]) {
                seen[n] = true;
                names.push(n);
            }
        }

        names.sort();
        return $.hopeflow.utils.returnResult({
            fonts: names,
            total: names.length
        });
    } catch (e) {
        return $.hopeflow.utils.returnError('读取字体库失败: ' + String(e));
    }
})();
