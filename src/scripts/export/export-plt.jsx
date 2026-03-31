(function () {
    /* export-plt.jsx - 导出为 PLT (HPGL) 格式 */
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

    function bezierPoint(t,p0,p1,p2,p3) {
        var t2=t*t,t3=t2*t,mt=1-t,mt2=mt*mt,mt3=mt2*mt;
        return [mt3*p0[0]+3*mt2*t*p1[0]+3*mt*t2*p2[0]+t3*p3[0], mt3*p0[1]+3*mt2*t*p1[1]+3*mt*t2*p2[1]+t3*p3[1]];
    }

    function pointToLineDistance(point,lineStart,lineEnd) {
        var px=point[0],py=point[1],x1=lineStart[0],y1=lineStart[1],x2=lineEnd[0],y2=lineEnd[1];
        var A=px-x1,B=py-y1,C=x2-x1,D=y2-y1;
        var dot=A*C+B*D,lenSq=C*C+D*D;
        if (lenSq==0) return Math.sqrt(A*A+B*B);
        var param=dot/lenSq,xx,yy;
        if (param<0){xx=x1;yy=y1;}else if(param>1){xx=x2;yy=y2;}else{xx=x1+param*C;yy=y1+param*D;}
        return Math.sqrt((px-xx)*(px-xx)+(py-yy)*(py-yy));
    }

    function adaptiveSubdivide(p0,p1,p2,p3,tolerance,result,depth) {
        if (depth>30){result.push(p3);return;}
        var mid=bezierPoint(0.5,p0,p1,p2,p3);
        if (pointToLineDistance(mid,p0,p3)<=tolerance) { result.push(p3); }
        else {
            var p01=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2],p12=[(p1[0]+p2[0])/2,(p1[1]+p2[1])/2],
                p23=[(p2[0]+p3[0])/2,(p2[1]+p3[1])/2];
            var p012=[(p01[0]+p12[0])/2,(p01[1]+p12[1])/2],p123=[(p12[0]+p23[0])/2,(p12[1]+p23[1])/2];
            var p0123=[(p012[0]+p123[0])/2,(p012[1]+p123[1])/2];
            adaptiveSubdivide(p0,p01,p012,p0123,tolerance,result,depth+1);
            adaptiveSubdivide(p0123,p123,p23,p3,tolerance,result,depth+1);
        }
    }

    function hasCurve(point) {
        var a=point.anchor,l=point.leftDirection,r=point.rightDirection;
        return !(Math.abs(l[0]-a[0])<0.01&&Math.abs(l[1]-a[1])<0.01&&Math.abs(r[0]-a[0])<0.01&&Math.abs(r[1]-a[1])<0.01);
    }

    function exportToPLT() {
        if (app.documents.length===0) { alert("请先打开一个文档"); return; }
        var doc = app.activeDocument;
        var allPaths = [];
        for (var i=0;i<doc.pathItems.length;i++) allPaths.push(doc.pathItems[i]);
        if (allPaths.length===0) { alert("没有找到路径对象！"); return; }

        var dialog = new Window("dialog","导出 PLT (HPGL) @HOPE"); dialog.alignChildren="fill";
        var ptToMM=0.3528,pluToMM=0.025;
        var docUnit="pt"; var recommendedScale=40;
        switch(doc.rulerUnits) {
            case RulerUnits.Millimeters: docUnit="mm"; recommendedScale=Math.round(ptToMM/pluToMM*10)/10; break;
            case RulerUnits.Centimeters: docUnit="cm"; recommendedScale=Math.round(ptToMM*10/pluToMM*10)/10; break;
            case RulerUnits.Inches: docUnit="in"; recommendedScale=Math.round(25.4/72/pluToMM*10)/10; break;
        }
        var scalePanel=dialog.add("panel",undefined,"导出设置");
        var ratioGroup=scalePanel.add("group"); ratioGroup.add("statictext",undefined,"输出比例:");
        var ratioDropdown=ratioGroup.add("dropdownlist",undefined,["1:1 (原尺寸)","1:2 (放大2倍)","2:1 (缩小到1/2)","1:10 (放大10倍)","自定义"]);
        ratioDropdown.selection=0;
        var customGroup=scalePanel.add("group"); customGroup.add("statictext",undefined,"自定义比例:");
        var customInput=customGroup.add("edittext",undefined,"1:1"); customInput.characters=8; customGroup.enabled=false;
        ratioDropdown.onChange=function(){customGroup.enabled=(ratioDropdown.selection.index===4);};
        var flipGroup=scalePanel.add("group"); var flipYCheckbox=flipGroup.add("checkbox",undefined,"翻转 Y 轴"); flipYCheckbox.value=false;
        var qualityPanel=dialog.add("panel",undefined,"曲线质量");
        var toleranceDropdown=qualityPanel.add("dropdownlist",undefined,["超精细 (0.01)","极精细 (0.02)","极高 (0.05)","高 (0.1)","中等 (0.2)","低 (0.5)"]);
        toleranceDropdown.selection=3;
        var buttons=dialog.add("group"); buttons.alignment="center";
        buttons.add("button",undefined,"导出",{name:"ok"}); buttons.add("button",undefined,"取消",{name:"cancel"});
        if (dialog.show()!=1) return;

        var userRatio=(ratioDropdown.selection.index===4)?customInput.text:["1:1","1:2","2:1","1:10"][ratioDropdown.selection.index];
        var ratioParts=userRatio.split(":");
        var scale=recommendedScale*parseFloat(ratioParts[1])/parseFloat(ratioParts[0]);
        var tolerance=[0.01,0.02,0.05,0.1,0.2,0.5][toleranceDropdown.selection.index];
        var flipY=flipYCheckbox.value;
        var saveFile=File.saveDialog("保存 PLT 文件","PLT files:*.plt");
        if (!saveFile) return;
        if (saveFile.name.indexOf(".plt")==-1) saveFile=new File(saveFile.fullName+".plt");

        var minX=Infinity,maxY=-Infinity;
        for (var idx=0;idx<allPaths.length;idx++) {
            var p=allPaths[idx];
            if (p.hidden||!p.pathPoints||p.pathPoints.length==0) continue;
            for (var pidx=0;pidx<p.pathPoints.length;pidx++) {
                if (p.pathPoints[pidx].anchor[0]<minX) minX=p.pathPoints[pidx].anchor[0];
                if (p.pathPoints[pidx].anchor[1]>maxY) maxY=p.pathPoints[pidx].anchor[1];
            }
        }
        var offsetX=-minX,offsetY=-maxY;
        function transformCoord(x,y) {
            var newX=(x+offsetX)*scale,newY=(y+offsetY)*scale;
            if (flipY) newY=-newY;
            return [Math.round(newX),Math.round(newY)];
        }

        var hpgl=["IN;","SP1;","PU;"];
        for (var i2=0;i2<allPaths.length;i2++) {
            var path=allPaths[i2];
            if (path.hidden||!path.pathPoints||path.pathPoints.length==0) continue;
            var points=path.pathPoints;
            var startCoords=transformCoord(points[0].anchor[0],points[0].anchor[1]);
            hpgl.push("PU"+startCoords[0]+","+startCoords[1]+";");
            var coords=[];
            for (var j=0;j<points.length;j++) {
                var curr=points[j],next=points[(j+1)%points.length];
                if (j===points.length-1&&!path.closed) break;
                if (hasCurve(curr)||hasCurve(next)) {
                    var subdivPoints=[];
                    adaptiveSubdivide(curr.anchor,curr.rightDirection,next.leftDirection,next.anchor,tolerance,subdivPoints,0);
                    for (var s=0;s<subdivPoints.length;s++) { var tc=transformCoord(subdivPoints[s][0],subdivPoints[s][1]); coords.push(tc[0]+","+tc[1]); }
                } else {
                    var endCoords=transformCoord(next.anchor[0],next.anchor[1]); coords.push(endCoords[0]+","+endCoords[1]);
                }
            }
            if (coords.length>0) hpgl.push("PD"+coords.join(",")+";");
            hpgl.push("PU;");
        }
        hpgl.push("PU0,0;SP0;");
        try {
            saveFile.encoding="ASCII"; saveFile.open("w"); saveFile.write(hpgl.join("\n")); saveFile.close();
            alert("PLT 导出成功！\n文件: "+saveFile.fsName);
        } catch (e) { alert("导出失败: "+e.message); }
    }

    if ($.hopeflow) {
        exportToPLT();
        return $.hopeflow.utils.returnResult('success');
    } else if (!$.hopeflow) {
        exportToPLT();
    }
})();
