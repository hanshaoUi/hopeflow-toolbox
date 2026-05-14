(function () {
    function numberArg(value, fallback) {
        var num = parseFloat(value);
        return isNaN(num) ? fallback : num;
    }

    function boolArg(value, fallback) {
        if (value === undefined) return fallback;
        return value === true || value === 'true';
    }

    function blackRgb() {
        var color = new RGBColor();
        color.red = 0;
        color.green = 0;
        color.blue = 0;
        return color;
    }

    function blackCmyk() {
        var color = new CMYKColor();
        color.cyan = 0;
        color.magenta = 0;
        color.yellow = 0;
        color.black = 100;
        return color;
    }

    function getSelectionBounds(items, useVisibleBounds) {
        var result = null;
        for (var i = 0; i < items.length; i++) {
            var b = useVisibleBounds ? items[i].visibleBounds : items[i].geometricBounds;
            if (!result) {
                result = [b[0], b[1], b[2], b[3]];
            } else {
                if (result[0] > b[0]) result[0] = b[0];
                if (result[1] < b[1]) result[1] = b[1];
                if (result[2] < b[2]) result[2] = b[2];
                if (result[3] > b[3]) result[3] = b[3];
            }
        }
        return result;
    }

    function addPrepressCropMarks(params) {
        var ratio = numberArg(params ? params.ratio : undefined, 1);
        var lineType = params && params.lineType ? String(params.lineType) : 'japanese';
        var lineLengthMM = numberArg(params ? params.lineLengthMM : undefined, 6);
        var lineBleedMM = numberArg(params ? params.lineBleedMM : undefined, 3);
        var lineStrokePt = numberArg(params ? params.lineStrokePt : undefined, 0.25);
        var includeStrokeBounds = boolArg(params ? params.includeStrokeBounds : undefined, false);
        var addRegistration = boolArg(params ? params.addRegistration : undefined, true);
        var registrationCircle = boolArg(params ? params.registrationCircle : undefined, true);
        var addBisectors = boolArg(params ? params.addBisectors : undefined, true);
        var hBisector = numberArg(params ? params.hBisector : undefined, 2);
        var vBisector = numberArg(params ? params.vBisector : undefined, 4);
        var hBSpaceMM = numberArg(params ? params.hBSpaceMM : undefined, 6);
        var vBSpaceMM = numberArg(params ? params.vBSpaceMM : undefined, 6);
        var showDots = boolArg(params ? params.showDots : undefined, true);
        var bottomConfusion = boolArg(params ? params.bottomConfusion : undefined, false);
        var dotSizeMM = numberArg(params ? params.dotSizeMM : undefined, 1);
        var dotTLXMM = numberArg(params ? params.dotTLXMM : undefined, 0);
        var dotTLYMM = numberArg(params ? params.dotTLYMM : undefined, 0);
        var dotTRXMM = numberArg(params ? params.dotTRXMM : undefined, 0);
        var dotTRYMM = numberArg(params ? params.dotTRYMM : undefined, 0);
        var dotBRXMM = numberArg(params ? params.dotBRXMM : undefined, 0);
        var dotBRYMM = numberArg(params ? params.dotBRYMM : undefined, 0);
        var dotBLXMM = numberArg(params ? params.dotBLXMM : undefined, 0);
        var dotBLYMM = numberArg(params ? params.dotBLYMM : undefined, 0);

        if (ratio <= 0 || isNaN(ratio)) { alert('比例必须大于 0。'); return; }
        if (lineLengthMM <= 0 || lineBleedMM <= 0 || lineStrokePt <= 0) { alert('长度、出血、描边必须大于 0。'); return; }
        if (app.documents.length === 0) { alert('请先建立一个新文件', '错误'); return; }
        if (app.activeDocument.selection.length === 0) { alert('请先选中一个对象'); return; }

        var docRef = app.activeDocument;
        var bounds = getSelectionBounds(docRef.selection, includeStrokeBounds);
        var mmToPoints = 72 / 25.4;
        var scale = mmToPoints / ratio;
        var lineLength = lineLengthMM * scale;
        var lineBleed = lineBleedMM * scale;
        var hBSpace = hBSpaceMM * scale;
        var vBSpace = vBSpaceMM * scale;
        var regRoundSize = 3.6 * scale;
        var dotRadius = (dotSizeMM * scale) / 2;
        var strokeColor = blackRgb();
        var fillColor = blackCmyk();

        var layer;
        try { layer = docRef.layers.getByName('印前角线'); }
        catch (e) { layer = docRef.layers.add(); layer.name = '印前角线'; }

        var x = bounds[0];
        var top = bounds[1];
        var right = bounds[2];
        var y = bounds[3];
        var pw = right - x;
        var ph = top - y;

        function stylePath(path) {
            path.filled = false;
            path.stroked = true;
            path.strokeWidth = lineStrokePt;
            path.strokeColor = strokeColor;
        }

        function drawLine(points) {
            var path = layer.pathItems.add();
            path.setEntirePath(points);
            stylePath(path);
            return path;
        }

        function drawCornerMarks() {
            var lineGroup = layer.groupItems.add();

            function groupPath(points) {
                var path = lineGroup.pathItems.add();
                path.setEntirePath(points);
                stylePath(path);
            }

            if (lineType === 'roman') {
                groupPath([[0, lineLength + lineBleed], [lineLength, lineLength + lineBleed]]);
                groupPath([[lineLength + lineBleed, lineLength], [lineLength + lineBleed, 0]]);
            } else if (lineType === 'chinese') {
                groupPath([[0, lineLength + lineBleed], [lineLength, lineLength + lineBleed]]);
                groupPath([[0, lineLength], [lineLength + (lineBleed / 2), lineLength]]);
                groupPath([[lineLength + lineBleed, lineLength], [lineLength + lineBleed, 0]]);
                groupPath([[lineLength, lineLength + (lineBleed / 2)], [lineLength, 0]]);
            } else {
                groupPath([[0, lineLength + lineBleed], [lineLength, lineLength + lineBleed], [lineLength, 0]]);
                groupPath([[0, lineLength], [lineLength + lineBleed, lineLength], [lineLength + lineBleed, 0]]);
            }

            lineGroup.position = [-lineGroup.width + x, y];

            var lineGroup2 = lineGroup.duplicate();
            lineGroup2.rotate(90);
            lineGroup2.left = lineGroup2.left + lineGroup2.width + pw;

            var lineGroup3 = lineGroup.duplicate();
            lineGroup3.rotate(270);
            lineGroup3.top = lineGroup3.top + lineGroup3.height + ph;

            var lineGroup4 = lineGroup2.duplicate();
            lineGroup4.rotate(90);
            lineGroup4.top = lineGroup4.top + lineGroup4.height + ph;
        }

        function drawRegistrationMarks() {
            var leftRegX = x - lineBleed - lineLength;
            var rightRegX = x + pw + lineBleed + lineLength;
            var sideRegY = y + ph / 2;
            var centerX = x + pw / 2;
            var topRegY = y + ph + lineBleed + lineLength;
            var bottomRegY = y - lineBleed - lineLength;

            function reg(cx, cy, horizontalLong) {
                if (horizontalLong) {
                    drawLine([[cx - lineLength - lineBleed, cy], [cx + lineLength + lineBleed, cy]]);
                    drawLine([[cx, cy - lineLength / 2], [cx, cy + lineLength / 2]]);
                } else {
                    drawLine([[cx - lineLength / 2, cy], [cx + lineLength / 2, cy]]);
                    drawLine([[cx, cy - lineLength - lineBleed], [cx, cy + lineLength + lineBleed]]);
                }
                if (registrationCircle) {
                    var circle = layer.pathItems.ellipse(cy + regRoundSize / 2, cx - regRoundSize / 2, regRoundSize, regRoundSize);
                    stylePath(circle);
                }
            }

            reg(leftRegX, sideRegY, false);
            reg(rightRegX, sideRegY, false);
            reg(centerX, topRegY, true);
            reg(centerX, bottomRegY, true);
        }

        function drawBisectors() {
            if (vBisector > 1) {
                for (var vML = 1; vML < vBisector; vML += 1) {
                    var vEquidistant = vBSpace === 0 ? ph / vBisector : (ph + vBSpace) / vBisector;
                    var vy1 = y + (vML * vEquidistant);
                    drawLine([[x - lineLength - lineBleed, vy1], [x - lineBleed, vy1]]);
                    drawLine([[x + pw + lineBleed, vy1], [x + pw + lineBleed + lineLength, vy1]]);
                    if (vBSpace !== 0) {
                        var vy2 = y - vBSpace + (vML * vEquidistant);
                        drawLine([[x - lineLength - lineBleed, vy2], [x - lineBleed, vy2]]);
                        drawLine([[x + pw + lineBleed, vy2], [x + pw + lineBleed + lineLength, vy2]]);
                    }
                }
            }

            if (hBisector > 1) {
                for (var hML = 1; hML < hBisector; hML += 1) {
                    var hEquidistant = hBSpace === 0 ? pw / hBisector : (pw + hBSpace) / hBisector;
                    var hx1 = hBSpace === 0 ? x + (hML * hEquidistant) : (x + (hML * hEquidistant)) - hBSpace;
                    drawLine([[hx1, y - 1.5 * lineLength], [hx1, y - 0.5 * lineLength]]);
                    drawLine([[hx1, y + ph + lineBleed + 0.5 * lineLength], [hx1, y + ph + lineBleed + 1.5 * lineLength]]);
                    if (hBSpace !== 0) {
                        var hx2 = x + (hML * hEquidistant);
                        drawLine([[hx2, y - 1.5 * lineLength], [hx2, y - 0.5 * lineLength]]);
                        drawLine([[hx2, y + ph + lineBleed + 0.5 * lineLength], [hx2, y + ph + lineBleed + 1.5 * lineLength]]);
                    }
                }
            }
        }

        function drawDots() {
            var dots = [
                { x: x + dotTLXMM * scale, y: top + dotTLYMM * scale },
                { x: right + dotTRXMM * scale, y: top + dotTRYMM * scale },
                { x: right + dotBRXMM * scale, y: y + dotBRYMM * scale },
                { x: x + dotBLXMM * scale, y: y + dotBLYMM * scale }
            ];
            if (bottomConfusion) {
                var centerX = (x + right) / 2;
                var confusionOffset = (pw / 2) * 0.5;
                dots[2].x = centerX + confusionOffset + dotBRXMM * scale;
                dots[3].x = centerX - confusionOffset + dotBLXMM * scale;
            }
            for (var i = 0; i < dots.length; i++) {
                var dot = layer.pathItems.ellipse(dots[i].y + dotRadius, dots[i].x - dotRadius, dotRadius * 2, dotRadius * 2);
                dot.stroked = false;
                dot.filled = true;
                dot.fillColor = fillColor;
            }
        }

        drawCornerMarks();
        if (addRegistration) drawRegistrationMarks();
        if (addBisectors) drawBisectors();
        if (showDots) drawDots();
    }

    if ($.hopeflow) {
        addPrepressCropMarks($.hopeflow.utils.getArgs());
        return $.hopeflow.utils.returnResult('success');
    } else {
        var dialog = new Window('dialog', '印前角线 @HOPE');
        dialog.orientation = 'column';
        dialog.alignChildren = 'left';

        function addInput(label, value) {
            var group = dialog.add('group');
            group.add('statictext', undefined, label);
            var input = group.add('edittext', undefined, value);
            input.characters = 6;
            return input;
        }

        var typeGroup = dialog.add('group');
        typeGroup.add('statictext', undefined, '角线类型:');
        var typeInput = typeGroup.add('dropdownlist', undefined, ['日式', '罗马', '中式']);
        typeInput.selection = 0;
        var ratioInput = addInput('比例 1:', '1');
        var lengthInput = addInput('长度 (mm):', '6');
        var bleedInput = addInput('出血 (mm):', '3');
        var strokeInput = addInput('描边 (pt):', '0.25');
        var regCheckbox = dialog.add('checkbox', undefined, '添加套准线');
        regCheckbox.value = true;
        var regCircleCheckbox = dialog.add('checkbox', undefined, '套准带圆');
        regCircleCheckbox.value = true;
        var bisectorCheckbox = dialog.add('checkbox', undefined, '添加等分线');
        bisectorCheckbox.value = true;
        var dotCheckbox = dialog.add('checkbox', undefined, '添加四角圆点');
        dotCheckbox.value = true;
        var bottomConfusionCheckbox = dialog.add('checkbox', undefined, '底部混淆');
        var dotSizeInput = addInput('圆点大小 (mm):', '1');

        var buttons = dialog.add('group');
        buttons.alignment = 'center';
        buttons.add('button', undefined, '确认', { name: 'ok' });
        buttons.add('button', undefined, '取消', { name: 'cancel' });

        if (dialog.show() === 1) {
            var typeValues = ['japanese', 'roman', 'chinese'];
            addPrepressCropMarks({
                lineType: typeValues[typeInput.selection.index],
                ratio: parseFloat(ratioInput.text),
                lineLengthMM: parseFloat(lengthInput.text),
                lineBleedMM: parseFloat(bleedInput.text),
                lineStrokePt: parseFloat(strokeInput.text),
                addRegistration: regCheckbox.value,
                registrationCircle: regCircleCheckbox.value,
                addBisectors: bisectorCheckbox.value,
                showDots: dotCheckbox.value,
                bottomConfusion: bottomConfusionCheckbox.value,
                dotSizeMM: parseFloat(dotSizeInput.text),
                dotTLXMM: 2,
                dotTLYMM: -2,
                dotTRXMM: -2,
                dotTRYMM: -2,
                dotBRXMM: -2,
                dotBRYMM: 2,
                dotBLXMM: 2,
                dotBLYMM: 2
            });
        }
    }
})();
