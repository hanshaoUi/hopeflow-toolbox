//@target illustrator
app.preferences.setBooleanPreference('ShowExternalJSXWarning', false);

function main() {
  if (typeof $.hopeflow === 'undefined' || !$.hopeflow.utils) return;
  if (!app.documents.length) return $.hopeflow.utils.returnError('没有打开的文档');
  if (!app.selection.length || app.selection.typename === 'TextRange') {
    return $.hopeflow.utils.returnError('请至少选择一个图像或对象');
  }

  var args = $.hopeflow.utils.getArgs();
  if (args.mode === 'exportSelection') return exportSelection(args);
  if (args.mode === 'createContour') return createContour(args);
  return $.hopeflow.utils.returnError('未知的 Alpha 轮廓模式');
}

function exportSelection(args) {
  var sourceDoc = app.activeDocument;
  var sourceSelection = [];
  for (var i = 0; i < app.selection.length; i++) sourceSelection.push(app.selection[i]);

  var bounds = unionVisibleBounds(sourceSelection);
  if (!bounds) return $.hopeflow.utils.returnError('无法读取选区边界');

  var padding = Math.max(8, Math.abs(convertUnitValue(num(args.offset, 0), String(args.offsetUnit || 'pt'), 'pt')) + 8);
  var padded = [bounds[0] - padding, bounds[1] + padding, bounds[2] + padding, bounds[3] - padding];
  var widthPt = Math.max(1, padded[2] - padded[0]);
  var heightPt = Math.max(1, padded[1] - padded[3]);
  var maxSide = Math.max(128, num(args.maxSide, 1024));
  var scale = Math.min(400, Math.max(20, maxSide / Math.max(widthPt, heightPt) * 100));

  var colorSpace = sourceDoc.documentColorSpace === DocumentColorSpace.CMYK
    ? DocumentColorSpace.CMYK
    : DocumentColorSpace.RGB;
  var tempDoc = app.documents.add(colorSpace, widthPt, heightPt);
  tempDoc.rulerOrigin = [0, 0];

  for (var s = 0; s < sourceSelection.length; s++) {
    var dup = sourceSelection[s].duplicate(tempDoc.layers[0], ElementPlacement.PLACEATEND);
    var dupBounds = dup.visibleBounds;
    dup.translate(padding - dupBounds[0], (heightPt - padding) - dupBounds[1]);
  }

  var tempFile = new File(Folder.temp.fsName + '/hopeflow_alpha_' + (new Date().getTime()) + '.png');
  var options = new ExportOptionsPNG24();
  options.antiAliasing = true;
  options.transparency = true;
  options.artBoardClipping = true;
  options.horizontalScale = scale;
  options.verticalScale = scale;
  tempDoc.exportFile(tempFile, ExportType.PNG24, options);
  tempDoc.close(SaveOptions.DONOTSAVECHANGES);
  sourceDoc.activate();
  app.selection = sourceSelection;

  return $.hopeflow.utils.returnResult({
    pngPath: tempFile.fsName,
    bounds: padded,
    scale: scale / 100,
    widthPt: widthPt,
    heightPt: heightPt
  });
}

