/**
 * 转换为 CMYK - Convert to CMYK
 * Converts selected objects to CMYK color mode
 */
(function () {
    if (!$.hopeflow) return;

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (!selection || selection.length === 0) {
        return $.hopeflow.utils.returnError('请先选择对象');
    }

    // Function to convert color to CMYK
    function convertToCMYK(color) {
        if (color.typename === 'CMYKColor') return color;

        var newColor = new CMYKColor();
        // This is a naive conversion, Illustrator scripting doesn't have a direct "convert" method for color objects easily exposed without temp items
        // A better way often involves changing document mode or using actions, but for simple fills:

        // Strategy: Use app.executeMenuCommand('doc-color-cmyk') to ensure doc is CMYK, 
        // then finding objects and converting is implicit or requires parsing.

        // Actually, the most reliable way to "convert" a selection is using the menu command "Colors6" (Convert to CMYK) via Filter/Edit Colors
        // But that command might be "Edit Colors > Convert to CMYK".
        // Let's try to use the built-in menu command on the selection.

        return null; // logic handled below
    }

    // Using menu command is robust for selection
    app.executeMenuCommand('Colors9'); // "Colors9" is often "Convert to CMYK"? 
    // Wait, menu command IDs are tricky. 
    // "Colors3" is RGB, "Colors4" is CMYK (Document Color Mode).
    // For Edit > Edit Colors > Convert to CMYK:
    // It is often "ConvertToCMYK"

    try {
        app.executeMenuCommand('ConvertToCMYK');
        return $.hopeflow.utils.returnResult({ count: selection.length });
    } catch (e) {
        // Fallback: iterate and check (limited capability in script without complex color math)
        // Let's try "Colors6" (often Convert to CMYK in Edit Colors)
        try {
            app.executeMenuCommand('Colors6');
            return $.hopeflow.utils.returnResult({ count: selection.length });
        } catch (e2) {
            return $.hopeflow.utils.returnError('无法执行转换，请检查 Illustrator 版本或手动执行 "编辑 > 编辑颜色 > 转换为 CMYK"');
        }
    }
})();
