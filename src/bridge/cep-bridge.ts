import fs from 'fs';
import path from 'path';
import {
  BridgeAPI,
  ScriptParams,
  ScriptResult,
  HostInfo,
  HostMessage,
  DocumentInfo,
} from './types';

/**
 * CSInterface and CSEvent will be loaded from the global CSInterface.js file
 */
interface CSEvent {
  type: string;
  data: string;
}

const EXTENSION_PATH = 'extension';

/**
 * CEP Bridge implementation.
 * Wraps CSInterface.evalScript with promises, error handling,
 * runtime injection, and result parsing.
 */
export class CEPBridge implements BridgeAPI {
  private cs: any; // CSInterface instance from window
  private ready: boolean = false;
  private runtimeInjected: boolean = false;
  private messageHandlers: Set<(message: HostMessage) => void> = new Set();
  private isMockMode: boolean = false; // Fallback mode without real CEP

  constructor() {
    console.log('[CEPBridge] Initializing constructor...');
    console.log('[CEPBridge] window.__adobe_cep__:', typeof (window as any).__adobe_cep__);
    console.log('[CEPBridge] window.CSInterface:', typeof (window as any).CSInterface);

    // Check if CSInterface is available
    if (typeof (window as any).CSInterface !== 'undefined') {
      try {
        this.cs = new (window as any).CSInterface();
        console.log('[CEPBridge] CSInterface instance created successfully');
      } catch (error) {
        console.error('[CEPBridge] Failed to create CSInterface:', error);
        throw error;
      }
    } else {
      console.warn('[CEPBridge] CSInterface not found - checking for Adobe CEP environment');

      // Check if we're at least in Adobe CEP environment
      if (typeof (window as any).__adobe_cep__ !== 'undefined') {
        console.warn('[CEPBridge] Adobe CEP detected but CSInterface class not found');
        console.warn('[CEPBridge] This might be a loading order issue');
        throw new Error('CSInterface class not loaded. Please check that CSInterface.js is loaded before this script.');
      } else {
        console.warn('[CEPBridge] Not running in Adobe CEP environment - enabling MOCK MODE for development');
        this.isMockMode = true;
        this.cs = this.createMockCSInterface();
      }
    }
  }

  /**
   * Create a mock CSInterface for development/testing outside Illustrator
   */
  private createMockCSInterface() {
    return {
      getHostEnvironment: () => ({
        appName: 'ILST',
        appVersion: '28.0',
        appLocale: 'zh_CN',
      }),
      evalScript: (script: string, callback?: (result: string) => void) => {
        console.warn('[MockCSInterface] evalScript called:', script.substring(0, 100));
        if (callback) {
          callback('{"success": false, "error": "Mock mode - script not executed"}');
        }
      },
      addEventListener: () => { },
      removeEventListener: () => { },
      getSystemPath: (type: string) => {
        // Return mock paths based on current working directory
        if (type === 'extension') {
          return typeof __dirname !== 'undefined' ? __dirname : '.';
        }
        return '/mock/path';
      },
    };
  }

