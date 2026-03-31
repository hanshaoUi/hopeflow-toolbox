/**
 * 智能分组 - Auto Group by Intersection
 * Automatically group objects based on their intersection relationships
 * Args: { tolerance: number }
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();

    // 获取容差值（文档单位）
    var toleranceInDocUnits = (args && args.tolerance !== undefined) ? args.tolerance : 0;

    // 转换为点（pt）
    var groupAutoParam = convertToPoints(toleranceInDocUnits);

    // 单位转换函数
    function convertToPoints(value) {
        if (!app.documents.length) return value;
        var u = app.activeDocument.rulerUnits;
        switch (u) {
            case RulerUnits.Millimeters: return value / 0.352778; // mm to pt
            case RulerUnits.Centimeters: return value / 0.0352778; // cm to pt
            case RulerUnits.Inches: return value * 72; // in to pt
            case RulerUnits.Points: return value; // pt to pt
            case RulerUnits.Picas: return value * 12; // pc to pt
            case RulerUnits.Pixels: return value * 0.75; // px to pt (96 DPI)
            default: return value;
        }
    }

    // =========================================================================
    // --- 辅助函数 ---
    // =========================================================================

    function FXGetBounds(items, hasStroke, limit) {
        limit = limit || 2000;
        var bounds = {
            left: Infinity,
            top: -Infinity,
            right: -Infinity,
            bottom: Infinity,
            maxWidth: 0,
            maxHeight: 0
        };

        if (!items) return bounds;

        function getBounds(item) {
            try {
                if (!item) return;

                if (item.typename === 'TextFrame' || item.typename === 'TextPath' || item.typename === 'TextArtItem') {
                    var textBounds = hasStroke ? item.visibleBounds : item.geometricBounds;
                    if (textBounds && textBounds.length === 4) {
                        updateBounds(textBounds);
                    }
                    return;
                }

                if (item instanceof Array) {
                    for (var j = 0; j < item.length && j < limit; j++) {
                        getBounds(item[j]);
                    }
                    return;
                }

                if (item.typename === 'GroupItem') {
                    if (item.pageItems && item.pageItems.length < limit) {
                        if (item.clipped && item.pageItems.length > 0) {
                            var firstItem = item.pageItems[0];
                            if (firstItem) {
                                var firstItemBounds = hasStroke ? firstItem.visibleBounds : firstItem.geometricBounds;
                                if (firstItemBounds && firstItemBounds.length === 4) {
                                    updateBounds(firstItemBounds);
                                }
                            }
                        } else {
                            for (var i = 0; i < item.pageItems.length; i++) {
                                getBounds(item.pageItems[i]);
                            }
                        }
                    }
                    return;
                }

                if (item.geometricBounds || item.visibleBounds) {
                    var itemBounds = hasStroke ? item.visibleBounds : item.geometricBounds;
                    if (itemBounds && itemBounds.length === 4) {
                        updateBounds(itemBounds);
                    }
                }
            } catch (e) {
                try {
                    if (items && items.geometricBounds && items.geometricBounds.length === 4) {
                        bounds = {
                            left: items.geometricBounds[0],
                            top: items.geometricBounds[1],
                            right: items.geometricBounds[2],
                            bottom: items.geometricBounds[3],
                            maxWidth: Math.abs(items.geometricBounds[2] - items.geometricBounds[0]),
                            maxHeight: Math.abs(items.geometricBounds[1] - items.geometricBounds[3])
                        };
                    }
                } catch (backupError) {}
            }
        }

        function updateBounds(itemBounds) {
            if (!itemBounds || itemBounds.length !== 4 ||
                isNaN(itemBounds[0]) || isNaN(itemBounds[1]) ||
                isNaN(itemBounds[2]) || isNaN(itemBounds[3])) {
                return;
            }

            bounds.left = Math.min(bounds.left, itemBounds[0]);
            bounds.top = Math.max(bounds.top, itemBounds[1]);
            bounds.right = Math.max(bounds.right, itemBounds[2]);
            bounds.bottom = Math.min(bounds.bottom, itemBounds[3]);
            bounds.maxWidth = Math.max(bounds.maxWidth, Math.abs(itemBounds[2] - itemBounds[0]));
            bounds.maxHeight = Math.max(bounds.maxHeight, Math.abs(itemBounds[1] - itemBounds[3]));
        }

        getBounds(items);

        if (bounds.left === Infinity || bounds.bottom === Infinity ||
            bounds.right === -Infinity || bounds.top === -Infinity) {
            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                maxWidth: 0,
                maxHeight: 0
            };
        }

        return bounds;
    }

    function getItemBounds(item, hasStroke) {
        if (item.typename !== 'GroupItem' || !item.clipped) {
            var gb = item.geometricBounds;
            return { left: gb[0], top: gb[1], right: gb[2], bottom: gb[3] };
        }
        return FXGetBounds(item, hasStroke);
    }

    // =========================================================================
    // --- 并查集类 ---
    // =========================================================================

    function UnionFind(size) {
        this.parent = new Array(size);
        this.rank = new Array(size);
        for (var i = 0; i < size; i++) {
            this.parent[i] = i;
            this.rank[i] = 0;
        }
    }

    UnionFind.prototype.find = function(i) {
        if (this.parent[i] !== i) {
            this.parent[i] = this.find(this.parent[i]);
        }
        return this.parent[i];
    };

    UnionFind.prototype.union = function(i, j) {
        var rootI = this.find(i);
        var rootJ = this.find(j);
        if (rootI !== rootJ) {
            if (this.rank[rootI] < this.rank[rootJ]) {
                this.parent[rootI] = rootJ;
            } else if (this.rank[rootI] > this.rank[rootJ]) {
                this.parent[rootJ] = rootI;
            } else {
                this.parent[rootJ] = rootI;
                this.rank[rootI]++;
            }
            return true;
        }
        return false;
    };

    UnionFind.prototype.connected = function(i, j) {
        return this.find(i) === this.find(j);
    };

    // =========================================================================
    // --- 碰撞检测函数 ---
    // =========================================================================

    function boundsIntersect(b1, b2, tolerance) {
        tolerance = tolerance || 0;
        return !(b1.right + tolerance < b2.left ||
                 b2.right + tolerance < b1.left ||
                 b1.bottom - tolerance > b2.top ||
                 b2.bottom - tolerance > b1.top);
    }

    function getPathPoints(item) {
        var points = [];
        if (item.typename === 'PathItem' && item.pathPoints) {
            for (var i = 0; i < item.pathPoints.length; i++) {
                var pp = item.pathPoints[i];
                points.push([pp.anchor[0], pp.anchor[1]]);
            }
        }
        return points;
    }

    function segmentsIntersect(a, b, c, d, tolerance) {
        tolerance = tolerance || 0.01;

        function minMax(a, b) {
            return a < b ? [a, b] : [b, a];
        }

        var mmAx = minMax(a[0], b[0]);
        var mmAy = minMax(a[1], b[1]);
        var mmBx = minMax(c[0], d[0]);
        var mmBy = minMax(c[1], d[1]);

        if (mmAx[1] + tolerance < mmBx[0] || mmBx[1] + tolerance < mmAx[0]) return false;
        if (mmAy[1] + tolerance < mmBy[0] || mmBy[1] + tolerance < mmAy[0]) return false;

        function distSq(p1, p2) {
            var dx = p1[0] - p2[0];
            var dy = p1[1] - p2[1];
            return dx * dx + dy * dy;
        }

        if (distSq(a, b) < tolerance * tolerance || distSq(c, d) < tolerance * tolerance) return false;
        if (distSq(a, c) < tolerance * tolerance || distSq(a, d) < tolerance * tolerance) return false;
        if (distSq(b, c) < tolerance * tolerance || distSq(b, d) < tolerance * tolerance) return false;

        var area1 = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        var area2 = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
        var area3 = (d[0] - c[0]) * (a[1] - c[1]) - (d[1] - c[1]) * (a[0] - c[0]);
        var area4 = (d[0] - c[0]) * (b[1] - c[1]) - (d[1] - c[1]) * (b[0] - c[0]);

        if (area1 * area2 < 0 && area3 * area4 < 0) return true;

        var tol2 = tolerance * tolerance;
        if (distSq(a, c) < tol2 || distSq(a, d) < tol2 || distSq(b, c) < tol2 || distSq(b, d) < tol2) return true;

        return false;
    }

    function isPointInPolygon(point, vs) {
        var x = point[0], y = point[1];
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];
            var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function pathsIntersect(pts1, pts2, tolerance) {
        if (pts1.length < 2 || pts2.length < 2) return false;

        for (var i = 0; i < pts1.length; i++) {
            var a = pts1[i];
            var b = pts1[(i + 1) % pts1.length];
            for (var j = 0; j < pts2.length; j++) {
                var c = pts2[j];
                var d = pts2[(j + 1) % pts2.length];
                if (segmentsIntersect(a, b, c, d, tolerance)) {
                    return true;
                }
            }
        }

        if (pts1.length > 0 && pts2.length > 2) {
            if (isPointInPolygon(pts1[0], pts2)) return true;
        }
        if (pts2.length > 0 && pts1.length > 2) {
            if (isPointInPolygon(pts2[0], pts1)) return true;
        }

        return false;
    }

    function itemsIntersect(item1, item2, tolerance) {
        var b1 = getItemBounds(item1, false);
        var b2 = getItemBounds(item2, false);

        if (!boundsIntersect(b1, b2, tolerance)) {
            return false;
        }

        var pts1 = getPathPoints(item1);
        var pts2 = getPathPoints(item2);

        if (pts1.length > 0 && pts2.length > 0) {
            return pathsIntersect(pts1, pts2, tolerance);
        }

        return true;
    }

    // =========================================================================
    // --- 主函数 ---
    // =========================================================================

    function main() {
        if (!app.documents.length) {
            return $.hopeflow.utils.returnError('没有打开的文档');
        }

        var doc = app.activeDocument;
        var sel = doc.selection;

        var items = [];

        // 如果没有选择对象，则处理当前图层的所有对象
        if (!sel || sel.length === 0) {
            var layer = doc.activeLayer;
            if (!layer || !layer.pageItems || layer.pageItems.length === 0) {
                return $.hopeflow.utils.returnError('当前图层没有对象');
            }
            for (var i = 0; i < layer.pageItems.length; i++) {
                items.push(layer.pageItems[i]);
            }
        } else {
            for (var i = 0; i < sel.length; i++) {
                items.push(sel[i]);
            }
        }

        var n = items.length;
        if (n < 2) {
            return $.hopeflow.utils.returnResult({
                success: true,
                message: '只有一个对象，无需分组'
            });
        }

        var uf = new UnionFind(n);
        var tolerance = groupAutoParam;

        for (var i = 0; i < n; i++) {
            for (var j = i + 1; j < n; j++) {
                if (itemsIntersect(items[i], items[j], tolerance)) {
                    uf.union(i, j);
                }
            }
        }

        var groups = {};
        for (var i = 0; i < n; i++) {
            var root = uf.find(i);
            if (!groups[root]) {
                groups[root] = [];
            }
            groups[root].push(items[i]);
        }

        var groupCount = 0;
        for (var key in groups) {
            if (groups.hasOwnProperty(key)) {
                var members = groups[key];
                if (members.length > 1) {
                    var newGroup = doc.groupItems.add();
                    for (var m = 0; m < members.length; m++) {
                        members[m].moveToBeginning(newGroup);
                    }
                    groupCount++;
                }
            }
        }

        return $.hopeflow.utils.returnResult({
            success: true,
            message: '成功创建 ' + groupCount + ' 个分组'
        });
    }

    try {
        return main();
    } catch (e) {
        return $.hopeflow.utils.returnError('分组失败: ' + e.message);
    }
})();
