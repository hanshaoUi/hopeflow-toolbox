import React, { useState, useCallback } from 'react';
import { getBridge } from '@bridge';

type CmykMode  = 'none' | 'all' | 'custom';
type SpotMode  = 'none' | 'all';
type LabelStyle= 'text' | 'circle' | 'rect';
type LabelLang = 'both' | 'en' | 'zh';
type Direction = 'h' | 'v';
type Order     = 'cmyk-first' | 'spot-first';
type Placement = 'center' | 'topleft' | 'manual';

const SECTION: React.CSSProperties = {
    background: 'var(--color-bg-secondary)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
    marginBottom: '6px',
    border: '1px solid var(--color-border)',
};
const SEC_TITLE: React.CSSProperties = {
    fontSize: '11px', color: 'var(--color-text-tertiary)',
    marginBottom: '8px', letterSpacing: '0.05em',
};
const LBL: React.CSSProperties = {
    fontSize: '11px', color: 'var(--color-text-secondary)',
    marginBottom: '4px', display: 'block',
};
const ROW: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '6px', flexWrap: 'wrap' as const,
};

const radioChip = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', cursor: 'pointer', userSelect: 'none',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
});

const R: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <span style={radioChip(active)} onClick={onClick}>
        <span style={{
            width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
            border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border-hover)'}`,
            background: active ? 'var(--color-accent)' : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
        </span>
        {label}
    </span>
);

const CB: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ label, checked, onChange, disabled }) => (
    <label style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '11px', userSelect: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        color: 'var(--color-text-secondary)',
    }}>
        <input type="checkbox" checked={checked} disabled={disabled}
            onChange={e => onChange(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)', cursor: disabled ? 'not-allowed' : 'pointer' }} />
        {label}
    </label>
);

const Num: React.FC<{ value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; w?: number }> = ({
    value, onChange, min = 0, max = 100, step = 0.5, w = 52,
}) => (
    <input type="number" className="input" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ width: w, textAlign: 'center', padding: '3px 4px', fontSize: '11px' }} />
);

const SEP: React.CSSProperties = { fontSize: '11px', color: 'var(--color-text-secondary)' };

