import React, { useState, useEffect, useCallback } from 'react';
import { getBridge } from '@bridge';
import * as AIEngine from '../services/ai-engine';
import { useSettings } from '../hooks/useSettings';

const path = require('path');
const os = require('os');
const fs = require('fs');

type EnhanceMode = 'upscale' | 'remove_bg' | 'denoise';

interface AIEnhanceProps {
    onClose?: () => void;
}

export const AIEnhance: React.FC<AIEnhanceProps> = ({ onClose }) => {
    const { settings, update } = useSettings();
    const [mode, setMode] = useState<EnhanceMode>('upscale');

    const scale = settings.ai.defaultScale as 2 | 4;
    const setScale = (s: 2 | 4) => update('ai', { ...settings.ai, defaultScale: s });

    const denoiseLevel = settings.ai.defaultDenoiseLevel;
    const setDenoiseLevel = (d: string) => update('ai', { ...settings.ai, defaultDenoiseLevel: d as 'none' | 'low' | 'medium' | 'high' });
    const [engineStatus, setEngineStatus] = useState<'unknown' | 'starting' | 'ready' | 'error'>('unknown');
    const [statusMessage, setStatusMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [rembgAvailable, setRembgAvailable] = useState(false);

    // 检查引擎状态
    useEffect(() => {
        checkEngineStatus();
    }, []);

    // 检查 rembg 可用性
    const checkRembgStatus = async () => {
        try {
            const pythonInfo = await AIEngine.checkPython();
            if (pythonInfo.available && pythonInfo.path) {
                const deps = await AIEngine.checkDependencyDetails(pythonInfo.path);
                setRembgAvailable(deps.rembgReady);
            }
        } catch {
            // 忽略检查错误，保持 false
        }
    };

    const checkEngineStatus = async () => {
        const status = await AIEngine.getEngineStatus();
        if (status.running) {
            setEngineStatus('ready');
            setStatusMessage(`就绪 (${status.device || 'CPU'})`);
            checkRembgStatus();
        } else {
            setEngineStatus('unknown');
            setStatusMessage('未启动');
        }
    };

    // 启动引擎
    const handleStartEngine = async () => {
        setEngineStatus('starting');
        setError(null);

        const started = await AIEngine.startEngine((msg) => {
            setStatusMessage(msg);
        });

        if (started) {
            setEngineStatus('ready');
            await checkEngineStatus();
        } else {
            setEngineStatus('error');
            setError('引擎启动失败，请检查 Python 环境');
        }
    };

    // 处理图像
    const handleProcess = async () => {
        setError(null);
        setSuccess(null);

        setIsProcessing(true);
        setProgress(0);

        try {
            const bridge = await getBridge();

            // 导出当前选中的图像
            setStatusMessage('导出图像...');
            setProgress(10);

            const exportResult = await bridge.executeScript({
                scriptId: 'export-for-ai',
                scriptContent: `
if (typeof JSON === 'undefined') {
    JSON = {
        stringify: function(obj) {
            if (obj === null) return 'null';
            if (typeof obj === 'string') return '"' + obj.replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"') + '"';
            if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
            if (obj instanceof Array) {
                var arr = [];
                for (var i = 0; i < obj.length; i++) arr.push(JSON.stringify(obj[i]));
                return '[' + arr.join(',') + ']';
            }
            if (typeof obj === 'object') {
                var pairs = [];
                for (var k in obj) if (obj.hasOwnProperty(k)) pairs.push('"' + k + '":' + JSON.stringify(obj[k]));
                return '{' + pairs.join(',') + '}';
            }
            return 'null';
        }
    };
}

if (app.documents.length === 0) {
    return JSON.stringify({ success: false, error: '请先打开一个文档' });
}

var doc = app.activeDocument;
var sel = doc.selection;

if (!sel || sel.length === 0) {
    return JSON.stringify({ success: false, error: '请先选择一个图像对象' });
}

var item = sel[0];

// 检查对象类型
var itemType = item.typename;

// 支持的类型: RasterItem (嵌入图像), PlacedItem (链接图像), 或包含位图的 GroupItem
if (itemType !== 'RasterItem' && itemType !== 'PlacedItem') {
    // 如果是组，尝试找到里面的位图
    if (itemType === 'GroupItem') {
        var foundRaster = null;
        for (var g = 0; g < item.pageItems.length; g++) {
            if (item.pageItems[g].typename === 'RasterItem' || item.pageItems[g].typename === 'PlacedItem') {
                foundRaster = item.pageItems[g];
                break;
            }
        }
        if (foundRaster) {
            item = foundRaster;
            itemType = item.typename;
        } else {
            return JSON.stringify({ success: false, error: '选中的组内没有找到位图图像 (类型: ' + itemType + ')' });
        }
    } else {
        return JSON.stringify({ success: false, error: '请选择位图图像，当前选中类型: ' + itemType });
    }
}

// 给原始对象打标记，便于处理完成后移除
var origTag = '__ai_enhance_' + new Date().getTime();
item.name = origTag;

// 导出路径
var tempPath = Folder.temp.fsName + '/ai_enhance_input_' + new Date().getTime() + '.png';

// 创建临时文档导出选中内容
var tempDoc = app.documents.add(
    DocumentColorSpace.RGB,
    item.width,
    item.height
);

// 复制到临时文档
var copied = item.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
copied.left = 0;
copied.top = item.height;

// 导出为 PNG
var pngOpts = new ExportOptionsPNG24();
pngOpts.horizontalScale = 100;
pngOpts.verticalScale = 100;
pngOpts.transparency = true;
pngOpts.artBoardClipping = false;

var pngFile = new File(tempPath);
tempDoc.exportFile(pngFile, ExportType.PNG24, pngOpts);
tempDoc.close(SaveOptions.DONOTSAVECHANGES);

return JSON.stringify({
    success: true,
    data: {
        inputPath: tempPath,
        origTag: origTag,
        width: item.width,
        height: item.height,
        left: item.left,
        top: item.top,
        itemType: item.typename
    }
});
`,
                args: {},
            });

            let exportData: any = exportResult.data;
            if (typeof exportData === 'string') {
                try { exportData = JSON.parse(exportData); } catch (e) { }
            }

            if (!exportResult.success || (exportData && exportData.success === false)) {
                throw new Error(exportData?.error || exportResult.error || '导出失败');
            }

            const expData = exportData.data || exportData;
            const inputPath = expData.inputPath;
            if (!inputPath) {
                throw new Error('无法获取导出路径');
            }

            // 记录原始尺寸、位置和标记，用于置入后还原和移除旧对象
            const origWidth = expData.width;
            const origHeight = expData.height;
            const origLeft = expData.left;
            const origTop = expData.top;
            const origTag = expData.origTag;

            setProgress(30);

            // 调用 AI 处理
            let result: any;
            const outputPath = inputPath.replace('_input_', '_output_');

            if (mode === 'upscale') {
                setStatusMessage(`放大图像 (${scale}x)...`);
                result = await AIEngine.upscaleImage(inputPath, outputPath, scale);
            } else if (mode === 'remove_bg') {
                setStatusMessage('移除背景...');
                const alphaMatting = settings.ai.alphaMatting;
                result = await AIEngine.removeBackground(inputPath, outputPath, alphaMatting);
            } else if (mode === 'denoise') {
                setStatusMessage(`降噪处理 (${denoiseLevel})...`);
                result = await AIEngine.denoiseImage(inputPath, outputPath, denoiseLevel);
            }

            setProgress(70);

            if (!result || !result.success) {
                throw new Error(result?.error || '处理失败');
            }

            // 将结果导入回 Illustrator
            setStatusMessage('导入结果...');

            const importResult = await bridge.executeScript({
                scriptId: 'import-ai-result',
                scriptContent: `
if (typeof JSON === 'undefined') {
    JSON = {
        stringify: function(obj) {
            if (obj === null) return 'null';
            if (typeof obj === 'string') return '"' + obj + '"';
            if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
            return 'null';
        }
    };
}

var doc = app.activeDocument;
var resultFile = new File('${result.output.replace(/\\/g, '/')}');

if (!resultFile.exists) {
    return JSON.stringify({ success: false, error: '结果文件不存在' });
}

// 原始尺寸和位置
var origWidth = ${origWidth};
var origHeight = ${origHeight};
var origLeft = ${origLeft};
var origTop = ${origTop};
var origTag = '${origTag || ''}';

// 放置图像
var placed = doc.placedItems.add();
placed.file = resultFile;

// 缩放到原始大小（增强后像素变多了，但在画板上应保持原尺寸）
placed.width = origWidth;
placed.height = origHeight;

// 放回原位
placed.left = origLeft;
placed.top = origTop;

// 嵌入图像
placed.embed();

// 移除旧的原始对象
if (origTag) {
    for (var i = doc.pageItems.length - 1; i >= 0; i--) {
        if (doc.pageItems[i].name === origTag) {
            doc.pageItems[i].remove();
            break;
        }
    }
}

return JSON.stringify({ success: true });
`,
                args: {},
            });

            setProgress(100);

            // 清理临时文件
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(result.output)) fs.unlinkSync(result.output);
            } catch (e) {
                // 忽略清理错误
            }

            setSuccess('处理完成! 结果已添加到画板');

        } catch (e: any) {
            setError(e.message || '处理失败');
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const modeButtons = [
        { key: 'upscale', label: '放大', icon: 'UP', available: true },
        { key: 'remove_bg', label: '抠图', icon: 'BG', available: rembgAvailable },
        { key: 'denoise', label: '降噪', icon: 'DN', available: true },
    ];

    return (
        <div style={{ padding: '12px 0' }}>
            {/* 引擎状态 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: engineStatus === 'ready' ? '#34c759' :
                            engineStatus === 'starting' ? '#ff9500' :
                                engineStatus === 'error' ? '#ff3b30' : '#8e8e93',
                    }} />
                    <span>AI 引擎: {statusMessage || '未知'}</span>
                </div>
                {engineStatus !== 'ready' && engineStatus !== 'starting' && (
                    <button
                        onClick={handleStartEngine}
                        style={{
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            background: 'var(--color-accent)',
                            color: 'white',
                            fontSize: '11px',
                            cursor: 'pointer',
                        }}
                    >
                        启动
                    </button>
                )}
            </div>

            {/* 功能选择 */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {modeButtons.map((btn) => {
                        const disabled = !btn.available || engineStatus !== 'ready' || isProcessing;
                        return (
                            <button
                                key={btn.key}
                                onClick={() => btn.available && setMode(btn.key as EnhanceMode)}
                                disabled={disabled}
                                title={!btn.available ? '依赖未安装，功能暂不可用' : ''}
                                style={{
                                    flex: 1,
                                    padding: '12px 8px',
                                    border: '1px solid',
                                    borderColor: mode === btn.key && btn.available ? 'var(--color-accent)' : 'var(--color-border)',
                                    borderRadius: '8px',
                                    background: mode === btn.key && btn.available ? 'var(--color-bg-active)' : 'var(--color-bg-secondary)',
                                    color: !btn.available ? 'var(--color-text-tertiary)' : mode === btn.key ? 'var(--color-accent)' : 'var(--color-text-primary)',
                                    cursor: !disabled ? 'pointer' : 'not-allowed',
                                    opacity: disabled ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{btn.icon}</div>
                                <div style={{ fontSize: '12px' }}>{btn.label}{!btn.available ? ' (暂不可用)' : ''}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 参数设置 */}
            {mode === 'upscale' && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                        放大倍数
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[2, 4].map((s) => (
                            <button
                                key={s}
                                onClick={() => setScale(s as 2 | 4)}
                                disabled={isProcessing}
                                style={{
                                    padding: '8px 24px',
                                    border: '1px solid',
                                    borderColor: scale === s ? 'var(--color-accent)' : 'var(--color-border)',
                                    borderRadius: '6px',
                                    background: scale === s ? 'var(--color-bg-active)' : 'var(--color-bg-secondary)',
                                    color: scale === s ? 'var(--color-accent)' : 'var(--color-text-primary)',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 降噪参数 */}
            {mode === 'denoise' && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                        降噪强度
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                            { key: 'low', label: '低' },
                            { key: 'medium', label: '中' },
                            { key: 'high', label: '高' },
                        ].map((l) => (
                            <button
                                key={l.key}
                                onClick={() => setDenoiseLevel(l.key)}
                                disabled={isProcessing}
                                style={{
                                    padding: '8px 24px',
                                    border: '1px solid',
                                    borderColor: denoiseLevel === l.key ? 'var(--color-accent)' : 'var(--color-border)',
                                    borderRadius: '6px',
                                    background: denoiseLevel === l.key ? 'var(--color-bg-active)' : 'var(--color-bg-secondary)',
                                    color: denoiseLevel === l.key ? 'var(--color-accent)' : 'var(--color-text-primary)',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 错误提示 */}
            {error && (
                <div style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 59, 48, 0.1)',
                    border: '1px solid rgba(255, 59, 48, 0.3)',
                    borderRadius: '6px',
                    color: '#ff3b30',
                    fontSize: '12px',
                    marginBottom: '12px',
                }}>
                    {error}
                </div>
            )}

            {/* 成功提示 */}
            {success && (
                <div style={{
                    padding: '10px 12px',
                    background: 'rgba(52, 199, 89, 0.1)',
                    border: '1px solid rgba(52, 199, 89, 0.3)',
                    borderRadius: '6px',
                    color: '#34c759',
                    fontSize: '12px',
                    marginBottom: '12px',
                }}>
                    {success}
                </div>
            )}

            {/* 进度条 */}
            {isProcessing && (
                <div style={{ marginBottom: '12px' }}>
                    <div style={{
                        height: '4px',
                        background: 'var(--color-border)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        marginBottom: '6px',
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'var(--color-accent)',
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                        {statusMessage || '处理中...'} ({progress}%)
                    </div>
                </div>
            )}

            {/* 处理按钮 */}
            <button
                onClick={handleProcess}
                disabled={engineStatus !== 'ready' || isProcessing}
                style={{
                    width: '100%',
                    height: '40px',
                    border: 'none',
                    borderRadius: '8px',
                    background: engineStatus === 'ready' && !isProcessing ? 'var(--color-accent)' : 'var(--color-border)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: engineStatus === 'ready' && !isProcessing ? 'pointer' : 'not-allowed',
                }}
            >
                {isProcessing ? '处理中...' : '处理选中的图像'}
            </button>

            {/* 使用说明 */}
            <div style={{
                marginTop: '16px',
                padding: '10px 12px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
            }}>
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>使用方法:</div>
                <div>1. 启动 AI 引擎 (首次需要下载依赖)</div>
                <div>2. 在画板中选择一个位图图像</div>
                <div>3. 选择功能并点击处理</div>
            </div>
        </div>
    );
};
