import React, { useCallback, useEffect, useMemo, useState } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { getBridge } from '@bridge';
import { Icon } from './Icon';
import { useSettings, ScriptMetaEntry } from '../hooks/useSettings';

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
    description?: string;
}

const normalizeCepPath = (rawPath: string): string => {
    const value = String(rawPath || '').trim();
    if (!value) return '';

    if (/^file:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            const pathname = decodeURIComponent(url.pathname);
            if (process.platform === 'win32' && /^\/[A-Za-z]:\//.test(pathname)) {
                return pathname.slice(1);
            }
            return pathname;
        } catch {
            const stripped = value.replace(/^file:\/\/(?:localhost)?/i, '');
            try { return decodeURIComponent(stripped); } catch { return stripped; }
        }
    }

    return value;
};

const isScriptFile = (filePath: string) => SCRIPT_EXTENSIONS.has(path.extname(normalizeCepPath(filePath)).toLowerCase());
const normalizeScriptName = (filePath: string) => path.basename(filePath, path.extname(filePath));
const toExtendScriptString = (value: string) => JSON.stringify(value.replace(/\\/g, '/'));

const getDisplayName = (filePath: string, fallback: string) => {
    const base = path.basename(filePath);
    return base || fallback;
};

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

const readDescription = (filePath: string): string => {
    if (path.extname(filePath).toLowerCase() === '.jsxbin') return '';
    try {
        const content = fs.readFileSync(filePath, { encoding: 'utf-8' }).slice(0, 2000);
        const descMatch = content.match(/@description[:\s]+(.+)/i);
        if (descMatch) return descMatch[1].trim();
        for (const line of content.split('\n').slice(0, 20)) {
            const m = line.trim().match(/^\/\/\s*(.{4,80})/);
            if (m && !/^[@!#]/.test(m[1])) return m[1].trim();
        }
        return '';
    } catch { return ''; }
};

function scanFolder(folderPath: string, folderName: string, depth = 0): ManagedScript[] {
    if (depth > 6) return [];
    const normalizedFolderPath = normalizeCepPath(folderPath);
    if (!normalizedFolderPath) return [];
    try {
        return fs.readdirSync(normalizedFolderPath).flatMap((entry) => {
            const fullPath = path.join(normalizedFolderPath, entry);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) return scanFolder(fullPath, folderName, depth + 1);
                if (!stat.isFile() || !isScriptFile(fullPath)) return [];
                return [{
                    name: normalizeScriptName(fullPath),
                    path: fullPath,
                    source: 'folder' as const,
                    folderName,
                    mtime: stat.mtimeMs,
                    description: readDescription(fullPath),
                }];
            } catch { return []; }
        });
    } catch { return []; }
}

// ---- Context menu item ----
const CtxMenuItem: React.FC<{
    icon: string;
    label: string;
    onClick: () => void;
    danger?: boolean;
}> = ({ icon, label, onClick, danger }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                color: danger ? 'var(--color-error)' : 'var(--color-text-primary)',
                background: hovered ? 'var(--color-bg-hover)' : 'transparent',
                userSelect: 'none',
            }}
        >
            <Icon name={icon} size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
            <span>{label}</span>
        </div>
    );
};

interface ContextMenuState {
    x: number;
    y: number;
    script: ManagedScript;
}

