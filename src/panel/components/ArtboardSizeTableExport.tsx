import React, { useMemo, useState } from 'react';
import { getBridge } from '@bridge';

const fs = require('fs');
const path = require('path');
const os = require('os');
const ExcelJS = require('exceljs');

type GroupMode = 'artboard' | 'size';
type Unit = 'mm' | 'cm' | 'in' | 'pt' | 'px';
type ExportFormat = 'xlsx' | 'csv';
type OutputLocation = 'document' | 'desktop' | 'custom';
type UnitPriceValue = number | '';

interface RawArtboardRow {
    index: number;
    name: string;
    widthPt: number;
    heightPt: number;
    previewPath?: string;
}

interface CollectResult {
    docName: string;
    docPath: string;
    tempDir: string;
    artboards: RawArtboardRow[];
}

interface TableRow {
    label: string;
    artboardIndex?: number;
    artboardName?: string;
    width: number;
    height: number;
    scaledWidth: number;
    scaledHeight: number;
    scaledArea: number;
    scaleLabel: string;
    count?: number;
    artboardsText?: string;
    previewPath?: string;
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

function sanitizeFileName(name: string) {
    return String(name || 'artboard-size-table')
        .replace(/\.[^/.]+$/, '')
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\s+/g, '_');
}

function roundTo(value: number, precision: number) {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
}

function ptToUnit(pt: number, unit: Unit) {
    if (unit === 'cm') return (pt * 0.352778) / 10;
    if (unit === 'in') return pt / 72;
    if (unit === 'px') return pt * (96 / 72);
    if (unit === 'pt') return pt;
    return pt * 0.352778;
}

function ptAreaToSquareMeters(widthPt: number, heightPt: number, scale: number) {
    const widthMeters = (widthPt * scale * 0.352778) / 1000;
    const heightMeters = (heightPt * scale * 0.352778) / 1000;
    return widthMeters * heightMeters;
}

function csvEscape(value: string | number | undefined) {
    const text = String(value ?? '');
    if (/[",\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function getExcelColumnLetter(columnNumber: number) {
    let value = columnNumber;
    let letter = '';
    while (value > 0) {
        const remainder = (value - 1) % 26;
        letter = String.fromCharCode(65 + remainder) + letter;
        value = Math.floor((value - 1) / 26);
    }
    return letter;
}

function normalizeUnitPrice(value: string): UnitPriceValue {
    const trimmed = value.trim();
    if (!trimmed) return '';

    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : '';
}

function getPngSize(buffer: Buffer) {
    if (buffer.length < 24) {
        return null;
    }

    const isPng = buffer[0] === 0x89
        && buffer[1] === 0x50
        && buffer[2] === 0x4e
        && buffer[3] === 0x47;

    if (!isPng) {
        return null;
    }

    return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
    };
}

function fitImageSize(width: number, height: number, maxWidth: number, maxHeight: number) {
    if (width <= 0 || height <= 0) {
        return { width: maxWidth, height: maxHeight };
    }

    const ratio = Math.min(maxWidth / width, maxHeight / height);
    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio)),
    };
}

function buildRows(
    artboards: RawArtboardRow[],
    groupMode: GroupMode,
    unit: Unit,
    scale: number,
    precision: number
): TableRow[] {
    const normalized = artboards.map((row) => ({
        ...row,
        width: roundTo(ptToUnit(row.widthPt, unit), precision),
        height: roundTo(ptToUnit(row.heightPt, unit), precision),
        scaledWidth: roundTo(ptToUnit(row.widthPt * scale, unit), precision),
        scaledHeight: roundTo(ptToUnit(row.heightPt * scale, unit), precision),
        scaledArea: roundTo(ptAreaToSquareMeters(row.widthPt, row.heightPt, scale), 4),
        scaleLabel: `1:${scale}`,
    }));

    if (groupMode === 'artboard') {
        return normalized.map((row) => ({
            label: `${row.index}`,
            artboardIndex: row.index,
            artboardName: row.name,
            width: row.width,
            height: row.height,
            scaledWidth: row.scaledWidth,
            scaledHeight: row.scaledHeight,
            scaledArea: row.scaledArea,
            scaleLabel: row.scaleLabel,
            previewPath: row.previewPath,
        }));
    }

    const grouped = new Map<string, TableRow>();
    normalized.forEach((row) => {
        const key = `${roundTo(row.width, precision)}x${roundTo(row.height, precision)}`;
        const existing = grouped.get(key);
        if (existing) {
            existing.count = (existing.count || 0) + 1;
            existing.artboardsText = `${existing.artboardsText} | ${row.index}.${row.name}`;
        } else {
            grouped.set(key, {
                label: `${row.width} x ${row.height} ${unit}`,
                width: row.width,
                height: row.height,
                scaledWidth: row.scaledWidth,
                scaledHeight: row.scaledHeight,
                scaledArea: row.scaledArea,
                scaleLabel: row.scaleLabel,
                count: 1,
                artboardsText: `${row.index}.${row.name}`,
                previewPath: row.previewPath,
            });
        }
    });

    return Array.from(grouped.values());
}

