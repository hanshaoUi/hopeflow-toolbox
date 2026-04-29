/**
 * Image Stitcher - 多种方式拼接分块图像
 * 1. Illustrator 原生拼接（推荐）
 * 2. ImageMagick
 * 3. Python PIL
 * 4. Canvas
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function crc32(buffer: Buffer): number {
    var crc = 0xffffffff;
    for (var i = 0; i < buffer.length; i++) {
        crc ^= buffer[i];
        for (var j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
    const typeBuffer = Buffer.from(type, 'ascii');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function applyPngDpiMetadata(outputPath: string, dpi: number) {
    const input = fs.readFileSync(outputPath);
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (input.length < 8 || !input.subarray(0, 8).equals(signature)) return;

    const ppm = Math.round(dpi / 0.0254);
    const physData = Buffer.alloc(9);
    physData.writeUInt32BE(ppm, 0);
    physData.writeUInt32BE(ppm, 4);
    physData[8] = 1;
    const physChunk = makePngChunk('pHYs', physData);

    let offset = 8;
    const chunks: Buffer[] = [input.subarray(0, 8)];
    let inserted = false;

    while (offset + 8 <= input.length) {
        const length = input.readUInt32BE(offset);
        const type = input.toString('ascii', offset + 4, offset + 8);
        const chunkEnd = offset + 12 + length;
        if (chunkEnd > input.length) return;

        if (type === 'pHYs') {
            if (!inserted) {
                chunks.push(physChunk);
                inserted = true;
            }
        } else {
            if (!inserted && type === 'IDAT') {
                chunks.push(physChunk);
                inserted = true;
            }
            chunks.push(input.subarray(offset, chunkEnd));
        }
        offset = chunkEnd;
    }

    fs.writeFileSync(outputPath, Buffer.concat(chunks));
}

function applyJpegDpiMetadata(outputPath: string, dpi: number) {
    const input = fs.readFileSync(outputPath);
    if (input.length < 4 || input[0] !== 0xff || input[1] !== 0xd8) return;

    let offset = 2;
    while (offset + 4 < input.length && input[offset] === 0xff) {
        const marker = input[offset + 1];
        if (marker === 0xda || marker === 0xd9) break;
        const segmentLength = input.readUInt16BE(offset + 2);
        const segmentEnd = offset + 2 + segmentLength;
        if (segmentEnd > input.length) break;

        if (marker === 0xe0 && input.toString('ascii', offset + 4, offset + 9) === 'JFIF\0') {
            const output = Buffer.from(input);
            output[offset + 11] = 1;
            output.writeUInt16BE(dpi, offset + 12);
            output.writeUInt16BE(dpi, offset + 14);
            fs.writeFileSync(outputPath, output);
            return;
        }
        offset = segmentEnd;
    }

    const app0 = Buffer.alloc(18);
    app0[0] = 0xff;
    app0[1] = 0xe0;
    app0.writeUInt16BE(16, 2);
    app0.write('JFIF\0', 4, 'ascii');
    app0[9] = 1;
    app0[10] = 1;
    app0[11] = 1;
    app0.writeUInt16BE(dpi, 12);
    app0.writeUInt16BE(dpi, 14);
    app0[16] = 0;
    app0[17] = 0;
    fs.writeFileSync(outputPath, Buffer.concat([input.subarray(0, 2), app0, input.subarray(2)]));
}

function applyDpiMetadata(outputPath: string, format: 'jpeg' | 'png' | 'tiff', dpi?: number) {
    if (!dpi || dpi <= 0) return;
    try {
        if (format === 'jpeg') applyJpegDpiMetadata(outputPath, Math.round(dpi));
        if (format === 'png') applyPngDpiMetadata(outputPath, Math.round(dpi));
    } catch (e) {
        console.warn('Failed to apply DPI metadata:', e);
    }
}

export interface TileInfo {
    path: string;
    row: number;
    col: number;
    x: number;
    y: number;
    width: number;
    height: number;
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
}

export interface StitchOptions {
    tiles: TileInfo[];
    totalWidth: number;
    totalHeight: number;
    cols: number;
    rows: number;
    outputPath: string;
    format: 'jpeg' | 'png' | 'tiff';
    dpi?: number;
    quality?: number;
    onProgress?: (progress: number, message: string) => void;
    bridge?: any; // CEP Bridge for Illustrator stitching
}

/**
 * 使用 Illustrator 原生拼接图像（最可靠的方式）
 */
