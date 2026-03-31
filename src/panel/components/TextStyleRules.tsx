import React, { useCallback, useState } from 'react';
import { getBridge } from '@bridge';

type MatchMode = 'exact' | 'regex';
type ScopeMode = 'selection' | 'document';

interface TextStyleRule {
    id: string;
    matchMode: MatchMode;
    pattern: string;
    applyColor: boolean;
    color: string;
    applySize: boolean;
    size: number | '';
}

interface RulePreset {
    label: string;
    matchMode: MatchMode;
    pattern: string;
    hint: string;
}

const RULE_PRESETS: RulePreset[] = [
    { label: '连续数字', matchMode: 'regex', pattern: '[0-9]+', hint: '例如 123 2025 88' },
    { label: '小数/整数', matchMode: 'regex', pattern: '[0-9]+(?:\\.[0-9]+)?', hint: '例如 12 12.5' },
    { label: '百分比', matchMode: 'regex', pattern: '[0-9]+(?:\\.[0-9]+)?%', hint: '例如 50% 12.5%' },
    { label: '英文字母', matchMode: 'regex', pattern: '[A-Za-z]+', hint: '例如 ABC abc Logo' },
    { label: '英文数字', matchMode: 'regex', pattern: '[A-Za-z0-9]+', hint: '例如 A12 SKU001' },
    { label: '大写英文', matchMode: 'regex', pattern: '[A-Z]+', hint: '例如 VIP SKU AI' },
    { label: '括号内容', matchMode: 'regex', pattern: '（[^）]+）|\\([^\\)]+\\)', hint: '例如（新品）(NEW)' },
    { label: '单个汉字', matchMode: 'regex', pattern: '[\\u4E00-\\u9FFF]', hint: '逐个中文字符命中' },
];

