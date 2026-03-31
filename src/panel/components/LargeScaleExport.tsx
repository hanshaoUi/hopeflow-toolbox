import React, { useState, useEffect, useCallback } from 'react';
import { getBridge } from '@bridge';

interface ExportInfo {
    docName: string;
    originalSize: { widthMM: number; heightMM: number };
    exportSize: { widthMM: number; heightMM: number; widthPx: number; heightPx: number };
    tiles: { cols: number; rows: number; total: number };
    scaleLimited: boolean;
    maxScalePercent: number;
}

const DPI_PRESETS = [
    { value: 72, label: '72', desc: '屏幕/喷绘' },
    { value: 150, label: '150', desc: '大幅面' },
    { value: 300, label: '300', desc: '高精度' },
    { value: 0, label: '自定义', desc: '' },
];

const FORMAT_OPTIONS = [
    { value: 'JPEG', label: 'JPEG' },
    { value: 'PNG', label: 'PNG' },
    { value: 'TIFF', label: 'TIFF' },
];

const chipSt = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 10px', borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
    border: '1px solid ' + (active ? 'var(--color-accent)' : 'var(--color-border)'),
    color: active ? '#fff' : 'var(--color-text-secondary)',
    cursor: 'pointer', fontSize: '11px', transition: 'all 0.15s ease', userSelect: 'none',
});

export const LargeScaleExport: React.FC = () => {
    const [scale, setScale] = useState(10);
    const [selectedDpi, setSelectedDpi] = useState(72);
    const [customDpi, setCustomDpi] = useState(100);
    const [format, setFormat] = useState('JPEG');
    const [info, setInfo] = useState<ExportInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const actualDpi = selectedDpi === 0 ? customDpi : selectedDpi;

    // Fetch preview from JSX
    const fetchPreview = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'export-large-scale',
                scriptPath: './src/scripts/export/export-large-scale.jsx',
                args: { mode: 'preview', scale, dpi: actualDpi, format },
            });
            if (result.success && result.data) {
                setInfo(result.data as ExportInfo);
            } else {
                setError(result.error || '获取预览失败');
            }
        } catch (e: any) {
            setError(e.message || '获取预览失败');
        } finally {
            setIsLoading(false);
        }
    }, [scale, actualDpi, format]);

    useEffect(() => {
        const timer = setTimeout(fetchPreview, 300);
        return () => clearTimeout(timer);
    }, [fetchPreview]);

    // Export
    const handleExport = async () => {
        if (!info) return;

        setError(null);

        // Select output folder via CEP file dialog
        const win = window as any;
        let outputDir = '';

        if (win.cep && win.cep.fs) {
            const result = win.cep.fs.showOpenDialogEx(
                false, true, '选择输出文件夹', '', [], undefined, false
            );
            if (result.err === win.cep.fs.NO_ERROR && result.data && result.data.length > 0) {
                outputDir = result.data[0];
            } else {
                return; // User cancelled
            }
        } else {
            setError('无法打开文件选择器');
            return;
        }

        setIsExporting(true);
        setError(null);
        setSuccess(null);

        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'export-large-scale',
                scriptPath: './src/scripts/export/export-large-scale.jsx',
                args: {
                    mode: 'export',
                    scale,
                    dpi: actualDpi,
                    format,
                    outputDir,
                    baseName: info.docName || 'export',
                },
            });

            if (result.success && result.data) {
                const data = result.data as any;
                const count = data.files?.length || data.totalTiles || 1;
                const limited = data.scaleLimited ? '（受缩放限制，建议使用 TIFF 格式）' : '';
                setSuccess(`导出成功，共 ${count} 个文件${limited}`);
            } else {
                setError(result.error || '导出失败');
            }
        } catch (e: any) {
            setError(e.message || '导出失败');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Scale ratio */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>缩放比例</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>1 :</span>
                <input
                    type="number"
                    className="input"
                    value={scale}
                    onChange={(e) => setScale(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '60px', textAlign: 'center' }}
                    min={1} max={100}
                />
            </div>

            {/* DPI presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', marginRight: '2px' }}>DPI</span>
                {DPI_PRESETS.map(p => (
                    <span key={p.value} style={chipSt(selectedDpi === p.value)}
                        onClick={() => setSelectedDpi(p.value)}
                        title={p.desc}>
                        {p.label}
                    </span>
                ))}
                {selectedDpi === 0 && (
                    <input
                        type="number"
                        className="input"
                        value={customDpi}
                        onChange={(e) => setCustomDpi(Math.max(1, parseInt(e.target.value) || 72))}
                        style={{ width: '60px', textAlign: 'center' }}
                        min={1} max={1200}
                    />
                )}
            </div>

            {/* Format */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', marginRight: '2px' }}>格式</span>
                {FORMAT_OPTIONS.map(o => (
                    <span key={o.value} style={chipSt(format === o.value)}
                        onClick={() => setFormat(o.value)}>
                        {o.label}
                    </span>
                ))}
            </div>

            {/* Preview info */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '8px', color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                    <span className="spinner" style={{ marginRight: '6px' }} />计算中...
                </div>
            ) : info ? (
                <div style={{
                    padding: '8px 10px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '11px',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>原始尺寸</div>
                            <div style={{ fontWeight: 500 }}>
                                {info.originalSize.widthMM} × {info.originalSize.heightMM} mm
                            </div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>导出尺寸</div>
                            <div style={{ fontWeight: 500, color: 'var(--color-accent)' }}>
                                {info.exportSize.widthMM.toFixed(0)} × {info.exportSize.heightMM.toFixed(0)} mm
                            </div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>像素</div>
                            <div style={{ fontWeight: 500 }}>
                                {info.exportSize.widthPx.toLocaleString()} × {info.exportSize.heightPx.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-tertiary)', marginBottom: '1px' }}>分块</div>
                            <div style={{ fontWeight: 500 }}>
                                {info.tiles.total === 1 ? '无需分块' : `${info.tiles.cols}×${info.tiles.rows} = ${info.tiles.total} 块`}
                            </div>
                        </div>
                    </div>
                    {info.scaleLimited && (
                        <div style={{
                            marginTop: '6px', padding: '4px 8px',
                            background: 'rgba(255, 149, 0, 0.1)', borderRadius: '4px',
                            fontSize: '10px', color: 'var(--color-warning)',
                        }}>
                            PNG/JPEG 缩放上限 {info.maxScalePercent}%，建议使用 TIFF 获得完整分辨率
                        </div>
                    )}
                </div>
            ) : null}

            {/* Error */}
            {error && (
                <div className="alert alert-error" style={{ fontSize: '11px', padding: '6px 10px' }}>
                    {error}
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="alert alert-success" style={{ fontSize: '11px', padding: '6px 10px' }}>
                    {success}
                </div>
            )}

            {/* Export button */}
            <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={isExporting || isLoading || !info}
                style={{ width: '100%' }}
            >
                {isExporting ? (
                    <><span className="spinner" /> 导出中...</>
                ) : (
                    '选择文件夹并导出'
                )}
            </button>
        </div>
    );
};