async function stitchWithIllustrator(options: StitchOptions): Promise<{ success: boolean; error?: string }> {
    const { tiles, totalWidth, totalHeight, outputPath, format, quality = 95, onProgress, bridge } = options;

    if (!bridge) {
        return { success: false, error: '需要 CEP Bridge 来使用 Illustrator 拼接' };
    }

    onProgress?.(10, '创建拼接文档...');

    // 生成 JSX 脚本让 Illustrator 执行拼接
    const tilesJson = JSON.stringify(tiles);
    const stitchScript = `
(function() {
    // JSON polyfill
    if (typeof JSON === 'undefined') {
        JSON = {
            stringify: function(obj) {
                if (obj === null) return 'null';
                if (typeof obj === 'string') return '"' + obj + '"';
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
            },
            parse: function(s) { return eval('(' + s + ')'); }
        };
    }

    try {
        var tiles = ${tilesJson};
        var totalWidth = ${totalWidth};
        var totalHeight = ${totalHeight};
        var outputPath = "${outputPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";
        var format = "${format}";
        var quality = ${quality};

        // 计算文档尺寸 (像素转点: 72 DPI)
        var docWidthPt = totalWidth;
        var docHeightPt = totalHeight;

        // 创建新文档
        var docPreset = new DocumentPreset();
        docPreset.width = docWidthPt;
        docPreset.height = docHeightPt;
        docPreset.units = RulerUnits.Points;
        docPreset.colorMode = DocumentColorMode.RGB;

        var tempDoc = app.documents.addDocument('Print', docPreset);

        // 放置每个分块
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            var tileFile = new File(tile.path);

            if (tileFile.exists) {
                var placed = tempDoc.placedItems.add();
                placed.file = tileFile;

                // 设置位置 (Illustrator Y轴向上)
                placed.left = tile.x;
                placed.top = docHeightPt - tile.y;
            }
        }

        // 导出
        var outFile = new File(outputPath);

        if (format === 'jpeg') {
            var jpgOpts = new ExportOptionsJPEG();
            jpgOpts.qualitySetting = quality;
            jpgOpts.horizontalScale = 100;
            jpgOpts.verticalScale = 100;
            jpgOpts.artBoardClipping = true;
            tempDoc.exportFile(outFile, ExportType.JPEG, jpgOpts);
        } else if (format === 'png') {
            var pngOpts = new ExportOptionsPNG24();
            pngOpts.horizontalScale = 100;
            pngOpts.verticalScale = 100;
            pngOpts.artBoardClipping = true;
            pngOpts.transparency = true;
            tempDoc.exportFile(outFile, ExportType.PNG24, pngOpts);
        } else if (format === 'tiff') {
            var tiffOpts = new ExportOptionsTIFF();
            tiffOpts.resolution = 72;
            tiffOpts.artboardClipping = true;
            tempDoc.exportFile(outFile, ExportType.TIFF, tiffOpts);
        }

        // 关闭临时文档不保存
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);

        return JSON.stringify({ success: true });
    } catch (e) {
        // 尝试关闭临时文档
        try {
            if (tempDoc) tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        } catch (e2) {}

        return JSON.stringify({ success: false, error: e.message || String(e) });
    }
})();
`;

    try {
        onProgress?.(30, '在 Illustrator 中拼接...');

        const result = await bridge.executeScript({
            scriptId: 'stitch-images',
            scriptContent: stitchScript,
            args: {},
        });

        console.log('[ImageStitcher] Illustrator stitch result:', result);

        if (result.success) {
            let data = result.data;
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // data is already the result
                }
            }

            if (data && data.success) {
                onProgress?.(90, '清理临时文件...');

                // 清理分块文件
                for (const tile of tiles) {
                    try {
                        if (fs.existsSync(tile.path)) {
                            fs.unlinkSync(tile.path);
                        }
                    } catch (e) {
                        console.warn('清理临时文件失败:', tile.path);
                    }
                }

                onProgress?.(100, '完成!');
                return { success: true };
            } else {
                return { success: false, error: data?.error || 'Illustrator 拼接失败' };
            }
        } else {
            return { success: false, error: result.error || 'Illustrator 脚本执行失败' };
        }
    } catch (e: any) {
        return { success: false, error: `Illustrator 拼接异常: ${e.message}` };
    }
}

