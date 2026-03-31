import React, { useState } from 'react';

interface PositionGridProps {
    onSelect: (position: string) => void;
    disabled?: boolean;
    selectedPosition?: string;
}

const POSITION_LABELS: Record<string, string> = {
    '1': '左上角',
    '2': '顶部中心',
    '3': '右上角',
    '4': '左侧中心',
    '5': '中心',
    '6': '右侧中心',
    '7': '左下角',
    '8': '底部中心',
    '9': '右下角',
};

const PositionIcon = ({ position }: { position: string }) => {
    const iconStyle = { width: 22, height: 22 };
    const dotColor = 'var(--color-accent)';
    const boxColor = 'currentColor';

    // 根据位置绘制一个框和一个点
    const getPositionCoords = (pos: string) => {
        const positions: Record<string, { x: number; y: number }> = {
            '1': { x: 5, y: 5 },    // 左上
            '2': { x: 12, y: 5 },   // 顶部中心
            '3': { x: 19, y: 5 },   // 右上
            '4': { x: 5, y: 12 },   // 左侧中心
            '5': { x: 12, y: 12 },  // 中心
            '6': { x: 19, y: 12 },  // 右侧中心
            '7': { x: 5, y: 19 },   // 左下
            '8': { x: 12, y: 19 },  // 底部中心
            '9': { x: 19, y: 19 },  // 右下
        };
        return positions[pos] || { x: 12, y: 12 };
    };

    const coords = getPositionCoords(position);

    return (
        <svg viewBox="0 0 24 24" style={iconStyle}>
            {/* 外框 */}
            <rect x="4" y="4" width="16" height="16" rx="1.5" fill="none" stroke={boxColor} strokeWidth="1.5" opacity="0.3" />
            {/* 定位点 */}
            <circle cx={coords.x} cy={coords.y} r="2.5" fill={dotColor} />
        </svg>
    );
};

export const PositionGrid: React.FC<PositionGridProps> = ({ onSelect, disabled, selectedPosition = '5' }) => {
    const [activeBtn, setActiveBtn] = useState<string | null>(null);

    const positions = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const handleClick = (position: string) => {
        setActiveBtn(position);
        onSelect(position);
        setTimeout(() => setActiveBtn(null), 300);
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
            {positions.map((position) => {
                const isActive = activeBtn === position;
                const isSelected = selectedPosition === position;
                return (
                    <button
                        key={position}
                        onClick={() => handleClick(position)}
                        disabled={disabled}
                        title={POSITION_LABELS[position]}
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
                            background: isActive ? 'var(--color-accent)' : isSelected ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)',
                            border: isActive ? '1px solid var(--color-accent)' : isSelected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                            color: isActive ? '#fff' : 'var(--color-text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <PositionIcon position={position} />
                        <span style={{ fontSize: '10px', lineHeight: 1, opacity: 0.7 }}>
                            {POSITION_LABELS[position]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
