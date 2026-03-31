import React, { useState, useEffect, useCallback, useMemo } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import Fuse from 'fuse.js';
import { exec } from 'child_process';
import { getBridge } from '@bridge';
import { useSettings } from '../hooks/useSettings';

const DATA_DIR = path.join(os.homedir(), 'Library/Application Support/HopeFlow');
const THUMB_CACHE_DIR = path.join(DATA_DIR, 'Thumbs');
const METADATA_CACHE_FILE = path.join(DATA_DIR, 'library_cache.json');

[THUMB_CACHE_DIR, DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { console.warn('[MaterialLibrary] mkdir failed:', dir, e); }
    }
});

interface MaterialFile {
    name: string;
    path: string;
    ext: string;
    type: 'ai' | 'psd' | 'png' | 'other' | 'folder' | 'online';
    thumbPath?: string;
    previewUrl?: string;
    downloadUrl?: string;
    provider?: 'pexels' | 'pixabay' | 'storyset';
    id?: string | number;
    folderName?: string; // For global search results orientation
    mtime?: number; // Last modified time for cache invalidation
}

type LibrarySource = 'local' | 'photos' | 'cutouts' | 'illustrations';

// Storyset illustration styles
const STORYSET_STYLES = ['rafiki', 'bro', 'amico', 'pana', 'cuate'] as const;

// Default categories for online sources
const ONLINE_CATEGORIES: Record<string, { label: string; query: string }[]> = {
    photos: [
        { label: '自然风景', query: 'nature landscape' },
        { label: '商务办公', query: 'business office' },
        { label: '人物肖像', query: 'people portrait' },
        { label: '科技数码', query: 'technology' },
        { label: '美食料理', query: 'food cuisine' },
        { label: '城市建筑', query: 'city architecture' },
        { label: '旅行度假', query: 'travel vacation' },
        { label: '动物宠物', query: 'animals pets' },
        { label: '艺术抽象', query: 'abstract art' },
        { label: '节日庆典', query: 'festival celebration' },
        { label: '健康运动', query: 'fitness sports' },
        { label: '家居生活', query: 'home interior' },
    ],
    cutouts: [
        { label: '植物花卉', query: 'flower plant' },
        { label: '动物素材', query: 'animal' },
        { label: '人物剪影', query: 'people silhouette' },
        { label: '图标符号', query: 'icon symbol' },
        { label: '装饰边框', query: 'decoration frame' },
        { label: '食物饮品', query: 'food drink' },
        { label: '交通工具', query: 'vehicle transport' },
        { label: '节日元素', query: 'holiday christmas' },
        { label: '箭头形状', query: 'arrow shape' },
        { label: '徽章标签', query: 'badge label' },
        { label: '手绘涂鸦', query: 'hand drawn doodle' },
        { label: '水彩泼墨', query: 'watercolor splash' },
    ],
    illustrations: [
        { label: '商务办公', query: 'style:rafiki' },
        { label: '数据图表', query: 'style:bro' },
        { label: '科技互联', query: 'style:amico' },
        { label: '教育学习', query: 'style:pana' },
        { label: '创意设计', query: 'style:cuate' },
        { label: '全部风格', query: 'all' },
    ],
};

