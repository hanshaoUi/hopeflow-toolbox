/**
 * 提取选中对象的轮廓点
 * 返回 JSON 格式的多边形数据供 NFP 算法使用
 */

// @include "../_runtime/utils.jsx"

(function () {
    var args = typeof __ARGS__ !== 'undefined' ? __ARGS__ : {};
    var tolerance = args.tolerance || 1; // 曲线采样精度 (pt)
    var simplify = args.simplify !== false;
    var simplifyTolerance = args.simplifyTolerance || 2;

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (!selection || selection.length === 0) {
        return JSON.stringify({
            success: false,
            error: '请选择对象'
        });
    }

    var polygons = [];

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];
        var contour = extractContour(item, tolerance);

        if (contour && contour.length >= 3) {
            // 简化多边形
            if (simplify) {
                contour = simplifyPolygon(contour, simplifyTolerance);
            }

            polygons.push({
                id: 'poly_' + i,
                index: i,
                name: item.name || ('对象' + (i + 1)),
                points: contour,
                bounds: getBounds(contour)
            });
        }
    }

    return JSON.stringify({
        success: true,
        data: {
            count: polygons.length,
            polygons: polygons
        }
    });

    // ========== 轮廓提取 ==========

    function extractContour(item, tolerance) {
        var points = [];

        // 处理不同类型的对象
        if (item.typename === 'PathItem') {
            points = extractPathPoints(item, tolerance);
        } else if (item.typename === 'CompoundPathItem') {
            // 复合路径取最外层
            if (item.pathItems.length > 0) {
                points = extractPathPoints(item.pathItems[0], tolerance);
            }
        } else if (item.typename === 'GroupItem') {
            // 组合对象 - 计算包围盒或合并轮廓
            points = extractGroupContour(item, tolerance);
        } else if (item.typename === 'TextFrame') {
            // 文本 - 先转换为轮廓
            var outlined = item.createOutline();
            if (outlined.typename === 'GroupItem' && outlined.compoundPathItems.length > 0) {
                points = extractPathPoints(outlined.compoundPathItems[0].pathItems[0], tolerance);
            } else if (outlined.typename === 'CompoundPathItem') {
                points = extractPathPoints(outlined.pathItems[0], tolerance);
            }
            outlined.remove();
        } else {
            // 其他对象使用边界框
            var bounds = item.geometricBounds;
            points = [
                { x: bounds[0], y: bounds[1] },
                { x: bounds[2], y: bounds[1] },
                { x: bounds[2], y: bounds[3] },
                { x: bounds[0], y: bounds[3] }
            ];
        }

        return points;
    }

    function extractPathPoints(pathItem, tolerance) {
        var points = [];
        var pathPoints = pathItem.pathPoints;

        for (var i = 0; i < pathPoints.length; i++) {
            var pp = pathPoints[i];
            var nextPP = pathPoints[(i + 1) % pathPoints.length];

            var anchor = pp.anchor;
            var rightDir = pp.rightDirection;
            var nextAnchor = nextPP.anchor;
            var leftDir = nextPP.leftDirection;

            // 检查是否是曲线（控制点不在锚点上）
            var isCurve = !pointsEqual(anchor, rightDir) || !pointsEqual(nextAnchor, leftDir);

            if (isCurve) {
                // 贝塞尔曲线采样
                var curvePoints = sampleBezier(
                    anchor[0], anchor[1],
                    rightDir[0], rightDir[1],
                    leftDir[0], leftDir[1],
                    nextAnchor[0], nextAnchor[1],
                    tolerance
                );
                for (var j = 0; j < curvePoints.length - 1; j++) {
                    points.push(curvePoints[j]);
                }
            } else {
                points.push({ x: anchor[0], y: anchor[1] });
            }
        }

        return points;
    }

    function extractGroupContour(group, tolerance) {
        // 对于组合对象，计算所有子对象的凸包
        var allPoints = [];

        for (var i = 0; i < group.pageItems.length; i++) {
            var child = group.pageItems[i];
            var childContour = extractContour(child, tolerance);
            for (var j = 0; j < childContour.length; j++) {
                allPoints.push(childContour[j]);
            }
        }

        // 计算凸包
        return convexHull(allPoints);
    }

    function pointsEqual(p1, p2) {
        return Math.abs(p1[0] - p2[0]) < 0.001 && Math.abs(p1[1] - p2[1]) < 0.001;
    }

    // ========== 贝塞尔曲线采样 ==========

    function sampleBezier(x0, y0, x1, y1, x2, y2, x3, y3, tolerance) {
        var points = [];
        var steps = estimateBezierSteps(x0, y0, x1, y1, x2, y2, x3, y3, tolerance);

        for (var i = 0; i <= steps; i++) {
            var t = i / steps;
            var mt = 1 - t;

            var x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
            var y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;

            points.push({ x: x, y: y });
        }

        return points;
    }

    function estimateBezierSteps(x0, y0, x1, y1, x2, y2, x3, y3, tolerance) {
        // 估算曲线长度来确定采样点数
        var d1 = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
        var d2 = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        var d3 = Math.sqrt((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2));
        var arcLength = d1 + d2 + d3;

        return Math.max(2, Math.ceil(arcLength / tolerance));
    }

    // ========== 多边形简化 (Douglas-Peucker) ==========

    function simplifyPolygon(points, epsilon) {
        if (points.length <= 3) return points;

        function perpDistance(point, lineStart, lineEnd) {
            var dx = lineEnd.x - lineStart.x;
            var dy = lineEnd.y - lineStart.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d === 0) return Math.sqrt((point.x - lineStart.x) * (point.x - lineStart.x) + (point.y - lineStart.y) * (point.y - lineStart.y));
            return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / d;
        }

        function simplify(pts, eps) {
            if (pts.length <= 2) return pts;

            var maxDist = 0;
            var maxIdx = 0;

            for (var i = 1; i < pts.length - 1; i++) {
                var dist = perpDistance(pts[i], pts[0], pts[pts.length - 1]);
                if (dist > maxDist) {
                    maxDist = dist;
                    maxIdx = i;
                }
            }

            if (maxDist > eps) {
                var left = simplify(pts.slice(0, maxIdx + 1), eps);
                var right = simplify(pts.slice(maxIdx), eps);
                return left.slice(0, -1).concat(right);
            } else {
                return [pts[0], pts[pts.length - 1]];
            }
        }

        return simplify(points, epsilon);
    }

    // ========== 凸包计算 (Graham Scan) ==========

    function convexHull(points) {
        if (points.length < 3) return points;

        // 找到最低点
        var lowest = 0;
        for (var i = 1; i < points.length; i++) {
            if (points[i].y < points[lowest].y ||
                (points[i].y === points[lowest].y && points[i].x < points[lowest].x)) {
                lowest = i;
            }
        }

        // 交换到首位
        var temp = points[0];
        points[0] = points[lowest];
        points[lowest] = temp;

        var pivot = points[0];

        // 按极角排序
        var sorted = points.slice(1).sort(function (a, b) {
            var angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
            var angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
            return angleA - angleB;
        });

        var hull = [pivot];

        for (var i = 0; i < sorted.length; i++) {
            while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0) {
                hull.pop();
            }
            hull.push(sorted[i]);
        }

        return hull;
    }

    function cross(o, a, b) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    // ========== 辅助函数 ==========

    function getBounds(points) {
        var minX = Infinity, minY = Infinity;
        var maxX = -Infinity, maxY = -Infinity;

        for (var i = 0; i < points.length; i++) {
            if (points[i].x < minX) minX = points[i].x;
            if (points[i].y < minY) minY = points[i].y;
            if (points[i].x > maxX) maxX = points[i].x;
            if (points[i].y > maxY) maxY = points[i].y;
        }

        return {
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

})();
