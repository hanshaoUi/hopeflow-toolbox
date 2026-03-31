import { useState, useEffect, useCallback } from 'react';

export interface HFSettings {
    libraries: { name: string; path: string }[];
    apiKeys: {
        pexels: string;
        pixabay: string;
    };
    ai: {
        defaultScale: 2 | 4;
        defaultDenoiseLevel: 'none' | 'low' | 'medium' | 'high';
        alphaMatting: boolean;
    };
    sidebarExpanded: boolean;
    scriptParams: Record<string, any>;
    scriptParamPresets: Record<string, { name: string; params: Record<string, any> }[]>;
}

const STORAGE_KEY = 'hf_settings';

const DEFAULTS: HFSettings = {
    libraries: [],
    apiKeys: { pexels: '', pixabay: '' },
    ai: {
        defaultScale: 2,
        defaultDenoiseLevel: 'medium',
        alphaMatting: false
    },
    sidebarExpanded: true,
    scriptParams: {},
    scriptParamPresets: {},
};

function migrateFromOldKeys(): Partial<HFSettings> {
    const result: Partial<HFSettings> = {};
    try {
        // Library paths (try new array format first, then old single-string format)
        const oldArr = localStorage.getItem('hf_library_paths');
        if (oldArr) {
            result.libraries = JSON.parse(oldArr);
        } else {
            const oldStr = localStorage.getItem('materialLibraryPath');
            if (oldStr) result.libraries = [{ name: oldStr.split('/').pop() || '素材库', path: oldStr }];
        }
        // API keys
        const pexels = localStorage.getItem('pexels_api_key');
        const pixabay = localStorage.getItem('pixabay_api_key');
        if (pexels || pixabay) {
            result.apiKeys = { pexels: pexels || '', pixabay: pixabay || '' };
        }

        // AI settings
        const scale = localStorage.getItem('ai_default_scale');
        const denoise = localStorage.getItem('ai_default_denoise_level') as 'none' | 'low' | 'medium' | 'high';
        const alpha = localStorage.getItem('ai_alpha_matting');
        if (scale || denoise || alpha !== null) {
            result.ai = {
                defaultScale: scale === '4' ? 4 : 2,
                defaultDenoiseLevel: denoise || 'medium',
                alphaMatting: alpha === 'true'
            };
        }
        // Sidebar
        const sidebar = localStorage.getItem('hf_sidebar_expanded');
        if (sidebar !== null) result.sidebarExpanded = sidebar === 'true';

        // Script Params (Dynamic Keys)
        const scriptParamsData: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('script_params_')) {
                const scriptId = key.replace('script_params_', '');
                try {
                    scriptParamsData[scriptId] = JSON.parse(localStorage.getItem(key) || '{}');
                } catch { }
            }
        }
        if (Object.keys(scriptParamsData).length > 0) result.scriptParams = scriptParamsData;
    } catch { }
    return result;
}

function loadSettings(): HFSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
    } catch { }
    // First run: migrate from old individual keys.
    return { ...DEFAULTS, ...migrateFromOldKeys() };
}

// Because useSettings is used in multiple components, they need to share state.
let globalSettings: HFSettings | null = null;
const listeners = new Set<(settings: HFSettings) => void>();

function initGlobalSettings() {
    if (!globalSettings) {
        globalSettings = loadSettings();
    }
    return globalSettings;
}

function dispatchSettingsUpdate(newSettings: HFSettings) {
    globalSettings = newSettings;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(globalSettings));
    } catch { }
    listeners.forEach(listener => listener(globalSettings!));
}

export function useSettings() {
    const [settings, setSettings] = useState<HFSettings>(initGlobalSettings);

    useEffect(() => {
        listeners.add(setSettings);
        return () => {
            listeners.delete(setSettings);
        };
    }, []);

    const update = useCallback(<K extends keyof HFSettings>(key: K, value: HFSettings[K]) => {
        if (!globalSettings) return;
        const newSettings = { ...globalSettings, [key]: value };
        dispatchSettingsUpdate(newSettings);
    }, []);

    return { settings, update };
}
