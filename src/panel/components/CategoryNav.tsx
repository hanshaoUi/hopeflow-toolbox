import React from 'react';
import { Category, CATEGORIES } from '@registry/categories';
import { Icon } from './Icon';

interface CategoryNavProps {
    selectedCategory: string | null;
    onSelectCategory: (categoryId: string) => void;
    scriptCounts: Record<string, number>;
    isExpanded: boolean;
    style?: React.CSSProperties;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
    selectedCategory,
    onSelectCategory,
    scriptCounts,
    isExpanded = false,
    style,
}) => {
    return (
        <div
            style={{
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 'var(--spacing-sm)',
                ...style
            }}
        >
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', padding: '0 var(--spacing-xs)' }}>
                {CATEGORIES.map((category) => (
                    <CategoryItem
                        key={category.id}
                        category={category}
                        isSelected={selectedCategory === category.id}
                        count={scriptCounts[category.id] || 0}
                        isExpanded={isExpanded}
                        onClick={() => onSelectCategory(category.id)}
                    />
                ))}
            </div>
        </div>
    );
};

interface CategoryItemProps {
    category: Category;
    isSelected: boolean;
    count: number;
    isExpanded: boolean;
    onClick: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
    category,
    isSelected,
    count,
    isExpanded,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            title={category.name}
            style={{
                width: '100%',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                padding: isExpanded ? '0 var(--spacing-sm)' : '0',
                margin: '0 0 2px 0',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'var(--color-bg-active)' : 'transparent',
                color: isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                position: 'relative',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.background = 'var(--color-bg-hover)';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
                width: '24px',
            }}>
                <Icon name={category.icon || 'magic'} size={18} />
            </div>

            {isExpanded && (
                <div style={{
                    marginLeft: 'var(--spacing-md)',
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 500,
                    opacity: 1,
                    transition: 'opacity 0.2s ease',
                }}>
                    {category.name}
                    {count > 0 && <span style={{ opacity: 0.5, marginLeft: '6px', fontSize: '10px' }}>({count})</span>}
                </div>
            )}

            {isSelected && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '20px',
                        background: 'var(--color-accent)',
                        borderRadius: '0 3px 3px 0',
                    }}
                />
            )}
        </button>
    );
};
