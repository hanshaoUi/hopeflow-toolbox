/**
 * 清理文档 - Cleanup Document
 * Remove unused elements from the document
 * Args: none
 */
(function () {
    if (!$.hopeflow) return;

    try {
        // Execute Illustrator's cleanup command
        app.executeMenuCommand("cleanup menu item");

        return $.hopeflow.utils.returnResult({
            success: true,
            message: '文档清理完成'
        });
    } catch (e) {
        return $.hopeflow.utils.returnError('清理失败: ' + e.message);
    }
})();
