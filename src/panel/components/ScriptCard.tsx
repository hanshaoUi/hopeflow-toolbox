import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ScriptMetadata,
} from '@registry/script-manifest';
import { useScriptRunner } from '../hooks/useScriptRunner';
import { getBridge } from '@bridge';
import { AlignmentGrid } from './AlignmentGrid';
import { PositionGrid } from './PositionGrid';
import { SuccessButton } from './SuccessButton';
import { Icon } from './Icon';
import { STANDALONE_PANELS, PARAM_PANELS } from '../panels/registry';
import { chipStyle as chipStyleUtil } from '../panels/types';
import { useSettings } from '../hooks/useSettings';

// Fixed-position tooltip: uses direct DOM manipulation to avoid re-render flicker
const FixedTooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEnter = (e: React.MouseEvent) => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        const tip = tooltipRef.current;
        if (!tip) return;
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const x = Math.round(r.left + r.width / 2);
        const y = spaceBelow < 60 ? Math.round(r.top - 6) : Math.round(r.bottom + 6);
        tip.style.left = `${x}px`;
        tip.style.top = `${y}px`;
        tip.style.transform = spaceBelow < 60
            ? 'translateX(-50%) translateY(-100%)'
            : 'translateX(-50%)';
        tip.style.opacity = '1';
        tip.style.visibility = 'visible';
    };

    const handleLeave = () => {
        hideTimer.current = setTimeout(() => {
            if (tooltipRef.current) {
                tooltipRef.current.style.opacity = '0';
                tooltipRef.current.style.visibility = 'hidden';
            }
        }, 80);
    };

    return (
        <div
            style={{ display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onClick={e => e.stopPropagation()}
        >
            {children}
            <div
                ref={tooltipRef}
                style={{
                    position: 'fixed', left: 0, top: 0,
                    opacity: 0, visibility: 'hidden',
                    pointerEvents: 'none',
                    background: '#3a3a3a', border: '1px solid var(--color-border-hover)',
                    color: 'var(--color-text-primary)', fontSize: '11px',
                    padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                    maxWidth: '220px', whiteSpace: 'normal', textAlign: 'center',
                    lineHeight: 1.4, zIndex: 99999,
                    boxShadow: 'var(--shadow-md)',
                    transition: 'opacity 0.1s',
                }}
            >
                {content}
            </div>
        </div>
    );
};

const InfoIcon: React.FC<{ tooltip: string }> = ({ tooltip }) => (
    <FixedTooltip content={tooltip}>
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-tertiary)', cursor: 'help',
            width: '16px', height: '16px',
        }}>
            {/* Question mark help icon */}
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.5 9a2.5 2.5 0 0 1 4.8.8c0 1.6-2.3 2.2-2.3 3.7" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" strokeWidth="1.5" />
            </svg>
        </div>
    </FixedTooltip>
);

const CompositionInput = ({ value, onChange, ...props }: any) => {
    const [innerValue, setInnerValue] = useState(value);
    const [isComposing, setIsComposing] = useState(false);

    useEffect(() => {
        if (!isComposing) setInnerValue(value);
    }, [value, isComposing]);

    const handleChange = (e: any) => {
        setInnerValue(e.target.value);
        if (!isComposing) onChange(e);
    };

    const handleCompositionStart = () => setIsComposing(true);
    const handleCompositionEnd = (e: any) => {
        setIsComposing(false);
        onChange(e);
    };

    return (
        <input
            {...props}
            value={innerValue}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
        />
    );
};

const FontPickerInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    fonts: string[];
    loading?: boolean;
    placeholder?: string;
}> = ({ value, onChange, fonts, loading = false, placeholder }) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const onDocDown = (event: MouseEvent) => {
            const node = wrapRef.current;
            if (!node) return;
            if (!node.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocDown);
        return () => document.removeEventListener('mousedown', onDocDown);
    }, []);

    const q = String(query || '').toLowerCase().trim();
    const matched = q
        ? fonts.filter((name) => name.toLowerCase().indexOf(q) >= 0)
        : fonts;
    const list = matched.slice(0, 300);

    const openPicker = () => {
        setQuery('');
        setIsOpen(true);
    };

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            <CompositionInput
                type="text"
                className="input"
                value={value}
                onChange={(e: any) => {
                    const next = String(e.target.value || '');
                    onChange(next);
                    setQuery(next);
                    setIsOpen(true);
                }}
                onFocus={openPicker}
                placeholder={placeholder}
                style={{ paddingRight: '30px' }}
            />
            <button
                type="button"
                onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
                style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                    width: '20px',
                    height: '20px',
                    padding: 0,
                    lineHeight: 1,
                }}
                title="打开字体列表"
            >
                ▼
            </button>
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 60,
                        padding: '6px',
                    }}
                >
                    <CompositionInput
                        type="text"
                        className="input"
                        value={query}
                        onChange={(e: any) => setQuery(String(e.target.value || ''))}
                        placeholder="搜索字体..."
                        style={{ marginBottom: '6px' }}
                    />
                    <div style={{ maxHeight: '220px', overflowY: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '4px' }}>
                        {loading ? (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '8px' }}>正在读取字体库...</div>
                        ) : list.length === 0 ? (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '8px' }}>未找到匹配字体</div>
                        ) : (
                            list.map((name) => (
                                <button
                                    type="button"
                                    key={name}
                                    onClick={() => {
                                        onChange(name);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        background: name === value ? 'var(--color-bg-active)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '6px',
                                        cursor: 'pointer',
                                        color: 'var(--color-text-primary)',
                                    }}
                                >
                                    <div style={{ fontSize: '12px' }}>{name}</div>
                                    <div style={{ fontSize: '12px', opacity: 0.85, fontFamily: `"${name}", var(--font-family)` }}>
                                        中文 Aa 123
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    {matched.length > list.length && (
                        <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                            已显示前 {list.length} 项，共 {matched.length} 项
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SuggestionPickerInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    items: string[];
    loading?: boolean;
    placeholder?: string;
    emptyText?: string;
    toggleTitle?: string;
}> = ({
    value,
    onChange,
    items,
    loading = false,
    placeholder,
    emptyText = '未找到匹配项',
    toggleTitle = '打开列表',
}) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const onDocDown = (event: MouseEvent) => {
            const node = wrapRef.current;
            if (!node) return;
            if (!node.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocDown);
        return () => document.removeEventListener('mousedown', onDocDown);
    }, []);

    const q = String(query || '').toLowerCase().trim();
    const matched = q
        ? items.filter((name) => name.toLowerCase().indexOf(q) >= 0)
        : items;
    const list = matched.slice(0, 300);

    const openPicker = () => {
        setQuery(value || '');
        setIsOpen(true);
    };

    return (
        <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <CompositionInput
                type="text"
                className="input"
                value={value}
                onChange={(e: any) => {
                    const next = String(e.target.value || '');
                    onChange(next);
                    setQuery(next);
                    setIsOpen(true);
                }}
                onFocus={openPicker}
                placeholder={placeholder}
                style={{ paddingRight: '30px' }}
            />
            <button
                type="button"
                onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
                style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                    width: '20px',
                    height: '20px',
                    padding: 0,
                    lineHeight: 1,
                }}
                title={toggleTitle}
            >
                ▼
            </button>
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 60,
                        padding: '6px',
                    }}
                >
                    <CompositionInput
                        type="text"
                        className="input"
                        value={query}
                        onChange={(e: any) => setQuery(String(e.target.value || ''))}
                        placeholder="搜索..."
                        style={{ marginBottom: '6px' }}
                    />
                    <div style={{ maxHeight: '220px', overflowY: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '4px' }}>
                        {loading ? (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '8px' }}>正在读取...</div>
                        ) : list.length === 0 ? (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '8px' }}>{emptyText}</div>
                        ) : (
                            list.map((name) => (
                                <button
                                    type="button"
                                    key={name}
                                    onClick={() => {
                                        onChange(name);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        background: name === value ? 'var(--color-bg-active)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '6px 8px',
                                        cursor: 'pointer',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '12px',
                                    }}
                                >
                                    {name}
                                </button>
                            ))
                        )}
                    </div>
                    {matched.length > list.length && (
                        <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                            已显示前 {list.length} 项，共 {matched.length} 项
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Shared grid action button style + component (used by mirror, rotate, lock, text-fit, etc.)
const GRID_BTN: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '4px', padding: '12px 0', background: 'var(--color-bg-control)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-secondary)', minWidth: 'unset', height: 'auto',
};

interface ActionItem { label: string; icon: React.ReactNode; onClick: () => Promise<void> | void }

const ActionGrid: React.FC<{ items: ActionItem[]; cols?: number; disabled?: boolean }> = ({ items, cols = 2, disabled }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '6px' }}>
        {items.map((item, i) => (
            <SuccessButton key={i} className="btn" style={GRID_BTN} onClick={item.onClick} disabled={disabled}>
                {item.icon}
                <span style={{ fontSize: '10px', lineHeight: 1, opacity: 0.7 }}>{item.label}</span>
            </SuccessButton>
        ))}
    </div>
);

// Re-export shared chip style (defined in panels/types to be shared across panel components)
const chipStyle = chipStyleUtil;

interface ScriptCardProps {
    script: ScriptMetadata;
    isExpanded?: boolean;
    onToggle?: () => void;
}

interface PreviewSwatchItem {
    name: string;
    preview: string;
    detail?: string;
}

interface InlineResultMessage {
    prefix: string;
    highlight?: string;
    suffix?: string;
}

// Scripts that use undo-based preview (manual trigger)
const UNDO_PREVIEW_SCRIPTS: Record<string, string> = {
    'banner-grommets': './src/scripts/path/banner-grommets.jsx',
};

// Scripts with specialized UIs
const SPECIAL_UI_SCRIPTS = new Set([
    'extract-image-contour',
    'image-vectorize',
    'align-to-artboard',
    'distribute-spacing',
    'mirror-object',
    'lock-unlock',
    'create-artboards-from-selection',
    'fit-artboard-to-selection',
    'batch-rename-artboards',
    'round-corners',
    'random-scatter',
    'batch-resize',
    'batch-rename',
    'move-objects-to-layer',
    'multi-layer-selector',
    'create-polygon',
    'find-replace-text',
    'replace-color',
    'rotate-object',
    'change-case',
    'auto-fit-text',
    'select-by-font',
    'apply-cjk-latin-fonts',
    'text-style-rules',
    'paragraph-layout',
    'auto-number',
    'random-palette-fill',
    'make-size',
    'matrix-clone',
    'smart-clone-replace',
    'export-large-scale',
    'split-overlap-artboards',
    'ai-enhance',
    'open-pdf',
    'data-merge',
    'create-guides',
    'random-irregular-shapes',
    'banner-grommets'
]);

// Scripts that need document unit info

const NEEDS_UNIT_SCRIPTS = new Set([
    'offset-bleed',
    'distribute-spacing',
    'create-artboards-from-selection',
    'fit-artboard-to-selection',
    'batch-resize',
    'create-polygon',
    'round-corners',
    'random-scatter',
    'batch-rename-artboards',
    'auto-group-by-intersection'
]);

const VECTORIZE_BACKGROUND_SWATCHES = ['#FFFFFF', '#000000', '#808080', '#FF0000', '#00FF00', '#0000FF'];

