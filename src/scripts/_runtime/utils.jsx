// ============================================================
// JSON polyfill for ExtendScript (ES3 - no native JSON)
// ============================================================
// @target illustrator
// @targetengine main

if (typeof JSON === 'undefined') {
    JSON = {};

    JSON.stringify = function (val) {
        var t = typeof val;
        if (t === 'undefined') return undefined;
        if (val === null) return 'null';
        if (t === 'boolean') return val ? 'true' : 'false';
        if (t === 'number') {
            if (!isFinite(val)) return 'null';
            return String(val);
        }
        if (t === 'string') {
            return '"' + val
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                .replace(/[\x00-\x1f]/g, function (c) {
                    return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
                }) + '"';
        }
        if (t === 'object') {
            if (val instanceof Array) {
                var arr = [];
                for (var i = 0; i < val.length; i++) {
                    var v = JSON.stringify(val[i]);
                    arr.push(typeof v === 'undefined' ? 'null' : v);
                }
                return '[' + arr.join(',') + ']';
            }
            var pairs = [];
            for (var k in val) {
                if (val.hasOwnProperty(k)) {
                    var kval = JSON.stringify(val[k]);
                    if (typeof kval !== 'undefined') {
                        pairs.push(JSON.stringify(k) + ':' + kval);
                    }
                }
            }
            return '{' + pairs.join(',') + '}';
        }
        return undefined;
    };

    JSON.parse = function (str) {
        return eval('(' + str + ')');
    };
}

// Ensure namespace
$.hopeflow = $.hopeflow || {};
$.hopeflow.utils = $.hopeflow.utils || {};

// ============================================================
// Selection Utilities
// ============================================================

/**
 * Get current selection as array, with optional type filter
 * @param {string} [typeFilter] - 'PathItem', 'TextFrame', 'GroupItem', etc.
 * @returns {Array} Selected items
 */
$.hopeflow.utils.getSelection = function (typeFilter) {
    var doc = app.activeDocument;
    if (!doc || !doc.selection || doc.selection.length === 0) return [];
    var sel = [];
    for (var i = 0; i < doc.selection.length; i++) {
        var item = doc.selection[i];
        if (!typeFilter || item.typename === typeFilter) {
            sel.push(item);
        }
    }
    return sel;
};

/**
 * Require a minimum selection count, return error to panel if insufficient
 */
$.hopeflow.utils.requireSelection = function (minCount, message) {
    var sel = $.hopeflow.utils.getSelection();
    if (sel.length < (minCount || 1)) {
        var msg = message || ('请至少选择 ' + (minCount || 1) + ' 个对象');
        throw new Error(msg);
    }
    return sel;
};

/**
 * Get current ruler units as string (mm, cm, in, pt, px, pc)
 */
$.hopeflow.utils.getRulerUnitsString = function () {
    if (!app.documents.length) return "";
    var u = app.activeDocument.rulerUnits;
    switch (u) {
        case RulerUnits.Millimeters: return "mm";
        case RulerUnits.Centimeters: return "cm";
        case RulerUnits.Inches: return "in";
        case RulerUnits.Points: return "pt";
        case RulerUnits.Picas: return "pc";
        case RulerUnits.Pixels: return "px";
        default: return "pt";
    }
};

/**
 * Get bounding box of items
 */
$.hopeflow.utils.getBounds = function (items) {
    if (!items || items.length === 0) return null;
    var left = Infinity, top = -Infinity, right = -Infinity, bottom = Infinity;
    for (var i = 0; i < items.length; i++) {
        var b = items[i].geometricBounds; // [left, top, right, bottom]
        if (b[0] < left) left = b[0];
        if (b[1] > top) top = b[1];
        if (b[2] > right) right = b[2];
        if (b[3] < bottom) bottom = b[3];
    }
    return {
        left: left, top: top, right: right, bottom: bottom,
        width: right - left, height: top - bottom
    };
};

// ============================================================
// Transform Utilities
// ============================================================

/**
 * Move an item to absolute position
 */
$.hopeflow.utils.moveTo = function (item, x, y) {
    var bounds = item.geometricBounds;
    var dx = x - bounds[0];
    var dy = y - bounds[1];
    item.translate(dx, dy);
};

