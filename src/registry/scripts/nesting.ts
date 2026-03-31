import type { ScriptMetadata } from '../script-manifest';

export const nestingScripts: ScriptMetadata[] = [
  {
    id: 'nesting-optimize',
    name: '智能排料优化',
    description: '使用NFP算法优化形状排列，支持自由旋转、真实轮廓贴合',
    category: 'nesting',
    icon: 'nesting',
    params: [
      {
        name: 'preset',
        type: 'select',
        label: '板材预设',
        default: 'custom',
        options: [
          { value: 'custom', label: '自定义' },
          { value: '1220x2440', label: '标准板 1220×2440mm' },
          { value: '1000x2000', label: '小板 1000×2000mm' },
          { value: '1524x3048', label: '大板 1524×3048mm (5×10尺)' },
          { value: '915x1830', label: '三六板 915×1830mm (3×6尺)' },
        ],
      },
      { name: 'sheetWidth', type: 'number', label: '板材宽度 (mm)', default: 1220 },
      { name: 'sheetHeight', type: 'number', label: '板材高度 (mm)', default: 2440 },
      { name: 'spacing', type: 'number', label: '零件间距 (mm)', default: 5 },
      { name: 'margin', type: 'number', label: '板材边距 (mm)', default: 10 },
      { name: 'allowRotation', type: 'boolean', label: '自由旋转 (8个角度)', default: true },
      { name: 'generateReport', type: 'boolean', label: '生成排料报告', default: false },
    ],
  },
];
