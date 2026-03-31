import React from 'react';

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: React.CSSProperties;
}

const ICONS: Record<string, React.ReactNode> = {
    'activity': (
        <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            points="22 12 18 12 15 21 9 3 6 12 2 12" />
    ),
    'align-center': (
        <path fill="currentColor" d="M4 6h16v2H4zm6 5h6v2h-6zm-4 5h12v2H6z" />
    ),
    'artboard': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M4 4h16v16H4z" />
            <path fill="currentColor" d="M2 9h2v2H2zm0 4h2v2H2zM9 2v2h2V2zm4 0v2h2V2zM20 9h2v2h-2zm0 4h2v2h-2zM9 20v2h2v-2zm4 0v2h2v-2z" />
        </>
    ),
    'artboard-add': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 4h11v2H6v12h12v-9h2v11H4V4z" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 2v6m-3-3h6" />
        </>
    ),
    'artboard-fit': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M4 4h16v16H4z" />
            <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                points="8 15 12 9 16 15" />
        </>
    ),
    'circle': (
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    ),
    'code': (
        <>
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="16 18 22 12 16 6" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="8 6 2 12 8 18" />
        </>
    ),
    'copy': (
        <>
            <rect x="9" y="9" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </>
    ),
    'crop': (
        <>
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="6 2 6 16 20 16" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="2 6 16 6 16 20" />
        </>
    ),
    'database': (
        <>
            <ellipse cx="12" cy="5" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </>
    ),
    'distribute': (
        <>
            <line x1="3" y1="3" x2="3" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="21" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <rect x="7" y="7" width="4" height="10" rx="1" fill="currentColor" opacity="0.8" />
            <rect x="13" y="7" width="4" height="10" rx="1" fill="currentColor" opacity="0.8" />
        </>
    ),
    'edit': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </>
    ),
    'external-link': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
    ),
    'file-text': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
    ),
    'flash': (
        <polygon fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    ),
    'folder': (
        <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    ),
    'grid': (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
        </>
    ),
    'group': (
        <>
            <rect x="2" y="2" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="13" y="2" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="2" y="13" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="13" y="13" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </>
    ),
    'hash': (
        <>
            <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="3" x2="8" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="3" x2="14" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
    ),
    'image': (
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="21 15 16 10 5 21" />
        </>
    ),
    'list-numbers': (
        <>
            <line x1="10" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                d="M4 5h1v4M4 9h2M4 16c0-1 2-1.5 2-2.5S5 12 4 12.5M4 19h2" />
        </>
    ),
    'lock': (
        <>
            <rect x="3" y="11" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                d="M7 11V7a5 5 0 0110 0v4" />
        </>
    ),
    'magic': (
        <path fill="currentColor" d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.996.996 0 00-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35z" />
    ),
    'maximize': (
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    ),
    'mirror': (
        <>
            <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="5 7 9 12 5 17" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="19 7 15 12 19 17" opacity="0.5" />
        </>
    ),
    'nesting': (
        <path fill="currentColor" d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5H2v4c0 1.1.9 2 2 2h3.8v-1.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5V22h4c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />
    ),
    'outline': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M4 7l3-3 10 10-3 3L4 7z" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M18 3l3 3-3 3-3-3 3-3z" />
        </>
    ),
    'palette': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2"
                d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.49 10 10c0 2.76-2.24 5-5 5h-1.77c-.28 0-.5.22-.5.5 0 .13.05.25.14.36.41.43.64.97.64 1.64 0 1.38-1.12 2.5-2.5 2.5z" />
            <circle cx="6.5" cy="11.5" r="1.5" fill="currentColor" />
            <circle cx="9" cy="7" r="1.5" fill="currentColor" />
            <circle cx="14.5" cy="7" r="1.5" fill="currentColor" />
            <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor" />
        </>
    ),
    'rectangle': (
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    ),
    'refresh': (
        <>
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="23 4 23 10 17 10" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
        </>
    ),
    'resize': (
        <>
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="15 3 21 3 21 9" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="21" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
    ),
    'rotate-right': (
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M21 2v6h-6M21 13a9 9 0 11-3-7.7L21 8" />
    ),
    'ruler': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M2 20L20 2l2 2L4 22z" />
            <line x1="7" y1="15" x2="5" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="12" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="13" y1="9" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="6" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
    ),
    'shape-circle': (
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    ),
    'shuffle': (
        <>
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="4" x2="9" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
    ),
    'sparkle': (
        <>
            <path fill="currentColor" d="M12 3l1.8 5.4L19.2 10l-5.4 1.8L12 17.2l-1.8-5.4L4.8 10l5.4-1.8z" />
            <path fill="currentColor" opacity="0.6" d="M5.5 17l.9 2.7 2.7.9-2.7.9L5.5 24l-.9-2.5L2 20.6l2.6-.9z" />
            <path fill="currentColor" opacity="0.6" d="M18 3l.7 2 2 .7-2 .7-.7 2-.7-2L15.3 5.7l2-.7z" />
        </>
    ),
    'square': (
        <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    ),
    'swap': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M7 16V4m0 0L3 8m4-4l4 4" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M17 8v12m0 0l4-4m-4 4l-4-4" />
        </>
    ),
    'text': (
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M4 6h16M12 6v12M8 18h8" />
    ),
    'text-fit': (
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                d="M7 9h10M7 12h7M7 15h5" />
        </>
    ),
    'text-replace': (
        <>
            <line x1="3" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M16 10l5 2-5 2" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                d="M21 12h-9" />
        </>
    ),
    'text-upper': (
        <>
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M4 20l3.5-10 3.5 10M5.5 16h5" />
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                d="M14 5h7M17.5 5v14" />
        </>
    ),
    'vector': (
        <>
            <circle cx="5" cy="19" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="19" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="6.8" y1="17.2" x2="17.2" y2="6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="19" y1="7" x2="19" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="17" y1="19" x2="21" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
    ),
    // Aliases
    'export': (
        <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    ),
    'batch': (
        <path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
    ),
};

export const Icon: React.FC<IconProps> = ({ name, size = 16, color, style }) => {
    const content = ICONS[name] ?? ICONS['magic'];
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            style={{ color: color ?? 'currentColor', flexShrink: 0, ...style }}
        >
            {content}
        </svg>
    );
};
