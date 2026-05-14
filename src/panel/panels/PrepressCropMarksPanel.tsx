import React from 'react';
import { SuccessButton } from '../components/SuccessButton';
import { ScriptPanelProps, chipStyle } from './types';

const panelStyle: React.CSSProperties = {
    padding: '10px',
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
};

const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
};

const unitStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--color-text-tertiary)',
    minWidth: '18px',
};

const inputStyle: React.CSSProperties = {
    height: '32px',
    fontSize: '13px',
};

function valueOf(params: Record<string, any>, key: string, fallback: any) {
    return params[key] ?? fallback;
}

const Toggle: React.FC<{ active: boolean; label: string; onClick: () => void; disabled?: boolean }> = ({ active, label, onClick, disabled }) => (
    <span
        style={{
            ...chipStyle(active),
            padding: '6px 14px',
            fontSize: '13px',
            opacity: disabled ? 0.45 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
        }}
        onClick={onClick}
    >
        {label}
    </span>
);

const Field: React.FC<{
    label: string;
    value: any;
    unit?: string;
    disabled?: boolean;
    step?: number;
    onChange: (value: string) => void;
}> = ({ label, value, unit, disabled, step = 0.25, onChange }) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        <span style={labelStyle}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
                type="number"
                className="input"
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                value={value}
                step={step}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
            />
            {unit && <span style={unitStyle}>{unit}</span>}
        </div>
    </label>
);

