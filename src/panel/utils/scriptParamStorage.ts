const SETTINGS_KEY = 'hf_settings';

function loadSettingsObject(): Record<string, any> {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

export function loadPersistedScriptParams(scriptId: string): Record<string, any> {
    try {
        const settings = loadSettingsObject();
        const params = settings.scriptParams?.[scriptId];
        if (params && typeof params === 'object') return params;

        const legacy = localStorage.getItem(`script_params_${scriptId}`);
        return legacy ? JSON.parse(legacy) : {};
    } catch {
        return {};
    }
}

export function savePersistedScriptParams(scriptId: string, params: Record<string, any>) {
    try {
        const settings = loadSettingsObject();
        settings.scriptParams = {
            ...(settings.scriptParams || {}),
            [scriptId]: params,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        localStorage.setItem(`script_params_${scriptId}`, JSON.stringify(params));
    } catch {
        // Ignore storage quota or JSON serialization failures.
    }
}
