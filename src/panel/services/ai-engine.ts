/**
 * AI 引擎服务
 * 管理 AI 引擎的启动、通信和下载
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ENGINE_PORT = 18765;
const ENGINE_URL = `http://127.0.0.1:${ENGINE_PORT}`;
const SITE_BASE_URL = 'http://wp.kkcomfy.art';

function readStoredToken(): string {
    try {
        const stored = localStorage.getItem('hf_settings');
        if (!stored) return '';
        const parsed = JSON.parse(stored);
        return typeof parsed.userToken === 'string' ? parsed.userToken : '';
    } catch {
        return '';
    }
}

// 引擎状态
let engineProcess: any = null;
let engineReady = false;

/**
 * 获取引擎目录
 */
function getEngineDir(): string {
    // CEP 环境下获取扩展路径
    const win = window as any;
    if (win.CSInterface) {
        try {
            const cs = new win.CSInterface();
            const extensionPath = cs.getSystemPath('extension');
            const engineDir = path.join(extensionPath, 'ai-engine');
            if (fs.existsSync(engineDir)) {
                return engineDir;
            }
        } catch (e) {
            console.warn('无法获取扩展路径:', e);
        }
    }

    // 开发模式：相对于项目根目录
    const devEngineDir = path.join(process.cwd(), 'ai-engine');
    if (fs.existsSync(devEngineDir)) {
        return devEngineDir;
    }

    // 备用：用户数据目录
    const userDataDir = path.join(os.homedir(), '.hopeflow', 'ai-engine');
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }
    return userDataDir;
}

/**
 * 检查引擎是否已安装
 */
export function isEngineInstalled(): boolean {
    const engineDir = getEngineDir();
    const serverPath = path.join(engineDir, 'src', 'server.py');
    return fs.existsSync(serverPath);
}

/**
 * 检查 Python 是否可用
 */
export async function checkPython(): Promise<{ available: boolean; version?: string; path?: string }> {
    return new Promise((resolve) => {
        // 尝试不同的 Python 命令
        const pythonCommands = ['python3', 'python'];

        const tryCommand = (index: number) => {
            if (index >= pythonCommands.length) {
                resolve({ available: false });
                return;
            }

            const cmd = pythonCommands[index];
            exec(`${cmd} --version`, (error: any, stdout: string, stderr: string) => {
                if (!error) {
                    const version = (stdout || stderr).trim();
                    resolve({ available: true, version, path: cmd });
                } else {
                    tryCommand(index + 1);
                }
            });
        };

        tryCommand(0);
    });
}

/**
 * 检查依赖是否已安装，返回各功能的可用性
 */
export interface DependencyStatus {
    coreReady: boolean;   // torch + basicsr + realesrgan (放大功能)
    rembgReady: boolean;  // rembg (抠图功能)
    realesrganReady: boolean;
}

export async function checkDependencies(pythonCmd: string): Promise<boolean> {
    const status = await checkDependencyDetails(pythonCmd);
    return status.coreReady; // 核心功能可用即视为通过
}

export async function checkDependencyDetails(pythonCmd: string): Promise<DependencyStatus> {
    // 注意: exec 外层用双引号包裹 -c 参数，Python 代码内部必须用单引号
    // 补丁 + 核心检查 (放大功能)
    const coreScript = "import fastapi, uvicorn, PIL, numpy, cv2; print('OK')";
    // 抠图功能检查 (注入 numba shim 以绕过 llvmlite 缺失)
    const rembgScript = "import rembg; print('OK')";
    const realesrganScript = "import sys; import torchvision.transforms.functional as _F; sys.modules['torchvision.transforms.functional_tensor']=_F; import torch; import basicsr; from realesrgan import RealESRGANer; print('OK')";

    const [coreReady, rembgReady, realesrganReady] = await Promise.all([
        new Promise<boolean>((resolve) => {
            exec(`${pythonCmd} -c "${coreScript}"`, (error: any, stdout: string) => {
                resolve(!error && stdout.includes('OK'));
            });
        }),
        new Promise<boolean>((resolve) => {
            exec(`${pythonCmd} -c "${rembgScript}"`, (error: any, stdout: string) => {
                resolve(!error && stdout.includes('OK'));
            });
        }),
        new Promise<boolean>((resolve) => {
            exec(`${pythonCmd} -c "${realesrganScript}"`, (error: any, stdout: string) => {
                resolve(!error && stdout.includes('OK'));
            });
        }),
    ]);

    return { coreReady, rembgReady, realesrganReady };
}

/**
 * 安装依赖
 */
