/**
 * 批量画矩形 - Batch Draw Rectangles
 * 按指定宽度列表或比例绘制一排等高矩形。
 * Args: { widths, height, gap, totalWidth?, strokeWidth?, filled?, rows?, rowGap? }
 *   widths      逗号分隔的绝对宽度 "100,200,150"，或冒号分隔的比例 "1:2:1"
 *   height      矩形高度（文档单位）
 *   gap         列间距（文档单位）
 *   totalWidth  比例模式下的总宽度（文档单位），留 0 时自动取画板宽度
 *   strokeWidth 描边粗细，默认 0.5
 *   filled      是否填充，默认 false
 *   rows        行数，默认 1
 *   rowGap      行间距（文档单位），默认与 gap 相同
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();

    var widthsInput  = String(args.widths  || '100,200,100');
    var height       = parseFloat(args.height      || 50);
    var gap          = parseFloat(args.gap         || 5);
    var totalWidthMM = parseFloat(args.totalWidth  || 0);
    var strokeWidth  = parseFloat(args.strokeWidth || 0.5);
    var filled       = (args.filled === true || args.filled === 'true');
    var rows         = Math.max(1, parseInt(args.rows    || 1));
    var rowGap       = (args.rowGap !== undefined) ? parseFloat(args.rowGap) : gap;

    var mmToPt = $.hopeflow.utils.mmToPt;

    // ── 解析宽度 ──────────────────────────────────────────────────────────────
    var widthsPt  = [];
    var isRatio   = (widthsInput.indexOf(':') !== -1);

    if (isRatio) {
        var parts      = widthsInput.split(':');
        var ratios     = [];
        var totalRatio = 0;
        for (var i = 0; i < parts.length; i++) {
            var r = parseFloat(parts[i].replace(/\s/g, ''));
            if (!isNaN(r) && r > 0) { ratios.push(r); totalRatio += r; }
        }
        if (totalRatio <= 0 || ratios.length === 0) {
            return $.hopeflow.utils.returnError('无效的比例输入，示例: 1:2:1');
        }

        var ab       = $.hopeflow.utils.getActiveArtboardBounds();
        var basePt   = (totalWidthMM > 0)
                       ? mmToPt(totalWidthMM)
                       : (ab.right - ab.left - mmToPt(20) * 2);
        var totalGapPt    = (ratios.length - 1) * mmToPt(gap);
        var availableWidth = basePt - totalGapPt;

        for (var i = 0; i < ratios.length; i++) {
            widthsPt.push(availableWidth * ratios[i] / totalRatio);
        }
    } else {
        var parts = widthsInput.split(',');
        for (var i = 0; i < parts.length; i++) {
            var w = parseFloat(parts[i].replace(/\s/g, ''));
            if (!isNaN(w) && w > 0) { widthsPt.push(mmToPt(w)); }
        }
    }

    if (widthsPt.length === 0) {
        return $.hopeflow.utils.returnError('请输入有效的宽度值，示例: 100,200,150');
    }

    var heightPt  = mmToPt(height);
    var gapPt     = mmToPt(gap);
    var rowGapPt  = mmToPt(rowGap);

    // ── 起点：画板左上角内缩 20pt ─────────────────────────────────────────────
    var ab     = $.hopeflow.utils.getActiveArtboardBounds();
    var startX = ab.left   + mmToPt(20);
    var startY = ab.top    - mmToPt(20);

    var layer = $.hopeflow.utils.getOrCreateLayer('矩形排列');
    var group = layer.groupItems.add();
    var created = 0;

    for (var row = 0; row < rows; row++) {
        var currentX = startX;
        var currentY = startY - row * (heightPt + rowGapPt);

        for (var col = 0; col < widthsPt.length; col++) {
            var rect = group.pathItems.rectangle(currentY, currentX, widthsPt[col], heightPt);
            rect.stroked = true;
            rect.strokeWidth = strokeWidth;
            if (filled) {
                rect.filled = true;
            } else {
                rect.filled = false;
            }
            currentX += widthsPt[col] + gapPt;
            created++;
        }
    }

    return $.hopeflow.utils.returnResult({
        created : created,
        cols    : widthsPt.length,
        rows    : rows,
        mode    : isRatio ? 'ratio' : 'absolute'
    });
})();