export const MaterialLibrary: React.FC = () => {
    const { settings } = useSettings();
    const libraries = settings.libraries;
    // We no longer use selectedLibIdx to force a single root. The root is now the collection of all libraries.
    const [currentPath, setCurrentPath] = useState<string>(''); // Current browsing folder. Empty means "Root of all libraries"
    const [files, setFiles] = useState<MaterialFile[]>([]);
    const [cache, setCache] = useState<Record<string, MaterialFile[]>>(() => {
        try {
            if (fs.existsSync(METADATA_CACHE_FILE)) {
                return JSON.parse(fs.readFileSync(METADATA_CACHE_FILE, 'utf8'));
            }
        } catch (e) { console.error('Load cache error:', e); }
        return {};
    });
    const [source, setSource] = useState<LibrarySource>('local');
    const [searchQuery, setSearchQuery] = useState('');
    const [onlineFiles, setOnlineFiles] = useState<MaterialFile[]>([]);
    const [isSearchingOnline, setIsSearchingOnline] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scrollTop, setTop] = useState(0);
    const [thumbGenerating, setThumbGenerating] = useState<Record<string, boolean>>({});
    const [isScanning, setIsScanning] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 300, height: 500 });
    const containerRef = React.useRef<HTMLDivElement>(null);

    // API Keys - Read from settings
    const PEXELS_KEY = settings.apiKeys.pexels;
    const PIXABAY_KEY = settings.apiKeys.pixabay;

    // Update container size on mount and resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const searchOnline = useCallback(async (query: string, mode: LibrarySource) => {
        if (!query || mode === 'local') return;

        setIsSearchingOnline(true);
        setError(null);
        let results: MaterialFile[] = [];

        try {
            if (mode === 'photos') {
                if (!PEXELS_KEY) {
                    setError('请先在设置中配置 Pexels API Key');
                    setIsSearchingOnline(false);
                    return;
                }
                const resp = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=40`, {
                    headers: { 'Authorization': PEXELS_KEY }
                });
                if (!resp.ok) throw new Error(`Pexels API 错误 (${resp.status})`);
                const data = await resp.json();
                results = (data.photos || []).map((p: any) => ({
                    id: p.id,
                    name: p.alt || `Pexels-${p.id}`,
                    path: `pexels-${p.id}`,
                    ext: 'jpg',
                    type: 'online',
                    thumbPath: p.src.medium,
                    previewUrl: p.src.large,
                    downloadUrl: p.src.original,
                    provider: 'pexels'
                }));
            } else if (mode === 'cutouts') {
                if (!PIXABAY_KEY) {
                    setError('请先在设置中配置 Pixabay API Key');
                    setIsSearchingOnline(false);
                    return;
                }
                // Pixabay with transparency filter for "Cutouts"
                const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=illustration&colors=transparent&per_page=40`;
                const resp = await fetch(url);
                if (!resp.ok) throw new Error(`Pixabay API 错误 (${resp.status})`);
                const data = await resp.json();
                results = (data.hits || []).map((h: any) => ({
                    id: h.id,
                    name: h.tags.split(',')[0] || `Pixabay-${h.id}`,
                    path: `pixabay-${h.id}`,
                    ext: 'png',
                    type: 'online',
                    thumbPath: h.previewURL,
                    previewUrl: h.webformatURL,
                    downloadUrl: h.largeImageURL,
                    provider: 'pixabay'
                }));
            } else if (mode === 'illustrations') {
                // Storyset by Freepik - free illustration API
                let apiUrl = 'https://stories.freepiklabs.com/api/vectors?page=1';

                // Handle style filter (e.g., "style:rafiki") or fetch all
                if (query.startsWith('style:')) {
                    const style = query.replace('style:', '');
                    apiUrl = `https://stories.freepiklabs.com/api/vectors?page=1&style=${style}`;
                } else if (query !== 'all') {
                    // For now, just fetch page 1; Storyset doesn't have text search
                    apiUrl = 'https://stories.freepiklabs.com/api/vectors?page=1';
                }

                const resp = await fetch(apiUrl);
                if (!resp.ok) throw new Error(`Storyset API 错误 (${resp.status})`);
                const data = await resp.json();
                results = (data.data || []).map((item: any) => ({
                    id: item.id,
                    name: item.illustration?.name || `Illustration-${item.id}`,
                    path: `storyset-${item.id}`,
                    ext: 'svg',
                    type: 'online',
                    thumbPath: item.preview_no_bg || item.preview,
                    previewUrl: item.preview,
                    downloadUrl: item.src, // Direct SVG URL
                    provider: 'storyset' as any
                }));
            }
            setOnlineFiles(results);
        } catch (err) {
            console.error('Online search error:', err);
            setError('网络搜索失败，请检查网络连接');
        } finally {
            setIsSearchingOnline(false);
        }
    }, [PEXELS_KEY, PIXABAY_KEY]);

    // Trigger online search when query or source changes
    useEffect(() => {
        if (source !== 'local' && searchQuery) {
            const timer = setTimeout(() => {
                searchOnline(searchQuery, source);
            }, 500);
            return () => clearTimeout(timer);
        } else if (source !== 'local' && !searchQuery) {
            setOnlineFiles([]);
        }
    }, [searchQuery, source, searchOnline]);


    // Save cache to disk whenever it changes (with simple debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                fs.writeFileSync(METADATA_CACHE_FILE, JSON.stringify(cache), 'utf8');
            } catch (e) { console.error('Save cache error:', e); }
        }, 2000);
        return () => clearTimeout(timer);
    }, [cache]);

    const getThumbPath = (filePath: string) => {
        const hash = crypto.createHash('md5').update(filePath).digest('hex');
        return path.join(THUMB_CACHE_DIR, `${hash}.png`);
    };

    const generateThumb = useCallback((file: MaterialFile) => {
        const thumbPath = getThumbPath(file.path);

        // If it exists, just return (should be checked earlier usually)
        if (fs.existsSync(thumbPath)) return;
        if (thumbGenerating[file.path]) return;

        setThumbGenerating(prev => ({ ...prev, [file.path]: true }));

        // QuickLook command to generate high-quality thumbnail
        // Escape single quotes in paths to prevent shell injection
        const safePath = file.path.replace(/'/g, "'\\''");
        const safeDir = THUMB_CACHE_DIR.replace(/'/g, "'\\''");
        const cmd = `qlmanage -t -s 256 -o '${safeDir}' '${safePath}'`;

        exec(cmd, (err) => {
            if (!err) {
                // qlmanage creates a file with a specific name scheme
                // usually it might be <filename>.png or something else
                // actually, let's use -o to a temp dir then rename to our hash path
                // OR simpler: qlmanage -t -s 256 -o "${THUMB_CACHE_DIR}" "${file.path}"
                // creates results in "${THUMB_CACHE_DIR}/[name].png"

                // Let's use a more predictable way: qlmanage -t -s 256 -o [temp] [file]
                // But for now let's stick to simple logic and find the file.
                // Actually, qlmanage -t -s 256 -o "${THUMB_CACHE_DIR}" "${file.path}"
                // will create "${THUMB_CACHE_DIR}/${path.basename(file.path)}.png"

                const generatedFile = path.join(THUMB_CACHE_DIR, `${path.basename(file.path)}.png`);
                if (fs.existsSync(generatedFile)) {
                    try {
                        fs.renameSync(generatedFile, thumbPath);
                        // Trigger a local state update to refresh the UI for this specific file
                        setFiles(prev => prev.map(f => f.path === file.path ? { ...f, thumbPath: `file://${thumbPath}` } : f));
                    } catch (e) {
                        console.error('Rename failed:', e);
                    }
                }
            }
            setThumbGenerating(prev => ({ ...prev, [file.path]: false }));
        });
    }, [thumbGenerating]);

    const normalizePath = (p: string) => {
        let normalized = p;
        if (normalized.startsWith('file:///')) {
            normalized = normalized.slice(7);
        } else if (normalized.startsWith('file://')) {
            normalized = normalized.slice(7);
        }
        try {
            normalized = decodeURIComponent(normalized);
        } catch (err: any) {
            console.warn('[MaterialLibrary] decodeURIComponent failed for:', normalized);
        }
        return normalized;
    };

    // Reset currentPath when returning to root or on mount
    useEffect(() => {
        if (!currentPath && source === 'local' && libraries.length > 0) {
            // Root level: show all configured libraries as folders
            const rootFolders: MaterialFile[] = libraries.map(lib => ({
                name: lib.name,
                path: lib.path,
                ext: '',
                type: 'folder',
                mtime: Date.now()
            }));
            setFiles(rootFolders);
        }
    }, [currentPath, source, libraries]);

    // Auto-scan when currentPath changes (fixes the need to manually click refresh)
    useEffect(() => {
        if (currentPath && source === 'local') {
            scanCurrentFolder(currentPath);
        }
    }, [currentPath, source]);

    // Check if a directory contains any supported material files recursively
    const hasMaterials = (dirPath: string, depth = 0): boolean => {
        if (depth > 5) return false; // Safety limit
        try {
            const list = fs.readdirSync(dirPath);
            for (const name of list) {
                const fullPath = path.join(dirPath, name);
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    if (hasMaterials(fullPath, depth + 1)) return true;
                } else {
                    const ext = path.extname(name).toLowerCase().slice(1);
                    if (['ai', 'psd', 'png', 'eps', 'tif', 'tiff', 'jpg', 'jpeg', 'pdf', 'svg'].includes(ext)) {
                        return true;
                    }
                }
            }
        } catch (e) { }
        return false;
    };


    const downloadOnlineMaterial = async (file: MaterialFile) => {
        if (!file.downloadUrl) return;

        setIsDownloading(true);
        setError(null);
        try {
            const tempDir = path.join(os.tmpdir(), 'HopeFlowMaterials');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const fileName = `${file.provider}-${file.id}.${file.ext}`;
            const localPath = path.join(tempDir, fileName);

            // Download file
            const response = await fetch(file.downloadUrl);
            if (!response.ok) throw new Error(`下载失败 (${response.status})`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(localPath, buffer);

            // Import file via bridge
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'import-material',
                scriptPath: './src/scripts/images/import-material.jsx',
                args: { path: localPath }
            });

            if (!result.success) setError(result.error || '导入失败');
        } catch (err) {
            console.error('Download/Import error:', err);
            setError('下载或导入在线素材失败');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setTop(e.currentTarget.scrollTop);
    }, []);

    // File System Watcher
    useEffect(() => {
        if (!currentPath || !fs.existsSync(currentPath)) return;

        let watcher: fs.FSWatcher | null = null;
        try {
            watcher = fs.watch(currentPath, (eventType) => {
                if (eventType === 'rename' || eventType === 'change') {
                    // Refresh in background to sync changes
                    scanCurrentFolder(currentPath, true);
                }
            });
        } catch (e) {
            console.error('Watch error:', e);
        }

        return () => watcher?.close();
    }, [currentPath]);

    // Non-blocking scan of a SPECIFIC folder
    const scanCurrentFolder = useCallback((folderPath: string, isBackground = false) => {
        // If we have cache, show it immediately
        if (cache[folderPath]) {
            setFiles(cache[folderPath]);
        } else if (!isBackground) {
            setFiles([]); // Only clear if no cache and not background
        }

        setIsScanning(true);
        setError(null);

        setTimeout(() => {
            try {
                if (!fs.existsSync(folderPath)) {
                    setError('目录不存在');
                    setIsScanning(false);
                    return;
                }

                const list = fs.readdirSync(folderPath);
                const foundFiles: MaterialFile[] = [];

                for (const name of list) {
                    const fullPath = path.join(folderPath, name);
                    try {
                        const stats = fs.statSync(fullPath);
                        const ext = path.extname(name).toLowerCase().slice(1);
                        const mtime = stats.mtimeMs;

                        if (stats.isDirectory()) {
                            // Only add directory if it's not empty (contains materials)
                            if (hasMaterials(fullPath)) {
                                foundFiles.push({
                                    name: name,
                                    path: fullPath,
                                    ext: '',
                                    type: 'folder',
                                    mtime
                                });
                            }
                        } else if (['ai', 'psd', 'png', 'eps', 'tif', 'tiff', 'jpg', 'jpeg', 'pdf', 'svg'].includes(ext)) {
                            const isRaster = ['png', 'jpg', 'jpeg'].includes(ext);
                            const tPath = getThumbPath(fullPath);

                            // Check if thumb exists AND is newer than file
                            let thumbUrl: string | undefined;
                            if (isRaster) {
                                thumbUrl = `file://${fullPath}`;
                            } else if (fs.existsSync(tPath)) {
                                const tStats = fs.statSync(tPath);
                                if (tStats.mtimeMs > mtime) {
                                    thumbUrl = `file://${tPath}`;
                                }
                            }

                            foundFiles.push({
                                name: name,
                                path: fullPath,
                                ext,
                                type: (['ai', 'psd', 'png'].includes(ext) ? ext : 'other') as any,
                                thumbPath: thumbUrl,
                                mtime
                            });
                        }
                    } catch (e) { }
                }

                // Sort: Folders first, then by name
                foundFiles.sort((a, b) => {
                    if (a.type === 'folder' && b.type !== 'folder') return -1;
                    if (a.type !== 'folder' && b.type === 'folder') return 1;
                    return a.name.localeCompare(b.name);
                });

                setFiles(foundFiles);
                setCache(prev => ({ ...prev, [folderPath]: foundFiles }));
            } catch (err: any) {
                console.error('[MaterialLibrary] Scan error:', err);
                setError(`读取失败: ${err.message}`);
            } finally {
                setIsScanning(false);
            }
        }, isBackground ? 100 : 50);
    }, [cache]);

    // 8. Virtualization & Search
    const MIN_ITEM_WIDTH = 75; const THUMB_RATIO = 1.0; const TEXT_HEIGHT = 32; const GAP = 6;
    const gridInfo = useMemo(() => {
        const width = Math.max(200, containerSize.width - 24);
        const cols = Math.max(1, Math.floor((width + GAP) / (MIN_ITEM_WIDTH + GAP)));
        const itemWidth = (width - (cols - 1) * GAP) / cols;
        const itemHeight = Math.round(itemWidth * THUMB_RATIO) + TEXT_HEIGHT;
        return { cols, visibleRows: Math.ceil(containerSize.height / itemHeight) + 2, itemWidth, itemHeight };
    }, [containerSize.width, containerSize.height]);


    const allFiles = useMemo(() => {
        const unique = new Set<string>(); const flat: any[] = [];
        Object.entries(cache).forEach(([fPath, fList]) => {
            const folderName = path.basename(fPath);
            fList.forEach(f => { if (!unique.has(f.path)) { unique.add(f.path); flat.push({ ...f, folderName }); } });
        });
        return flat;
    }, [cache]);

    const filteredFiles = useMemo(() => {
        if (source !== 'local') return onlineFiles;
        if (!searchQuery) return files;
        const fuse = new Fuse(allFiles, { keys: ['name', 'ext'], threshold: 0.35, distance: 100, includeScore: true });
        return fuse.search(searchQuery).map(r => ({ ...r.item, searchScore: r.score }));
    }, [files, allFiles, onlineFiles, searchQuery, source]);

    const visibleFiles = useMemo(() => {
        const { cols, visibleRows, itemHeight } = gridInfo;
        const startRow = Math.floor(scrollTop / itemHeight);
        const startIndex = startRow * cols;
        return filteredFiles.slice(startIndex, startIndex + visibleRows * cols).map((file, idx) => ({ file, index: startIndex + idx }));
    }, [filteredFiles, scrollTop, gridInfo]);

    const totalHeight = Math.ceil(filteredFiles.length / gridInfo.cols) * gridInfo.itemHeight;

    // 9. Handlers
    const handleRefresh = useCallback(() => {
        if (source !== 'local') return;
        if (currentPath) scanCurrentFolder(currentPath, true);
        else {
            // Refreshing at root just re-evaluates libraries
            const rootFolders: MaterialFile[] = libraries.map(lib => ({
                name: lib.name,
                path: lib.path,
                ext: '',
                type: 'folder',
                mtime: Date.now()
            }));
            setFiles(rootFolders);
        }
    }, [currentPath, scanCurrentFolder, source, libraries]);

    const handleImport = async (file: MaterialFile) => {
        if (file.type === 'online') await downloadOnlineMaterial(file);
        else if (file.type === 'folder') {
            setCurrentPath(file.path);
            setTop(0);
            if (containerRef.current) containerRef.current.scrollTop = 0;
        }
        else {
            try {
                const bridge = await getBridge();
                const res = await bridge.executeScript({
                    scriptId: 'import-material',
                    scriptPath: './src/scripts/images/import-material.jsx',
                    args: { path: file.path }
                });
                if (!res.success) setError(res.error || '导入失败');
            } catch (err: any) {
                console.error('[MaterialLibrary] Import error:', err);
                setError(`导入失败: ${err.message || err}`);
            }
        }
    };

    const breadcrumbs = useMemo(() => {
        if (!currentPath) return [{ name: '素材库', path: '' }];

        // Find which base library this path belongs to
        const baseLib = libraries.find(lib => currentPath.startsWith(normalizePath(lib.path)));
        if (!baseLib) return [{ name: '素材库', path: '' }];

        const rootPath = normalizePath(baseLib.path);
        const rel = path.relative(rootPath, currentPath);

        const res = [{ name: '素材库', path: '' }];
        res.push({ name: baseLib.name, path: rootPath });

        if (rel === '') return res; // the base library itself

        let cur = rootPath;
        rel.split(path.sep).forEach(p => {
            cur = path.join(cur, p);
            res.push({ name: p, path: cur });
        });
        return res;
    }, [currentPath, libraries]);

    // 10. UI Helpers
    const renderIcon = (file: MaterialFile) => {
        if (file.type === 'folder') return <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><svg viewBox="0 0 24 24" width="32" height="32" fill="#FFCF4D" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg></div>;
        if (file.thumbPath) return <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}><img src={file.thumbPath} alt={file.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} onError={(e) => (e.currentTarget.style.display = 'none')} />{(file.type === 'ai' || file.type === 'psd') && <div style={{ position: 'absolute', top: '4px', right: '4px', background: file.type === 'ai' ? '#FF9A00' : '#00C8FF', color: '#fff', fontSize: '8px', fontWeight: 'bold', padding: '1px 4px', borderRadius: '2px', textTransform: 'uppercase', boxShadow: '0 1px 2px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>{file.type}</div>}</div>;
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'var(--color-bg-tertiary)' }}>{thumbGenerating[file.path] ? <div style={{ width: '16px', height: '16px', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%' }} className="animate-spin"></div> : <div className="badge" style={{ opacity: 0.6, fontSize: '10px' }}>{file.ext.toUpperCase() || 'FILE'}</div>}</div>;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
            <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', background: 'var(--color-bg-tertiary)', borderRadius: '8px', padding: '2px', marginBottom: 'var(--spacing-sm)' }}>
                    {(['local', 'illustrations', 'photos', 'cutouts'] as const).map(s => (
                        <button key={s} onClick={() => { setSource(s); setTop(0); setSearchQuery(''); }} style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: source === s ? 600 : 400, background: source === s ? 'var(--color-bg-primary)' : 'transparent', color: source === s ? 'var(--color-accent)' : 'var(--color-text-tertiary)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: source === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                            {s === 'local' ? '本地' : s === 'illustrations' ? '插画' : s === 'photos' ? '图片' : '免抠'}
                        </button>
                    ))}
                </div>

                {/* Removed obsolete Tab buttons for selecting libraries since they are now folders */}

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input type="text" className="input" placeholder={source === 'local' ? "搜索本地素材..." : source === 'illustrations' ? "选择插画风格..." : source === 'photos' ? "搜索高清图片..." : "搜索免抠素材..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '32px', height: '32px', borderRadius: '16px', background: 'var(--color-bg-tertiary)', border: 'none' }} />
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                    </div>
                    {source === 'local' && (
                        <button className="btn btn-sm btn-ghost" onClick={handleRefresh} disabled={isScanning} title="刷新" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}>
                            <svg className={isScanning ? 'animate-spin' : ''} viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" /></svg>
                        </button>
                    )}
                </div>
                {source === 'local' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)', overflowX: 'auto', whiteSpace: 'nowrap', padding: '2px 4px', scrollbarWidth: 'none' }}>
                        {breadcrumbs.map((bc, idx) => (<React.Fragment key={bc.path}>{idx > 0 && <span style={{ opacity: 0.3 }}>›</span>}<span onClick={() => { setCurrentPath(bc.path); setTop(0); }} style={{ cursor: 'pointer', color: idx === breadcrumbs.length - 1 ? 'var(--color-accent)' : 'inherit', fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'} onMouseLeave={e => e.currentTarget.style.color = idx === breadcrumbs.length - 1 ? 'var(--color-accent)' : 'inherit'}>{bc.name}</span></React.Fragment>))}
                    </div>
                )}
            </div>

            <div ref={containerRef} onScroll={(e) => setTop(e.currentTarget.scrollTop)} style={{ flex: 1, overflowY: 'auto', padding: '12px', position: 'relative' }}>
                {error && <div className="alert alert-error" style={{ marginBottom: '12px', fontSize: '12px' }}>{error}</div>}
                {source !== 'local' && searchQuery && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            <span style={{ opacity: 0.6 }}>搜索：</span>
                            <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{searchQuery}</span>
                        </div>
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: '4px 8px', fontSize: '11px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-tertiary)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}
                        >
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                            返回分类
                        </button>
                    </div>
                )}
                {(isSearchingOnline || isDownloading) && (
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'var(--color-bg-secondary)', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTopColor: 'currentColor', borderRadius: '50%' }} className="animate-spin"></div>
                        <span>{isDownloading ? '正在导入...' : '发现新灵感...'}</span>
                    </div>
                )}
                {filteredFiles.length === 0 ? (
                    source !== 'local' && !searchQuery && ONLINE_CATEGORIES[source] ? (
                        // Show category grid for online sources
                        <div style={{ padding: '16px' }}>
                            <div style={{ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 500 }}>
                                {source === 'illustrations' ? '插画风格 · Storyset' : source === 'photos' ? '热门分类 · Pexels' : '素材分类 · Pixabay'}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px' }}>
                                {ONLINE_CATEGORIES[source].map((cat) => (
                                    <button
                                        key={cat.query}
                                        onClick={() => setSearchQuery(cat.query)}
                                        style={{
                                            padding: '12px 8px',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '10px',
                                            background: 'var(--color-bg-secondary)',
                                            color: 'var(--color-text-primary)',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'center',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-accent)';
                                            e.currentTarget.style.background = 'var(--color-bg-active)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-border)';
                                            e.currentTarget.style.background = 'var(--color-bg-secondary)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            <div style={{ marginTop: '20px', padding: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '8px', fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
                                💡 点击分类快速浏览，或在搜索框输入关键词自由探索
                            </div>
                        </div>
                    ) : source === 'local' && libraries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style={{ opacity: 0.12, display: 'block', margin: '0 auto 16px' }}>
                                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2zm8 14H4V8h14v10z" />
                            </svg>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                                尚未添加素材库
                            </div>
                            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', lineHeight: 1.5 }}>
                                前往 <strong style={{ color: 'var(--color-accent)' }}>设置</strong> 添加本地素材库文件夹
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                            <div style={{ opacity: 0.2, marginBottom: '20px' }}><svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" /></svg></div>
                            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '13px' }}>{isScanning || isSearchingOnline ? '搜寻中...' : '暂无结果，换个词试试？'}</div>
                        </div>
                    )
                ) : (
                    <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                        {visibleFiles.map(({ file, index }) => {
                            const { cols, itemWidth, itemHeight } = gridInfo;
                            const row = Math.floor(index / cols); const col = index % cols;
                            const thumbHeight = itemHeight - TEXT_HEIGHT - GAP;
                            return (
                                <div key={file.path} onClick={() => { if (file.type === 'folder') handleImport(file); }} onDoubleClick={() => { if (file.type !== 'folder') handleImport(file); }} style={{ position: 'absolute', top: `${row * itemHeight}px`, left: `${col * (itemWidth + GAP)}px`, width: `${itemWidth}px`, height: `${itemHeight - GAP}px`, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }} title={file.name}>
                                    <div style={{ height: `${thumbHeight}px`, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                        {renderIcon(file)}
                                    </div>
                                    <div style={{ padding: '8px', fontSize: '11px' }}>
                                        <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>{file.name}</div>
                                        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{source === 'local' && searchQuery && (file as any).folderName ? `${(file as any).folderName} / ` : ''}{file.type === 'folder' ? '目录' : file.ext.toUpperCase()}</span>
                                            {thumbGenerating[file.path] && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-accent)' }}></span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--color-text-tertiary)', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (isScanning || isSearchingOnline) ? 'var(--color-success)' : 'var(--color-border)' }}></div><span>{isScanning || isSearchingOnline ? '获取中...' : '素材库就绪'}</span></div>
                <span>{filteredFiles.length} 个项目</span>
            </div>
        </div>
    );
};
