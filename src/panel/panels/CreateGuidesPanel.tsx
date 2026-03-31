import React from 'react';
import { SuccessButton } from '../components/SuccessButton';
import { ScriptPanelProps, chipStyle } from './types';

export const CreateGuidesPanel: React.FC<ScriptPanelProps> = ({
    params, setParams, isExecuting, onRun, onError, onSuccess,
}) => {
    const gp = (k: string, def: any) => params['_g_' + k] ?? def;
    const sp = (k: string, v: any) => setParams(p => ({ ...p, ['_g_' + k]: v }));

    const marginLinked = gp('marginLinked', true);
    const handleMarginChange = (key: string, val: string) => {
        if (marginLinked) {
            setParams(p => ({ ...p, _g_mT: val, _g_mB: val, _g_mL: val, _g_mR: val }));
        } else {
            sp(key, val);
        }
    };

    const runGuide = async (modeArgs: Record<string, any>) => {
        onError(null);
        const result = await onRun({ ...modeArgs, allArtboards: gp('allAb', false) });
        if (!result.success) onError(result.error || '执行失败');
        else onSuccess();
    };

    const handleGenerate = () => runGuide({
        mode: 'layout',
        colEnabled: gp('colOn', true), cols: gp('cols', '3'), colGutter: gp('colGut', '0'),
        rowEnabled: gp('rowOn', false), rows: gp('rows', '3'), rowGutter: gp('rowGut', '0'),
        marginTop: gp('mT', ''), marginBottom: gp('mB', ''),
        marginLeft: gp('mL', ''), marginRight: gp('mR', ''),
        bleed: gp('bleed', ''),
        centerCols: gp('center', false),
        clearExisting: gp('clearOld', false),
    });

    const inpSt: React.CSSProperties = { height: '26px', fontSize: '12px' };
    const secSt: React.CSSProperties = {
        padding: '8px', background: 'var(--color-bg-tertiary)',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
    };
    const lblSt: React.CSSProperties = { fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' };

    return (
        <div className="flex flex-col gap-sm" style={{ fontSize: '12px' }}>
            {/* Scope */}
            <div style={{ display: 'flex', gap: '4px' }}>
                <span style={chipStyle(!gp('allAb', false))} onClick={() => sp('allAb', false)}>当前画板</span>
                <span style={chipStyle(gp('allAb', false))} onClick={() => sp('allAb', true)}>所有画板</span>
            </div>

            {/* Columns / Rows */}
            <div style={{ ...secSt, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ ...chipStyle(gp('colOn', true)), alignSelf: 'flex-start' }}
                        onClick={() => sp('colOn', !gp('colOn', true))}>
                        列
                    </span>
                    <div style={{ opacity: gp('colOn', true) ? 1 : 0.4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                            <span style={lblSt}>数字</span>
                            <input type="number" className="input" style={{ ...inpSt, flex: 1, minWidth: 0 }}
                                value={gp('cols', '3')} min={1}
                                disabled={!gp('colOn', true)}
                                onChange={e => sp('cols', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={lblSt}>装订线</span>
                            <input type="number" className="input" style={{ ...inpSt, flex: 1, minWidth: 0 }}
                                placeholder="0" value={gp('colGut', '')} min={0}
                                disabled={!gp('colOn', true)}
                                onChange={e => sp('colGut', e.target.value)} />
                        </div>
                    </div>
                </div>
                {/* Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ ...chipStyle(gp('rowOn', false)), alignSelf: 'flex-start' }}
                        onClick={() => sp('rowOn', !gp('rowOn', false))}>
                        行
                    </span>
                    <div style={{ opacity: gp('rowOn', false) ? 1 : 0.4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                            <span style={lblSt}>数字</span>
                            <input type="number" className="input" style={{ ...inpSt, flex: 1, minWidth: 0 }}
                                value={gp('rows', '3')} min={1}
                                disabled={!gp('rowOn', false)}
                                onChange={e => sp('rows', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={lblSt}>装订线</span>
                            <input type="number" className="input" style={{ ...inpSt, flex: 1, minWidth: 0 }}
                                placeholder="0" value={gp('rowGut', '')} min={0}
                                disabled={!gp('rowOn', false)}
                                onChange={e => sp('rowGut', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Margin */}
            <div style={{ ...secSt, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={lblSt}>边距 (mm)</span>
                    <button
                        onClick={() => sp('marginLinked', !marginLinked)}
                        title={marginLinked ? '点击解锁：单独设置各边距' : '点击锁定：同步设置所有边距'}
                        style={{
                            background: 'none', border: 'none', padding: '2px', cursor: 'pointer',
                            color: marginLinked ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                            display: 'flex', alignItems: 'center', transition: 'color 0.15s ease',
                        }}
                    >
                        {marginLinked ? (
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-1.76 3.82" />
                                <path d="M9 17H6a5 5 0 0 1-5-5 5 5 0 0 1 1.76-3.82" />
                                <line x1="2" y1="2" x2="22" y2="22" />
                            </svg>
                        )}
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                    {([
                        { k: 'mT', label: '上' }, { k: 'mB', label: '下' },
                        { k: 'mL', label: '左' }, { k: 'mR', label: '右' },
                    ] as const).map(m => (
                        <div key={m.k} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{m.label}</span>
                            <input type="number" className="input" style={{ ...inpSt, width: '100%' }}
                                placeholder="0" value={gp(m.k, '')} min={0}
                                onChange={e => handleMarginChange(m.k, e.target.value)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Bleed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={lblSt}>出血</span>
                <input type="number" className="input" style={{ ...inpSt, flex: 1, minWidth: 0 }}
                    placeholder="0" value={gp('bleed', '')} min={0}
                    onChange={e => sp('bleed', e.target.value)} />
                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>mm</span>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <span style={chipStyle(gp('center', false))} onClick={() => sp('center', !gp('center', false))}>居中</span>
                <span style={chipStyle(gp('clearOld', false))} onClick={() => sp('clearOld', !gp('clearOld', false))}>清除现有参考线</span>
            </div>

            {/* Generate */}
            <SuccessButton className="btn btn-primary" disabled={isExecuting}
                style={{ width: '100%' }} onClick={handleGenerate}>
                {isExecuting ? <><span className="spinner" /> 生成中...</> : '生成参考线'}
            </SuccessButton>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <SuccessButton className="btn btn-sm" disabled={isExecuting}
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                    onClick={() => runGuide({ mode: 'center' })}>
                    居中线
                </SuccessButton>
                <SuccessButton className="btn btn-sm" disabled={isExecuting}
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-error)' }}
                    onClick={() => runGuide({ mode: 'clear' })}>
                    清除全部
                </SuccessButton>
            </div>
        </div>
    );
};