  async initialize(): Promise<void> {
    console.log('[CEPBridge] Initialize called, isMockMode:', this.isMockMode);

    if (this.isMockMode) {
      console.warn('[CEPBridge] Running in MOCK MODE - script execution will not work');
      this.ready = true;
      this.runtimeInjected = true; // Skip runtime injection in mock mode
      return;
    }

    // Verify we're running inside a CEP panel
    try {
      console.log('[CEPBridge] Getting host environment...');
      const hostEnv = this.cs.getHostEnvironment();
      console.log('[CEPBridge] Host environment:', hostEnv);

      if (!hostEnv?.appName) {
        throw new Error('Not running in a CEP environment - hostEnv is invalid');
      }
      this.ready = true;

      // Listen for host events
      this.cs.addEventListener('com.hopeflow.message', (event: CSEvent) => {
        try {
          const message: HostMessage = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (e) {
          console.warn('[CEPBridge] Invalid host message format:', e);
        }
      });

      // Automatically inject runtime after initialization
      console.log('[CEPBridge] Injecting runtime...');
      await this.injectRuntime();
      console.log('[CEPBridge] Runtime injected successfully');
    } catch (error: any) {
      console.error('[CEPBridge] Initialization failed:', error);
      // Propagate the actual error message for debugging
      throw new Error(`连接失败: ${error.message || error}`);
    }
  }

  async executeScript(params: ScriptParams): Promise<ScriptResult> {
    if (!this.ready) {
      return { success: false, error: 'Bridge not initialized' };
    }

    if (this.isMockMode) {
      console.warn('[CEPBridge] Mock mode - returning fake success');
      return {
        success: true,
        data: { message: 'Mock mode - script not actually executed' },
        executionTime: 0,
      };
    }

    if (!this.runtimeInjected) {
      return { success: false, error: 'Runtime not injected. Call injectRuntime() first.' };
    }

    const startTime = Date.now();

    try {
      let scriptContent: string;
      let resolvedScriptPath = '';

      if (params.scriptContent) {
        // Pre-decrypted content (from server or local decryption)
        scriptContent = params.scriptContent;
      } else if (params.scriptPath) {
        // Direct file path (dev mode)
        let scriptToLoad = params.scriptPath;

        // If path is relative (starts with .), resolve it relative to extension root
        if (scriptToLoad.startsWith('.')) {
          const extensionPath = this.cs.getSystemPath(EXTENSION_PATH);
          scriptToLoad = path.join(extensionPath, scriptToLoad);
        }

        resolvedScriptPath = scriptToLoad;
        console.log(`[CEPBridge] Loading script from: ${scriptToLoad}`);
        scriptContent = fs.readFileSync(scriptToLoad, 'utf8');
      } else {
        return { success: false, error: 'No script content or path provided' };
      }

      // Wrap script with argument injection
      const wrappedScript = this.wrapScript(params.scriptId, scriptContent, params.args, resolvedScriptPath);

      // Execute via CSInterface
      const rawResult = await this.evalScriptAsync(wrappedScript);
      const executionTime = Date.now() - startTime;

      console.log('[CEPBridge] Raw result:', rawResult);
      console.log('[CEPBridge] Raw result type:', typeof rawResult);

      // Parse result
      try {
        const parsed = JSON.parse(rawResult);
        console.log('[CEPBridge] Parsed result:', parsed);
        return {
          success: parsed.success !== false,
          data: parsed.data,
          error: parsed.error,
          executionTime,
        };
      } catch {
        // Result is a plain string (some scripts return non-JSON)
        if (rawResult === 'EvalScript error.' || rawResult.startsWith('Error:')) {
          return { success: false, error: rawResult, executionTime };
        }
        return { success: true, data: rawResult, executionTime };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '脚本执行失败',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async injectRuntime(): Promise<void> {
    if (!this.ready) {
      throw new Error('Bridge not initialized');
    }

    // Read scripts
    const extensionPath = this.cs.getSystemPath(EXTENSION_PATH);
    const bootstrapPath = path.join(extensionPath, 'src', 'scripts', '_runtime', 'bootstrap.jsx');
    const utilsPath = path.join(extensionPath, 'src', 'scripts', '_runtime', 'utils.jsx');

    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    const bootstrapContent = fs.readFileSync(bootstrapPath, 'utf8');

    // 1. Initialize namespace
    console.log('[CEPBridge] 1. Initializing namespace...');
    const initScript = `
      if (typeof $.hopeflow === 'undefined') $.hopeflow = {};
      "SUCCESS";
    `;
    await this.evalScriptAsync(initScript);

    // 2. Inject Utils
    console.log('[CEPBridge] 2. Injecting utils...');
    try {
      await this.evalScriptAsync(utilsContent);
      // Verify utils
      const utilsCheck = await this.evalScriptAsync('typeof $.hopeflow.utils !== "undefined" && typeof $.hopeflow.utils.getSelection === "function"');
      if (utilsCheck !== 'true') throw new Error('Utils failed to load');
    } catch (e: any) {
      throw new Error(`Utils injection failed: ${e.message || e}`);
    }

    // 3. Inject Bootstrap
    console.log('[CEPBridge] 3. Injecting bootstrap...');
    try {
      await this.evalScriptAsync(bootstrapContent);
    } catch (e: any) {
      throw new Error(`Bootstrap injection failed: ${e.message || e}`);
    }

    // 4. Final Verification
    const checkResult = await this.evalScriptAsync(
      'typeof $.hopeflow !== "undefined" && $.hopeflow.ready === true'
    );

    if (checkResult !== 'true') {
      // Try to get failure reason if possible
      const reason = await this.evalScriptAsync('$.hopeflow && $.hopeflow.ready === false ? "Ready flag is false" : "Namespace missing"');
      throw new Error(`Runtime verification failed: ${reason}`);
    }

    this.runtimeInjected = true;
  }

  getHostInfo(): HostInfo {
    const env = this.cs.getHostEnvironment();
    return {
      appName: env.appName,
      appVersion: env.appVersion,
      apiVersion: '9.0', // CEP API version
      locale: env.appLocale,
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  onMessage(handler: (message: HostMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  async getDocumentInfo(): Promise<DocumentInfo | null> {
    const script = `
      (function() {
        if (!app.documents.length) return JSON.stringify(null);
        var doc = app.activeDocument;
        return JSON.stringify({
          name: doc.name,
          path: doc.fullName ? doc.fullName.fsName : '',
          width: doc.width,
          height: doc.height,
          artboardCount: doc.artboards.length,
          layerCount: doc.layers.length,
          selectionCount: doc.selection ? doc.selection.length : 0,
          colorMode: doc.documentColorSpace == DocumentColorSpace.CMYK ? 'CMYK' : 'RGB'
        });
      })();
    `;

    const result = await this.evalScriptAsync(script);
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /**
   * Escape a string for safe interpolation into an ExtendScript string literal.
   */
  private escapeExtendScript(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  /**
   * Encode non-ASCII characters in script source as \uXXXX escapes.
   * CEP's evalScript on Windows can corrupt non-ASCII characters during
   * transmission from the Chromium panel to the ExtendScript engine.
   * Encoding them as ASCII-safe \uXXXX sequences prevents this.
   */
  private encodeNonAsciiForEvalScript(content: string): string {
    return content.replace(/[^\x00-\x7F]/g, (ch) => {
      const code = ch.charCodeAt(0);
      return '\\u' + code.toString(16).padStart(4, '0');
    });
  }

  /**
   * Wrap a script with argument injection and error handling
   */
  private wrapScript(
    scriptId: string,
    content: string,
    args?: Record<string, unknown>,
    scriptPath?: string
  ): string {
    const safeScriptId = this.escapeExtendScript(scriptId);
    const safeScriptPath = this.encodeNonAsciiForEvalScript(this.escapeExtendScript(scriptPath || ''));
    // JSON.stringify produces a string safe for JS parsing; use it as-is for the args object.
    const argsJson = JSON.stringify(args || {});
    // Encode non-ASCII (e.g. Chinese) characters as \uXXXX to survive CEP evalScript transmission.
    const safeContent = this.encodeNonAsciiForEvalScript(content);
    return `
      (function() {
        try {
          // Internal variables for script content
          var __SCRIPT_ID__ = "${safeScriptId}";
          var __SCRIPT_PATH__ = "${safeScriptPath}";
          var __ARGS_OBJ__ = ${argsJson};

          // Inject into hopeflow namespace for child scripts
          if (typeof $.hopeflow !== 'undefined') {
              $.hopeflow._currentScriptId = __SCRIPT_ID__;
              $.hopeflow._currentScriptPath = __SCRIPT_PATH__;
              $.hopeflow._currentArgs = __ARGS_OBJ__;
              $.hopeflow._lastResult = '';
          }

          var __ARGS__ = __ARGS_OBJ__;

          // Execute the actual script content
          ${safeContent}

          // Many scripts store the real payload in $.hopeflow._lastResult.
          if (typeof $.hopeflow !== 'undefined' && $.hopeflow._lastResult) {
            return $.hopeflow._lastResult;
          }
          return '{"success":true,"data":null}';
        } catch(e) {
          var __err__ = (e.message || String(e)).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');
          return '{"success":false,"error":"' + __err__ + '"}';
        }
      })();
    `;
  }

  /**
   * Promise wrapper around CSInterface.evalScript
   */
  private evalScriptAsync(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.cs.evalScript(script, (result: string) => {
          if (result === 'EvalScript error.') {
            reject(new Error('ExtendScript evaluation error'));
          } else {
            resolve(result);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
