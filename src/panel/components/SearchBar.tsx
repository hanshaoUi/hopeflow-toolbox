import React, { useState, useEffect } from 'react';
import { searchScripts } from '@registry/script-manifest';

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleChange = (value: string) => {
        setQuery(value);
        onSearch(value);
    };

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <div
            style={{
                padding: 'var(--spacing-lg)',
                borderBottom: '1px solid var(--color-border)',
            }}
        >
            <div style={{ position: 'relative' }}>
                <div
                    style={{
                        position: 'absolute',
                        left: 'var(--spacing-md)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-tertiary)',
                        pointerEvents: 'none',
                        fontSize: '14px',
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>

                <input
                    id="search-input"
                    type="text"
                    className="input"
                    placeholder="搜索工具... (⌘K)"
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={{
                        paddingLeft: 'calc(var(--spacing-md) + 24px)',
                        paddingRight: query ? 'calc(var(--spacing-md) + 24px)' : undefined,
                    }}
                />

                {query && (
                    <button
                        onClick={handleClear}
                        style={{
                            position: 'absolute',
                            right: 'var(--spacing-md)',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-tertiary)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-bg-hover)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--color-text-tertiary)';
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {query && (
                <div
                    className="text-xs text-secondary"
                    style={{ marginTop: 'var(--spacing-xs)' }}
                >
                    找到 {searchScripts(query).length} 个工具
                </div>
            )}
        </div>
    );
};
