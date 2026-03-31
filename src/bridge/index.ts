import { BridgeAPI, BridgeType } from './types';
import { CEPBridge } from './cep-bridge';
import { UXPBridge } from './uxp-bridge';

export type { BridgeAPI, ScriptParams, ScriptResult, HostInfo, HostMessage, DocumentInfo } from './types';

/**
 * Detect the current runtime environment
 */
function detectBridgeType(): BridgeType {
  // Check for UXP environment
  if (typeof (globalThis as any).require === 'function') {
    try {
      (globalThis as any).require('uxp');
      return 'uxp';
    } catch {
      // Not UXP
    }
  }

  // Default to CEP
  return 'cep';
}

/**
 * Create the appropriate bridge instance for the current environment
 */
export function createBridge(type?: BridgeType): BridgeAPI {
  const bridgeType = type || detectBridgeType();

  switch (bridgeType) {
    case 'uxp':
      return new UXPBridge();
    case 'cep':
    default:
      return new CEPBridge();
  }
}

// Singleton bridge instance
let _bridge: BridgeAPI | null = null;
let _initPromise: Promise<BridgeAPI> | null = null;

/**
 * Get the singleton bridge instance (auto-initializes on first call)
 */
export async function getBridge(): Promise<BridgeAPI> {
  if (_bridge) {
    return _bridge;
  }

  // If initialization is already in progress, wait for it
  if (_initPromise) {
    return _initPromise;
  }

  // Start initialization
  _initPromise = (async () => {
    try {
      const bridge = createBridge();
      await bridge.initialize();
      _bridge = bridge;
      return bridge;
    } catch (err) {
      // Reset so subsequent calls can retry initialization
      _initPromise = null;
      throw err;
    }
  })();

  return _initPromise;
}

export async function initializeBridge(): Promise<BridgeAPI> {
  return getBridge();
}
