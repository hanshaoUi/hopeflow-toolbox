import React, { useCallback, useState } from 'react';
import fs from 'fs';
import path from 'path';
import { getBridge } from '@bridge';

interface CsvData {
    headers: string[];
    rows: string[][];
}

interface DocObject {
    name: string;
    content: string;
    index: number;
}

interface ScanResult {
    textFrames: DocObject[];
    placedItems: DocObject[];
    namedItems: { name: string; index: number }[];
}

type VarType = 'TEXTUAL' | 'IMAGE' | 'VISIBILITY' | 'UNMAPPED';

interface Mapping {
    column: string;
    target: string;
    type: VarType;
    targetName: string;
    targetIndex: number;
}

interface ExportSettings {
    format: 'PDF' | 'PNG' | 'JPG';
    outputFolder: string;
    fileNamePattern: string;
    dpi: number;
}

type TextRuleMatchMode = 'exact' | 'regex';

interface TextStyleRule {
    id: string;
    column: string;
    matchMode: TextRuleMatchMode;
    pattern: string;
    applyColor: boolean;
    color: string;
    applySize: boolean;
    size: number | '';
}

const ALL_TEXT_COLUMNS = '__ALL_TEXT__';

function parseCSV(text: string): CsvData {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    const firstLine = text.split(/\r?\n/)[0] || '';
    const delimiter = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? '\t' : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;
    let index = 0;

    while (index < text.length) {
        const char = text[index];

        if (quoted) {
            if (char === '"') {
                if (text[index + 1] === '"') {
                    field += '"';
                    index += 2;
                } else {
                    quoted = false;
                    index++;
                }
            } else {
                field += char;
                index++;
            }
            continue;
        }

        if (char === '"') {
            quoted = true;
            index++;
        } else if (char === delimiter) {
            row.push(field);
            field = '';
            index++;
        } else if (char === '\r' || char === '\n') {
            row.push(field);
            field = '';
            if (char === '\r' && text[index + 1] === '\n') index++;
            if (row.some((cell) => cell !== '')) rows.push(row);
            row = [];
            index++;
        } else {
            field += char;
            index++;
        }
    }

    if (field || row.length) {
        row.push(field);
        if (row.some((cell) => cell !== '')) rows.push(row);
    }

    if (!rows.length) return { headers: [], rows: [] };
    return {
        headers: rows[0].map((header) => header.trim()),
        rows: rows.slice(1),
    };
}

function pad(value: number, digits: number) {
    let result = String(value);
    while (result.length < digits) result = `0${result}`;
    return result;
}

function genSeqCSV(column: string, count: number, start: number, prefix: string, suffix: string, digits: number): CsvData {
    const rows: string[][] = [];
    for (let i = 0; i < count; i++) rows.push([`${prefix}${pad(start + i, digits)}${suffix}`]);
    return { headers: [column], rows };
}

function scanImgFolder(folder: string, extensions: string[]): string[] {
    try {
        const allowed = new Set(extensions.map((ext) => ext.toLowerCase()));
        return fs
            .readdirSync(folder)
            .filter((file) => allowed.has(path.extname(file).slice(1).toLowerCase()))
            .sort()
            .map((file) => path.join(folder, file));
    } catch {
        return [];
    }
}

function genImgCSV(files: string[], withSequence: boolean, sequenceColumn: string, prefix: string, suffix: string, digits: number, start: number): CsvData {
    const headers = withSequence ? [sequenceColumn, '文件名', '图片路径'] : ['文件名', '图片路径'];
    const rows = files.map((filePath, index) => {
        const row: string[] = [];
        if (withSequence) row.push(`${prefix}${pad(start + index, digits)}${suffix}`);
        row.push(path.basename(filePath, path.extname(filePath)), filePath);
        return row;
    });
    return { headers, rows };
}