export const ColorSeparatorPanel: React.FC = () => {
    const [cmykMode, setCmykMode] = useState<CmykMode>('all');
    const [cmykC, setCmykC] = useState(true);
    const [cmykM, setCmykM] = useState(true);
    const [cmykY, setCmykY] = useState(true);
    const [cmykK, setCmykK] = useState(true);
    const [labelLang, setLabelLang] = useState<LabelLang>('both');
    const [spotMode, setSpotMode] = useState<SpotMode>('none');
    const [simplifyPantone, setSimplifyPantone] = useState(true);

    const [style, setStyle]         = useState<LabelStyle>('rect');
    const [labelWidth, setW]        = useState(7);
    const [labelHeight, setH]       = useState(5);
    const [cornerRadius, setR]      = useState(1);
    const [direction, setDirection] = useState<Direction>('h');
    const [fontFamily, setFont]     = useState('MicrosoftYaHei');
    const [fontSize, setFontSize]   = useState(3);

    const [order, setOrder]         = useState<Order>('cmyk-first');
    const [placement, setPlacement] = useState<Placement>('center');
    const [autoSelect, setSelect]   = useState(true);
    const [showInkTotal, setTotal]  = useState(false);
    const [convertOL, setOutlines]  = useState(false);

    const [running, setRunning] = useState(false);
    const [msg, setMsg]         = useState<string | null>(null);
    const [err, setErr]         = useState<string | null>(null);

    const handleReset = () => {
        setCmykMode('all'); setCmykC(true); setCmykM(true); setCmykY(true); setCmykK(true);
        setLabelLang('both'); setSpotMode('none'); setSimplifyPantone(true);
        setStyle('rect'); setW(7); setH(5); setR(1); setDirection('h');
        setFont('MicrosoftYaHei'); setFontSize(3);
        setOrder('cmyk-first'); setPlacement('center');
        setSelect(true); setTotal(false); setOutlines(false);
        setMsg(null); setErr(null);
    };

    const handleRun = useCallback(async () => {
        setRunning(true); setMsg(null); setErr(null);
        try {
            const bridge = await getBridge();
            const res = await bridge.executeScript({
                scriptId: 'ai-color-generator',
                scriptPath: './src/scripts/color/ai-color-generator.jsx',
                args: {
                    cmykMode, cmykC, cmykM, cmykY, cmykK, labelLang,
                    spotMode, simplifyPantone,
                    style, labelWidth, labelHeight, cornerRadius, direction,
                    fontFamily, fontSize,
                    order, placement, autoSelect,
                    showInkTotal, convertToOutlines: convertOL,
                },
            });
            if (res.success) setMsg(res.data?.message || '完成');
            else setErr(res.error || '执行失败');
        } catch (e: any) {
            setErr(e.message || '连接失败');
        } finally {
            setRunning(false);
        }
    }, [cmykMode, cmykC, cmykM, cmykY, cmykK, labelLang, spotMode, simplifyPantone,
        style, labelWidth, labelHeight, cornerRadius, direction, fontFamily, fontSize,
        order, placement, autoSelect, showInkTotal, convertOL]);

    const isRect   = style === 'rect';
    const isCircle = style === 'circle';

    return (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* 选色 */}
            <div style={SECTION}>
                <div style={SEC_TITLE}>[ 选色 ]</div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    {/* CMYK */}
                    <div style={{ flex: 1 }}>
                        <div style={LBL}>CMYK 四原色</div>
                        <div style={{ ...ROW, marginBottom: '6px' }}>
                            <R label="无"  active={cmykMode === 'none'}   onClick={() => setCmykMode('none')} />
                            <R label="全部" active={cmykMode === 'all'}    onClick={() => setCmykMode('all')} />
                            <R label="自定" active={cmykMode === 'custom'} onClick={() => setCmykMode('custom')} />
                        </div>
                        {cmykMode === 'custom' && (
                            <div style={{ ...ROW, paddingLeft: '4px', marginBottom: '6px' }}>
                                <CB label="C" checked={cmykC} onChange={setCmykC} />
                                <CB label="M" checked={cmykM} onChange={setCmykM} />
                                <CB label="Y" checked={cmykY} onChange={setCmykY} />
                                <CB label="K" checked={cmykK} onChange={setCmykK} />
                            </div>
                        )}
                        <div style={ROW}>
                            <R label="中英文" active={labelLang === 'both'} onClick={() => setLabelLang('both')} />
                            <R label="英文"   active={labelLang === 'en'}   onClick={() => setLabelLang('en')} />
                            <R label="中文"   active={labelLang === 'zh'}   onClick={() => setLabelLang('zh')} />
                        </div>
                    </div>
                    {/* 专色 */}
                    <div style={{ flex: 1 }}>
                        <div style={LBL}>专色</div>
                        <div style={{ ...ROW, marginBottom: '6px' }}>
                            <R label="无"  active={spotMode === 'none'} onClick={() => setSpotMode('none')} />
                            <R label="全部" active={spotMode === 'all'}  onClick={() => setSpotMode('all')} />
                        </div>
                        <CB label="简化 PANTONE 名称" checked={simplifyPantone}
                            onChange={setSimplifyPantone} disabled={spotMode === 'none'} />
                    </div>
                </div>
            </div>

            {/* 相关选项与设置 */}
            <div style={SECTION}>
                <div style={SEC_TITLE}>[ 相关选项与设置 ]</div>

                {/* 样式 */}
                <div style={LBL}>样式</div>
                <div style={{ ...ROW, marginBottom: '8px' }}>
                    <R label="字串排列" active={style === 'text'}   onClick={() => setStyle('text')} />
                    <R label="圆圈反字" active={style === 'circle'} onClick={() => setStyle('circle')} />
                    <R label="方块反字" active={style === 'rect'}   onClick={() => setStyle('rect')} />
                </div>

                {(isRect || isCircle) && (
                    <div style={{ ...ROW, gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {isRect && (
                            <><span style={SEP}>宽:</span><Num value={labelWidth}  onChange={setW} min={1} max={60} w={46} />
                              <span style={SEP}>高:</span><Num value={labelHeight} onChange={setH} min={1} max={60} w={46} /></>
                        )}
                        {isCircle && (
                            <><span style={SEP}>直径:</span><Num value={labelWidth} onChange={setW} min={1} max={60} w={46} /></>
                        )}
                        {isRect && (
                            <><span style={SEP}>半径:</span><Num value={cornerRadius} onChange={setR} min={0} max={20} w={46} /></>
                        )}
                        <span style={SEP}>方向:</span>
                        <select className="input" value={direction} onChange={e => setDirection(e.target.value as Direction)}
                            style={{ fontSize: '11px', padding: '2px 6px', width: 'auto', height: 26 }}>
                            <option value="h">横向</option>
                            <option value="v">纵向</option>
                        </select>
                    </div>
                )}

                <div style={{ ...ROW, gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
                    <span style={SEP}>字体:</span>
                    <input className="input" type="text" value={fontFamily}
                        onChange={e => setFont(e.target.value)}
                        placeholder="字体名称" style={{ width: 120, fontSize: '11px' }} />
                    <span style={SEP}>大小:</span>
                    <Num value={fontSize} onChange={setFontSize} min={0.5} max={20} step={0.5} w={46} />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>mm</span>
                </div>

                {/* 顺序 */}
                <div style={LBL}>顺序</div>
                <div style={{ ...ROW, marginBottom: '8px' }}>
                    <R label="四色前(上) 专色后(下)" active={order === 'cmyk-first'} onClick={() => setOrder('cmyk-first')} />
                    <R label="专色前(上) 四色后(下)" active={order === 'spot-first'} onClick={() => setOrder('spot-first')} />
                </div>

                {/* 位置 */}
                <div style={LBL}>位置</div>
                <div style={{ ...ROW, marginBottom: '8px' }}>
                    <R label="画板中央"  active={placement === 'center'}   onClick={() => setPlacement('center')} />
                    <R label="画板左上角" active={placement === 'topleft'} onClick={() => setPlacement('topleft')} />
                    <R label="手动黏贴"  active={placement === 'manual'}   onClick={() => setPlacement('manual')} />
                </div>

                {/* 其他 */}
                <div style={LBL}>其他</div>
                <div style={ROW}>
                    <CB label="选取" checked={autoSelect}   onChange={setSelect} />
                    <CB label="附加油墨总数" checked={showInkTotal} onChange={setTotal} />
                    <CB label="转曲" checked={convertOL}    onChange={setOutlines} />
                </div>
            </div>

            {/* 消息 */}
            {msg && (
                <div style={{ fontSize: '11px', color: 'var(--color-success)', padding: '4px 8px',
                    background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-success)', marginBottom: '6px' }}>
                    {msg}
                </div>
            )}
            {err && (
                <div style={{ fontSize: '11px', color: 'var(--color-error)', padding: '4px 8px',
                    background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-error)', marginBottom: '6px' }}>
                    {err}
                </div>
            )}

            {/* 按钮 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleReset} disabled={running}>默认</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleRun} disabled={running}>
                    {running ? '生成中...' : '运行'}
                </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                PC CPC中印 by calvin530126
            </div>
        </div>
    );
};