function resolveOutputDir(location: OutputLocation, docPath: string) {
    if (location === 'document' && docPath) {
        return docPath;
    }

    if (location === 'desktop') {
        return path.join(os.homedir(), 'Desktop');
    }

    const win = window as any;
    if (win.cep && win.cep.fs) {
        const result = win.cep.fs.showOpenDialogEx(false, true, '选择导出文件夹', '', [], undefined, false);
        if (result.err === win.cep.fs.NO_ERROR && result.data && result.data.length > 0) {
            return result.data[0];
        }
    }

    return '';
}

async function exportCsv(outputPath: string, groupMode: GroupMode, unit: Unit, rows: TableRow[], unitPrice: UnitPriceValue) {
    const headers = groupMode === 'size'
        ? ['尺寸分组', `原稿宽(${unit})`, `原稿高(${unit})`, '比例', `成品宽(${unit})`, `成品高(${unit})`, '成品面积(㎡)', '数量', '画板', '单价', '金额']
        : ['画板序号', '画板名称', `原稿宽(${unit})`, `原稿高(${unit})`, '比例', `成品宽(${unit})`, `成品高(${unit})`, '成品面积(㎡)', '单价', '金额'];

    const lines = [headers.join(',')];
    rows.forEach((row) => {
        const rowNumber = lines.length + 1;
        const areaColumnNumber = headers.indexOf('成品面积(㎡)') + 1;
        const unitPriceColumnNumber = headers.indexOf('单价') + 1;
        const amountFormula = `=${getExcelColumnLetter(unitPriceColumnNumber)}${rowNumber}*${getExcelColumnLetter(areaColumnNumber)}${rowNumber}`;
        const unitPriceCell = unitPrice === '' ? '' : unitPrice;
        const cols = groupMode === 'size'
            ? [
                row.label,
                row.width,
                row.height,
                row.scaleLabel,
                row.scaledWidth,
                row.scaledHeight,
                row.scaledArea,
                row.count || 0,
                row.artboardsText || '',
                unitPriceCell,
                amountFormula,
            ]
            : [
                row.artboardIndex || '',
                row.artboardName || '',
                row.width,
                row.height,
                row.scaleLabel,
                row.scaledWidth,
                row.scaledHeight,
                row.scaledArea,
                unitPriceCell,
                amountFormula,
            ];
        lines.push(cols.map(csvEscape).join(','));
    });

    fs.writeFileSync(outputPath, '\uFEFF' + lines.join('\r\n'), 'utf8');
}

