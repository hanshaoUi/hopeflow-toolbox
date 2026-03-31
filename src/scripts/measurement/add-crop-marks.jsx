(function () {
    //添加裁切标记
    function addCropMarks(params) {
        var ratio = params ? params.ratio : 1;
        var marginMM = params ? params.marginMM : 5;
        var dotSizeMM = params ? params.dotSizeMM : 8;
        var isConfusion = params ? params.isConfusion : false;
        var addLShape = params ? params.addLShape : false;

        if (isNaN(ratio) || isNaN(marginMM) || isNaN(dotSizeMM)) { alert('请输入有效的数值。'); return; }
        if (app.documents.length == 0) { alert("请先建立一个新文件", "错误"); return; }

        if (app.activeDocument.selection.length > 0) {
            var docRef = app.activeDocument;
            var selection = docRef.selection;
            var bounds = selection[0].visibleBounds;
            var mmToPoints = 72 / 25.4;
            var radius = (dotSizeMM * mmToPoints / 2) / ratio;
            var offset = (marginMM * mmToPoints) / ratio;

            var newLayer;
            try { newLayer = docRef.layers.getByName('裁切标记'); }
            catch (e) { newLayer = docRef.layers.add(); newLayer.name = '裁切标记'; }

            var circlePoints = [
                { x: bounds[0]-offset, y: bounds[1]+offset },
                { x: bounds[2]+offset, y: bounds[1]+offset },
                { x: bounds[2]+offset, y: bounds[3]-offset },
                { x: bounds[0]-offset, y: bounds[3]-offset }
            ];

            if (isConfusion) {
                var centerX = (bounds[0]+bounds[2])/2;
                var halfWidthPlusOffset = ((bounds[2]-bounds[0])/2)+offset;
                var confusionOffset = halfWidthPlusOffset * 0.5;
                circlePoints[2].x = centerX + confusionOffset;
                circlePoints[3].x = centerX - confusionOffset;
            }

            for (var i = 0; i < circlePoints.length; i++) {
                var circle = newLayer.pathItems.ellipse(circlePoints[i].y+radius, circlePoints[i].x-radius, radius*2, radius*2);
                circle.stroked = false; circle.filled = true;
                var cmykColor = new CMYKColor();
                cmykColor.cyan=0; cmykColor.magenta=0; cmykColor.yellow=0; cmykColor.black=100;
                circle.fillColor = cmykColor;
            }

            if (addLShape) {
                var lineLength = (20*mmToPoints)/ratio;
                var lineWidth = (1*mmToPoints)/ratio;
                var cornerPoints = [
                    { x: bounds[0]-offset, y: bounds[1]+offset },
                    { x: bounds[2]+offset, y: bounds[1]+offset },
                    { x: bounds[2]+offset, y: bounds[3]-offset },
                    { x: bounds[0]-offset, y: bounds[3]-offset }
                ];
                for (var j = 0; j < cornerPoints.length; j++) {
                    var lShapePath = newLayer.pathItems.add();
                    var lPathPoints; var cp = cornerPoints[j];
                    var adj = 6*mmToPoints/ratio;
                    switch (j) {
                        case 0: lPathPoints=[[cp.x+radius+adj,cp.y+radius+adj],[cp.x+radius-lineLength+adj,cp.y+radius+adj],[cp.x+radius-lineLength+adj,cp.y+radius-lineLength+adj]]; break;
                        case 1: lPathPoints=[[cp.x-radius-adj,cp.y+radius+adj],[cp.x-radius+lineLength-adj,cp.y+radius+adj],[cp.x-radius+lineLength-adj,cp.y+radius-lineLength+adj]]; break;
                        case 2: lPathPoints=[[cp.x-radius-adj,cp.y-radius-adj],[cp.x-radius+lineLength-adj,cp.y-radius-adj],[cp.x-radius+lineLength-adj,cp.y-radius+lineLength-adj]]; break;
                        case 3: lPathPoints=[[cp.x+radius+adj,cp.y-radius-adj],[cp.x+radius-lineLength+adj,cp.y-radius-adj],[cp.x+radius-lineLength+adj,cp.y-radius+lineLength-adj]]; break;
                    }
                    lShapePath.setEntirePath(lPathPoints.reverse());
                    lShapePath.stroked=true; lShapePath.strokeWidth=lineWidth;
                    var strokeColor=new RGBColor(); strokeColor.red=0; strokeColor.green=0; strokeColor.blue=0;
                    lShapePath.strokeColor=strokeColor; lShapePath.filled=false;
                }
            }
        } else {
            alert("请先选中一个对象");
        }
    }

    if ($.hopeflow) {
        var args = $.hopeflow.utils.getArgs();
        addCropMarks({
            ratio: parseFloat(args.ratio) || 1,
            marginMM: parseFloat(args.marginMM) || 5,
            dotSizeMM: parseFloat(args.dotSizeMM) || 8,
            isConfusion: args.isConfusion === 'true' || args.isConfusion === true,
            addLShape: args.addLShape === 'true' || args.addLShape === true
        });
        return $.hopeflow.utils.returnResult('success');
    } else {
        function showGUI() {
            var dialog = new Window('dialog', '输入参数 @HOPE');
            dialog.orientation = 'column'; dialog.alignChildren = 'left';
            var ratioGroup = dialog.add('group');
            ratioGroup.add('statictext', undefined, '比例:  1: ');
            var ratioInput = ratioGroup.add('edittext', undefined, '1'); ratioInput.characters = 5;
            var marginGroup = dialog.add('group');
            marginGroup.add('statictext', undefined, '边距 (mm):');
            var marginInput = marginGroup.add('edittext', undefined, '5'); marginInput.characters = 5;
            var dotSizeGroup = dialog.add('group');
            dotSizeGroup.add('statictext', undefined, '圆点大小 (mm):');
            var dotSizeInput = dotSizeGroup.add('edittext', undefined, '8'); dotSizeInput.characters = 5;
            var lShapeCheckbox = dialog.add('checkbox', undefined, '添加L角线');
            var confusionCheckbox = dialog.add('checkbox', undefined, '混淆 (底部圆点向两边偏移 50%)');
            var buttonGroup = dialog.add('group'); buttonGroup.alignment = 'center';
            buttonGroup.add('button', undefined, '确认', { name: 'ok' });
            buttonGroup.add('button', undefined, '取消', { name: 'cancel' });
            if (dialog.show() == 1) {
                addCropMarks({ ratio: parseFloat(ratioInput.text), marginMM: parseFloat(marginInput.text),
                    dotSizeMM: parseFloat(dotSizeInput.text), isConfusion: confusionCheckbox.value, addLShape: lShapeCheckbox.value });
            }
        }
        showGUI();
    }
})();
