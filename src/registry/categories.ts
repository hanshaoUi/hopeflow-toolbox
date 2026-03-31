export interface Category {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

/**
 * Script categories
 */
export const CATEGORIES: Category[] = [
    {
        id: 'alignment',
        name: '快捷操作',
        description: '对齐、镜像、转曲、锁定等常用操作',
        icon: 'align-center',
        color: '#4A90E2',
    },
    {
        id: 'artboard',
        name: '画板工具',
        description: '画板创建、调整和管理',
        icon: 'artboard',
        color: '#7B68EE',
    },
    {
        id: 'batch',
        name: '批量操作',
        description: '批量处理、重命名和编辑',
        icon: 'batch',
        color: '#50C878',
    },
    {
        id: 'color',
        name: '色彩管理',
        description: '颜色提取、替换和转换',
        icon: 'palette',
        color: '#FF6B6B',
    },
    {
        id: 'export',
        name: '导出工具',
        description: '批量导出和文件转换',
        icon: 'export',
        color: '#FFA500',
    },
    {
        id: 'text',
        name: '文本处理',
        description: '文本查找、替换和格式化',
        icon: 'text',
        color: '#20B2AA',
    },

    {
        id: 'effects',
        name: '创意效果',
        description: '特殊效果和变换',
        icon: 'magic',
        color: '#FF69B4',
    },
    {
        id: 'measurement',
        name: '测量标注',
        description: '物体尺寸、面积和长度标注',
        icon: 'maximize',
        color: '#9C27B0',
    },
    {
        id: 'images',
        name: '图像处理',
        description: '链接图嵌入、SVG和PDF处理',
        icon: 'image',
        color: '#00BCD4',
    },
    {
        id: 'path',
        name: '路径编辑',
        description: '路径偏移、剪切和合并',
        icon: 'vector',
        color: '#FF9800',
    },
    {
        id: 'nesting',
        name: '排料优化',
        description: '智能排版和材料优化',
        icon: 'nesting',
        color: '#FF4500',
    },
    {
        id: 'library',
        name: '素材库',
        description: '本地AI、PSD、PNG素材管理',
        icon: 'folder',
        color: '#8B4513',
    },
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): Category | undefined {
    return CATEGORIES.find((c) => c.id === id);
}

/**
 * Get category name
 */
export function getCategoryName(id: string): string {
    return getCategoryById(id)?.name || id;
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): string[] {
    return CATEGORIES.map((c) => c.id);
}
