import type { ScriptMetadata } from '../script-manifest';

export const imagesScripts: ScriptMetadata[] = [
  {
    id: 'embed-images',
    name: '一键嵌入图像',
    description: '将链接图像转为嵌入',
    category: 'images',
    icon: 'image',
  },
  {
    id: 'inline-svg-to-ai',
    name: '内联SVG转AI',
    description: '将内联SVG转换为AI对象',
    category: 'images',
    icon: 'code',
    params: [
      { name: 'svgCode', type: 'textarea', label: 'SVG 代码', default: '' },
      { name: 'useOpen', type: 'boolean', label: '通过"打开"插入', default: true },
    ],
  },
  {
    id: 'open-pdf',
    name: '打开PDF',
    description: '打开PDF文件，支持选择页码范围',
    category: 'images',
    icon: 'file-text',
  },
  {
    id: 'ai-enhance',
    name: 'AI 图像增强',
    description: '使用 AI 放大图像、移除背景、降噪处理',
    category: 'images',
    icon: 'sparkle',
  },
];
