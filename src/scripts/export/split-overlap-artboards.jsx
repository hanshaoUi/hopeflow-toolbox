/**
 * Split artboard into fixed-size overlapping tiles.
 *
 * Modes:
 * - preview: draw preview rectangles and return tile info
 * - create: create split artboards
 * - clear-preview: remove preview layer
 * - clear-generated: remove old generated artboards
 */

if (!$.hopeflow) {
    return JSON.stringify({ success: false, error: 'runtime not loaded' });
}

var args = $.hopeflow.utils.getArgs();
var mode = args.mode || 'preview';
var PREVIEW_LAYER_NAME = '__hf_split_preview__';
var GENERATED_MARKER = '[HF-SPLIT]';
var EPSILON = 0.01;

if (!app.documents.length) {
    return $.hopeflow.utils.returnError('请先打开一个文档');
}

var doc = app.activeDocument;
var artboardIndex = doc.artboards.getActiveArtboardIndex();
var artboard = doc.artboards[artboardIndex];
var artboardRect = artboard.artboardRect;

function parseNumber(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
}

function makeRgb(r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
}

function pad(num, length) {
    var str = '' + num;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function formatDim(value) {
    if (Math.abs(value - Math.round(value)) < 0.01) {
        return Math.round(value);
    }
    return parseFloat(value.toFixed(2));
}

function getUnitConversion(sizeUnit) {
    var unitConversions = {
        'pt': 1,
        'px': 1,
        'mm': 0.352778,
        'cm': 0.0352778,
        'in': 0.0138889
    };
    return unitConversions[sizeUnit] || unitConversions.mm;
}

function getPreviewLayer(docRef) {
    try {
        var layer = docRef.layers.getByName(PREVIEW_LAYER_NAME);
        layer.locked = false;
        layer.visible = true;
        return layer;
    } catch (e) {
        var created = docRef.layers.add();
        created.name = PREVIEW_LAYER_NAME;
        return created;
    }
}

function clearPreviewLayer(docRef) {
    try {
        var layer = docRef.layers.getByName(PREVIEW_LAYER_NAME);
        layer.locked = false;
        layer.remove();
    } catch (e) {}
}

function isGeneratedArtboard(artboardRef) {
    return String(artboardRef.name || '').indexOf(GENERATED_MARKER) >= 0;
}

function getSafeActiveArtboardIndex(docRef) {
    for (var i = 0; i < docRef.artboards.length; i++) {
        if (!isGeneratedArtboard(docRef.artboards[i])) {
            return i;
        }
    }
    return -1;
}

function removeGeneratedArtboards(docRef) {
    var removed = 0;
    var safeIndex = getSafeActiveArtboardIndex(docRef);

    if (safeIndex >= 0) {
        try {
            docRef.artboards.setActiveArtboardIndex(safeIndex);
        } catch (e) {}
    }

    for (var i = docRef.artboards.length - 1; i >= 0; i--) {
        var ab = docRef.artboards[i];
        if (isGeneratedArtboard(ab)) {
            if (docRef.artboards.length <= 1) break;
            docRef.artboards.remove(i);
            removed++;
        }
    }
    return removed;
}

function removeGeneratedArtboardsInRange(docRef, startIndex, endIndex) {
    var removed = 0;
    var safeIndex = getSafeActiveArtboardIndex(docRef);

    if (safeIndex >= 0) {
        try {
            docRef.artboards.setActiveArtboardIndex(safeIndex);
        } catch (e) {}
    }

    var maxIndex = Math.min(endIndex, docRef.artboards.length - 1);
    for (var i = maxIndex; i >= startIndex; i--) {
        var ab = docRef.artboards[i];
        if (isGeneratedArtboard(ab)) {
            if (docRef.artboards.length <= 1) break;
            docRef.artboards.remove(i);
            removed++;
        }
    }
    return removed;
}

function removeArtboardsByIndices(docRef, indicesToRemove, preferredActiveIndex) {
    var removed = 0;
    if (!indicesToRemove || !indicesToRemove.length) return removed;

    if (typeof preferredActiveIndex === 'number' && preferredActiveIndex >= 0 && preferredActiveIndex < docRef.artboards.length) {
        try {
            docRef.artboards.setActiveArtboardIndex(preferredActiveIndex);
        } catch (e) {}
    }

    for (var i = 0; i < indicesToRemove.length; i++) {
        var index = indicesToRemove[i];
        if (index < 0 || index >= docRef.artboards.length) continue;
        if (docRef.artboards.length <= 1) break;
        docRef.artboards.remove(index);
        removed++;
    }

    return removed;
}

function computeSegments(totalLengthPt, tileSizePt, overlapPt) {
    var stepPt = tileSizePt - overlapPt;
    if (tileSizePt <= 0) throw new Error('单片尺寸必须大于 0');
    if (overlapPt < 0) throw new Error('搭接不能小于 0');
    if (stepPt <= 0) throw new Error('搭接必须小于单片尺寸');

    var starts = [0];
    if (tileSizePt + EPSILON < totalLengthPt) {
        while (true) {
            var nextStart = starts[starts.length - 1] + stepPt;
            if (nextStart >= totalLengthPt - EPSILON) {
                break;
            }
            starts.push(nextStart);
            if (starts.length > 1000) {
                throw new Error('分片数量异常，请检查参数设置');
            }
        }
    }

    var segments = [];
    for (var i = 0; i < starts.length; i++) {
        var start = starts[i];
        var end = Math.min(totalLengthPt, start + tileSizePt);
        var prevEnd = i > 0 ? Math.min(totalLengthPt, starts[i - 1] + tileSizePt) : start;
        var nextStart2 = i < starts.length - 1 ? starts[i + 1] : end;
        segments.push({
            index: i,
            start: start,
            end: end,
            width: end - start,
            overlapLeft: i > 0 ? Math.max(0, prevEnd - start) : 0,
            overlapRight: i < starts.length - 1 ? Math.max(0, end - nextStart2) : 0
        });
    }

    return {
        stepPt: stepPt,
        segments: segments
    };
}

function buildRects(baseRect, segment, direction, paddingPt) {
    var left = baseRect[0];
    var top = baseRect[1];
    var right = baseRect[2];
    var bottom = baseRect[3];

    if (direction === 'horizontal') {
        var segTop = top - segment.start;
        var segBottom = top - segment.end;
        return {
            contentRect: [left, segTop, right, segBottom],
            artboardRect: [left - paddingPt, segTop + paddingPt, right + paddingPt, segBottom - paddingPt]
        };
    }

    var segLeft = left + segment.start;
    var segRight = left + segment.end;
    return {
        contentRect: [segLeft, top, segRight, bottom],
        artboardRect: [segLeft - paddingPt, top + paddingPt, segRight + paddingPt, bottom - paddingPt]
    };
}

function drawRect(layer, rect, strokeColor, strokeWidth, fillColor, opacity) {
    var width = rect[2] - rect[0];
    var height = rect[1] - rect[3];
    var item = layer.pathItems.rectangle(rect[1], rect[0], width, height);
    item.stroked = true;
    item.strokeColor = strokeColor;
    item.strokeWidth = strokeWidth;
    if (fillColor) {
        item.filled = true;
        item.fillColor = fillColor;
        if (typeof opacity === 'number') {
            item.opacity = opacity;
        }
    } else {
        item.filled = false;
    }
    return item;
}

function drawLabel(layer, artRect, text) {
    try {
        var frame = layer.textFrames.pointText([artRect[0] + $.hopeflow.utils.mmToPt(3), artRect[1] - $.hopeflow.utils.mmToPt(4)]);
        frame.contents = text;
        frame.textRange.characterAttributes.size = 8;
        frame.textRange.fillColor = makeRgb(255, 136, 0);
        return frame;
    } catch (e) {
        return null;
    }
}

function drawPreview(previewData, direction, paddingPt) {
    clearPreviewLayer(doc);
    var layer = getPreviewLayer(doc);
    var outerColor = makeRgb(255, 136, 0);
    var innerColor = makeRgb(0, 204, 102);
    var overlapFill = makeRgb(255, 204, 0);

    for (var i = 0; i < previewData.rawSegments.length; i++) {
        var segment = previewData.rawSegments[i];
        var rects = buildRects(artboardRect, segment, direction, paddingPt);
        drawRect(layer, rects.artboardRect, outerColor, 1, null);
        drawRect(layer, rects.contentRect, innerColor, 1, null);

        if (segment.overlapLeft > EPSILON) {
            var overlapRect;
            if (direction === 'horizontal') {
                overlapRect = [
                    rects.contentRect[0],
                    rects.contentRect[1],
                    rects.contentRect[2],
                    rects.contentRect[1] - segment.overlapLeft
                ];
            } else {
                overlapRect = [
                    rects.contentRect[0],
                    rects.contentRect[1],
                    rects.contentRect[0] + segment.overlapLeft,
                    rects.contentRect[3]
                ];
            }
            drawRect(layer, overlapRect, overlapFill, 0.5, overlapFill, 25);
        }

        drawLabel(
            layer,
            rects.artboardRect,
            'S' + ('0' + (segment.index + 1)).slice(-2) + '  ' +
            (Math.round($.hopeflow.utils.ptToMm(segment.width) * 10) / 10) + 'mm'
        );
    }

    layer.locked = true;
    app.redraw();
}

function getBaseName() {
    var raw = String(artboard.name || doc.name || 'Artboard');
    return raw.replace(/\s*\[HF-SPLIT.*$/i, '').replace(/\.(ai|eps|pdf)$/i, '');
}

function buildPreviewData(direction, tileSizeMm, overlapMm, bleedMm, marginMm) {
    var scaleRatio = parseNumber(args.scale, 1);
    if (scaleRatio <= 0) {
        throw new Error('比例必须大于 0');
    }

    var tileSizeDocMm = tileSizeMm / scaleRatio;
    var overlapDocMm = overlapMm / scaleRatio;
    var bleedDocMm = bleedMm / scaleRatio;
    var marginDocMm = marginMm / scaleRatio;

    var tileSizePt = $.hopeflow.utils.mmToPt(tileSizeDocMm);
    var overlapPt = $.hopeflow.utils.mmToPt(overlapDocMm);
    var bleedPt = $.hopeflow.utils.mmToPt(bleedDocMm);
    var marginPt = $.hopeflow.utils.mmToPt(marginDocMm);
    var paddingPt = bleedPt + marginPt;

    var totalLengthPt = direction === 'horizontal'
        ? (artboardRect[1] - artboardRect[3])
        : (artboardRect[2] - artboardRect[0]);
    var totalCrossPt = direction === 'horizontal'
        ? (artboardRect[2] - artboardRect[0])
        : (artboardRect[1] - artboardRect[3]);

    var computed = computeSegments(totalLengthPt, tileSizePt, overlapPt);
    var baseName = getBaseName();
    var namePattern = args.namePattern || (baseName + ' ' + GENERATED_MARKER + ' #');
    var prefix = args.prefix || '';
    var suffix = args.suffix || '';
    var startNum = args.startNum !== undefined ? parseInt(args.startNum, 10) : 1;
    if (isNaN(startNum)) startNum = 1;
    var includeSize = (args.includeSize === true || args.includeSize === 'true');
    var sizeUnit = args.sizeUnit || 'mm';
    var sizeConversion = getUnitConversion(sizeUnit);
    var rawSegments = computed.segments;
    var segments = [];

    for (var i = 0; i < rawSegments.length; i++) {
        var segment = rawSegments[i];
        var segmentRects = buildRects(artboardRect, segment, direction, paddingPt);
        var artboardWidthPt = Math.abs(segmentRects.artboardRect[2] - segmentRects.artboardRect[0]);
        var artboardHeightPt = Math.abs(segmentRects.artboardRect[1] - segmentRects.artboardRect[3]);
        var sequence = startNum + i;
        var pattern = namePattern.replace('#', pad(sequence, 2));
        var nameParts = [];

        if (prefix) nameParts.push(prefix);
        nameParts.push(pattern);
        if (includeSize) {
            nameParts.push(
                formatDim(artboardWidthPt * sizeConversion * scaleRatio) + 'x' +
                formatDim(artboardHeightPt * sizeConversion * scaleRatio) + sizeUnit
            );
        }
        if (suffix) nameParts.push(suffix);

        segments.push({
            index: segment.index + 1,
            name: nameParts.join('-'),
            startMM: Math.round($.hopeflow.utils.ptToMm(segment.start) * scaleRatio * 10) / 10,
            endMM: Math.round($.hopeflow.utils.ptToMm(segment.end) * scaleRatio * 10) / 10,
            widthMM: Math.round($.hopeflow.utils.ptToMm(segment.width) * scaleRatio * 10) / 10,
            overlapLeftMM: Math.round($.hopeflow.utils.ptToMm(segment.overlapLeft) * scaleRatio * 10) / 10,
            overlapRightMM: Math.round($.hopeflow.utils.ptToMm(segment.overlapRight) * scaleRatio * 10) / 10
        });
    }

    var lastTilePt = rawSegments.length > 0 ? rawSegments[rawSegments.length - 1].width : 0;

    return {
        sourceName: baseName,
        direction: direction,
        scaleRatio: scaleRatio,
        tileCount: segments.length,
        stepMM: Math.round($.hopeflow.utils.ptToMm(computed.stepPt) * scaleRatio * 10) / 10,
        tileSizeMM: Math.round($.hopeflow.utils.ptToMm(tileSizePt) * scaleRatio * 10) / 10,
        overlapMM: Math.round($.hopeflow.utils.ptToMm(overlapPt) * scaleRatio * 10) / 10,
        bleedMM: Math.round($.hopeflow.utils.ptToMm(bleedPt) * scaleRatio * 10) / 10,
        marginMM: Math.round($.hopeflow.utils.ptToMm(marginPt) * scaleRatio * 10) / 10,
        artboardDocWidthMM: Math.round($.hopeflow.utils.ptToMm(artboardRect[2] - artboardRect[0]) * 10) / 10,
        artboardDocHeightMM: Math.round($.hopeflow.utils.ptToMm(artboardRect[1] - artboardRect[3]) * 10) / 10,
        artboardWidthMM: Math.round($.hopeflow.utils.ptToMm(artboardRect[2] - artboardRect[0]) * scaleRatio * 10) / 10,
        artboardHeightMM: Math.round($.hopeflow.utils.ptToMm(artboardRect[1] - artboardRect[3]) * scaleRatio * 10) / 10,
        outputDocWidthMM: Math.round($.hopeflow.utils.ptToMm((direction === 'horizontal' ? totalCrossPt : tileSizePt) + paddingPt * 2) * 10) / 10,
        outputDocHeightMM: Math.round($.hopeflow.utils.ptToMm((direction === 'horizontal' ? tileSizePt : totalCrossPt) + paddingPt * 2) * 10) / 10,
        outputWidthMM: Math.round($.hopeflow.utils.ptToMm((direction === 'horizontal' ? totalCrossPt : tileSizePt) + paddingPt * 2) * scaleRatio * 10) / 10,
        outputHeightMM: Math.round($.hopeflow.utils.ptToMm((direction === 'horizontal' ? tileSizePt : totalCrossPt) + paddingPt * 2) * scaleRatio * 10) / 10,
        lastTileDocWidthMM: Math.round($.hopeflow.utils.ptToMm(lastTilePt) * 10) / 10,
        lastTileWidthMM: Math.round($.hopeflow.utils.ptToMm(lastTilePt) * scaleRatio * 10) / 10,
        paddingPt: paddingPt,
        rawSegments: rawSegments,
        segments: segments
    };
}

if (mode === 'clear-preview') {
    clearPreviewLayer(doc);
    return $.hopeflow.utils.returnResult({ cleared: true });
}

if (mode === 'clear-generated') {
    clearPreviewLayer(doc);
    return $.hopeflow.utils.returnResult({
        removed: removeGeneratedArtboards(doc)
    });
}

var direction = args.direction === 'horizontal' ? 'horizontal' : 'vertical';
var tileSizeMm = parseNumber(args.tileSize, 0);
var overlapMm = parseNumber(args.overlap, 0);
var bleedMm = parseNumber(args.bleed, 0);
var marginMm = parseNumber(args.margin, 0);

if (tileSizeMm <= 0) return $.hopeflow.utils.returnError('单片尺寸必须大于 0');
if (overlapMm < 0) return $.hopeflow.utils.returnError('搭接不能小于 0');
if (overlapMm >= tileSizeMm) return $.hopeflow.utils.returnError('搭接必须小于单片尺寸');
if (bleedMm < 0 || marginMm < 0) return $.hopeflow.utils.returnError('出血和留白不能小于 0');
if (parseNumber(args.scale, 1) <= 0) return $.hopeflow.utils.returnError('比例必须大于 0');

var previewData = buildPreviewData(direction, tileSizeMm, overlapMm, bleedMm, marginMm);

if (mode === 'preview') {
    drawPreview(previewData, direction, previewData.paddingPt);
    return $.hopeflow.utils.returnResult(previewData);
}

if (mode === 'create') {
    clearPreviewLayer(doc);

    var removedCount = 0;
    var clearGeneratedAfter = (args.clearGenerated === true || args.clearGenerated === 'true');
    var originalArtboardCount = doc.artboards.length;
    var createdNames = [];
    for (var s = 0; s < previewData.rawSegments.length; s++) {
        var rawSegment = previewData.rawSegments[s];
        var rects = buildRects(artboardRect, rawSegment, direction, previewData.paddingPt);
        var created = doc.artboards.add(rects.artboardRect);
        created.name = previewData.segments[s].name;
        createdNames.push(created.name);
    }

    if (clearGeneratedAfter) {
        var indicesToRemove = [];
        for (var i = originalArtboardCount - 1; i >= 0; i--) {
            if (i === artboardIndex || isGeneratedArtboard(doc.artboards[i])) {
                indicesToRemove.push(i);
            }
        }
        removedCount = removeArtboardsByIndices(doc, indicesToRemove, originalArtboardCount);
    }

    app.redraw();
    return $.hopeflow.utils.returnResult({
        created: createdNames.length,
        removed: removedCount,
        names: createdNames,
        tileCount: previewData.tileCount
    });
}

return $.hopeflow.utils.returnError('未知模式: ' + mode);
