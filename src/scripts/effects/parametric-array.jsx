/**
 * Parametric Array
 * Grid field + path flow with preview-layer support.
 */
(function () {
    if (!$.hopeflow) return;

    var PREVIEW_LAYER_NAME = '__hf_parametric_array_preview__';

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function toNumber(value, fallback) {
        var parsed = parseFloat(value);
        return isNaN(parsed) ? fallback : parsed;
    }

    function toInt(value, fallback) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? fallback : parsed;
    }

    function makeRng(seed) {
        var state = seed % 2147483647;
        if (state <= 0) state += 2147483646;
        return function () {
            state = state * 16807 % 2147483647;
            return (state - 1) / 2147483646;
        };
    }

    function makeGray(grayValue) {
        var color = new GrayColor();
        color.gray = clamp(grayValue, 0, 100);
        return color;
    }

    function containsItem(items, target) {
        if (!items || !target) return false;
        for (var i = 0; i < items.length; i++) {
            if (items[i] === target) return true;
        }
        return false;
    }

    function getItemsArray(items, excludes) {
        var result = [];
        if (!items) return result;
        for (var i = 0; i < items.length; i++) {
            if (!containsItem(excludes, items[i])) {
                result.push(items[i]);
            }
        }
        return result;
    }

    function getPreviewLayer(doc) {
        try {
            var layer = doc.layers.getByName(PREVIEW_LAYER_NAME);
            layer.locked = false;
            layer.visible = true;
            return layer;
        } catch (e) {
            var created = doc.layers.add();
            created.name = PREVIEW_LAYER_NAME;
            return created;
        }
    }

    function removePreviewLayer(doc) {
        try {
            var layer = doc.layers.getByName(PREVIEW_LAYER_NAME);
            layer.locked = false;
            layer.remove();
        } catch (e) {}
    }

    function getSelectionBounds(items) {
        if (!items || !items.length) return null;
        var bounds = $.hopeflow.utils.getBounds(items);
        if (!bounds || !isFinite(bounds.width) || !isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0) {
            return null;
        }
        return bounds;
    }

    function collectPathItems(item, out) {
        if (!item) return;
        if (item.typename === 'PathItem') {
            out.push(item);
            return;
        }
        if (item.typename === 'CompoundPathItem') {
            for (var i = 0; i < item.pathItems.length; i++) out.push(item.pathItems[i]);
            return;
        }
        if (item.typename === 'GroupItem') {
            for (var j = 0; j < item.pageItems.length; j++) collectPathItems(item.pageItems[j], out);
        }
    }

    function findGuidePath(items, excludes) {
        var paths = [];
        for (var i = 0; i < items.length; i++) {
            if (containsItem(excludes, items[i])) continue;
            collectPathItems(items[i], paths);
        }

        var openPath = null;
        var closedPath = null;
        var longest = 0;
        for (var k = 0; k < paths.length; k++) {
            var path = paths[k];
            try {
                var len = $.hopeflow.utils.getPathLength(path);
                if (!path.closed && len > longest) {
                    openPath = path;
                    longest = len;
                }
                if (path.closed && !closedPath) closedPath = path;
            } catch (e) {}
        }
        return openPath || closedPath || null;
    }

    function getPrototype(selectionItems, itemShape, excludes) {
        if (itemShape !== 'selection') return null;
        if (!selectionItems || !selectionItems.length) {
            throw new Error('元素形状为“选中对象”时，必须先选择至少一个对象');
        }

        var items = getItemsArray(selectionItems, excludes);
        if (!items.length) {
            throw new Error('当前选区无法同时作为模板和路径/约束来源，请额外选择一个模板对象');
        }

        var bounds = getSelectionBounds(items);
        if (!bounds) {
            throw new Error('选中对象无法作为阵列模板');
        }

        return {
            items: items,
            bounds: bounds
        };
    }

    function resolveRegion(ab, args) {
        var width = ab.width * clamp(toNumber(args.regionWidthPct, 68), 10, 220) / 100;
        var height = ab.height * clamp(toNumber(args.regionHeightPct, 72), 10, 220) / 100;
        var centerX = ab.left + ab.width * clamp(toNumber(args.centerX, 24), -50, 150) / 100;
        var centerY = ab.top - ab.height * clamp(toNumber(args.centerY, 72), -50, 150) / 100;

        return {
            left: centerX - width / 2,
            top: centerY + height / 2,
            width: width,
            height: height,
            centerX: centerX,
            centerY: centerY,
            source: 'custom'
        };
    }

    function resolveRegionFromMode(ab, selectionItems, args) {
        var mode = String(args.regionMode || 'custom');
        if (mode === 'selection') {
            var selectionBounds = getSelectionBounds(selectionItems);
            if (selectionBounds) {
                return {
                    left: selectionBounds.left,
                    top: selectionBounds.top,
                    width: selectionBounds.width,
                    height: selectionBounds.height,
                    centerX: selectionBounds.left + selectionBounds.width / 2,
                    centerY: selectionBounds.top - selectionBounds.height / 2,
                    source: 'selection'
                };
            }
        }

        if (mode === 'artboard') {
            return {
                left: ab.left,
                top: ab.top,
                width: ab.width,
                height: ab.height,
                centerX: ab.left + ab.width / 2,
                centerY: ab.top - ab.height / 2,
                source: 'artboard'
            };
        }

        return resolveRegion(ab, args);
    }

    function computeRegionDistance(px, py, region, regionShape) {
        var nx = Math.abs(px - region.centerX) / Math.max(1, region.width / 2);
        var ny = Math.abs(py - region.centerY) / Math.max(1, region.height / 2);

        if (regionShape === 'rectangle') return Math.max(nx, ny);
        if (regionShape === 'diamond') return nx + ny;
        return Math.sqrt(nx * nx + ny * ny);
    }

    function shapeInfluence(influence, sizeCurve) {
        var v = clamp(influence, 0, 1);
        if (sizeCurve === 'linear') return v;
        if (sizeCurve === 'sharp') return Math.pow(v, 1.9);
        return Math.pow(v, 1.25);
    }

    function parseCustomFieldPoints(text, ab) {
        var points = [];
        var raw = String(text || '').replace(/\r/g, '\n');
        if (!raw) return points;
        var lines = raw.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/^\s+|\s+$/g, '');
            if (!line) continue;
            var parts = line.split(/[,\s;]+/);
            if (parts.length < 2) continue;
            var xPct = parseFloat(parts[0]);
            var yPct = parseFloat(parts[1]);
            var weight = parts.length >= 3 ? parseFloat(parts[2]) : 1;
            if (isNaN(xPct) || isNaN(yPct) || isNaN(weight)) continue;
            points.push({
                x: ab.left + ab.width * clamp(xPct, 0, 100) / 100,
                y: ab.top - ab.height * clamp(yPct, 0, 100) / 100,
                weight: weight
            });
        }
        return points;
    }

    function getSelectionCenters(items, excludes) {
        var result = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (containsItem(excludes, item)) continue;
            try {
                var bounds = item.geometricBounds;
                result.push({
                    x: (bounds[0] + bounds[2]) / 2,
                    y: (bounds[1] + bounds[3]) / 2,
                    weight: 1
                });
            } catch (e) {}
        }
        return result;
    }

    function resolveFieldPoints(ab, region, selectionItems, args, excludes) {
        var source = String(args.fieldSource || 'center');
        if (source === 'selection-centers') {
            var selectionPoints = getSelectionCenters(selectionItems, excludes);
            if (selectionPoints.length) return selectionPoints;
        }
        if (source === 'custom-points') {
            var customPoints = parseCustomFieldPoints(args.attractors, ab);
            if (customPoints.length) return customPoints;
        }
        return [{ x: region.centerX, y: region.centerY, weight: 1 }];
    }

    function pathItemToPolygon(pathItem) {
        var anchors = [];
        for (var i = 0; i < pathItem.pathPoints.length; i++) {
            var pt = pathItem.pathPoints[i].anchor;
            anchors.push([pt[0], pt[1]]);
        }
        return anchors;
    }

    function collectClosedPolygons(items, excludes, out) {
        out = out || [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (containsItem(excludes, item)) continue;

            if (item.typename === 'PathItem') {
                if (item.closed && item.pathPoints.length >= 3) out.push(pathItemToPolygon(item));
                continue;
            }

            if (item.typename === 'CompoundPathItem') {
                for (var j = 0; j < item.pathItems.length; j++) {
                    var sub = item.pathItems[j];
                    if (sub.closed && sub.pathPoints.length >= 3) out.push(pathItemToPolygon(sub));
                }
                continue;
            }

            if (item.typename === 'GroupItem') {
                var children = [];
                for (var k = 0; k < item.pageItems.length; k++) children.push(item.pageItems[k]);
                collectClosedPolygons(children, excludes, out);
            }
        }
        return out;
    }

    function pointInPolygon(x, y, polygon) {
        var inside = false;
        for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            var xi = polygon[i][0], yi = polygon[i][1];
            var xj = polygon[j][0], yj = polygon[j][1];
            var intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / Math.max(0.00001, (yj - yi)) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function pointInAnyPolygon(x, y, polygons) {
        if (!polygons || !polygons.length) return true;
        for (var i = 0; i < polygons.length; i++) {
            if (pointInPolygon(x, y, polygons[i])) return true;
        }
        return false;
    }

    function regionInfluence(px, py, region, regionShape, sigma) {
        var regionDist = computeRegionDistance(px, py, region, regionShape);
        return Math.exp(-(regionDist * regionDist) / (2 * sigma * sigma));
    }

    function fieldInfluence(px, py, fieldPoints, falloff) {
        if (!fieldPoints || !fieldPoints.length) return 1;

        var positive = 0;
        var negative = 0;
        var positiveTotal = 0;
        var negativeTotal = 0;
        var sigma = Math.max(0.05, falloff * 0.55);

        for (var i = 0; i < fieldPoints.length; i++) {
            var point = fieldPoints[i];
            var dx = px - point.x;
            var dy = py - point.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            var influence = Math.exp(-(d * d) / (2 * sigma * sigma));
            if (point.weight >= 0) {
                positive += influence * point.weight;
                positiveTotal += point.weight;
            } else {
                negative += influence * Math.abs(point.weight);
                negativeTotal += Math.abs(point.weight);
            }
        }

        var posNorm = positiveTotal > 0 ? positive / positiveTotal : 0;
        var negNorm = negativeTotal > 0 ? negative / negativeTotal : 0;
        return clamp(posNorm - negNorm * 0.9, 0, 1);
    }

    function resolveRotation(rotationMode, baseRotation, rotationJitter, rand, px, py, region, tangentAngle) {
        var angle = baseRotation;
        if (rotationMode === 'radial') {
            angle += Math.atan2(py - region.centerY, px - region.centerX) * 180 / Math.PI;
        } else if (rotationMode === 'random') {
            angle += (rand() * 2 - 1) * rotationJitter;
        } else if (rotationMode === 'path-tangent') {
            angle += tangentAngle;
        }

        if (rotationMode !== 'random' && rotationMode !== 'path-tangent' && rotationJitter > 0) {
            angle += (rand() * 2 - 1) * rotationJitter;
        }
        return angle;
    }

    function createPrimitiveShape(doc, container, shape, top, left, size, roundnessPct, rotation, stretchX, stretchY) {
        var width = Math.max(0.1, size * stretchX);
        var height = Math.max(0.1, size * stretchY);
        var item;
        if (shape === 'circle') {
            item = doc.pathItems.ellipse(top, left, width, height);
        } else if (shape === 'rounded-square') {
            var radius = Math.max(0.05, Math.min(width, height) * roundnessPct * 0.5);
            item = doc.pathItems.roundedRectangle(top, left, width, height, radius, radius);
        } else {
            item = doc.pathItems.rectangle(top, left, width, height);
        }

        item.moveToBeginning(container);
        if (shape === 'diamond') item.rotate(45 + rotation);
        else item.rotate(rotation);
        return item;
    }

    function createSelectionShape(container, prototype, centerX, centerY, targetSize, stretchX, stretchY, rotation) {
        var cellGroup = container.groupItems.add();
        cellGroup.name = 'Parametric Array Cell';

        for (var i = 0; i < prototype.items.length; i++) {
            var clone = prototype.items[i].duplicate();
            clone.moveToBeginning(cellGroup);
        }

        var scaleBase = targetSize / Math.max(prototype.bounds.width, prototype.bounds.height);
        var scaleX = Math.max(0.01, scaleBase * stretchX) * 100;
        var scaleY = Math.max(0.01, scaleBase * stretchY) * 100;
        cellGroup.resize(scaleX, scaleY);
        if (rotation) cellGroup.rotate(rotation);

        var bounds = cellGroup.geometricBounds;
        var currentCenterX = (bounds[0] + bounds[2]) / 2;
        var currentCenterY = (bounds[1] + bounds[3]) / 2;
        cellGroup.translate(centerX - currentCenterX, centerY - currentCenterY);
        return cellGroup;
    }

    function applyAppearance(item, style, fillGray, strokeGray, strokeWidth) {
        if (item.typename === 'GroupItem') {
            for (var i = 0; i < item.pageItems.length; i++) {
                applyAppearance(item.pageItems[i], style, fillGray, strokeGray, strokeWidth);
            }
            return;
        }

        if (typeof item.filled !== 'undefined') {
            item.filled = style === 'fill' || style === 'both';
            if (item.filled) item.fillColor = fillGray;
        }
        if (typeof item.stroked !== 'undefined') {
            item.stroked = style === 'stroke' || style === 'both';
            if (item.stroked) {
                item.strokeColor = strokeGray;
                item.strokeWidth = strokeWidth;
            }
        }
    }

    function extractPathData(pathItem) {
        var points = [];
        for (var i = 0; i < pathItem.pathPoints.length; i++) {
            var anchor = pathItem.pathPoints[i].anchor;
            points.push({ x: anchor[0], y: anchor[1] });
        }

        var segments = [];
        var total = 0;
        var end = pathItem.closed ? points.length : points.length - 1;
        for (var j = 0; j < end; j++) {
            var a = points[j];
            var b = points[(j + 1) % points.length];
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len <= 0.001) continue;
            segments.push({ a: a, b: b, len: len });
            total += len;
        }

        if (!segments.length || total <= 0.001) {
            throw new Error('路径过短，无法生成沿路径阵列');
        }

        return {
            segments: segments,
            totalLength: total,
            closed: pathItem.closed
        };
    }

    function samplePath(pathData, distance) {
        var d = clamp(distance, 0, pathData.totalLength);
        var acc = 0;
        for (var i = 0; i < pathData.segments.length; i++) {
            var seg = pathData.segments[i];
            if (acc + seg.len >= d || i === pathData.segments.length - 1) {
                var local = (d - acc) / seg.len;
                local = clamp(local, 0, 1);
                var x = seg.a.x + (seg.b.x - seg.a.x) * local;
                var y = seg.a.y + (seg.b.y - seg.a.y) * local;
                var tx = (seg.b.x - seg.a.x) / seg.len;
                var ty = (seg.b.y - seg.a.y) / seg.len;
                return {
                    x: x,
                    y: y,
                    tangentX: tx,
                    tangentY: ty,
                    normalX: -ty,
                    normalY: tx,
                    tangentAngle: Math.atan2(ty, tx) * 180 / Math.PI
                };
            }
            acc += seg.len;
        }
        return null;
    }

    function shouldKeep(influence, densityPct, regularityPct, rand, row, col, seed) {
        influence = clamp(influence, 0, 1);
        densityPct = clamp(densityPct, 0, 1);
        regularityPct = clamp(regularityPct, 0, 1);

        if (regularityPct >= 0.66) {
            var deterministicThreshold = 1 - densityPct;
            return influence > Math.max(0.02, deterministicThreshold);
        }

        var presence = clamp(influence * (0.3 + densityPct * 0.9), 0, 1);
        var orderedNoise = ((row * 37 + col * 19 + seed * 11) % 100) / 100;
        var blendedNoise = orderedNoise * regularityPct + rand() * (1 - regularityPct);
        return presence > blendedNoise;
    }

    function createElement(doc, container, itemShape, prototype, centerX, centerY, targetSize, roundnessPct, rotation, stretchX, stretchY) {
        if (itemShape === 'selection') {
            return createSelectionShape(container, prototype, centerX, centerY, targetSize, stretchX, stretchY, rotation);
        }

        var width = targetSize * stretchX;
        var height = targetSize * stretchY;
        var left = centerX - width / 2;
        var top = centerY + height / 2;
        return createPrimitiveShape(doc, container, itemShape, top, left, targetSize, roundnessPct, rotation, stretchX, stretchY);
    }

    function applyPreviewBudget(columns, rows, maxItems) {
        var cols = Math.max(2, columns);
        var rws = Math.max(1, rows);
        var total = cols * rws;
        if (total <= maxItems) {
            return { columns: cols, rows: rws };
        }

        var scale = Math.sqrt(maxItems / total);
        cols = Math.max(2, Math.floor(cols * scale));
        rws = Math.max(1, Math.floor(rws * scale));

        while (cols * rws > maxItems) {
            if (cols >= rws && cols > 2) cols--;
            else if (rws > 1) rws--;
            else break;
        }

        return { columns: cols, rows: rws };
    }

    function normalizeCandidateSizes(candidates) {
        if (!candidates || !candidates.length) return;

        var minInfluence = Infinity;
        var maxInfluence = -Infinity;
        for (var i = 0; i < candidates.length; i++) {
            var influence = candidates[i].influence;
            if (influence < minInfluence) minInfluence = influence;
            if (influence > maxInfluence) maxInfluence = influence;
        }

        var span = maxInfluence - minInfluence;
        for (var j = 0; j < candidates.length; j++) {
            if (span < 0.00001) {
                candidates[j].sizeFactor = candidates[j].influence > 0 ? 1 : 0;
            } else {
                candidates[j].sizeFactor = clamp((candidates[j].influence - minInfluence) / span, 0, 1);
            }
        }
    }

    function buildGridArray(doc, targetLayer, config) {
        var ab = config.ab;
        var columns = config.columns;
        var rows = config.rows;
        var cellWidth = ab.width / columns;
        var cellHeight = ab.height / rows;
        var cellBase = Math.min(cellWidth, cellHeight);
        var maxSize = cellBase * config.maxSizePct;
        var minSize = cellBase * config.minSizePct;
        var sigma = Math.max(0.16, config.falloffPct);
        var jitterXMax = cellWidth * config.jitterPct * 0.65;
        var jitterYMax = cellHeight * config.jitterPct * 0.65;
        var group = targetLayer.groupItems.add();
        var candidates = [];
        var created = 0;
        var skipped = 0;

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < columns; col++) {
                var px = ab.left + cellWidth * (col + 0.5);
                var py = ab.top - cellHeight * (row + 0.5);
                if (!pointInAnyPolygon(px, py, config.maskPolygons)) {
                    skipped++;
                    continue;
                }

                var influence = regionInfluence(px, py, config.region, config.regionShape, sigma);
                influence *= fieldInfluence(px, py, config.fieldPoints, config.falloffPx);
                influence = shapeInfluence(influence, config.sizeCurve);

                if (!shouldKeep(influence, config.densityPct, config.regularityPct, config.rand, row, col, config.seed)) {
                    skipped++;
                    continue;
                }

                var offsetX = (config.rand() - 0.5) * jitterXMax;
                var offsetY = (config.rand() - 0.5) * jitterYMax;
                candidates.push({
                    px: px + offsetX,
                    py: py + offsetY,
                    influence: influence,
                    rotation: resolveRotation(config.rotationMode, config.rotation, config.rotationJitter, config.rand, px, py, config.region, 0),
                    opacity: Math.round(14 + influence * 72)
                });
            }
        }

        normalizeCandidateSizes(candidates);

        for (var c = 0; c < candidates.length; c++) {
            var candidate = candidates[c];
            var size = minSize + (maxSize - minSize) * candidate.sizeFactor;
            if (size < 0.4) {
                skipped++;
                continue;
            }

            var item = createElement(doc, group, config.itemShape, config.prototype, candidate.px, candidate.py, size, config.roundnessPct, candidate.rotation, config.stretchX, config.stretchY);
            item.opacity = candidate.opacity;

            if (config.itemShape !== 'selection') {
                item.filled = config.style === 'fill' || config.style === 'both';
                item.stroked = config.style === 'stroke' || config.style === 'both';
                if (item.filled) item.fillColor = config.fillGray;
                if (item.stroked) {
                    item.strokeColor = config.strokeGray;
                    item.strokeWidth = config.strokeWidth;
                }
            } else if (config.style !== 'both') {
                applyAppearance(item, config.style, config.fillGray, config.strokeGray, config.strokeWidth);
            }
            created++;
        }

        return { group: group, created: created, skipped: skipped };
    }

    function buildPathArray(doc, targetLayer, config) {
        if (!config.guidePath) {
            throw new Error('布局模式为“沿路径流动”时，必须选择一条路径作为引导线');
        }

        var pathData = extractPathData(config.guidePath);
        var sampleCount = Math.max(2, config.columns);
        var laneCount = Math.max(1, config.rows);
        var cellBase = Math.min(config.ab.width / Math.max(2, config.columns), config.ab.height / Math.max(2, config.rows));
        var maxSize = cellBase * config.maxSizePct;
        var minSize = cellBase * config.minSizePct;
        var laneGap = cellBase * config.laneGapPct;
        var jitterMax = laneGap * config.jitterPct * 0.35;
        var group = targetLayer.groupItems.add();
        var candidates = [];
        var created = 0;
        var skipped = 0;
        var lastIndex = pathData.closed ? sampleCount : Math.max(1, sampleCount - 1);

        for (var col = 0; col < sampleCount; col++) {
            var dist = pathData.totalLength * (col / lastIndex);
            var sample = samplePath(pathData, dist);
            if (!sample) continue;

            for (var row = 0; row < laneCount; row++) {
                var laneOffset = (row - (laneCount - 1) / 2) * laneGap;
                var px = sample.x + sample.normalX * laneOffset;
                var py = sample.y + sample.normalY * laneOffset;
                if (!pointInAnyPolygon(px, py, config.maskPolygons)) {
                    skipped++;
                    continue;
                }

                var influence = regionInfluence(px, py, config.region, config.regionShape, Math.max(0.16, config.falloffPct));
                influence *= fieldInfluence(px, py, config.fieldPoints, config.falloffPx);
                influence = shapeInfluence(influence, config.sizeCurve);

                if (!shouldKeep(influence, config.densityPct, config.regularityPct, config.rand, row, col, config.seed)) {
                    skipped++;
                    continue;
                }

                var offsetX = (config.rand() - 0.5) * jitterMax;
                var offsetY = (config.rand() - 0.5) * jitterMax;
                var rotationMode = config.rotationMode === 'uniform' ? 'path-tangent' : config.rotationMode;
                candidates.push({
                    px: px + offsetX,
                    py: py + offsetY,
                    influence: influence,
                    rotation: resolveRotation(rotationMode, config.rotation, config.rotationJitter, config.rand, px, py, config.region, sample.tangentAngle),
                    opacity: Math.round(14 + influence * 72)
                });
            }
        }

        normalizeCandidateSizes(candidates);

        for (var c = 0; c < candidates.length; c++) {
            var candidate = candidates[c];
            var size = minSize + (maxSize - minSize) * candidate.sizeFactor;
            if (size < 0.4) {
                skipped++;
                continue;
            }

            var item = createElement(doc, group, config.itemShape, config.prototype, candidate.px, candidate.py, size, config.roundnessPct, candidate.rotation, config.stretchX, config.stretchY);
            item.opacity = candidate.opacity;

            if (config.itemShape !== 'selection') {
                item.filled = config.style === 'fill' || config.style === 'both';
                item.stroked = config.style === 'stroke' || config.style === 'both';
                if (item.filled) item.fillColor = config.fillGray;
                if (item.stroked) {
                    item.strokeColor = config.strokeGray;
                    item.strokeWidth = config.strokeWidth;
                }
            } else if (config.style !== 'both') {
                applyAppearance(item, config.style, config.fillGray, config.strokeGray, config.strokeWidth);
            }
            created++;
        }

        return { group: group, created: created, skipped: skipped };
    }

    function buildConfig(doc, args) {
        var ab = $.hopeflow.utils.getActiveArtboardBounds();
        var selectionItems = getItemsArray(doc.selection || [], null);
        var isPreview = (args.preview === true || args.preview === 'true');
        var layoutMode = String(args.layoutMode || 'grid');
        var columns = Math.max(2, toInt(args.columns, 24));
        var rows = Math.max(1, toInt(args.rows, 28));
        var itemShape = String(args.itemShape || 'diamond');
        var guidePath = layoutMode === 'path' ? findGuidePath(selectionItems, null) : null;
        var prototypeExcludes = guidePath ? [guidePath] : [];
        var prototype = getPrototype(selectionItems, itemShape, prototypeExcludes);
        var region = resolveRegionFromMode(ab, selectionItems, args);
        var maskSource = String(args.maskSource || 'none');

        var maskExcludes = [];
        if (prototype) {
            for (var i = 0; i < prototype.items.length; i++) maskExcludes.push(prototype.items[i]);
        }
        if (guidePath) maskExcludes.push(guidePath);

        var maskPolygons = maskSource === 'selection-closed'
            ? collectClosedPolygons(selectionItems, maskExcludes, [])
            : [];
        if (maskSource === 'selection-closed' && !maskPolygons.length) {
            throw new Error('路径约束设为“选区闭合路径”时，必须额外选择闭合路径或轮廓');
        }

        var fieldExcludes = [];
        if (prototype) {
            for (var j = 0; j < prototype.items.length; j++) fieldExcludes.push(prototype.items[j]);
        }
        var fieldPoints = resolveFieldPoints(ab, region, selectionItems, args, fieldExcludes);
        var previewMaxItems = Math.max(
            40,
            toInt(
                args.previewMaxItems,
                itemShape === 'selection' ? 90 : (layoutMode === 'path' ? 180 : 320)
            )
        );

        if (isPreview) {
            var budget = applyPreviewBudget(columns, rows, previewMaxItems);
            columns = budget.columns;
            rows = budget.rows;
        }

        return {
            ab: ab,
            isPreview: isPreview,
            layoutMode: layoutMode,
            columns: columns,
            rows: rows,
            maxSizePct: clamp(toNumber(args.maxSizePct, 72), 1, 220) / 100,
            minSizePct: clamp(toNumber(args.minSizePct, 6), 0, 100) / 100,
            itemShape: itemShape,
            region: region,
            regionShape: String(args.regionShape || 'ellipse'),
            fieldPoints: fieldPoints,
            falloffPct: clamp(toNumber(args.falloff, 62), 10, 180) / 100,
            falloffPx: clamp(toNumber(args.falloff, 62), 10, 180) / 100 * Math.min(ab.width, ab.height),
            sizeCurve: String(args.sizeCurve || 'smooth'),
            densityPct: clamp(toNumber(args.density, 100), 0, 100) / 100,
            regularityPct: clamp(toNumber(args.regularity, 88), 0, 100) / 100,
            jitterPct: clamp(toNumber(args.jitter, 0), 0, 100) / 100,
            rotationMode: String(args.rotationMode || 'uniform'),
            rotation: toNumber(args.rotation, 0),
            rotationJitter: clamp(toNumber(args.rotationJitter, 0), 0, 180),
            laneGapPct: clamp(toNumber(args.laneGapPct, 110), 20, 240) / 100,
            stretchX: clamp(toNumber(args.stretchXPct, 100), 20, 220) / 100,
            stretchY: clamp(toNumber(args.stretchYPct, 100), 20, 220) / 100,
            roundnessPct: clamp(toNumber(args.roundness, 8), 0, 50) / 100,
            strokeWidth: Math.max(0, toNumber(args.strokeWidth, 0.6)),
            style: String(args.style || 'stroke'),
            seed: toInt(args.seed, 1),
            rand: makeRng(toInt(args.seed, 1)),
            strokeGray: makeGray(clamp(toNumber(args.gray, 62), 0, 100)),
            fillGray: makeGray(clamp(toNumber(args.gray, 62) + 10, 0, 100)),
            prototype: prototype,
            guidePath: guidePath,
            maskPolygons: maskPolygons,
            previewMaxItems: previewMaxItems
        };
    }

    function buildArray(doc, targetLayer, args) {
        var config = buildConfig(doc, args);
        var result = config.layoutMode === 'path'
            ? buildPathArray(doc, targetLayer, config)
            : buildGridArray(doc, targetLayer, config);

        return {
            group: result.group,
            created: result.created,
            skipped: result.skipped,
            regionSource: config.region.source,
            layoutMode: config.layoutMode,
            itemShape: config.itemShape,
            regionShape: config.regionShape,
            fieldCount: config.fieldPoints.length,
            hasMask: config.maskPolygons.length > 0
        };
    }

    try {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('没有打开的文档');
        }

        var doc = app.activeDocument;
        var args = $.hopeflow.utils.getArgs();
        var isPreview = (args.preview === true || args.preview === 'true');
        var isClearOnly = (args.clearOnly === true || args.clearOnly === 'true');

        if (isClearOnly) {
            removePreviewLayer(doc);
            return $.hopeflow.utils.returnResult({ cleared: true });
        }

        if (isPreview) {
            removePreviewLayer(doc);
            var previewLayer = getPreviewLayer(doc);
            var previewResult = buildArray(doc, previewLayer, args);
            previewLayer.locked = true;
            return $.hopeflow.utils.returnResult({
                preview: true,
                created: previewResult.created,
                skipped: previewResult.skipped,
                regionSource: previewResult.regionSource,
                layoutMode: previewResult.layoutMode,
                itemShape: previewResult.itemShape,
                regionShape: previewResult.regionShape,
                fieldCount: previewResult.fieldCount,
                hasMask: previewResult.hasMask
            });
        }

        removePreviewLayer(doc);
        var result = buildArray(doc, doc.activeLayer, args);
        if (result.created === 0) {
            result.group.remove();
            return $.hopeflow.utils.returnError('没有生成任何对象，请提高尺寸/密度，或减小约束条件');
        }

        doc.selection = null;
        result.group.selected = true;

        return $.hopeflow.utils.returnResult({
            created: result.created,
            skipped: result.skipped,
            regionSource: result.regionSource,
            layoutMode: result.layoutMode,
            itemShape: result.itemShape,
            regionShape: result.regionShape,
            fieldCount: result.fieldCount,
            hasMask: result.hasMask
        });
    } catch (error) {
        return $.hopeflow.utils.returnError('参数化阵列执行失败: ' + error.message);
    }
})();
