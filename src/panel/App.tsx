import React, { useState, useMemo, useEffect } from 'react';
import { CategoryNav, MaterialLibrary, Settings } from './components';
import { ScriptCard } from './components';
import {
    SCRIPT_REGISTRY,
    getScriptsByCategory,
    searchScripts,
} from '@registry/script-manifest';
import { CATEGORIES } from '@registry/categories';
import { useSettings } from './hooks/useSettings';
import './styles/theme.css';

const SETTINGS_ID = '__settings__';

export const App: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        CATEGORIES[0]?.id || null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedScriptId, setExpandedScriptId] = useState<string | null>(null);

    const scriptCounts = useMemo(() => {
        return CATEGORIES.reduce((acc, cat) => {
            acc[cat.id] = getScriptsByCategory(cat.id).length;
            return acc;
        }, {} as Record<string, number>);
    }, []);

    const isSettings = selectedCategory === SETTINGS_ID;

    const baseScripts = useMemo(() => {
        if (searchQuery) {
            return searchScripts(searchQuery);
        }

        if (selectedCategory && !isSettings) {
            return getScriptsByCategory(selectedCategory);
        }

        return [];
    }, [isSettings, searchQuery, selectedCategory]);

    // Search handler
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query) {
            setSelectedCategory(null);
        }
    };

    const handleSelectCategory = (id: string) => {
        setSelectedCategory(id);
        setSearchQuery('');
        setExpandedScriptId(null);
    };

    // Cmd+K to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const { settings, update } = useSettings();

    const sidebarExpanded = settings.sidebarExpanded;
    const setSidebarExpanded = (expanded: boolean) => update('sidebarExpanded', expanded);

    useEffect(() => {
        try {
            update('sidebarExpanded', sidebarExpanded);
        } catch { /* ignore */ }
    }, [sidebarExpanded]);

    // ─── Main Render ──────────────────────────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
            {/* Left Sidebar */}
            <div
                style={{
                    width: sidebarExpanded ? '140px' : '60px',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--color-bg-secondary)',
                    borderRight: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Plugin Header/Title */}
                <div style={{
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    borderBottom: '1px solid var(--color-border)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(135deg, var(--color-accent) 0%, #2563eb 100%)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        flexShrink: 0,
                        marginRight: '12px'
                    }}>
                        H
                    </div>
                    {sidebarExpanded && (
                        <span style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: 'var(--color-text-primary)',
                            opacity: 1,
                            transition: 'opacity 0.2s'
                        }}>
                            HopeFlow
                        </span>
                    )}
                </div>

                <CategoryNav
                    selectedCategory={isSettings ? null : selectedCategory}
                    onSelectCategory={handleSelectCategory}
                    scriptCounts={scriptCounts}
                    isExpanded={sidebarExpanded}
                    style={{ borderRight: 'none', width: '100%', flex: 1 }}
                />

                {/* Settings Button */}
                <button
                    onClick={() => handleSelectCategory(SETTINGS_ID)}
                    title="设置"
                    style={{
                        height: '40px',
                        background: isSettings ? 'var(--color-bg-active)' : 'transparent',
                        color: isSettings ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                        padding: sidebarExpanded ? '0 16px' : '0',
                        gap: '12px',
                        border: 'none',
                        borderTop: '1px solid var(--color-border)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                        if (!isSettings) {
                            e.currentTarget.style.background = 'var(--color-bg-hover)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isSettings) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }
                    }}
                >
                    <div style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z" />
                        </svg>
                    </div>
                    {sidebarExpanded && (
                        <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 500 }}>设置</span>
                    )}
                </button>

                {/* Sidebar Toggle Button */}
                <button
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    title={sidebarExpanded ? '收起侧边栏' : '展开侧边栏'}
                    style={{
                        height: '40px',
                        borderTop: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: sidebarExpanded ? 'flex-end' : 'center',
                        padding: sidebarExpanded ? '0 16px' : '0',
                        fontSize: '12px',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: 'none'
                    }}
                >
                    {sidebarExpanded ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>收起</span>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                        </div>
                    ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Right Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)', minWidth: 0 }}>
                {/* Top Bar: Search */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-sm)',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                    }}
                >
                    <div style={{ flex: 1, position: 'relative' }}>
                        <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="currentColor"
                            style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                opacity: 0.4,
                                pointerEvents: 'none',
                            }}
                        >
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input
                            id="search-input"
                            type="text"
                            className="input"
                            placeholder="搜索工具... (Ctrl+K)"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{
                                paddingLeft: '30px',
                                height: '32px',
                                fontSize: 'var(--font-size-sm)',
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => handleSearch('')}
                                style={{
                                    position: 'absolute',
                                    right: '6px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-tertiary)',
                                    cursor: 'pointer',
                                    padding: '2px 4px',
                                    fontSize: '12px',
                                    lineHeight: 1,
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        className="btn btn-icon btn-sm"
                        onClick={() => window.location.reload()}
                        title="刷新面板 (Refresh Plugin)"
                        style={{
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                    </button>
                </div>

                {/* Main Area: Settings or Scripts */}
                {isSettings ? (
                    <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-md)' }}>
                        <Settings />
                    </div>
                ) : selectedCategory === 'library' ? (
                    <MaterialLibrary />
                ) : (
                    <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
                        {baseScripts.length === 0 ? (
                            <div style={{ textAlign: 'center', paddingTop: '48px' }}>
                                <p className="text-secondary">
                                    {searchQuery ? '未找到匹配的工具' : '此分类暂无工具'}
                                </p>
                            </div>
                        ) : (
                            <div>
                                {searchQuery && (
                                    <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
                                        <p className="text-sm text-secondary">
                                            搜索结果：{baseScripts.length} 个工具
                                        </p>
                                    </div>
                                )}
                                {baseScripts.map((script) => (
                                    <ScriptCard
                                        key={script.id}
                                        script={script}
                                        isExpanded={expandedScriptId === script.id}
                                        onToggle={() => setExpandedScriptId(expandedScriptId === script.id ? null : script.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