/**
 * 检查 ImageMagick 是否可用
 */
function checkImageMagick(): Promise<boolean> {
    return new Promise((resolve) => {
        exec('which montage', (error: any) => {
            resolve(!error);
        });
    });
}

/**
 * 检查 sips 是否可用 (macOS 内置)
 */
function checkSips(): Promise<boolean> {
    return new Promise((resolve) => {
        exec('which sips', (error: any) => {
            resolve(!error);
        });
    });
}

/**
 * 使用 ImageMagick 拼接图像
 */
async function stitchWithImageMagick(options: StitchOptions): Promise<{ success: boolean; error?: string }> {
    const { tiles, totalWidth, totalHeight, outputPath, format, quality = 95, onProgress } = options;

    return new Promise((resolve) => {
        onProgress?.(10, '准备拼接...');

        // 按行列排序
        const sortedTiles = [...tiles].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });

        // 构建 ImageMagick 命令
        // montage 命令用于拼接图像
        const tileArgs = sortedTiles.map((t) => `"${t.path}"`).join(' ');
        const geometry = `${Math.ceil(totalWidth / options.cols)}x${Math.ceil(totalHeight / options.rows)}+0+0`;

        let cmd = `montage ${tileArgs} -tile ${options.cols}x${options.rows} -geometry ${geometry} -background none`;

        if (format === 'jpeg') {
            cmd += ` -quality ${quality}`;
        }

        cmd += ` "${outputPath}"`;

        onProgress?.(30, '执行拼接...');

        exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, (error: any, stdout: string, stderr: string) => {
            if (error) {
                console.error('ImageMagick error:', stderr);
                resolve({ success: false, error: `拼接失败: ${stderr || error.message}` });
                return;
            }

            onProgress?.(90, '清理临时文件...');

            // 清理临时文件
            for (const tile of tiles) {
                try {
                    if (fs.existsSync(tile.path)) {
                        fs.unlinkSync(tile.path);
                    }
                } catch (e) {
                    console.warn('清理临时文件失败:', tile.path);
                }
            }

            onProgress?.(100, '完成!');
            resolve({ success: true });
        });
    });
}

/**
 * 使用 Python PIL 拼接图像 (macOS/Linux 备选)
 */
async function stitchWithPython(options: StitchOptions): Promise<{ success: boolean; error?: string }> {
    const { tiles, totalWidth, totalHeight, outputPath, format, quality = 95, onProgress } = options;

    return new Promise((resolve) => {
        onProgress?.(10, '准备 Python 拼接...');

        // 按行列排序
        const sortedTiles = [...tiles].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });

        // 生成 Python 脚本
        const tilesJson = JSON.stringify(sortedTiles.map(t => ({
            path: t.path,
            x: t.x,
            y: t.y,
            width: t.width,
            height: t.height,
            cropX: t.cropX || 0,
            cropY: t.cropY || 0,
            cropWidth: t.cropWidth || t.width,
            cropHeight: t.cropHeight || t.height
        })));

        const pythonScript = `
import sys
try:
    from PIL import Image
except ImportError:
    print("ERROR: PIL not installed")
    sys.exit(1)

tiles = ${tilesJson}
width = ${totalWidth}
height = ${totalHeight}
output = "${outputPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"
fmt = "${format}"
quality = ${quality}

# Create output image
result = Image.new('RGB', (width, height), (255, 255, 255))

# Paste each tile
for tile in tiles:
    try:
        img = Image.open(tile['path'])
        cropped = img.crop((
            tile['cropX'],
            tile['cropY'],
            tile['cropX'] + tile['cropWidth'],
            tile['cropY'] + tile['cropHeight']
        ))
        if cropped.size != (tile['width'], tile['height']):
            cropped = cropped.resize((tile['width'], tile['height']))
        result.paste(cropped, (tile['x'], tile['y']))
        img.close()
    except Exception as e:
        print(f"ERROR: Failed to load {tile['path']}: {e}")
        sys.exit(1)

# Save
try:
    if fmt == 'jpeg':
        result.save(output, 'JPEG', quality=quality)
    elif fmt == 'png':
        result.save(output, 'PNG')
    elif fmt == 'tiff':
        result.save(output, 'TIFF')
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: Failed to save: {e}")
    sys.exit(1)
`;

        // 写入临时脚本文件
        const scriptPath = path.join(path.dirname(tiles[0].path), 'stitch_script.py');
        fs.writeFileSync(scriptPath, pythonScript);

        onProgress?.(30, '执行 Python 拼接...');

        // 尝试 python3 然后 python
        exec(`python3 "${scriptPath}" 2>&1 || python "${scriptPath}" 2>&1`, { maxBuffer: 10 * 1024 * 1024 }, (error: any, stdout: string, stderr: string) => {
            // 清理脚本文件
            try { fs.unlinkSync(scriptPath); } catch (e) { }

            const output = stdout + stderr;

            if (error || output.includes('ERROR:')) {
                console.error('Python stitch error:', output);
                resolve({ success: false, error: `Python 拼接失败: ${output}` });
                return;
            }

            if (output.includes('SUCCESS')) {
                onProgress?.(90, '清理临时文件...');

                // 清理临时文件
                for (const tile of tiles) {
                    try {
                        if (fs.existsSync(tile.path)) {
                            fs.unlinkSync(tile.path);
                        }
                    } catch (e) {
                        console.warn('清理临时文件失败:', tile.path);
                    }
                }

                onProgress?.(100, '完成!');
                resolve({ success: true });
            } else {
                resolve({ success: false, error: `Python 拼接异常: ${output}` });
            }
        });
    });
}

