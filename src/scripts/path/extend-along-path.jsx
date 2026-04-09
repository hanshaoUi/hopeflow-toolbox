/**
 * 沿路径延长 (Extend Along Path)
 * 将选中开放路径的端点沿切线方向延长指定长度
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var startLength = parseFloat(args.startLength);
    var endLength   = parseFloat(args.endLength);

    if (isNaN(startLength)) startLength = 10;
    if (isNaN(endLength))   endLength   = 10;

    var mmToPt = 2.83464567;
    var startLengthPt = startLength * mmToPt;
    var endLengthPt   = endLength   * mmToPt;

    if (app.documents.length === 0) return $.hopeflow.utils.returnError('无文档打开');
    if (app.selection.length === 0) return $.hopeflow.utils.returnError('请先选择路径');

    if (startLengthPt < 0.001 && endLengthPt < 0.001) {
        return $.hopeflow.utils.returnError('起点和终点延长量均为 0，无操作');
    }

    var doc = app.activeDocument;

    // ── 工具函数 ────────────────────────────────────────────────────────────────

    function normalize(dx, dy) {
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.0001) return { x: 0, y: 0 };
        return { x: dx / len, y: dy / len };
    }

    // 递归收集所有 PathItem（跳过 CompoundPathItem）
    function collectPaths(items, result) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.typename === 'PathItem') {
                result.push(item);
            } else if (item.typename === 'GroupItem') {
                collectPaths(item.pageItems, result);
            }
        }
    }

    // ── 延长单条路径 ────────────────────────────────────────────────────────────

    function processPath(path) {
        if (path.closed) return null;   // 跳过闭合路径
        var pts = path.pathPoints;
        if (pts.length < 2) return null;
        var n = pts.length;

        // 1. 收集所有节点数据
        var data = [];
        for (var i = 0; i < n; i++) {
            data.push({
                a: [pts[i].anchor[0],        pts[i].anchor[1]],
                l: [pts[i].leftDirection[0],  pts[i].leftDirection[1]],
                r: [pts[i].rightDirection[0], pts[i].rightDirection[1]],
                t: pts[i].pointType
            });
        }

        var newData = [];

        // 2. 起点延长 ─────────────────────────────────────────────────────────
        if (startLengthPt > 0.001) {
            var p0 = data[0];
            var p1 = data[1];
            var dx, dy;

            // 起点的出切方向 = anchor - rightDir（与路径走向相反）
            // 若无右手柄（线段），则用 anchor0 → anchor1 的反方向
            if (p0.r[0] !== p0.a[0] || p0.r[1] !== p0.a[1]) {
                dx = p0.a[0] - p0.r[0];
                dy = p0.a[1] - p0.r[1];
            } else {
                dx = p0.a[0] - p1.a[0];
                dy = p0.a[1] - p1.a[1];
            }
            var dir = normalize(dx, dy);

            if (dir.x !== 0 || dir.y !== 0) {
                var newA = [
                    p0.a[0] + dir.x * startLengthPt,
                    p0.a[1] + dir.y * startLengthPt
                ];
                // 新起点：右手柄指向原起点，形成直线连接
                newData.push({
                    a: newA.slice(),
                    l: newA.slice(),            // 外侧无手柄
                    r: [p0.a[0], p0.a[1]],     // 手柄朝向原起点
                    t: PointType.CORNER
                });
                // 原起点：左手柄缩回，与新点形成直线连接
                data[0] = {
                    a: p0.a.slice(),
                    l: [p0.a[0], p0.a[1]],     // 左手柄收回
                    r: p0.r.slice(),
                    t: PointType.CORNER
                };
            }
        }

        // 3. 复制原有节点
        for (var i = 0; i < data.length; i++) {
            newData.push(data[i]);
        }

        // 4. 终点延长 ─────────────────────────────────────────────────────────
        if (endLengthPt > 0.001) {
            var pn  = data[data.length - 1];
            var pn1 = data[data.length - 2];
            var dx, dy;

            // 终点的出切方向 = anchor - leftDir（沿路径走向继续延伸）
            // 若无左手柄（线段），则用 anchor(n-1) → anchor(n) 方向继续
            if (pn.l[0] !== pn.a[0] || pn.l[1] !== pn.a[1]) {
                dx = pn.a[0] - pn.l[0];
                dy = pn.a[1] - pn.l[1];
            } else {
                dx = pn.a[0] - pn1.a[0];
                dy = pn.a[1] - pn1.a[1];
            }
            var dir = normalize(dx, dy);

            if (dir.x !== 0 || dir.y !== 0) {
                var newA = [
                    pn.a[0] + dir.x * endLengthPt,
                    pn.a[1] + dir.y * endLengthPt
                ];
                // 原终点：右手柄缩回，形成直线连接
                newData[newData.length - 1] = {
                    a: pn.a.slice(),
                    l: pn.l.slice(),
                    r: [pn.a[0], pn.a[1]],     // 右手柄收回
                    t: PointType.CORNER
                };
                // 新终点：左手柄指向原终点
                newData.push({
                    a: newA.slice(),
                    l: [pn.a[0], pn.a[1]],     // 手柄朝向原终点
                    r: newA.slice(),            // 外侧无手柄
                    t: PointType.CORNER
                });
            }
        }

        // 5. 重建路径 ─────────────────────────────────────────────────────────
        var newPath = doc.pathItems.add();
        newPath.closed = false;

        // 复制描边 / 填色属性
        newPath.filled      = path.filled;
        newPath.stroked     = path.stroked;
        newPath.strokeWidth = path.strokeWidth;
        newPath.strokeCap   = path.strokeCap;
        newPath.strokeJoin  = path.strokeJoin;
        try { newPath.fillColor   = path.fillColor;   } catch (e) {}
        try { newPath.strokeColor = path.strokeColor; } catch (e) {}
        try { newPath.strokeDashes = path.strokeDashes; } catch (e) {}
        try { newPath.opacity     = path.opacity;     } catch (e) {}

        // 插入到原路径前面（保持层级位置）
        newPath.move(path, ElementPlacement.PLACEBEFORE);

        // 逐一添加节点
        for (var i = 0; i < newData.length; i++) {
            var pt = newPath.pathPoints.add();
            pt.anchor         = newData[i].a;
            pt.leftDirection  = newData[i].l;
            pt.rightDirection = newData[i].r;
            pt.pointType      = newData[i].t;
        }

        // 删除旧路径
        path.remove();

        return newPath;
    }

    // ── 主流程 ──────────────────────────────────────────────────────────────────

    var paths = [];
    collectPaths(doc.selection, paths);

    if (paths.length === 0) {
        return $.hopeflow.utils.returnError('所选对象中未找到路径');
    }

    var newPaths = [];
    for (var i = 0; i < paths.length; i++) {
        var result = processPath(paths[i]);
        if (result) newPaths.push(result);
    }

    if (newPaths.length === 0) {
        return $.hopeflow.utils.returnError('未找到可延长的开放路径（闭合路径将被跳过）');
    }

    // 更新选区
    doc.selection = null;
    for (var i = 0; i < newPaths.length; i++) {
        newPaths[i].selected = true;
    }

    var skipped = paths.length - newPaths.length;
    var msg = '已延长 ' + newPaths.length + ' 条路径';
    if (skipped > 0) msg += '（跳过 ' + skipped + ' 条闭合路径）';

    return $.hopeflow.utils.returnResult({ message: msg, count: newPaths.length });
})();