export const PrepressCropMarksPanel: React.FC<ScriptPanelProps> = ({
    params, setParams, isExecuting, onRun, onError, onSuccess,
}) => {
    const get = (key: string, fallback: any) => valueOf(params, key, fallback);
    const set = (key: string, value: any) => setParams((prev) => ({ ...prev, [key]: value }));

    const enabled = get('enabled', true);
    const includeStrokeBounds = get('includeStrokeBounds', false);
    const addRegistration = get('addRegistration', true);
    const registrationCircle = get('registrationCircle', true);
    const addBisectors = get('addBisectors', true);
    const showDots = get('showDots', true);
    const bottomConfusion = get('bottomConfusion', false);

    const run = async () => {
        onError(null);
        const result = await onRun({
            ratio: get('ratio', 1),
            lineType: get('lineType', 'japanese'),
            lineLengthMM: get('lineLengthMM', 6),
            lineBleedMM: get('lineBleedMM', 3),
            lineStrokePt: get('lineStrokePt', 0.25),
            includeStrokeBounds,
            addRegistration: enabled && addRegistration,
            registrationCircle,
            addBisectors: enabled && addBisectors,
            hBisector: get('hBisector', 2),
            vBisector: get('vBisector', 4),
            hBSpaceMM: get('hBSpaceMM', 6),
            vBSpaceMM: get('vBSpaceMM', 6),
            showDots,
            bottomConfusion,
            dotSizeMM: get('dotSizeMM', 1),
            dotTLXMM: get('dotTLXMM', 0),
            dotTLYMM: get('dotTLYMM', 0),
            dotTRXMM: get('dotTRXMM', 0),
            dotTRYMM: get('dotTRYMM', 0),
            dotBRXMM: get('dotBRXMM', 0),
            dotBRYMM: get('dotBRYMM', 0),
            dotBLXMM: get('dotBLXMM', 0),
            dotBLYMM: get('dotBLYMM', 0),
        });
        if (!result.success) onError(result.error || '执行失败');
        else onSuccess();
    };

    return (
        <div className="flex flex-col gap-sm" style={{ fontSize: '13px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Toggle active={enabled} label="印刷裁切线" onClick={() => set('enabled', !enabled)} />
                <Toggle active={includeStrokeBounds} label="包含对象边宽" onClick={() => set('includeStrokeBounds', !includeStrokeBounds)} />
            </div>

            <div style={{ ...panelStyle, opacity: enabled ? 1 : 0.45 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <span style={labelStyle}>角线类型</span>
                    <select className="select" value={get('lineType', 'japanese')} disabled={!enabled} onChange={(e) => set('lineType', e.target.value)} style={{ height: '36px' }}>
                        <option value="japanese">日式</option>
                        <option value="roman">罗马</option>
                        <option value="chinese">中式</option>
                    </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
                    <Field label="出血/边距" value={get('lineBleedMM', 3)} unit="mm" disabled={!enabled} step={0.5} onChange={(v) => set('lineBleedMM', v)} />
                    <Field label="比例" value={get('ratio', 1)} disabled={!enabled} step={1} onChange={(v) => set('ratio', v)} />
                    <Field label="角线长度" value={get('lineLengthMM', 6)} unit="mm" disabled={!enabled} step={0.5} onChange={(v) => set('lineLengthMM', v)} />
                    <Field label="描边" value={get('lineStrokePt', 0.25)} unit="pt" disabled={!enabled} step={0.05} onChange={(v) => set('lineStrokePt', v)} />
                </div>
            </div>

            <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '14px', opacity: enabled ? 1 : 0.45 }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Toggle active={addRegistration} label="套准线" disabled={!enabled} onClick={() => set('addRegistration', !addRegistration)} />
                    <Toggle active={registrationCircle} label="套准带圆" disabled={!enabled || !addRegistration} onClick={() => set('registrationCircle', !registrationCircle)} />
                    <Toggle active={addBisectors} label="等分线" disabled={!enabled} onClick={() => set('addBisectors', !addBisectors)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', opacity: addBisectors ? 1 : 0.45 }}>
                    <Field label="水平数" value={get('hBisector', 2)} disabled={!enabled || !addBisectors} step={1} onChange={(v) => set('hBisector', v)} />
                    <Field label="垂直数" value={get('vBisector', 4)} disabled={!enabled || !addBisectors} step={1} onChange={(v) => set('vBisector', v)} />
                    <Field label="水平切线距" value={get('hBSpaceMM', 6)} unit="mm" disabled={!enabled || !addBisectors} step={0.5} onChange={(v) => set('hBSpaceMM', v)} />
                    <Field label="垂直切线距" value={get('vBSpaceMM', 6)} unit="mm" disabled={!enabled || !addBisectors} step={0.5} onChange={(v) => set('vBSpaceMM', v)} />
                </div>
            </div>

            <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Toggle active={showDots} label="四角圆点" onClick={() => set('showDots', !showDots)} />
                    <Toggle active={bottomConfusion} label="底部混淆" disabled={!showDots} onClick={() => set('bottomConfusion', !bottomConfusion)} />
                </div>
                <Field label="圆点大小" value={get('dotSizeMM', 1)} unit="mm" disabled={!showDots} step={0.5} onChange={(v) => set('dotSizeMM', v)} />

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', opacity: showDots ? 1 : 0.45 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ ...labelStyle, color: 'var(--color-text-primary)' }}>圆点位置偏移</span>
                        <button
                            type="button"
                            className="btn btn-sm"
                            disabled={!showDots}
                            style={{ height: '28px', padding: '0 12px', background: 'var(--color-bg-control)', border: '1px solid var(--color-border)' }}
                            onClick={() => {
                                setParams((prev) => ({
                                    ...prev,
                                    dotTLXMM: 0, dotTLYMM: 0,
                                    dotTRXMM: 0, dotTRYMM: 0,
                                    dotBRXMM: 0, dotBRYMM: 0,
                                    dotBLXMM: 0, dotBLYMM: 0,
                                }));
                            }}
                        >
                            归零
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '74px 1fr 1fr', gap: '8px 10px', alignItems: 'center' }}>
                        {([
                            { label: '左上', x: 'dotTLXMM', y: 'dotTLYMM', dx: 0, dy: 0 },
                            { label: '右上', x: 'dotTRXMM', y: 'dotTRYMM', dx: 0, dy: 0 },
                            { label: '右下', x: 'dotBRXMM', y: 'dotBRYMM', dx: 0, dy: 0 },
                            { label: '左下', x: 'dotBLXMM', y: 'dotBLYMM', dx: 0, dy: 0 },
                        ] as const).map((item) => (
                            <React.Fragment key={item.label}>
                                <span style={{ ...labelStyle, color: 'var(--color-text-primary)' }}>{item.label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={unitStyle}>X</span>
                                    <input type="number" className="input" style={{ ...inputStyle, flex: 1, minWidth: 0 }} value={get(item.x, item.dx)} step={0.5} disabled={!showDots} onChange={(e) => set(item.x, e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={unitStyle}>Y</span>
                                    <input type="number" className="input" style={{ ...inputStyle, flex: 1, minWidth: 0 }} value={get(item.y, item.dy)} step={0.5} disabled={!showDots} onChange={(e) => set(item.y, e.target.value)} />
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                        X 向右为正，Y 向上为正，单位 mm。
                    </div>
                </div>
            </div>

            <SuccessButton className="btn btn-primary" disabled={isExecuting} style={{ width: '100%', height: '38px', fontSize: '14px' }} onClick={run}>
                {isExecuting ? <><span className="spinner" /> 生成中...</> : '生成裁切标记'}
            </SuccessButton>
        </div>
    );
};
