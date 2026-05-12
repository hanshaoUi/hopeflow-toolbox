/**
 * AI 色号产生器 - Color Swatch Generator
 * 从选中对象提取唯一颜色，生成标准色号参考卡
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var CONFIG = {
        colorMode:     String(args.colorMode     || 'all'),
        swatchSize:    Number(args.swatchSize)    || 30,
        labelFontSize: Number(args.labelFontSize) || 7,
        columns:       Number(args.columns)       || 5,
        gap:           Number(args.gap)           || 6,
        placement:     String(args.placement      || 'right'),
        includeFill:   args.includeFill   !== false,
        includeStroke: args.includeStroke === true,
        showBorder:    args.showBorder    === true
    };

    var FONTS = ['AdobeHeitiStd-Regular', 'MyriadPro-Regular', 'Arial', 'MicrosoftYaHei', 'PingFangSC-Regular'];
    var _font = null;

    function getSafeFont() {
        if (_font) return _font;
        for (var i = 0; i < FONTS.length; i++) {
            try { _font = app.textFonts.getByName(FONTS[i]); return _font; } catch (e) {}
        }
        try { _font = app.textFonts[0]; } catch (e) {}
        return _font;
    }

    var doc = app.activeDocument;
    var sel = doc.selection;
    if (!sel || sel.length === 0) {
        return $.hopeflow.utils.returnError('请先选中对象');
    }

    // 1. 收集唯一颜色
    var colorList = [];
    var seen = {};

    function colorKey(colorObj) {
        var tn = colorObj.typename;
        if (tn === 'CMYKColor') {
            return 'cmyk:' + Math.round(colorObj.cyan) + ',' + Math.round(colorObj.magenta) + ',' +
                   Math.round(colorObj.yellow) + ',' + Math.round(colorObj.black);
        }
        if (tn === 'RGBColor') {
            return 'rgb:' + Math.round(colorObj.red) + ',' + Math.round(colorObj.green) + ',' + Math.round(colorObj.blue);
        }
        if (tn === 'SpotColor') {
            return 'spot:' + colorObj.spot.name + ':' + Math.round(colorObj.tint);
        }
        if (tn === 'GrayColor') {
            return 'gray:' + Math.round(colorObj.gray);
        }
        return null;
    }

    function addColor(colorObj) {
        if (!colorObj) return;
        var k = colorKey(colorObj);
        if (!k || seen[k]) return;
        seen[k] = true;
        colorList.push({ color: colorObj, typename: colorObj.typename });
    }

    function traverseItem(item) {
        var tn = item.typename;
        var i;
        if (tn === 'GroupItem') {
            for (i = 0; i < item.pageItems.length; i++) traverseItem(item.pageItems[i]);
            return;
        }
        if (tn === 'CompoundPathItem') {
            for (i = 0; i < item.pathItems.length; i++) traverseItem(item.pathItems[i]);
            return;
        }
        if (CONFIG.includeFill && item.filled)   addColor(item.fillColor);
        if (CONFIG.includeStroke && item.stroked) addColor(item.strokeColor);
    }

    var i;
    for (i = 0; i < sel.length; i++) traverseItem(sel[i]);

    if (colorList.length === 0) {
        return $.hopeflow.utils.returnError('选中对象中未找到有效颜色');
    }

    // 2. 颜色转换工具
    function cmykToRGB(c, m, y, k) {
        return {
            r: Math.round(255 * (1 - c / 100) * (1 - k / 100)),
            g: Math.round(255 * (1 - m / 100) * (1 - k / 100)),
            b: Math.round(255 * (1 - y / 100) * (1 - k / 100))
        };
    }

    function rgbToCMYK(r, g, b) {
        var r1 = r / 255, g1 = g / 255, b1 = b / 255;
        var k1 = 1 - Math.max(r1, Math.max(g1, b1));
        if (k1 >= 1) return { c: 0, m: 0, y: 0, k: 100 };
        return {
            c: Math.round((1 - r1 - k1) / (1 - k1) * 100),
            m: Math.round((1 - g1 - k1) / (1 - k1) * 100),
            y: Math.round((1 - b1 - k1) / (1 - k1) * 100),
            k: Math.round(k1 * 100)
        };
    }

    function toHex2(n) {
        var h = Math.max(0, Math.min(255, Math.round(n))).toString(16);
        return h.length < 2 ? '0' + h : h;
    }
    function rgbToHex(r, g, b) { return '#' + toHex2(r) + toHex2(g) + toHex2(b); }

    function buildLabels(entry) {
        var lines = [];
        var tn = entry.typename;
        var c  = entry.color;
        var mode = CONFIG.colorMode;

        if (tn === 'SpotColor') {
            lines.push(c.spot.name);
            if (Math.round(c.tint) !== 100) lines.push('色调 ' + Math.round(c.tint) + '%');
            return lines;
        }
        if (tn === 'GrayColor') {
            lines.push('Gray ' + Math.round(c.gray) + '%');
            return lines;
        }

        var cmyk, rgb;
        if (tn === 'CMYKColor') {
            cmyk = { c: Math.round(c.cyan), m: Math.round(c.magenta), y: Math.round(c.yellow), k: Math.round(c.black) };
            rgb  = cmykToRGB(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
        } else {
            rgb  = { r: Math.round(c.red), g: Math.round(c.green), b: Math.round(c.blue) };
            cmyk = rgbToCMYK(rgb.r, rgb.g, rgb.b);
        }
        var hex = rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();

        if (mode === 'cmyk' || mode === 'all') {
            lines.push('C' + cmyk.c + '  M' + cmyk.m + '  Y' + cmyk.y + '  K' + cmyk.k);
        }
        if (mode === 'rgb' || mode === 'all') {
            lines.push('R' + rgb.r + '  G' + rgb.g + '  B' + rgb.b);
        }
        if (mode === 'hex' || mode === 'all') {
            lines.push(hex);
        }
        return lines;
    }

    // 3. 布局计算
    var ss    = CONFIG.swatchSize;
    var gap   = CONFIG.gap;
    var cols  = Math.max(1, CONFIG.columns);
    var fz    = CONFIG.labelFontSize;
    var lineH = fz * 1.5;

    var maxLines = CONFIG.colorMode === 'all' ? 3 : 1;
    var cardH    = ss + gap + maxLines * lineH;

    var ab     = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var abRect = ab.artboardRect;

    var rows = Math.ceil(colorList.length / cols);
    var startX, startY;
    var placement = CONFIG.placement;

    if (placement === 'right') {
        startX = abRect[2] + 20;
        startY = abRect[1];
    } else if (placement === 'left') {
        var totalW = Math.min(cols, colorList.length) * (ss + gap) - gap;
        startX = abRect[0] - 20 - totalW;
        startY = abRect[1];
    } else if (placement === 'above') {
        startX = abRect[0];
        startY = abRect[1] + rows * (cardH + gap) + 20;
    } else {
        startX = abRect[0];
        startY = abRect[3] - 20;
    }

    // 4. 创建图层和分组
    var layerName = '色号参考';
    var layer;
    try {
        layer = doc.layers.getByName(layerName);
    } catch (e) {
        layer = doc.layers.add();
        layer.name = layerName;
    }

    var masterGroup = layer.groupItems.add();
    masterGroup.name = '色号';

    var font = getSafeFont();

    function makeCMYKColor(c, m, y, k) {
        var col = new CMYKColor();
        col.cyan = c; col.magenta = m; col.yellow = y; col.black = k;
        return col;
    }

    var labelColor  = makeCMYKColor(0, 0, 0, 80);
    var borderColor = makeCMYKColor(0, 0, 0, 20);

    // 5. 绘制色卡
    for (i = 0; i < colorList.length; i++) {
        var col  = i % cols;
        var row  = Math.floor(i / cols);

        var x = startX + col * (ss + gap);
        var y = startY - row * (cardH + gap);

        var entry     = colorList[i];
        var cardGroup = masterGroup.groupItems.add();

        var rect = cardGroup.pathItems.rectangle(y, x, ss, ss);
        rect.filled    = true;
        rect.fillColor = entry.color;
        rect.stroked   = CONFIG.showBorder;
        if (CONFIG.showBorder) {
            rect.strokeColor = borderColor;
            rect.strokeWidth = 0.5;
        }

        var labels = buildLabels(entry);
        var j;
        for (j = 0; j < labels.length; j++) {
            var tf = cardGroup.textFrames.add();
            tf.contents = labels[j];
            tf.left = x;
            tf.top  = y - ss - gap - j * lineH;
            tf.textRange.characterAttributes.size = fz;
            tf.textRange.characterAttributes.fillColor = labelColor;
            if (font) tf.textRange.characterAttributes.textFont = font;
        }
    }

    return $.hopeflow.utils.returnResult({
        count: colorList.length,
        message: '已生成 ' + colorList.length + ' 个色号'
    });
})();