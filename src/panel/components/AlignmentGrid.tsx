import React, { useState } from 'react';

interface AlignmentGridProps {
    onAlign: (alignment: string) => void;
    disabled?: boolean;
}

const ALIGN_LABELS: Record<string, string> = {
    'top-left': '左上',
    'top': '顶部居中',
    'top-right': '右上',
    'left': '左侧居中',
    'center': '居中',
    'right': '右侧居中',
    'bottom-left': '左下',
    'bottom': '底部居中',
    'bottom-right': '右下',
};

const AlignIcon = ({ type }: { type: string }) => {
    const iconStyle = { width: 22, height: 22 };
    const barColor = 'currentColor';
    const objColor = 'var(--color-accent)';

    switch (type) {
        case 'top-left':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M2 2h3v20H2z" fill={barColor} opacity="0.35" />
                    <path d="M2 2h20v3H2z" fill={barColor} opacity="0.35" />
                    <rect x="5" y="5" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        case 'top':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M2 2h20v3H2z" fill={barColor} opacity="0.35" />
                    <rect x="7" y="5" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        case 'top-right':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M19 2h3v20h-3z" fill={barColor} opacity="0.35" />
                    <path d="M2 2h20v3H2z" fill={barColor} opacity="0.35" />
                    <rect x="9" y="5" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        case 'left':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M2 2h3v20H2z" fill={barColor} opacity="0.35" />
                    <rect x="5" y="7" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        case 'center':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M11 2h2v20h-2z" fill={barColor} opacity="0.2" />
                    <path d="M2 11h20v2H2z" fill={barColor} opacity="0.2" />
                    <rect x="7" y="7" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        case 'right':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M19 2h3v20h-3z" fill={barColor} opacity="0.35" />
                    <rect x="9" y="7" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        case 'bottom-left':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M2 2h3v20H2z" fill={barColor} opacity="0.35" />
                    <path d="M2 19h20v3H2z" fill={barColor} opacity="0.35" />
                    <rect x="5" y="9" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        case 'bottom':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M2 19h20v3H2z" fill={barColor} opacity="0.35" />
                    <rect x="7" y="9" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        case 'bottom-right':
            return (
                <svg viewBox="0 0 24 24" style={iconStyle}>
                    <path d="M19 2h3v20h-3z" fill={barColor} opacity="0.35" />
                    <path d="M2 19h20v3H2z" fill={barColor} opacity="0.35" />
                    <rect x="9" y="9" width="10" height="10" rx="1.5" fill={objColor} />
                </svg>
            );
        default:
            return null;
    }
};

export const AlignmentGrid: React.FC<AlignmentGridProps> = ({ onAlign, disabled }) => {
    const [activeBtn, setActiveBtn] = useState<string | null>(null);

    const alignments = [
        'top-left', 'top', 'top-right',
        'left', 'center', 'right',
        'bottom-left', 'bottom', 'bottom-right'
    ];

    const handleClick = (align: string) => {
        setActiveBtn(align);
        onAlign(align);
        setTimeout(() => setActiveBtn(null), 600);
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                width: '100%',
                maxWidth: '240px',
                margin: '0 auto',
                padding: 'var(--spacing-xs) 0',
            }}
        >
            {alignments.map((align) => {
                const isActive = activeBtn === align;
                return (
                    <button
                        key={align}
                        onClick={() => handleClick(align)}
                        disabled={disabled}
                        title={ALIGN_LABELS[align]}
                        className="btn"
                        style={{
                            padding: '10px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            minWidth: 'unset',
                            height: 'auto',
                            background: isActive ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                            border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                            color: isActive ? '#fff' : 'var(--color-text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <AlignIcon type={align} />
                        <span style={{ fontSize: '10px', lineHeight: 1, opacity: 0.7 }}>
                            {ALIGN_LABELS[align]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