export async function installDependencies(
    pythonCmd: string,
    onProgress?: (message: string) => void
): Promise<boolean> {
    const engineDir = getEngineDir();
    const requirementsPath = path.join(engineDir, 'requirements.txt');

    console.log('[AI Engine] Engine dir:', engineDir);
    console.log('[AI Engine] Requirements path:', requirementsPath);

    if (!fs.existsSync(requirementsPath)) {
        onProgress?.(`错误: requirements.txt 不存在`);
        return false;
    }

    onProgress?.('正在安装 AI 依赖 (首次安装约需 5-10 分钟)...');

    // 第一步: 升级 pip 和安装 wheel（避免旧版 pip 构建失败）
    onProgress?.('[准备] 升级 pip...');
    await installPackage(pythonCmd, ['--upgrade', 'pip', 'setuptools', 'wheel'], onProgress);

    onProgress?.('安装核心依赖...');
    const coreInstalled = await installPackage(pythonCmd, ['-r', requirementsPath], onProgress);
    if (!coreInstalled) {
        onProgress?.('核心依赖安装失败');
        return false;
    }

    onProgress?.('尝试安装可选抠图依赖...');
    await installPackage(pythonCmd, ['rembg', 'onnxruntime'], onProgress);

    // 验证安装
    onProgress?.('验证安装...');
    const verified = await checkDependencies(pythonCmd);

    if (verified) {
        onProgress?.('所有依赖安装完成!');
        return true;
    } else {
        onProgress?.('部分依赖安装失败，请检查 Python 环境');
        return false;
    }
}

/**
 * 安装单个包
 */
export async function installRealESRGAN(
    pythonCmd: string,
    onProgress?: (message: string) => void
): Promise<boolean> {
    const engineDir = getEngineDir();
    const requirementsPath = path.join(engineDir, 'requirements-realesrgan.txt');

    if (!fs.existsSync(requirementsPath)) {
        onProgress?.('错误: requirements-realesrgan.txt 不存在');
        return false;
    }

    onProgress?.('正在安装 Real-ESRGAN 可选增强包...');
    await installPackage(pythonCmd, ['--upgrade', 'pip', 'setuptools', 'wheel'], onProgress);

    const installed = await installPackage(pythonCmd, ['-r', requirementsPath], onProgress);
    if (!installed) {
        onProgress?.('Real-ESRGAN 安装失败');
        return false;
    }

    const status = await checkDependencyDetails(pythonCmd);
    if (!status.realesrganReady) {
        onProgress?.('Real-ESRGAN 验证失败');
        return false;
    }

    onProgress?.('Real-ESRGAN 已安装');
    return true;
}

function installPackage(pythonCmd: string, packages: string[], onProgress?: (message: string) => void): Promise<boolean> {
    return new Promise((resolve) => {
        const args = ['-m', 'pip', 'install', ...packages];

        const proc = spawn(pythonCmd, args);
        let hasError = false;

        proc.stdout.on('data', (data: Buffer) => {
            const line = data.toString().trim();
            if (line) {
                console.log('[pip]', line);
                // 显示下载进度
                if (line.includes('Downloading') || line.includes('Installing') || line.includes('Successfully')) {
                    const shortLine = line.length > 80 ? line.substring(0, 77) + '...' : line;
                    onProgress?.(shortLine);
                }
            }
        });

        proc.stderr.on('data', (data: Buffer) => {
            const line = data.toString().trim();
            if (line) {
                console.error('[pip]', line);
                if (line.toLowerCase().includes('error')) {
                    hasError = true;
                }
            }
        });

        proc.on('close', (code: number) => {
            resolve(code === 0 && !hasError);
        });

        proc.on('error', () => {
            resolve(false);
        });
    });
}

/**
 * 检查引擎是否正在运行
 */
