(function () {
    //测量路径长度
    function measurePathLength() {
        if (activeDocument.selection.length > 0) {
            var ver10 = (version.indexOf('10') == 0);
            var verCS1 = (version.indexOf('11') == 0);
            var verCS2 = (version.indexOf('12') == 0);
            main();

            function main() {
                var use_native_property = true;
                var font_size = 12;
                var font_name = "MyriadPro-Regular";
                var digit = 2;
                var use_mm_4_unit = true;
                var put_text_on_the_first_layer = false;
                var div_num = 1024;

                if (ver10 || verCS1 || verCS2) use_native_property = false;
                if (documents.length < 1) return;
                var sel = activeDocument.selection;
                if (!(sel instanceof Array) || sel.length < 1) return;

                var selected_paths = [];
                extractpaths(sel, 1, selected_paths);
                if (selected_paths.length < 1) return;

                var lay;
                if (put_text_on_the_first_layer) {
                    lay = activeDocument.layers[0];
                    if (lay.locked) lay.locked = false;
                    if (!lay.visible) lay.visible = true;
                } else {
                    lay = activeDocument.activeLayer;
                    if (lay.locked || !lay.visible) lay = selected_paths[0].layer;
                }

                var path_length = 0;
                var all_paths_length = 0;
                var unit = use_mm_4_unit ? "mm" : "";
                var position_to_write_result;
                var i, j, k;
                var path_points, segment_length;
                var results = [];

                for (i = 0; i < selected_paths.length; i++) {
                    if (use_native_property) {
                        path_length = selected_paths[i].length;
                    } else {
                        path_points = selected_paths[i].pathPoints;
                        for (j = 0; j < path_points.length; j++) {
                            if (j == path_points.length - 1) {
                                if (selected_paths[i].closed) k = 0;
                                else break;
                            } else { k = j + 1; }
                            segment_length = getLength([path_points[j].anchor, path_points[j].rightDirection,
                                path_points[k].leftDirection, path_points[k].anchor], div_num);
                            path_length += segment_length;
                        }
                    }
                    all_paths_length += path_length;
                    if (use_mm_4_unit) path_length = pt2mm(path_length);
                    position_to_write_result = findCenter(selected_paths[i]);
                    writeResultAsText(lay, fixedTo(path_length, digit) + unit, font_name, font_size, position_to_write_result, results);
                    path_length = 0;
                }

                if (selected_paths.length > 1) {
                    if (use_mm_4_unit) all_paths_length = pt2mm(all_paths_length);
                    position_to_write_result[1] -= font_size;
                    writeResultAsText(lay, "所有路径总长度: " + fixedTo(all_paths_length, digit) + unit, font_name, font_size, position_to_write_result, results);
                }
                activeDocument.selection = results.concat(selected_paths);
            }

            function getLength(q, div_num) {
                var div_unit = 1 / div_num;
                var m = [q[3][0]-q[0][0]+3*(q[1][0]-q[2][0]), q[0][0]-2*q[1][0]+q[2][0], q[1][0]-q[0][0]];
                var n = [q[3][1]-q[0][1]+3*(q[1][1]-q[2][1]), q[0][1]-2*q[1][1]+q[2][1], q[1][1]-q[0][1]];
                var k = [m[0]*m[0]+n[0]*n[0], 4*(m[0]*m[1]+n[0]*n[1]),
                    2*((m[0]*m[2]+n[0]*n[2])+2*(m[1]*m[1]+n[1]*n[1])),
                    4*(m[1]*m[2]+n[1]*n[2]), m[2]*m[2]+n[2]*n[2]];
                var fc = function(t,k){return Math.sqrt(t*(t*(t*(t*k[0]+k[1])+k[2])+k[3])+k[4])||0;};
                var total = 0; var i;
                for (i=1;i<div_num;i+=2) total+=fc(i*div_unit,k);
                total*=2;
                for (i=2;i<div_num;i+=2) total+=fc(i*div_unit,k);
                return (fc(0,k)+fc(1,k)+total*2)*div_unit;
            }

            function pt2mm(n) { return n * 0.35277778; }

            function writeResultAsText(lay, str, nam, siz, posi, results) {
                var tx = lay.textFrames.add();
                with (tx) {
                    contents = str;
                    with (textRange) {
                        with (characterAttributes) { size = siz; textFont = textFonts.getByName(nam); }
                        with (paragraphAttributes) { justification = Justification.LEFT; autoLeadingAmount = 120; }
                    }
                    position = [posi[0]-width/2, posi[1]+height/2];
                }
                results.push(tx);
            }

            function findCenter(pi) {
                var gb = pi.geometricBounds;
                return [(gb[0]+gb[2])/2, (gb[1]+gb[3])/2];
            }

            function extractpaths(s, pp_length_limit, paths) {
                for (var i = 0; i < s.length; i++) {
                    if (s[i].typename=="PathItem" && !s[i].guides && !s[i].clipping) {
                        if (pp_length_limit && s[i].pathPoints.length<=pp_length_limit) continue;
                        paths.push(s[i]);
                    } else if (s[i].typename=="GroupItem") {
                        extractpaths(s[i].pageItems, pp_length_limit, paths);
                    } else if (s[i].typename=="CompoundPathItem") {
                        extractpaths(s[i].pathItems, pp_length_limit, paths);
                    }
                }
            }

            function fixedTo(n, k) {
                var m = Math.pow(10,k); var s = (Math.round(n*m))+"";
                if (k<=0) return s;
                while (s.length<k+1) s="0"+s;
                var len = s.length-k;
                s = s.substr(0,len)+"."+s.substr(len,k);
                s = s.replace(/0+$/,"").replace(/\.$/,"");
                return s;
            }
        } else {
            alert("请选择至少1个对象");
        }
    }

    if ($.hopeflow) {
        if (!app.documents.length) return $.hopeflow.utils.returnError('请先打开一个文档');
        if (!app.activeDocument.selection || app.activeDocument.selection.length === 0) {
            return $.hopeflow.utils.returnError('请先选择路径对象');
        }
        measurePathLength();
        return $.hopeflow.utils.returnResult('success');
    } else {
        measurePathLength();
    }
})();