function createContour(args) {
  var doc = app.activeDocument;
  var sel = app.selection;
  if (!sel.length) return $.hopeflow.utils.returnError('创建轮廓前请先选择原始对象');

  var points = args.points || [];
  if (points.length < 3) return $.hopeflow.utils.returnError('Alpha 轮廓点不足');

  var container = String(args.container || 'newLayer');
  var position = String(args.position || 'under');
  var enableStroke = args.enableStroke !== false && args.enableStroke !== 'false';
  var strokeValue = enableStroke ? convertUnitValue(Math.abs(num(args.stroke, 0)), String(args.strokeUnit || 'pt'), 'pt') : 0;
  var smoothAmount = (args.smoothResult === false || args.smoothResult === 'false') ? 0 : clamp(num(args.smoothAmount, 35), 0, 100);
  var origItem = sel[0];
  var targetLayer = origItem.layer;

  if (container === 'newLayer') {
    try {
      targetLayer = doc.layers['Contour'];
    } catch (errLayer) {
      targetLayer = doc.layers.add();
      targetLayer.name = 'Contour';
    }
    targetLayer.visible = true;
    targetLayer.locked = false;
    targetLayer.zOrder(position !== 'above' ? ZOrderMethod.SENDTOBACK : ZOrderMethod.BRINGTOFRONT);
  }

  var path = targetLayer.pathItems.add();
  path.setEntirePath(points);
  path.closed = true;
  path.filled = true;
  path.fillColor = setCMYKColor([0, 100, 0, 0]);
  path.stroked = !!strokeValue;
  if (strokeValue) {
    path.strokeWidth = strokeValue;
    path.strokeColor = path.fillColor;
    path.strokeMiterLimit = doc.defaultStrokeMiterLimit;
    path.strokeJoin = doc.defaultStrokeJoin;
    path.strokeCap = doc.defaultStrokeCap;
  }

  if (smoothAmount > 0) smoothPath(path, smoothAmount);

  if (container !== 'newLayer') {
    path.move(origItem, position !== 'above' ? ElementPlacement.PLACEAFTER : ElementPlacement.PLACEBEFORE);
  }

  if (container === 'group') {
    var comboGroup = origItem.layer.groupItems.add();
    comboGroup.name = origItem.name;
    comboGroup.move(origItem, ElementPlacement.PLACEBEFORE);
    origItem.move(comboGroup, ElementPlacement.PLACEATBEGINNING);
    path.move(comboGroup, position !== 'above' ? ElementPlacement.PLACEATEND : ElementPlacement.PLACEATBEGINNING);
  }

  app.selection = [path];
  return $.hopeflow.utils.returnResult({ message: 'Alpha 轮廓已创建', count: 1, points: points.length });
}

function unionVisibleBounds(items) {
  var result = null;
  for (var i = 0; i < items.length; i++) {
    var b;
    try { b = items[i].visibleBounds; } catch (err) { continue; }
    if (!result) result = [b[0], b[1], b[2], b[3]];
    else {
      result[0] = Math.min(result[0], b[0]);
      result[1] = Math.max(result[1], b[1]);
      result[2] = Math.max(result[2], b[2]);
      result[3] = Math.min(result[3], b[3]);
    }
  }
  return result;
}

function smoothPath(path, amount) {
  if (!path || !path.pathPoints || path.pathPoints.length < 3) return;
  var handleScale = 0.05 + clamp(amount, 0, 100) / 100 * 0.22;
  var points = path.pathPoints;
  var len = points.length;
  var anchors = [];
  for (var i = 0; i < len; i++) anchors.push([points[i].anchor[0], points[i].anchor[1]]);
  for (var j = 0; j < len; j++) {
    var prev = anchors[j === 0 ? len - 1 : j - 1];
    var curr = anchors[j];
    var next = anchors[j === len - 1 ? 0 : j + 1];
    var dx = (next[0] - prev[0]) * handleScale;
    var dy = (next[1] - prev[1]) * handleScale;
    points[j].leftDirection = [curr[0] - dx, curr[1] - dy];
    points[j].rightDirection = [curr[0] + dx, curr[1] + dy];
    try { points[j].pointType = PointType.SMOOTH; } catch (err) {}
  }
}

function setCMYKColor(cmyk) {
  var color = new CMYKColor();
  color.cyan = cmyk[0];
  color.magenta = cmyk[1];
  color.yellow = cmyk[2];
  color.black = cmyk[3];
  return color;
}

function convertUnitValue(value, currUnits, newUnits) {
  return UnitValue(value, currUnits || 'pt').as(newUnits || 'pt');
}

function num(value, fallback) {
  var n = parseFloat(String(value).replace(/,/g, '.'));
  return isNaN(n) ? fallback : n;
}

function clamp(value, min, max) {
  value = parseFloat(value);
  if (isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

try {
  main();
} catch (err) {
  if ($.hopeflow && $.hopeflow.utils) $.hopeflow.utils.returnError(err.message || String(err));
}
