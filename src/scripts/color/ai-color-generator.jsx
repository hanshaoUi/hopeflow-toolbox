/**
 * AI 色号产生器 - Ink Separator Label Generator
 * 为印刷 CMYK 四原色及专色生成反字色号标签
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var PT = 2.834645; // 1mm in pt

    var cmykMode      = String(args.cmykMode   || 'all');
    var cmykC         = args.cmykC  !== false;
    var cmykM         = args.cmykM  !== false;
    var cmykY         = args.cmykY  !== false;
    var cmykK         = args.cmykK  !== false;
    var labelLang     = String(args.labelLang   || 'both');
    var spotMode      = String(args.spotMode    || 'none');
    var simplify      = args.simplifyPantone    !== false;
    var style         = String(args.style       || 'rect');
    var labelW        = (Number(args.labelWidth)  || 7) * PT;
    var labelH        = (Number(args.labelHeight) || 5) * PT;
    var radius        = (Number(args.cornerRadius)|| 1) * PT;
    var direction     = String(args.direction   || 'h');
    var fontName      = String(args.fontFamily  || 'MicrosoftYaHei');
    var fontSizePt    = (Number(args.fontSize)  || 3) * PT;
    var order         = String(args.order       || 'cmyk-first');
    var placement     = String(args.placement   || 'center');
    var autoSelect    = args.autoSelect         !== false;
    var showInkTotal  = args.showInkTotal       === true;
    var convertOL     = args.convertToOutlines  === true;

    var doc = app.activeDocument;

    // ── 工具函数 ──────────────────────────────────────────────────
    function makeCMYK(c, m, y, k) {
        var col = new CMYKColor();
        col.cyan = c; col.magenta = m; col.yellow = y; col.black = k;
        return col;
    }
    var white = makeCMYK(0, 0, 0, 0);

    function getFont() {
        var names = [fontName, 'MicrosoftYaHei', 'AdobeHeitiStd-Regular', 'Arial'];
        for (var i = 0; i < names.length; i++) {
            try { return app.textFonts.getByName(names[i]); } catch (e) {}
        }
        try { return app.textFonts[0]; } catch (e) { return null; }
    }
    var font = getFont();

    function applyText(tf, content, color) {
        tf.contents = content;
        tf.textRange.characterAttributes.size = fontSizePt;
        tf.textRange.characterAttributes.fillColor = color;
        if (font) tf.textRange.characterAttributes.textFont = font;
    }

    // ── 构建油墨列表 ──────────────────────────────────────────────
    var zhNames = { C: '青色', M: '洋红', Y: '黄色', K: '黑色' };
    function cmykLabel(chan) {
        if (labelLang === 'en') return chan;
        if (labelLang === 'zh') return zhNames[chan];
        return zhNames[chan] + '(' + chan + ')';
    }

    var cmykDefs = [
        { chan: 'C', color: makeCMYK(100,0,0,0), on: cmykC },
        { chan: 'M', color: makeCMYK(0,100,0,0), on: cmykM },
        { chan: 'Y', color: makeCMYK(0,0,100,0), on: cmykY },
        { chan: 'K', color: makeCMYK(0,0,0,100), on: cmykK }
    ];

    var cmykInks = [], spotInks = [], i, j;

    if (cmykMode !== 'none') {
        for (i = 0; i < cmykDefs.length; i++) {
            if (cmykMode === 'all' || cmykDefs[i].on) {
                cmykInks.push({ name: cmykLabel(cmykDefs[i].chan), color: cmykDefs[i].color });
            }
        }
    }

    if (spotMode === 'all') {
        var swatches = doc.swatches;
        for (i = 0; i < swatches.length; i++) {
            try {
                var sw = swatches[i];
                if (sw.color.typename !== 'SpotColor') continue;
                var nm = sw.color.spot.name;
                if (simplify && nm.indexOf('PANTONE ') === 0) nm = nm.substring(8);
                spotInks.push({ name: nm, color: sw.color });
            } catch (e) {}
        }
    }

    var inks = order === 'cmyk-first'
        ? cmykInks.concat(spotInks)
        : spotInks.concat(cmykInks);

    if (inks.length === 0) {
        return $.hopeflow.utils.returnError('没有选择任何油墨，请至少选择一种颜色模式');
    }

    // ── 创建图层和主分组 ─────────────────────────────────────────
    var layerName = '色号标签';
    var layer;
    try { layer = doc.layers.getByName(layerName); }
    catch (e) { layer = doc.layers.add(); layer.name = layerName; }

    var master = layer.groupItems.add();
    master.name = '色号';

    var GAP = 3; // pt 标签间距
    var curX = 0, curY = 0;
    var isH = direction === 'h';

    // ── 绘制每个标签 ─────────────────────────────────────────────
    for (i = 0; i < inks.length; i++) {
        var ink  = inks[i];
        var grp  = master.groupItems.add();

        if (style === 'text') {
            // 纯文字，用油墨颜色
            var tf0 = grp.textFrames.add();
            applyText(tf0, ink.name, ink.color);
            tf0.left = curX;
            tf0.top  = curY;
            if (isH) curX += tf0.width  + GAP;
            else      curY -= tf0.height + GAP;

        } else if (style === 'circle') {
            // 圆形反字
            var D = labelW; // 直径
            var circ = grp.pathItems.ellipse(curY, curX, D, D);
            circ.filled = true; circ.fillColor = ink.color; circ.stroked = false;
            var tf1 = grp.textFrames.add();
            applyText(tf1, ink.name, white);
            tf1.left = curX + (D - tf1.width)  / 2;
            tf1.top  = curY - (D - tf1.height) / 2;
            if (isH) curX += D + GAP;
            else      curY -= D + GAP;

        } else {
            // 方块反字（圆角 / 直角由 radius 控制）
            var rect;
            if (radius > 0) {
                rect = grp.pathItems.roundedRectangle(curY, curX, labelW, labelH, radius, radius);
            } else {
                rect = grp.pathItems.rectangle(curY, curX, labelW, labelH);
            }
            rect.filled = true; rect.fillColor = ink.color; rect.stroked = false;
            var tf2 = grp.textFrames.add();
            applyText(tf2, ink.name, white);
            tf2.left = curX + (labelW - tf2.width)  / 2;
            tf2.top  = curY - (labelH - tf2.height) / 2;
            if (isH) curX += labelW + GAP;
            else      curY -= labelH + GAP;
        }
    }

    // ── 附加油墨总数 ──────────────────────────────────────────────
    if (showInkTotal) {
        var totalTf = master.textFrames.add();
        totalTf.contents = '共 ' + inks.length + ' 色';
        totalTf.textRange.characterAttributes.size = fontSizePt * 0.8;
        totalTf.textRange.characterAttributes.fillColor = makeCMYK(0, 0, 0, 50);
        if (font) totalTf.textRange.characterAttributes.textFont = font;
        if (isH) { totalTf.left = curX; totalTf.top = curY; }
        else      { totalTf.left = curX + 2; totalTf.top = curY - 2; }
    }

    // ── 定位 ──────────────────────────────────────────────────────
    var ab     = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var abRect = ab.artboardRect; // [left, top, right, bottom], top > bottom
    var gb     = master.geometricBounds; // [left, top, right, bottom]
    var gw     = gb[2] - gb[0];
    var gh     = gb[1] - gb[3];

    if (placement === 'center') {
        var cx = (abRect[0] + abRect[2]) / 2;
        var cy = (abRect[1] + abRect[3]) / 2;
        master.left = cx - gw / 2;
        master.top  = cy + gh / 2;
    } else if (placement === 'topleft') {
        master.left = abRect[0] + 10;
        master.top  = abRect[1] - 10;
    }
    // manual: 保持在文档原点，用户手动移动

    // ── 转曲 ──────────────────────────────────────────────────────
    if (convertOL) {
        try { master.createOutline(); } catch (e) {}
    }

    // ── 选取 ──────────────────────────────────────────────────────
    if (autoSelect) {
        doc.selection = null;
        master.selected = true;
    }

    return $.hopeflow.utils.returnResult({
        count: inks.length,
        message: '已生成 ' + inks.length + ' 个色号标签'
    });
})();