export const ScriptManager: React.FC = () => {
    const { settings, update } = useSettings();
    const scriptFolders = useMemo(() => {
        const unique = new Map<string, { name: string; path: string }>();
        (settings.scriptFolders || []).forEach((folder) => {
            const folderPath = normalizeCepPath(folder.path);
            if (!folderPath) return;
            unique.set(folderPath, {
                name: getDisplayName(folderPath, folder.name || '脚本文件夹'),
                path: folderPath,
            });
        });
        return Array.from(unique.values());
    }, [settings.scriptFolders]);
    const uploadedScripts = useMemo(() => {
        const unique = new Map<string, { name: string; path: string }>();
        (settings.uploadedScripts || []).forEach((script) => {
            const scriptPath = normalizeCepPath(script.path);
            if (!scriptPath) return;
            unique.set(scriptPath, {
                name: normalizeScriptName(scriptPath) || script.name || 'script',
                path: scriptPath,
            });
        });
        return Array.from(unique.values());
    }, [settings.uploadedScripts]);
    const scriptMeta = settings.scriptMeta || {};

    const [scripts, setScripts] = useState<ManagedScript[]>([]);
    const [query, setQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [runningPath, setRunningPath] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [sourcesOpen, setSourcesOpen] = useState(true);
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [tagEdit, setTagEdit] = useState<{ path: string; input: string } | null>(null);

    // Close context menu on outside click
    useEffect(() => {
        if (!contextMenu) return;
        const close = () => setContextMenu(null);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [contextMenu]);

    // Close tag edit on Escape
    useEffect(() => {
        if (!tagEdit) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTagEdit(null); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [tagEdit]);

    const getMeta = useCallback((scriptPath: string): ScriptMetaEntry =>
        scriptMeta[scriptPath] || { count: 0, lastRun: 0, favorited: false, tags: [] },
        [scriptMeta]);

    const patchMeta = useCallback((scriptPath: string, patch: Partial<ScriptMetaEntry>) => {
        const current = scriptMeta[scriptPath] || { count: 0, lastRun: 0, favorited: false, tags: [] };
        update('scriptMeta', { ...scriptMeta, [scriptPath]: { ...current, ...patch } });
    }, [scriptMeta, update]);

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        Object.values(scriptMeta).forEach(m => (m.tags || []).forEach(t => tagSet.add(t)));
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'zh'));
    }, [scriptMeta]);

    const refreshScripts = useCallback(() => {
        setIsScanning(true);
        try {
            const fromFolders = scriptFolders.flatMap((folder) => scanFolder(folder.path, folder.name));
            const fromUploads = uploadedScripts
                .filter((s) => fs.existsSync(s.path) && isScriptFile(s.path))
                .map((s) => {
                    let mtime = 0;
                    try { mtime = fs.statSync(s.path).mtimeMs; } catch { }
                    return { ...s, source: 'uploaded' as const, mtime, description: readDescription(s.path) };
                });
            const unique = new Map<string, ManagedScript>();
            [...fromUploads, ...fromFolders].forEach((s) => unique.set(s.path, s));
            setScripts(Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh')));
        } finally {
            setIsScanning(false);
        }
    }, [scriptFolders, uploadedScripts]);

    useEffect(() => { refreshScripts(); }, [refreshScripts]);

    // Sort: favorited first, then alphabetical
    const sortedScripts = useMemo(() =>
        [...scripts].sort((a, b) => {
            const aFav = scriptMeta[a.path]?.favorited ?? false;
            const bFav = scriptMeta[b.path]?.favorited ?? false;
            if (aFav !== bFav) return aFav ? -1 : 1;
            return a.name.localeCompare(b.name, 'zh');
        }),
        [scripts, scriptMeta]
    );

    const filteredScripts = useMemo(() => {
        let list = sortedScripts;
        if (activeTag) {
            list = list.filter(s => (scriptMeta[s.path]?.tags || []).includes(activeTag));
        }
        const q = query.trim().toLowerCase();
        if (!q) return list;
        return list.filter((s) =>
            s.name.toLowerCase().includes(q) ||
            s.path.toLowerCase().includes(q) ||
            (s.folderName || '').toLowerCase().includes(q) ||
            (s.description || '').toLowerCase().includes(q)
        );
    }, [sortedScripts, query, activeTag, scriptMeta]);

    const chooseFolder = () => {
        const cep = (window as any).cep;
        if (!cep?.fs) { window.alert('当前环境不支持目录选择。'); return; }
        const result = cep.fs.showOpenDialog(false, true, '选择脚本文件夹', '', null);
        if (result.err !== cep.fs.NO_ERROR || !Array.isArray(result.data) || result.data.length === 0) return;
        const folderPath = normalizeCepPath(String(result.data[0] || ''));
        if (!folderPath || scriptFolders.some((f) => f.path === folderPath)) return;
        update('scriptFolders', [...scriptFolders, { name: getDisplayName(folderPath, '脚本文件夹'), path: folderPath }]);
    };

    const uploadScript = () => {
        const cep = (window as any).cep;
        if (!cep?.fs) { window.alert('当前环境不支持脚本上传。'); return; }
        const result = cep.fs.showOpenDialog(true, false, '选择要上传的脚本', '', null);
        if (result.err !== cep.fs.NO_ERROR || !Array.isArray(result.data) || result.data.length === 0) return;

        const nextUploads = [...uploadedScripts];
        const rejected: string[] = [];
        result.data.forEach((item: string) => {
            const sourcePath = normalizeCepPath(String(item || ''));
            if (!sourcePath || !isScriptFile(sourcePath) || !fs.existsSync(sourcePath)) {
                rejected.push(getDisplayName(sourcePath, 'unknown'));
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
        // Record run count + timestamp
        const current = scriptMeta[script.path] || { count: 0, lastRun: 0, favorited: false, tags: [] };
        update('scriptMeta', { ...scriptMeta, [script.path]: { ...current, count: current.count + 1, lastRun: Date.now() } });
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

    const revealInExplorer = (scriptPath: string) => {
        if (process.platform === 'win32') {
            execFile('explorer', ['/select,' + path.normalize(scriptPath)]);
        } else {
            execFile('open', ['-R', scriptPath]);
        }
    };

    const handleScriptClick = (event: React.MouseEvent, script: ManagedScript) => {
        if (runningPath) return;
        if (event.altKey) { copyScriptPath(script.path); return; }
        runScript(script);
    };

    const handleContextMenu = (e: React.MouseEvent, script: ManagedScript) => {
        e.preventDefault();
        e.stopPropagation();
        const x = Math.min(e.clientX, window.innerWidth - 190);
        const y = Math.min(e.clientY, window.innerHeight - 250);
        setContextMenu({ x, y, script });
    };

    const openTagEdit = (scriptPath: string) => {
        setContextMenu(null);
        setTagEdit({ path: scriptPath, input: '' });
    };

    const addTag = () => {
        if (!tagEdit) return;
        const tag = tagEdit.input.trim();
        if (!tag) return;
        const current = scriptMeta[tagEdit.path] || { count: 0, lastRun: 0, favorited: false, tags: [] };
        const newTags = current.tags.includes(tag) ? current.tags : [...current.tags, tag];
        update('scriptMeta', { ...scriptMeta, [tagEdit.path]: { ...current, tags: newTags } });
        setTagEdit({ ...tagEdit, input: '' });
    };

    const removeTag = (scriptPath: string, tag: string) => {
        const current = scriptMeta[scriptPath] || { count: 0, lastRun: 0, favorited: false, tags: [] };
        update('scriptMeta', { ...scriptMeta, [scriptPath]: { ...current, tags: current.tags.filter(t => t !== tag) } });
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
                        placeholder="搜索脚本名称、描述或来源..."
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
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '7px 12px', background: 'none', border: 'none',
                            color: 'var(--color-text-tertiary)', fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
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
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '6px 8px' }}
                                        >
                                            <Icon name="folder" size={13} color="#FFCF4D" />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 11 }}>{folder.name}</div>
                                                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={folder.path}>
                                                    {folder.path}
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeFolder(folder.path)}
                                                style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 11, padding: '2px 4px', flexShrink: 0, opacity: 0.8 }}>
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

                {/* Tag filter bar — only shown when tags exist */}
                {allTags.length > 0 && (
                    <div style={{ flexShrink: 0, padding: '6px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setActiveTag(null)}
                            className="badge"
                            style={{
                                cursor: 'pointer', padding: '2px 8px', fontSize: 10,
                                border: `1px solid ${!activeTag ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                background: !activeTag ? 'var(--color-accent-soft)' : 'transparent',
                                color: !activeTag ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                            }}
                        >
                            全部
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                                className="badge"
                                style={{
                                    cursor: 'pointer', padding: '2px 8px', fontSize: 10,
                                    border: `1px solid ${tag === activeTag ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                    background: tag === activeTag ? 'var(--color-accent-soft)' : 'transparent',
                                    color: tag === activeTag ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                }}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                {/* Script list */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {filteredScripts.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                            <Icon name="code" size={36} style={{ opacity: 0.2 }} />
                            <div style={{ fontSize: 12, fontWeight: 500 }}>
                                {isScanning ? '正在扫描...'
                                    : query ? `没有匹配「${query}」的脚本`
                                    : activeTag ? `没有标签为「${activeTag}」的脚本`
                                    : '暂无可运行脚本'}
                            </div>
                            {!isScanning && !query && !activeTag && (
                                <div style={{ fontSize: 11, maxWidth: 200, lineHeight: 1.6, opacity: 0.7 }}>
                                    添加脚本文件夹，或上传 .jsx / .js 脚本文件，即可在此一键运行。
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ padding: '6px 0' }}>
                            {filteredScripts.map((script) => {
                                const meta = getMeta(script.path);
                                const isRunning = runningPath === script.path;
                                const isHovered = hoveredPath === script.path && !runningPath;
                                const ext = path.extname(script.path).replace('.', '').toUpperCase();
                                const scriptTags = meta.tags || [];

                                return (
                                    <div
                                        key={script.path}
                                        onClick={(e) => handleScriptClick(e, script)}
                                        onContextMenu={(e) => handleContextMenu(e, script)}
                                        onMouseEnter={() => setHoveredPath(script.path)}
                                        onMouseLeave={() => setHoveredPath(null)}
                                        title={`点击运行 · Alt+点击复制路径 · 右键更多操作\n${script.path}`}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '7px 12px',
                                            cursor: isRunning ? 'wait' : runningPath ? 'default' : 'pointer',
                                            background: isRunning ? 'var(--color-accent-soft)' : isHovered ? 'var(--color-bg-hover)' : 'transparent',
                                            borderLeft: `2px solid ${meta.favorited ? '#FFCF4D' : meta.count > 0 ? 'var(--color-success)' : 'transparent'}`,
                                            transition: 'background var(--transition-fast)',
                                        }}
                                    >
                                        {/* Favorite star */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                patchMeta(script.path, { favorited: !meta.favorited });
                                            }}
                                            title={meta.favorited ? '取消收藏' : '收藏（置顶）'}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                padding: '1px 2px', flexShrink: 0, lineHeight: 1, fontSize: 13,
                                                color: meta.favorited ? '#FFCF4D' : 'var(--color-text-tertiary)',
                                                opacity: meta.favorited ? 1 : (isHovered ? 0.6 : 0.2),
                                                transition: 'color var(--transition-fast), opacity var(--transition-fast)',
                                            }}
                                        >
                                            ★
                                        </button>

                                        {/* Script icon */}
                                        <div style={{
                                            width: 26, height: 26, borderRadius: 'var(--radius-md)', flexShrink: 0,
                                            background: isRunning ? 'rgba(75,156,255,0.2)' : meta.count > 0 ? 'rgba(57,181,138,0.15)' : 'rgba(99,102,241,0.12)',
                                            color: isRunning ? 'var(--color-accent)' : meta.count > 0 ? 'var(--color-success)' : '#818CF8',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {isRunning
                                                ? <div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} />
                                                : <Icon name={meta.count > 0 ? 'check' : 'code'} size={13} />
                                            }
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* Name row */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                                                <span style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={script.name}>
                                                    {script.name}
                                                </span>
                                                {meta.count > 0 && (
                                                    <span className="badge" title={`已运行 ${meta.count} 次`} style={{ fontSize: 9, padding: '1px 5px', flexShrink: 0, background: 'rgba(57,181,138,0.18)', color: 'var(--color-success)', border: '1px solid rgba(57,181,138,0.35)' }}>
                                                        ×{meta.count}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Description */}
                                            {script.description && !isRunning && (
                                                <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>
                                                    {script.description}
                                                </div>
                                            )}
                                            {/* Source row */}
                                            <div style={{ fontSize: 10, color: isRunning ? 'var(--color-accent)' : 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {isRunning ? '运行中...' : `${script.source === 'uploaded' ? '已上传' : (script.folderName || '文件夹')} · ${ext}`}
                                            </div>
                                            {/* Tags */}
                                            {scriptTags.length > 0 && (
                                                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                                                    {scriptTags.map(tag => (
                                                        <span key={tag} className="badge" style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' }}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete button (uploaded only) */}
                                        {script.source === 'uploaded' && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeUploadedScript(script.path); }}
                                                title="删除此脚本"
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: isHovered ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                                                    padding: '3px 5px', borderRadius: 'var(--radius-sm)',
                                                    fontSize: 13, lineHeight: 1, flexShrink: 0,
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
                padding: '5px 12px', borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)', display: 'flex',
                justifyContent: 'space-between', fontSize: 10,
                color: 'var(--color-text-tertiary)', flexShrink: 0,
            }}>
                <span>{isScanning ? '扫描中...' : '就绪'}</span>
                {filteredScripts.length > 0 && <span>{filteredScripts.length} 个脚本</span>}
            </div>

            {/* Context menu */}
            {contextMenu && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed', zIndex: 9999,
                        left: contextMenu.x, top: contextMenu.y,
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
                        minWidth: 168, overflow: 'hidden', padding: '4px 0',
                    }}
                >
                    <CtxMenuItem icon="play" label="运行" onClick={() => { setContextMenu(null); runScript(contextMenu.script); }} />
                    <CtxMenuItem
                        icon="heart"
                        label={getMeta(contextMenu.script.path).favorited ? '取消收藏' : '收藏（置顶）'}
                        onClick={() => {
                            patchMeta(contextMenu.script.path, { favorited: !getMeta(contextMenu.script.path).favorited });
                            setContextMenu(null);
                        }}
                    />
                    <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                    <CtxMenuItem icon="hash" label="编辑标签" onClick={() => openTagEdit(contextMenu.script.path)} />
                    <CtxMenuItem icon="copy" label="复制路径" onClick={() => { copyScriptPath(contextMenu.script.path); setContextMenu(null); }} />
                    <CtxMenuItem
                        icon="external-link"
                        label={process.platform === 'win32' ? '在资源管理器中显示' : '在 Finder 中显示'}
                        onClick={() => { revealInExplorer(contextMenu.script.path); setContextMenu(null); }}
                    />
                    {contextMenu.script.source === 'uploaded' && (
                        <>
                            <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                            <CtxMenuItem icon="trash" label="删除脚本" danger onClick={() => { removeUploadedScript(contextMenu.script.path); setContextMenu(null); }} />
                        </>
                    )}
                </div>
            )}

            {/* Tag edit modal */}
            {tagEdit && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseDown={() => setTagEdit(null)}
                >
                    <div
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)', padding: '16px', width: 280,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>编辑标签</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {path.basename(tagEdit.path, path.extname(tagEdit.path))}
                        </div>

                        {/* Current tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10, minHeight: 26 }}>
                            {(scriptMeta[tagEdit.path]?.tags || []).length === 0 ? (
                                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>暂无标签</span>
                            ) : (scriptMeta[tagEdit.path]?.tags || []).map(tag => (
                                <span
                                    key={tag}
                                    className="badge"
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 7px', background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' }}
                                >
                                    {tag}
                                    <span
                                        onClick={() => removeTag(tagEdit.path, tag)}
                                        style={{ cursor: 'pointer', opacity: 0.7, fontSize: 10, lineHeight: 1 }}
                                        title="移除"
                                    >
                                        ✕
                                    </span>
                                </span>
                            ))}
                        </div>

                        {/* Tag input */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            <input
                                className="input"
                                autoFocus
                                value={tagEdit.input}
                                onChange={(e) => setTagEdit({ ...tagEdit, input: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                placeholder="输入标签，按回车添加"
                                style={{ flex: 1, height: 28, fontSize: 11, padding: '0 8px' }}
                            />
                            <button className="btn btn-sm btn-primary" type="button" onClick={addTag} style={{ padding: '0 10px' }}>
                                添加
                            </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                            <button className="btn btn-sm" type="button" onClick={() => setTagEdit(null)}>
                                完成
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
