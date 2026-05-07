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
  if (args.mode === 'importSvg') return importSvg(args);
  return $.hopeflow.utils.returnError('未知的图像矢量化模式');
}

function exportSelection(args) {
  var sourceDoc = app.activeDocument;
  var sourceSelection = [];
  for (var i = 0; i < app.selection.length; i++) sourceSelection.push(app.selection[i]);
  var requireImage = args.requireImage !== false && args.requireImage !== 'false';
  if (requireImage) {
    var imageItems = collectImageItems(sourceSelection);
    if (imageItems.length !== 1) {
      return $.hopeflow.utils.returnError('请选择 1 张链接或嵌入图片后再读取');
    }
    sourceSelection = [imageItems[0]];
  }

  var bounds = unionVisibleBounds(sourceSelection);
  if (!bounds) return $.hopeflow.utils.returnError('无法读取选区边界');

  var padding = 0;
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

  var tempFile = new File(Folder.temp.fsName + '/hopeflow_vectorize_' + (new Date().getTime()) + '.png');
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
    originalBounds: bounds,
    bounds: padded,
    itemType: sourceSelection[0] && sourceSelection[0].typename ? sourceSelection[0].typename : '',
    itemName: sourceSelection[0] && sourceSelection[0].name ? sourceSelection[0].name : '',
    widthPt: widthPt,
    heightPt: heightPt
  });
}

function isImageItem(item) {
  if (!item) return false;
  return item.typename === 'RasterItem' || item.typename === 'PlacedItem';
}

function collectImageItems(items) {
  var result = [];
  for (var i = 0; i < items.length; i++) collectImageItem(items[i], result);
  return result;
}

function collectImageItem(item, result) {
  if (!item) return;
  if (isImageItem(item)) {
    result.push(item);
    return;
  }
  if (item.pageItems) {
    for (var i = 0; i < item.pageItems.length; i++) collectImageItem(item.pageItems[i], result);
  }
}

function importSvg(args) {
  var svgCode = String(args.svgCode || '');
  var isPreview = args.preview === true || args.preview === 'true';
  var clearPreview = args.clearPreview === true || args.clearPreview === 'true';
  removePreviewGroups();
  if (clearPreview && !svgCode) return $.hopeflow.utils.returnResult({ message: '矢量化预览已清除' });
  if (!svgCode) return $.hopeflow.utils.returnError('未提供 SVG 代码');

  var doc = app.activeDocument;
  var selection = [];
  for (var i = 0; i < app.selection.length; i++) selection.push(app.selection[i]);
  var bounds = args.bounds || null;
  svgCode = ensureVectorizeBoundsMarker(svgCode);

  var svgFile = new File(Folder.temp.fsName + '/hopeflow_vectorized.svg');
  svgFile.encoding = 'UTF-8';
  svgFile.open('w');
  svgFile.write(svgCode);
  svgFile.close();

  try {
    var svgDoc = app.open(svgFile);
    if (svgDoc.pageItems.length > 0) {
      svgDoc.selectObjectsOnActiveArtboard();
      app.copy();
      svgDoc.close(SaveOptions.DONOTSAVECHANGES);
      doc.activate();
      app.paste();
      var imported = app.selection;
      if (bounds && imported && imported.length) {
        fitSelectionToBounds(imported, bounds);
      }
      if (app.selection && app.selection.length) {
        try {
          app.selection[0].name = isPreview ? '__HopeFlow_Vectorize_Preview__' : 'Vectorized Image';
        } catch (errName) {}
      }
      return $.hopeflow.utils.returnResult({ message: isPreview ? '矢量化预览已更新' : '图像已矢量化', count: imported.length || 1 });
    }
    svgDoc.close(SaveOptions.DONOTSAVECHANGES);
    doc.activate();
    app.selection = selection;
    return $.hopeflow.utils.returnError('SVG 中未包含可导入的图稿');
  } catch (err) {
    try { doc.activate(); } catch (ignore) {}
    return $.hopeflow.utils.returnError('SVG 导入失败: ' + (err.message || String(err)));
  } finally {
    try { if (svgFile.exists) svgFile.remove(); } catch (ignoreRemove) {}
  }
}

