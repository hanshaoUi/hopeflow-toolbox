import React, { useState } from 'react';
import fs from 'fs';
import { getBridge } from '@bridge';

function getPdfPageCount(filePath: string): number {
    try {
        const buffer = fs.readFileSync(filePath);
        const text = buffer.toString('latin1');
        let maxCount = 0;

        // Method 1: Find PDF objects containing /Type /Pages and extract /Count
        const objRegex = /\d+\s+\d+\s+obj([\s\S]*?)endobj/g;
        let m;
        while ((m = objRegex.exec(text)) !== null) {
            const body = m[1];
            if (/\/Type\s*\/Pages/.test(body)) {
                const c = body.match(/\/Count\s+(\d+)/);
                if (c) maxCount = Math.max(maxCount, parseInt(c[1]));
            }
        }
        if (maxCount > 0) return maxCount;

        // Method 2: Fallback — grab max /Count value across the entire file
        const allCounts = text.match(/\/Count\s+(\d+)/g);
        if (allCounts) {
            allCounts.forEach(s => {
                const c = s.match(/\/Count\s+(\d+)/);
                if (c) maxCount = Math.max(maxCount, parseInt(c[1]));
            });
        }
        if (maxCount > 0) return maxCount;

        // Method 3: Fallback — count individual /Type /Page (singular) entries
        const pages = text.match(/\/Type\s*\/Page\b(?!s)/g);
        if (pages) return pages.length;

        return 1;
    } catch {
        return 1;
    }
}

export const OpenPDF: React.FC = () => {
    const [filePath, setFilePath] = useState('');
    const [fileName, setFileName] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [fromPage, setFromPage] = useState(1);
    const [toPage, setToPage] = useState(1);
    const [status, setStatus] = useState<'idle' | 'executing' | 'done' | 'error'>('idle');
    const [statusText, setStatusText] = useState('');

    const handleSelectFile = () => {
        const win = window as any;
        if (win.cep && win.cep.fs) {
            const result = win.cep.fs.showOpenDialogEx(false, false, "选择 PDF 文件", "", ["pdf"], undefined, false);
            if (result.err === win.cep.fs.NO_ERROR && result.data && result.data.length > 0) {
                const selected = result.data[0];
                setFilePath(selected);
                setFileName(selected.split('/').pop() || selected);
                const pages = getPdfPageCount(selected);
                setTotalPages(pages);
                setFromPage(1);
                setToPage(pages);
                setStatus('idle');
                setStatusText('');
            }
        }
    };

    const handleExecute = async () => {
        if (!filePath) {
            setStatus('error');
            setStatusText('请先选择 PDF 文件');
            return;
        }
        if (fromPage < 1 || toPage < fromPage) {
            setStatus('error');
            setStatusText('请输入有效的页码范围');
            return;
        }
        setStatus('executing');
        setStatusText(`正在打开第 ${fromPage}-${toPage} 页...`);
        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'open-pdf',
                scriptPath: './src/scripts/images/open-pdf.jsx',
                args: { filePath, fromPage, toPage },
            });
            if (result.success) {
                const pages = (result.data as any)?.pages || (toPage - fromPage + 1);
                setStatus('done');
                setStatusText(`成功打开 ${pages} 页`);
            } else {
                setStatus('error');
                setStatusText(result.error || '执行失败');
            }
        } catch (e: any) {
            setStatus('error');
            setStatusText(e.message || '执行出错');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* File picker */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                <button
                    className="btn btn-sm"
                    onClick={handleSelectFile}
                    style={{
                        whiteSpace: 'nowrap',
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '4px 10px',
                        fontSize: '12px',
                    }}
                >
                    选择文件
                </button>
                <span style={{
                    flex: 1,
                    fontSize: '11px',
                    color: filePath ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {fileName || '未选择文件'}
                </span>
                {totalPages > 0 && (
                    <span style={{
                        fontSize: '11px',
                        color: 'var(--color-accent)',
                        whiteSpace: 'nowrap',
                    }}>
                        共 {totalPages} 页
                    </span>
                )}
            </div>

            {/* Page range */}
            {totalPages > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>从</span>
                    <input
                        type="number"
                        className="input"
                        min={1}
                        max={totalPages}
                        value={fromPage}
                        onChange={e => setFromPage(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '50px', height: '26px', fontSize: '12px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>到</span>
                    <input
                        type="number"
                        className="input"
                        min={1}
                        max={totalPages}
                        value={toPage}
                        onChange={e => setToPage(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '50px', height: '26px', fontSize: '12px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>页</span>
                </div>
            )}

            {/* Execute button */}
            {totalPages > 0 && (
                <button
                    className="btn btn-sm btn-primary"
                    onClick={handleExecute}
                    disabled={status === 'executing'}
                    style={{
                        width: '100%',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 0',
                        fontSize: '12px',
                    }}
                >
                    {status === 'executing' ? '执行中...' : '打开 PDF'}
                </button>
            )}

            {/* Status */}
            {statusText && (
                <div style={{
                    fontSize: '11px',
                    color: status === 'error' ? 'var(--color-error)' : status === 'done' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    textAlign: 'center',
                }}>
                    {statusText}
                </div>
            )}
        </div>
    );
};