function createRuleId() {
    return `text-style-rule-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function createRule(): TextStyleRule {
    return {
        id: createRuleId(),
        matchMode: 'exact',
        pattern: '',
        applyColor: true,
        color: '#ff0000',
        applySize: false,
        size: '',
    };
}

function isValidHexColor(value: string) {
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value || '').trim());
}

export const TextStyleRules: React.FC = () => {
    const [scope, setScope] = useState<ScopeMode>('selection');
    const [rules, setRules] = useState<TextStyleRule[]>([createRule()]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: '' | 'ok' | 'err' | 'info'; text: string }>({ type: '', text: '' });

    const updateRule = useCallback((ruleId: string, patch: Partial<TextStyleRule>) => {
        setRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
    }, []);

    const removeRule = useCallback((ruleId: string) => {
        setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
    }, []);

    const addPresetRule = useCallback((preset: RulePreset) => {
        setRules((prev) => [
            ...prev,
            {
                ...createRule(),
                matchMode: preset.matchMode,
                pattern: preset.pattern,
            },
        ]);
    }, []);

    const buildPayload = useCallback(() => {
        const payload: Array<{
            matchMode: MatchMode;
            pattern: string;
            applyColor: boolean;
            colorHex: string;
            applySize: boolean;
            sizePt?: number;
        }> = [];

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            const pattern = String(rule.pattern || '').trim();
            const colorHex = String(rule.color || '').trim();
            const sizeValue = typeof rule.size === 'number' ? rule.size : parseFloat(String(rule.size || ''));

            if (!pattern) return { error: `第 ${i + 1} 条规则缺少匹配内容` };
            if (!rule.applyColor && !rule.applySize) return { error: `第 ${i + 1} 条规则至少启用颜色或字号` };
            if (rule.applyColor && !isValidHexColor(colorHex)) return { error: `第 ${i + 1} 条规则颜色格式无效` };
            if (rule.applySize && !(sizeValue > 0)) return { error: `第 ${i + 1} 条规则字号必须大于 0` };

            payload.push({
                matchMode: rule.matchMode,
                pattern,
                applyColor: rule.applyColor,
                colorHex,
                applySize: rule.applySize,
                sizePt: rule.applySize ? sizeValue : undefined,
            });
        }

        return { rules: payload };
    }, [rules]);

    const execute = useCallback(async () => {
        const payload = buildPayload();
        const errorText = (payload as any).error as string | undefined;
        if (errorText) {
            setMsg({ type: 'err', text: errorText });
            return;
        }

        setBusy(true);
        setMsg({ type: 'info', text: '正在应用文字规则...' });

        try {
            const bridge = await getBridge();
            const result = await bridge.executeScript({
                scriptId: 'text-style-rules',
                scriptPath: './src/scripts/text/text-style-rules.jsx',
                args: {
                    scope,
                    rules: payload.rules,
                },
            });

            if (result.success) {
                const data = (result.data || {}) as any;
                setMsg({
                    type: 'ok',
                    text: `已处理 ${data.processed_frames ?? 0} 个文本框，命中 ${data.matched_ranges ?? 0} 处，修改 ${data.modified_characters ?? 0} 个字符`,
                });
            } else {
                setMsg({ type: 'err', text: result.error || '执行失败' });
            }
        } catch (error: any) {
            setMsg({ type: 'err', text: error.message || '执行失败' });
        } finally {
            setBusy(false);
        }
    }, [buildPayload, scope]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="card" style={{ padding: 'var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>文字样式规则</span>
                    <button className="btn btn-sm" onClick={() => setRules((prev) => [...prev, createRule()])}>添加规则</button>
                </div>

                <div style={{ fontSize: '10px', lineHeight: 1.6, color: 'var(--color-text-tertiary)' }}>
                    支持单个汉字、词语精确匹配，也支持数字、字母等正则匹配。规则按从上到下执行，后面的规则会覆盖前面的颜色和字号。
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>常用内置规则</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {RULE_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                className="btn btn-sm"
                                onClick={() => addPresetRule(preset)}
                                title={`${preset.pattern} | ${preset.hint}`}
                                style={{ padding: '2px 8px' }}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '10px', lineHeight: 1.5, color: 'var(--color-text-tertiary)' }}>
                        点击即可插入预设。需要自定义时，再改下面规则里的匹配内容。
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        className="btn btn-sm"
                        onClick={() => setScope('selection')}
                        style={{ flex: 1, background: scope === 'selection' ? 'var(--color-accent)' : undefined, color: scope === 'selection' ? '#fff' : undefined }}
                    >
                        选区优先
                    </button>
                    <button
                        className="btn btn-sm"
                        onClick={() => setScope('document')}
                        style={{ flex: 1, background: scope === 'document' ? 'var(--color-accent)' : undefined, color: scope === 'document' ? '#fff' : undefined }}
                    >
                        整个文档
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rules.map((rule, index) => (
                        <div key={rule.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>规则 {index + 1}</span>
                                <select className="select" value={rule.matchMode} onChange={(e) => updateRule(rule.id, { matchMode: e.target.value as MatchMode })} style={{ flex: 1, fontSize: '11px', minHeight: '28px' }}>
                                    <option value="exact">精确匹配</option>
                                    <option value="regex">正则匹配</option>
                                </select>
                                {rules.length > 1 && <button className="btn btn-sm" onClick={() => removeRule(rule.id)}>删除</button>}
                            </div>

                            {rule.matchMode === 'regex' && (
                                <select
                                    className="select"
                                    value=""
                                    onChange={(e) => {
                                        const nextPattern = e.target.value;
                                        if (!nextPattern) return;
                                        updateRule(rule.id, { pattern: nextPattern });
                                        e.currentTarget.value = '';
                                    }}
                                    style={{ fontSize: '11px', minHeight: '28px' }}
                                >
                                    <option value="">选择内置正则模板</option>
                                    {RULE_PRESETS.filter((preset) => preset.matchMode === 'regex').map((preset) => (
                                        <option key={preset.label} value={preset.pattern}>
                                            {preset.label} | {preset.hint}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <input
                                className="input"
                                value={rule.pattern}
                                onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                                placeholder={rule.matchMode === 'regex' ? '例如 [0-9]+ 或 [A-Za-z]+' : '例如 单字、词语、SKU'}
                                style={{ height: '28px' }}
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={rule.applyColor} onChange={(e) => updateRule(rule.id, { applyColor: e.target.checked })} />
                                    颜色
                                </label>
                                {rule.applyColor && (
                                    <>
                                        <input type="color" value={isValidHexColor(rule.color) ? rule.color : '#ff0000'} onChange={(e) => updateRule(rule.id, { color: e.target.value })} style={{ width: '34px', height: '28px', padding: 0, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'transparent' }} />
                                        <input className="input" value={rule.color} onChange={(e) => updateRule(rule.id, { color: e.target.value })} placeholder="#FF0000" style={{ width: '96px', height: '28px' }} />
                                    </>
                                )}

                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={rule.applySize} onChange={(e) => updateRule(rule.id, { applySize: e.target.checked })} />
                                    字号
                                </label>
                                {rule.applySize && (
                                    <input className="input" type="number" value={rule.size} min={0.1} step={0.1} onChange={(e) => updateRule(rule.id, { size: e.target.value === '' ? '' : parseFloat(e.target.value) })} placeholder="12" style={{ width: '80px', height: '28px' }} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button className="btn btn-primary" onClick={execute} disabled={busy} style={{ width: '100%' }}>
                {busy ? <><span className="spinner" /> 执行中...</> : '执行'}
            </button>

            {msg.text && (
                <div className={msg.type === 'err' ? 'alert alert-error' : msg.type === 'ok' ? 'alert alert-success' : 'alert alert-info'} style={{ padding: '8px 12px', marginBottom: 0, fontSize: 'var(--font-size-xs)' }}>
                    {msg.text}
                </div>
            )}
        </div>
    );
};
