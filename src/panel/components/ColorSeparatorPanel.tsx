import React, { useState, useCallback } from 'react';
import { getBridge } from '@bridge';

type CmykMode = 'none' | 'all' | 'custom';
type SpotMode = 'none' | 'all' | 'custom';
type LabelStyle = 'text' | 'circle' | 'rect';
type LabelLang = 'both' | 'en' | 'zh';
type Direction = 'h' | 'v';
type Order = 'cmyk-first' | 'spot-first';
type Placement = 'center' | 'topleft' | 'manual';

const panelStyle: React.CSSProperties = {
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};

const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #383b3c 0%, #333637 100%)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    padding: 12,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
};

const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
};

const titleStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
};

const hintStyle: React.CSSProperties = {
    fontSize: 10,
    color: 'var(--color-text-tertiary)',
};

const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    marginBottom: 5,
    display: 'block',
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
};

const fieldGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 8,
};

const footerTextStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: 10,
    color: 'var(--color-text-tertiary)',
    lineHeight: 1.5,
};

const FONT_OPTIONS = [
    { label: '系统默认', value: '' },
    { label: '雅黑(粗)', value: 'MicrosoftYaHei-Bold' },
    { label: '微软雅黑', value: 'MicrosoftYaHei' },
    { label: '黑体', value: 'SimHei' },
    { label: '宋体', value: 'SimSun' },
    { label: 'Arial', value: 'ArialMT' },
    { label: 'Arial Bold', value: 'Arial-BoldMT' },
    { label: 'Tahoma', value: 'Tahoma' },
];

function segmentStyle(active: boolean): React.CSSProperties {
    return {
        height: 28,
        padding: '0 10px',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 4,
        background: active ? 'var(--color-accent-soft)' : 'var(--color-bg-control)',
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        minWidth: 48,
    };
}

function checkboxStyle(disabled?: boolean): React.CSSProperties {
    return {
        height: 26,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        color: 'var(--color-text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        userSelect: 'none',
    };
}

const Seg: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <span style={segmentStyle(active)} onClick={onClick}>
        {label}
    </span>
);

const CB: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
    label,
    checked,
    onChange,
    disabled,
}) => (
    <label style={checkboxStyle(disabled)}>
        <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)', cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        {label}
    </label>
);

const Num: React.FC<{
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
}> = ({ label, value, onChange, min = 0, max = 100, step = 0.5, suffix }) => (
    <label style={{ minWidth: 0 }}>
        <span style={labelStyle}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <input
                type="number"
                className="input"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                style={{ height: 30, padding: '3px 6px', textAlign: 'center', fontSize: 12 }}
            />
            {suffix && <span style={{ ...hintStyle, flexShrink: 0 }}>{suffix}</span>}
        </div>
    </label>
);

const SelectField: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: Array<{ label: string; value: string }>;
}> = ({ label, value, onChange, options }) => (
    <label style={{ minWidth: 0 }}>
        <span style={labelStyle}>{label}</span>
        <select
            className="input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ height: 30, padding: '3px 8px', fontSize: 12 }}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </label>
);