export async function isEngineRunning(): Promise<boolean> {
    try {
        const response = await fetch(`${ENGINE_URL}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * 启动 AI 引擎
 */
export async function startEngine(
    onProgress?: (message: string) => void
): Promise<boolean> {
    // 检查是否已经在运行
    if (await isEngineRunning()) {
        onProgress?.('AI 引擎已在运行');
        engineReady = true;
        return true;
    }

    // 检查 Python
    onProgress?.('检查 Python 环境...');
    const pythonInfo = await checkPython();
    if (!pythonInfo.available) {
        onProgress?.('错误: 未找到 Python，请先安装 Python 3.8+');
        return false;
    }
    onProgress?.(`Python: ${pythonInfo.version}`);

    // 检查依赖
    onProgress?.('检查依赖...');
    const dependencyStatus = await checkDependencyDetails(pythonInfo.path!);
    if (!dependencyStatus.coreReady) {
        onProgress?.('首次使用，需要安装 AI 引擎依赖...');
        const installed = await installDependencies(pythonInfo.path!, onProgress);
        if (!installed) {
            return false;
        }
    } else if (!dependencyStatus.rembgReady) {
        onProgress?.('尝试安装可选抠图依赖...');
        await installPackage(pythonInfo.path!, ['rembg', 'onnxruntime'], onProgress);
    }

    // 启动服务
    onProgress?.('启动 AI 引擎...');
    const engineDir = getEngineDir();
    const serverPath = path.join(engineDir, 'src', 'server.py');

    return new Promise((resolve) => {
        engineProcess = spawn(pythonInfo.path!, [serverPath], {
            cwd: path.join(engineDir, 'src'),
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });

        engineProcess.stdout.on('data', (data: Buffer) => {
            const line = data.toString().trim();
            console.log('[AI Engine]', line);
            onProgress?.(line);
        });

        engineProcess.stderr.on('data', (data: Buffer) => {
            const line = data.toString().trim();
            console.error('[AI Engine Error]', line);
        });

        engineProcess.on('close', (code: number) => {
            console.log('[AI Engine] 进程退出:', code);
            engineProcess = null;
            engineReady = false;
        });

        // 等待服务就绪
        let attempts = 0;
        const maxAttempts = 30; // 最多等待 30 秒

        const checkReady = async () => {
            attempts++;
            if (await isEngineRunning()) {
                onProgress?.('AI 引擎已就绪!');
                engineReady = true;
                resolve(true);
            } else if (attempts < maxAttempts) {
                setTimeout(checkReady, 1000);
            } else {
                onProgress?.('AI 引擎启动超时');
                resolve(false);
            }
        };

        setTimeout(checkReady, 2000);
    });
}

/**
 * 停止 AI 引擎
 */
export async function stopEngine(): Promise<void> {
    try {
        await fetchWithTimeout(`${ENGINE_URL}/shutdown`, { method: 'POST' }, 3000);
    } catch {
        // If the HTTP shutdown path is unavailable, fall back to killing the process we own.
    }

    if (engineProcess) {
        engineProcess.kill();
        engineProcess = null;
        engineReady = false;
    }

    engineReady = false;
}

/**
 * 带超时的 fetch 封装
 */
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 300000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * 图像放大
 */
export async function upscaleImage(
    inputPath: string,
    outputPath: string,
    scale: number = 4,
    engine: 'basic' | 'realesrgan' = 'basic',
    grant: string = '',
    feature: string = 'ai-enhance'
): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
        const response = await fetchWithTimeout(`${ENGINE_URL}/upscale`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${readStoredToken()}` },
            body: JSON.stringify({ input: inputPath, output: outputPath, scale, engine, grant, feature, site_base_url: SITE_BASE_URL })
        });

        return await response.json();
    } catch (error: any) {
        if (error.name === 'AbortError') return { success: false, error: '处理超时，请重试' };
        return { success: false, error: error.message };
    }
}

/**
 * 移除背景
 */
export async function removeBackground(
    inputPath: string,
    outputPath: string,
    alphaMatting: boolean = false,
    grant: string = '',
    feature: string = 'ai-enhance'
): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
        const response = await fetchWithTimeout(`${ENGINE_URL}/remove_bg`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${readStoredToken()}` },
            body: JSON.stringify({ input: inputPath, output: outputPath, alpha_matting: alphaMatting, grant, feature, site_base_url: SITE_BASE_URL })
        });

        return await response.json();
    } catch (error: any) {
        if (error.name === 'AbortError') return { success: false, error: '处理超时，请重试' };
        return { success: false, error: error.message };
    }
}

/**
 * 图像降噪
 */
export async function denoiseImage(
    inputPath: string,
    outputPath: string,
    level: string = 'medium',
    grant: string = '',
    feature: string = 'ai-enhance'
): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
        const response = await fetchWithTimeout(`${ENGINE_URL}/denoise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${readStoredToken()}` },
            body: JSON.stringify({ input: inputPath, output: outputPath, level, grant, feature, site_base_url: SITE_BASE_URL })
        });

        return await response.json();
    } catch (error: any) {
        if (error.name === 'AbortError') return { success: false, error: '处理超时，请重试' };
        return { success: false, error: error.message };
    }
}

/**
 * 获取引擎状态
 */
export async function getEngineStatus(): Promise<{
    running: boolean;
    device?: string;
    version?: string;
}> {
    try {
        const response = await fetchWithTimeout(`${ENGINE_URL}/health`, {}, 5000);
        if (response.ok) {
            const data = await response.json();
            return { running: true, device: data.device, version: data.version };
        }
    } catch {
        // 引擎未运行或超时
    }
    return { running: false };
}

/**
 * 清理模型缓存
 */
export async function clearCache(): Promise<boolean> {
    try {
        const response = await fetchWithTimeout(`${ENGINE_URL}/clear_cache`, { method: 'POST' }, 10000);
        return response.ok;
    } catch {
        return false;
    }
}