function csvStr(data: CsvData) {
    const escape = (value: string) => /[,"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    return `\uFEFF${[data.headers.map(escape).join(','), ...data.rows.map((row) => row.map(escape).join(','))].join('\r\n')}`;
}

function autoMap(headers: string[], scan: ScanResult): Mapping[] {
    return headers.map((column) => {
        if (column.startsWith('#')) {
            const itemName = column.slice(1);
            const namedItem = scan.namedItems.find((item) => item.name === itemName);
            if (namedItem) {
                return { column, target: itemName, type: 'VISIBILITY', targetName: namedItem.name, targetIndex: namedItem.index };
            }
        }

        const byContent = scan.textFrames.find((frame) => {
            const trimmedContent = frame.content.replace(/\.\.\.$/, '');
            return trimmedContent === column || frame.content === column;
        });
        if (byContent) {
            return { column, target: byContent.content, type: 'TEXTUAL', targetName: byContent.name, targetIndex: byContent.index };
        }

        const byName = scan.textFrames.find((frame) => frame.name === column);
        if (byName) {
            return { column, target: byName.name, type: 'TEXTUAL', targetName: byName.name, targetIndex: byName.index };
        }

        const image = scan.placedItems.find((item) => item.name === column);
        if (image) {
            return { column, target: image.name, type: 'IMAGE', targetName: image.name, targetIndex: image.index };
        }

        return { column, target: '', type: 'UNMAPPED', targetName: '', targetIndex: -1 };
    });
}

function createRuleId() {
    return `rule-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function createTextStyleRule(): TextStyleRule {
    return {
        id: createRuleId(),
        column: ALL_TEXT_COLUMNS,
        matchMode: 'exact',
        pattern: '',
        applyColor: true,
        color: '#ff0000',
        applySize: false,
        size: '',
    };
}

function isValidHexColor(value: string) {
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value || '').trim());
}

const Seg: React.FC<{
    items: { key: string; label: string }[];
    value: string;
    onChange: (key: string) => void;
}> = ({ items, value, onChange }) => (
    <div style={{ display: 'flex', gap: '1px', background: 'var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {items.map((item) => (
            <button
                key={item.key}
                onClick={() => onChange(item.key)}
                style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    background: value === item.key ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                    color: value === item.key ? '#fff' : 'var(--color-text-secondary)',
                    transition: 'var(--transition-fast)',
                }}
            >
                {item.label}
            </button>
        ))}
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ label, children, style }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...style }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', minWidth: '38px', flexShrink: 0 }}>
            {label}
        </span>
        {children}
    </div>
);

const Badge: React.FC<{ variant?: 'accent' | 'success' | 'warning' | ''; children: React.ReactNode }> = ({ variant, children }) => (
    <span className={`badge${variant ? ` badge-${variant}` : ''}`} style={{ fontSize: '10px', padding: '1px 6px', lineHeight: '16px' }}>
        {children}
    </span>
);

type Step = 'source' | 'preview' | 'mapping' | 'execute';

const STEP_LABELS: Record<Step, string> = {
    source: '数据',
    preview: '预览',
    mapping: '映射',
    execute: '执行',
};

const STEPS: Step[] = ['source', 'preview', 'mapping', 'execute'];

export const DataMerge: React.FC = () => {
    const [srcMode, setSrcMode] = useState<'file' | 'gen'>('file');
    const [csvPath, setCsvPath] = useState('');
    const [csvDir, setCsvDir] = useState('');
    const [csvName, setCsvName] = useState('');
    const [csv, setCsv] = useState<CsvData | null>(null);

    const [genMode, setGenMode] = useState<'seq' | 'img'>('seq');
    const [seqCol, setSeqCol] = useState('编号');
    const [seqCount, setSeqCount] = useState(10);
    const [seqStart, setSeqStart] = useState(1);
    const [seqPrefix, setSeqPrefix] = useState('');
    const [seqSuffix, setSeqSuffix] = useState('');
    const [seqDigits, setSeqDigits] = useState(3);
    const [imgDir, setImgDir] = useState('');
    const [imgExts, setImgExts] = useState(['jpg', 'jpeg', 'png', 'tif', 'tiff', 'psd', 'ai', 'svg']);
    const [imgFiles, setImgFiles] = useState<string[]>([]);
    const [imgSeq, setImgSeq] = useState(false);

    const [scan, setScan] = useState<ScanResult | null>(null);
    const [scanning, setScanning] = useState(false);
    const [maps, setMaps] = useState<Mapping[]>([]);

    const [exp, setExp] = useState<ExportSettings>({ format: 'PDF', outputFolder: '', fileNamePattern: '{#}', dpi: 300 });
    const [textRules, setTextRules] = useState<TextStyleRule[]>([]);
    const [exMode, setExMode] = useState<'ds' | 'exp'>('exp');
    const [busy, setBusy] = useState(false);
    const [prog, setProg] = useState({ c: 0, t: 0 });
    const [msg, setMsg] = useState<{ t: '' | 'ok' | 'err' | 'info'; s: string }>({ t: '', s: '' });
    const [step, setStep] = useState<Step>('source');

    const mapped = maps.filter((item) => item.type !== 'UNMAPPED').length;
    const textColumns = maps.filter((item) => item.type === 'TEXTUAL').map((item) => item.column);

    const reset = useCallback(() => {
        setCsv(null);
        setScan(null);
        setMaps([]);
        setTextRules([]);
        setStep('source');
        setMsg({ t: '', s: '' });
        setProg({ c: 0, t: 0 });
    }, []);

    const cep = () => (window as any).cep?.fs;

    const buildTextRulePayload = useCallback(() => {
        const rules: Array<{
            column: string;
            matchMode: TextRuleMatchMode;
            pattern: string;
            applyColor: boolean;
            colorHex: string;
            applySize: boolean;
            sizePt?: number;
        }> = [];

        for (let i = 0; i < textRules.length; i++) {
            const rule = textRules[i];
            const pattern = String(rule.pattern || '').trim();
            const colorHex = String(rule.color || '').trim();
            const sizeValue = typeof rule.size === 'number' ? rule.size : parseFloat(String(rule.size || ''));

            if (!pattern) return { error: `第 ${i + 1} 条文字规则缺少匹配内容` };
            if (!rule.applyColor && !rule.applySize) return { error: `第 ${i + 1} 条文字规则至少要启用颜色或字号` };
            if (rule.applyColor && !isValidHexColor(colorHex)) return { error: `第 ${i + 1} 条文字规则颜色格式无效` };
            if (rule.applySize && !(sizeValue > 0)) return { error: `第 ${i + 1} 条文字规则字号必须大于 0` };

            rules.push({
                column: rule.column || ALL_TEXT_COLUMNS,
                matchMode: rule.matchMode,
                pattern,
                applyColor: rule.applyColor,
                colorHex,
                applySize: rule.applySize,
                sizePt: rule.applySize ? sizeValue : undefined,
            });
        }

        return { rules };
    }, [textRules]);

    const pickCSV = useCallback(() => {
        const fsApi = cep();
        if (!fsApi) return;

        const result = fsApi.showOpenDialogEx(false, false, '选择 CSV 文件', '', ['csv', 'tsv', 'txt'], undefined, false);
        if (result.err !== fsApi.NO_ERROR || !result.data?.length) return;

        const filePath = result.data[0];
        setCsvPath(filePath);
        setCsvDir(path.dirname(filePath));
        setCsvName(path.basename(filePath));

        try {
            const parsed = parseCSV(fs.readFileSync(filePath, 'utf8'));
            if (!parsed.headers.length) {
                setMsg({ t: 'err', s: 'CSV 为空或格式错误' });
                return;
            }
            setCsv(parsed);
            setStep('preview');
            setMsg({ t: '', s: '' });
        } catch (error: any) {
            setMsg({ t: 'err', s: `读取失败: ${error.message || error}` });
        }
    }, []);

    const pickImgDir = useCallback(() => {
        const fsApi = cep();
        if (!fsApi) return;

        const result = fsApi.showOpenDialogEx(false, true, '选择图片文件夹', '', [], undefined, false);
        if (result.err !== fsApi.NO_ERROR || !result.data?.length) return;

        const folder = result.data[0];
        setImgDir(folder);
        setImgFiles(scanImgFolder(folder, imgExts));
    }, [imgExts]);

    const generate = useCallback(() => {
        if (genMode === 'seq') {
            if (seqCount <= 0) {
                setMsg({ t: 'err', s: '数量必须大于 0' });
                return;
            }
            setCsv(genSeqCSV(seqCol, seqCount, seqStart, seqPrefix, seqSuffix, seqDigits));
        } else {
            if (!imgFiles.length) {
                setMsg({ t: 'err', s: '当前文件夹没有可用图片' });
                return;
            }
            setCsv(genImgCSV(imgFiles, imgSeq, seqCol, seqPrefix, seqSuffix, seqDigits, seqStart));
            setCsvDir(imgDir);
        }

        setCsvName('(已生成)');
        setStep('preview');
        setMsg({ t: '', s: '' });
    }, [genMode, imgDir, imgFiles, imgSeq, seqCol, seqCount, seqDigits, seqPrefix, seqStart, seqSuffix]);

    const saveCSV = useCallback(() => {
        if (!csv) return;

        const fsApi = cep();
        if (!fsApi) return;

        const result = fsApi.showSaveDialogEx('保存 CSV', '', ['csv'], '数据.csv');
        if (result.err !== fsApi.NO_ERROR || !result.data) return;

        try {
            fs.writeFileSync(result.data, csvStr(csv), 'utf8');
            setMsg({ t: 'ok', s: `已保存 ${path.basename(result.data)}` });
        } catch {
            setMsg({ t: 'err', s: '保存失败' });
        }
    }, [csv]);

    const doScan = useCallback(async () => {
        setScanning(true);
        setMsg({ t: '', s: '' });

        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'data-merge',
                scriptPath: './src/scripts/batch/data-merge.jsx',
                args: {
                    mode: 'scan',
                },
            });

            if (result.success && result.data) {
                const raw = result.data as any;
                const nextScan: ScanResult = {
                    textFrames: Array.isArray(raw.textFrames) ? raw.textFrames : [],
                    placedItems: Array.isArray(raw.placedItems) ? raw.placedItems : [],
                    namedItems: Array.isArray(raw.namedItems) ? raw.namedItems : [],
                };
                setScan(nextScan);
                if (csv) setMaps(autoMap(csv.headers, nextScan));
                setStep('mapping');

                const total = nextScan.textFrames.length + nextScan.placedItems.length + nextScan.namedItems.length;
                if (!total) {
                    setMsg({ t: 'err', s: '文档中未找到可绑定对象' });
                } else {
                    setMsg({ t: 'info', s: `找到 ${nextScan.textFrames.length} 个文本框，${nextScan.placedItems.length} 个图片，${nextScan.namedItems.length} 个命名对象` });
                }
            } else {
                setMsg({ t: 'err', s: result.error || '扫描失败' });
            }
        } catch (error: any) {
            setMsg({ t: 'err', s: error.message || '扫描出错' });
        } finally {
            setScanning(false);
        }
    }, [csv]);

    const changeMap = useCallback((columnIndex: number, value: string) => {
        if (!scan) return;

        setMaps((prev) => {
            const next = [...prev];
            if (value === '_') {
                next[columnIndex] = { ...next[columnIndex], target: '', type: 'UNMAPPED', targetName: '', targetIndex: -1 };
                return next;
            }

            const [type, rawIndex] = value.split(':');
            const targetIndex = Number(rawIndex);

            if (type === 'T') {
                const target = scan.textFrames[targetIndex];
                next[columnIndex] = { ...next[columnIndex], target: target.name || target.content, type: 'TEXTUAL', targetName: target.name, targetIndex: target.index };
            } else if (type === 'I') {
                const target = scan.placedItems[targetIndex];
                next[columnIndex] = { ...next[columnIndex], target: target.name || target.content, type: 'IMAGE', targetName: target.name, targetIndex: target.index };
            } else if (type === 'V') {
                const target = scan.namedItems[targetIndex];
                next[columnIndex] = { ...next[columnIndex], target: target.name, type: 'VISIBILITY', targetName: target.name, targetIndex: target.index };
            }

            return next;
        });
    }, [scan]);

    const pickFolder = useCallback(() => {
        const fsApi = cep();
        if (!fsApi) return;

        const result = fsApi.showOpenDialogEx(false, true, '选择输出文件夹', '', [], undefined, false);
        if (result.err === fsApi.NO_ERROR && result.data?.length) {
            setExp((prev) => ({ ...prev, outputFolder: result.data[0] }));
        }
    }, []);

    const doDatasets = useCallback(async () => {
        if (!csv) return;

        const textRuleState = buildTextRulePayload();
        const textRuleError = (textRuleState as any).error as string | undefined;
        if (textRuleError) {
            setMsg({ t: 'err', s: textRuleError });
            return;
        }

        setBusy(true);
        setMsg({ t: 'info', s: '正在创建数据集...' });

        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'data-merge',
                scriptPath: './src/scripts/batch/data-merge.jsx',
                args: {
                    mode: 'createDataSets',
                    mappings: maps.filter((item) => item.type !== 'UNMAPPED'),
                    csvData: csv.rows,
                    headers: csv.headers,
                    textStyleRules: textRuleState.rules,
                },
            });

            if (result.success) {
                const data = result.data as any;
                setMsg({ t: 'ok', s: `已创建 ${data?.datasetsCreated ?? '?'} 个数据集` });
            } else {
                setMsg({ t: 'err', s: result.error || '创建失败' });
            }
        } catch (error: any) {
            setMsg({ t: 'err', s: error.message || '执行出错' });
        } finally {
            setBusy(false);
        }
    }, [buildTextRulePayload, csv, maps]);

    const doExport = useCallback(async () => {
        if (!csv) return;

        const textRuleState = buildTextRulePayload();
        const textRuleError = (textRuleState as any).error as string | undefined;
        if (textRuleError) {
            setMsg({ t: 'err', s: textRuleError });
            return;
        }

        if (!exp.outputFolder) {
            setMsg({ t: 'err', s: '请先选择输出文件夹' });
            return;
        }

        setBusy(true);
        setProg({ c: 0, t: csv.rows.length });

        const bridge = await getBridge();
        const activeMappings = maps.filter((item) => item.type !== 'UNMAPPED');
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < csv.rows.length; i++) {
            setProg({ c: i + 1, t: csv.rows.length });
            setMsg({ t: 'info', s: `导出 ${i + 1} / ${csv.rows.length}` });

            try {
                const result = await bridge.executeScript({
                    scriptId: 'data-merge',
                    scriptPath: './src/scripts/batch/data-merge.jsx',
                    args: {
                        mode: 'exportSingle',
                        mappings: activeMappings,
                        rowData: csv.rows[i],
                        headers: csv.headers,
                        rowIndex: i,
                        exportSettings: exp,
                        csvDir,
                        textStyleRules: textRuleState.rules,
                    },
                });

                if (result.success) successCount++;
                else failCount++;
            } catch {
                failCount++;
            }
        }

        setBusy(false);
        setProg({ c: csv.rows.length, t: csv.rows.length });
        setMsg(failCount ? { t: 'err', s: `${successCount} 成功，${failCount} 失败` } : { t: 'ok', s: `导出完成，共 ${successCount} 个文件` });
    }, [buildTextRulePayload, csv, csvDir, exp, maps]);

    const updateRule = (ruleId: string, patch: Partial<TextStyleRule>) => {
        setTextRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
    };

    const removeRule = (ruleId: string) => {
        setTextRules((prev) => prev.filter((rule) => rule.id !== ruleId));
    };

    return (
        <div className="flex flex-col gap-sm">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                {STEPS.map((currentStep, index) => {
                    const currentIndex = STEPS.indexOf(step);
                    const done = index < currentIndex;
                    const active = index === currentIndex;

                    return (
                        <React.Fragment key={currentStep}>
                            <div
                                onClick={() => { if (done) setStep(currentStep); }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '3px',
                                    cursor: done ? 'pointer' : 'default',
                                    opacity: done ? 0.85 : 1,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        background: done || active ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                                        color: done || active ? '#fff' : 'var(--color-text-tertiary)',
                                        transition: 'var(--transition-fast)',
                                        outline: active ? '2px solid var(--color-accent)' : 'none',
                                        outlineOffset: '2px',
                                    }}
                                >
                                    {done ? '\u2713' : index + 1}
                                </div>
                                <span style={{ fontSize: '10px', whiteSpace: 'nowrap', color: done || active ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>
                                    {STEP_LABELS[currentStep]}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div style={{ flex: 1, height: '2px', marginTop: '10px', background: done ? 'var(--color-accent)' : 'var(--color-border)', transition: 'var(--transition-fast)' }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <Seg
                items={[{ key: 'file', label: '导入 CSV' }, { key: 'gen', label: '生成数据' }]}
                value={srcMode}
                onChange={(value) => {
                    setSrcMode(value as 'file' | 'gen');
                    reset();
                }}
            />

            {srcMode === 'file' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-sm" onClick={pickCSV}>选择文件</button>
                    <span className="text-sm" style={{ flex: 1, color: csvPath ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {csvName || '未选择'}
                    </span>
                    {csv && <Badge variant="accent">{csv.rows.length} 行</Badge>}
                </div>
            ) : (
                <div className="card" style={{ padding: 'var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    <Seg items={[{ key: 'seq', label: '序号生成' }, { key: 'img', label: '图片文件夹' }]} value={genMode} onChange={(value) => setGenMode(value as 'seq' | 'img')} />

                    {genMode === 'seq' ? (
                        <>
                            <Field label="列名"><input className="input" value={seqCol} onChange={(e) => setSeqCol(e.target.value)} style={{ height: '28px' }} /></Field>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <Field label="数量" style={{ flex: 1 }}><input className="input" type="number" value={seqCount} onChange={(e) => setSeqCount(Number(e.target.value) || 0)} style={{ height: '28px', textAlign: 'center' }} /></Field>
                                <Field label="起始" style={{ flex: 1 }}><input className="input" type="number" value={seqStart} onChange={(e) => setSeqStart(Number(e.target.value) || 0)} style={{ height: '28px', textAlign: 'center' }} /></Field>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <Field label="前缀" style={{ flex: 1 }}><input className="input" value={seqPrefix} onChange={(e) => setSeqPrefix(e.target.value)} placeholder="CARD-" style={{ height: '28px' }} /></Field>
                                <Field label="后缀" style={{ flex: 1 }}><input className="input" value={seqSuffix} onChange={(e) => setSeqSuffix(e.target.value)} style={{ height: '28px' }} /></Field>
                            </div>
                            <Field label="位数">
                                <input className="input" type="number" value={seqDigits} min={1} max={10} onChange={(e) => setSeqDigits(Number(e.target.value) || 1)} style={{ width: '50px', height: '28px', textAlign: 'center' }} />
                                <Badge>{`${seqPrefix}${pad(seqStart, seqDigits)}${seqSuffix}`}</Badge>
                            </Field>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <button className="btn btn-sm" onClick={pickImgDir}>选择文件夹</button>
                                <span className="text-sm" style={{ flex: 1, color: imgDir ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {imgDir ? path.basename(imgDir) : '未选择'}
                                </span>
                                {imgFiles.length > 0 && <Badge variant="accent">{imgFiles.length} 文件</Badge>}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                {['jpg', 'png', 'tif', 'psd', 'ai', 'svg'].map((ext) => {
                                    const enabled = imgExts.includes(ext);
                                    return (
                                        <button
                                            key={ext}
                                            onClick={() => {
                                                const alias = ext === 'jpg' ? ['jpeg'] : ext === 'tif' ? ['tiff'] : [];
                                                const next = enabled ? imgExts.filter((item) => item !== ext && !alias.includes(item)) : [...imgExts, ext, ...alias];
                                                setImgExts(next);
                                                if (imgDir) setImgFiles(scanImgFolder(imgDir, next));
                                            }}
                                            style={{
                                                padding: '1px 6px',
                                                fontSize: '10px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                border: 'none',
                                                background: enabled ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                                                color: enabled ? '#fff' : 'var(--color-text-tertiary)',
                                                transition: 'var(--transition-fast)',
                                            }}
                                        >
                                            .{ext}
                                        </button>
                                    );
                                })}
                            </div>

                            {imgFiles.length > 0 && (
                                <div style={{ maxHeight: '64px', overflow: 'auto', fontSize: '10px', color: 'var(--color-text-tertiary)', lineHeight: 1.6, padding: '4px 8px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                    {imgFiles.slice(0, 6).map((file) => <div key={file} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path.basename(file)}</div>)}
                                    {imgFiles.length > 6 && <div>...等 {imgFiles.length - 6} 个</div>}
                                </div>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={imgSeq} onChange={(e) => setImgSeq(e.target.checked)} />
                                添加序号列
                            </label>

                            {imgSeq && (
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <Field label="前缀" style={{ flex: 1 }}><input className="input" value={seqPrefix} onChange={(e) => setSeqPrefix(e.target.value)} style={{ height: '28px' }} /></Field>
                                    <Field label="位数" style={{ flex: 1 }}><input className="input" type="number" value={seqDigits} min={1} max={10} onChange={(e) => setSeqDigits(Number(e.target.value) || 1)} style={{ width: '50px', height: '28px', textAlign: 'center' }} /></Field>
                                </div>
                            )}
                        </>
                    )}

                    <button className="btn btn-primary btn-sm w-full" onClick={generate}>生成数据</button>
                </div>
            )}

            {step !== 'source' && csv && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            数据预览 <span style={{ fontWeight: 400, opacity: 0.7 }}>{csv.headers.length} 列 / {csv.rows.length} 行</span>
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {srcMode === 'gen' && <button className="btn btn-sm" onClick={saveCSV} style={{ padding: '2px 8px' }}>保存</button>}
                            <button className="btn btn-sm" onClick={reset} style={{ padding: '2px 8px' }}>重置</button>
                        </div>
                    </div>

                    <div style={{ overflow: 'auto', maxHeight: '110px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-tertiary)', position: 'sticky', top: 0, zIndex: 1 }}>
                                    {csv.headers.map((header) => <th key={header} style={{ padding: '5px 8px', textAlign: 'left', whiteSpace: 'nowrap', color: 'var(--color-accent)', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>{header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {csv.rows.slice(0, 5).map((row, rowIndex) => (
                                    <tr key={`${rowIndex}-${row.join('|')}`} style={{ background: rowIndex % 2 ? 'var(--color-bg-secondary)' : 'transparent' }}>
                                        {csv.headers.map((_, columnIndex) => <td key={`${rowIndex}-${columnIndex}`} style={{ padding: '3px 8px', whiteSpace: 'nowrap', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '1px solid var(--color-border)' }}>{row[columnIndex] || ''}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {step === 'preview' && csv && (
                <button className="btn btn-primary w-full" onClick={doScan} disabled={scanning} style={{ height: '36px', gap: '6px' }}>
                    {scanning ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />扫描中...</> : '扫描文档对象'}
                </button>
            )}

            {(step === 'mapping' || step === 'execute') && scan && csv && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>列映射 <Badge variant={mapped ? 'success' : ''}>{mapped}/{maps.length}</Badge></span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '160px', overflowY: 'auto' }}>
                        {maps.map((mapping, index) => {
                            let value = '_';
                            if (mapping.type === 'TEXTUAL') {
                                const targetIndex = scan.textFrames.findIndex((item) => item.name === mapping.targetName && item.index === mapping.targetIndex);
                                if (targetIndex >= 0) value = `T:${targetIndex}`;
                            } else if (mapping.type === 'IMAGE') {
                                const targetIndex = scan.placedItems.findIndex((item) => item.name === mapping.targetName && item.index === mapping.targetIndex);
                                if (targetIndex >= 0) value = `I:${targetIndex}`;
                            } else if (mapping.type === 'VISIBILITY') {
                                const targetIndex = scan.namedItems.findIndex((item) => item.name === mapping.targetName);
                                if (targetIndex >= 0) value = `V:${targetIndex}`;
                            }

                            return (
                                <div key={`${mapping.column}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)' }}>
                                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, minWidth: '50px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: mapping.type === 'TEXTUAL' ? 'var(--color-accent)' : mapping.type === 'IMAGE' ? 'var(--color-warning)' : mapping.type === 'VISIBILITY' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                                        {mapping.column}
                                    </span>
                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0, opacity: 0.6 }}><path d="M3 6h6M7 4l2 2-2 2" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" /></svg>
                                    <select className="select" value={value} onChange={(e) => changeMap(index, e.target.value)} style={{ flex: 1, fontSize: '11px', padding: '2px 6px', minHeight: '26px', height: '26px' }}>
                                        <option value="_">-- 未映射 --</option>
                                        {scan.textFrames.length > 0 && <optgroup label="文本框">{scan.textFrames.map((item, itemIndex) => <option key={`T:${itemIndex}`} value={`T:${itemIndex}`}>{item.name || `"${item.content}"`}</option>)}</optgroup>}
                                        {scan.placedItems.length > 0 && <optgroup label="图片">{scan.placedItems.map((item, itemIndex) => <option key={`I:${itemIndex}`} value={`I:${itemIndex}`}>{item.name || item.content}</option>)}</optgroup>}
                                        {scan.namedItems.length > 0 && <optgroup label="显隐对象">{scan.namedItems.map((item, itemIndex) => <option key={`V:${itemIndex}`} value={`V:${itemIndex}`}>{item.name}</option>)}</optgroup>}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {step === 'mapping' && mapped > 0 && (
                <button className="btn btn-primary w-full" onClick={() => setStep('execute')} style={{ height: '36px' }}>
                    下一步
                </button>
            )}

            {step === 'execute' && (
                <>
                    <Seg items={[{ key: 'ds', label: '创建数据集' }, { key: 'exp', label: '批量导出' }]} value={exMode} onChange={(value) => setExMode(value as 'ds' | 'exp')} />

                    {textColumns.length > 0 && (
                        <div className="card" style={{ padding: 'var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>文字样式规则</span>
                                    {textRules.length > 0 && <Badge variant="accent">{textRules.length} 条</Badge>}
                                </div>
                                <button className="btn btn-sm" onClick={() => setTextRules((prev) => [...prev, createTextStyleRule()])}>添加规则</button>
                            </div>
                            <div style={{ fontSize: '10px', lineHeight: 1.6, color: 'var(--color-text-tertiary)' }}>
                                仅对保持可编辑文字的内容生效。支持精确匹配单个汉字或词语，也支持正则匹配数字、字母等。规则按从上到下执行，后面的规则会覆盖前面的颜色和字号。
                            </div>

                            {textRules.length === 0 ? (
                                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', background: 'var(--color-bg-secondary)' }}>
                                    未设置规则时，文本保持模板原样。
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {textRules.map((rule, index) => (
                                        <div key={rule.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>规则 {index + 1}</span>
                                                <select className="select" value={rule.column} onChange={(e) => updateRule(rule.id, { column: e.target.value })} style={{ flex: 1, minWidth: 0, fontSize: '11px', minHeight: '28px' }}>
                                                    <option value={ALL_TEXT_COLUMNS}>全部文字列</option>
                                                    {textColumns.map((column) => <option key={column} value={column}>{column}</option>)}
                                                </select>
                                                <select className="select" value={rule.matchMode} onChange={(e) => updateRule(rule.id, { matchMode: e.target.value as TextRuleMatchMode })} style={{ width: '90px', fontSize: '11px', minHeight: '28px' }}>
                                                    <option value="exact">精确匹配</option>
                                                    <option value="regex">正则匹配</option>
                                                </select>
                                                <button className="btn btn-sm" onClick={() => removeRule(rule.id)}>删除</button>
                                            </div>

                                            <input className="input" value={rule.pattern} onChange={(e) => updateRule(rule.id, { pattern: e.target.value })} placeholder={rule.matchMode === 'regex' ? '例如 [0-9]+ 或 [A-Za-z]+' : '例如 单字、词语、SKU'} style={{ height: '28px' }} />

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={rule.applyColor} onChange={(e) => updateRule(rule.id, { applyColor: e.target.checked })} />
                                                    颜色
                                                </label>
                                                {rule.applyColor && (
                                                    <>
                                                        <input type="color" value={isValidHexColor(rule.color) ? rule.color : '#ff0000'} onChange={(e) => updateRule(rule.id, { color: e.target.value })} style={{ width: '34px', height: '28px', padding: 0, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'transparent' }} />
                                                        <input className="input" value={rule.color} onChange={(e) => updateRule(rule.id, { color: e.target.value })} placeholder="#FF0000" style={{ width: '96px', height: '28px' }} />
                                                    </>
                                                )}

                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={rule.applySize} onChange={(e) => updateRule(rule.id, { applySize: e.target.checked })} />
                                                    字号
                                                </label>
                                                {rule.applySize && (
                                                    <input className="input" type="number" value={rule.size} min={0.1} step={0.1} onChange={(e) => updateRule(rule.id, { size: e.target.value === '' ? '' : parseFloat(e.target.value) })} placeholder="12" style={{ width: '80px', height: '28px' }} />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {exMode === 'exp' && (
                        <div className="card" style={{ padding: 'var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <Field label="格式"><Seg items={[{ key: 'PDF', label: 'PDF' }, { key: 'PNG', label: 'PNG' }, { key: 'JPG', label: 'JPG' }]} value={exp.format} onChange={(value) => setExp((prev) => ({ ...prev, format: value as ExportSettings['format'] }))} /></Field>
                            {exp.format !== 'PDF' && <Field label="DPI"><input className="input" type="number" value={exp.dpi} onChange={(e) => setExp((prev) => ({ ...prev, dpi: Number(e.target.value) || 300 }))} style={{ width: '70px', height: '28px', textAlign: 'center' }} /></Field>}
                            <Field label="文件夹">
                                <button className="btn btn-sm" onClick={pickFolder} style={{ padding: '2px 10px' }}>选择</button>
                                <span className="text-sm" style={{ flex: 1, color: exp.outputFolder ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {exp.outputFolder ? path.basename(exp.outputFolder) : '未选择'}
                                </span>
                            </Field>
                            <Field label="文件名"><input className="input" value={exp.fileNamePattern} onChange={(e) => setExp((prev) => ({ ...prev, fileNamePattern: e.target.value }))} placeholder="{#}" style={{ flex: 1, height: '28px' }} /></Field>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', paddingLeft: '44px' }}>{'{#}'} 表示行号，{'{列名}'} 表示对应单元格内容</div>
                        </div>
                    )}

                    {busy && prog.t > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.round((prog.c / prog.t) * 100)}%`, height: '100%', background: 'var(--color-accent)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                            </div>
                            <div style={{ fontSize: '10px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>{prog.c} / {prog.t} ({Math.round((prog.c / prog.t) * 100)}%)</div>
                        </div>
                    )}

                    <button className="btn btn-primary w-full" onClick={exMode === 'ds' ? doDatasets : doExport} disabled={busy} style={{ height: '36px', fontSize: 'var(--font-size-md)', fontWeight: 600, gap: '6px' }}>
                        {busy ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />处理中...</> : exMode === 'ds' ? '创建数据集' : `导出 ${csv?.rows.length || 0} 个文件`}
                    </button>
                </>
            )}

            {msg.s && <div className={msg.t === 'err' ? 'alert alert-error' : msg.t === 'ok' ? 'alert alert-success' : 'alert alert-info'} style={{ padding: '8px 12px', marginBottom: 0, fontSize: 'var(--font-size-xs)' }}>{msg.s}</div>}
        </div>
    );
};