/**
 * 检查 Python PIL 是否可用
 */
function checkPythonPIL(): Promise<boolean> {
    return new Promise((resolve) => {
        const command = process.platform === 'win32'
            ? 'python -c "from PIL import Image"'
            : 'python3 -c "from PIL import Image" 2>&1 || python -c "from PIL import Image"';
        exec(command, (error: any) => {
            resolve(!error);
        });
    });
}

/**
 * 使用 Canvas 拼接图像 (纯 JavaScript 方案)
 * 注意：这个方法需要在有 Canvas 支持的环境中运行
 */
async function stitchWithCanvas(options: StitchOptions): Promise<{ success: boolean; error?: string }> {
    const { tiles, totalWidth, totalHeight, outputPath, format, onProgress } = options;

    try {
        onProgress?.(10, '加载图像...');

        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return { success: false, error: '无法创建 Canvas 上下文' };
        }

        // 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // 加载并绘制每个分块
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            onProgress?.(10 + Math.round((i / tiles.length) * 60), `加载分块 ${i + 1}/${tiles.length}...`);

            await new Promise<void>((resolve, reject) => {
                try {
                    // 读取文件为 base64
                    const fileBuffer = fs.readFileSync(tile.path);
                    const base64 = fileBuffer.toString('base64');
                    const ext = path.extname(tile.path).toLowerCase().replace('.', '');
                    const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/tiff';

                    const img = new Image();
                    img.onload = () => {
                        const cropX = tile.cropX || 0;
                        const cropY = tile.cropY || 0;
                        const cropWidth = tile.cropWidth || tile.width || img.width;
                        const cropHeight = tile.cropHeight || tile.height || img.height;
                        ctx.drawImage(
                            img,
                            cropX,
                            cropY,
                            Math.min(cropWidth, img.width - cropX),
                            Math.min(cropHeight, img.height - cropY),
                            tile.x,
                            tile.y,
                            tile.width || cropWidth,
                            tile.height || cropHeight
                        );
                        resolve();
                    };
                    img.onerror = (e) => reject(new Error(`加载分块失败: ${tile.path}, 错误: ${e}`));
                    img.src = `data:${mimeType};base64,${base64}`;
                } catch (e: any) {
                    reject(new Error(`读取分块文件失败: ${tile.path}, 错误: ${e.message}`));
                }
            });
        }

        onProgress?.(80, '保存文件...');

        // 导出为 blob
        const mimeType = format === 'png' ? 'image/png' : format === 'tiff' ? 'image/tiff' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.95);

        // 转换为 buffer 并保存
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(outputPath, buffer);

        onProgress?.(90, '清理临时文件...');

        // 清理临时文件
        for (const tile of tiles) {
            try {
                if (fs.existsSync(tile.path)) {
                    fs.unlinkSync(tile.path);
                }
            } catch (e) {
                console.warn('清理临时文件失败:', tile.path);
            }
        }

        onProgress?.(100, '完成!');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Canvas 拼接失败' };
    }
}

