import { useState, useCallback } from 'react';
import { getBridge } from '@bridge';
import { ScriptMetadata, ScriptParam } from '@registry/script-manifest';

export interface ScriptExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface ScriptRunnerState {
    isExecuting: boolean;
    currentScriptId: string | null;
    lastResult: ScriptExecutionResult | null;
    error: string | null;
}

export function useScriptRunner() {
    const [state, setState] = useState<ScriptRunnerState>({
        isExecuting: false,
        currentScriptId: null,
        lastResult: null,
        error: null,
    });

    /**
     * Execute a local script (bundled with plugin)
     */
    const executeLocalScript = useCallback(
        async (script: ScriptMetadata, params: Record<string, any> = {}) => {
            setState((prev) => ({
                ...prev,
                isExecuting: true,
                currentScriptId: script.id,
                error: null,
            }));

            try {
                const bridge = await getBridge();

                // Construct script path
                const scriptPath = `./src/scripts/${script.category}/${script.id}.jsx`;

                // Execute via bridge
                const result = await bridge.executeScript({
                    scriptId: script.id,
                    scriptPath,
                    args: params,
                });

                setState((prev) => ({
                    ...prev,
                    isExecuting: false,
                    currentScriptId: null,
                    lastResult: result,
                }));

                return result;
            } catch (error: any) {
                const errorMessage = error.message || '脚本执行失败';
                setState((prev) => ({
                    ...prev,
                    isExecuting: false,
                    currentScriptId: null,
                    error: errorMessage,
                    lastResult: { success: false, error: errorMessage },
                }));

                return { success: false, error: errorMessage };
            }
        },
        []
    );

    /**
     * Execute a script
     */
    const executeScript = useCallback(
        async (script: ScriptMetadata, params: Record<string, any> = {}) => {
            return executeLocalScript(script, params);
        },
        [executeLocalScript]
    );

    /**
     * Validate script parameters
     */
    const validateParams = useCallback(
        (script: ScriptMetadata, params: Record<string, any>): string | null => {
            if (!script.params) return null;

            for (const param of script.params) {
                if (param.required && !params[param.name]) {
                    return `参数 "${param.label}" 是必填项`;
                }

                if (params[param.name] !== undefined) {
                    const value = params[param.name];

                    if (param.type === 'number' && typeof value !== 'number') {
                        return `参数 "${param.label}" 必须是数字`;
                    }

                    if (param.type === 'boolean' && typeof value !== 'boolean') {
                        return `参数 "${param.label}" 必须是布尔值`;
                    }

                    if (
                        param.type === 'select' &&
                        param.options &&
                        !param.options.some((opt) => opt.value === value)
                    ) {
                        return `参数 "${param.label}" 的值无效`;
                    }
                }
            }

            return null;
        },
        []
    );

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    return {
        ...state,
        executeScript,
        executeLocalScript,
        validateParams,
        clearError,
    };
}
