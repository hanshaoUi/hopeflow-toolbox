import React from 'react';
import { SuccessButton } from '../components/SuccessButton';
import { ScriptPanelProps, chipStyle } from './types';

function splitWidths(input: any): string[] {
    const parts = String(input || '')
        .split(/[,:]/)
        .map((item) => item.trim())
        .filter(Boolean);
    return parts.length ? parts : ['100', '200', '100'];
}

function normalizePositive(value: string): string {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return '';
    return String(value);
}

export const BatchDrawRectanglesPanel: React.FC<ScriptPanelProps> = ({
    params, setParams, isExecuting, onRun, onError, onSuccess,
}) => {
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
    const pendingFocusIndex = React.useRef<number | null>(null);
    const values = splitWidths(params.widths);
    const numericValues = values.map((value) => Math.max(0, Number(value) || 0));
    const maxValue = Math.max(...numericValues, 1);

    React.useEffect(() => {
        const index = pendingFocusIndex.current;
        if (index === null) return;
        pendingFocusIndex.current = null;
        const input = inputRefs.current[index];
        input?.focus();
        input?.select();
    }, [values.length]);

    const setWidths = (nextValues: string[]) => {
        setParams((prev) => ({
            ...prev,
            widths: nextValues.map((value) => normalizePositive(value) || '1').join(','),
        }));
    };

    const updateValue = (index: number, value: string) => {
        const next = values.slice();
        next[index] = value;
        setWidths(next);
    };

    const addValue = (focus = true) => {
        const nextValues = [...values, '100'];
        if (focus) pendingFocusIndex.current = nextValues.length - 1;
        setWidths(nextValues);
    };

    const removeValue = (index: number) => {
        if (values.length > 1) setWidths(values.filter((_, i) => i !== index));
    };

    const shouldAppendFromKey = (event: Pick<KeyboardEvent, 'key' | 'code' | 'keyCode' | 'shiftKey'>) => {
        return (
            event.key === 'Enter' ||
            event.key === '+' ||
            event.key === '=' ||
            event.code === 'NumpadAdd' ||
            event.keyCode === 13 ||
            event.keyCode === 107 ||
            event.keyCode === 187
        ) && !event.shiftKey;
    };

    const isLastWidthInputActive = () => {
        return document.activeElement === inputRefs.current[values.length - 1];
    };

    const appendFromShortcut = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
        if (!isLastWidthInputActive()) return;
        event.preventDefault();
        event.stopPropagation();
        addValue(true);
    };

    React.useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const onNativeKeyDown = (event: KeyboardEvent) => {
            if (!root.contains(event.target as Node)) return;
            if (shouldAppendFromKey(event)) appendFromShortcut(event);
        };
        root.addEventListener('keydown', onNativeKeyDown, true);
        return () => root.removeEventListener('keydown', onNativeKeyDown, true);
    }, [values.length, values.join(',')]);

    const handlePanelKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (shouldAppendFromKey(event.nativeEvent)) appendFromShortcut(event);
    };

    const handleValueKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (index === values.length - 1 && shouldAppendFromKey(event.nativeEvent)) appendFromShortcut(event);
    };

    const setParam = (name: string, value: any) => setParams((prev) => ({ ...prev, [name]: value }));

    const run = async () => {
        onError(null);
        const result = await onRun({
            ...params,
            widths: values.map((value) => normalizePositive(value) || '1').join(','),
            strokeWidth: 0,
        });
        if (!result.success) onError(result.error || '执行失败');
        else onSuccess();
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '11px',
        color: 'var(--color-text-secondary)',
        whiteSpace: 'nowrap',
    };
    const sectionStyle: React.CSSProperties = {
        padding: '8px',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
    };
    const inputStyle: React.CSSProperties = { height: '26px', fontSize: '12px' };

    return (
        <div
            ref={rootRef}
            onKeyDownCapture={handlePanelKeyDownCapture}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}
        >
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <span style={chipStyle(true)}>按宽度 mm</span>
                <span style={{ marginLeft: 'auto', ...chipStyle(!!params.filled) }} onClick={() => setParam('filled', !params.filled)}>
                    填充
                </span>
            </div>

            <div style={sectionStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
                    {values.map((value, index) => (
                        <div key={index} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                                ref={(node) => { inputRefs.current[index] = node; }}
                                type="number"
                                className="input"
                                min={0.1}
                                step={1}
                                value={value}
                                onChange={(event) => updateValue(index, event.target.value)}
                                onKeyDown={(event) => handleValueKeyDown(index, event)}
                                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                            />
                            <button
                                type="button"
                                className="btn btn-sm"
                                tabIndex={-1}
                                disabled={values.length <= 1}
                                onClick={() => removeValue(index)}
                                style={{ width: '26px', height: '26px', padding: 0 }}
                                title="删除"
                            >
                                -
                            </button>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                    在最后一个宽度框按 Enter 或 + 可快速添加一块。
                </div>
                <button type="button" className="btn btn-sm" onClick={() => addValue(true)} style={{ marginTop: '6px', width: '100%' }}>
                    添加一块
                </button>
            </div>

            <div style={sectionStyle}>
                <div style={{ display: 'flex', gap: '4px', height: '44px', alignItems: 'stretch' }}>
                    {numericValues.map((value, index) => {
                        const flexValue = Math.max(value / maxValue, 0.08);
                        const label = `${value || 0}mm`;
                        return (
                            <div
                                key={index}
                                title={label}
                                style={{
                                    flex: flexValue,
                                    minWidth: '24px',
                                    border: '1px solid var(--color-border)',
                                    background: index % 2 === 0 ? 'var(--color-accent-soft)' : 'var(--color-bg-control)',
                                    color: 'var(--color-text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {label}
                            </div>
                        );
                    })}
                </div>
                <div style={{ marginTop: '5px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                    预览按各块宽度相对大小展示。
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 10px' }}>
                <label>
                    <div style={labelStyle}>高度 mm</div>
                    <input type="number" className="input" min={0.1} step={1} value={params.height ?? 50}
                        onChange={(e) => setParam('height', e.target.value === '' ? '' : Number(e.target.value))} />
                </label>
                <label>
                    <div style={labelStyle}>列间距 mm</div>
                    <input type="number" className="input" min={0} step={0.5} value={params.gap ?? 5}
                        onChange={(e) => setParam('gap', e.target.value === '' ? '' : Number(e.target.value))} />
                </label>
                <label>
                    <div style={labelStyle}>行数</div>
                    <input type="number" className="input" min={1} step={1} value={params.rows ?? 1}
                        onChange={(e) => setParam('rows', e.target.value === '' ? '' : Number(e.target.value))} />
                </label>
                <label>
                    <div style={labelStyle}>行间距 mm</div>
                    <input type="number" className="input" min={0} step={0.5} value={params.rowGap ?? 5}
                        onChange={(e) => setParam('rowGap', e.target.value === '' ? '' : Number(e.target.value))} />
                </label>
            </div>

            <SuccessButton className="btn btn-primary" onClick={run} disabled={isExecuting} style={{ width: '100%' }}>
                {isExecuting ? <><span className="spinner" /> 绘制中...</> : '绘制无描边矩形'}
            </SuccessButton>
        </div>
    );
};
