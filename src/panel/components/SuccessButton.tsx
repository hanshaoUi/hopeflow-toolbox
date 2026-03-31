import React, { useState } from 'react';

// Extend standard button props to support title, disabled, etc.
interface SuccessButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onClick: (e?: React.MouseEvent) => Promise<void> | void;
    children: React.ReactNode;
    successDuration?: number;
}

export const SuccessButton: React.FC<SuccessButtonProps> = ({
    onClick,
    disabled,
    className,
    style,
    children,
    successDuration = 1500,
    ...props
}) => {
    const [success, setSuccess] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent accordion toggle
        try {
            await onClick(e);
            setSuccess(true);
            setTimeout(() => setSuccess(false), successDuration);
        } catch (error) {
            // If onClick fails without handling error internally, we might not want to show success
            console.error(error);
        }
    };

    return (
        <button
            className={`${className || ''} ${success ? 'btn-success' : ''}`}
            onClick={handleClick}
            disabled={disabled || success}
            style={{
                ...style,
                transition: 'all 0.3s ease',
                backgroundColor: success ? 'var(--color-success)' : undefined,
                borderColor: success ? 'var(--color-success)' : undefined
            }}
            {...props}
        >
            {success ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                    <span style={{ fontSize: 'inherit' }}>完成</span>
                </span>
            ) : children}
        </button>
    );
};
