/**
 * 文档深度清理 (Document Deep Cleanup)
 * Ported from Christian Condamine's Nettoyage.jsx (dialog removed, params via panel).
 */
(function () {
    if (!$.hopeflow) return;

    var args = $.hopeflow.utils.getArgs();
    var target           = String(args.target || 'document');     // 'selection' | 'document'
    var expandBlends     = !!args.expandBlends;
    var expandLivePaint  = !!args.expandLivePaint;
    var expandEnvelopes  = !!args.expandEnvelopes;
    var expandAppearance = !!args.expandAppearance;
    var expandAll        = !!args.expandAll;
    var embedImages      = !!args.embedImages;
    var reduceImages     = !!args.reduceImages;
    var reduceDpi        = parseInt(args.reduceDpi || 150, 10);
    var guidesMode       = String(args.guidesMode || 'ignore');   // 'ignore' | 'delete' | 'moveLayer'
    var deleteEmptyLayers = !!args.deleteEmptyLayers;
    var deleteEmptyText   = !!args.deleteEmptyText;

    if (app.documents.length === 0) return $.hopeflow.utils.returnError('请先打开文档');
    var doc = app.activeDocument;
    var useSelection = (target === 'selection');
    var initialSel = useSelection ? [].concat(doc.selection || []) : null;
    var reports = [];
    var totalActions = 0;

    function selectAllIfNeeded() {
        if (!useSelection) app.executeMenuCommand('selectall');
    }
    function restoreSelectionIfNeeded() {
        if (useSelection && initialSel) {
            try {
                var live = [];
                for (var i = 0; i < initialSel.length; i++) {
                    try {
                        if (initialSel[i].typename) {
                            initialSel[i].selected = true;
                            live.push(initialSel[i]);
                        }
                    } catch (e) {}
                }
            } catch (e) {}
        }
    }

    // 1. Expand operations
    function runExpand(menuCmd, label) {
        try {
            selectAllIfNeeded();
            app.executeMenuCommand(menuCmd);
            reports.push(label);
            totalActions++;
        } catch (e) { reports.push(label + ' 失败：' + e.message); }
    }
    if (expandBlends)     runExpand('Path Blend Expand', '展开混合渐变');
    if (expandLivePaint)  runExpand('Expand Planet X', '展开实时上色');
    if (expandEnvelopes)  runExpand('Expand Envelope', '展开封套');
    if (expandAppearance) runExpand('expandStyle', '展开外观');
    if (expandAll) {
        try {
            selectAllIfNeeded();
            if (!expandAppearance) { try { app.executeMenuCommand('expandStyle'); } catch (e) {} }
            app.executeMenuCommand('Expand3');
            reports.push('全部展开');
            totalActions++;
        } catch (e) { reports.push('全部展开失败：' + e.message); }
    }

    // 2. Embed images
    if (embedImages) {
        try {
            var placed = [];
            for (var pi = doc.placedItems.length - 1; pi >= 0; pi--) {
                var p1 = doc.placedItems[pi];
                if (!useSelection || p1.selected) placed.push(p1);
            }
            var embCnt = 0;
            for (var px = placed.length - 1; px >= 0; px--) {
                try { placed[px].embed(); embCnt++; } catch (e) {}
            }
            reports.push('嵌入 ' + embCnt + ' 张链接图片');
            totalActions++;
        } catch (e) { reports.push('嵌入图片失败：' + e.message); }
    }

    // 3. Reduce image resolution
    if (reduceImages) {
        try {
            var rasters = [];
            for (var ri = doc.rasterItems.length - 1; ri >= 0; ri--) {
                var r1 = doc.rasterItems[ri];
                if (!useSelection || r1.selected) rasters.push(r1);
            }
            var opts = new RasterizeOptions();
            opts.resolution = reduceDpi || 72;
            opts.transparency = true;
            opts.antiAliasingMethod = AntiAliasingMethod.ARTOPTIMIZED;
            var rasCnt = 0;
            for (var rx = rasters.length - 1; rx >= 0; rx--) {
                try {
                    doc.rasterize(rasters[rx], rasters[rx].visibleBounds, opts);
                    rasCnt++;
                } catch (e) {}
            }
            reports.push('降分辨率 ' + rasCnt + ' 张图片到 ' + reduceDpi + ' dpi');
            totalActions++;
        } catch (e) { reports.push('降分辨率失败：' + e.message); }
    }

    // 4. Guides
    if (guidesMode !== 'ignore') {
        try {
            var guides = [];
            for (var gp = doc.pathItems.length - 1; gp >= 0; gp--) {
                var pp = doc.pathItems[gp];
                if (pp.guides && (!useSelection || pp.selected)) guides.push(pp);
            }
            if (guidesMode === 'delete') {
                for (var gd = 0; gd < guides.length; gd++) {
                    try { guides[gd].remove(); } catch (e) {}
                }
                reports.push('删除 ' + guides.length + ' 个辅助线');
            } else if (guidesMode === 'moveLayer') {
                var guideLayer = null;
                for (var gl = 0; gl < doc.layers.length; gl++) {
                    if (doc.layers[gl].name === 'Guides') { guideLayer = doc.layers[gl]; break; }
                }
                if (!guideLayer) { guideLayer = doc.layers.add(); guideLayer.name = 'Guides'; }
                for (var gm = 0; gm < guides.length; gm++) {
                    try { guides[gm].move(guideLayer, ElementPlacement.PLACEATEND); } catch (e) {}
                }
                reports.push('迁移 ' + guides.length + ' 个辅助线到 Guides 图层');
            }
            totalActions++;
        } catch (e) { reports.push('辅助线处理失败：' + e.message); }
    }

    // 5. Empty text frames / single dots / invisibles (uses built-in Cleanup)
    if (deleteEmptyText) {
        try {
            app.executeMenuCommand('cleanup menu item');
            reports.push('清理空文本框、孤立点、隐藏对象');
            totalActions++;
        } catch (e) { reports.push('清理空文本失败：' + e.message); }
    }

    // 6. Empty layers
    if (deleteEmptyLayers) {
        try {
            var empty = [];
            function findEmpty(container) {
                var ls = container.layers;
                for (var li = 0; li < ls.length; li++) {
                    var L = ls[li];
                    try {
                        L.canDelete = true;
                        if (L.layers.length > 0) findEmpty(L);
                        if (L.pageItems.length === 0 && L.canDelete) {
                            empty.push(L);
                        } else {
                            L.canDelete = false;
                            try { container.canDelete = false; } catch (e) {}
                        }
                    } catch (e) {}
                }
            }
            findEmpty(doc);
            var ecnt = 0;
            for (var ec = 0; ec < empty.length; ec++) {
                try { empty[ec].remove(); ecnt++; } catch (e) {}
            }
            reports.push('删除 ' + ecnt + ' 个空图层');
            totalActions++;
        } catch (e) { reports.push('删除空图层失败：' + e.message); }
    }

    if (totalActions === 0) {
        return $.hopeflow.utils.returnError('未选择任何清理动作');
    }

    return $.hopeflow.utils.returnResult({
        message: '清理完成：执行 ' + totalActions + ' 项',
        scope: useSelection ? '当前选区' : '整个文档',
        details: reports
    });
})();
