import { useState, useEffect, useCallback } from 'react';

interface ShortcutBinding {
    scriptId: string;
    key: string;
    modifiers: string[];
}

const STORAGE_KEY = 'hopeflow_shortcuts';

export function useShortcuts() {
    const [bindings, setBindings] = useState<ShortcutBinding[]>([]);

    /**
     * Load shortcuts from localStorage
     */
    const loadShortcuts = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setBindings(JSON.parse(stored));
            }
        } catch {
            // Ignore errors
        }
    }, []);

    /**
     * Save shortcuts to localStorage
     */
    const saveShortcuts = useCallback((newBindings: ShortcutBinding[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newBindings));
            setBindings(newBindings);
        } catch {
            // Ignore errors
        }
    }, []);

    /**
     * Register a shortcut
     */
    const registerShortcut = useCallback(
        (scriptId: string, key: string, modifiers: string[] = []) => {
            const newBinding: ShortcutBinding = { scriptId, key, modifiers };

            // Check for conflicts
            const existing = bindings.find(
                (b) =>
                    b.key === key &&
                    b.modifiers.length === modifiers.length &&
                    b.modifiers.every((m) => modifiers.includes(m))
            );

            if (existing && existing.scriptId !== scriptId) {
                return {
                    success: false,
                    error: `快捷键已被 ${existing.scriptId} 占用`,
                };
            }

            // Remove existing binding for this script
            const filtered = bindings.filter((b) => b.scriptId !== scriptId);
            const updated = [...filtered, newBinding];

            saveShortcuts(updated);
            return { success: true };
        },
        [bindings, saveShortcuts]
    );

    /**
     * Unregister a shortcut
     */
    const unregisterShortcut = useCallback(
        (scriptId: string) => {
            const updated = bindings.filter((b) => b.scriptId !== scriptId);
            saveShortcuts(updated);
        },
        [bindings, saveShortcuts]
    );

    /**
     * Get shortcut for script
     */
    const getShortcut = useCallback(
        (scriptId: string): ShortcutBinding | undefined => {
            return bindings.find((b) => b.scriptId === scriptId);
        },
        [bindings]
    );

    /**
     * Clear all shortcuts
     */
    const clearAllShortcuts = useCallback(() => {
        saveShortcuts([]);
    }, [saveShortcuts]);

    /**
     * Format shortcut for display
     */
    const formatShortcut = useCallback((binding: ShortcutBinding): string => {
        const parts = [...binding.modifiers, binding.key];
        return parts
            .map((p) => {
                if (p === 'ctrl') return '⌃';
                if (p === 'cmd' || p === 'meta') return '⌘';
                if (p === 'shift') return '⇧';
                if (p === 'alt' || p === 'option') return '⌥';
                return p.toUpperCase();
            })
            .join(' + ');
    }, []);

    /**
     * Handle keyboard event
     */
    const handleKeyDown = useCallback(
        (event: KeyboardEvent, onTrigger: (scriptId: string) => void) => {
            const modifiers: string[] = [];
            if (event.ctrlKey) modifiers.push('ctrl');
            if (event.metaKey) modifiers.push('cmd');
            if (event.shiftKey) modifiers.push('shift');
            if (event.altKey) modifiers.push('alt');

            const key = event.key.toLowerCase();

            const match = bindings.find(
                (b) =>
                    b.key === key &&
                    b.modifiers.length === modifiers.length &&
                    b.modifiers.every((m) => modifiers.includes(m))
            );

            if (match) {
                event.preventDefault();
                event.stopPropagation();
                onTrigger(match.scriptId);
            }
        },
        [bindings]
    );

    // Load shortcuts on mount
    useEffect(() => {
        loadShortcuts();
    }, [loadShortcuts]);

    return {
        bindings,
        registerShortcut,
        unregisterShortcut,
        getShortcut,
        clearAllShortcuts,
        formatShortcut,
        handleKeyDown,
    };
}
