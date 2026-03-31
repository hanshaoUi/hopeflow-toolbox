/**
 * HopeFlow Toolbox - Runtime Bootstrap
 * This is the first script injected by the panel.
 * It initializes the $.hopeflow namespace and wires up all dependencies.
 *
 * IMPORTANT: This script expects utils.jsx to be already evaluated
 * (it defines $.hopeflow.utils).
 */

// Verify prerequisites
if (typeof $.hopeflow === 'undefined') {
    $.hopeflow = {};
}

// Version marker
$.hopeflow.version = '3.0.0';
$.hopeflow.ready = false;

// Internal state
$.hopeflow._currentScriptId = '';
$.hopeflow._currentArgs = {};
$.hopeflow._executionCount = 0;

// Verify utils were loaded
if ($.hopeflow.utils && typeof $.hopeflow.utils.getSelection === 'function') {
    // Runtime is ready
    $.hopeflow.ready = true;
}

// Auth stub - always allow (authorization system removed)
$.hopeflow.auth = {
    verify: function() { return true; },
    isAuthorized: function() { return true; }
};

// Execution wrapper - used by the bridge to track script runs
$.hopeflow.execute = function (scriptId, scriptFn) {
    if (!$.hopeflow.ready) {
        return JSON.stringify({ success: false, error: 'Runtime not ready' });
    }

    $.hopeflow._executionCount++;
    $.hopeflow._currentScriptId = scriptId;

    try {
        var result = scriptFn();
        return typeof result === 'string' ? result : JSON.stringify({ success: true, data: result });
    } catch (e) {
        return JSON.stringify({ success: false, error: e.message || String(e) });
    }
};