export const ScriptCard: React.FC<ScriptCardProps> = ({ script, isExpanded = false, onToggle }) => {
    const { settings, update } = useSettings();
    const { executeScript, isExecuting: runnerIsExecuting, validateParams } = useScriptRunner();
    const [params, setParams] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);
    const [inlineResultMessage, setInlineResultMessage] = useState<InlineResultMessage | null>(null);
    const [isAlphaExecuting, setIsAlphaExecuting] = useState(false);
    const isExecuting = runnerIsExecuting || isAlphaExecuting;
    const [vectorizeImage, setVectorizeImage] = useState<ImageData | null>(null);
    const [vectorizeExport, setVectorizeExport] = useState<AlphaExportData | null>(null);
    const [vectorizeSourceUrl, setVectorizeSourceUrl] = useState('');
    const [vectorizeSvg, setVectorizeSvg] = useState('');
    const [vectorizeStats, setVectorizeStats] = useState<{ regions: number; pixels: number; size: string } | null>(null);
    const [vectorizeLoading, setVectorizeLoading] = useState(false);
    const [vectorizeCompare, setVectorizeCompare] = useState(50);
    const [imageContourPreviews, setImageContourPreviews] = useState<ImageContourPreview[]>([]);
    const [imageContourExport, setImageContourExport] = useState<ImageContourExportData | null>(null);
    const [imageContourSelectedKey, setImageContourSelectedKey] = useState<string | null>(null);
    const retraceFrameRef = useRef<HTMLIFrameElement | null>(null);
    const vectorizeWorkerRef = useRef<Worker | null>(null);
    const vectorizeRequestRef = useRef(0);
    const [presetNameInput, setPresetNameInput] = useState('');
    const [selectedPresetName, setSelectedPresetName] = useState('');

    // Initialize params with default values on mount
    useEffect(() => {
        if (script.params) {
            const initialParams: Record<string, any> = {};
            script.params.forEach(param => {
                if (param.default !== undefined) {
                    initialParams[param.name] = param.default;
                }
            });
            if (script.persistParams) {
                try {
                    const stored = settings.scriptParams[script.id];
                    if (stored) {
                        script.params.forEach(param => {
                            if (stored[param.name] !== undefined)
                                initialParams[param.name] = stored[param.name];
                        });
                    }
                } catch (e) { }
            }
            setParams(initialParams);
        }
    }, [script.id]); // Only re-initialize if script changes

    // Persist params to settings for scripts with persistParams
    useEffect(() => {
        if (!script.persistParams || !script.params) return;
        const toSave: Record<string, any> = {};
        script.params.forEach(p => {
            if (params[p.name] !== undefined) toSave[p.name] = params[p.name];
        });

        // Fast path: avoid updating if deep equal to avoid thrashing
        const currentSaved = settings.scriptParams[script.id] || {};
        if (JSON.stringify(currentSaved) !== JSON.stringify(toSave)) {
            update('scriptParams', {
                ...settings.scriptParams,
                [script.id]: toSave
            });
        }
    }, [script.id, script.persistParams, params, settings.scriptParams, update]);

    useEffect(() => {
        if (script.id !== 'image-vectorize' || !script.params) return;
        const missingDefaults: Record<string, any> = {};
        script.params.forEach((param) => {
            if (param.default !== undefined && params[param.name] === undefined) {
                missingDefaults[param.name] = param.default;
            }
        });
        if (Object.keys(missingDefaults).length) {
            setParams((prev) => ({ ...missingDefaults, ...prev }));
        }
    }, [script.id, script.params, params]);

    const hasParams = script.params && script.params.length > 0;
    const isSpecialUI = SPECIAL_UI_SCRIPTS.has(script.id);
    const isExpandable = hasParams || isSpecialUI;
    const needsUnit = NEEDS_UNIT_SCRIPTS.has(script.id);
    const showDocumentUnitInLabels = needsUnit && script.id !== 'offset-bleed';
    useEffect(() => {
        if (!isExpanded && error && isExpandable) {
            setError(null);
        }
    }, [error, isExpanded, isExpandable]);
    const [unit, setUnit] = useState('');
    const [auxData, setAuxData] = useState<any>(null);
    const [fontList, setFontList] = useState<string[]>([]);
    const [fontListLoading, setFontListLoading] = useState(false);
    const [fontListError, setFontListError] = useState<string | null>(null);
    const [layerList, setLayerList] = useState<string[]>([]);
    const [layerListLoading, setLayerListLoading] = useState(false);
    const [layerListError, setLayerListError] = useState<string | null>(null);
    const [layerMetaList, setLayerMetaList] = useState<Array<{ name: string; locked: boolean; visible: boolean; itemCount: number }>>([]);
    const [layerMetaLoading, setLayerMetaLoading] = useState(false);
    const [layerMetaError, setLayerMetaError] = useState<string | null>(null);
    const [layerSearch, setLayerSearch] = useState('');
    const [swatchList, setSwatchList] = useState<PreviewSwatchItem[]>([]);
    const [swatchListLoading, setSwatchListLoading] = useState(false);
    const [swatchListError, setSwatchListError] = useState<string | null>(null);
    const [swatchQuery, setSwatchQuery] = useState('');
    const [swatchAnchorName, setSwatchAnchorName] = useState('');

    // --- Make-size real-time preview ---
    const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previewActiveRef = useRef(false);

    const silentExecute = useCallback(async (previewArgs: Record<string, any>) => {
        try {
            const bridge = await getBridge();
            await bridge.executeScript({
                scriptId: 'make-size',
                scriptPath: `./src/scripts/measurement/make-size.jsx`,
                args: previewArgs,
            });
        } catch (e) {
            // Silently ignore preview errors
        }
    }, []);

    const silentExecuteGuide = useCallback(async (previewArgs: Record<string, any>) => {
        try {
            const bridge = await getBridge();
            await bridge.executeScript({
                scriptId: 'create-guides',
                scriptPath: `./src/scripts/measurement/create-guides.jsx`,
                args: previewArgs,
            });
        } catch (e) {
            // Silently ignore preview errors
        }
    }, []);

    const silentExecuteParametricArray = useCallback(async (previewArgs: Record<string, any>) => {
        try {
            const bridge = await getBridge();
            await bridge.executeScript({
                scriptId: 'parametric-array',
                scriptPath: `./src/scripts/effects/parametric-array.jsx`,
                args: previewArgs,
            });
        } catch (e) {
            // Silently ignore preview errors
        }
    }, []);

    const silentExecuteBlob = useCallback(async (previewArgs: Record<string, any>) => {
        try {
            const bridge = await getBridge();
            await bridge.executeScript({
                scriptId: 'random-irregular-shapes',
                scriptPath: `./src/scripts/effects/random-irregular-shapes.jsx`,
                args: previewArgs,
            });
        } catch (e) {
            // Silently ignore preview errors
        }
    }, []);

    // --- Hachures real-time preview ---
    const hachuresPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hachuresPreviewActiveRef = useRef(false);
    // Serialise all hachures preview operations so undo/run never overlap
    const hachuresChainRef = useRef<Promise<void>>(Promise.resolve());
    const hachuresPendingRef = useRef(0);
    const hachuresLatestParamsRef = useRef<Record<string, any>>(params);
    useEffect(() => { hachuresLatestParamsRef.current = params; }, [params]);
    const [hachuresLiveMode, setHachuresLiveMode] = useState(true);
    const [hachuresPreviewing, setHachuresPreviewing] = useState(false);
    const [hachuresPreviewVersion, setHachuresPreviewVersion] = useState(0);

    const silentExecuteHachures = useCallback(async (previewArgs: Record<string, any>) => {
        try {
            const bridge = await getBridge();
            await bridge.executeScript({
                scriptId: 'hachures',
                scriptPath: `./src/scripts/effects/hachures.jsx`,
                args: previewArgs,
            });
        } catch (e) {
            // Silently ignore preview errors
        }
    }, []);

    const runHachuresPreview = useCallback((overrideParams?: Record<string, any>) => {
        if (script.id !== 'hachures') return Promise.resolve();
        hachuresPendingRef.current++;
        setHachuresPreviewing(true);
        const next = hachuresChainRef.current.then(async () => {
            // Always use the freshest params at the moment this slot in the chain runs
            const paramsToUse = overrideParams ?? hachuresLatestParamsRef.current;
            const shouldUndo = hachuresPreviewActiveRef.current;
            try {
                await silentExecuteHachures({
                    ...paramsToUse,
                    preview: true,
                    shouldUndo,
                });
                hachuresPreviewActiveRef.current = true;
                setHachuresPreviewVersion((v) => v + 1);
            } finally {
                hachuresPendingRef.current = Math.max(0, hachuresPendingRef.current - 1);
                if (hachuresPendingRef.current === 0) setHachuresPreviewing(false);
            }
        });
        hachuresChainRef.current = next;
        return next;
    }, [script.id, silentExecuteHachures]);

    const cancelHachuresPreview = useCallback(() => {
        hachuresPendingRef.current++;
        setHachuresPreviewing(true);
        const next = hachuresChainRef.current.then(async () => {
            try {
                if (!hachuresPreviewActiveRef.current) return;
                await silentExecuteHachures({ clearOnly: true, shouldUndo: true });
                hachuresPreviewActiveRef.current = false;
                setHachuresPreviewVersion((v) => v + 1);
            } finally {
                hachuresPendingRef.current = Math.max(0, hachuresPendingRef.current - 1);
                if (hachuresPendingRef.current === 0) setHachuresPreviewing(false);
            }
        });
        hachuresChainRef.current = next;
        return next;
    }, [silentExecuteHachures]);

    // Auto-preview on param change when live mode is enabled
    useEffect(() => {
        if (script.id !== 'hachures') return;
        if (!isExpanded) return;
        if (!hachuresLiveMode) return;
        if (hachuresPreviewTimerRef.current) clearTimeout(hachuresPreviewTimerRef.current);
        hachuresPreviewTimerRef.current = setTimeout(() => {
            void runHachuresPreview();
        }, 500);
        return () => {
            if (hachuresPreviewTimerRef.current) clearTimeout(hachuresPreviewTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [script.id, isExpanded, hachuresLiveMode, params]);

    // Cleanup hachures preview when card collapses (keep live-mode preference)
    useEffect(() => {
        if (script.id !== 'hachures') return;
        if (!isExpanded && hachuresPreviewActiveRef.current) {
            // Queue cleanup through the chain so it doesn't race with an in-flight preview
            hachuresChainRef.current = hachuresChainRef.current.then(async () => {
                if (!hachuresPreviewActiveRef.current) return;
                try {
                    await silentExecuteHachures({ clearOnly: true, shouldUndo: true });
                } catch (e) { /* ignore */ }
                hachuresPreviewActiveRef.current = false;
            });
        }
    }, [script.id, isExpanded, silentExecuteHachures]);

    // Trigger preview on param change (all make-size params)
    useEffect(() => {
        if (script.id !== 'make-size') return;
        if (!isExpanded) return;

        const hasAnySide = params.top || params.bottom || params.left || params.right;

        if (!hasAnySide) {
            if (previewActiveRef.current) {
                silentExecute({ headless: true, clearOnly: true });
                previewActiveRef.current = false;
            }
            return;
        }

        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => {
            silentExecute({
                ...params,
                headless: true,
                preview: true,
            });
            previewActiveRef.current = true;
        }, 400);

        return () => {
            if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [script.id, isExpanded, params, silentExecute]);

    // Cleanup preview when card collapses or unmounts
    useEffect(() => {
        if (script.id !== 'make-size') return;
        if (!isExpanded && previewActiveRef.current) {
            silentExecute({ headless: true, clearOnly: true });
            previewActiveRef.current = false;
        }
    }, [script.id, isExpanded, silentExecute]);

    // --- Create-guides real-time preview ---
    const guidePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const guidePreviewActiveRef = useRef(false);

    // Trigger guide preview on param change
    useEffect(() => {
        if (script.id !== 'create-guides') return;
        if (!isExpanded) return;

        const gp = (k: string, def: any) => params['_g_' + k] ?? def;

        // Check if there's any meaningful layout param set
        const hasMargin = gp('mT', '') || gp('mB', '') || gp('mL', '') || gp('mR', '');
        const hasCol = (gp('colOn', true) === true || gp('colOn', true) === 'true') && parseInt(gp('cols', '3')) >= 2;
        const hasRow = (gp('rowOn', false) === true || gp('rowOn', false) === 'true') && parseInt(gp('rows', '3')) >= 2;
        const hasBleed = gp('bleed', '');
        const hasAny = hasMargin || hasCol || hasRow || hasBleed;

        if (!hasAny) {
            if (guidePreviewActiveRef.current) {
                silentExecuteGuide({ mode: 'layout', clearOnly: true });
                guidePreviewActiveRef.current = false;
            }
            return;
        }

        if (guidePreviewTimerRef.current) clearTimeout(guidePreviewTimerRef.current);

        guidePreviewTimerRef.current = setTimeout(() => {
            silentExecuteGuide({
                mode: 'layout',
                preview: true,
                allArtboards: gp('allAb', false),
                colEnabled: gp('colOn', true),
                cols: gp('cols', '3'),
                colGutter: gp('colGut', '0'),
                rowEnabled: gp('rowOn', false),
                rows: gp('rows', '3'),
                rowGutter: gp('rowGut', '0'),
                marginTop: gp('mT', ''),
                marginBottom: gp('mB', ''),
                marginLeft: gp('mL', ''),
                marginRight: gp('mR', ''),
                bleed: gp('bleed', ''),
                centerCols: gp('center', false),
            });
            guidePreviewActiveRef.current = true;
        }, 400);

        return () => {
            if (guidePreviewTimerRef.current) clearTimeout(guidePreviewTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [script.id, isExpanded, params, silentExecuteGuide]);

    // Cleanup guide preview when card collapses or unmounts
    useEffect(() => {
        if (script.id !== 'create-guides') return;
        if (!isExpanded && guidePreviewActiveRef.current) {
            silentExecuteGuide({ mode: 'layout', clearOnly: true });
            guidePreviewActiveRef.current = false;
        }
    }, [script.id, isExpanded, silentExecuteGuide]);

    // --- Parametric-array real-time preview ---
    const parametricPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const parametricPreviewActiveRef = useRef(false);

    useEffect(() => {
        if (script.id !== 'parametric-array') return;
        if (!isExpanded) return;

        if (parametricPreviewTimerRef.current) clearTimeout(parametricPreviewTimerRef.current);
        parametricPreviewTimerRef.current = setTimeout(() => {
            silentExecuteParametricArray({
                ...params,
                preview: true,
                previewMaxItems: params['itemShape'] === 'selection'
                    ? (params['layoutMode'] === 'path' ? 72 : 90)
                    : (params['layoutMode'] === 'path' ? 160 : 280),
            });
            parametricPreviewActiveRef.current = true;
        }, 420);

        return () => {
            if (parametricPreviewTimerRef.current) clearTimeout(parametricPreviewTimerRef.current);
        };
    }, [script.id, isExpanded, params, silentExecuteParametricArray]);

    useEffect(() => {
        if (script.id !== 'parametric-array') return;
        if (!isExpanded && parametricPreviewActiveRef.current) {
            silentExecuteParametricArray({ clearOnly: true });
            parametricPreviewActiveRef.current = false;
        }
    }, [script.id, isExpanded, silentExecuteParametricArray]);

    // --- Blob document preview ---
    const blobPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const blobPreviewActiveRef = useRef(false);

    useEffect(() => {
        if (script.id !== 'random-irregular-shapes') return;
        if (!isExpanded || !blobPreviewActiveRef.current) return;

        if (blobPreviewTimerRef.current) clearTimeout(blobPreviewTimerRef.current);
        blobPreviewTimerRef.current = setTimeout(() => {
            silentExecuteBlob({
                ...params,
                preview: true,
            });
        }, 300);

        return () => {
            if (blobPreviewTimerRef.current) clearTimeout(blobPreviewTimerRef.current);
        };
    }, [script.id, isExpanded, params, silentExecuteBlob]);

    useEffect(() => {
        if (script.id !== 'random-irregular-shapes') return;
        if (!isExpanded && blobPreviewActiveRef.current) {
            silentExecuteBlob({ clearOnly: true });
            blobPreviewActiveRef.current = false;
        }
    }, [script.id, isExpanded, silentExecuteBlob]);

    // --- Undo-based manual preview (rich-glitch / metaball) ---
    const undoPreviewActiveRef = useRef(false);
    // Serialise all undo-preview operations so only one undo/execute runs at a time
    const undoPreviewChainRef = useRef<Promise<void>>(Promise.resolve());

    // Manual preview trigger (called by preview button)
    const handleUndoPreview = useCallback(() => {
        const scriptPath = UNDO_PREVIEW_SCRIPTS[script.id];
        if (!scriptPath) return;
        const shouldUndo = undoPreviewActiveRef.current;
        undoPreviewChainRef.current = undoPreviewChainRef.current.then(async () => {
            try {
                const bridge = await getBridge();
                await bridge.executeScript({
                    scriptId: script.id,
                    scriptPath,
                    args: { ...params, shouldUndo, preview: true },
                });
                undoPreviewActiveRef.current = true;
            } catch (e) {
                if (shouldUndo) undoPreviewActiveRef.current = false;
            }
        });
    }, [script.id, params]);

    // Cleanup undo-based preview when card collapses
    useEffect(() => {
        const scriptPath = UNDO_PREVIEW_SCRIPTS[script.id];
        if (!scriptPath) return;
        if (!isExpanded) {
            undoPreviewChainRef.current = undoPreviewChainRef.current.then(async () => {
                if (!undoPreviewActiveRef.current) return;
                try {
                    const bridge = await getBridge();
                    await bridge.executeScript({
                        scriptId: script.id,
                        scriptPath,
                        args: { clearOnly: true, shouldUndo: true },
                    });
                } catch (e) { /* ignore */ }
                undoPreviewActiveRef.current = false;
            });
        }
    }, [script.id, isExpanded]);

    // Effect to reset auxData for find-replace-text when search term changes
    useEffect(() => {
        if (script.id === 'find-replace-text') {
            setAuxData(null);
        }
    }, [script.id, params['find']]);

    useEffect(() => {
        const supportsPresets = script.id === 'paragraph-layout'
            || script.id === 'apply-cjk-latin-fonts';
        if (!supportsPresets) {
            setPresetNameInput('');
            setSelectedPresetName('');
            return;
        }

        const allPresets = settings.scriptParamPresets || {};
        const list = Array.isArray(allPresets[script.id]) ? allPresets[script.id] : [];
        if (!list.length) {
            setSelectedPresetName('');
            return;
        }
        if (!selectedPresetName || !list.some((p: any) => p && p.name === selectedPresetName)) {
            setSelectedPresetName(list[0].name);
        }
    }, [script.id, settings.scriptParamPresets, selectedPresetName]);

    useEffect(() => {
        if (!needsUnit || !isExpanded) return;
        const getUnitsScript = `
            (function() {
                if (app.documents.length === 0) return "";
                var u = app.activeDocument.rulerUnits;
                switch (u) {
                    case RulerUnits.Millimeters: return "mm";
                    case RulerUnits.Centimeters: return "cm";
                    case RulerUnits.Inches: return "in";
                    case RulerUnits.Points: return "pt";
                    case RulerUnits.Picas: return "pc";
                    case RulerUnits.Pixels: return "px";
                    default: return "pt";
                }
            })()
        `;
        const win = window as any;
        if (win.__adobe_cep__) {
            win.__adobe_cep__.evalScript(getUnitsScript, (result: string) => {
                setUnit(result);
            });
        }
    }, [needsUnit, isExpanded]);

    useEffect(() => {
        if (script.id !== 'offset-bleed' || !isExpanded || !unit) return;
        if (!['pt', 'pc', 'in', 'mm', 'cm', 'px'].includes(unit)) return;
        setParams(prev => {
            if (prev.offsetUnit === unit && prev.strokeUnit === unit) return prev;
            return { ...prev, offsetUnit: unit, strokeUnit: unit };
        });
    }, [script.id, isExpanded, unit]);

    useEffect(() => {
        if ((script.id !== 'apply-cjk-latin-fonts' && script.id !== 'select-by-font') || !isExpanded) return;
        if (fontList.length > 0) return;

        let cancelled = false;

        const setLoadedFonts = (input: unknown) => {
            const raw = Array.isArray(input) ? input : [];
            const seen: Record<string, true> = {};
            const cleaned = raw
                .filter((x): x is string => typeof x === 'string')
                .map((x) => x.trim())
                .filter((x) => {
                    if (!x || seen[x]) return false;
                    seen[x] = true;
                    return true;
                })
                .sort((a, b) => a.localeCompare(b));

            if (cancelled) return;
            setFontList(cleaned);
            setFontListLoading(false);
            setFontListError(cleaned.length ? null : '字体库为空');
        };

        const setLoadError = (message?: string) => {
            if (cancelled) return;
            setFontListLoading(false);
            setFontListError(message || '读取字体库失败');
        };

        const unwrapFonts = (payload: any): string[] => {
            if (!payload) return [];
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload.fonts)) return payload.fonts;
            if (payload.data && Array.isArray(payload.data.fonts)) return payload.data.fonts;
            return [];
        };

        const parseFontsFromRaw = (rawInput: unknown): string[] => {
            if (typeof rawInput !== 'string') return [];
            const raw = rawInput.replace(/^\uFEFF/, '').trim();
            if (!raw || raw === 'undefined' || raw === 'null' || raw === 'EvalScript error.') return [];

            const candidates: string[] = [raw];
            const objStart = raw.indexOf('{');
            const objEnd = raw.lastIndexOf('}');
            if (objStart >= 0 && objEnd > objStart) {
                candidates.push(raw.slice(objStart, objEnd + 1));
            }
            const arrStart = raw.indexOf('[');
            const arrEnd = raw.lastIndexOf(']');
            if (arrStart >= 0 && arrEnd > arrStart) {
                candidates.push(raw.slice(arrStart, arrEnd + 1));
            }

            for (const candidate of candidates) {
                try {
                    const parsed = JSON.parse(candidate);
                    const nested = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
                    const fonts = unwrapFonts(nested);
                    if (fonts.length > 0) return fonts;
                } catch {
                    // Try next candidate.
                }
            }
            return [];
        };

        const loadFontList = async () => {
            setFontListLoading(true);
            setFontListError(null);

            // First choice: run packaged JSX via bridge for stable JSON return channel.
            try {
                const bridge = await getBridge();
                const res = await bridge.executeScript({
                    scriptId: 'list-fonts',
                    scriptPath: './src/scripts/text/list-fonts.jsx',
                    args: {},
                });
                if (res.success) {
                    const fonts = unwrapFonts(res.data);
                    if (fonts.length > 0) {
                        setLoadedFonts(fonts);
                        return;
                    }
                    const fromRaw = parseFontsFromRaw(res.data);
                    if (fromRaw.length > 0) {
                        setLoadedFonts(fromRaw);
                        return;
                    }
                }
            } catch {
                // Fall back to direct evalScript below.
            }

            const win = window as any;
            if (!win.__adobe_cep__) {
                setLoadError('CEP 环境不可用');
                return;
            }

            const getFontsScript = `
                (function () {
                    try {
                        var seen = {};
                        var names = [];
                        var fonts = app.textFonts;
                        for (var i = 0; i < fonts.length; i++) {
                            var n = String(fonts[i].name || '');
                            if (n && !seen[n]) {
                                seen[n] = true;
                                names.push(n);
                            }
                        }
                        names.sort();
                        return JSON.stringify({ success: true, fonts: names });
                    } catch (e) {
                        return JSON.stringify({ success: false, error: String(e) });
                    }
                })()
            `;

            win.__adobe_cep__.evalScript(getFontsScript, (raw: string) => {
                const fonts = parseFontsFromRaw(raw);
                if (fonts.length > 0) {
                    setLoadedFonts(fonts);
                    return;
                }
                setLoadError('字体库结果解析失败');
            });
        };

        loadFontList();
        return () => {
            cancelled = true;
        };
    }, [script.id, isExpanded, fontList.length]);

    const loadLayerList = useCallback(async (force = false) => {
        if (script.id !== 'move-objects-to-layer') return;
        if (!isExpanded) return;
        if (!force && layerList.length > 0) return;

        setLayerListLoading(true);
        setLayerListError(null);

        const unwrapLayers = (payload: any): string[] => {
            if (!payload) return [];
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload.layers)) return payload.layers;
            if (payload.data && Array.isArray(payload.data.layers)) return payload.data.layers;
            return [];
        };

        try {
            const bridge = await getBridge();
            const res = await bridge.executeScript({
                scriptId: 'list-layers',
                scriptPath: './src/scripts/batch/list-layers.jsx',
                args: {},
            });

            const raw = unwrapLayers(res.data);
            const seen: Record<string, true> = {};
            const cleaned = raw
                .filter((x): x is string => typeof x === 'string')
                .map((x) => x.trim())
                .filter((x) => {
                    if (!x || seen[x]) return false;
                    seen[x] = true;
                    return true;
                })
                .sort((a, b) => a.localeCompare(b));

            setLayerList(cleaned);
            setLayerListLoading(false);
            setLayerListError(cleaned.length ? null : '当前文档没有可用图层');

            if (!params['layerName'] && cleaned.length > 0) {
                setParams((prev) => ({ ...prev, layerName: cleaned[0] }));
            }
        } catch (e: any) {
            setLayerListLoading(false);
            setLayerListError(e?.message || '读取图层列表失败');
        }
    }, [isExpanded, layerList.length, params, script.id]);

    useEffect(() => {
        if (script.id !== 'move-objects-to-layer' || !isExpanded) return;
        loadLayerList(false);
    }, [script.id, isExpanded, loadLayerList]);

    const loadLayerMeta = useCallback(async (force = false) => {
        if (script.id !== 'multi-layer-selector') return;
        if (!isExpanded) return;
        if (!force && layerMetaList.length > 0) return;

        setLayerMetaLoading(true);
        setLayerMetaError(null);

        try {
            const bridge = await getBridge();
            const res = await bridge.executeScript({
                scriptId: 'describe-layers',
                scriptPath: './src/scripts/batch/describe-layers.jsx',
                args: {},
            });

            const payload: any = res.data;
            const raw: any[] = Array.isArray(payload?.layers)
                ? payload.layers
                : Array.isArray(payload)
                    ? payload
                    : [];

            const cleaned: Array<{ name: string; locked: boolean; visible: boolean; itemCount: number }> = raw
                .filter((x: any) => x && typeof x.name === 'string')
                .map((x: any) => ({
                    name: String(x.name || '').trim(),
                    locked: !!x.locked,
                    visible: !!x.visible,
                    itemCount: typeof x.itemCount === 'number' ? x.itemCount : 0,
                }))
                .filter((x: { name: string }) => !!x.name)
                .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

            setLayerMetaList(cleaned);
            setLayerMetaLoading(false);
            setLayerMetaError(cleaned.length ? null : '当前文档没有可用图层');
        } catch (e: any) {
            setLayerMetaLoading(false);
            setLayerMetaError(e?.message || '读取图层列表失败');
        }
    }, [isExpanded, layerMetaList.length, script.id]);

    useEffect(() => {
        if (script.id !== 'multi-layer-selector' || !isExpanded) return;
        loadLayerMeta(false);
    }, [script.id, isExpanded, loadLayerMeta]);

    const loadSwatchList = useCallback(async (force = false) => {
        if (script.id !== 'random-palette-fill') return;
        if (!isExpanded) return;
        if (!force && swatchList.length > 0) return;

        setSwatchListLoading(true);
        setSwatchListError(null);

        const unwrapSwatches = (payload: any): PreviewSwatchItem[] => {
            if (!payload) return [];
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload.swatches)) return payload.swatches;
            if (payload.data && Array.isArray(payload.data.swatches)) return payload.data.swatches;
            return [];
        };

        try {
            const bridge = await getBridge();
            const res = await bridge.executeScript({
                scriptId: 'list-swatches',
                scriptPath: './src/scripts/color/list-swatches.jsx',
                args: {},
            });

            const raw = unwrapSwatches(res.data);
            const seen: Record<string, true> = {};
            const cleaned = raw
                .filter((x): x is PreviewSwatchItem => !!x && typeof x.name === 'string')
                .map((x) => ({
                    name: x.name.trim(),
                    preview: typeof x.preview === 'string' && x.preview ? x.preview : '#cccccc',
                    detail: typeof x.detail === 'string' ? x.detail : '',
                }))
                .filter((x) => {
                    if (!x.name || seen[x.name]) return false;
                    seen[x.name] = true;
                    return true;
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            setSwatchList(cleaned);
            setSwatchListLoading(false);
            setSwatchListError(cleaned.length ? null : '当前文档没有可用色板');
        } catch (e: any) {
            setSwatchListLoading(false);
            setSwatchListError(e?.message || '读取色板失败');
        }
    }, [isExpanded, params, script.id, swatchList.length]);

    useEffect(() => {
        if (script.id !== 'random-palette-fill' || !isExpanded) return;
        loadSwatchList(false);
    }, [script.id, isExpanded, loadSwatchList]);

    const handleMainClick = () => {
        if (isExpandable) {
            onToggle?.();
            return;
        }

        handleExecute();
    };

    const [showSuccess, setShowSuccess] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const executeScriptWithAccess = useCallback(async (overrideParams: Record<string, any>) => {
        return await executeScript(script, overrideParams);
    }, [executeScript, script]);

    const getInlineSuccessMessage = useCallback((result: any) => {
        const data = result?.data;
        if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
            return { prefix: data.message.trim() };
        }

        if (script.id === 'count-selected-objects') {
            const count = Number(data?.count);
            if (Number.isFinite(count) && count >= 0) {
                return {
                    prefix: '当前选中',
                    highlight: String(count),
                    suffix: '个对象',
                };
            }
        }

        return null;
    }, [script.id]);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    useEffect(() => {
        setInlineResultMessage(null);
    }, [script.id]);

    const handleAlphaContourExecute = async (finalParams: Record<string, any>) => {
        setIsAlphaExecuting(true);
        try {
            const bridge = await getBridge();
            const maxSide = getAlphaMaxSide(finalParams.alphaResolution);
            const exportResult = await bridge.executeScript({
                scriptId: 'alpha-contour',
                scriptPath: './src/scripts/path/alpha-contour.jsx',
                args: {
                    ...finalParams,
                    mode: 'exportSelection',
                    maxSide,
                    requireImage: true,
                },
            });

            if (!exportResult.success) return exportResult;

            const exportData = exportResult.data as AlphaExportData | undefined;
            if (!exportData?.pngPath || !Array.isArray(exportData.bounds)) {
                return { success: false, error: 'Alpha 导出结果无效' };
            }

            const image = await loadImageDataFromPath(exportData.pngPath);
            const threshold = clampNumber(Number(finalParams.alphaThreshold ?? 16), 1, 254);
            const offsetPt = convertPanelUnitToPt(Number(finalParams.offset ?? 0), String(finalParams.offsetUnit || 'pt'));
            const pxSizeX = Math.abs((exportData.bounds[2] - exportData.bounds[0]) / image.width);
            const pxSizeY = Math.abs((exportData.bounds[1] - exportData.bounds[3]) / image.height);
            const pxSize = Math.max(0.001, (pxSizeX + pxSizeY) / 2);
            const radiusPx = Math.round(Math.abs(offsetPt) / pxSize);
            const simplify = clampNumber(Number(finalParams.alphaSimplify ?? 2), 0, 20);

            let mask = alphaToMask(image.data, image.width, image.height, threshold);
            const initialMaskPixels = countMaskPixels(mask);
            if (initialMaskPixels === 0) {
                return {
                    success: false,
                    error: `导出的图片没有检测到 Alpha 像素。请确认原图有透明背景，或降低 Alpha 阈值。导出尺寸：${image.width}x${image.height}`,
                };
            }
            if (radiusPx > 0) {
                mask = offsetPt >= 0
                    ? morphology(mask, image.width, image.height, radiusPx, 'dilate')
                    : morphology(mask, image.width, image.height, radiusPx, 'erode');
            }
            const finalMaskPixels = countMaskPixels(mask);
            if (finalMaskPixels === 0) {
                return {
                    success: false,
                    error: `偏移后 Alpha 区域为空。当前偏移量可能过大，尤其是负偏移时。原始像素：${initialMaskPixels}`,
                };
            }

            const contour = traceLargestContour(mask, image.width, image.height);
            if (contour.length < 3) {
                const fallbackContour = boundingBoxContour(mask, image.width, image.height);
                if (fallbackContour.length < 3) {
                    return {
                        success: false,
                        error: `没有从图片 Alpha 中提取到有效外轮廓。Alpha 像素：${finalMaskPixels}，导出尺寸：${image.width}x${image.height}`,
                    };
                }
                const points = fallbackContour.map(([x, y]) => pixelToDocumentPoint(x, y, image.width, image.height, exportData.bounds));
                return await bridge.executeScript({
                    scriptId: 'alpha-contour',
                    scriptPath: './src/scripts/path/alpha-contour.jsx',
                    args: {
                        ...finalParams,
                        mode: 'createContour',
                        points,
                    },
                });
            }

            const simplified = simplify > 0 ? simplifyClosedPolyline(contour, simplify) : contour;
            const capped = reducePointCount(simplified, 1800);
            const points = capped.map(([x, y]) => pixelToDocumentPoint(x, y, image.width, image.height, exportData.bounds));

            return await bridge.executeScript({
                scriptId: 'alpha-contour',
                scriptPath: './src/scripts/path/alpha-contour.jsx',
                args: {
                    ...finalParams,
                    mode: 'createContour',
                    points,
                },
            });
        } catch (err: any) {
            return { success: false, error: err?.message || 'Alpha 轮廓提取失败' };
        } finally {
            setIsAlphaExecuting(false);
        }
    };

    const handleImageVectorizeExecute = async (finalParams: Record<string, any>, preview = false) => {
        if (!preview) setIsAlphaExecuting(true);
        try {
            const bridge = await getBridge();
            const maxSide = getAlphaMaxSide(finalParams.resolution);
            const exportResult = await bridge.executeScript({
                scriptId: 'image-vectorize',
                scriptPath: './src/scripts/images/image-vectorize.jsx',
                args: {
                    ...finalParams,
                    mode: 'exportSelection',
                    maxSide,
                    requireImage: true,
                },
            });

            if (!exportResult.success) return exportResult;

            const exportData = exportResult.data as AlphaExportData | undefined;
            if (!exportData?.pngPath || !Array.isArray(exportData.bounds)) {
                return { success: false, error: '图片导出结果无效' };
            }

            const image = await loadImageDataFromPath(exportData.pngPath);
            const vectorized = vectorizeImageData(image, finalParams);
            if (!vectorized.success) return vectorized;
            return await bridge.executeScript({
                scriptId: 'image-vectorize',
                scriptPath: './src/scripts/images/image-vectorize.jsx',
                args: {
                    ...finalParams,
                    mode: 'importSvg',
                    svgCode: vectorized.svgCode,
                    bounds: exportData.originalBounds || exportData.bounds,
                    preview,
                },
            });
        } catch (err: any) {
            return { success: false, error: err?.message || '图片转矢量失败' };
        } finally {
            if (!preview) setIsAlphaExecuting(false);
        }
    };

    const handleGenerateImageContour = async () => {
        setError(null);
        setInlineResultMessage(null);
        setImageContourPreviews([]);
        setImageContourExport(null);
        setImageContourSelectedKey(null);
        setIsAlphaExecuting(true);
        try {
            const bridge = await getBridge();
            const exportResult = await bridge.executeScript({
                scriptId: 'extract-image-contour',
                scriptPath: './src/scripts/path/extract-image-contour.jsx',
                args: { mode: 'exportSelection' },
            });
            if (!exportResult.success) {
                setError(exportResult.error || '图片读取失败');
                return;
            }
            const exportData = (exportResult.data || {}) as ImageContourExportData;
            if (!exportData.filePath || !Array.isArray(exportData.bounds)) {
                setError('图片读取结果无效');
                return;
            }
            const previews = decodeImageContourPreviews(exportData.filePath);
            setImageContourExport(exportData);
            setImageContourPreviews(previews);
        } catch (err: any) {
            setError(err?.message || '图片外轮廓生成失败');
        } finally {
            setIsAlphaExecuting(false);
        }
    };

    const handleApplyImageContour = async (preview: ImageContourPreview) => {
        if (!preview.mask || !imageContourExport?.bounds) return;
        setError(null);
        setImageContourSelectedKey(preview.key);
        setIsAlphaExecuting(true);
        try {
            let contour = traceLargestContour(preview.mask, preview.width, preview.height);
            if (contour.length < 3) contour = boundingBoxContour(preview.mask, preview.width, preview.height);
            if (contour.length < 3) {
                setError('这个模式没有提取到有效轮廓');
                return;
            }
            const simplify = clampNumber(Number(params.simplify ?? 2), 0, 20);
            const simplified = simplify > 0 ? simplifyClosedPolyline(contour, simplify) : contour;
            const capped = reducePointCount(simplified, 1800);
            const points = capped.map(([x, y]) => pixelToDocumentPoint(x, y, preview.width, preview.height, imageContourExport.bounds));
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'extract-image-contour',
                scriptPath: './src/scripts/path/extract-image-contour.jsx',
                args: {
                    ...params,
                    mode: 'createContour',
                    points,
                },
            });
            if (!result.success) setError(result.error || '应用到 AI 失败');
            else {
                setInlineResultMessage(getInlineSuccessMessage(result));
                setShowSuccess(true);
            }
        } catch (err: any) {
            setError(err?.message || '应用到 AI 失败');
        } finally {
            setIsAlphaExecuting(false);
        }
    };

    const exportImageVectorizeSource = useCallback(async (finalParams: Record<string, any>) => {
        setVectorizeLoading(true);
        try {
            const bridge = await getBridge();
            const maxSide = getAlphaMaxSide(finalParams.resolution);
            const exportResult = await bridge.executeScript({
                scriptId: 'image-vectorize',
                scriptPath: './src/scripts/images/image-vectorize.jsx',
                args: {
                    ...finalParams,
                    mode: 'exportSelection',
                    maxSide,
                    requireImage: true,
                },
            });
            if (!exportResult.success) {
                setError(exportResult.error || '图片导出失败');
                return;
            }
            const exportData = exportResult.data as AlphaExportData | undefined;
            if (!exportData?.pngPath || !Array.isArray(exportData.bounds)) {
                setError('图片导出结果无效');
                return;
            }
            const image = await loadImageDataFromPath(exportData.pngPath);
            setVectorizeImage(image);
            setVectorizeExport(exportData);
            setVectorizeSourceUrl(imageDataToPngDataUrl(image));
            setVectorizeStats((prev) => ({ regions: prev?.regions || 0, pixels: prev?.pixels || 0, size: `${image.width}x${image.height}` }));
            setError(null);
        } catch (err: any) {
            setError(err?.message || '图片导出失败');
        } finally {
            setVectorizeLoading(false);
        }
    }, []);

    useEffect(() => {
        if (script.id !== 'image-vectorize' || !isExpanded) return;
        exportImageVectorizeSource(params);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [script.id, isExpanded]);

    const injectSelectedImageToRetrace = useCallback(async () => {
        if (!vectorizeSourceUrl) {
            setError('请先读取 AI 中选中的图片');
            return;
        }
        const frameDoc = retraceFrameRef.current?.contentDocument;
        if (!frameDoc) {
            setError('图片转矢量页面还没有加载完成');
            return;
        }
        try {
            const response = await fetch(vectorizeSourceUrl);
            const blob = await response.blob();
            const file = new File([blob], 'hopeflow-selection.png', { type: 'image/png' });
            const input = frameDoc.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement | null;
            const target = frameDoc.querySelector('.container') || frameDoc.body;
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            if (input) {
                input.files = dataTransfer.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                target.dispatchEvent(new DragEvent('drop', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer,
                }));
            }
            setError(null);
        } catch (err: any) {
            setError(err?.message || '无法把选中图片送入矢量化页面');
        }
    }, [vectorizeSourceUrl]);

    useEffect(() => {
        if (script.id !== 'image-vectorize' || !isExpanded || !vectorizeSourceUrl) return;
        const timer = window.setTimeout(() => {
            injectSelectedImageToRetrace();
        }, 180);
        return () => window.clearTimeout(timer);
    }, [script.id, isExpanded, vectorizeSourceUrl, injectSelectedImageToRetrace]);

    const syncVectorizeParamsToRetrace = useCallback(() => {
        const frameWin = retraceFrameRef.current?.contentWindow;
        if (!frameWin) return;
        const traceMode = params.traceMode || 'single';
        const retraceParams = { ...params };
        if (traceMode !== 'single') {
            delete retraceParams.detailMode;
        }
        frameWin.postMessage({
            type: 'hopeflow:set-vectorize-params',
            params: retraceParams,
        }, '*');
    }, [params]);

    useEffect(() => {
        if (script.id !== 'image-vectorize' || !isExpanded) return;
        const timer = window.setTimeout(syncVectorizeParamsToRetrace, 120);
        return () => window.clearTimeout(timer);
    }, [script.id, isExpanded, syncVectorizeParamsToRetrace]);

    const renderVectorizeSvgToRetrace = useCallback((svgCode: string) => {
        const frameWin = retraceFrameRef.current?.contentWindow;
        if (!frameWin) return;
        frameWin.postMessage({
            type: 'hopeflow:render-vectorize-svg',
            svgCode,
            sourceUrl: vectorizeSourceUrl,
        }, '*');
    }, [vectorizeSourceUrl]);

    const runVectorizePreview = useCallback((image: ImageData, currentParams: Record<string, any>) => {
        const traceMode = String(currentParams.traceMode || 'single');
        const requestId = ++vectorizeRequestRef.current;

        if (!vectorizeWorkerRef.current) {
            vectorizeWorkerRef.current = new Worker('./retrace/assets/trace-worker-CJ0-WUZ_.js', { name: 'hopeflow-vectorize-preview' });
        }

        const worker = vectorizeWorkerRef.current;
        worker.onmessage = (event: MessageEvent) => {
            const data = event.data || {};
            if (data.requestId !== requestId) return;
            if (!data.success) {
                setError(data.error || '实时预览生成失败');
                return;
            }
            const svgCode = String(data.svg || data.baseSvg || '');
            setVectorizeSvg(svgCode);
            setVectorizeStats((prev) => ({
                regions: prev?.regions || 0,
                pixels: image.width * image.height,
                size: `${image.width}x${image.height}`,
            }));
            renderVectorizeSvgToRetrace(svgCode);
            setError(null);
        };
        worker.onerror = (event) => {
            if (vectorizeRequestRef.current !== requestId) return;
            setError(event.message || '实时预览 worker 失败');
        };

        const singleDetailMode = String(currentParams.detailMode || 'auto');
        const singleThreshold = Number(currentParams.strokeDetail ?? currentParams.autoThreshold ?? 198);
        const singleOptions = singleDetailMode === 'auto'
            ? {
                threshold: singleThreshold,
                turdsize: Number(currentParams.autoFilterSize ?? 6),
                alphamax: 1,
                opttolerance: 0.2,
                turnpolicy: 'minority',
                optcurve: true,
                fillColor: resolveVectorizePreviewFill(currentParams.fillColor),
            }
            : {
                threshold: singleThreshold,
                turdsize: Number(currentParams.autoFilterSize ?? 6),
                alphamax: Number(currentParams.alphamax ?? 1),
                opttolerance: Number(currentParams.opttolerance ?? 0.2),
                turnpolicy: String(currentParams.turnpolicy || 'minority'),
                optcurve: currentParams.optcurve !== false,
                fillColor: resolveVectorizePreviewFill(currentParams.fillColor),
            };
        const multiOptions = {
            color_mode: String(currentParams.colorMode || 'color'),
            mode: String(currentParams.curveFitting || 'spline'),
            hierarchical: String(currentParams.hierarchical || 'stacked'),
            filter_speckle: Number(currentParams.filterSpeckle ?? 8),
            color_precision: Number(currentParams.colorPrecision ?? 6),
            gradient_step: Number(currentParams.gradientStep ?? 32),
            corner_threshold: Number(currentParams.cornerThreshold ?? 60),
            segment_length: Number(currentParams.segmentLength ?? 8),
            splice_threshold: Number(currentParams.spliceThreshold ?? 45),
        };
        const gradientOptions = {
            preprocess: Number(currentParams.preprocessStrength ?? 18),
            edgeThreshold: Number(currentParams.edgeThreshold ?? 107),
            colorTolerance: Number(currentParams.colorTolerance ?? 50),
            minRegionArea: Number(currentParams.minRegionArea ?? 260),
            maxRegions: Number(currentParams.maxRegions ?? 55),
            maxLayers: Number(currentParams.maxLayers ?? 64),
            fitStrictness: Number(currentParams.fitStrictness ?? 11),
            simplifyThreshold: Number(currentParams.pathSimplify ?? 0.9),
            enableRadial: currentParams.enableRadial !== false,
            overlayExpandPx: 1,
            debugLeakPreview: false,
            stackedFriendlyOutput: !!currentParams.stackedFriendlyOutput,
        };

        const preparedImage = prepareVectorizeInputImage(image, currentParams);
        worker.postMessage({
            id: 'hopeflow-preview',
            requestId,
            type: traceMode,
            imageData: {
                width: preparedImage.width,
                height: preparedImage.height,
                data: preparedImage.data,
            },
            options: traceMode === 'single' ? singleOptions : traceMode === 'multi' ? multiOptions : gradientOptions,
            multiCleanEdge: !!currentParams.multiCleanEdge,
            multiCleanEdgeBlend: Number(currentParams.blendStrength ?? 0.48),
            multiPaletteConstraint: currentParams.multiPaletteConstraint !== false,
            targetColors: Number(currentParams.targetColors ?? 17),
            detectedPalette: [],
            invert: false,
            autoSimplify: traceMode !== 'gradient' && currentParams.autoSimplify !== false,
            simplifyOptions: {
                threshold: traceMode === 'single'
                    ? Number(currentParams.simplifyThreshold ?? 0.5)
                    : Number(currentParams.pathSimplify ?? currentParams.opttolerance ?? 0.2),
                removeNoise: true,
                simplify: true,
                noiseSize: 4,
                preserveNearLinear: true,
                nearLinearToleranceScale: 1,
            },
        });
    }, [renderVectorizeSvgToRetrace]);

    useEffect(() => {
        if (script.id !== 'image-vectorize' || !isExpanded || !vectorizeImage) return;
        const timer = window.setTimeout(() => {
            runVectorizePreview(vectorizeImage, params);
        }, 160);
        return () => window.clearTimeout(timer);
    }, [script.id, isExpanded, vectorizeImage, params, runVectorizePreview]);

    useEffect(() => {
        return () => {
            vectorizeWorkerRef.current?.terminate();
            vectorizeWorkerRef.current = null;
        };
    }, []);

    const applyVectorizeDebugger = useCallback(async () => {
        const frameDoc = retraceFrameRef.current?.contentDocument;
        const svg = frameDoc?.querySelector('.svg-preview svg') as SVGSVGElement | null;
        const svgCode = vectorizeSvg || svg?.outerHTML || '';
        if (!svgCode.trim()) {
            setError('原版调试器里还没有可应用的 SVG');
            return;
        }
        setIsAlphaExecuting(true);
        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'image-vectorize',
                scriptPath: './src/scripts/images/image-vectorize.jsx',
                args: {
                    mode: 'importSvg',
                    svgCode,
                    bounds: vectorizeExport?.originalBounds || vectorizeExport?.bounds,
                },
            });
            if (!result.success) setError(result.error || '导入失败');
            else {
                setInlineResultMessage(getInlineSuccessMessage(result));
                setShowSuccess(true);
                setError(null);
            }
        } catch (err: any) {
            setError(err?.message || '导入失败');
        } finally {
            setIsAlphaExecuting(false);
        }
    }, [getInlineSuccessMessage, vectorizeExport, vectorizeSvg]);

    useEffect(() => {
        if (script.id !== 'image-vectorize' || !isExpanded) {
            setVectorizeImage(null);
            setVectorizeExport(null);
            setVectorizeSourceUrl('');
            setVectorizeSvg('');
            setVectorizeStats(null);
            if (error) {
                setError(null);
            }
        }
    }, [script.id, isExpanded]);

    // Live preview state and effect
    const handleExecute = async () => {
        setError(null);
        setInlineResultMessage(null);

        if (script.params) {
            const validationError = validateParams(script, params);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        // If undo-based preview is active, wait for any in-flight preview to finish,
        // then inject shouldUndo so the final execute undoes the preview first.
        const finalParams = { ...params };
        if (UNDO_PREVIEW_SCRIPTS[script.id]) {
            await undoPreviewChainRef.current;
            if (undoPreviewActiveRef.current) {
                finalParams.shouldUndo = true;
                undoPreviewActiveRef.current = false;
            }
        }

        const result = script.id === 'offset-bleed' && finalParams.contourMode === 'alpha'
            ? await handleAlphaContourExecute(finalParams)
            : script.id === 'image-vectorize'
                ? await handleImageVectorizeExecute(finalParams)
                : await executeScriptWithAccess(finalParams);
        if (!result.success) {
            setError(result.error || '执行失败');
        } else {
            setInlineResultMessage(getInlineSuccessMessage(result));
            setShowSuccess(true);
        }
    };

    const handleGridAlign = async (alignment: string) => {
        setError(null);
        const duplicate = params['duplicate'] === true || params['duplicate'] === 'true';
        const result = await executeScriptWithAccess({ alignment, duplicate });
        if (!result.success) {
            setError(result.error || '执行失败');
        } else {
            setShowSuccess(true);
        }
    };

    return (
        <div
            style={{
                borderBottom: '1px solid var(--color-border)',
                background: isExpanded ? 'var(--color-bg-primary)' : 'transparent',
                transition: 'background-color 0.2s ease'
            }}
        >
            {/* Header Row */}
            <div
                onClick={handleMainClick}
                style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    minHeight: '40px'
                }}
                onMouseEnter={e => {
                    setIsHovered(true);
                    if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={e => {
                    setIsHovered(false);
                    if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <div className="flex items-center gap-sm">
                    {script.icon && (
                        <Icon name={script.icon} size={14} style={{
                            opacity: isHovered ? 0.85 : 0.4,
                            flexShrink: 0,
                            transition: 'opacity 0.15s ease',
                        }} />
                    )}
                    <h3 style={{ fontSize: 'var(--font-size-md)', margin: 0, fontWeight: 500 }}>{script.name}</h3>
                    {script.badges?.map((badge) => (
                        <span
                            key={badge}
                            style={{
                                fontSize: '10px',
                                lineHeight: 1,
                                color: 'var(--color-accent)',
                                background: 'var(--color-accent-soft)',
                                border: '1px solid var(--color-accent-muted)',
                                borderRadius: '999px',
                                padding: '3px 6px',
                                fontWeight: 600,
                                flexShrink: 0,
                            }}
                        >
                            {badge}
                        </span>
                    ))}
                    {script.description && <InfoIcon tooltip={script.description} />}
                </div>

                <div className="flex items-center" style={{ gap: '4px' }}>
                    {/* Favorite Button */}
                    {(() => {
                        const isFavorited = settings.scriptMeta[script.id]?.favorited ?? false;
                        return (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const current = settings.scriptMeta[script.id] || { count: 0, lastRun: 0, favorited: false, tags: [] };
                                    update('scriptMeta', {
                                        ...settings.scriptMeta,
                                        [script.id]: { ...current, favorited: !current.favorited },
                                    });
                                }}
                                title={isFavorited ? '取消收藏' : '收藏（快速访问）'}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isFavorited ? '#FFCF4D' : 'var(--color-text-tertiary)',
                                    opacity: isFavorited ? 1 : (isHovered ? 0.6 : 0.2),
                                    transition: 'color 0.15s ease, opacity 0.15s ease',
                                    flexShrink: 0,
                                }}
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </button>
                        );
                    })()}
                    {isExpandable ? (
                        <div style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease, opacity 0.15s ease, color 0.15s ease',
                            opacity: isExpanded || isHovered ? 1 : 0.4,
                            color: isHovered && !isExpanded ? 'var(--color-accent)' : 'inherit',
                        }}>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                            </svg>
                        </div>
                    ) : (
                        /* Direct execute - Status Icon */
                        <div style={{
                            opacity: showSuccess || isHovered ? 1 : 0.4,
                            display: 'flex', alignItems: 'center',
                            color: showSuccess ? 'var(--color-success)' : isHovered ? 'var(--color-accent)' : 'inherit',
                            transition: 'all 0.2s ease',
                        }}>
                            {isExecuting ? (
                                <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                                </svg>
                            ) : showSuccess ? (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Error Display (Visible even if collapsed) */}
            {(!isExpanded && !isExpandable && error) && (
                <div style={{
                    padding: '0 var(--spacing-lg) var(--spacing-md)',
                    animation: 'slideDown 0.2s ease-out'
                }}>
                    <div className="alert alert-error" style={{ marginBottom: 0 }}>
                        {error}
                    </div>
                </div>
            )}

            {(!isExpanded && !isExpandable && inlineResultMessage) && (
                <div style={{
                    padding: '0 var(--spacing-lg) var(--spacing-md)',
                    animation: 'slideDown 0.2s ease-out'
                }}>
                    <div
                        style={{
                            marginBottom: 0,
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid color-mix(in srgb, var(--color-success) 35%, var(--color-border))',
                            background: 'color-mix(in srgb, var(--color-success) 10%, var(--color-bg-secondary))',
                            color: 'var(--color-text-primary)',
                            fontSize: '12px',
                            lineHeight: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span>{inlineResultMessage.prefix}</span>
                        {inlineResultMessage.highlight && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '28px',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    background: 'color-mix(in srgb, var(--color-accent) 18%, white)',
                                    border: '1px solid color-mix(in srgb, var(--color-accent) 45%, var(--color-border))',
                                    color: 'var(--color-accent)',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    lineHeight: 1.2,
                                }}
                            >
                                {inlineResultMessage.highlight}
                            </span>
                        )}
                        {inlineResultMessage.suffix && <span>{inlineResultMessage.suffix}</span>}
                    </div>
                </div>
            )}

            {/* Expanded Body */}
            {
                isExpanded && (
                    <div style={{
                        padding: 'var(--spacing-sm) var(--spacing-lg) var(--spacing-lg) var(--spacing-lg)',
                        borderTop: '1px solid var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        animation: 'slideDown 0.2s ease-out'
                    }}>
                        {error && <div className="alert alert-error mb-md">{error}</div>}
                        {renderPanelContent()}
                    </div>
                )
            }
        </div >
    );

    // --- Panel registry lookup (standalone + param-based panels) ---

    function renderPanelContent() {
        // Standalone panels manage their own state entirely
        const StandalonePanel = STANDALONE_PANELS[script.id];
        if (StandalonePanel) return <StandalonePanel />;

        // Param panels receive execution context from ScriptCard
        const ParamPanel = PARAM_PANELS[script.id];
        if (ParamPanel) return (
            <ParamPanel
                script={script}
                params={params}
                setParams={setParams}
                isExecuting={isExecuting}
                onRun={async (overrideParams) => {
                    return executeScriptWithAccess(overrideParams ?? params);
                }}
                onError={setError}
                onSuccess={() => setShowSuccess(true)}
            />
        );

        // Fall through to inline special UIs and generic UI
        return renderSpecialUI() || renderGenericUI();
    }

    // --- Special UI renderers (no duplicate titles: header row already shows name + info) ---

    function renderSpecialUI() {
        if (script.id === 'extract-image-contour') {
            const paramMap = new Map((script.params || []).map((p) => [p.name, p]));
            const fieldNames = ['simplify', 'smoothAmount', 'stroke', 'strokeUnit', 'position', 'container'];
            const boolNames = ['smoothResult', 'enableStroke'];
            const renderField = (name: string) => {
                const p = paramMap.get(name);
                if (!p) return null;
                if ((name === 'stroke' || name === 'strokeUnit') && params.enableStroke === false) return null;
                if (name === 'smoothAmount' && params.smoothResult === false) return null;
                return (
                    <div key={name}>
                        <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {p.label}
                        </label>
                        {renderParamInput(p, params, setParams)}
                    </div>
                );
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px 10px',
                    }}>
                        {fieldNames.map(renderField)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {boolNames.map((name) => {
                            const p = paramMap.get(name);
                            if (!p) return null;
                            const active = params[p.name] ?? p.default ?? false;
                            return (
                                <span key={p.name} style={chipStyle(active)}
                                    onClick={() => setParams(prev => ({ ...prev, [p.name]: !active }))}>
                                    {p.label}
                                </span>
                            );
                        })}
                    </div>
                    <SuccessButton className="btn btn-primary" onClick={handleGenerateImageContour} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting && !imageContourPreviews.length ? <><span className="spinner" /> 生成中...</> : '执行'}
                    </SuccessButton>
                    {imageContourPreviews.length > 0 && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 8,
                        }}>
                            {imageContourPreviews.map((preview) => (
                                <div
                                    key={preview.key}
                                    onClick={() => {
                                        if (!isExecuting) handleApplyImageContour(preview);
                                    }}
                                    style={{
                                        border: imageContourSelectedKey === preview.key
                                            ? '2px solid var(--color-accent)'
                                            : '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        background: 'var(--color-bg-secondary)',
                                        cursor: isExecuting ? 'default' : 'pointer',
                                        opacity: isExecuting && imageContourSelectedKey === preview.key ? 0.65 : 1,
                                    }}
                                >
                                    <div style={{
                                        padding: '5px 7px',
                                        fontSize: 10,
                                        color: 'var(--color-text-secondary)',
                                        borderBottom: '1px solid var(--color-border)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {preview.name}
                                    </div>
                                    <img
                                        src={preview.url}
                                        alt={preview.name}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            height: 120,
                                            objectFit: 'contain',
                                            background: '#fff',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (script.id === 'image-vectorize') {
            const paramMap = new Map((script.params || []).map((p) => [p.name, p]));
            const getParam = (name: string) => paramMap.get(name);
            const mode = params.traceMode || 'single';
            const detailMode = params.detailMode || 'auto';
            const singleFieldNames = mode === 'single'
                ? ['strokeDetail', 'alphamax', 'opttolerance', 'turnpolicy', 'autoFilterSize', 'simplifyThreshold']
                : [];
            const multiFieldNames = mode === 'multi'
                ? ['filterSpeckle', 'colorPrecision', 'targetColors', 'gradientStep', 'curveFitting', 'cornerThreshold', 'segmentLength', 'spliceThreshold', 'blendStrength']
                : [];
            const gradientFieldNames = mode === 'gradient'
                ? ['preprocessStrength', 'edgeThreshold', 'colorTolerance', 'minRegionArea', 'maxRegions', 'maxLayers', 'fitStrictness', 'pathSimplify']
                : [];
            const fieldNames = [
                ...singleFieldNames,
                ...multiFieldNames,
                ...gradientFieldNames,
            ].filter((name, index, arr) => arr.indexOf(name) === index);
            const boolNames = [
                ...(mode === 'single' ? ['optcurve', 'autoSimplify'] : []),
                ...(mode === 'multi' ? ['multiCleanEdge', 'multiPaletteConstraint'] : []),
                ...(mode === 'gradient' ? ['enableRadial', 'stackedFriendlyOutput'] : []),
            ];
            const renderVectorizeNumberField = (p: any) => {
                const rawValue = params[p.name] ?? p.default ?? p.min ?? 0;
                const min = Number.isFinite(Number(p.min)) ? Number(p.min) : 0;
                const max = Number.isFinite(Number(p.max)) ? Number(p.max) : 100;
                const step = Number.isFinite(Number(p.step)) ? Number(p.step) : 1;
                const numericValue = Number.isFinite(Number(rawValue)) ? Number(rawValue) : min;
                const sliderValue = clampNumber(numericValue, min, max);
                const updateValue = (nextValue: number | '') => {
                    setParams((prev) => ({ ...prev, [p.name]: nextValue }));
                };

                return (
                    <div key={p.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                {p.label}
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={rawValue}
                                min={min}
                                max={max}
                                step={step}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    updateValue(next === '' ? '' : parseFloat(next));
                                }}
                                onBlur={() => {
                                    if (rawValue === '') updateValue(p.default ?? min);
                                    else updateValue(clampNumber(Number(rawValue), min, max));
                                }}
                                style={{ width: 86, height: 30, padding: '0 8px', textAlign: 'right' }}
                            />
                        </div>
                        <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={sliderValue}
                            onChange={(e) => updateValue(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>
                );
            };
            const renderVectorizeField = (name: string) => {
                const p = getParam(name);
                if (!p) return null;
                if (p.type === 'number') return renderVectorizeNumberField(p);
                return (
                    <div key={name}>
                        <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: 'var(--color-text-tertiary)' }}>{p.label}</label>
                        {renderParamInput(p, params, setParams)}
                    </div>
                );
            };
            const renderVectorizeBackgroundControl = () => {
                const enabled = params.imageBackgroundEnabled ?? getParam('imageBackgroundEnabled')?.default ?? true;
                const currentColor = normalizeHexColor(params.imageBackgroundColor || getParam('imageBackgroundColor')?.default || '#FFFFFF');
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <span
                                style={{ ...chipStyle(enabled), gap: 8, padding: '6px 10px' }}
                                onClick={() => setParams((prev) => ({ ...prev, imageBackgroundEnabled: !enabled }))}
                            >
                                {getParam('imageBackgroundEnabled')?.label || '图片背景色'}
                            </span>
                            <button
                                type="button"
                                title="当前背景色"
                                onClick={() => setParams((prev) => ({ ...prev, imageBackgroundEnabled: true }))}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 2,
                                    border: '1px solid var(--color-border)',
                                    background: currentColor,
                                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                                    cursor: 'pointer',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {VECTORIZE_BACKGROUND_SWATCHES.map((color) => {
                                const active = enabled && currentColor.toUpperCase() === color;
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        title={color}
                                        onClick={() => setParams((prev) => ({
                                            ...prev,
                                            imageBackgroundEnabled: true,
                                            imageBackgroundColor: color,
                                        }))}
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 5,
                                            border: active ? '2px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.18)',
                                            background: color,
                                            boxShadow: active ? '0 0 0 1px rgba(58,134,255,0.45)' : 'inset 0 0 0 1px rgba(0,0,0,0.18)',
                                            cursor: 'pointer',
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            };
            const segmentButton = (name: string, value: string, label: string) => {
                const activeValue = params[name] ?? getParam(name)?.default;
                return (
                    <button
                        key={value}
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setParams((prev) => ({ ...prev, [name]: value }))}
                        style={{
                            flex: 1,
                            height: 32,
                            padding: '0 8px',
                            background: activeValue === value ? 'var(--color-accent-soft)' : 'var(--color-bg-control)',
                            borderColor: activeValue === value ? 'var(--color-accent)' : 'var(--color-border)',
                            color: activeValue === value ? '#dceeff' : 'var(--color-text-secondary)',
                        }}
                    >
                        {label}
                    </button>
                );
            };
            const previewAspect = vectorizeImage ? `${vectorizeImage.width} / ${vectorizeImage.height}` : '1 / 1';
            const previewSvg = normalizeSvgForPanelPreview(vectorizeSvg);
            const previewBackground = params.imageBackgroundEnabled !== false
                ? normalizeHexColor(params.imageBackgroundColor || '#FFFFFF')
                : 'transparent';
            const comparePct = clampNumber(Number(vectorizeCompare), 0, 100);
            const restoreVectorizeDefaults = () => {
                if (!script.params) return;
                const defaults: Record<string, any> = {};
                script.params.forEach((param) => {
                    if (param.default !== undefined) defaults[param.name] = param.default;
                });
                setParams((prev) => ({
                    ...defaults,
                    traceMode: prev.traceMode ?? defaults.traceMode,
                    detailMode: prev.detailMode ?? defaults.detailMode,
                    hierarchical: prev.hierarchical ?? defaults.hierarchical,
                }));
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        height: 520,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#171717',
                        backgroundImage: 'linear-gradient(45deg, #202020 25%, transparent 25%), linear-gradient(-45deg, #202020 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #202020 75%), linear-gradient(-45deg, transparent 75%, #202020 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
                        padding: 16,
                    }}>
                        {vectorizeSourceUrl ? (
                            <div style={{
                                position: 'relative',
                                background: previewBackground,
                                overflow: 'hidden',
                            }}>
                                <img
                                    src={vectorizeSourceUrl}
                                    alt=""
                                    style={{
                                        display: 'block',
                                        maxWidth: '100%',
                                        maxHeight: 488,
                                        width: 'auto',
                                        height: 'auto',
                                        opacity: 0,
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        overflow: 'hidden',
                                        clipPath: `inset(0 ${100 - comparePct}% 0 0)`,
                                    }}
                                >
                                    <img
                                        src={vectorizeSourceUrl}
                                        alt=""
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: 'block',
                                        }}
                                    />
                                </div>
                                {previewSvg ? (
                                    <>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                overflow: 'hidden',
                                                clipPath: `inset(0 0 0 ${comparePct}%)`,
                                            }}
                                            dangerouslySetInnerHTML={{ __html: previewSvg }}
                                        />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                bottom: 0,
                                                left: `${comparePct}%`,
                                                width: 2,
                                                transform: 'translateX(-1px)',
                                                background: 'rgba(255,255,255,0.86)',
                                                boxShadow: '0 0 0 1px rgba(0,0,0,0.18), 0 0 12px rgba(0,0,0,0.32)',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${comparePct}%`,
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: 30,
                                                height: 30,
                                                borderRadius: 999,
                                                background: 'rgba(255,255,255,0.92)',
                                                color: '#555',
                                                border: '1px solid rgba(0,0,0,0.18)',
                                                boxShadow: '0 3px 12px rgba(0,0,0,0.28)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                lineHeight: 1,
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            ||
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={comparePct}
                                            title="原图 / 矢量对比"
                                            onChange={(event) => setVectorizeCompare(Number(event.target.value))}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                cursor: 'ew-resize',
                                            }}
                                        />
                                    </>
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                                        正在生成预览...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>请选择 1 张链接或嵌入图片</div>
                        )}
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        padding: 10,
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, minWidth: 0 }}>
                            {segmentButton('traceMode', 'single', '单色')}
                            {segmentButton('traceMode', 'multi', '多色')}
                            {segmentButton('traceMode', 'gradient', '渐变')}
                        </div>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={restoreVectorizeDefaults}
                                style={{
                                    height: 32,
                                    padding: '0 12px',
                                    whiteSpace: 'nowrap',
                                    background: 'var(--color-bg-control)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                恢复默认
                            </button>
                        </div>
                        {mode === 'single' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                                {segmentButton('detailMode', 'auto', '自动')}
                                {segmentButton('detailMode', 'pro', '专业')}
                            </div>
                        )}
                        {mode === 'multi' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                                {segmentButton('hierarchical', 'cutout', '镂空')}
                                {segmentButton('hierarchical', 'stacked', '堆叠')}
                            </div>
                        )}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: 12,
                        }}>
                            {fieldNames.map(renderVectorizeField)}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {boolNames.map((name) => {
                                const p = getParam(name);
                                if (!p) return null;
                                const active = params[name] ?? p.default ?? false;
                                return (
                                    <span key={name} style={chipStyle(active)} onClick={() => setParams((prev) => ({ ...prev, [name]: !active }))}>
                                        {p.label}
                                    </span>
                                );
                            })}
                        </div>
                        {mode === 'single' && renderVectorizeBackgroundControl()}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <SuccessButton className="btn" onClick={() => exportImageVectorizeSource(params)} disabled={isExecuting || vectorizeLoading}>
                            {vectorizeLoading ? <><span className="spinner" /> 读取中...</> : '重新读取选中图片'}
                        </SuccessButton>
                        <SuccessButton className="btn" onClick={() => {
                            if (vectorizeImage) runVectorizePreview(vectorizeImage, params);
                        }} disabled={isExecuting || vectorizeLoading || !vectorizeImage}>
                            刷新预览
                        </SuccessButton>
                        <SuccessButton className="btn btn-primary" onClick={applyVectorizeDebugger} disabled={isExecuting || !vectorizeExport}>
                            {isExecuting ? <><span className="spinner" /> 应用中...</> : '应用到 AI'}
                        </SuccessButton>
                    </div>
                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: 10, textAlign: 'center' }}>
                        {vectorizeLoading ? '正在读取 AI 当前选中图片' : vectorizeExport ? `已读取 ${vectorizeStats?.size || ''} ${vectorizeExport.itemType || ''}` : '请选择 1 张链接或嵌入图片'}
                    </div>
                </div>
            );
        }

        if (script.id === 'banner-grommets') {
            const getP = (name: string, fallback: any) => params[name] ?? fallback;
            const setP = (name: string, value: any) => setParams(prev => ({ ...prev, [name]: value }));
            const isSpacing = getP('countMode', 'count') === 'spacing';
            const countPreset = getP('countPreset', 'custom');
            const appearance = getP('appearance', 'fill');
            const colorPreset = getP('colorPreset', 'black');

            const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 };
            const labelSt: React.CSSProperties = { fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.2 };
            const inputSt: React.CSSProperties = { height: '34px', fontSize: '13px' };
            const sectionSt: React.CSSProperties = {
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingTop: '2px',
            };
            const rowGrid: React.CSSProperties = {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px 10px',
            };
            const segmentWrap: React.CSSProperties = {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '4px',
                padding: '3px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-tertiary)',
            };
            const segmentBtn = (active: boolean): React.CSSProperties => ({
                border: 'none',
                borderRadius: '6px',
                background: active ? 'var(--color-accent)' : 'transparent',
                color: active ? '#fff' : 'var(--color-text-secondary)',
                height: '28px',
                cursor: 'pointer',
                fontSize: '12px',
            });
            const chip = (active: boolean): React.CSSProperties => ({
                ...chipStyle(active),
                height: '28px',
                padding: '0 9px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
            });

            const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
                <div style={fieldWrap}>
                    <label style={labelSt}>{label}</label>
                    {children}
                </div>
            );

            const Num = ({ name, fallback, min = 0, step = 1 }: { name: string; fallback: number; min?: number; step?: number }) => (
                <input
                    type="number"
                    className="input"
                    value={getP(name, fallback)}
                    min={min}
                    step={step}
                    onChange={(e) => setP(name, e.target.value === '' ? '' : parseFloat(e.target.value))}
                    style={inputSt}
                />
            );

            const Select = ({ name, fallback, options }: { name: string; fallback: string; options: { value: string; label: string }[] }) => (
                <select
                    className="select"
                    value={getP(name, fallback)}
                    onChange={(e) => setP(name, e.target.value)}
                    style={inputSt}
                >
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            );

            const QuickChip = ({ value, label }: { value: string; label: string }) => (
                <span style={chip(countPreset === value)} onClick={() => setP('countPreset', value)}>
                    {label}
                </span>
            );

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={rowGrid}>
                        <Field label="作用范围">
                            <Select
                                name="target"
                                fallback="selectionOrActiveArtboard"
                                options={[
                                    { value: 'selectionOrActiveArtboard', label: '选中/当前画板' },
                                    { value: 'activeArtboard', label: '当前画板' },
                                    { value: 'allArtboards', label: '所有画板' },
                                ]}
                            />
                        </Field>
                        <Field label="位置">
                            <Select
                                name="position"
                                fallback="inside"
                                options={[
                                    { value: 'inside', label: '画面内' },
                                    { value: 'outside', label: '画面外' },
                                ]}
                            />
                        </Field>
                        <Field label="圆直径 (mm)">
                            <Num name="diameter" fallback={8} min={0.1} step={0.5} />
                        </Field>
                        <Field label="距边 (mm)">
                            <Num name="margin" fallback={0} min={0} step={0.5} />
                        </Field>
                    </div>

                    <div style={sectionSt}>
                        <div style={segmentWrap}>
                            <button type="button" style={segmentBtn(!isSpacing)} onClick={() => setP('countMode', 'count')}>
                                按数量
                            </button>
                            <button type="button" style={segmentBtn(isSpacing)} onClick={() => setP('countMode', 'spacing')}>
                                按间距
                            </button>
                        </div>

                        {isSpacing ? (
                            <Field label="打扣间距 (mm)">
                                <Num name="spacing" fallback={500} min={1} step={10} />
                            </Field>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    <QuickChip value="allSame" label="四边相同" />
                                    <QuickChip value="horizontalVertical" label="上下/左右" />
                                    <QuickChip value="topBottomOnly" label="只打上下" />
                                    <QuickChip value="leftRightOnly" label="只打左右" />
                                    <QuickChip value="custom" label="分别设置" />
                                </div>

                                {countPreset === 'allSame' && (
                                    <Field label="四边数量">
                                        <Num name="commonCount" fallback={5} min={0} />
                                    </Field>
                                )}

                                {(countPreset === 'horizontalVertical' || countPreset === 'topBottomOnly' || countPreset === 'leftRightOnly') && (
                                    <div style={rowGrid}>
                                        {countPreset !== 'leftRightOnly' && (
                                            <Field label="上下数量">
                                                <Num name="horizontalCount" fallback={5} min={0} />
                                            </Field>
                                        )}
                                        {countPreset !== 'topBottomOnly' && (
                                            <Field label="左右数量">
                                                <Num name="verticalCount" fallback={4} min={0} />
                                            </Field>
                                        )}
                                    </div>
                                )}

                                {countPreset === 'custom' && (
                                    <div style={rowGrid}>
                                        <Field label="上边">
                                            <Num name="topCount" fallback={5} min={0} />
                                        </Field>
                                        <Field label="右边">
                                            <Num name="rightCount" fallback={4} min={0} />
                                        </Field>
                                        <Field label="下边">
                                            <Num name="bottomCount" fallback={5} min={0} />
                                        </Field>
                                        <Field label="左边">
                                            <Num name="leftCount" fallback={4} min={0} />
                                        </Field>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div style={sectionSt}>
                        <div style={rowGrid}>
                            <Field label="圆样式">
                                <Select
                                    name="appearance"
                                    fallback="fill"
                                    options={[
                                        { value: 'fill', label: '实心圆' },
                                        { value: 'stroke', label: '空心圆' },
                                        { value: 'fillStroke', label: '填充+描边' },
                                    ]}
                                />
                            </Field>
                            <Field label="颜色">
                                <Select
                                    name="colorPreset"
                                    fallback="black"
                                    options={[
                                        { value: 'black', label: '黑色' },
                                        { value: 'white', label: '白色' },
                                        { value: 'customCmyk', label: '自定义 CMYK' },
                                    ]}
                                />
                            </Field>
                            {appearance !== 'fill' && (
                                <Field label="描边宽度 (mm)">
                                    <Num name="strokeWidth" fallback={0.3} min={0} step={0.1} />
                                </Field>
                            )}
                            <Field label="图层名称">
                                <CompositionInput
                                    type="text"
                                    className="input"
                                    value={getP('layerName', '喷绘打扣')}
                                    onChange={(e: any) => setP('layerName', e.target.value)}
                                    style={inputSt}
                                />
                            </Field>
                        </div>

                        {colorPreset === 'customCmyk' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
                                {[
                                    { name: 'cyan', label: 'C', fallback: 0 },
                                    { name: 'magenta', label: 'M', fallback: 0 },
                                    { name: 'yellow', label: 'Y', fallback: 0 },
                                    { name: 'black', label: 'K', fallback: 100 },
                                ].map(item => (
                                    <Field key={item.name} label={item.label}>
                                        <Num name={item.name} fallback={item.fallback} min={0} />
                                    </Field>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <SuccessButton className="btn" onClick={handleUndoPreview} disabled={isExecuting} style={{ flex: 1 }}>
                            {isExecuting ? <span className="spinner" /> : '预览'}
                        </SuccessButton>
                        <SuccessButton className="btn btn-primary" onClick={handleExecute} disabled={isExecuting} style={{ flex: 1 }}>
                            {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                        </SuccessButton>
                    </div>
                </div>
            );
        }

        if (script.id === 'align-to-artboard') {
            const duplicate = params['duplicate'] === true || params['duplicate'] === 'true';
            return (
                <div style={{ padding: '0 var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <AlignmentGrid onAlign={handleGridAlign} disabled={isExecuting} />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={chipStyle(duplicate)} onClick={() => setParams((p) => ({ ...p, duplicate: !duplicate }))}>
                            复制后对齐
                        </span>
                    </div>
                </div>
            );
        }

        if (script.id === 'distribute-spacing') {
            const handleDistribute = async (axis: 'x' | 'y') => {
                setError(null);
                const spacingVal = params['spacing'] ? parseFloat(params['spacing']) : undefined;
                const centerAlign = params['centerAlign'] !== false;
                const result = await executeScriptWithAccess({ axis, spacing: spacingVal, centerAlign });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div style={{ maxWidth: '240px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <ActionGrid disabled={isExecuting} items={[
                            { label: '水平分布', onClick: () => handleDistribute('x'), icon: <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><path d="M3 3h2v18H3zm16 0h2v18h-2z" fill="currentColor" opacity="0.35" /><rect x="7" y="6" width="3.5" height="12" rx="1" fill="var(--color-accent)" /><rect x="13.5" y="6" width="3.5" height="12" rx="1" fill="var(--color-accent)" /></svg> },
                            { label: '垂直分布', onClick: () => handleDistribute('y'), icon: <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><path d="M3 3v2h18V3zm0 16v2h18v-2z" fill="currentColor" opacity="0.35" /><rect x="6" y="7" width="12" height="3.5" rx="1" fill="var(--color-accent)" /><rect x="6" y="13.5" width="12" height="3.5" rx="1" fill="var(--color-accent)" /></svg> },
                        ]} />
                    </div>
                    {/* Options row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        {/* Spacing input */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            background: 'var(--color-bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                        }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>间距</span>
                            <input
                                type="number"
                                className="input"
                                placeholder="自动"
                                value={params['spacing'] || ''}
                                onChange={(e) => setParams(p => ({ ...p, spacing: e.target.value }))}
                                style={{ flex: 1, height: '26px', fontSize: '12px' }}
                            />
                            {unit && <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{unit}</span>}
                        </div>
                        {/* Center align toggle */}
                        <span style={{ ...chipStyle(params['centerAlign'] !== false), gap: '4px', padding: '6px 10px', height: '100%' }}
                            onClick={() => setParams(p => ({ ...p, centerAlign: !(p.centerAlign !== false) }))}>
                            <svg viewBox="0 0 16 16" style={{ width: 14, height: 14, fill: 'currentColor' }}>
                                <path d="M7.25 1v2.5h1.5V1h-1.5zM7.25 12.5V15h1.5v-2.5h-1.5zM7.25 5.5v5h1.5v-5h-1.5zM3 6.5h3v3H3zm7 0h3v3h-3z" />
                            </svg>
                            <span style={{ fontSize: '11px' }}>居中</span>
                        </span>
                    </div>
                </div>
            );
        }

        if (script.id === 'mirror-object') {
            const duplicate = params['duplicate'] === true || params['duplicate'] === 'true';
            const act = async (d: string) => { setError(null); const r = await executeScriptWithAccess({ direction: d, duplicate }); if (!r.success) setError(r.error || '执行失败'); };
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <ActionGrid disabled={isExecuting} items={[
                        { label: '水平镜像', onClick: () => act('horizontal'), icon: <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><path d="M11.5 3v18h1V3h-1z" fill="currentColor" opacity="0.35" /><polygon points="5,7 9,12 5,17" fill="var(--color-accent)" /><polygon points="19,7 15,12 19,17" fill="var(--color-accent)" opacity="0.45" /></svg> },
                        { label: '垂直镜像', onClick: () => act('vertical'), icon: <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><path d="M3 11.5h18v1H3z" fill="currentColor" opacity="0.35" /><polygon points="7,5 12,9 17,5" fill="var(--color-accent)" /><polygon points="7,19 12,15 17,19" fill="var(--color-accent)" opacity="0.45" /></svg> },
                    ]} />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span style={chipStyle(duplicate)} onClick={() => setParams((p) => ({ ...p, duplicate: !duplicate }))}>
                            复制后镜像
                        </span>
                    </div>
                </div>
            );
        }

        if (script.id === 'rotate-object') {
            const angle = params['angle'] ?? -90;
            const anchor = String(params['anchor'] || '5');
            const duplicate = params['duplicate'] === true || params['duplicate'] === 'true';
            const copyCount = Math.max(1, parseInt(String(params['copyCount'] || 1), 10) || 1);
            const rotatePatterns = params['rotatePatterns'] !== false && params['rotatePatterns'] !== 'false';
            const rotateGradients = params['rotateGradients'] !== false && params['rotateGradients'] !== 'false';
            const rotateStrokePatterns = params['rotateStrokePatterns'] !== false && params['rotateStrokePatterns'] !== 'false';

            const act = async (overrideAngle?: number) => {
                setError(null);
                const actualAngle = typeof overrideAngle === 'number' ? overrideAngle : parseFloat(String(angle || ''));
                if (!isFinite(actualAngle)) {
                    setError('请输入有效角度');
                    return;
                }
                const r = await executeScriptWithAccess({
                    angle: actualAngle,
                    anchor,
                    duplicate,
                    copyCount,
                    rotatePatterns,
                    rotateGradients,
                    rotateStrokePatterns,
                });
                if (!r.success) setError(r.error || '执行失败');
                else setShowSuccess(true);
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 10px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                旋转角度
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={angle}
                                step={0.1}
                                onChange={(e) => setParams((p) => ({ ...p, angle: e.target.value }))}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', width: '100%' }}>
                                <SuccessButton className="btn btn-sm" onClick={() => act(90)} disabled={isExecuting} style={{ padding: '6px 8px' }}>
                                    +90°
                                </SuccessButton>
                                <SuccessButton className="btn btn-sm" onClick={() => act(-90)} disabled={isExecuting} style={{ padding: '6px 8px' }}>
                                    -90°
                                </SuccessButton>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '11px',
                                color: 'var(--color-text-secondary)',
                                textAlign: 'center',
                            }}
                        >
                            锚点
                        </label>
                        <PositionGrid
                            onSelect={(position) => setParams((p) => ({ ...p, anchor: position }))}
                            disabled={isExecuting}
                            selectedPosition={anchor}
                        />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={chipStyle(duplicate)} onClick={() => setParams((p) => ({ ...p, duplicate: !duplicate }))}>
                            复制旋转
                        </span>
                        <span style={chipStyle(rotatePatterns)} onClick={() => setParams((p) => ({ ...p, rotatePatterns: !rotatePatterns }))}>
                            图案
                        </span>
                        <span style={chipStyle(rotateGradients)} onClick={() => setParams((p) => ({ ...p, rotateGradients: !rotateGradients }))}>
                            渐变
                        </span>
                        <span style={chipStyle(rotateStrokePatterns)} onClick={() => setParams((p) => ({ ...p, rotateStrokePatterns: !rotateStrokePatterns }))}>
                            描边图案
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', opacity: duplicate ? 1 : 0.5 }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                            复制份数
                        </span>
                        <input
                            type="number"
                            className="input"
                            min={1}
                            step={1}
                            value={copyCount}
                            disabled={!duplicate}
                            onChange={(e) => setParams((p) => ({ ...p, copyCount: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                            style={{ flex: 1, minWidth: 0 }}
                        />
                    </div>

                    <SuccessButton className="btn btn-primary" onClick={() => act()} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'lock-unlock') {
            const act = async (a: string) => { setError(null); const r = await executeScriptWithAccess({ action: a }); if (!r.success) setError(r.error || '执行失败'); };
            return <ActionGrid disabled={isExecuting} items={[
                { label: '锁定选中', onClick: () => act('lock'), icon: <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><rect x="6" y="11" width="12" height="9" rx="1.5" fill="var(--color-accent)" /><path d="M8 11V8a4 4 0 1 1 8 0v3" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" /></svg> },
                { label: '全部解锁', onClick: () => act('unlock'), icon: <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><rect x="6" y="11" width="12" height="9" rx="1.5" fill="currentColor" opacity="0.4" /><path d="M8 11V8a4 4 0 1 1 8 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" /></svg> },
            ]} />;
        }

        if (script.id === 'fit-artboard-to-selection' || script.id === 'create-artboards-from-selection') {
            const handleExecuteInline = async () => {
                setError(null);
                const paddingVal = params['padding'] ? parseFloat(params['padding']) : 0;
                const result = await executeScriptWithAccess({ padding: paddingVal });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>边距</span>
                    <input
                        type="number"
                        className="input"
                        placeholder="0"
                        value={params['padding'] || ''}
                        onChange={(e) => setParams(p => ({ ...p, padding: e.target.value }))}
                        style={{ flex: 1, minWidth: 0 }}
                    />
                    {unit && <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{unit}</span>}
                    <SuccessButton className="btn btn-primary btn-sm" onClick={handleExecuteInline} disabled={isExecuting}
                        style={{ whiteSpace: 'nowrap', padding: '4px 12px' }}>
                        {isExecuting ? <span className="spinner" /> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'batch-rename-artboards') {
            const handleExecuteInline = async () => {
                setError(null);
                const result = await executeScriptWithAccess({
                    namePattern: params['namePattern'] || '画板#',
                    prefix: params['prefix'] || '',
                    suffix: params['suffix'] || '',
                    startNum: parseInt(params['startNum'] || '1'),
                    includeSize: params['includeSize'] || false,
                    sizeUnit: params['sizeUnit'] || 'mm',
                    scale: parseFloat(params['scale'] || '1')
                });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div className="flex flex-col gap-md">
                    <div>
                        <label className="text-xs mb-xs block">命名模式 (#=序号):</label>
                        <CompositionInput
                            type="text"
                            className="input"
                            placeholder="画板#"
                            value={params['namePattern'] || ''}
                            onChange={(e: any) => setParams(p => ({ ...p, namePattern: e.target.value }))}
                        />
                    </div>
                    <div className="flex items-center gap-sm">
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">前缀:</label>
                            <CompositionInput
                                type="text"
                                className="input"
                                placeholder="前缀-"
                                value={params['prefix'] || ''}
                                onChange={(e: any) => setParams(p => ({ ...p, prefix: e.target.value }))}
                            />
                        </div>
                        <div className="text-secondary" style={{ paddingTop: '20px' }}>-</div>
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">后缀:</label>
                            <CompositionInput
                                type="text"
                                className="input"
                                placeholder="-后缀"
                                value={params['suffix'] || ''}
                                onChange={(e: any) => setParams(p => ({ ...p, suffix: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-sm">
                        <div style={{ width: '80px' }}>
                            <label className="text-xs mb-xs block">起始号</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="1"
                                value={params['startNum'] || ''}
                                onChange={(e) => setParams(p => ({ ...p, startNum: e.target.value }))}
                            />
                        </div>
                        <div style={{ width: '90px' }}>
                            <label className="text-xs mb-xs block">添加尺寸:</label>
                            <select
                                className="select"
                                style={{ padding: '4px 6px', fontSize: '11px', height: '30px' }}
                                value={params['includeSize'] ? (params['sizeUnit'] || 'mm') : 'none'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'none') {
                                        setParams(p => ({ ...p, includeSize: false }));
                                    } else {
                                        setParams(p => ({ ...p, includeSize: true, sizeUnit: val }));
                                    }
                                }}
                            >
                                <option value="none">无</option>
                                <option value="mm">mm</option>
                                <option value="cm">cm</option>
                                <option value="px">px</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">比例1:(x):</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="1"
                                style={{ height: '30px', fontSize: '11px' }}
                                value={params['scale'] || ''}
                                onChange={(e) => setParams(p => ({ ...p, scale: e.target.value }))}
                            />
                        </div>
                    </div>
                    <SuccessButton
                        className="btn btn-primary"
                        onClick={handleExecuteInline}
                        disabled={isExecuting}
                        style={{ width: '100%' }}
                    >
                        执行重命名                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'parametric-array') {
            const getParam = (name: string) => script.params?.find((p) => p.name === name);
            const layoutMode = String(params['layoutMode'] || 'grid');
            const fieldSource = String(params['fieldSource'] || 'center');
            const maskSource = String(params['maskSource'] || 'none');
            const itemShape = String(params['itemShape'] || 'diamond');

            const sectionStyle: React.CSSProperties = {
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-tertiary)',
            };

            const titleStyle: React.CSSProperties = {
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
            };

            const gridStyle: React.CSSProperties = {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px 10px',
            };

            const renderField = (name: string, fullWidth = false) => {
                const param = getParam(name);
                if (!param) return null;
                return (
                    <div key={name} style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                        <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {param.label}
                        </label>
                        {renderParamInput(param, params, setParams)}
                        {param.description && (
                            <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                                {param.description}
                            </div>
                        )}
                    </div>
                );
            };

            const helperText = (text: string) => (
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', lineHeight: 1.45 }}>
                    {text}
                </div>
            );

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={sectionStyle}>
                        <div style={titleStyle}>布局</div>
                        <div style={gridStyle}>
                            {renderField('layoutMode')}
                            {renderField('itemShape')}
                            {renderField('columns')}
                            {renderField('rows')}
                            {layoutMode === 'path' ? renderField('laneGapPct') : renderField('regionMode')}
                            {layoutMode === 'path' ? renderField('maskSource') : renderField('regionShape')}
                            {layoutMode !== 'path' && renderField('regionWidthPct')}
                            {layoutMode !== 'path' && renderField('regionHeightPct')}
                            {layoutMode !== 'path' && renderField('centerX')}
                            {layoutMode !== 'path' && renderField('centerY')}
                        </div>
                        {layoutMode === 'path' && helperText('沿路径流动时：先选中一条路径作为引导线，列数表示路径采样数，行数表示路径两侧的排布层数。')}
                        {itemShape === 'selection' && helperText('元素形状 = 选中对象 时，建议额外选一个模板对象，不要和引导路径/约束路径共用同一对象。')}
                        {maskSource === 'selection-closed' && helperText('路径约束会读取当前选区中的闭合路径，阵列只会在这些闭合轮廓内部生成。')}
                    </div>

                    <div style={sectionStyle}>
                        <div style={titleStyle}>参数场</div>
                        <div style={gridStyle}>
                            {renderField('fieldSource')}
                            {renderField('sizeCurve')}
                            {renderField('falloff')}
                            {renderField('density')}
                            {renderField('regularity')}
                            {renderField('jitter')}
                            {fieldSource === 'custom-points' && renderField('attractors', true)}
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <div style={titleStyle}>元素变形</div>
                        <div style={gridStyle}>
                            {renderField('maxSizePct')}
                            {renderField('minSizePct')}
                            {renderField('rotationMode')}
                            {renderField('rotation')}
                            {renderField('rotationJitter')}
                            {renderField('stretchXPct')}
                            {renderField('stretchYPct')}
                            {itemShape === 'rounded-square' && renderField('roundness')}
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <div style={titleStyle}>外观</div>
                        <div style={gridStyle}>
                            {renderField('style')}
                            {renderField('gray')}
                            {renderField('strokeWidth')}
                            {renderField('seed')}
                        </div>
                    </div>

                    <SuccessButton className="btn btn-primary" onClick={handleExecute} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'hachures') {
            const getParam = (name: string) => script.params?.find((p) => p.name === name);

            const sectionStyle: React.CSSProperties = {
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-tertiary)',
            };
            const titleStyle: React.CSSProperties = {
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
            };
            const gridStyle: React.CSSProperties = {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px 10px',
            };
            const renderField = (name: string, fullWidth = false) => {
                const p = getParam(name);
                if (!p) return null;
                return (
                    <div key={name} style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                        <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {p.label}
                        </label>
                        {renderParamInput(p, params, setParams)}
                        {p.description && (
                            <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                                {p.description}
                            </div>
                        )}
                    </div>
                );
            };

            // 10 curve types rendered as visual SVG icon buttons (5×2 grid)
            const CURVE_TYPES: Array<{ id: string; name: string; path: string }> = [
                { id: 'A', name: '直线',           path: 'M3 12 L21 12' },
                { id: 'B', name: '右端上扬',       path: 'M3 12 L11 12 Q17 12 21 5' },
                { id: 'C', name: '中央拱起',       path: 'M3 16 Q12 4 21 16' },
                { id: 'D', name: '中央下凹',       path: 'M3 8 Q12 20 21 8' },
                { id: 'E', name: '波峰交错',       path: 'M3 17 L8 8 L13 17 L18 8 L21 12' },
                { id: 'F', name: 'S 形波浪',       path: 'M3 17 C9 17 9 7 12 7 C15 7 15 17 21 7' },
                { id: 'G', name: '右端上弯',       path: 'M3 12 Q11 12 14 11 Q19 9 21 5' },
                { id: 'H', name: '右端下弯',       path: 'M3 12 Q11 12 14 13 Q19 15 21 19' },
                { id: 'I', name: '左端上引',       path: 'M3 5 Q5 9 10 11 Q13 12 21 12' },
                { id: 'J', name: '左端下引',       path: 'M3 19 Q5 15 10 13 Q13 12 21 12' },
            ];
            const selectedCurve = String(params['curveType'] || 'A');

            const cellBaseStyle: React.CSSProperties = {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '6px 4px',
                background: 'var(--color-bg-control)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
            };
            const cellActiveStyle: React.CSSProperties = {
                ...cellBaseStyle,
                background: 'var(--color-bg-active)',
                borderColor: 'var(--color-accent)',
            };

            const preserveColor = params['preserveColor'] === true || params['preserveColor'] === 'true';
            const isArtboardMode = String(params['target'] || 'selection') === 'activeArtboard';
            const previewActive = hachuresPreviewActiveRef.current;
            void hachuresPreviewVersion; // touch to re-render when preview state changes

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={sectionStyle}>
                        <div style={titleStyle}>排线参数</div>
                        <div style={gridStyle}>
                            {renderField('target', true)}
                            {renderField('spacing')}
                            {renderField('angle')}
                            {renderField('thickness')}
                            {renderField('spacingJitter')}
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <div style={titleStyle}>曲线类型</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '6px' }}>
                            {CURVE_TYPES.map((t) => {
                                const active = selectedCurve === t.id;
                                return (
                                    <div
                                        key={t.id}
                                        title={`${t.id} — ${t.name}`}
                                        onClick={() => setParams((prev) => ({ ...prev, curveType: t.id }))}
                                        style={active ? cellActiveStyle : cellBaseStyle}
                                    >
                                        <svg width="32" height="20" viewBox="0 0 24 24" style={{ display: 'block' }}>
                                            <path
                                                d={t.path}
                                                fill="none"
                                                stroke={active ? 'var(--color-accent)' : 'var(--color-text-secondary)'}
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                                        }}>
                                            {t.id}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', lineHeight: 1.45 }}>
                            {(CURVE_TYPES.find(t => t.id === selectedCurve)?.name) || ''}
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <div style={titleStyle}>外观</div>
                        <div style={gridStyle}>
                            {!isArtboardMode && renderField('preserveColor', true)}
                            {(isArtboardMode || !preserveColor) && renderField('customColor', true)}
                            {renderField('strokeCap', true)}
                        </div>
                    </div>

                    {/* Preview controls */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: previewActive ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)',
                        border: '1px solid ' + (previewActive ? 'var(--color-accent-muted)' : 'var(--color-border)'),
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                                onClick={() => {
                                    const next = !hachuresLiveMode;
                                    setHachuresLiveMode(next);
                                    if (next) void runHachuresPreview();
                                }}
                                style={chipStyle(hachuresLiveMode)}
                                title="开启后参数变化自动刷新预览"
                            >
                                实时预览
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                {previewActive ? (hachuresPreviewing ? '更新中…' : '预览中') : '未预览'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <SuccessButton
                                className="btn btn-sm"
                                onClick={() => void runHachuresPreview()}
                                disabled={hachuresPreviewing}
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                                {previewActive ? '重新预览' : '预览'}
                            </SuccessButton>
                            <SuccessButton
                                className="btn btn-sm"
                                onClick={() => void cancelHachuresPreview()}
                                disabled={!previewActive || hachuresPreviewing}
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                                取消
                            </SuccessButton>
                        </div>
                    </div>

                    <SuccessButton
                        className="btn btn-primary"
                        onClick={async () => {
                            // If preview is active, queue a commit through the chain so it can't race
                            // with an in-flight preview. The commit just removes the sentinel layer.
                            if (hachuresPreviewActiveRef.current) {
                                hachuresPendingRef.current++;
                                setHachuresPreviewing(true);
                                const next = hachuresChainRef.current.then(async () => {
                                    try {
                                        await silentExecuteHachures({ commitPreview: true });
                                    } catch (e) { /* ignore */ }
                                    hachuresPreviewActiveRef.current = false;
                                    setHachuresLiveMode(false);
                                    setHachuresPreviewVersion((v) => v + 1);
                                    hachuresPendingRef.current = Math.max(0, hachuresPendingRef.current - 1);
                                    if (hachuresPendingRef.current === 0) setHachuresPreviewing(false);
                                });
                                hachuresChainRef.current = next;
                                await next;
                                return;
                            }
                            await handleExecute();
                        }}
                        disabled={isExecuting || hachuresPreviewing}
                        style={{ width: '100%' }}
                    >
                        {isExecuting ? <><span className="spinner" /> 生成中...</>
                            : previewActive ? '保留预览结果' : '生成排线'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'nettoyage') {
            const getParam = (name: string) => script.params?.find((p) => p.name === name);

            const sectionStyle: React.CSSProperties = {
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-tertiary)',
            };
            const titleStyle: React.CSSProperties = {
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
            };
            const gridStyle: React.CSSProperties = {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px 10px',
            };
            const renderField = (name: string, fullWidth = false) => {
                const p = getParam(name);
                if (!p) return null;
                return (
                    <div key={name} style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                        <label style={{ display: 'block', marginBottom: '3px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {p.label}
                        </label>
                        {renderParamInput(p, params, setParams)}
                    </div>
                );
            };

            // Boolean fields rendered as chip toggles to save vertical space
            const renderBoolChip = (name: string) => {
                const p = getParam(name);
                if (!p) return null;
                const active = params[name] ?? p.default ?? false;
                return (
                    <span
                        key={name}
                        style={chipStyle(!!active)}
                        title={p.description || ''}
                        onClick={() => setParams(prev => ({ ...prev, [name]: !active }))}
                    >
                        {p.label}
                    </span>
                );
            };

            const reduceImages = params['reduceImages'] === true || params['reduceImages'] === 'true';

            const applyPreset = (preset: 'all' | 'none' | 'print' | 'web') => {
                setParams(prev => {
                    const next = { ...prev };
                    if (preset === 'all') {
                        next.expandBlends = true;
                        next.expandLivePaint = true;
                        next.expandEnvelopes = true;
                        next.expandAppearance = true;
                        next.expandAll = false;
                        next.embedImages = true;
                        next.reduceImages = false;
                        next.guidesMode = 'delete';
                        next.deleteEmptyLayers = true;
                        next.deleteEmptyText = true;
                    } else if (preset === 'none') {
                        next.expandBlends = false;
                        next.expandLivePaint = false;
                        next.expandEnvelopes = false;
                        next.expandAppearance = false;
                        next.expandAll = false;
                        next.embedImages = false;
                        next.reduceImages = false;
                        next.guidesMode = 'ignore';
                        next.deleteEmptyLayers = false;
                        next.deleteEmptyText = false;
                    } else if (preset === 'print') {
                        next.expandBlends = false;
                        next.expandLivePaint = true;
                        next.expandEnvelopes = true;
                        next.expandAppearance = true;
                        next.expandAll = false;
                        next.embedImages = true;
                        next.reduceImages = false;
                        next.guidesMode = 'delete';
                        next.deleteEmptyLayers = true;
                        next.deleteEmptyText = true;
                    } else if (preset === 'web') {
                        next.expandBlends = false;
                        next.expandLivePaint = false;
                        next.expandEnvelopes = false;
                        next.expandAppearance = true;
                        next.expandAll = false;
                        next.embedImages = false;
                        next.reduceImages = true;
                        next.reduceDpi = '72';
                        next.guidesMode = 'delete';
                        next.deleteEmptyLayers = true;
                        next.deleteEmptyText = true;
                    }
                    return next;
                });
            };

            const presetBtn: React.CSSProperties = {
                padding: '4px 10px',
                fontSize: '10px',
                border: '1px solid var(--color-border)',
                borderRadius: '999px',
                background: 'var(--color-bg-control)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={sectionStyle}>
                        <div style={titleStyle}>应用范围</div>
                        <div style={gridStyle}>
                            {renderField('target', true)}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', alignSelf: 'center', marginRight: '4px' }}>预设：</span>
                            <button type="button" style={presetBtn} onClick={() => applyPreset('print')}>印刷输出</button>
                            <button type="button" style={presetBtn} onClick={() => applyPreset('web')}>网络发布</button>
                            <button type="button" style={presetBtn} onClick={() => applyPreset('all')}>全部勾选</button>
                            <button type="button" style={presetBtn} onClick={() => applyPreset('none')}>全部清空</button>
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <div style={titleStyle}>展开操作</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {renderBoolChip('expandBlends')}
                            {renderBoolChip('expandLivePaint')}
                            {renderBoolChip('expandEnvelopes')}
                            {renderBoolChip('expandAppearance')}
                            {renderBoolChip('expandAll')}
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <div style={titleStyle}>图片处理</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {renderBoolChip('embedImages')}
                            {renderBoolChip('reduceImages')}
                        </div>
                        {reduceImages && (
                            <div style={gridStyle}>
                                {renderField('reduceDpi', true)}
                            </div>
                        )}
                    </div>

                    <div style={sectionStyle}>
                        <div style={titleStyle}>辅助线 / 清理</div>
                        <div style={gridStyle}>
                            {renderField('guidesMode', true)}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {renderBoolChip('deleteEmptyLayers')}
                            {renderBoolChip('deleteEmptyText')}
                        </div>
                    </div>

                    <SuccessButton className="btn btn-primary" onClick={handleExecute} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 清理中...</> : '执行清理'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'round-corners' || script.id === 'random-scatter') {
            const paramName = script.id === 'round-corners' ? 'radius' : 'distance';
            const label = script.id === 'round-corners' ? '半径:' : '距离:';
            const defaultVal = script.id === 'round-corners' ? '10' : '50';

            const handleExecuteInline = async () => {
                setError(null);
                const val = params[paramName] ? parseFloat(params[paramName]) : parseFloat(defaultVal);
                const result = await executeScriptWithAccess({ [paramName]: val });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div className="flex gap-sm items-end">
                    <div style={{ flex: 1 }}>
                        <label className="text-xs mb-xs block">{label}</label>
                        <div className="flex items-center gap-xs">
                            <input
                                type="number"
                                className="input"
                                placeholder={defaultVal}
                                value={params[paramName] || ''}
                                onChange={(e) => setParams(p => ({ ...p, [paramName]: e.target.value }))}
                                style={{ flex: 1 }}
                            />
                            {unit && <span className="text-xs text-secondary" style={{ minWidth: '24px' }}>{unit}</span>}
                        </div>
                    </div>
                    <SuccessButton
                        className="btn btn-primary"
                        onClick={handleExecuteInline}
                        disabled={isExecuting}
                        style={{ minWidth: '80px' }}
                    >
                        执行
                    </SuccessButton>
                </div>
            );
        }
        if (script.id === 'batch-resize') {
            const mode = String(params['mode'] || 'scale');
            const lockAspect = params['lockAspect'] !== false && params['lockAspect'] !== 'false';
            const scaleStrokes = params['scaleStrokes'] !== false && params['scaleStrokes'] !== 'false';
            const scalePatterns = params['scalePatterns'] !== false && params['scalePatterns'] !== 'false';
            const scaleGradients = params['scaleGradients'] !== false && params['scaleGradients'] !== 'false';
            const anchor = String(params['anchor'] || '5');
            const scaleX = params['scaleX'] ?? params['value'] ?? 100;
            const scaleY = params['scaleY'] ?? (lockAspect ? scaleX : 100);
            const targetWidth = params['targetWidth'] ?? (params['mode'] === 'width' ? params['value'] ?? '' : '');
            const targetHeight = params['targetHeight'] ?? (params['mode'] === 'height' ? params['value'] ?? '' : '');

            const handleExecuteInline = async () => {
                setError(null);
                const scaleXNum = parseFloat(String(scaleX || ''));
                const scaleYNum = parseFloat(String(scaleY || ''));
                const targetWidthNum = String(targetWidth ?? '').trim();
                const targetHeightNum = String(targetHeight ?? '').trim();

                if (mode === 'scale') {
                    if (!isFinite(scaleXNum) || scaleXNum <= 0) {
                        setError('横向缩放必须大于 0');
                        return;
                    }
                    if (!lockAspect && (!isFinite(scaleYNum) || scaleYNum <= 0)) {
                        setError('纵向缩放必须大于 0');
                        return;
                    }
                } else {
                    if (!targetWidthNum && !targetHeightNum) {
                        setError('目标尺寸至少填写一项');
                        return;
                    }
                    if (targetWidthNum && (!isFinite(parseFloat(targetWidthNum)) || parseFloat(targetWidthNum) <= 0)) {
                        setError('目标宽度必须大于 0');
                        return;
                    }
                    if (targetHeightNum && (!isFinite(parseFloat(targetHeightNum)) || parseFloat(targetHeightNum) <= 0)) {
                        setError('目标高度必须大于 0');
                        return;
                    }
                }

                const result = await executeScriptWithAccess({
                    mode,
                    scaleX: scaleXNum,
                    scaleY: lockAspect ? scaleXNum : scaleYNum,
                    targetWidth: targetWidthNum ? parseFloat(targetWidthNum) : '',
                    targetHeight: targetHeightNum ? parseFloat(targetHeightNum) : '',
                    lockAspect,
                    scaleStrokes,
                    scalePatterns,
                    scaleGradients,
                    anchor,
                });
                if (!result.success) setError(result.error || '执行失败');
                else setShowSuccess(true);
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select
                            className="select"
                            value={mode}
                            onChange={(e) => setParams(p => ({ ...p, mode: e.target.value }))}
                            style={{ flex: 1 }}
                        >
                            <option value="scale">按比例</option>
                            <option value="size">目标尺寸</option>
                        </select>
                        <span
                            style={{ ...chipStyle(lockAspect), whiteSpace: 'nowrap' }}
                            onClick={() => setParams(p => ({ ...p, lockAspect: !lockAspect }))}
                            title="开启后保持原始宽高比"
                        >
                            保持比例
                        </span>
                    </div>

                    {mode === 'scale' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 10px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    横向缩放(%)
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={scaleX}
                                    step={0.1}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setParams((p) => ({
                                            ...p,
                                            scaleX: next,
                                            ...(lockAspect ? { scaleY: next } : {}),
                                        }));
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    纵向缩放(%)
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={lockAspect ? scaleX : scaleY}
                                    step={0.1}
                                    disabled={lockAspect}
                                    onChange={(e) => setParams((p) => ({ ...p, scaleY: e.target.value }))}
                                    style={{ opacity: lockAspect ? 0.55 : 1 }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 10px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    目标宽度{unit ? ` (${unit})` : ''}
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={targetWidth}
                                    step={0.1}
                                    onChange={(e) => setParams((p) => ({ ...p, targetWidth: e.target.value }))}
                                    placeholder="留空则不按宽度"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    目标高度{unit ? ` (${unit})` : ''}
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    value={targetHeight}
                                    step={0.1}
                                    onChange={(e) => setParams((p) => ({ ...p, targetHeight: e.target.value }))}
                                    placeholder="留空则不按高度"
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                {lockAspect ? '保持比例开启时优先按宽度缩放；宽度留空时按高度缩放。' : '关闭保持比例后，可独立指定宽高进行非等比缩放。'}
                            </div>
                        </div>
                    )}

                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '11px',
                                color: 'var(--color-text-secondary)',
                                textAlign: 'center',
                            }}
                        >
                            锚点
                        </label>
                        <PositionGrid
                            onSelect={(position) => setParams((p) => ({ ...p, anchor: position }))}
                            disabled={isExecuting}
                            selectedPosition={anchor}
                        />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={chipStyle(scaleStrokes)} onClick={() => setParams((p) => ({ ...p, scaleStrokes: !scaleStrokes }))}>
                            描边
                        </span>
                        <span style={chipStyle(scalePatterns)} onClick={() => setParams((p) => ({ ...p, scalePatterns: !scalePatterns }))}>
                            图案
                        </span>
                        <span style={chipStyle(scaleGradients)} onClick={() => setParams((p) => ({ ...p, scaleGradients: !scaleGradients }))}>
                            渐变
                        </span>
                    </div>

                    <SuccessButton
                        className="btn btn-primary"
                        onClick={handleExecuteInline}
                        disabled={isExecuting}
                        style={{ width: '100%' }}
                    >
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'batch-rename') {
            const handleExecuteInline = async () => {
                setError(null);
                const result = await executeScriptWithAccess({
                    template: params['template'] || 'Item {n}',
                    startIndex: parseInt(params['startIndex'] || '1')
                });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div className="flex flex-col gap-md">
                    <div className="flex gap-sm">
                        <div style={{ flex: 2 }}>
                            <label className="text-xs mb-xs block">命名模板 ({'{n}'}=序号):</label>
                            <CompositionInput
                                type="text"
                                className="input"
                                placeholder="Item {n}"
                                value={params['template'] || ''}
                                onChange={(e: any) => setParams(p => ({ ...p, template: e.target.value }))}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">起始号</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="1"
                                value={params['startIndex'] || ''}
                                onChange={(e) => setParams(p => ({ ...p, startIndex: e.target.value }))}
                            />
                        </div>
                    </div>
                    <SuccessButton
                        className="btn btn-primary"
                        onClick={handleExecuteInline}
                        disabled={isExecuting}
                        style={{ width: '100%' }}
                    >
                        重命名                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'move-objects-to-layer') {
            const handleExecuteInline = async () => {
                setError(null);
                const result = await executeScriptWithAccess({
                    layerName: params['layerName'] || '',
                    action: params['action'] || 'move',
                    createIfMissing: params['createIfMissing'] !== false,
                    unlockTargetLayer: params['unlockTargetLayer'] !== false,
                    showTargetLayer: params['showTargetLayer'] !== false,
                });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                        <label className="text-xs mb-xs block">目标图层名</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <SuggestionPickerInput
                                value={params['layerName'] || ''}
                                onChange={(value) => setParams((prev) => ({ ...prev, layerName: value }))}
                                items={layerList}
                                loading={layerListLoading}
                                placeholder={layerListLoading ? '正在读取图层...' : '输入或选择图层名'}
                                emptyText="未找到匹配图层"
                                toggleTitle="打开图层列表"
                            />
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => loadLayerList(true)}
                                disabled={layerListLoading}
                                style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}
                            >
                                {layerListLoading ? '读取中...' : '刷新'}
                            </button>
                        </div>
                        {layerListError ? (
                            <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                {layerListError}
                            </div>
                        ) : layerList.length > 0 ? (
                            <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                已读取 {layerList.length} 个图层，可直接选择或输入新图层名
                            </div>
                        ) : null}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px 10px' }}>
                        {script.params!.filter((p) => p.name === 'action').map((p) => (
                            <div key={p.name}>
                                <label className="text-xs mb-xs block">{p.label}</label>
                                {renderParamInput(p, params, setParams)}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {script.params!.filter((p) => p.type === 'boolean').map((p) => {
                            const active = params[p.name] ?? p.default ?? false;
                            return (
                                <span
                                    key={p.name}
                                    style={chipStyle(active)}
                                    title={p.description || ''}
                                    onClick={() => setParams((prev) => ({ ...prev, [p.name]: !active }))}
                                >
                                    {p.label}
                                </span>
                            );
                        })}
                    </div>

                    <SuccessButton className="btn btn-primary" onClick={handleExecuteInline} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'random-palette-fill') {
            const paletteValue = String(params['palette'] || '');
            const fieldParams = script.params?.filter((p) => p.name !== 'palette' && p.type !== 'boolean') || [];
            const boolParams = script.params?.filter((p) => p.name !== 'palette' && p.type === 'boolean') || [];
            const paletteEntries = splitPaletteEntries(paletteValue);
            const selectedEntries = new Set(paletteEntries.map((entry) => entry.toLowerCase()));
            const filteredSwatches = swatchQuery.trim()
                ? swatchList.filter((item) => item.name.toLowerCase().includes(swatchQuery.trim().toLowerCase()))
                : swatchList;

            const setPaletteEntries = (entries: string[]) => {
                setParams((prev) => ({ ...prev, palette: entries.join('\n') }));
            };

            const handleLoadAllSwatches = () => {
                if (!swatchList.length) return;
                setPaletteEntries(swatchList.map((item) => item.name));
                if (!swatchAnchorName && swatchList.length > 0) {
                    setSwatchAnchorName(swatchList[0].name);
                }
            };

            const handleClearPalette = () => {
                setPaletteEntries([]);
                setSwatchAnchorName('');
            };

            const togglePaletteEntry = (entry: string, mode?: 'replace' | 'toggle') => {
                const key = entry.toLowerCase();

                if (mode === 'toggle') {
                    if (selectedEntries.has(key)) {
                        setPaletteEntries(paletteEntries.filter((item) => item.toLowerCase() !== key));
                    } else {
                        setPaletteEntries([...paletteEntries, entry]);
                    }
                    setSwatchAnchorName(entry);
                    return;
                }

                setPaletteEntries([entry]);
                setSwatchAnchorName(entry);
            };

            const selectPaletteRange = (entry: string) => {
                const targetIndex = filteredSwatches.findIndex((item) => item.name === entry);
                if (targetIndex < 0) {
                    setPaletteEntries([entry]);
                    setSwatchAnchorName(entry);
                    return;
                }

                const anchorIndex = swatchAnchorName
                    ? filteredSwatches.findIndex((item) => item.name === swatchAnchorName)
                    : -1;
                const startIndex = anchorIndex >= 0 ? anchorIndex : targetIndex;
                const from = Math.min(startIndex, targetIndex);
                const to = Math.max(startIndex, targetIndex);
                const rangeEntries = filteredSwatches.slice(from, to + 1).map((item) => item.name);

                setPaletteEntries(rangeEntries);
                if (!swatchAnchorName) {
                    setSwatchAnchorName(entry);
                }
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                        <label className="text-xs mb-xs block">当前文档色板</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <CompositionInput
                                type="text"
                                className="input"
                                value={swatchQuery}
                                onChange={(e: any) => setSwatchQuery(String(e.target.value || ''))}
                                placeholder={swatchListLoading ? '正在读取色板...' : '搜索色板'}
                            />
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => loadSwatchList(true)}
                                disabled={swatchListLoading}
                                style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}
                            >
                                {swatchListLoading ? '读取中...' : '刷新'}
                            </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                {swatchListError
                                    ? swatchListError
                                    : swatchList.length > 0
                                        ? `已读取 ${swatchList.length} 个色板。单击单选，Ctrl 单独加减选，Shift 连续多选`
                                        : '当前文档暂无可读取色板'}
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={handleLoadAllSwatches}
                                disabled={swatchList.length === 0}
                                style={{ whiteSpace: 'nowrap', padding: '2px 8px' }}
                            >
                                全部载入
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={handleClearPalette}
                                disabled={paletteEntries.length === 0}
                                style={{ whiteSpace: 'nowrap', padding: '2px 8px' }}
                            >
                                清空
                            </button>
                        </div>
                        {filteredSwatches.length > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '6px',
                                    marginTop: '8px',
                                    maxHeight: '220px',
                                    overflowY: 'auto',
                                    padding: '2px 2px 2px 0',
                                }}
                            >
                                {filteredSwatches.slice(0, 160).map((item) => {
                                    const active = selectedEntries.has(item.name.toLowerCase());
                                    return (
                                        <button
                                            type="button"
                                            key={item.name}
                                            onClick={(e) => {
                                                if (e.ctrlKey || e.metaKey) {
                                                    togglePaletteEntry(item.name, 'toggle');
                                                    return;
                                                }
                                                if (e.shiftKey) {
                                                    selectPaletteRange(item.name);
                                                    return;
                                                }
                                                togglePaletteEntry(item.name, 'replace');
                                            }}
                                            title={item.detail || item.name}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '28px',
                                                height: '28px',
                                                padding: 0,
                                                borderRadius: '3px',
                                                border: active ? '1px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.14)',
                                                background: item.preview,
                                                cursor: 'pointer',
                                                boxShadow: active
                                                    ? '0 0 0 1px rgba(58,134,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.18)'
                                                    : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                                                position: 'relative',
                                                flex: '0 0 auto',
                                            }}
                                        >
                                            {active && (
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        right: '2px',
                                                        bottom: '2px',
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '999px',
                                                        background: 'var(--color-accent)',
                                                        boxShadow: '0 0 0 1px rgba(0,0,0,0.35)',
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {fieldParams.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: fieldParams.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '8px 10px' }}>
                            {fieldParams.map((p) => (
                                <div key={p.name}>
                                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                        {p.label}
                                    </label>
                                    {renderParamInput(p, params, setParams)}
                                </div>
                            ))}
                        </div>
                    )}

                    {boolParams.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {boolParams.map((p) => {
                                const active = params[p.name] ?? p.default ?? false;
                                return (
                                    <span
                                        key={p.name}
                                        style={chipStyle(active)}
                                        title={p.description || ''}
                                        onClick={() => setParams((prev) => ({ ...prev, [p.name]: !active }))}
                                    >
                                        {p.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <SuccessButton className="btn btn-primary" onClick={handleExecute} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'select-by-font') {
            const handleExecuteInline = async () => {
                setError(null);
                const result = await executeScriptWithAccess({
                    fontName: params['fontName'] || '',
                    scope: params['scope'] || 'selection',
                });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                        <label className="text-xs mb-xs block">字体名称</label>
                        <FontPickerInput
                            value={params['fontName'] || ''}
                            onChange={(value) => setParams((prev) => ({ ...prev, fontName: value }))}
                            fonts={fontList}
                            loading={fontListLoading}
                            placeholder={fontListLoading ? '正在读取字体库...' : '输入或选择字体'}
                        />
                        {fontListError ? (
                            <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                {fontListError}
                            </div>
                        ) : fontList.length > 0 ? (
                            <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                已读取 {fontList.length} 个字体
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <label className="text-xs mb-xs block">作用范围</label>
                        <select
                            className="select"
                            value={params['scope'] || 'selection'}
                            onChange={(e) => setParams((prev) => ({ ...prev, scope: e.target.value }))}
                        >
                            <option value="selection">选区优先（无选区则全文）</option>
                            <option value="document">整个文档</option>
                        </select>
                    </div>

                    <SuccessButton className="btn btn-primary" onClick={handleExecuteInline} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'multi-layer-selector') {
            const selectedLayers = Array.isArray(params['selectedLayers']) ? params['selectedLayers'] : [];
            const q = String(layerSearch || '').toLowerCase().trim();
            const filteredLayers = q
                ? layerMetaList.filter((layer) => layer.name.toLowerCase().indexOf(q) >= 0)
                : layerMetaList;

            const toggleLayer = (name: string) => {
                setParams((prev) => {
                    const current = Array.isArray(prev.selectedLayers) ? prev.selectedLayers : [];
                    const exists = current.indexOf(name) >= 0;
                    return {
                        ...prev,
                        selectedLayers: exists
                            ? current.filter((x: string) => x !== name)
                            : [...current, name],
                    };
                });
            };

            const handleExecuteInline = async () => {
                setError(null);
                const result = await executeScriptWithAccess({
                    layerNames: selectedLayers,
                    includeLockedLayers: params['includeLockedLayers'] === true,
                    includeHiddenLayers: params['includeHiddenLayers'] === true,
                });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <CompositionInput
                            type="text"
                            className="input"
                            placeholder={layerMetaLoading ? '正在读取图层...' : '搜索图层名'}
                            value={layerSearch}
                            onChange={(e: any) => setLayerSearch(String(e.target.value || ''))}
                        />
                        <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => loadLayerMeta(true)}
                            disabled={layerMetaLoading}
                            style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}
                        >
                            {layerMetaLoading ? '读取中...' : '刷新'}
                        </button>
                    </div>

                    {layerMetaError ? (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{layerMetaError}</div>
                    ) : null}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={chipStyle(params['includeLockedLayers'] === true)} onClick={() => setParams((prev) => ({ ...prev, includeLockedLayers: !(prev.includeLockedLayers === true) }))}>
                            包含锁定图层
                        </span>
                        <span style={chipStyle(params['includeHiddenLayers'] === true)} onClick={() => setParams((prev) => ({ ...prev, includeHiddenLayers: !(prev.includeHiddenLayers === true) }))}>
                            包含隐藏图层
                        </span>
                        <span style={chipStyle(false)} onClick={() => setParams((prev) => ({ ...prev, selectedLayers: filteredLayers.map((layer) => layer.name) }))}>
                            全选当前结果
                        </span>
                        <span style={chipStyle(false)} onClick={() => setParams((prev) => ({ ...prev, selectedLayers: [] }))}>
                            清空
                        </span>
                    </div>

                    <div style={{
                        maxHeight: '240px',
                        overflowY: 'auto',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}>
                        {filteredLayers.length === 0 ? (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '8px' }}>
                                {layerMetaLoading ? '正在读取图层...' : '未找到匹配图层'}
                            </div>
                        ) : (
                            filteredLayers.map((layer) => {
                                const active = selectedLayers.indexOf(layer.name) >= 0;
                                return (
                                    <button
                                        type="button"
                                        key={layer.name}
                                        onClick={() => toggleLayer(layer.name)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: active ? 'var(--color-bg-active)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-primary)',
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 500 }}>{layer.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                                {layer.itemCount} 个对象{layer.locked ? ' · 已锁定' : ''}{!layer.visible ? ' · 已隐藏' : ''}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '11px', color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }}>
                                            {active ? '已选' : '选择'}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                        已选 {selectedLayers.length} 个图层
                    </div>

                    <SuccessButton className="btn btn-primary" onClick={handleExecuteInline} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '选择这些图层中的对象'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'create-polygon') {
            const handleExecuteInline = async () => {
                setError(null);
                const result = await executeScriptWithAccess({
                    sides: parseInt(params['sides'] || '6'),
                    radius: parseFloat(params['radius'] || '50')
                });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div className="flex gap-sm items-end">
                    <div style={{ width: '80px' }}>
                        <label className="text-xs mb-xs block">边数:</label>
                        <input
                            type="number"
                            className="input"
                            placeholder="6"
                            min="3"
                            value={params['sides'] || ''}
                            onChange={(e) => setParams(p => ({ ...p, sides: e.target.value }))}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="text-xs mb-xs block">半径:</label>
                        <div className="flex items-center gap-xs">
                            <input
                                type="number"
                                className="input"
                                placeholder="50"
                                value={params['radius'] || ''}
                                onChange={(e) => setParams(p => ({ ...p, radius: e.target.value }))}
                                style={{ flex: 1 }}
                            />
                            {unit && <span className="text-xs text-secondary" style={{ width: '24px' }}>{unit}</span>}
                        </div>
                    </div>
                    <SuccessButton
                        className="btn btn-primary"
                        onClick={handleExecuteInline}
                        disabled={isExecuting}
                        style={{ minWidth: '60px' }}
                    >
                        创建
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'find-replace-text') {
            const rules = params['rules'] || [{ find: '', replace: '' }];

            const updateRule = (index: number, field: 'find' | 'replace', value: string) => {
                const newRules = [...rules];
                newRules[index] = { ...newRules[index], [field]: value };
                setParams(p => ({ ...p, rules: newRules }));
            };

            const addRule = () => {
                setParams(p => ({ ...p, rules: [...rules, { find: '', replace: '' }] }));
            };

            const removeRule = (index: number) => {
                const newRules = rules.filter((_: any, i: number) => i !== index);
                setParams(p => ({ ...p, rules: newRules.length ? newRules : [{ find: '', replace: '' }] }));
            };

            const handleExecuteBatch = async (action: 'find' | 'replace') => {
                setError(null);
                // Filter out empty rules
                const validRules = rules.filter((r: any) => r.find);
                if (validRules.length === 0) {
                    setError('请至少输入一条查找内容');
                    return;
                }

                const result = await executeScriptWithAccess({
                    rules: validRules,
                    action: action,
                    scope: 'all',
                    caseSensitive: params['caseSensitive'] || false,
                    wholeWord: params['wholeWord'] || false
                });

                if (result.success) {
                    setShowSuccess(true);
                } else {
                    setError(result.error || '执行失败');
                }
            };

            return (
                <div className="flex flex-col gap-md">
                    {/* 规则列表 */}
                    <div className="flex flex-col gap-xs" style={{
                        background: 'var(--color-bg-secondary)',
                        borderRadius: '6px',
                        padding: '8px'
                    }}>
                        <div className="flex items-center justify-between mb-xs">
                            <span className="text-xs" style={{ opacity: 0.6, fontWeight: 500 }}>替换规则</span>
                            <button
                                className="btn btn-sm"
                                onClick={addRule}
                                title="添加规则"
                                style={{ padding: '2px 8px', fontSize: '11px', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                添加
                            </button>
                        </div>

                        {rules.map((rule: any, index: number) => (
                            <div key={index} className="flex gap-xs items-start" style={{
                                background: 'var(--color-bg-primary)',
                                borderRadius: '4px',
                                padding: '6px',
                                border: '1px solid var(--color-border)'
                            }}>
                                <span className="text-xs" style={{
                                    opacity: 0.4,
                                    width: '16px',
                                    textAlign: 'center',
                                    paddingTop: '6px',
                                    fontWeight: 500
                                }}>{index + 1}</span>
                                <div className="flex-1" style={{ display: 'grid', gap: '4px' }}>
                                    <div className="flex items-center gap-xs">
                                        <span className="text-xs" style={{
                                            opacity: 0.5,
                                            width: '32px',
                                            fontSize: '11px'
                                        }}>查找</span>
                                        <CompositionInput
                                            type="text"
                                            className="input"
                                            placeholder="输入要查找的文本..."
                                            value={rule.find}
                                            onChange={(e: any) => updateRule(index, 'find', e.target.value)}
                                            style={{
                                                fontSize: '12px',
                                                padding: '5px 8px',
                                                flex: 1
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-xs">
                                        <span className="text-xs" style={{
                                            opacity: 0.5,
                                            width: '32px',
                                            fontSize: '11px'
                                        }}>替换</span>
                                        <CompositionInput
                                            type="text"
                                            className="input"
                                            placeholder="替换为...（留空则删除）"
                                            value={rule.replace}
                                            onChange={(e: any) => updateRule(index, 'replace', e.target.value)}
                                            style={{
                                                fontSize: '12px',
                                                padding: '5px 8px',
                                                flex: 1
                                            }}
                                        />
                                    </div>
                                </div>
                                {rules.length > 1 && (
                                    <button
                                        className="btn-icon"
                                        onClick={() => removeRule(index)}
                                        title="删除该规则"
                                        style={{
                                            padding: '4px',
                                            opacity: 0.4,
                                            marginTop: '2px'
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* 选项 */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={chipStyle(params['caseSensitive'] || false)}
                            onClick={() => setParams(p => ({ ...p, caseSensitive: !p.caseSensitive }))}>
                            区分大小写                        </span>
                        <span style={chipStyle(params['wholeWord'] || false)}
                            onClick={() => setParams(p => ({ ...p, wholeWord: !p.wholeWord }))}>
                            全词匹配
                        </span>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-sm">
                        <SuccessButton
                            className="btn"
                            onClick={() => handleExecuteBatch('find')}
                            disabled={isExecuting}
                            style={{
                                flex: 1,
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            查找
                        </SuccessButton>
                        <SuccessButton
                            className="btn btn-primary"
                            onClick={() => handleExecuteBatch('replace')}
                            disabled={isExecuting}
                            style={{
                                flex: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            批量替换
                        </SuccessButton>
                    </div>
                </div>
            );
        }

        if (script.id === 'replace-color') {
            const handleExecuteInline = async () => {
                setError(null);
                const result = await executeScriptWithAccess({
                    findHex: params['findHex'] || '',
                    replaceHex: params['replaceHex'] || ''
                });
                if (!result.success) setError(result.error || '执行失败');
            };

            return (
                <div className="flex flex-col gap-md">
                    <div className="flex gap-sm">
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">查找颜色 (Hex):</label>
                            <div className="flex items-center gap-xs">
                                <span style={{ width: 12, height: 12, backgroundColor: params['findHex'] || 'transparent', border: '1px solid var(--color-border)', borderRadius: 2 }}></span>
                                <CompositionInput
                                    type="text"
                                    className="input"
                                    placeholder="#000000"
                                    value={params['findHex'] || ''}
                                    onChange={(e: any) => setParams(p => ({ ...p, findHex: e.target.value }))}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">替换涓?</label>
                            <div className="flex items-center gap-xs">
                                <span style={{ width: 12, height: 12, backgroundColor: params['replaceHex'] || 'transparent', border: '1px solid var(--color-border)', borderRadius: 2 }}></span>
                                <CompositionInput
                                    type="text"
                                    className="input"
                                    placeholder="#FF0000"
                                    value={params['replaceHex'] || ''}
                                    onChange={(e: any) => setParams(p => ({ ...p, replaceHex: e.target.value }))}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>
                    </div>
                    <SuccessButton
                        className="btn btn-primary"
                        onClick={handleExecuteInline}
                        disabled={isExecuting}
                        style={{ width: '100%' }}
                    >
                        替换颜色
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'change-case') {
            const act = async (m: string) => { setError(null); const r = await executeScriptWithAccess({ mode: m }); if (!r.success) setError(r.error || '执行失败'); else setShowSuccess(true); };
            const sectionLabel = (text: string) => (
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>{text}</div>
            );
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                        {sectionLabel('字母大小写')}
                        <ActionGrid cols={4} disabled={isExecuting} items={[
                            { label: '全部大写', onClick: () => act('uppercase'), icon: <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.5px' }}>AB</span> },
                            { label: '全部小写', onClick: () => act('lowercase'), icon: <span style={{ fontSize: 13, fontWeight: 400, fontStyle: 'italic' }}>ab</span> },
                            { label: '首字母大写', onClick: () => act('titlecase'), icon: <span style={{ fontSize: 13, fontWeight: 600 }}>Ab</span> },
                            { label: '句首大写', onClick: () => act('sentencecase'), icon: <span style={{ fontSize: 13, fontWeight: 600 }}>A路b</span> },
                        ]} />
                    </div>
                    <div>
                        {sectionLabel('数字转汉字')}
                        <ActionGrid cols={2} disabled={isExecuting} items={[
                            { label: '财务大写 (壹)', onClick: () => act('num-cn-capital'), icon: <span style={{ fontSize: 15, fontWeight: 600 }}>壹</span> },
                            { label: '常规汉字 (一)', onClick: () => act('num-cn-normal'), icon: <span style={{ fontSize: 15, fontWeight: 400 }}>一</span> },
                        ]} />
                    </div>
                </div>
            );
        }

        if (script.id === 'auto-fit-text') {
            const act = async (m: string) => { setError(null); const r = await executeScriptWithAccess({ mode: m }); if (!r.success) setError(r.error || '执行失败'); else setShowSuccess(true); };
            return <ActionGrid disabled={isExecuting} items={[
                { label: '转为点文本', onClick: () => act('point'), icon: <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><text x="12" y="18" fontSize="20" textAnchor="middle" fill="currentColor" fontWeight="bold">T</text></svg> },
                { label: '转为区域文本', onClick: () => act('area'), icon: <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" /><text x="12" y="17" fontSize="14" textAnchor="middle" fill="currentColor">T</text></svg> },
            ]} />;
        }

        if (script.id === 'apply-cjk-latin-fonts') {
            const allPresets = settings.scriptParamPresets || {};
            const presetList: { name: string; params: Record<string, any> }[] = Array.isArray(allPresets[script.id]) ? allPresets[script.id] : [];
            const cjkFont = params['cjkFont'] || 'Microsoft YaHei';
            const latinFont = params['latinFont'] || 'Arial';
            const scope = params['scope'] || 'selection';
            const stylePunctuation = params['stylePunctuation'] !== false;
            const cjkFontValue = String(cjkFont);
            const latinFontValue = String(latinFont);
            const buildRunParams = () => ({
                cjkFont: String(cjkFont).trim(),
                latinFont: String(latinFont).trim(),
                scope: String(scope),
                stylePunctuation: !!stylePunctuation,
            });

            const handleRun = async () => {
                setError(null);
                const payload = buildRunParams();
                if (!payload.cjkFont) {
                    setError('请输入中文字体');
                    return;
                }
                if (!payload.latinFont) {
                    setError('请输入英文字体');
                    return;
                }

                const result = await executeScriptWithAccess(payload);
                if (!result.success) {
                    setError(result.error || '执行失败');
                    return;
                }
                setShowSuccess(true);
            };

            const handleSavePreset = () => {
                setError(null);
                var name = String(presetNameInput || '').trim();
                if (!name) {
                    setError('请输入预设名称');
                    return;
                }

                const nextItem = { name, params: buildRunParams() };
                const nextList = presetList.slice();
                const idx = nextList.findIndex((p) => p && p.name === name);
                if (idx >= 0) nextList[idx] = nextItem;
                else nextList.push(nextItem);

                update('scriptParamPresets', {
                    ...(settings.scriptParamPresets || {}),
                    [script.id]: nextList,
                });
                setSelectedPresetName(name);
                setShowSuccess(true);
            };

            const handleApplyPreset = () => {
                setError(null);
                if (!selectedPresetName) {
                    setError('请选择预设');
                    return;
                }
                const found = presetList.find((p) => p && p.name === selectedPresetName);
                if (!found || !found.params) {
                    setError('预设不存在');
                    return;
                }
                setParams((prev) => ({ ...prev, ...found.params }));
                setShowSuccess(true);
            };

            const handleDeletePreset = () => {
                setError(null);
                if (!selectedPresetName) {
                    setError('请选择要删除的预设');
                    return;
                }
                const nextList = presetList.filter((p) => p && p.name !== selectedPresetName);
                update('scriptParamPresets', {
                    ...(settings.scriptParamPresets || {}),
                    [script.id]: nextList,
                });
                setSelectedPresetName(nextList.length ? nextList[0].name : '');
                setShowSuccess(true);
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 10px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                中文字体
                            </label>
                            <FontPickerInput
                                value={cjkFontValue}
                                onChange={(next) => setParams((p) => ({ ...p, cjkFont: next }))}
                                fonts={fontList}
                                loading={fontListLoading}
                                placeholder="例如 Microsoft YaHei"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                英文数字字体
                            </label>
                            <FontPickerInput
                                value={latinFontValue}
                                onChange={(next) => setParams((p) => ({ ...p, latinFont: next }))}
                                fonts={fontList}
                                loading={fontListLoading}
                                placeholder="例如 Arial"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select
                            className="select"
                            value={scope}
                            onChange={(e) => setParams(p => ({ ...p, scope: e.target.value }))}
                            style={{ flex: 1 }}
                        >
                            <option value="selection">选区优先（无选区则全文）</option>
                            <option value="document">整个文档</option>
                        </select>
                        <span
                            style={{ ...chipStyle(stylePunctuation), whiteSpace: 'nowrap' }}
                            onClick={() => setParams(p => ({ ...p, stylePunctuation: !stylePunctuation }))}
                            title="是否同时处理中英文标点"
                        >
                            标点
                        </span>
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                        {fontListLoading ? '正在读取 Illustrator 字体库...' : `字体库: ${fontList.length} 个`}
                        {fontListError ? `（${fontListError}）` : ''}
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>预设</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <CompositionInput
                                type="text"
                                className="input"
                                value={presetNameInput}
                                placeholder="输入预设名称后保存"
                                onChange={(e: any) => setPresetNameInput(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <SuccessButton className="btn" onClick={handleSavePreset} disabled={isExecuting}
                                style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}>
                                保存
                            </SuccessButton>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <select className="select" value={selectedPresetName} onChange={(e) => setSelectedPresetName(e.target.value)} style={{ flex: 1 }}>
                                <option value="">选择预设</option>
                                {presetList.map((item) => (
                                    <option key={item.name} value={item.name}>{item.name}</option>
                                ))}
                            </select>
                            <SuccessButton className="btn" onClick={handleApplyPreset} disabled={isExecuting || !selectedPresetName}
                                style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}>
                                应用
                            </SuccessButton>
                            <SuccessButton className="btn" onClick={handleDeletePreset} disabled={isExecuting || !selectedPresetName}
                                style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}>
                                删除
                            </SuccessButton>
                        </div>
                    </div>

                    <SuccessButton className="btn btn-primary" onClick={handleRun} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'paragraph-layout') {
            const allPresets = settings.scriptParamPresets || {};
            const presetList: { name: string; params: Record<string, any> }[] = Array.isArray(allPresets[script.id]) ? allPresets[script.id] : [];

            const scope = params['scope'] || 'selection';
            const alignment = params['alignment'] || 'preserve';
            const applyLineSpacing = params['applyLineSpacing'] === true || params['applyLineSpacing'] === 'true';
            const applyParagraphSpacing = params['applyParagraphSpacing'] === true || params['applyParagraphSpacing'] === 'true';
            const applyFirstLineIndent = params['applyFirstLineIndent'] !== false && params['applyFirstLineIndent'] !== 'false';
            const indentMode = params['indentMode'] || 'chars';

            const lineSpacingPt = params['lineSpacingPt'] ?? 18;
            const spaceBeforePt = params['spaceBeforePt'] ?? 0;
            const spaceAfterPt = params['spaceAfterPt'] ?? 0;
            const indentChars = params['indentChars'] ?? 2;
            const firstLineIndentPt = params['firstLineIndentPt'] ?? 0;

            const buildRunParams = () => ({
                scope: String(scope),
                alignment: String(alignment),
                applyLineSpacing,
                applyParagraphSpacing,
                applyFirstLineIndent,
                lineSpacingPt: Number(lineSpacingPt),
                spaceBeforePt: Number(spaceBeforePt),
                spaceAfterPt: Number(spaceAfterPt),
                indentMode: String(indentMode),
                indentChars: Number(indentChars),
                firstLineIndentPt: Number(firstLineIndentPt),
            });

            const handleRun = async () => {
                setError(null);
                const payload = buildRunParams();
                if (payload.applyLineSpacing && (!isFinite(payload.lineSpacingPt) || payload.lineSpacingPt <= 0)) {
                    setError('行距必须大于 0');
                    return;
                }
                if (payload.applyFirstLineIndent && payload.indentMode === 'chars' && (!isFinite(payload.indentChars) || payload.indentChars < 0)) {
                    setError('缩进字符数不能为负');
                    return;
                }
                if (payload.applyFirstLineIndent && payload.indentMode === 'pt' && !isFinite(payload.firstLineIndentPt)) {
                    setError('首行缩进(pt) 请输入数字');
                    return;
                }

                const result = await executeScriptWithAccess(payload);
                if (!result.success) {
                    setError(result.error || '执行失败');
                    return;
                }
                setShowSuccess(true);
            };

            const handleSavePreset = () => {
                setError(null);
                var name = String(presetNameInput || '').trim();
                if (!name) {
                    setError('请输入预设名称');
                    return;
                }

                const nextItem = { name, params: buildRunParams() };
                const nextList = presetList.slice();
                const idx = nextList.findIndex((p) => p && p.name === name);
                if (idx >= 0) nextList[idx] = nextItem;
                else nextList.push(nextItem);

                update('scriptParamPresets', {
                    ...(settings.scriptParamPresets || {}),
                    [script.id]: nextList,
                });
                setSelectedPresetName(name);
                setShowSuccess(true);
            };

            const handleApplyPreset = () => {
                setError(null);
                if (!selectedPresetName) {
                    setError('请选择预设');
                    return;
                }
                const found = presetList.find((p) => p && p.name === selectedPresetName);
                if (!found || !found.params) {
                    setError('预设不存在');
                    return;
                }
                setParams((prev) => ({ ...prev, ...found.params }));
                setShowSuccess(true);
            };

            const handleDeletePreset = () => {
                setError(null);
                if (!selectedPresetName) {
                    setError('请选择要删除的预设');
                    return;
                }
                const nextList = presetList.filter((p) => p && p.name !== selectedPresetName);
                update('scriptParamPresets', {
                    ...(settings.scriptParamPresets || {}),
                    [script.id]: nextList,
                });
                setSelectedPresetName(nextList.length ? nextList[0].name : '');
                setShowSuccess(true);
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 10px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>作用范围</label>
                            <select className="select" value={scope} onChange={(e) => setParams(p => ({ ...p, scope: e.target.value }))}>
                                <option value="selection">选区优先（无选区则全文）</option>
                                <option value="document">整个文档</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>对齐方式</label>
                            <select className="select" value={alignment} onChange={(e) => setParams(p => ({ ...p, alignment: e.target.value }))}>
                                <option value="preserve">保持原样</option>
                                <option value="left">左对齐</option>
                                <option value="center">居中对齐</option>
                                <option value="right">右对齐</option>
                                <option value="justify">两端对齐</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 10px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>行距(pt)</label>
                            <input type="number" className="input" value={lineSpacingPt} min={0.1} step={0.1}
                                onChange={(e) => setParams(p => ({ ...p, lineSpacingPt: e.target.value === '' ? '' : parseFloat(e.target.value) }))} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'end' }}>
                            <span style={{ ...chipStyle(applyLineSpacing), width: '100%', textAlign: 'center' }}
                                onClick={() => setParams(p => ({ ...p, applyLineSpacing: !applyLineSpacing }))}>
                                应用行距
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 10px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>段前距(pt)</label>
                            <input type="number" className="input" value={spaceBeforePt} min={0} step={0.1}
                                onChange={(e) => setParams(p => ({ ...p, spaceBeforePt: e.target.value === '' ? '' : parseFloat(e.target.value) }))} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>段后距(pt)</label>
                            <input type="number" className="input" value={spaceAfterPt} min={0} step={0.1}
                                onChange={(e) => setParams(p => ({ ...p, spaceAfterPt: e.target.value === '' ? '' : parseFloat(e.target.value) }))} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ ...chipStyle(applyParagraphSpacing), flex: 1, textAlign: 'center' }}
                            onClick={() => setParams(p => ({ ...p, applyParagraphSpacing: !applyParagraphSpacing }))}>
                            应用段前后距                        </span>
                        <span style={{ ...chipStyle(applyFirstLineIndent), flex: 1, textAlign: 'center' }}
                            onClick={() => setParams(p => ({ ...p, applyFirstLineIndent: !applyFirstLineIndent }))}>
                            应用首行缩进
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>首行缩进模式</label>
                            <select className="select" value={indentMode} onChange={(e) => setParams(p => ({ ...p, indentMode: e.target.value }))}>
                                <option value="chars">按字符倍数（推荐）</option>
                                <option value="pt">固定 pt 值</option>
                            </select>
                        </div>
                        <div>
                            {indentMode === 'chars' ? (
                                <>
                                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>缩进字符数</label>
                                    <input type="number" className="input" value={indentChars} min={0} step={0.1}
                                        onChange={(e) => setParams(p => ({ ...p, indentChars: e.target.value === '' ? '' : parseFloat(e.target.value) }))} />
                                </>
                            ) : (
                                <>
                                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>首行缩进(pt)</label>
                                    <input type="number" className="input" value={firstLineIndentPt} step={0.1}
                                        onChange={(e) => setParams(p => ({ ...p, firstLineIndentPt: e.target.value === '' ? '' : parseFloat(e.target.value) }))} />
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                        字符倍数模式下：默认 2 字符，即每段按“该段字号 × 2”设置首行缩进。                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>预设</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <CompositionInput type="text" className="input" value={presetNameInput} placeholder="输入预设名称后保存"
                                onChange={(e: any) => setPresetNameInput(e.target.value)} style={{ flex: 1 }} />
                            <SuccessButton className="btn" onClick={handleSavePreset} disabled={isExecuting}
                                style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}>
                                保存
                            </SuccessButton>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <select className="select" value={selectedPresetName} onChange={(e) => setSelectedPresetName(e.target.value)} style={{ flex: 1 }}>
                                <option value="">选择预设</option>
                                {presetList.map((item) => (
                                    <option key={item.name} value={item.name}>{item.name}</option>
                                ))}
                            </select>
                            <SuccessButton className="btn" onClick={handleApplyPreset} disabled={isExecuting || !selectedPresetName}
                                style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}>
                                应用
                            </SuccessButton>
                            <SuccessButton className="btn" onClick={handleDeletePreset} disabled={isExecuting || !selectedPresetName}
                                style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}>
                                删除
                            </SuccessButton>
                        </div>
                    </div>

                    <SuccessButton className="btn btn-primary" onClick={handleRun} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        if (script.id === 'auto-number') {
            const handleExecuteNumbering = async (order: 'row' | 'column') => {
                setError(null);
                const result = await executeScriptWithAccess({
                    prefix: params['prefix'] || '',
                    suffix: params['suffix'] || '',
                    startNum: params['startNum'] || '1',
                    startNumStr: params['startNum'] || '1', // Pass raw string for length detection
                    increment: params['increment'] || '1',
                    sortOrder: order
                });
                if (!result.success) setError(result.error || '执行失败');
                else setShowSuccess(true);
            };

            return (
                <div className="flex flex-col gap-sm">
                    {/* Prefix/Suffix Row */}
                    <div className="flex gap-xs">
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">前缀:</label>
                            <CompositionInput
                                type="text"
                                className="input"
                                placeholder=""
                                value={params['prefix'] || ''}
                                onChange={(e: any) => setParams(p => ({ ...p, prefix: e.target.value }))}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">鍚庣紑:</label>
                            <CompositionInput
                                type="text"
                                className="input"
                                placeholder=""
                                value={params['suffix'] || ''}
                                onChange={(e: any) => setParams(p => ({ ...p, suffix: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Start/Inc Row */}
                    <div className="flex gap-xs">
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">起始:</label>
                            <CompositionInput
                                type="text"
                                className="input"
                                placeholder="1"
                                value={params['startNum'] || ''}
                                onChange={(e: any) => setParams(p => ({ ...p, startNum: e.target.value }))}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="text-xs mb-xs block">增量:</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="1"
                                value={params['increment'] || '1'}
                                onChange={(e) => setParams(p => ({ ...p, increment: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                        <SuccessButton
                            className="btn"
                            title="按行排序 (Z字形: 左上->右下)"
                            onClick={() => handleExecuteNumbering('row')}
                            disabled={isExecuting}
                            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', flexDirection: 'column', gap: '2px', padding: '8px 0', height: 'auto' }}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ opacity: 0.6 }}>
                                <path d="M4 6h16v2H4zm4 5h12v2H8zm-4 5h16v2H4z" />
                                <path d="M4 11h2v2H4z" fill="var(--color-accent)" />
                            </svg>
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>按行编号 (Z)</span>
                        </SuccessButton>
                        <SuccessButton
                            className="btn"
                            title="按列排序 (N字形: 左上->下右)"
                            onClick={() => handleExecuteNumbering('column')}
                            disabled={isExecuting}
                            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', flexDirection: 'column', gap: '2px', padding: '8px 0', height: 'auto' }}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ opacity: 0.6 }}>
                                <path d="M6 4v16h2V4zm5 4v12h2V8zm5-4v16h2V4z" />
                                <path d="M11 4v2h2V4z" fill="var(--color-accent)" />
                            </svg>
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>按列编号 (N)</span>
                        </SuccessButton>
                    </div>
                </div>
            );
        }

        if (script.id === 'random-irregular-shapes') {
            const getP = (name: string, def: any) => params[name] ?? def;
            const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
            const cleanHex = (value: any, fallback: string) => {
                const raw = String(value || '').trim();
                const withHash = raw.startsWith('#') ? raw : `#${raw}`;
                return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toUpperCase() : fallback;
            };
            const colorA = cleanHex(getP('colorA', '#FFA500'), '#FFA500');
            const colorB = cleanHex(getP('colorB', '#FF6347'), '#FF6347');
            const fillType = String(getP('fillType', 'gradient'));
            const edges = clamp(parseInt(String(getP('edges', 8)), 10) || 8, 3, 32);
            const smoothness = clamp(parseFloat(String(getP('smoothness', 70))) || 70, 0, 100) / 100;
            const irregularity = clamp(parseFloat(String(getP('irregularity', 48))) || 48, 0, 100) / 100;
            const seedValue = parseInt(String(getP('seed', 914783)), 10) || 914783;

            const makeBlobPath = () => {
                let state = seedValue;
                const rnd = () => {
                    state = (state * 16807) % 2147483647;
                    return (state - 1) / 2147483646;
                };
                const between = (min: number, max: number) => min + rnd() * (max - min);
                const cx = 110;
                const cy = 92;
                const radius = 58;
                const angleStep = Math.PI * 2 / edges;
                const angleJitter = angleStep * irregularity * 0.38;
                const pts: Array<[number, number]> = [];

                for (let i = 0; i < edges; i++) {
                    const angle = -Math.PI / 2 + i * angleStep + between(-angleJitter, angleJitter);
                    const r = radius * between(1 - irregularity * 0.42, 1 + irregularity * 0.42);
                    pts.push([
                        cx + Math.cos(angle) * r * between(0.84, 1.18),
                        cy + Math.sin(angle) * r * between(0.84, 1.18),
                    ]);
                }

                if (smoothness <= 0.01) {
                    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
                }

                const dist = (a: [number, number], b: [number, number]) => {
                    const dx = b[0] - a[0];
                    const dy = b[1] - a[1];
                    return Math.sqrt(dx * dx + dy * dy);
                };
                const handleScale = 0.10 + smoothness * 0.34;
                let path = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
                for (let i = 0; i < pts.length; i++) {
                    const curr = pts[i];
                    const next = pts[(i + 1) % pts.length];
                    const prev = pts[(i - 1 + pts.length) % pts.length];
                    const nextNext = pts[(i + 2) % pts.length];
                    const currTangent = Math.atan2(next[1] - prev[1], next[0] - prev[0]);
                    const nextTangent = Math.atan2(nextNext[1] - curr[1], nextNext[0] - curr[0]);
                    const c1Len = dist(curr, next) * handleScale;
                    const c2Len = dist(next, curr) * handleScale;
                    const c1: [number, number] = [
                        curr[0] + Math.cos(currTangent) * c1Len,
                        curr[1] + Math.sin(currTangent) * c1Len,
                    ];
                    const c2: [number, number] = [
                        next[0] - Math.cos(nextTangent) * c2Len,
                        next[1] - Math.sin(nextTangent) * c2Len,
                    ];
                    path += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${next[0].toFixed(1)} ${next[1].toFixed(1)}`;
                }
                return path + ' Z';
            };

            const presetColors = ['#FFA500', '#FF6347', '#18DCE8', '#F43FA5', '#F3164D', '#76D900', '#9217E8', '#208CF0'];
            const setColor = (name: 'colorA' | 'colorB', value: string) => setParams(p => ({ ...p, [name]: value.toUpperCase() }));
            const randomize = () => {
                const nextSeed = Math.floor(Math.random() * 999999) + 1;
                setParams(p => ({ ...p, seed: nextSeed }));
            };
            const previewInDocument = async () => {
                setError(null);
                await silentExecuteBlob({ ...params, preview: true });
                blobPreviewActiveRef.current = true;
            };
            const createBlob = async () => {
                setError(null);
                await silentExecuteBlob({ clearOnly: true });
                blobPreviewActiveRef.current = false;
                const result = await executeScriptWithAccess(params);
                if (!result.success) setError(result.error || '执行失败');
                else setShowSuccess(true);
            };

            const rangeControl = (name: string, label: string, min: number, max: number, suffix = '') => (
                <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 42px', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{label}</span>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={1}
                        value={getP(name, name === 'edges' ? 8 : name === 'smoothness' ? 70 : 48)}
                        onChange={(e) => setParams(p => ({ ...p, [name]: parseFloat(e.target.value) }))}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
                        {getP(name, name === 'edges' ? 8 : name === 'smoothness' ? 70 : 48)}{suffix}
                    </span>
                </div>
            );

            const colorPicker = (name: 'colorA' | 'colorB', value: string, label: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{label}</span>
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => setColor(name, e.target.value)}
                        style={{
                            width: '34px',
                            height: '28px',
                            padding: 0,
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            background: 'transparent',
                            cursor: 'pointer',
                        }}
                    />
                    <CompositionInput
                        type="text"
                        className="input"
                        value={value}
                        onChange={(e: any) => setColor(name, cleanHex(e.target.value, value))}
                        style={{ height: '28px', fontSize: '12px', flex: 1, minWidth: 0 }}
                    />
                </div>
            );

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                        height: '184px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        <svg viewBox="0 0 220 184" width="100%" height="100%" aria-hidden="true">
                            <defs>
                                <linearGradient id={`blob-preview-${script.id}`} x1="20%" y1="15%" x2="80%" y2="85%">
                                    <stop offset="0%" stopColor={colorA} />
                                    <stop offset="100%" stopColor={colorB} />
                                </linearGradient>
                            </defs>
                            <path
                                d={makeBlobPath()}
                                fill={fillType === 'outline' ? 'none' : fillType === 'gradient' ? `url(#blob-preview-${script.id})` : colorA}
                                stroke={fillType === 'outline' ? colorA : fillType === 'solid' ? colorB : 'none'}
                                strokeWidth={fillType === 'outline' ? Math.max(1, parseFloat(String(getP('strokeWidth', 2))) || 2) : fillType === 'solid' ? Math.max(0, parseFloat(String(getP('strokeWidth', 2))) || 0) : 0}
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        {(['gradient', 'solid', 'outline'] as const).map((mode) => (
                            <span
                                key={mode}
                                style={{ ...chipStyle(fillType === mode), flex: 1, textAlign: 'center', justifyContent: 'center' }}
                                onClick={() => setParams(p => ({ ...p, fillType: mode }))}
                            >
                                {mode === 'gradient' ? '渐变' : mode === 'solid' ? '实色' : '轮廓'}
                            </span>
                        ))}
                    </div>

                    {rangeControl('edges', '边缘', 3, 32)}
                    {rangeControl('smoothness', '平滑度', 0, 100, '%')}
                    {rangeControl('irregularity', '不规则度', 0, 100, '%')}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>尺寸 (mm)</label>
                            <input
                                type="number"
                                className="input"
                                min={1}
                                step={1}
                                value={getP('size', 80)}
                                onChange={(e) => setParams(p => ({ ...p, size: parseFloat(e.target.value) || 80 }))}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>轮廓宽度 (pt)</label>
                            <input
                                type="number"
                                className="input"
                                min={0}
                                step={0.25}
                                value={getP('strokeWidth', 2)}
                                onChange={(e) => setParams(p => ({ ...p, strokeWidth: parseFloat(e.target.value) || 0 }))}
                                disabled={fillType === 'gradient'}
                                style={{ opacity: fillType === 'gradient' ? 0.45 : 1 }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {presetColors.map((c) => (
                            <button
                                key={c}
                                type="button"
                                title={c}
                                onClick={() => setColor('colorA', c)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setColor('colorB', c);
                                }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    border: c === colorA || c === colorB ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                                    background: c,
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {colorPicker('colorA', colorA, fillType === 'outline' ? '轮廓' : '颜色 A')}
                        {fillType !== 'outline' && colorPicker('colorB', colorB, fillType === 'solid' ? '描边' : '颜色 B')}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <select
                            className="select"
                            value={getP('region', 'artboard')}
                            onChange={(e) => setParams(p => ({ ...p, region: e.target.value }))}
                        >
                            <option value="artboard">当前画板中心</option>
                            <option value="selection">选区中心</option>
                        </select>
                        <input
                            type="number"
                            className="input"
                            min={0}
                            step={1}
                            value={getP('seed', 0)}
                            title="随机种子；点击随机会换一组形状"
                            onChange={(e) => setParams(p => ({ ...p, seed: parseInt(e.target.value, 10) || 914783 }))}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: '6px' }}>
                        <SuccessButton className="btn" onClick={randomize} disabled={isExecuting}>
                            随机
                        </SuccessButton>
                        <SuccessButton className="btn" onClick={previewInDocument} disabled={isExecuting}>
                            预览
                        </SuccessButton>
                        <SuccessButton className="btn btn-primary" onClick={createBlob} disabled={isExecuting}>
                            {isExecuting ? <><span className="spinner" /> 执行中...</> : '创建'}
                        </SuccessButton>
                    </div>
                </div>
            );
        }

        if (script.id === 'make-size') {
            const getP = (name: string, def: any) => params[name] ?? def;

            const FONT_OPTIONS = [
                { label: '系统默认', value: '' },
                { label: '微软雅黑', value: 'MicrosoftYaHei' },
                { label: '黑体', value: 'Simhei' },
                { label: '宋体', value: 'simsun' },
                { label: 'Arial', value: 'ArialMT' },
                { label: 'Arial Bold', value: 'Arial-BoldMT' },
                { label: 'Arial Unicode', value: 'ArialUnicodeMS' },
                { label: 'Tahoma', value: 'Tahoma' },
                { label: 'Tahoma Bold', value: 'Tahoma-Bold' },
                { label: 'Times New Roman', value: 'TimesNewRomanPSMT' },
                { label: 'Times NR Bold', value: 'TimesNewRomanPS-BoldMT' },
            ];

            const SCALE_OPTIONS = [
                { label: '1/1', value: '1' }, { label: '1/2', value: '2' },
                { label: '1/3', value: '3' }, { label: '1/4', value: '4' },
                { label: '1/5', value: '5' }, { label: '1/6', value: '6' },
                { label: '1/7', value: '7' }, { label: '1/8', value: '8' },
                { label: '1/9', value: '9' }, { label: '1/10', value: '10' },
                { label: '1/15', value: '15' }, { label: '1/20', value: '20' },
                { label: '1/25', value: '25' }, { label: '1/50', value: '50' },
                { label: '1/100', value: '100' }, { label: '1/150', value: '150' },
                { label: '1/200', value: '200' }, { label: '1/300', value: '300' },
            ];

            const handleMakeSizeExecute = async () => {
                setError(null);
                await silentExecute({ headless: true, clearOnly: true });
                previewActiveRef.current = false;

                const result = await executeScriptWithAccess({
                    top: getP('top', true),
                    bottom: getP('bottom', true),
                    left: getP('left', false),
                    right: getP('right', false),
                    mode: getP('mode', 'each'),
                    fontSize: getP('fontSize', 12),
                    unitIndex: getP('unitIndex', '0'),
                    scale: getP('scale', '1'),
                    autoSize: getP('autoSize', true),
                    visualScale: getP('visualScale', 100),
                    fontFace: getP('fontFace', ''),
                    decimals: getP('decimals', 2),
                    lineWeight: getP('lineWeight', 0.5),
                    gap: getP('gap', 3),
                    doubleLine: getP('doubleLine', 8),
                    arrow: getP('arrow', false),
                    arrowSize: getP('arrowSize', 6),
                    arrowSealing: getP('arrowSealing', false),
                    cyan: getP('cyan', 0),
                    magenta: getP('magenta', 100),
                    yellow: getP('yellow', 100),
                    black: getP('black', 10),
                    showUnits: getP('showUnits', false),
                    includeStroke: getP('includeStroke', false),
                    lockLayer: getP('lockLayer', false),
                    headless: true,
                    preview: false,
                });

                if (!result.success) {
                    setError(result.error || '执行失败');
                } else {
                    setShowSuccess(true);
                }
            };

            const allFour = getP('top', true) && getP('bottom', true) && getP('left', false) && getP('right', false);
            const arrowOn = getP('arrow', false);

            const lblSt: React.CSSProperties = { fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', minWidth: '28px' };
            const inpSt: React.CSSProperties = { height: '26px', fontSize: '12px' };
            const rowSt: React.CSSProperties = { display: 'flex', gap: '6px', alignItems: 'center' };

            return (
                <div className="flex flex-col gap-sm" style={{ fontSize: '12px' }}>
                    {/* Side selection chips */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {([
                            { label: '上', name: 'top', def: true },
                            { label: '下', name: 'bottom', def: true },
                            { label: '左', name: 'left', def: false },
                            { label: '右', name: 'right', def: false },
                        ] as const).map(s => (
                            <span key={s.name} style={chipStyle(getP(s.name, s.def))}
                                onClick={() => setParams(p => ({ ...p, [s.name]: !getP(s.name, s.def) }))}>
                                {s.label}
                            </span>
                        ))}
                        <span
                            style={chipStyle(allFour)}
                            onClick={() => {
                                const v = !allFour;
                                setParams(p => ({ ...p, top: v, bottom: v, left: v, right: v }));
                            }}
                        >四边</span>
                    </div>

                    {/* Mode + Unit + Scale row */}
                    <div style={rowSt}>
                        <select className="select" style={{ ...inpSt, flex: 1.5 }}
                            value={getP('mode', 'each')}
                            onChange={(e) => setParams(p => ({ ...p, mode: e.target.value }))}>
                            <option value="each">单体标注</option>
                            <option value="between">间距标注</option>
                            <option value="entire">总距离标注</option>
                        </select>
                        <select className="select" style={{ ...inpSt, flex: 1 }}
                            value={getP('unitIndex', '0')}
                            onChange={(e) => setParams(p => ({ ...p, unitIndex: e.target.value }))}>
                            <option value="0">自动单位</option>
                            <option value="1">mm</option>
                            <option value="2">cm</option>
                            <option value="3">m</option>
                            <option value="4">pt</option>
                            <option value="5">px</option>
                            <option value="6">in</option>
                            <option value="7">ft</option>
                            <option value="8">pc</option>
                        </select>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={lblSt}>1:</span>
                            <input type="number" className="input" style={{ ...inpSt, width: '100%' }}
                                placeholder="Scale"
                                value={getP('scale', '1')}
                                onChange={(e) => setParams(p => ({ ...p, scale: e.target.value }))} />
                        </div>
                    </div>

                    {/* Auto Size Checkbox + Visual Scale */}
                    <div style={rowSt}>
                        <span style={{ ...chipStyle(getP('autoSize', true)), flex: 'none' }}
                            onClick={() => setParams(p => ({ ...p, autoSize: !getP('autoSize', true) }))}>
                            自动匹配大小
                        </span>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', opacity: getP('autoSize', true) ? 1 : 0.5 }}>
                            <span style={lblSt}>视觉%:</span>
                            <input type="number" className="input" style={{ ...inpSt, width: '100%' }}
                                placeholder="100"
                                disabled={!getP('autoSize', true)}
                                value={getP('visualScale', 100)}
                                onChange={(e) => setParams(p => ({ ...p, visualScale: parseFloat(e.target.value) || 100 }))} />
                        </div>
                    </div>

                    {/* Font row */}
                    <div style={rowSt}>
                        <span style={lblSt}>字体</span>
                        <select className="select" style={{ ...inpSt, flex: 1 }}
                            value={getP('fontFace', '')}
                            onChange={(e) => setParams(p => ({ ...p, fontFace: e.target.value }))}>
                            {FONT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Font size + Decimals */}
                    <div style={rowSt}>
                        <span style={lblSt}>字号</span>
                        <input type="number" className="input" style={{ ...inpSt, flex: 1, opacity: getP('autoSize', true) ? 0.5 : 1 }}
                            disabled={getP('autoSize', true)}
                            value={getP('fontSize', 12)} min={1}
                            onChange={(e) => setParams(p => ({ ...p, fontSize: parseFloat(e.target.value) || 12 }))} />
                        <span style={lblSt}>小数位</span>
                        <input type="number" className="input" style={{ ...inpSt, flex: 1 }}
                            value={getP('decimals', 2)} min={0} max={6}
                            onChange={(e) => setParams(p => ({ ...p, decimals: parseInt(e.target.value) || 0 }))} />
                    </div>

                    {/* Line weight + Gap */}
                    <div style={rowSt}>
                        <span style={lblSt}>线宽</span>
                        <input type="number" className="input" style={{ ...inpSt, flex: 1, opacity: getP('autoSize', true) ? 0.5 : 1 }}
                            disabled={getP('autoSize', true)}
                            value={getP('lineWeight', 0.5)} min={0} step={0.1}
                            onChange={(e) => setParams(p => ({ ...p, lineWeight: parseFloat(e.target.value) || 0.5 }))} />
                        <span style={lblSt}>间距</span>
                        <input type="number" className="input" style={{ ...inpSt, flex: 1, opacity: getP('autoSize', true) ? 0.5 : 1 }}
                            disabled={getP('autoSize', true)}
                            value={getP('gap', 3)}
                            onChange={(e) => setParams(p => ({ ...p, gap: parseFloat(e.target.value) || 0 }))} />
                    </div>

                    {/* Double line + Arrow */}
                    <div style={rowSt}>
                        <span style={lblSt}>界线长</span>
                        <input type="number" className="input" style={{ ...inpSt, width: '48px', flex: 'none', opacity: getP('autoSize', true) ? 0.5 : 1 }}
                            disabled={getP('autoSize', true)}
                            value={getP('doubleLine', 8)} min={0}
                            onChange={(e) => setParams(p => ({ ...p, doubleLine: parseFloat(e.target.value) || 8 }))} />
                        <span style={chipStyle(arrowOn)}
                            onClick={() => setParams(p => ({ ...p, arrow: !arrowOn }))}>
                            箭头
                        </span>
                        <input type="number" className="input"
                            style={{ ...inpSt, width: '40px', flex: 'none', opacity: (arrowOn && !getP('autoSize', true)) ? 1 : 0.4 }}
                            value={getP('arrowSize', 6)} min={1} disabled={!arrowOn || getP('autoSize', true)}
                            onChange={(e) => setParams(p => ({ ...p, arrowSize: parseFloat(e.target.value) || 6 }))} />
                        <span style={{ ...chipStyle(getP('arrowSealing', false)), opacity: arrowOn ? 1 : 0.4 }}
                            onClick={() => { if (arrowOn) setParams(p => ({ ...p, arrowSealing: !getP('arrowSealing', false) })); }}>
                            实心
                        </span>
                    </div>

                    {/* CMYK Color */}
                    <div style={{ ...rowSt, gap: '4px' }}>
                        <span style={lblSt}>颜色</span>
                        {([
                            { key: 'cyan', label: 'C', def: 0 },
                            { key: 'magenta', label: 'M', def: 100 },
                            { key: 'yellow', label: 'Y', def: 100 },
                            { key: 'black', label: 'K', def: 10 },
                        ] as const).map(c => (
                            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{c.label}</span>
                                <input type="number" className="input"
                                    style={{ ...inpSt, width: '100%' }}
                                    value={getP(c.key, c.def)} min={0} max={100}
                                    onChange={(e) => setParams(p => ({ ...p, [c.key]: parseInt(e.target.value) || 0 }))} />
                            </div>
                        ))}
                    </div>

                    {/* Option chips */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {([
                            { name: 'showUnits', label: '单位后缀', def: false },
                            { name: 'includeStroke', label: '包含描边', def: false },
                            { name: 'lockLayer', label: '锁标注层', def: false },
                        ] as const).map(o => (
                            <span key={o.name} style={chipStyle(getP(o.name, o.def))}
                                onClick={() => setParams(p => ({ ...p, [o.name]: !getP(o.name, o.def) }))}>
                                {o.label}
                            </span>
                        ))}
                    </div>

                    {/* Execute */}
                    <SuccessButton
                        className="btn btn-primary"
                        onClick={handleMakeSizeExecute}
                        disabled={isExecuting}
                        style={{ width: '100%', marginTop: '4px' }}
                    >
                        {isExecuting ? (
                            <div className="flex items-center gap-sm">
                                <svg className="animate-spin" viewBox="0 0 24 24" width="14" height="14" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                                </svg>
                                <span>执行中...</span>
                            </div>
                        ) : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        // Matrix Clone with live count display
        if (script.id === 'matrix-clone') {
            const rows = params['rows'] ?? 5;
            const cols = params['cols'] ?? 10;
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 10px' }}>
                        {script.params!.map(p => (
                            <div key={p.name}>
                                <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>{p.label}</label>
                                {renderParamInput(p, params, setParams)}
                            </div>
                        ))}
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '4px 10px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)'
                    }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>生成数量</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)' }}>{rows * cols}</span>
                    </div>
                    <SuccessButton className="btn btn-primary" onClick={handleExecute} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                </div>
            );
        }

        // Smart Clone/Replace with position grid
        if (script.id === 'smart-clone-replace') {
            const handlePositionSelect = (position: string) => {
                setParams(prev => ({ ...prev, alignPosition: position }));
            };

            return (
                <div>
                    <div
                        style={{
                            marginBottom: 'var(--spacing-md)',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        {/* Position Grid */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: 'var(--spacing-sm)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 500,
                                    textAlign: 'center',
                                }}
                            >
                                对齐位置
                            </label>
                            <PositionGrid
                                onSelect={handlePositionSelect}
                                disabled={isExecuting}
                                selectedPosition={params['alignPosition'] ?? '5'}
                            />
                        </div>

                        {/* Select params */}
                        {script.params!.filter(p => p.name !== 'alignPosition' && p.type === 'select').map(p => (
                            <div key={p.name} style={{ marginBottom: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>{p.label}</label>
                                {renderParamInput(p, params, setParams)}
                            </div>
                        ))}
                        {/* Boolean params as chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {script.params!.filter(p => p.type === 'boolean').map(p => {
                                const active = params[p.name] ?? p.default ?? false;
                                return (
                                    <span key={p.name} style={chipStyle(active)} title={p.description || ''}
                                        onClick={() => setParams(prev => ({ ...prev, [p.name]: !active }))}>
                                        {p.label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <SuccessButton
                        className="btn btn-primary"
                        onClick={handleExecute}
                        disabled={isExecuting}
                        style={{ width: '100%' }}
                    >
                        {isExecuting ? (
                            <>
                                <span className="spinner" />
                                执行中...
                            </>
                        ) : (
                            '执行'
                        )}
                    </SuccessButton>
                </div>
            );
        }

        return null;
    }

    // Generic UI for scripts defined in manifest with params
    function renderGenericUI() {
        if (!hasParams) return null;

        const allParams = script.params!.filter((p) => {
            if (script.id !== 'offset-bleed') return true;
            if (params.contourMode !== 'alpha' && p.name.indexOf('alpha') === 0) return false;
            if (params.enableStroke === false && (p.name === 'stroke' || p.name === 'strokeUnit')) return false;
            return true;
        });
        const boolParams = allParams.filter(p => p.type === 'boolean');
        const textareaParams = allParams.filter(p => p.type === 'textarea');
        const fieldParams = allParams.filter(p => p.type !== 'boolean' && p.type !== 'textarea');

        // Single field param, no booleans/textarea 鈫?compact inline layout
        const isInline = fieldParams.length === 1 && boolParams.length === 0 && textareaParams.length === 0;

        if (isInline) {
            const p = fieldParams[0];
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                            {p.label}{showDocumentUnitInLabels && p.type === 'number' && unit ? ` (${unit})` : ''}
                        </label>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {renderParamInput(p, params, setParams)}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {UNDO_PREVIEW_SCRIPTS[script.id] && (
                            <SuccessButton className="btn btn-sm" onClick={handleUndoPreview} disabled={isExecuting}
                                style={{ flex: 1, whiteSpace: 'nowrap', padding: '4px 12px' }}>
                                {isExecuting ? <span className="spinner" /> : '预览'}
                            </SuccessButton>
                        )}
                        <SuccessButton className="btn btn-primary btn-sm" onClick={handleExecute} disabled={isExecuting}
                            style={{ flex: 1, whiteSpace: 'nowrap', padding: '4px 12px' }}>
                            {isExecuting ? <span className="spinner" /> : '执行'}
                        </SuccessButton>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Field params in 2-column grid */}
                {fieldParams.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: fieldParams.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                        gap: '8px 10px',
                    }}>
                        {fieldParams.map(p => (
                            <div key={p.name}>
                                <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    {p.label}
                                    {showDocumentUnitInLabels && p.type === 'number' && unit ? ` (${unit})` : ''}
                                    {p.required && <span style={{ color: 'var(--color-error)' }}> *</span>}
                                </label>
                                {renderParamInput(p, params, setParams)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Textarea params full width */}
                {textareaParams.map(p => (
                    <div key={p.name}>
                        <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {p.label}
                            {p.required && <span style={{ color: 'var(--color-error)' }}> *</span>}
                        </label>
                        {p.description && (
                            <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', margin: '0 0 4px' }}>{p.description}</p>
                        )}
                        {renderParamInput(p, params, setParams)}
                    </div>
                ))}

                {/* Boolean params as chip toggles */}
                {boolParams.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {boolParams.map(p => {
                            const active = params[p.name] ?? p.default ?? false;
                            return (
                                <span key={p.name} style={chipStyle(active)} title={p.description || ''}
                                    onClick={() => setParams(prev => {
                                        const next = { ...prev, [p.name]: !active };
                                        if (!active && p.excludes) {
                                            p.excludes.forEach(ex => { next[ex] = false; });
                                        }
                                        return next;
                                    })}>
                                    {p.label}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Execute / Preview buttons */}
                {UNDO_PREVIEW_SCRIPTS[script.id] ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <SuccessButton className="btn" onClick={handleUndoPreview} disabled={isExecuting} style={{ flex: 1 }}>
                            {isExecuting ? <span className="spinner" /> : '预览'}
                        </SuccessButton>
                        <SuccessButton className="btn btn-primary" onClick={handleExecute} disabled={isExecuting} style={{ flex: 1 }}>
                            {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                        </SuccessButton>
                    </div>
                ) : (
                    <SuccessButton className="btn btn-primary" onClick={handleExecute} disabled={isExecuting} style={{ width: '100%' }}>
                        {isExecuting ? <><span className="spinner" /> 执行中...</> : '执行'}
                    </SuccessButton>
                )}
            </div>
        );
    }
};

interface AlphaExportData {
    pngPath: string;
    originalBounds?: [number, number, number, number];
    bounds: [number, number, number, number];
    itemType?: string;
    itemName?: string;
}

type Point2D = [number, number];

interface VectorComponent {
    contour: Point2D[];
    fill: string;
}

interface ImageContourExportData {
    filePath: string;
    bounds: [number, number, number, number];
    itemType?: string;
    itemName?: string;
}

interface ImageContourPreview {
    key: string;
    name: string;
    url: string;
    mask: Uint8Array;
    width: number;
    height: number;
}

function getAlphaMaxSide(quality: any): number {
    if (quality === 'fast') return 640;
    if (quality === 'fine') return 1536;
    return 1024;
}

function clampNumber(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
}

function convertPanelUnitToPt(value: number, unit: string): number {
    const factors: Record<string, number> = {
        pt: 1,
        px: 1,
        pc: 12,
        in: 72,
        mm: 72 / 25.4,
        cm: 72 / 2.54,
    };
    return (Number.isFinite(value) ? value : 0) * (factors[unit] ?? 1);
}

function filePathToUrl(filePath: string): string {
    const normalized = String(filePath || '').replace(/\\/g, '/');
    return `file:///${encodeURI(normalized).replace(/^\/+/, '')}`;
}

function loadImageDataFromPath(filePath: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('无法创建图片处理画布'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
            } catch (err: any) {
                reject(new Error(err?.message || '无法读取导出的 Alpha 图片'));
            }
        };
        img.onerror = () => reject(new Error('无法加载导出的 Alpha 图片'));
        img.src = `${filePathToUrl(filePath)}?t=${Date.now()}`;
    });
}

function imageDataToPngDataUrl(image: ImageData): string {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
}

function normalizeSvgForPanelPreview(svgCode: string): string {
    if (!svgCode.trim()) return '';
    let normalized = svgCode.trim();
    const width = parseSvgLength(normalized.match(/\swidth=(["'])([^"']+)\1/i)?.[2]);
    const height = parseSvgLength(normalized.match(/\sheight=(["'])([^"']+)\1/i)?.[2]);
    const hasViewBox = /\sviewBox=(["'])[^"']+\1/i.test(normalized);
    const fallbackViewBox = !hasViewBox && width && height ? ` viewBox="0 0 ${width} ${height}"` : '';
    normalized = normalized.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
        const cleanAttrs = attrs
            .replace(/\spreserveAspectRatio=(["'])[^"']*\1/i, '')
            .replace(/\swidth=(["'])[^"']*\1/i, '')
            .replace(/\sheight=(["'])[^"']*\1/i, '')
            .replace(/\sstyle=(["'])[^"']*\1/i, '');
        return `<svg${cleanAttrs}${fallbackViewBox} preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%;display:block;overflow:hidden;">`;
    });
    return normalized;
}

function parseSvgLength(value?: string): number | null {
    if (!value) return null;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function prepareVectorizeInputImage(image: ImageData, params: Record<string, any>): ImageData {
    if (params.imageBackgroundEnabled === false) return image;
    const bg = parseHexRgb(params.imageBackgroundColor || '#FFFFFF') || { r: 255, g: 255, b: 255 };
    const source = image.data;
    const data = new Uint8ClampedArray(source.length);
    for (let i = 0; i < source.length; i += 4) {
        const alpha = source[i + 3] / 255;
        data[i] = Math.round(source[i] * alpha + bg.r * (1 - alpha));
        data[i + 1] = Math.round(source[i + 1] * alpha + bg.g * (1 - alpha));
        data[i + 2] = Math.round(source[i + 2] * alpha + bg.b * (1 - alpha));
        data[i + 3] = 255;
    }
    return new ImageData(data, image.width, image.height);
}

function normalizeHexColor(value: any): string {
    const parsed = parseHexRgb(value);
    if (!parsed) return '#FFFFFF';
    const part = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${part(parsed.r)}${part(parsed.g)}${part(parsed.b)}`;
}

function parseHexRgb(value: any): { r: number; g: number; b: number } | null {
    const text = String(value || '').trim();
    const match = /^#?([0-9a-f]{6})$/i.exec(text);
    if (!match) return null;
    const hex = match[1];
    return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
    };
}

function resolveVectorizePreviewFill(fillColor: any): string {
    if (fillColor === 'magenta') return '#ff00ff';
    if (fillColor === 'white') return '#ffffff';
    return '#000000';
}

function alphaToMask(data: Uint8ClampedArray, width: number, height: number, threshold: number): Uint8Array {
    const mask = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
        mask[i] = data[p + 3] >= threshold ? 1 : 0;
    }
    return mask;
}

function alphaToMaskWithInvert(data: Uint8ClampedArray, width: number, height: number, threshold: number, invert: boolean): Uint8Array {
    const mask = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
        const on = data[p + 3] >= threshold;
        mask[i] = (invert ? !on : on) ? 1 : 0;
    }
    return mask;
}

function luminanceToMask(data: Uint8ClampedArray, width: number, height: number, threshold: number, invert: boolean): Uint8Array {
    const mask = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
        if (data[p + 3] < 8) {
            mask[i] = 0;
            continue;
        }
        const lum = data[p] * 0.2126 + data[p + 1] * 0.7152 + data[p + 2] * 0.0722;
        const on = lum < threshold;
        mask[i] = (invert ? !on : on) ? 1 : 0;
    }
    return mask;
}

function vectorizeImageData(image: ImageData, params: Record<string, any>): {
    success: true;
    svgCode: string;
    regions: number;
    pixels: number;
} | {
    success: false;
    error: string;
} {
    const workingImage = prepareVectorizeInputImage(image, params);
    const traceMode = String(params.traceMode || 'single');
    const threshold = clampNumber(Number(params.strokeDetail ?? params.autoThreshold ?? params.threshold ?? 198), 1, 254);
    const invert = params.invert === true || params.invert === 'true';
    const source = String(params.source || 'alpha');
    const speckleRaw = traceMode === 'multi' ? params.filterSpeckle : (params.turdsize ?? params.autoFilterSize);
    const speckle = Math.max(0, Math.round(Number(speckleRaw ?? params.speckle ?? 16) || 0));
    const simplify = clampNumber(Number(params.opttolerance ?? params.simplify ?? 2), 0, 30);
    const smooth = params.optcurve !== false && params.optcurve !== 'false' && params.smoothResult !== false && params.smoothResult !== 'false';
    const mask = source === 'luminance'
        ? luminanceToMask(workingImage.data, workingImage.width, workingImage.height, threshold, invert)
        : alphaToMaskWithInvert(workingImage.data, workingImage.width, workingImage.height, threshold, invert);

    const maskPixels = countMaskPixels(mask);
    if (maskPixels === 0) {
        return { success: false, error: `没有检测到可矢量化区域。导出尺寸：${workingImage.width}x${workingImage.height}` };
    }

    const components = extractVectorComponents(mask, workingImage, speckle, simplify, smooth, String(params.fillColor || 'black'));
    if (!components.length) {
        return { success: false, error: `没有保留下来的矢量区域。可以降低“去噪面积”。原始像素：${maskPixels}` };
    }

    return {
        success: true,
        svgCode: buildVectorSvg(workingImage.width, workingImage.height, components, smooth),
        regions: components.length,
        pixels: maskPixels,
    };
}

function countMaskPixels(mask: Uint8Array): number {
    let count = 0;
    for (let i = 0; i < mask.length; i++) count += mask[i];
    return count;
}

function extractVectorComponents(
    mask: Uint8Array,
    image: ImageData,
    minArea: number,
    simplify: number,
    smooth: boolean,
    fillMode: string
): VectorComponent[] {
    const remaining = new Uint8Array(mask);
    const components: VectorComponent[] = [];
    const maxComponents = 256;

    for (let i = 0; i < maxComponents; i++) {
        const component = largestComponentMask(remaining, image.width, image.height);
        const area = countMaskPixels(component);
        if (area <= 0) break;

        for (let p = 0; p < remaining.length; p++) {
            if (component[p]) remaining[p] = 0;
        }

        if (area < minArea) continue;
        let contour = traceLargestContour(component, image.width, image.height);
        if (contour.length < 3) contour = boundingBoxContour(component, image.width, image.height);
        if (contour.length < 3) continue;
        contour = simplify > 0 ? simplifyClosedPolyline(contour, simplify) : contour;
        contour = reducePointCount(contour, 2400);
        components.push({
            contour,
            fill: resolveVectorFill(fillMode, image, component),
        });
    }

    return components;
}

function resolveVectorFill(fillMode: string, image: ImageData, mask: Uint8Array): string {
    if (fillMode === 'magenta') return '#E6007E';
    if (fillMode !== 'original') return '#000000';

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
        if (!mask[i] || image.data[p + 3] < 8) continue;
        r += image.data[p];
        g += image.data[p + 1];
        b += image.data[p + 2];
        count += 1;
    }
    if (!count) return '#000000';
    return rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (value: number) => clampNumber(value, 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function buildVectorSvg(width: number, height: number, components: VectorComponent[], smooth: boolean): string {
    const paths = components
        .sort((a, b) => Math.abs(polygonArea(b.contour)) - Math.abs(polygonArea(a.contour)))
        .map((component) => `<path d="${pointsToSvgPath(component.contour, smooth)}" fill="${component.fill}" fill-rule="evenodd"/>`)
        .join('');
    const boundsMarker = `<rect id="__hopeflow_vector_bounds__" x="0" y="0" width="${width}" height="${height}" fill="#FFFFFF" opacity="0.001"/>`;
    return `<svg version="1.1" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${boundsMarker}${paths}</svg>`;
}

function pointsToSvgPath(points: Point2D[], smooth: boolean): string {
    if (!points.length) return '';
    const fmt = (value: number) => Number.isFinite(value) ? Number(value.toFixed(3)).toString() : '0';
    let path = `M${fmt(points[0][0])} ${fmt(points[0][1])}`;
    if (smooth && points.length >= 4) {
        for (let i = 0; i < points.length; i++) {
            const p0 = points[(i - 1 + points.length) % points.length];
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const p3 = points[(i + 2) % points.length];
            const c1: Point2D = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
            const c2: Point2D = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
            path += ` C${fmt(c1[0])} ${fmt(c1[1])},${fmt(c2[0])} ${fmt(c2[1])},${fmt(p2[0])} ${fmt(p2[1])}`;
        }
    } else {
        for (let i = 1; i < points.length; i++) path += ` L${fmt(points[i][0])} ${fmt(points[i][1])}`;
    }
    return `${path} Z`;
}

function decodeImageContourPreviews(filePath: string): ImageContourPreview[] {
    const fs = require('fs') as typeof import('fs');
    const UTIF = require('../../lib/utif.js');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const bytes = new Uint8Array(arrayBuffer);
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    let data: Uint8Array | Uint8ClampedArray;
    let width = 0;
    let height = 0;

    if (ext === 'jpg' || ext === 'jpeg') {
        const parser = new UTIF.JpegDecoder();
        parser.parse(bytes);
        width = parser.width;
        height = parser.height;
        data = parser.getData({ width, height, forceRGB: true, isSourcePDF: false });
    } else if (ext === 'tif' || ext === 'tiff') {
        const ifds = UTIF.decode(arrayBuffer);
        if (!ifds || !ifds.length) throw new Error('UTIF 没有解析到 TIFF 页面');
        const page = ifds[0];
        UTIF.decodeImage(arrayBuffer, page, ifds);
        width = page.width;
        height = page.height;
        data = UTIF.toRGBA8(page);
    } else {
        throw new Error('当前只支持 JPG/TIF/TIFF 临时图');
    }

    return buildRecommendedImageContourPreviews(data, width, height);
}

function buildRecommendedImageContourPreviews(data: Uint8Array | Uint8ClampedArray, width: number, height: number): ImageContourPreview[] {
    const channels = Math.max(1, Math.round(data.length / Math.max(1, width * height)));
    const nonWhite = imageRgbMaskFromData(data, width, height, channels, 'nonWhite');
    const dark = imageRgbMaskFromData(data, width, height, channels, 'dark');
    const bright = imageRgbMaskFromData(data, width, height, channels, 'bright');
    const filled = fillImageMaskHoles(nonWhite, width, height);
    const combined = mergeImageMasks(filled, dark);
    const full = new Uint8Array(width * height);
    full.fill(1);

    return [
        { key: 'default', name: '默认样式', url: imageMaskToPreviewUrl(nonWhite, width, height), mask: nonWhite, width, height },
        { key: 'filled', name: '填充镂空', url: imageMaskToPreviewUrl(filled, width, height), mask: filled, width, height },
        { key: 'full', name: '全画面', url: imageMaskToPreviewUrl(full, width, height), mask: full, width, height },
        { key: 'bright', name: '亮色', url: imageMaskToPreviewUrl(bright, width, height), mask: bright, width, height },
        { key: 'dark', name: '暗色', url: imageMaskToPreviewUrl(dark, width, height), mask: dark, width, height },
        { key: 'combined', name: '组合', url: imageMaskToPreviewUrl(combined, width, height), mask: combined, width, height },
    ];
}

function imageRgbMaskFromData(
    data: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    channels: number,
    mode: 'nonWhite' | 'dark' | 'bright'
): Uint8Array {
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < mask.length; i++) {
        const src = i * channels;
        const r = data[src] ?? 0;
        const g = data[src + Math.min(1, channels - 1)] ?? r;
        const b = data[src + Math.min(2, channels - 1)] ?? r;
        const lum = r * 0.2126 + g * 0.7152 + b * 0.0722;
        if (mode === 'nonWhite') mask[i] = (r < 250 || g < 250 || b < 250) ? 1 : 0;
        else if (mode === 'dark') mask[i] = lum < 96 ? 1 : 0;
        else mask[i] = (r < 245 || g < 245 || b < 245) && lum >= 96 ? 1 : 0;
    }
    return mask;
}

function fillImageMaskHoles(mask: Uint8Array, width: number, height: number): Uint8Array {
    const outside = new Uint8Array(mask.length);
    const queue = new Int32Array(mask.length);
    let head = 0;
    let tail = 0;
    const push = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const index = y * width + x;
        if (mask[index] || outside[index]) return;
        outside[index] = 1;
        queue[tail++] = index;
    };
    for (let x = 0; x < width; x++) {
        push(x, 0);
        push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        push(0, y);
        push(width - 1, y);
    }
    while (head < tail) {
        const index = queue[head++];
        const x = index % width;
        const y = Math.floor(index / width);
        push(x + 1, y);
        push(x - 1, y);
        push(x, y + 1);
        push(x, y - 1);
    }
    const filled = new Uint8Array(mask.length);
    for (let i = 0; i < mask.length; i++) filled[i] = mask[i] || !outside[i] ? 1 : 0;
    return filled;
}

function mergeImageMasks(a: Uint8Array, b: Uint8Array): Uint8Array {
    const out = new Uint8Array(Math.min(a.length, b.length));
    for (let i = 0; i < out.length; i++) out[i] = a[i] || b[i] ? 1 : 0;
    return out;
}

function imageMaskToPreviewUrl(mask: Uint8Array, width: number, height: number): string {
    const maxSide = 360;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const image = ctx.createImageData(outW, outH);
    for (let y = 0; y < outH; y++) {
        const sy = Math.min(height - 1, Math.floor(y / scale));
        for (let x = 0; x < outW; x++) {
            const sx = Math.min(width - 1, Math.floor(x / scale));
            const src = sy * width + sx;
            const dst = (y * outW + x) * 4;
            const v = mask[src] ? 0 : 255;
            image.data[dst] = v;
            image.data[dst + 1] = v;
            image.data[dst + 2] = v;
            image.data[dst + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
}

function morphology(mask: Uint8Array, width: number, height: number, radius: number, mode: 'dilate' | 'erode'): Uint8Array {
    if (radius <= 0) return mask;
    const horizontal = new Uint8Array(width * height);
    const output = new Uint8Array(width * height);
    const wantAll = mode === 'erode';

    for (let y = 0; y < height; y++) {
        const prefix = new Int32Array(width + 1);
        for (let x = 0; x < width; x++) prefix[x + 1] = prefix[x] + mask[y * width + x];
        for (let x = 0; x < width; x++) {
            const left = Math.max(0, x - radius);
            const right = Math.min(width - 1, x + radius);
            const count = prefix[right + 1] - prefix[left];
            horizontal[y * width + x] = wantAll ? (count === right - left + 1 ? 1 : 0) : (count > 0 ? 1 : 0);
        }
    }

    for (let x = 0; x < width; x++) {
        const prefix = new Int32Array(height + 1);
        for (let y = 0; y < height; y++) prefix[y + 1] = prefix[y] + horizontal[y * width + x];
        for (let y = 0; y < height; y++) {
            const top = Math.max(0, y - radius);
            const bottom = Math.min(height - 1, y + radius);
            const count = prefix[bottom + 1] - prefix[top];
            output[y * width + x] = wantAll ? (count === bottom - top + 1 ? 1 : 0) : (count > 0 ? 1 : 0);
        }
    }

    return output;
}

function traceLargestContour(mask: Uint8Array, width: number, height: number): Point2D[] {
    const component = largestComponentMask(mask, width, height);
    const dirs: Point2D[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    const isOn = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && component[y * width + x] === 1;
    const isBoundary = (x: number, y: number) => {
        if (!isOn(x, y)) return false;
        return !isOn(x - 1, y) || !isOn(x + 1, y) || !isOn(x, y - 1) || !isOn(x, y + 1);
    };

    let sx = -1;
    let sy = -1;
    for (let y = 0; y < height && sy < 0; y++) {
        for (let x = 0; x < width; x++) {
            if (isBoundary(x, y)) {
                sx = x;
                sy = y;
                break;
            }
        }
    }
    if (sx < 0 || sy < 0) return [];

    let px = sx;
    let py = sy;
    let bx = sx - 1;
    let by = sy;
    const contour: Point2D[] = [];
    const maxSteps = Math.max(width * height * 4, 1000);

    for (let steps = 0; steps < maxSteps; steps++) {
        contour.push([px + 0.5, py + 0.5]);

        const backDir = directionIndex(bx - px, by - py);
        let found = false;
        let nextX = px;
        let nextY = py;
        let nextBackX = bx;
        let nextBackY = by;

        for (let i = 0; i < 8; i++) {
            const dirIndex = (backDir + i) % 8;
            const dx = dirs[dirIndex][0];
            const dy = dirs[dirIndex][1];
            const cx = px + dx;
            const cy = py + dy;
            if (!isOn(cx, cy)) continue;

            const prevDir = (dirIndex + 7) % 8;
            nextX = cx;
            nextY = cy;
            nextBackX = px + dirs[prevDir][0];
            nextBackY = py + dirs[prevDir][1];
            found = true;
            break;
        }

        if (!found) break;
        px = nextX;
        py = nextY;
        bx = nextBackX;
        by = nextBackY;

        if (px === sx && py === sy && contour.length > 2) break;
    }

    return contour.length >= 3 ? contour : [];
}

function largestComponentMask(mask: Uint8Array, width: number, height: number): Uint8Array {
    const visited = new Uint8Array(mask.length);
    const best = new Uint8Array(mask.length);
    const queue = new Int32Array(mask.length);
    const dirs: Point2D[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    let bestPixels: number[] = [];

    for (let start = 0; start < mask.length; start++) {
        if (!mask[start] || visited[start]) continue;
        let head = 0;
        let tail = 0;
        const pixels: number[] = [];
        queue[tail++] = start;
        visited[start] = 1;

        while (head < tail) {
            const idx = queue[head++];
            pixels.push(idx);
            const x = idx % width;
            const y = Math.floor(idx / width);
            for (const [dx, dy] of dirs) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                const ni = ny * width + nx;
                if (!mask[ni] || visited[ni]) continue;
                visited[ni] = 1;
                queue[tail++] = ni;
            }
        }

        if (pixels.length > bestPixels.length) bestPixels = pixels;
    }

    for (const idx of bestPixels) best[idx] = 1;
    return best;
}

function directionIndex(dx: number, dy: number): number {
    if (dx === 1 && dy === 0) return 0;
    if (dx === 1 && dy === 1) return 1;
    if (dx === 0 && dy === 1) return 2;
    if (dx === -1 && dy === 1) return 3;
    if (dx === -1 && dy === 0) return 4;
    if (dx === -1 && dy === -1) return 5;
    if (dx === 0 && dy === -1) return 6;
    return 7;
}

function boundingBoxContour(mask: Uint8Array, width: number, height: number): Point2D[] {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!mask[y * width + x]) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + 1);
            maxY = Math.max(maxY, y + 1);
        }
    }
    if (maxX <= minX || maxY <= minY) return [];
    return [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]];
}

function polygonArea(points: Point2D[]): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        area += a[0] * b[1] - b[0] * a[1];
    }
    return area / 2;
}

function simplifyClosedPolyline(points: Point2D[], tolerance: number): Point2D[] {
    if (points.length <= 4 || tolerance <= 0) return points;
    const startIndex = points.reduce((best, point, index) => {
        const bestPoint = points[best];
        return point[0] < bestPoint[0] || (point[0] === bestPoint[0] && point[1] < bestPoint[1]) ? index : best;
    }, 0);
    const rotated = points.slice(startIndex).concat(points.slice(0, startIndex));
    const open = rotated.concat([rotated[0]]);
    const simplified = simplifyPolyline(open, tolerance);
    if (simplified.length > 1) simplified.pop();
    return simplified.length >= 3 ? simplified : points;
}

function simplifyPolyline(points: Point2D[], tolerance: number): Point2D[] {
    if (points.length <= 2) return points;
    const keep = new Uint8Array(points.length);
    keep[0] = 1;
    keep[points.length - 1] = 1;
    const stack: Array<[number, number]> = [[0, points.length - 1]];
    const toleranceSq = tolerance * tolerance;

    while (stack.length) {
        const [start, end] = stack.pop()!;
        let maxDist = 0;
        let index = -1;
        for (let i = start + 1; i < end; i++) {
            const dist = pointLineDistanceSq(points[i], points[start], points[end]);
            if (dist > maxDist) {
                maxDist = dist;
                index = i;
            }
        }
        if (index >= 0 && maxDist > toleranceSq) {
            keep[index] = 1;
            stack.push([start, index], [index, end]);
        }
    }

    return points.filter((_, index) => keep[index]);
}

function pointLineDistanceSq(point: Point2D, start: Point2D, end: Point2D): number {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    if (dx === 0 && dy === 0) {
        const px = point[0] - start[0];
        const py = point[1] - start[1];
        return px * px + py * py;
    }
    const t = clampNumber(((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy), 0, 1);
    const x = start[0] + t * dx;
    const y = start[1] + t * dy;
    const px = point[0] - x;
    const py = point[1] - y;
    return px * px + py * py;
}

function reducePointCount(points: Point2D[], maxPoints: number): Point2D[] {
    if (points.length <= maxPoints) return points;
    const step = Math.ceil(points.length / maxPoints);
    return points.filter((_, index) => index % step === 0);
}

function pixelToDocumentPoint(x: number, y: number, width: number, height: number, bounds: [number, number, number, number]): Point2D {
    const left = bounds[0];
    const top = bounds[1];
    const right = bounds[2];
    const bottom = bounds[3];
    return [
        left + (x / width) * (right - left),
        top - (y / height) * (top - bottom),
    ];
}

function splitPaletteEntries(input: string): string[] {
    const entries: string[] = [];
    let buffer = '';
    let depth = 0;

    const push = () => {
        const cleaned = buffer.trim();
        if (cleaned) entries.push(cleaned);
        buffer = '';
    };

    for (const ch of String(input || '')) {
        if (ch === '(') {
            depth++;
            buffer += ch;
            continue;
        }
        if (ch === ')') {
            depth = Math.max(0, depth - 1);
            buffer += ch;
            continue;
        }
        if ((ch === '\n' || ch === '\r' || ch === ';' || ch === '；' || ch === ',') && depth === 0) {
            push();
            continue;
        }
        buffer += ch;
    }

    push();
    return entries;
}

function renderParamInput(
    param: any,
    params: Record<string, any>,
    setParams: React.Dispatch<React.SetStateAction<Record<string, any>>>
) {
    const value = params[param.name] ?? param.default ?? '';

    const handleChange = (newValue: any) => {
        setParams((prev) => ({ ...prev, [param.name]: newValue }));
    };

    switch (param.type) {
        case 'number':
            return (
                <input
                    type="number"
                    className="input"
                    value={value}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    onChange={(e) => handleChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
            );

        case 'range':
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <input
                        type="range"
                        min={param.min ?? 0}
                        max={param.max ?? 100}
                        step={param.step ?? 1}
                        value={value}
                        onChange={(e) => handleChange(parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', minWidth: '32px', textAlign: 'right' }}>
                        {value}{param.suffix ?? ''}
                    </span>
                </div>
            );

        case 'boolean':
            return (
                <span style={chipStyle(value)} onClick={() => handleChange(!value)}>
                    {value ? '是' : '否'}
                </span>
            );

        case 'select':
            return (
                <select
                    className="select"
                    value={value}
                    onChange={(e) => {
                        handleChange(e.target.value);
                    }}
                >
                    {param.options?.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );

        case 'textarea':
            return (
                <textarea
                    className="input"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    style={{ minHeight: '80px', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical' }}
                />
            );

        case 'string':
        default:
            return (
                <CompositionInput
                    type="text"
                    className="input"
                    value={value}
                    onChange={(e: any) => handleChange(e.target.value)}
                />
            );
    }
}
