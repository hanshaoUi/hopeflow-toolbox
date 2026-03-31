import {
  BridgeAPI,
  ScriptParams,
  ScriptResult,
  HostInfo,
  HostMessage,
  DocumentInfo,
} from './types';

/**
 * UXP Bridge - placeholder for future Illustrator UXP support.
 *
 * When Adobe releases UXP for Illustrator, implement this class
 * to use the UXP scripting API instead of CSInterface.evalScript.
 *
 * Key differences from CEP:
 * - UXP uses `require('uxp').script.executeScript()` or direct DOM API
 * - No CSInterface; communication is through UXP host APIs
 * - Scripts may use modern JS instead of ExtendScript
 * - Native module support through UXP plugin API
 */
export class UXPBridge implements BridgeAPI {
  async initialize(): Promise<void> {
    throw new Error(
      'UXP Bridge is not yet implemented. ' +
      'Adobe Illustrator does not currently support UXP. ' +
      'Please use the CEP bridge instead.'
    );
  }

  async executeScript(_params: ScriptParams): Promise<ScriptResult> {
    return { success: false, error: 'UXP Bridge not implemented' };
  }

  async injectRuntime(_sessionToken: string): Promise<void> {
    throw new Error('UXP Bridge not implemented');
  }

  getHostInfo(): HostInfo {
    return {
      appName: 'ILST',
      appVersion: 'unknown',
      apiVersion: 'uxp-pending',
      locale: 'zh_CN',
    };
  }

  isReady(): boolean {
    return false;
  }

  onMessage(_handler: (message: HostMessage) => void): () => void {
    return () => {};
  }

  async getDocumentInfo(): Promise<DocumentInfo | null> {
    return null;
  }
}
