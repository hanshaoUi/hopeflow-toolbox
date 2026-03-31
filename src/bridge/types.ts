/**
 * Bridge types - shared interface between CEP and future UXP implementations.
 * This abstraction layer is the key to migrating from CEP to UXP when Adobe
 * releases Illustrator UXP support.
 */

export interface ScriptParams {
  scriptId: string;
  scriptContent?: string;   // Pre-decrypted script content
  scriptPath?: string;       // Path to .jsx file (dev mode)
  args?: Record<string, unknown>;
}

export interface ScriptResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime?: number;
}

export interface HostInfo {
  appName: string;
  appVersion: string;
  apiVersion: string;
  locale: string;
}

export interface BridgeAPI {
  /**
   * Initialize the bridge (inject runtime, verify host)
   */
  initialize(): Promise<void>;

  /**
   * Execute an ExtendScript in the host application
   */
  executeScript(params: ScriptParams): Promise<ScriptResult>;

  /**
   * Inject the runtime bootstrap into the host
   * Must be called before executing any tool scripts
   */
  injectRuntime(sessionToken: string): Promise<void>;

  /**
   * Get host application information
   */
  getHostInfo(): HostInfo;

  /**
   * Check if the bridge is connected and ready
   */
  isReady(): boolean;

  /**
   * Listen for messages from the host application
   */
  onMessage(handler: (message: HostMessage) => void): () => void;

  /**
   * Get the current document info from the host
   */
  getDocumentInfo(): Promise<DocumentInfo | null>;
}

export interface HostMessage {
  type: string;
  data: unknown;
}

export interface DocumentInfo {
  name: string;
  path: string;
  width: number;
  height: number;
  artboardCount: number;
  layerCount: number;
  selectionCount: number;
  colorMode: 'CMYK' | 'RGB';
}

export type BridgeType = 'cep' | 'uxp';