/**
 * 拼接分块图像 - 自动选择最佳方法
 */
export async function stitchImages(options: StitchOptions): Promise<{ success: boolean; error?: string }> {
    const { onProgress, bridge } = options;
    const errors: string[] = [];
    const finalize = (result: { success: boolean; error?: string }) => {
        if (result.success) {
            applyDpiMetadata(options.outputPath, options.format, options.dpi);
        }
        return result;
    };

    console.log('[ImageStitcher] Starting stitch...');
    onProgress?.(0, '检查拼接工具...');

    // 1. 优先使用 Illustrator 原生拼接（最可靠）
    if (bridge) {
        console.log('[ImageStitcher] Using Illustrator native stitching...');
        onProgress?.(5, '使用 Illustrator 拼接...');
        const result = await stitchWithIllustrator(options);
        console.log('[ImageStitcher] Illustrator result:', result);
        if (result.success) {
            return finalize(result);
        }
        if (result.error) errors.push(result.error);
        console.warn('[ImageStitcher] Illustrator stitching failed, trying alternatives...');
    }

    // 2. 尝试 ImageMagick
    const hasImageMagick = await checkImageMagick();
    const requiresCrop = options.tiles.some((tile) => tile.cropWidth || tile.cropHeight || tile.cropX || tile.cropY);
    console.log('[ImageStitcher] ImageMagick available:', hasImageMagick);
    if (hasImageMagick && !requiresCrop) {
        onProgress?.(5, '使用 ImageMagick 拼接...');
        const result = await stitchWithImageMagick(options);
        console.log('[ImageStitcher] ImageMagick result:', result);
        if (result.success) {
            return finalize(result);
        }
        if (result.error) errors.push(result.error);
    }

    // 3. 尝试 Python PIL
    const hasPythonPIL = await checkPythonPIL();
    console.log('[ImageStitcher] Python PIL available:', hasPythonPIL);
    if (hasPythonPIL) {
        onProgress?.(5, '使用 Python PIL 拼接...');
        const result = await stitchWithPython(options);
        console.log('[ImageStitcher] Python PIL result:', result);
        if (result.success) {
            return finalize(result);
        }
        if (result.error) errors.push(result.error);
    }

    // 4. 回退到 Canvas 方案
    console.log('[ImageStitcher] Falling back to Canvas...');
    onProgress?.(5, '使用 Canvas 拼接...');
    const result = await stitchWithCanvas(options);
    console.log('[ImageStitcher] Canvas result:', result);
    if (result.success || !errors.length) {
        return finalize(result);
    }
    return {
        success: false,
        error: `${result.error || 'Canvas stitch failed'}; previous attempts: ${errors.join(' | ')}`
    };
}

/**
 * 计算导出信息（预览用）
 */
export function calculateExportInfo(
    widthMM: number,
    heightMM: number,
    scale: number,
    dpi: number,
    maxPixels: number
) {
    // 转换为实际导出尺寸
    const exportWidthMM = widthMM * scale;
    const exportHeightMM = heightMM * scale;

    // 转换为像素 (1 inch = 25.4 mm)
    const exportWidthPx = Math.round((exportWidthMM / 25.4) * dpi);
    const exportHeightPx = Math.round((exportHeightMM / 25.4) * dpi);

    // 计算分块
    const cols = Math.ceil(exportWidthPx / maxPixels);
    const rows = Math.ceil(exportHeightPx / maxPixels);

    return {
        originalSize: {
            widthMM,
            heightMM,
        },
        exportSize: {
            widthMM: exportWidthMM,
            heightMM: exportHeightMM,
            widthPx: exportWidthPx,
            heightPx: exportHeightPx,
        },
        tiles: {
            cols,
            rows,
            total: cols * rows,
        },
        needsSplit: cols * rows > 1,
        estimatedFileSizeMB: Math.round((exportWidthPx * exportHeightPx * 3) / 1024 / 1024),
    };
}
