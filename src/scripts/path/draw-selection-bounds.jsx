/**
 * 绘制选区边界 (Draw Selection Bounds)
 * Ported from Christian Condamine's limSel_2 (dialog removed, params via panel).
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var mode = String(args.mode || 'all');
    var anchorMm = parseFloat(args.anchorSize); if (isNaN(anchorMm) || anchorMm <= 0) anchorMm = 2;
    var colorName = String(args.color || 'orange');

    if (app.documents.length === 0) return $.hopeflow.utils.returnError('请先打开文档');
    var doc = app.activeDocument;
    var sel = doc.selection;
    if (!sel || sel.length === 0) return $.hopeflow.utils.returnError('请先选择对象');

    var COLORS = {
        orange: [236, 103, 27],
        purple: [156, 82, 154],
        green:  [103, 179, 48],
        blue:   [110, 199, 217],
        white:  [255, 255, 255],
        black:  [29, 29, 29]
    };
    var rgb = COLORS[colorName] || COLORS.orange;
    var color = new RGBColor(); color.red = rgb[0]; color.green = rgb[1]; color.blue = rgb[2];
    var whiteColor = new RGBColor(); whiteColor.red = 255; whiteColor.green = 255; whiteColor.blue = 255;

    var coeff = 2.834645;
    var dimAncres = anchorMm * coeff;
    var epTraits = dimAncres / 10;
    var point = dimAncres / 3;

    var vCalque = null;
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === 'limitesSelection') { vCalque = doc.layers[i]; break; }
    }
    if (!vCalque) {
        vCalque = doc.layers.add();
        vCalque.name = 'limitesSelection';
    }
    doc.activeLayer = vCalque;

    function drawRect(b) {
        var r = vCalque.pathItems.add();
        r.setEntirePath([[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]],[b[0],b[1]]]);
        r.closed = true; r.filled = false; r.stroked = true;
        r.strokeWidth = epTraits; r.strokeColor = color;
    }
    function drawSquare(x, y, hollow) {
        var s = vCalque.pathItems.add();
        var h = dimAncres / 2;
        s.setEntirePath([[x-h,y+h],[x-h,y-h],[x+h,y-h],[x+h,y+h],[x-h,y+h]]);
        s.closed = true; s.filled = true;
        if (hollow) {
            s.stroked = true; s.strokeWidth = epTraits;
            s.strokeColor = color; s.fillColor = whiteColor;
        } else {
            s.stroked = false; s.fillColor = color;
        }
    }
    function drawDot(x, y) {
        var d = doc.pathItems.ellipse(y + point, x - point, point * 2, point * 2);
        d.stroked = false; d.filled = true; d.fillColor = color;
        d.move(vCalque, ElementPlacement.PLACEATEND);
    }
    function drawCenter(b) {
        var Lx = (b[2]-b[0])/2 - point;
        var Hy = (b[3]-b[1])/2 + point;
        var c = vCalque.pathItems.add();
        c.setEntirePath([[b[0]+Lx,b[1]+Hy],[b[0]+Lx,b[3]-Hy],[b[2]-Lx,b[3]-Hy],[b[2]-Lx,b[1]+Hy]]);
        c.closed = true; c.filled = true; c.stroked = false; c.fillColor = color;
    }
    function drawOutline(item) {
        if (item.typename === 'PathItem') {
            var c = item.duplicate(vCalque, ElementPlacement.PLACEATEND);
            c.filled = false; c.stroked = true; c.strokeWidth = epTraits; c.strokeColor = color;
        } else if (item.typename === 'CompoundPathItem') {
            var cc = item.duplicate(vCalque, ElementPlacement.PLACEATEND);
            for (var i = 0; i < cc.pathItems.length; i++) {
                cc.pathItems[i].filled = false; cc.pathItems[i].stroked = true;
                cc.pathItems[i].strokeWidth = epTraits; cc.pathItems[i].strokeColor = color;
            }
        } else if (item.typename === 'GroupItem') {
            for (var k = 0; k < item.pageItems.length; k++) drawOutline(item.pageItems[k]);
        }
    }
    function drawAnchorsAndHandles(item) {
        if (item.typename === 'GroupItem') {
            for (var g = 0; g < item.pageItems.length; g++) drawAnchorsAndHandles(item.pageItems[g]);
            return;
        }
        if (item.typename === 'CompoundPathItem') {
            for (var cp = 0; cp < item.pathItems.length; cp++) drawAnchorsAndHandles(item.pathItems[cp]);
            return;
        }
        if (item.typename !== 'PathItem') return;
        var pts = item.pathPoints;
        for (var p = 0; p < pts.length; p++) {
            var r = doc.pathItems.rectangle(pts[p].anchor[1] + point, pts[p].anchor[0] - point, point*2, point*2);
            r.stroked = false; r.filled = true; r.fillColor = color;
            r.move(vCalque, ElementPlacement.PLACEATEND);
            if (pts[p].leftDirection[0] !== pts[p].anchor[0] || pts[p].leftDirection[1] !== pts[p].anchor[1]) {
                var l = doc.pathItems.add();
                l.setEntirePath([pts[p].leftDirection, pts[p].anchor]);
                l.stroked = true; l.strokeWidth = epTraits; l.strokeColor = color;
                l.move(vCalque, ElementPlacement.PLACEATEND);
                drawDot(pts[p].leftDirection[0], pts[p].leftDirection[1]);
            }
            if (pts[p].rightDirection[0] !== pts[p].anchor[0] || pts[p].rightDirection[1] !== pts[p].anchor[1]) {
                var rd = doc.pathItems.add();
                rd.setEntirePath([pts[p].rightDirection, pts[p].anchor]);
                rd.stroked = true; rd.strokeWidth = epTraits; rd.strokeColor = color;
                rd.move(vCalque, ElementPlacement.PLACEATEND);
                drawDot(pts[p].rightDirection[0], pts[p].rightDirection[1]);
            }
        }
    }
    function drawBaseline(t) {
        var topT = t.top, leftT = t.left;
        var diff = t.top - t.anchor[1];
        var line = vCalque.pathItems.add();
        line.setEntirePath([[leftT, topT-diff], [leftT + t.width, topT-diff]]);
        line.filled = false; line.stroked = true;
        line.strokeWidth = epTraits; line.strokeColor = color;
        var s = vCalque.pathItems.add();
        s.setEntirePath([
            [leftT, topT-diff+point],
            [leftT, topT-diff-point],
            [leftT+point*2, topT-diff-point],
            [leftT+point*2, topT-diff+point],
            [leftT, topT-diff+point]
        ]);
        s.filled = true; s.stroked = false; s.fillColor = color;
    }

    try {
        for (var si = 0; si < sel.length; si++) {
            var item = sel[si];
            var b = item.visibleBounds;
            switch (item.typename) {
                case 'PathItem':
                case 'CompoundPathItem':
                    drawCenter(b); drawOutline(item);
                    if (mode === 'each') drawAnchorsAndHandles(item);
                    break;
                case 'GroupItem':
                    for (var g = 0; g < item.pageItems.length; g++) {
                        drawOutline(item.pageItems[g]);
                        drawCenter(item.pageItems[g].visibleBounds);
                        if (mode === 'each') drawAnchorsAndHandles(item.pageItems[g]);
                    }
                    break;
                case 'TextFrame':
                    drawBaseline(item);
                    break;
            }
        }

        if (mode === 'all') {
            var L = Infinity, T = -Infinity, R = -Infinity, B = Infinity;
            for (var k = 0; k < sel.length; k++) {
                var vb = sel[k].visibleBounds;
                if (vb[0] < L) L = vb[0];
                if (vb[1] > T) T = vb[1];
                if (vb[2] > R) R = vb[2];
                if (vb[3] < B) B = vb[3];
            }
            var bx = [L, T, R, B];
            drawRect(bx);
            var grips = [
                [bx[0], bx[1]], [bx[0], bx[3]], [bx[2], bx[1]], [bx[2], bx[3]],
                [(bx[0]+bx[2])/2, bx[1]], [(bx[0]+bx[2])/2, bx[3]],
                [bx[0], (bx[1]+bx[3])/2], [bx[2], (bx[1]+bx[3])/2]
            ];
            for (var gi = 0; gi < grips.length; gi++) drawSquare(grips[gi][0], grips[gi][1], true);
        }

        return $.hopeflow.utils.returnResult({
            message: '已绘制 ' + sel.length + ' 个对象的选区边界',
            mode: mode
        });
    } catch (err) {
        return $.hopeflow.utils.returnError('绘制失败：' + (err.message || err));
    }
})();