async function exportXlsx(outputPath: string, docName: string, groupMode: GroupMode, unit: Unit, rows: TableRow[], unitPrice: UnitPriceValue) {
    const workbook = new ExcelJS.Workbook();
    workbook.calcProperties.fullCalcOnLoad = true;
    const sheet = workbook.addWorksheet('画板尺寸表');
    const headers = groupMode === 'size'
        ? ['尺寸分组', `原稿宽(${unit})`, `原稿高(${unit})`, '比例', `成品宽(${unit})`, `成品高(${unit})`, '成品面积(㎡)', '数量', '画板', '单价', '金额', '图示']
        : ['画板序号', '画板名称', `原稿宽(${unit})`, `原稿高(${unit})`, '比例', `成品宽(${unit})`, `成品高(${unit})`, '成品面积(㎡)', '单价', '金额', '图示'];

    sheet.mergeCells(1, 1, 1, headers.length);
    sheet.getCell('A1').value = `${docName} - 画板尺寸表`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { vertical: 'middle' };
    sheet.getRow(1).height = 22;

    const headerRow = sheet.getRow(3);
    headerRow.values = headers;
    headerRow.height = 22;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

    const imageColumnNumber = headers.length;
    const scaledWidthColumnNumber = headers.findIndex((header: string) => header.indexOf('成品宽(') === 0) + 1;
    const scaledHeightColumnNumber = headers.findIndex((header: string) => header.indexOf('成品高(') === 0) + 1;
    const scaledAreaColumnNumber = headers.indexOf('成品面积(㎡)') + 1;
    const unitPriceColumnNumber = headers.indexOf('单价') + 1;
    const amountColumnNumber = headers.indexOf('金额') + 1;
    const areaDivisorByUnit: Record<Unit, number> = {
        mm: 1000000,
        cm: 10000,
        in: 1550.0031,
        pt: 8035199.875,
        px: 1428844.907,
    };
    const areaDivisor = areaDivisorByUnit[unit];
    const previewBox = { width: 72, height: 42 };

    rows.forEach((row, idx) => {
        const rowNumber = idx + 4;
        const unitPriceCell = unitPrice === '' ? null : unitPrice;
        const values = groupMode === 'size'
            ? [row.label, row.width, row.height, row.scaleLabel, row.scaledWidth, row.scaledHeight, null, row.count || 0, row.artboardsText || '', unitPriceCell, null]
            : [row.artboardIndex || '', row.artboardName || '', row.width, row.height, row.scaleLabel, row.scaledWidth, row.scaledHeight, null, unitPriceCell, null];

        sheet.getRow(rowNumber).values = values;
        sheet.getRow(rowNumber).height = 42;
        sheet.getRow(rowNumber).alignment = { vertical: 'middle' };

        const widthRef = sheet.getRow(rowNumber).getCell(scaledWidthColumnNumber).address;
        const heightRef = sheet.getRow(rowNumber).getCell(scaledHeightColumnNumber).address;
        const areaRef = sheet.getRow(rowNumber).getCell(scaledAreaColumnNumber).address;
        const unitPriceRef = sheet.getRow(rowNumber).getCell(unitPriceColumnNumber).address;
        sheet.getRow(rowNumber).getCell(scaledAreaColumnNumber).value = {
            formula: `ROUND(${widthRef}*${heightRef}/${areaDivisor},4)`,
        };
        sheet.getRow(rowNumber).getCell(amountColumnNumber).value = {
            formula: `IF(${unitPriceRef}="","",ROUND(${unitPriceRef}*${areaRef},2))`,
        };

        if (row.previewPath && fs.existsSync(row.previewPath)) {
            const imageBuffer = fs.readFileSync(row.previewPath);
            const pngSize = getPngSize(imageBuffer);
            const imageSize = pngSize
                ? fitImageSize(pngSize.width, pngSize.height, previewBox.width, previewBox.height)
                : previewBox;
            const imageId = workbook.addImage({
                buffer: imageBuffer,
                extension: 'png',
            });
            sheet.addImage(imageId, {
                tl: { col: imageColumnNumber - 1 + 0.12, row: rowNumber - 1 + 0.12 },
                ext: imageSize,
            });
        }
    });

    sheet.views = [{ state: 'frozen', ySplit: 3 }];
    sheet.columns = headers.map((header: string, idx: number) => {
        if (idx === imageColumnNumber - 1) return { header, width: 14 };
        if (header === '画板') return { header, width: 34 };
        if (header === '画板名称' || header === '尺寸分组') return { header, width: 20 };
        if (header === '单价' || header === '金额') return { header, width: 12 };
        return { header, width: 13 };
    });

    for (let r = 3; r <= rows.length + 3; r++) {
        for (let c = 1; c <= headers.length; c++) {
            const cell = sheet.getCell(r, c);
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD7DDE7' } },
                left: { style: 'thin', color: { argb: 'FFD7DDE7' } },
                bottom: { style: 'thin', color: { argb: 'FFD7DDE7' } },
                right: { style: 'thin', color: { argb: 'FFD7DDE7' } },
            };
            if (r > 3 && c !== imageColumnNumber) {
                cell.alignment = { vertical: 'middle', horizontal: c >= 2 ? 'center' : 'left', wrapText: true };
            }
        }
    }

    [2, 3, scaledWidthColumnNumber, scaledHeightColumnNumber, scaledAreaColumnNumber].forEach((columnNumber) => {
        sheet.getColumn(columnNumber).numFmt = '0.0000';
    });
    [unitPriceColumnNumber, amountColumnNumber].forEach((columnNumber) => {
        sheet.getColumn(columnNumber).numFmt = '0.00';
    });

    const buffer = await workbook.xlsx.writeBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
}

