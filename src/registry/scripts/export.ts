import type { ScriptMetadata } from '../script-manifest';

export const exportScripts: ScriptMetadata[] = [
  {
    id: 'export-large-scale',
    name: '大尺寸导出',
    description: '将缩小制作的文件按比例放大导出，自动分块拼接处理超大尺寸',
    category: 'export',
    icon: 'maximize',
    params: [
      {
        name: 'scale',
        type: 'number',
        label: '缩放比例 (1:X)',
        default: 10,
        description: '例如：10 表示原稿缩小10倍制作',
      },
      {
        name: 'dpi',
        type: 'select',
        label: '输出分辨率',
        default: '72',
        options: [
          { value: '72', label: '72 DPI (屏幕/喷绘)' },
          { value: '150', label: '150 DPI (大幅面印刷)' },
          { value: '300', label: '300 DPI (高精度印刷)' },
          { value: 'custom', label: '自定义' },
        ],
      },
      { name: 'customDpi', type: 'number', label: '自定义 DPI', default: 100, description: '选择"自定义"时生效' },
      {
        name: 'format',
        type: 'select',
        label: '输出格式',
        default: 'JPEG',
        options: [
          { value: 'JPEG', label: 'JPEG (体积小)' },
          { value: 'PNG', label: 'PNG (支持透明)' },
          { value: 'TIFF', label: 'TIFF (印刷质量)' },
        ],
      },
      { name: 'maxPixels', type: 'number', label: '单块最大像素', default: 8000, description: '超过此尺寸自动分块' },
    ],
  },
  {
    id: 'export-plt',
    name: '导出为 PLT',
    description: '将路径导出为 HPGL (PLT) 格式',
    category: 'export',
    icon: 'external-link',
  },
  {
    id: 'split-overlap-artboards',
    name: '拼接切割',
    description: '按固定单片尺寸切割当前画板，搭接包含在单片内，并生成可导出的分片画板',
    category: 'export',
    icon: 'crop',
  },
];
