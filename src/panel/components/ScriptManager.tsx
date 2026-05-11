import React, { useCallback, useEffect, useMemo, useState } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { getBridge } from '@bridge';
import { Icon } from './Icon';
import { useSettings } from '../hooks/useSettings';

const getUploadDir = (): string => {
    const base = process.platform === 'win32'
        ? path.join(process.env.APPDATA ?? os.homedir(), 'HopeFlow')
        : path.join(os.homedir(), 'Library', 'Application Support', 'HopeFlow');
    return path.join(base, 'UserScripts');
};

const UPLOAD_DIR = getUploadDir();
const SCRIPT_EXTENSIONS = new Set(['.jsx', '.js', '.jsxbin']);

interface ManagedScript {
    name: string;
    path: string;
    source: 'folder' | 'uploaded';
    folderName?: string;
    mtime?: number;
}

const isScriptFile = (filePath: string) => SCRIPT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
const normalizeScriptName = (filePath: string) => path.basename(filePath, path.extname(filePath));
const toExtendScriptString = (value: string) => JSON.stringify(value.replace(/\\/g, '/'));

const createEvalFileLauncher = (scriptPath: string) => `
var __USER_SCRIPT_FILE__ = File(${toExtendScriptString(scriptPath)});
if (!__USER_SCRIPT_FILE__.exists) {
    throw new Error("Script file not found: " + __USER_SCRIPT_FILE__.fsName);
}
$.evalFile(__USER_SCRIPT_FILE__);
`;

const ensureUploadDir = () => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
};

const makeUniqueUploadPath = (sourcePath: string) => {
    ensureUploadDir();
    const ext = path.extname(sourcePath);
    const base = normalizeScriptName(sourcePath).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') || 'script';
    let target = path.join(UPLOAD_DIR, `${base}${ext}`);
    let index = 2;
    while (fs.existsSync(target)) {
        target = path.join(UPLOAD_DIR, `${base}-${index}${ext}`);
        index += 1;
    }
    return target;
};

const copyWithPowerShell = (text: string) => new Promise<void>((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-Command', 'Set-Clipboard -Value $args[0]', text], (error) => {
        if (error) reject(error);
        else resolve();
    });
});

function scanFolder(folderPath: string, folderName: string, depth = 0): ManagedScript[] {
    if (depth > 6) return [];
    try {
        return fs.readdirSync(folderPath).flatMap((entry) => {
            const fullPath = path.join(folderPath, entry);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) return scanFolder(fullPath, folderName, depth + 1);
                if (!stat.isFile() || !isScriptFile(fullPath)) return [];
                return [{ name: normalizeScriptName(fullPath), path: fullPath, source: 'folder' as const, folderName, mtime: stat.mtimeMs }];
            } catch {
                return [];
            }
        });
    } catch {
        return [];
    }
}

