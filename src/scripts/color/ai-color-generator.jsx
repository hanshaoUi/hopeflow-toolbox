/**
 * AI 色号产生器
 * @description 为印刷 CMYK 四原色及文档专色生成反字色号标签，支持横竖排、圆角/圆形样式、自动编组和转曲。
 * Generates reverse color labels for process inks and document spot colors.
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var MM = 2.834645669;
    var GAP = 1.2 * MM;

    function boolArg(name, fallback) {
        if (typeof args[name] === 'undefined') return fallback;
        return args[name] === true || args[name] === 'true';
    }

    function strArg(name, fallback) {
        if (typeof args[name] === 'undefined' || args[name] === null || args[name] === '') return fallback;
        return String(args[name]);
    }

    function numArg(name, fallback, min) {
        var n = Number(args[name]);
        if (isNaN(n)) n = fallback;
        if (typeof min === 'number' && n < min) n = min;
        return n;
    }

    if (!app.documents.length) {
        return $.hopeflow.utils.returnError('请先打开一个 Illustrator 文档');
    }

    var doc = app.activeDocument;
    var config = {
        cmykMode: strArg('cmykMode', 'all'),
        cmykC: boolArg('cmykC', true),
        cmykM: boolArg('cmykM', true),
        cmykY: boolArg('cmykY', true),
        cmykK: boolArg('cmykK', true),
        labelLang: strArg('labelLang', 'both'),
        spotMode: strArg('spotMode', 'all'),
        spotNames: strArg('spotNames', ''),
        simplifyPantone: boolArg('simplifyPantone', true),
        style: strArg('style', 'rect'),
        labelWidth: numArg('labelWidth', 12, 1) * MM,
        labelHeight: numArg('labelHeight', 5, 1) * MM,
        cornerRadius: numArg('cornerRadius', 1, 0) * MM,
        direction: strArg('direction', 'h'),
        fontFamily: strArg('fontFamily', 'MicrosoftYaHei'),
        fontSize: numArg('fontSize', 3, 0.5) * MM,
        order: strArg('order', 'cmyk-first'),
        placement: strArg('placement', 'center'),
        autoSelect: boolArg('autoSelect', true),
        groupItems: boolArg('groupItems', true),
        showInkTotal: boolArg('showInkTotal', false),
        convertToOutlines: boolArg('convertToOutlines', false)
    };

    function cmyk(c, m, y, k) {
        var color = new CMYKColor();
        color.cyan = c;
        color.magenta = m;
        color.yellow = y;
        color.black = k;
        return color;
    }

    var WHITE = cmyk(0, 0, 0, 0);
    var GRAY = cmyk(0, 0, 0, 60);
    var fallbackFont = null;

    function getFont() {
        if (fallbackFont) return fallbackFont;
        var candidates = [
            config.fontFamily,
            'MicrosoftYaHei',
            'Microsoft YaHei',
            'AdobeHeitiStd-Regular',
            'PingFangSC-Regular',
            'ArialMT',
            'Arial'
        ];
        for (var i = 0; i < candidates.length; i++) {
            try {
                fallbackFont = app.textFonts.getByName(candidates[i]);
                return fallbackFont;
            } catch (e) {}
        }
        try {
            fallbackFont = app.textFonts[0];
            return fallbackFont;
        } catch (ex) {
            return null;
        }
    }

    function processName(channel) {
        var zh = { C: '青色', M: '洋红', Y: '黄色', K: '黑色' };
        if (config.labelLang === 'en') return channel;
        if (config.labelLang === 'zh') return zh[channel];
        return zh[channel] + '(' + channel + ')';
    }

    function simplifySpotName(name) {
        if (!config.simplifyPantone) return name;
        var n = trimText(name);
        n = n.replace(/^PANTONE\+?\s+/i, '');
        n = n.replace(/\s+([CUM])$/i, '$1');
        return n;
    }

    function trimText(value) {
        return String(value || '').replace(/^\s+|\s+$/g, '');
    }

    function normalizeName(value) {
        return trimText(value).toLowerCase().replace(/^pantone\s+/i, '').replace(/\s+/g, ' ');
    }

    function isRegistrationColorName(name) {
        var normalized = normalizeName(name).replace(/[\[\]【】]/g, '');
        return normalized === 'registration' ||
            normalized === '套版色' ||
            normalized === 'all' ||
            normalized === '全部';
    }

    function splitNames(value) {
        var names = [];
        var parts = String(value || '').split(/[\n\r,;，；]+/);
        for (var i = 0; i < parts.length; i++) {
            var name = trimText(parts[i]);
            if (name) names.push(name);
        }
        return names;
    }

    function fallbackSpotCmyk(name, index) {
        var lower = String(name || '').toLowerCase();
        if (lower.indexOf('red') >= 0 || lower.indexOf('红') >= 0 || lower.indexOf('186') >= 0) return cmyk(0, 100, 100, 0);
        if (lower.indexOf('blue') >= 0 || lower.indexOf('青') >= 0) return cmyk(100, 0, 0, 0);
        if (lower.indexOf('green') >= 0 || lower.indexOf('绿') >= 0 || lower.indexOf('355') >= 0) return cmyk(100, 0, 100, 0);
        if (lower.indexOf('purple') >= 0 || lower.indexOf('紫') >= 0) return cmyk(50, 100, 0, 0);
        if (lower.indexOf('black') >= 0 || lower.indexOf('黑') >= 0) return cmyk(0, 0, 0, 100);
        var palette = [
            cmyk(100, 0, 0, 0),
            cmyk(0, 100, 0, 0),
            cmyk(0, 0, 100, 0),
            cmyk(0, 0, 0, 100),
            cmyk(0, 60, 100, 0),
            cmyk(70, 0, 100, 0)
        ];
        return palette[index % palette.length];
    }

    function createSpotColor(name, baseColor) {
        var spot;
        try {
            spot = doc.spots.getByName(name);
        } catch (e) {
            spot = doc.spots.add();
            spot.name = name;
            spot.colorType = ColorModel.SPOT;
            spot.color = baseColor;
        }
        var spotColor = new SpotColor();
        spotColor.spot = spot;
        spotColor.tint = 100;
        return spotColor;
    }

    function buildSpotMap() {
        var list = [];
        var map = {};
        var seen = {};
        for (var i = 0; i < doc.swatches.length; i++) {
            try {
                var swatchColor = doc.swatches[i].color;
                if (!swatchColor || swatchColor.typename !== 'SpotColor') continue;
                var originalName = swatchColor.spot.name;
                if (isRegistrationColorName(originalName)) continue;
                if (seen[originalName]) continue;
                seen[originalName] = true;
                var item = {
                    name: simplifySpotName(originalName),
                    originalName: originalName,
                    color: swatchColor,
                    fallback: false
                };
                list.push(item);
                map[normalizeName(originalName)] = item;
                map[normalizeName(item.name)] = item;
                map[normalizeName('PANTONE ' + item.name)] = item;
            } catch (e) {}
        }
        return { list: list, map: map };
    }

    function collectProcessInks() {
        if (config.cmykMode === 'none') return [];
        var defs = [
            { ch: 'C', color: cmyk(100, 0, 0, 0), on: config.cmykC },
            { ch: 'M', color: cmyk(0, 100, 0, 0), on: config.cmykM },
            { ch: 'Y', color: cmyk(0, 0, 100, 0), on: config.cmykY },
            { ch: 'K', color: cmyk(0, 0, 0, 100), on: config.cmykK }
        ];
        var out = [];
        for (var i = 0; i < defs.length; i++) {
            if (config.cmykMode === 'all' || defs[i].on) {
                out.push({ name: processName(defs[i].ch), color: defs[i].color });
            }
        }
        return out;
    }

    function collectSpotInks() {
        if (config.spotMode !== 'all') return [];
        return buildSpotMap().list;
    }

    function collectCustomSpotInks() {
        if (config.spotMode !== 'custom') return [];
        var requested = splitNames(config.spotNames);
        var data = buildSpotMap();
        var out = [];
        var used = {};
        for (var i = 0; i < requested.length; i++) {
            var displayName = requested[i];
            var found = data.map[normalizeName(displayName)];
            var key = normalizeName(found ? found.originalName : displayName);
            if (used[key]) continue;
            used[key] = true;
            if (found) {
                out.push(found);
            } else {
                out.push({
                    name: simplifySpotName(displayName),
                    originalName: displayName,
                    color: createSpotColor(displayName, fallbackSpotCmyk(displayName, i)),
                    fallback: true
                });
            }
        }
        return out;
    }

    function setTextStyle(tf, fillColor) {
        tf.textRange.characterAttributes.size = config.fontSize;
        tf.textRange.characterAttributes.fillColor = fillColor;
        try { tf.textRange.characterAttributes.horizontalScale = 100; } catch (scaleError) {}
        try { tf.textRange.characterAttributes.verticalScale = 100; } catch (vScaleError) {}
        var font = getFont();
        if (font) tf.textRange.characterAttributes.textFont = font;
    }

    function addCenteredText(group, text, color, left, top, width, height) {
        var tf = doc.textFrames.add();
        tf.contents = text;
        setTextStyle(tf, color);
        fitTextToBox(tf, width, height);
        tf.left = left + (width - tf.width) / 2;
        tf.top = top - (height - tf.height) / 2;
        tf.moveToBeginning(group);
        return tf;
    }

    function fitTextToBox(tf, width, height) {
        var padX = Math.min(1.1 * MM, width * 0.18);
        var padY = Math.min(0.7 * MM, height * 0.2);
        var maxW = Math.max(1, width - padX * 2);
        var maxH = Math.max(1, height - padY * 2);
        var size = config.fontSize;
        var minSize = Math.max(2.2, Math.min(config.fontSize, height * 0.42));

        while ((tf.width > maxW || tf.height > maxH) && size > minSize) {
            size -= 0.35;
            if (size < minSize) size = minSize;
            tf.textRange.characterAttributes.size = size;
        }

        if (tf.width > maxW) {
            var hScale = Math.floor((maxW / tf.width) * 100);
            if (hScale < 42) hScale = 42;
            try { tf.textRange.characterAttributes.horizontalScale = hScale; } catch (e) {}
        }

        if (tf.height > maxH) {
            var vScale = Math.floor((maxH / tf.height) * 100);
            if (vScale < 70) vScale = 70;
            try { tf.textRange.characterAttributes.verticalScale = vScale; } catch (ex) {}
        }
    }

    function addLabel(parent, ink, left, top) {
        var group = parent.groupItems.add();
        group.name = ink.name;

        if (config.style === 'text') {
            var tf = doc.textFrames.add();
            tf.contents = ink.name;
            setTextStyle(tf, ink.color);
            tf.left = left;
            tf.top = top;
            tf.moveToBeginning(group);
            return {
                group: group,
                width: tf.width,
                height: tf.height
            };
        }

        if (config.style === 'circle') {
            var diameter = Math.max(config.labelWidth, config.labelHeight);
            var circle = doc.pathItems.ellipse(top, left, diameter, diameter);
            circle.filled = true;
            circle.fillColor = ink.color;
            circle.stroked = false;
            circle.moveToBeginning(group);
            addCenteredText(group, ink.name, WHITE, left, top, diameter, diameter);
            return {
                group: group,
                width: diameter,
                height: diameter
            };
        }

        var rect;
        if (config.cornerRadius > 0) {
            rect = doc.pathItems.roundedRectangle(top, left, config.labelWidth, config.labelHeight, config.cornerRadius, config.cornerRadius);
        } else {
            rect = doc.pathItems.rectangle(top, left, config.labelWidth, config.labelHeight);
        }
        rect.filled = true;
        rect.fillColor = ink.color;
        rect.stroked = false;
        rect.moveToBeginning(group);
        addCenteredText(group, ink.name, WHITE, left, top, config.labelWidth, config.labelHeight);
        return {
            group: group,
            width: config.labelWidth,
            height: config.labelHeight
        };
    }

    function outlineTexts(item) {
        try {
            if (item.typename === 'TextFrame') {
                item.createOutline();
                return;
            }
            if (item.textFrames) {
                for (var i = item.textFrames.length - 1; i >= 0; i--) {
                    try { item.textFrames[i].createOutline(); } catch (e) {}
                }
            }
            if (item.groupItems) {
                for (var j = 0; j < item.groupItems.length; j++) {
                    outlineTexts(item.groupItems[j]);
                }
            }
        } catch (ex) {}
    }

    try {
        var processInks = collectProcessInks();
        var spotInks = config.spotMode === 'custom' ? collectCustomSpotInks() : collectSpotInks();
        var inks = config.order === 'spot-first'
            ? spotInks.concat(processInks)
            : processInks.concat(spotInks);

        if (inks.length === 0) {
            return $.hopeflow.utils.returnError('没有选择任何油墨，或当前文档没有专色色板');
        }

        var layer = $.hopeflow.utils.getOrCreateLayer('色号标签');
        layer.locked = false;
        layer.visible = true;
        doc.activeLayer = layer;

        var master = layer.groupItems.add();
        master.name = 'AI 色号产生器';

        var x = 0;
        var y = 0;
        var horizontal = config.direction !== 'v';
        for (var i = 0; i < inks.length; i++) {
            var label = addLabel(master, inks[i], x, y);
            if (horizontal) {
                x += label.width + GAP;
            } else {
                y -= label.height + GAP;
            }
        }

        if (config.showInkTotal) {
            var total = doc.textFrames.add();
            total.contents = '共 ' + inks.length + ' 色';
            total.textRange.characterAttributes.size = config.fontSize * 0.8;
            total.textRange.characterAttributes.fillColor = GRAY;
            var totalFont = getFont();
            if (totalFont) total.textRange.characterAttributes.textFont = totalFont;
            total.left = horizontal ? x : 0;
            total.top = horizontal ? 0 : y - GAP;
            total.moveToBeginning(master);
        }

        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var bounds = master.geometricBounds;
        var width = bounds[2] - bounds[0];
        var height = bounds[1] - bounds[3];
        var pad = 10 * MM;

        if (config.placement === 'center') {
            master.left = (ab[0] + ab[2]) / 2 - width / 2;
            master.top = (ab[1] + ab[3]) / 2 + height / 2;
        } else if (config.placement === 'topleft') {
            master.left = ab[0] + pad;
            master.top = ab[1] - pad;
        }

        if (config.convertToOutlines) {
            outlineTexts(master);
        }

        if (!config.groupItems) {
            try { master.ungroup(); } catch (ungroupError) {}
        }

        if (config.autoSelect) {
            doc.selection = null;
            try { master.selected = true; } catch (selectError) {}
        }

        var fallbackCount = 0;
        for (var f = 0; f < spotInks.length; f++) {
            if (spotInks[f].fallback) fallbackCount++;
        }

        app.redraw();
        return $.hopeflow.utils.returnResult({
            count: inks.length,
            processCount: processInks.length,
            spotCount: spotInks.length,
            fallbackSpotCount: fallbackCount,
            message: '已生成 ' + inks.length + ' 个色号标签' + (fallbackCount ? '，并创建 ' + fallbackCount + ' 个临时专色色板' : '')
        });
    } catch (e) {
        return $.hopeflow.utils.returnError('AI 色号产生器运行失败: ' + (e.message || e) + (e.line ? ' (Line: ' + e.line + ')' : ''));
    }
})();
