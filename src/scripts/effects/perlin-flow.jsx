/**
 * PerlinFlow - panelized Nobu Design script.
 * Args: density, fillGray, opacity, opacityMin, opacityMax, position, offsetX, offsetY,
 *       rotation, rotationMin, rotationMax, scale, scaleMin, scaleMax, scaleMode, seed, includeGroups
 */
(function () {
    if (!$.hopeflow) return;

    function SimplexNoise(r) {
        if (r === undefined) r = Math;
        this.grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
        this.p = [];
        for (var i = 0; i < 256; i++) this.p[i] = Math.floor(r.random() * 256);
        this.perm = [];
        for (var j = 0; j < 512; j++) this.perm[j] = this.p[j & 255];
    }

    SimplexNoise.prototype.dot = function (g, x, y) {
        return g[0] * x + g[1] * y;
    };

    SimplexNoise.prototype.noise = function (xin, yin) {
        var n0, n1, n2;
        var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        var s = (xin + yin) * F2;
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        var t = (i + j) * G2;
        var X0 = i - t;
        var Y0 = j - t;
        var x0 = xin - X0;
        var y0 = yin - Y0;
        var i1 = x0 > y0 ? 1 : 0;
        var j1 = x0 > y0 ? 0 : 1;
        var x1 = x0 - i1 + G2;
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2;
        var y2 = y0 - 1.0 + 2.0 * G2;
        var ii = i & 255;
        var jj = j & 255;
        var gi0 = this.perm[ii + this.perm[jj]] % 12;
        var gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
        var gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        return 70.0 * (n0 + n1 + n2);
    };

    function seededRandom(seed) {
        var state = seed || 1;
        return {
            random: function () {
                var x = Math.sin(state++) * 10000;
                return x - Math.floor(x);
            }
        };
    }

    function num(value, fallback) {
        var n = parseFloat(value);
        return isNaN(n) ? fallback : n;
    }

    function docUnit() {
        return $.hopeflow.utils.getRulerUnitsString() || 'pt';
    }

    function unitToPt(value, fallback) {
        var n = num(value, fallback);
        try {
            return new UnitValue(n, docUnit()).as('pt');
        } catch (e) {
            return n;
        }
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function extractItems(sel, arr, includeGroups) {
        for (var i = 0; i < sel.length; i++) {
            if (includeGroups && sel[i].typename === 'GroupItem') extractItems(sel[i].pageItems, arr, includeGroups);
            else if (!sel[i].locked && !sel[i].hidden) arr.push(sel[i]);
        }
    }

    function getCenter(item) {
        return { x: item.left + item.width / 2, y: item.top - item.height / 2 };
    }

    function getSelectedRect(sel) {
        if (!sel.length) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
        var l = sel[0].left;
        var r = l + sel[0].width;
        var t = sel[0].top;
        var b = t - sel[0].height;
        for (var i = 1; i < sel.length; i++) {
            l = Math.min(l, sel[i].left);
            r = Math.max(r, sel[i].left + sel[i].width);
            t = Math.max(t, sel[i].top);
            b = Math.min(b, sel[i].top - sel[i].height);
        }
        return { left: l, right: r, top: t, bottom: b, width: r - l, height: t - b };
    }

    try {
        var args = $.hopeflow.utils.getArgs();

        if (args.shouldUndo === true || args.shouldUndo === 'true') {
            try { app.undo(); } catch (undoError) {}
        }

        if (args.clearOnly === true || args.clearOnly === 'true') {
            return $.hopeflow.utils.returnResult({
                message: '已清理预览',
                count: 0
            });
        }

        if (app.documents.length < 1) throw new Error('请先打开 Illustrator 文档');
        if (!app.activeDocument.selection || app.activeDocument.selection.length < 1) throw new Error('请先选择要扰动的对象');

        var items = [];
        extractItems(app.activeDocument.selection, items, args.includeGroups === true);
        if (!items.length) throw new Error('选择中没有可处理对象');

        var noise = new SimplexNoise(seededRandom(num(args.seed, 1)));
        var seed = num(args.seed, 1) * 0.137;
        var rect = getSelectedRect(items);
        var fullLength = Math.max(rect.width, rect.height) || 1;
        var density = num(args.density, 5);
        var changed = 0;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var center = getCenter(item);
            var kx = (center.x - rect.left) / fullLength * density;
            var ky = (center.y - rect.bottom) / fullLength * density;
            var raw = noise.noise(seed + kx, seed + ky);
            var val = raw + 1;
            var t = clamp(val / 2, 0, 1);

            if (args.position === true) {
                var offX = raw * unitToPt(args.offsetX, 20);
                var rawY = noise.noise(seed + 50 + kx, seed + 50 + ky);
                var offY = rawY * unitToPt(args.offsetY, 20);
                item.translate(offX, offY);
            }

            if (args.scale === true) {
                var scaleValue = val * ((num(args.scaleMax, 120) - num(args.scaleMin, 80)) / 2) + num(args.scaleMin, 80);
                var mode = String(args.scaleMode || 'uniform');
                item.resize(mode === 'height' ? 100 : scaleValue, mode === 'width' ? 100 : scaleValue, true, true, true, true, 1, Transformation.CENTER);
            }

            if (args.rotation === true) {
                var rot = val * ((num(args.rotationMax, 30) - num(args.rotationMin, -30)) / 2) + num(args.rotationMin, -30);
                item.rotate(rot, true, true, true, true, Transformation.CENTER);
            }

            if (args.fillGray === true && item.typename === 'PathItem') {
                var gray = new RGBColor();
                var grayVal = t * 255;
                gray.red = grayVal;
                gray.green = grayVal;
                gray.blue = grayVal;
                item.fillColor = gray;
                item.filled = true;
            }

            if (args.opacity === true) {
                var oMin = clamp(num(args.opacityMin, 20), 0, 100);
                var oMax = clamp(num(args.opacityMax, 100), 0, 100);
                item.opacity = t * (oMax - oMin) + oMin;
            }

            changed++;
        }

        app.redraw();
        return $.hopeflow.utils.returnResult({
            changed: changed,
            message: (args.preview === true || args.preview === 'true' ? '已预览 ' : '已用 Perlin 噪声处理 ') + changed + ' 个对象'
        });
    } catch (e) {
        return $.hopeflow.utils.returnError(e.message || String(e));
    }
})();