export const ColorSeparatorPanel: React.FC = () => {
    const [cmykMode, setCmykMode] = useState<CmykMode>('all');
    const [cmykC, setCmykC] = useState(true);
    const [cmykM, setCmykM] = useState(true);
    const [cmykY, setCmykY] = useState(true);
    const [cmykK, setCmykK] = useState(true);
    const [labelLang, setLabelLang] = useState<LabelLang>('both');
    const [spotMode, setSpotMode] = useState<SpotMode>('all');
    const [spotNames, setSpotNames] = useState('');
    const [simplifyPantone, setSimplifyPantone] = useState(true);

    const [style, setStyle] = useState<LabelStyle>('rect');
    const [labelWidth, setW] = useState(12);
    const [labelHeight, setH] = useState(5);
    const [cornerRadius, setR] = useState(1);
    const [direction, setDirection] = useState<Direction>('h');
    const [fontFamily, setFont] = useState('MicrosoftYaHei');
    const [fontSize, setFontSize] = useState(3);

    const [order, setOrder] = useState<Order>('cmyk-first');
    const [placement, setPlacement] = useState<Placement>('center');
    const [autoSelect, setSelect] = useState(true);
    const [groupItems, setGroup] = useState(true);
    const [showInkTotal, setTotal] = useState(false);
    const [convertOL, setOutlines] = useState(false);

    const [running, setRunning] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const handleReset = () => {
        setCmykMode('all');
        setCmykC(true);
        setCmykM(true);
        setCmykY(true);
        setCmykK(true);
        setLabelLang('both');
        setSpotMode('all');
        setSpotNames('');
        setSimplifyPantone(true);
        setStyle('rect');
        setW(12);
        setH(5);
        setR(1);
        setDirection('h');
        setFont('MicrosoftYaHei');
        setFontSize(3);
        setOrder('cmyk-first');
        setPlacement('center');
        setSelect(true);
        setGroup(true);
        setTotal(false);
        setOutlines(false);
        setMsg(null);
        setErr(null);
    };

    const handleRun = useCallback(async () => {
        setRunning(true);
        setMsg(null);
        setErr(null);
        try {
            const bridge = await getBridge();
            const res = await bridge.executeScript({
                scriptId: 'ai-color-generator',
                scriptPath: './src/scripts/color/ai-color-generator.jsx',
                args: {
                    cmykMode,
                    cmykC,
                    cmykM,
                    cmykY,
                    cmykK,
                    labelLang,
                    spotMode,
                    spotNames,
                    simplifyPantone,
                    style,
                    labelWidth,
                    labelHeight,
                    cornerRadius,
                    direction,
                    fontFamily,
                    fontSize,
                    order,
                    placement,
                    autoSelect,
                    groupItems,
                    showInkTotal,
                    convertToOutlines: convertOL,
                },
            });
            const data = (res.data || {}) as { message?: string };
            if (res.success) setMsg(data.message || '完成');
            else setErr(res.error || '执行失败');
        } catch (e: any) {
            setErr(e.message || '连接失败');
        } finally {
            setRunning(false);
        }
    }, [
        cmykMode,
        cmykC,
        cmykM,
        cmykY,
        cmykK,
        labelLang,
        spotMode,
        spotNames,
        simplifyPantone,
        style,
        labelWidth,
        labelHeight,
        cornerRadius,
        direction,
        fontFamily,
        fontSize,
        order,
        placement,
        autoSelect,
        groupItems,
        showInkTotal,
        convertOL,
    ]);

    const isRect = style === 'rect';
    const isCircle = style === 'circle';

    return (
        <div style={panelStyle}>
            <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                    <div style={titleStyle}>选色</div>
                    <div style={hintStyle}>CMYK 与专色来源</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <span style={labelStyle}>CMYK 四原色</span>
                        <div style={{ ...rowStyle, marginBottom: 8 }}>
                            <Seg label="无" active={cmykMode === 'none'} onClick={() => setCmykMode('none')} />
                            <Seg label="全部" active={cmykMode === 'all'} onClick={() => setCmykMode('all')} />
                            <Seg label="自定" active={cmykMode === 'custom'} onClick={() => setCmykMode('custom')} />
                        </div>
                        <div style={{ ...rowStyle, minHeight: 26, marginBottom: 8 }}>
                            <CB label="C" checked={cmykC} onChange={setCmykC} disabled={cmykMode !== 'custom'} />
                            <CB label="M" checked={cmykM} onChange={setCmykM} disabled={cmykMode !== 'custom'} />
                            <CB label="Y" checked={cmykY} onChange={setCmykY} disabled={cmykMode !== 'custom'} />
                            <CB label="K" checked={cmykK} onChange={setCmykK} disabled={cmykMode !== 'custom'} />
                        </div>
                        <span style={labelStyle}>标签语言</span>
                        <div style={rowStyle}>
                            <Seg label="中英文" active={labelLang === 'both'} onClick={() => setLabelLang('both')} />
                            <Seg label="英文" active={labelLang === 'en'} onClick={() => setLabelLang('en')} />
                            <Seg label="中文" active={labelLang === 'zh'} onClick={() => setLabelLang('zh')} />
                        </div>
                    </div>

                    <div>
                        <span style={labelStyle}>专色</span>
                        <div style={{ ...rowStyle, marginBottom: 8 }}>
                            <Seg label="无" active={spotMode === 'none'} onClick={() => setSpotMode('none')} />
                            <Seg label="全部" active={spotMode === 'all'} onClick={() => setSpotMode('all')} />
                            <Seg label="自定" active={spotMode === 'custom'} onClick={() => setSpotMode('custom')} />
                        </div>
                        <div style={{ minHeight: 26, marginBottom: 8 }}>
                            <CB
                                label="简化颜色名称"
                                checked={simplifyPantone}
                                onChange={setSimplifyPantone}
                                disabled={spotMode === 'none'}
                            />
                        </div>
                        <textarea
                            className="input"
                            value={spotNames}
                            onChange={(e) => setSpotNames(e.target.value)}
                            disabled={spotMode !== 'custom'}
                            placeholder="例：871 C, 186 C ..."
                            style={{
                                minHeight: 58,
                                resize: 'vertical',
                                fontSize: 12,
                                lineHeight: 1.45,
                                opacity: spotMode === 'custom' ? 1 : 0.48,
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                    <div style={titleStyle}>标签样式</div>
                    <div style={hintStyle}>所有单位：mm</div>
                </div>

                <div style={{ ...rowStyle, marginBottom: 10 }}>
                    <Seg label="字串排列" active={style === 'text'} onClick={() => setStyle('text')} />
                    <Seg label="圆圈反字" active={style === 'circle'} onClick={() => setStyle('circle')} />
                    <Seg label="方块反字" active={style === 'rect'} onClick={() => setStyle('rect')} />
                </div>

                <div style={{ ...fieldGridStyle, marginBottom: 10 }}>
                    {isRect && (
                        <>
                            <Num label="宽" value={labelWidth} onChange={setW} min={1} max={60} suffix="mm" />
                            <Num label="高" value={labelHeight} onChange={setH} min={1} max={60} suffix="mm" />
                            <Num label="半径" value={cornerRadius} onChange={setR} min={0} max={20} suffix="mm" />
                        </>
                    )}
                    {isCircle && <Num label="直径" value={labelWidth} onChange={setW} min={1} max={60} suffix="mm" />}
                    <SelectField
                        label="方向"
                        value={direction}
                        onChange={(v) => setDirection(v as Direction)}
                        options={[
                            { value: 'h', label: '横向' },
                            { value: 'v', label: '纵向' },
                        ]}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 10 }}>
                    <SelectField label="字体" value={fontFamily} onChange={setFont} options={FONT_OPTIONS} />
                    <Num label="大小" value={fontSize} onChange={setFontSize} min={0.5} max={20} step={0.5} suffix="mm" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <span style={labelStyle}>顺序</span>
                        <div style={rowStyle}>
                            <Seg label="四色前 专色后" active={order === 'cmyk-first'} onClick={() => setOrder('cmyk-first')} />
                            <Seg label="专色前 四色后" active={order === 'spot-first'} onClick={() => setOrder('spot-first')} />
                        </div>
                    </div>
                    <div>
                        <span style={labelStyle}>位置</span>
                        <div style={rowStyle}>
                            <Seg label="画板中央" active={placement === 'center'} onClick={() => setPlacement('center')} />
                            <Seg label="左上角" active={placement === 'topleft'} onClick={() => setPlacement('topleft')} />
                            <Seg label="手动" active={placement === 'manual'} onClick={() => setPlacement('manual')} />
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: '1px solid var(--color-border)',
                        ...rowStyle,
                    }}
                >
                    <CB label="选取" checked={autoSelect} onChange={setSelect} />
                    <CB label="组" checked={groupItems} onChange={setGroup} />
                    <CB label="附加油墨总数" checked={showInkTotal} onChange={setTotal} />
                    <CB label="转曲" checked={convertOL} onChange={setOutlines} />
                </div>
            </div>

            {(msg || err) && (
                <div
                    style={{
                        fontSize: 12,
                        padding: '8px 10px',
                        borderRadius: 5,
                        color: msg ? 'var(--color-success)' : 'var(--color-error)',
                        background: msg ? 'rgba(57,181,138,0.1)' : 'rgba(255,95,109,0.1)',
                        border: `1px solid ${msg ? 'var(--color-success)' : 'var(--color-error)'}`,
                    }}
                >
                    {msg || err}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                <button className="btn" style={{ height: 40 }} onClick={handleReset} disabled={running}>
                    默认
                </button>
                <button className="btn btn-primary" style={{ height: 40, fontSize: 14 }} onClick={handleRun} disabled={running}>
                    {running ? '生成中...' : '运行'}
                </button>
            </div>

            <div style={footerTextStyle}>原脚本不支持 AI 2023 及以上版本，本版由我适配调整</div>
        </div>
    );
};