export const ScriptManager: React.FC = () => {
    const { settings, update } = useSettings();
    const scriptFolders = settings.scriptFolders || [];
    const uploadedScripts = settings.uploadedScripts || [];
    const executedScriptPaths = settings.executedScriptPaths || [];

    const [scripts, setScripts] = useState<ManagedScript[]>([]);
    const [query, setQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [runningPath, setRunningPath] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [sourcesOpen, setSourcesOpen] = useState(true);
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);

    const refreshScripts = useCallback(() => {
        setIsScanning(true);
        try {
            const fromFolders = scriptFolders.flatMap((folder) => scanFolder(folder.path, folder.name));
            const fromUploads = uploadedScripts
                .filter((s) => fs.existsSync(s.path) && isScriptFile(s.path))
                .map((s) => {
                    let mtime = 0;
                    try { mtime = fs.statSync(s.path).mtimeMs; } catch { }
                    return { ...s, source: 'uploaded' as const, mtime };
                });
            const unique = new Map<string, ManagedScript>();
            [...fromUploads, ...fromFolders].forEach((s) => unique.set(s.path, s));
            setScripts(Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name)));
        } finally {
            setIsScanning(false);
        }
    }, [scriptFolders, uploadedScripts]);

    useEffect(() => { refreshScripts(); }, [refreshScripts]);

    const filteredScripts = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return scripts;
        return scripts.filter((s) =>
            s.name.toLowerCase().includes(q) ||
            s.path.toLowerCase().includes(q) ||
            (s.folderName || '').toLowerCase().includes(q)
        );
    }, [query, scripts]);

    const markExecuted = (scriptPath: string) => {
        if (!executedScriptPaths.includes(scriptPath)) {
            update('executedScriptPaths', [...executedScriptPaths, scriptPath]);
        }
    };

    const chooseFolder = () => {
        const cep = (window as any).cep;
        if (!cep?.fs) { window.alert('当前环境不支持目录选择。'); return; }
        const result = cep.fs.showOpenDialog(false, true, '选择脚本文件夹', '', null);
        if (result.err !== cep.fs.NO_ERROR || !Array.isArray(result.data) || result.data.length === 0) return;
        const folderPath = String(result.data[0] || '');
        if (!folderPath || scriptFolders.some((f) => f.path === folderPath)) return;
        update('scriptFolders', [...scriptFolders, { name: path.basename(folderPath) || '脚本文件夹', path: folderPath }]);
    };

    const uploadScript = () => {
        const cep = (window as any).cep;
        if (!cep?.fs) { window.alert('当前环境不支持脚本上传。'); return; }
        const result = cep.fs.showOpenDialog(true, false, '选择要上传的脚本', '', null);
        if (result.err !== cep.fs.NO_ERROR || !Array.isArray(result.data) || result.data.length === 0) return;

        const nextUploads = [...uploadedScripts];
        const rejected: string[] = [];
        result.data.forEach((item: string) => {
            const sourcePath = String(item || '');
            if (!sourcePath || !isScriptFile(sourcePath) || !fs.existsSync(sourcePath)) {
                rejected.push(path.basename(sourcePath || 'unknown'));
                return;
            }
            const targetPath = makeUniqueUploadPath(sourcePath);
            fs.copyFileSync(sourcePath, targetPath);
            nextUploads.push({ name: normalizeScriptName(targetPath), path: targetPath });
        });
        update('uploadedScripts', nextUploads);
        setMessage(rejected.length
            ? { type: 'error', text: `已跳过非脚本文件：${rejected.join(', ')}` }
            : { type: 'success', text: `成功上传 ${result.data.length - rejected.length} 个脚本。` }
        );
    };

    const removeFolder = (folderPath: string) => {
        update('scriptFolders', scriptFolders.filter((f) => f.path !== folderPath));
    };

    const removeUploadedScript = (scriptPath: string) => {
        try {
            if (scriptPath.startsWith(UPLOAD_DIR) && fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
        } catch { }
        update('uploadedScripts', uploadedScripts.filter((s) => s.path !== scriptPath));
    };

    const runScript = async (script: ManagedScript) => {
        setMessage(null);
        setRunningPath(script.path);
        markExecuted(script.path);
        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: `custom:${script.name}`,
                scriptContent: createEvalFileLauncher(script.path),
                args: {},
            });
            if (!result.success) {
                setMessage({ type: 'error', text: result.error || '脚本执行失败。' });
                return;
            }
            setMessage({ type: 'success', text: `${script.name} 执行完成。` });
        } catch (error: any) {
            setMessage({ type: 'error', text: error?.message || '脚本执行失败。' });
        } finally {
            setRunningPath(null);
        }
    };

    const copyScriptPath = async (scriptPath: string) => {
        try {
            if (navigator.clipboard?.writeText && window.isSecureContext) {
                await navigator.clipboard.writeText(scriptPath);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = scriptPath;
                Object.assign(textarea.style, { position: 'fixed', left: '-9999px', opacity: '0' });
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                const copied = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (!copied) await copyWithPowerShell(scriptPath);
            }
            setMessage({ type: 'success', text: '脚本路径已复制。' });
        } catch {
            try {
                await copyWithPowerShell(scriptPath);
                setMessage({ type: 'success', text: '脚本路径已复制。' });
            } catch {
                setMessage({ type: 'error', text: `复制失败，请手动复制：${scriptPath}` });
            }
        }
    };

    const handleScriptClick = (event: React.MouseEvent, script: ManagedScript) => {
        if (runningPath) return;
        if (event.altKey) { copyScriptPath(script.path); return; }
        runScript(script);
    };

    const hasAnySources = scriptFolders.length > 0 || uploadedScripts.length > 0;

    const sourcesLabel = hasAnySources
        ? `脚本来源 (${scriptFolders.length} 个文件夹${uploadedScripts.length > 0 ? ` · ${uploadedScripts.length} 个上传` : ''})`
        : '脚本来源';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>

            {/* Header */}
            <div style={{ padding: '10px 12px 10px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>脚本管理器</div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn btn-sm btn-primary" type="button" onClick={chooseFolder}>
                            <Icon name="folder" size={12} />
                            添加文件夹
                        </button>
                        <button className="btn btn-sm" type="button" onClick={uploadScript}>
                            上传脚本
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <input
                        className="input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="搜索脚本名称或来源..."
                        style={{ flex: 1, height: 30, fontSize: 'var(--font-size-sm)', padding: '0 10px' }}
                    />
                    <button
                        className="btn btn-sm"
                        type="button"
                        onClick={refreshScripts}
                        disabled={isScanning}
                        title="刷新脚本列表"
                        style={{ width: 30, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Icon
                            name="refresh"
                            size={13}
                            style={isScanning ? { animation: 'spin 0.8s linear infinite' } : undefined}
                        />
                    </button>
                </div>
                {message && (
                    <div
                        className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}
                        style={{ marginTop: 8, marginBottom: 0, padding: '6px 10px', fontSize: 11, wordBreak: 'break-all', lineHeight: 1.45 }}
                    >
                        {message.text}
                    </div>
                )}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Collapsible sources */}
                <div style={{ borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                    <button
                        type="button"
                        onClick={() => setSourcesOpen((v) => !v)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 12px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-tertiary)',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                        }}
                    >
                        <span>{sourcesLabel}</span>
                        <svg viewBox="0 0 24 24" width={11} height={11} style={{ transform: sourcesOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms ease', flexShrink: 0 }}>
                            <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {sourcesOpen && (
                        <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {!hasAnySources ? (
                                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, lineHeight: 1.5 }}>
                                    还没有添加脚本来源。点击「添加文件夹」或「上传脚本」开始。
                                </div>
                            ) : (
                                <>
                                    {scriptFolders.map((folder) => (
                                        <div
                                            key={folder.path}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                background: 'var(--color-bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: '6px 8px',
                                            }}
                                        >
                                            <Icon name="folder" size={13} color="#FFCF4D" />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 11 }}>{folder.name}</div>
                                                <div
                                                    style={{ fontSize: 10, color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    title={folder.path}
                                                >
                                                    {folder.path}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFolder(folder.path)}
                                                style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 11, padding: '2px 4px', flexShrink: 0, opacity: 0.8 }}
                                            >
                                                移除
                                            </button>
                                        </div>
                                    ))}
                                    {uploadedScripts.length > 0 && (
                                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', paddingLeft: 2 }}>
                                            已上传 {uploadedScripts.length} 个脚本（存储于本地应用数据目录）
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Script list */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {filteredScripts.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                            <Icon name="code" size={36} style={{ opacity: 0.2 }} />
                            <div style={{ fontSize: 12, fontWeight: 500 }}>
                                {isScanning ? '正在扫描...' : query ? `没有匹配「${query}」的脚本` : '暂无可运行脚本'}
                            </div>
                            {!isScanning && !query && (
                                <div style={{ fontSize: 11, maxWidth: 200, lineHeight: 1.6, opacity: 0.7 }}>
                                    添加脚本文件夹，或上传 .jsx / .js 脚本文件，即可在此一键运行。
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ padding: '6px 0' }}>
                            {filteredScripts.map((script) => {
                                const hasExecuted = executedScriptPaths.includes(script.path);
                                const isRunning = runningPath === script.path;
                                const isHovered = hoveredPath === script.path && !runningPath;
                                const ext = path.extname(script.path).replace('.', '').toUpperCase();

                                return (
                                    <div
                                        key={script.path}
                                        onClick={(e) => handleScriptClick(e, script)}
                                        onMouseEnter={() => setHoveredPath(script.path)}
                                        onMouseLeave={() => setHoveredPath(null)}
                                        title={`点击运行 · Alt+点击复制路径\n${script.path}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '7px 12px',
                                            cursor: isRunning ? 'wait' : runningPath ? 'default' : 'pointer',
                                            background: isRunning
                                                ? 'var(--color-accent-soft)'
                                                : isHovered
                                                    ? 'var(--color-bg-hover)'
                                                    : 'transparent',
                                            borderLeft: `2px solid ${hasExecuted ? 'var(--color-success)' : 'transparent'}`,
                                            transition: 'background var(--transition-fast)',
                                        }}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: 'var(--radius-md)',
                                            background: isRunning
                                                ? 'rgba(75,156,255,0.2)'
                                                : hasExecuted
                                                    ? 'rgba(57,181,138,0.15)'
                                                    : 'rgba(99,102,241,0.12)',
                                            color: isRunning
                                                ? 'var(--color-accent)'
                                                : hasExecuted
                                                    ? 'var(--color-success)'
                                                    : '#818CF8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {isRunning
                                                ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} />
                                                : <Icon name={hasExecuted ? 'check' : 'code'} size={13} />
                                            }
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                                                <span
                                                    style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    title={script.name}
                                                >
                                                    {script.name}
                                                </span>
                                                {hasExecuted && (
                                                    <span
                                                        className="badge"
                                                        style={{ fontSize: 9, padding: '1px 5px', flexShrink: 0, background: 'rgba(57,181,138,0.18)', color: 'var(--color-success)', border: '1px solid rgba(57,181,138,0.35)' }}
                                                    >
                                                        已运行
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 10, color: isRunning ? 'var(--color-accent)' : 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {isRunning
                                                    ? '运行中...'
                                                    : `${script.source === 'uploaded' ? '已上传' : (script.folderName || '文件夹')} · ${ext}`
                                                }
                                            </div>
                                        </div>

                                        {/* Delete button (uploaded only) */}
                                        {script.source === 'uploaded' && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeUploadedScript(script.path); }}
                                                title="删除此脚本"
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: isHovered ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                                                    cursor: 'pointer',
                                                    padding: '3px 5px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: 13,
                                                    lineHeight: 1,
                                                    flexShrink: 0,
                                                    opacity: isHovered ? 1 : 0.4,
                                                    transition: 'color var(--transition-fast), opacity var(--transition-fast)',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '5px 12px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--color-text-tertiary)',
                flexShrink: 0,
            }}>
                <span>{isScanning ? '扫描中...' : '就绪'}</span>
                {filteredScripts.length > 0 && <span>{filteredScripts.length} 个脚本</span>}
            </div>
        </div>
    );
};
