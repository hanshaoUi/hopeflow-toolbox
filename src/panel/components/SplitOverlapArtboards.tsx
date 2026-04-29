import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getBridge } from '@bridge';

interface SplitSegmentInfo {
    index: number;
    name: string;
    startMM: number;
    endMM: number;
    widthMM: number;
    overlapLeftMM: number;
    overlapRightMM: number;
}

interface SplitPreviewInfo {
    sourceName: string;
    direction: 'vertical' | 'horizontal';
    scaleRatio: number;
    artboardDocWidthMM: number;
    artboardDocHeightMM: number;
    artboardWidthMM: number;
    artboardHeightMM: number;
    tileCount: number;
    stepMM: number;
    tileSizeMM: number;
    overlapMM: number;
    bleedMM: number;
    marginMM: number;
    lastTileDocWidthMM: number;
    lastTileWidthMM: number;
    outputDocWidthMM: number;
    outputDocHeightMM: number;
    outputWidthMM: number;
    outputHeightMM: number;
    segments: SplitSegmentInfo[];
}

const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
    border: '1px solid ' + (active ? 'var(--color-accent)' : 'var(--color-border)'),
    color: active ? '#fff' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.15s ease',
    userSelect: 'none',
});

const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
};

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

export const SplitOverlapArtboards: React.FC = () => {
    const [direction, setDirection] = useState<'vertical' | 'horizontal'>('vertical');
    const [scale, setScale] = useState(1);
    const [tileSize, setTileSize] = useState(1182);
    const [overlap, setOverlap] = useState(25);
    const [bleed, setBleed] = useState(0);
    const [margin, setMargin] = useState(0);
    const [clearGenerated, setClearGenerated] = useState(true);
    const [namePattern, setNamePattern] = useState('');
    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');
    const [startNum, setStartNum] = useState(1);
    const [includeSize, setIncludeSize] = useState(true);
    const [sizeUnit, setSizeUnit] = useState<'mm' | 'cm' | 'pt' | 'px' | 'in'>('mm');
    const [info, setInfo] = useState<SplitPreviewInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const params = useMemo(
        () => ({
            direction,
            scale,
            tileSize,
            overlap,
            bleed,
            margin,
            clearGenerated,
            namePattern,
            prefix,
            suffix,
            startNum,
            includeSize,
            sizeUnit,
        }),
        [bleed, clearGenerated, direction, includeSize, margin, namePattern, overlap, prefix, scale, sizeUnit, startNum, suffix, tileSize]
    );

    const runScript = useCallback(async (mode: 'preview' | 'create' | 'clear-preview' | 'clear-generated') => {
        const bridge = await getBridge();
        return bridge.executeScript({
            scriptId: 'split-overlap-artboards',
            scriptPath: './src/scripts/export/split-overlap-artboards.jsx',
            args: {
                mode,
                ...params,
            },
        });
    }, [params]);

    const preview = useCallback(async () => {
        if (scale <= 0) {
            setInfo(null);
            setError('比例必须大于 0');
            try {
                await runScript('clear-preview');
            } catch (e) {}
            return;
        }
        if (tileSize <= 0) {
            setInfo(null);
            setError('单片尺寸必须大于 0');
            try {
                await runScript('clear-preview');
            } catch (e) {}
            return;
        }
        if (overlap < 0) {
            setInfo(null);
            setError('搭接不能小于 0');
            try {
                await runScript('clear-preview');
            } catch (e) {}
            return;
        }
        if (overlap >= tileSize) {
            setInfo(null);
            setError('搭接必须小于单片尺寸');
            try {
                await runScript('clear-preview');
            } catch (e) {}
            return;
        }

        setIsPreviewing(true);
        setError(null);
        try {
            const result = await runScript('preview');
            if (result.success && result.data) {
                setInfo(result.data as SplitPreviewInfo);
            } else {
                setInfo(null);
                setError(result.error || '预览失败');
            }
        } catch (e: any) {
            setInfo(null);
            setError(e.message || '预览失败');
        } finally {
            setIsPreviewing(false);
        }
    }, [overlap, runScript, scale, tileSize]);

    useEffect(() => {
        const timer = setTimeout(() => {
            preview();
        }, 250);
        return () => clearTimeout(timer);
    }, [preview]);

    useEffect(() => {
        return () => {
            getBridge()
                .then((bridge) => bridge.executeScript({
                    scriptId: 'split-overlap-artboards',
                    scriptPath: './src/scripts/export/split-overlap-artboards.jsx',
                    args: { mode: 'clear-preview' },
                }))
                .catch(() => undefined);
        };
    }, []);

    const handleCreate = async () => {
        setIsCreating(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await runScript('create');
            if (result.success && result.data) {
                const data = result.data as { created: number; removed: number };
                setSuccess(
                    data.removed > 0
                        ? `已生成 ${data.created} 个分片画板，并清理 ${data.removed} 个旧画板`
                        : `已生成 ${data.created} 个分片画板`
                );
                await preview();
            } else {
                setError(result.error || '生成画板失败');
            }
        } catch (e: any) {
            setError(e.message || '生成画板失败');
        } finally {
            setIsCreating(false);
        }
    };

    const handleClearPreview = async () => {
        setError(null);
        try {
            await runScript('clear-preview');
        } catch (e: any) {
            setError(e.message || '清除预览失败');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
                <span style={chipStyle(direction === 'vertical')} onClick={() => setDirection('vertical')}>
                    纵切
                </span>
                <span style={chipStyle(direction === 'horizontal')} onClick={() => setDirection('horizontal')}>
                    横切
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px' }}>
                <div style={fieldStyle}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>比例 (1:X)</label>
                    <input
                        type="number"
                        className="input"
                        value={scale}
                        min={0.01}
                        step={0.01}
                        onChange={(e) => setScale(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                </div>
                <div style={fieldStyle}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>单片固定尺寸 (mm)</label>
                    <input
                        type="number"
                        className="input"
                        value={tileSize}
                        min={1}
                        onChange={(e) => setTileSize(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                </div>
                <div style={fieldStyle}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>搭接 (mm)</label>
                    <input
                        type="number"
                        className="input"
                        value={overlap}
                        min={0}
                        onChange={(e) => setOverlap(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                </div>
                <div style={fieldStyle}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>出血 (mm)</label>
                    <input
                        type="number"
                        className="input"
                        value={bleed}
                        min={0}
                        onChange={(e) => setBleed(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                </div>
                <div style={fieldStyle}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>四周留白 (mm)</label>
                    <input
                        type="number"
                        className="input"
                        value={margin}
                        min={0}
                        onChange={(e) => setMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <span style={chipStyle(clearGenerated)} onClick={() => setClearGenerated((value) => !value)}>
                    生成后清理旧画板
                </span>
            </div>

            <div
                style={{
                    padding: '8px 10px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}
            >
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    画板命名
                </div>
                <div style={fieldStyle}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>命名模式 (#=序号)</label>
                    <CompositionInput
                        type="text"
                        className="input"
                        value={namePattern}
                        placeholder="留空则使用：当前画板名 [HF-SPLIT] #"
                        onChange={(e: any) => setNamePattern(e.target.value)}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px' }}>
                    <div style={fieldStyle}>
                        <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>前缀</label>
                        <CompositionInput
                            type="text"
                            className="input"
                            value={prefix}
                            placeholder="可选"
                            onChange={(e: any) => setPrefix(e.target.value)}
                        />
                    </div>
                    <div style={fieldStyle}>
                        <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>后缀</label>
                        <CompositionInput
                            type="text"
                            className="input"
                            value={suffix}
                            placeholder="可选"
                            onChange={(e: any) => setSuffix(e.target.value)}
                        />
                    </div>
                    <div style={fieldStyle}>
                        <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>起始编号</label>
                        <input
                            type="number"
                            className="input"
                            value={startNum}
                            min={0}
                            onChange={(e) => setStartNum(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        />
                    </div>
                    <div style={fieldStyle}>
                        <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>尺寸后缀</label>
                        <select
                            className="select"
                            value={includeSize ? sizeUnit : 'none'}
                            onChange={(e) => {
                                const value = e.target.value as 'none' | 'mm' | 'cm' | 'pt' | 'px' | 'in';
                                if (value === 'none') {
                                    setIncludeSize(false);
                                } else {
                                    setIncludeSize(true);
                                    setSizeUnit(value);
                                }
                            }}
                        >
                            <option value="none">无</option>
                            <option value="mm">mm</option>
                            <option value="cm">cm</option>
                            <option value="pt">pt</option>
                            <option value="px">px</option>
                            <option value="in">in</option>
                        </select>
                    </div>
                </div>
            </div>

            {isPreviewing ? (
                <div style={{ textAlign: 'center', padding: '8px', color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                    <span className="spinner" style={{ marginRight: '6px' }} />
                    正在计算预览...
                </div>
            ) : info ? (
                <div
                    style={{
                        padding: '8px 10px',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>当前画板</div>
                            <div style={{ fontWeight: 500 }}>{info.sourceName}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>文件比例</div>
                            <div style={{ fontWeight: 500 }}>1 : {info.scaleRatio}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>文件尺寸</div>
                            <div style={{ fontWeight: 500 }}>{info.artboardDocWidthMM} × {info.artboardDocHeightMM} mm</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>实际尺寸</div>
                            <div style={{ fontWeight: 500 }}>{info.artboardWidthMM} × {info.artboardHeightMM} mm</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>分片数量</div>
                            <div style={{ fontWeight: 500, color: 'var(--color-accent)' }}>{info.tileCount} 片</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>推进步长</div>
                            <div style={{ fontWeight: 500 }}>{info.stepMM} mm</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>单片文件尺寸</div>
                            <div style={{ fontWeight: 500 }}>{info.outputDocWidthMM} × {info.outputDocHeightMM} mm</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>单片输出尺寸</div>
                            <div style={{ fontWeight: 500 }}>{info.outputWidthMM} × {info.outputHeightMM} mm</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>末片文件宽度</div>
                            <div style={{ fontWeight: 500 }}>{info.lastTileDocWidthMM} mm</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>末片实际宽度</div>
                            <div style={{ fontWeight: 500 }}>{info.lastTileWidthMM} mm</div>
                        </div>
                    </div>

                    <div
                        style={{
                            borderTop: '1px solid var(--color-border)',
                            paddingTop: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            maxHeight: '160px',
                            overflowY: 'auto',
                        }}
                    >
                        {info.segments.map((segment) => (
                            <div
                                key={segment.index}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '48px minmax(0, 1fr)',
                                    gap: '8px',
                                    alignItems: 'start',
                                }}
                            >
                                <span style={{ color: 'var(--color-text-tertiary)' }}>
                                    #{String(segment.index).padStart(2, '0')}
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                    <span
                                        title={segment.name}
                                        style={{
                                            fontWeight: 500,
                                            color: 'var(--color-text-primary)',
                                            lineHeight: 1.35,
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {segment.name}
                                    </span>
                                    <span style={{ color: 'var(--color-text-tertiary)' }}>
                                        {segment.startMM} - {segment.endMM} mm · 左搭 {segment.overlapLeftMM} / 右搭 {segment.overlapRightMM}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {error && (
                <div className="alert alert-error" style={{ fontSize: '11px', padding: '6px 10px' }}>
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{ fontSize: '11px', padding: '6px 10px' }}>
                    {success}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                    className="btn"
                    onClick={handleClearPreview}
                    disabled={isPreviewing || isCreating}
                    style={{
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                    }}
                >
                    清除预览
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleCreate}
                    disabled={isPreviewing || isCreating || !info}
                >
                    {isCreating ? (
                        <>
                            <span className="spinner" /> 生成中...
                        </>
                    ) : (
                        '生成分片画板'
                    )}
                </button>
            </div>
        </div>
    );
};