export const ArtboardSizeTableExport: React.FC = () => {
    const [groupMode, setGroupMode] = useState<GroupMode>('artboard');
    const [unit, setUnit] = useState<Unit>('cm');
    const [scale, setScale] = useState(1);
    const [precision, setPrecision] = useState(2);
    const [unitPrice, setUnitPrice] = useState('');
    const [format, setFormat] = useState<ExportFormat>('xlsx');
    const [outputLocation, setOutputLocation] = useState<OutputLocation>('document');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const supportsPreview = useMemo(() => format === 'xlsx', [format]);

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        setSuccess(null);

        let tempDir = '';
        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'export-artboard-size-table',
                scriptPath: './src/scripts/export/export-artboard-size-table.jsx',
                args: {
                    mode: 'collect',
                    includePreview: supportsPreview,
                    thumbnailMaxPx: 96,
                    autoSave: true,
                },
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || '读取画板数据失败');
            }

            const data = result.data as CollectResult;
            tempDir = data.tempDir;
            const rows = buildRows(data.artboards || [], groupMode, unit, scale, precision);
            const normalizedUnitPrice = normalizeUnitPrice(unitPrice);

            if (outputLocation === 'document' && !data.docPath) {
                throw new Error('当前文档未保存，无法使用文档目录。请先保存文档，或改用桌面/弹窗选择。');
            }

            const outputDir = resolveOutputDir(outputLocation, data.docPath || '');

            if (!outputDir) {
                throw new Error('未选择导出目录');
            }

            const baseName = sanitizeFileName(data.docName || 'artboard_size_table');
            const outputPath = path.join(outputDir, `${baseName}_artboard_size_table.${format}`);

            if (format === 'xlsx') {
                await exportXlsx(outputPath, data.docName || baseName, groupMode, unit, rows, normalizedUnitPrice);
            } else {
                await exportCsv(outputPath, groupMode, unit, rows, normalizedUnitPrice);
            }

            setSuccess(`导出成功：${outputPath}`);
        } catch (e: any) {
            setError(e?.message || '导出失败');
        } finally {
            if (tempDir && fs.existsSync(tempDir)) {
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e2) { }
            }
            setIsExporting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginRight: '2px' }}>编组</span>
                <span style={chipStyle(groupMode === 'artboard')} onClick={() => setGroupMode('artboard')}>按画板</span>
                <span style={chipStyle(groupMode === 'size')} onClick={() => setGroupMode('size')}>按尺寸</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginRight: '2px' }}>单位</span>
                {(['mm', 'cm', 'in', 'pt', 'px'] as Unit[]).map((item) => (
                    <span key={item} style={chipStyle(unit === item)} onClick={() => setUnit(item)}>{item}</span>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>比例 (1:X)</label>
                    <input type="number" className="input" value={scale} min={0.01} step={0.01}
                        onChange={(e) => setScale(Math.max(0.01, parseFloat(e.target.value) || 1))} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>小数位</label>
                    <input type="number" className="input" value={precision} min={0} max={6} step={1}
                        onChange={(e) => setPrecision(Math.max(0, Math.min(6, parseInt(e.target.value, 10) || 0)))} />
                </div>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '2px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>单价</label>
                <input type="number" className="input" value={unitPrice} min={0} step={0.01} placeholder="留空则表格内填写"
                    onChange={(e) => setUnitPrice(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginRight: '2px' }}>格式</span>
                <span style={chipStyle(format === 'xlsx')} onClick={() => setFormat('xlsx')}>XLSX（含图示）</span>
                <span style={chipStyle(format === 'csv')} onClick={() => setFormat('csv')}>CSV</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginRight: '2px' }}>位置</span>
                <span style={chipStyle(outputLocation === 'document')} onClick={() => setOutputLocation('document')}>文档目录</span>
                <span style={chipStyle(outputLocation === 'desktop')} onClick={() => setOutputLocation('desktop')}>桌面</span>
                <span style={chipStyle(outputLocation === 'custom')} onClick={() => setOutputLocation('custom')}>弹窗选择</span>
            </div>

            {format === 'csv' ? (
                <div style={{
                    padding: '8px 10px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                }}>
                    CSV 不包含图示；如果需要最后一列图片，请使用 XLSX。
                </div>
            ) : (
                <div style={{
                    padding: '8px 10px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                }}>
                    会先导出超小 PNG 缩略图到临时目录，再自动嵌入到 Excel 最后一列。
                </div>
            )}

            {error && <div className="alert alert-error" style={{ fontSize: '11px', padding: '6px 10px' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ fontSize: '11px', padding: '6px 10px' }}>{success}</div>}

            <button className="btn btn-primary" onClick={handleExport} disabled={isExporting} style={{ width: '100%' }}>
                {isExporting ? <><span className="spinner" /> 导出中...</> : '导出表格'}
            </button>
        </div>
    );
};