/**
 * Center an item within given bounds
 */
$.hopeflow.utils.centerInBounds = function (item, targetBounds) {
    var itemBounds = $.hopeflow.utils.getBounds([item]);
    var cx = targetBounds.left + (targetBounds.width - itemBounds.width) / 2;
    var cy = targetBounds.top - (targetBounds.height - itemBounds.height) / 2;
    $.hopeflow.utils.moveTo(item, cx, cy);
};

/**
 * Distribute items evenly along an axis
 */
$.hopeflow.utils.distribute = function (items, axis, spacing) {
    if (items.length < 2) return;
    // Sort by position
    var sorted = items.slice().sort(function (a, b) {
        var ba = a.geometricBounds, bb = b.geometricBounds;
        return axis === 'x' ? ba[0] - bb[0] : bb[1] - ba[1];
    });

    if (typeof spacing === 'undefined') {
        // Calculate equal spacing
        var totalBounds = $.hopeflow.utils.getBounds(sorted);
        var totalItemSize = 0;
        for (var i = 0; i < sorted.length; i++) {
            var ib = sorted[i].geometricBounds;
            totalItemSize += axis === 'x' ? (ib[2] - ib[0]) : (ib[1] - ib[3]);
        }
        var totalSpace = axis === 'x' ? totalBounds.width : totalBounds.height;
        spacing = (totalSpace - totalItemSize) / (sorted.length - 1);
    }

    var pos = axis === 'x' ?
        sorted[0].geometricBounds[0] :
        sorted[0].geometricBounds[1];

    for (var j = 0; j < sorted.length; j++) {
        var bounds = sorted[j].geometricBounds;
        if (axis === 'x') {
            $.hopeflow.utils.moveTo(sorted[j], pos, bounds[1]);
            pos += (bounds[2] - bounds[0]) + spacing;
        } else {
            $.hopeflow.utils.moveTo(sorted[j], bounds[0], pos);
            pos -= (bounds[1] - bounds[3]) + spacing;
        }
    }
};

// ============================================================
// Color Utilities
// ============================================================

/**
 * Create a CMYK color
 */
$.hopeflow.utils.cmykColor = function (c, m, y, k) {
    var color = new CMYKColor();
    color.cyan = c;
    color.magenta = m;
    color.yellow = y;
    color.black = k;
    return color;
};

/**
 * Create an RGB color
 */
$.hopeflow.utils.rgbColor = function (r, g, b) {
    var color = new RGBColor();
    color.red = r;
    color.green = g;
    color.blue = b;
    return color;
};

/**
 * Convert hex string to RGB color
 */
$.hopeflow.utils.hexToRgb = function (hex) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);
    return $.hopeflow.utils.rgbColor(r, g, b);
};

/**
 * Get the fill color of an item as {c,m,y,k} or {r,g,b}
 */
$.hopeflow.utils.getFillColor = function (item) {
    if (!item.filled) return null;
    var color = item.fillColor;
    if (color.typename === 'CMYKColor') {
        return {
            type: 'cmyk',
            c: color.cyan,
            m: color.magenta,
            y: color.yellow,
            k: color.black
        };
    } else if (color.typename === 'RGBColor') {
        return {
            type: 'rgb',
            r: color.red,
            g: color.green,
            b: color.blue
        };
    } else if (color.typename === 'SpotColor') {
        return {
            type: 'spot',
            name: color.spot.name
        };
    }
    return null;
};

/**
 * Set fill color on item(s)
 */
$.hopeflow.utils.setFillColor = function (items, color) {
    if (!items.length) items = [items];
    for (var i = 0; i < items.length; i++) {
        items[i].fillColor = color;
        items[i].filled = true;
    }
};

// ============================================================
// Layer Utilities
// ============================================================

/**
 * Get or create a layer by name
 */
$.hopeflow.utils.getOrCreateLayer = function (name) {
    var doc = app.activeDocument;
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === name) return doc.layers[i];
    }
    var layer = doc.layers.add();
    layer.name = name;
    return layer;
};

// ============================================================
// Artboard Utilities
// ============================================================