function removePreviewGroups() {
  if (!app.documents.length) return;
  var doc = app.activeDocument;
  for (var i = doc.pageItems.length - 1; i >= 0; i--) {
    var item = doc.pageItems[i];
    try {
      if (item.name === '__HopeFlow_Vectorize_Preview__') item.remove();
    } catch (err) {}
  }
}

function fitSelectionToBounds(items, targetBounds) {
  var group = app.activeDocument.groupItems.add();
  for (var i = items.length - 1; i >= 0; i--) {
    try { items[i].move(group, ElementPlacement.PLACEATBEGINNING); } catch (errMove) {}
  }
  var b = group.visibleBounds;
  var sourceW = Math.max(0.001, b[2] - b[0]);
  var sourceH = Math.max(0.001, b[1] - b[3]);
  var targetW = Math.max(0.001, targetBounds[2] - targetBounds[0]);
  var targetH = Math.max(0.001, targetBounds[1] - targetBounds[3]);
  group.resize(targetW / sourceW * 100, targetH / sourceH * 100, true, true, true, true, 100, Transformation.TOPLEFT);
  b = group.visibleBounds;
  group.translate(targetBounds[0] - b[0], targetBounds[1] - b[1]);
  group.name = 'Vectorized Image';
  preserveVectorizeBoundsMarker(group);
  app.selection = [group];
}

function preserveVectorizeBoundsMarker(container) {
  if (!container || !container.pageItems) return;
  for (var i = container.pageItems.length - 1; i >= 0; i--) {
    var item = container.pageItems[i];
    try {
      if (item.name === '__hopeflow_vector_bounds__') {
        item.opacity = 0.1;
        item.name = '__hopeflow_vector_bounds__';
        continue;
      }
      if (item.pageItems && item.pageItems.length) preserveVectorizeBoundsMarker(item);
    } catch (err) {}
  }
}

function ensureVectorizeBoundsMarker(svgCode) {
  if (svgCode.indexOf('__hopeflow_vector_bounds__') >= 0) return svgCode;
  var openTag = svgCode.match(/<svg\b[^>]*>/i);
  if (!openTag) return svgCode;
  var tag = openTag[0];
  var box = parseSvgBox(tag);
  if (!box) return svgCode;
  var marker = '<rect id="__hopeflow_vector_bounds__" x="' + box.x + '" y="' + box.y + '" width="' + box.width + '" height="' + box.height + '" fill="#FFFFFF" opacity="0.001"/>';
  return svgCode.replace(/<svg\b[^>]*>/i, tag + marker);
}

function parseSvgBox(svgTag) {
  var vb = svgTag.match(/\sviewBox=(["'])([^"']+)\1/i);
  if (vb && vb[2]) {
    var parts = vb[2].replace(/,/g, ' ').split(/\s+/);
    if (parts.length >= 4) {
      var x = num(parts[0], 0);
      var y = num(parts[1], 0);
      var w = num(parts[2], 0);
      var h = num(parts[3], 0);
      if (w > 0 && h > 0) return { x: x, y: y, width: w, height: h };
    }
  }
  var width = parseSvgLength(svgTag.match(/\swidth=(["'])([^"']+)\1/i));
  var height = parseSvgLength(svgTag.match(/\sheight=(["'])([^"']+)\1/i));
  if (width > 0 && height > 0) return { x: 0, y: 0, width: width, height: height };
  return null;
}

function parseSvgLength(match) {
  if (!match || !match[2]) return 0;
  return num(match[2], 0);
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

function num(value, fallback) {
  var n = parseFloat(String(value).replace(/,/g, '.'));
  return isNaN(n) ? fallback : n;
}

try {
  main();
} catch (err) {
  if ($.hopeflow && $.hopeflow.utils) $.hopeflow.utils.returnError(err.message || String(err));
}
