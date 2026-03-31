import React from 'react';
import { ScriptMetadata } from '@registry/script-manifest';

// Props passed to every panel that needs to interact with script execution
export interface ScriptPanelProps {
    script: ScriptMetadata;
    params: Record<string, any>;
    setParams: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    isExecuting: boolean;
    onRun: (params?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
    onError: (msg: string | null) => void;
    onSuccess: () => void;
}

// Chip toggle style shared across all panels
export const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 10px', borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
    border: '1px solid ' + (active ? 'var(--color-accent)' : 'var(--color-border)'),
    color: active ? '#fff' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '11px', transition: 'all 0.15s ease', userSelect: 'none',
});