/**
 * Get active artboard bounds
 */
$.hopeflow.utils.getActiveArtboardBounds = function () {
    var doc = app.activeDocument;
    var idx = doc.artboards.getActiveArtboardIndex();
    var ab = doc.artboards[idx];
    var rect = ab.artboardRect; // [left, top, right, bottom]
    return {
        left: rect[0],
        top: rect[1],
        right: rect[2],
        bottom: rect[3],
        width: rect[2] - rect[0],
        height: rect[1] - rect[3]
    };
};

/**
 * Get items on a specific artboard
 */
$.hopeflow.utils.getItemsOnArtboard = function (artboardIndex) {
    var doc = app.activeDocument;
    var ab = doc.artboards[artboardIndex];
    var rect = ab.artboardRect;
    var items = [];
    for (var i = 0; i < doc.pageItems.length; i++) {
        var item = doc.pageItems[i];
        var b = item.geometricBounds;
        // Check if item overlaps with artboard
        if (b[0] < rect[2] && b[2] > rect[0] && b[3] < rect[1] && b[1] > rect[3]) {
            items.push(item);
        }
    }
    return items;
};

// ============================================================
// Text Utilities
// ============================================================

/**
 * Get all text frames in document
 */
$.hopeflow.utils.getAllTextFrames = function () {
    var doc = app.activeDocument;
    var frames = [];
    for (var i = 0; i < doc.textFrames.length; i++) {
        frames.push(doc.textFrames[i]);
    }
    return frames;
};

/**
 * Find and replace text across all text frames
 */
$.hopeflow.utils.findReplaceText = function (find, replace, options) {
    var frames = $.hopeflow.utils.getAllTextFrames();
    var count = 0;
    options = options || {};
    var caseSensitive = options.caseSensitive !== false;

    for (var i = 0; i < frames.length; i++) {
        var text = frames[i].contents;
        var newText;
        if (caseSensitive) {
            newText = text.split(find).join(replace);
        } else {
            var regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            newText = text.replace(regex, replace);
        }
        if (newText !== text) {
            frames[i].contents = newText;
            count++;
        }
    }
    return count;
};

// ============================================================
// Path Utilities
// ============================================================

/**
 * Get total path length of a PathItem
 */
$.hopeflow.utils.getPathLength = function (pathItem) {
    var total = 0;
    var points = pathItem.pathPoints;
    for (var i = 0; i < points.length - 1; i++) {
        var dx = points[i + 1].anchor[0] - points[i].anchor[0];
        var dy = points[i + 1].anchor[1] - points[i].anchor[1];
        total += Math.sqrt(dx * dx + dy * dy);
    }
    if (pathItem.closed && points.length > 1) {
        var dxl = points[0].anchor[0] - points[points.length - 1].anchor[0];
        var dyl = points[0].anchor[1] - points[points.length - 1].anchor[1];
        total += Math.sqrt(dxl * dxl + dyl * dyl);
    }
    return total;
};

// ============================================================
// Export / Document Utilities
// ============================================================

/**
 * Get script arguments (passed from panel)
 */
$.hopeflow.utils.getArgs = function () {
    return $.hopeflow._currentArgs || {};
};

/**
 * Return result to panel
 */
$.hopeflow.utils.returnResult = function (data) {
    var r = JSON.stringify({ success: true, data: data });
    $.hopeflow._lastResult = r;
    return r;
};

/**
 * Return error to panel
 */
$.hopeflow.utils.returnError = function (message) {
    var r = JSON.stringify({ success: false, error: message });
    $.hopeflow._lastResult = r;
    return r;
};

// ============================================================
// Unit Conversion
// ============================================================

$.hopeflow.utils.ptToMm = function (pt) {
    return pt * 0.352778;
};
$.hopeflow.utils.mmToPt = function (mm) {
    return mm / 0.352778;
};
$.hopeflow.utils.ptToInch = function (pt) {
    return pt / 72;
};
$.hopeflow.utils.inchToPt = function (inch) {
    return inch * 72;
};
$.hopeflow.utils.ptToPx = function (pt) {
    return pt * (96 / 72);
};
