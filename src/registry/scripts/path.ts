import type { ScriptMetadata } from '../script-manifest';

export const pathScripts: ScriptMetadata[] = [
  {
    id: 'offset-bleed',
    name: '出血/偏移路径',
    description: '创建路径偏移（出血），支持处理图片和复合路径，并自动应用专色描边。',
    category: 'path',
    icon: 'vector',
    params: [
      {
        name: 'offset',
        type: 'number',
        label: '偏移量 (mm)',
        default: 3,
        description: '正数向外偏移，负数向内偏移。',
      },
      {
        name: 'includeImages',
        type: 'boolean',
        label: '包含图片',
        default: false,
        description: '为位图创建剪切蒙版后参与偏移。',
      },
      {
        name: 'releaseCompound',
        type: 'boolean',
        label: '释放复合路径',
        default: true,
        description: '偏移前释放复合路径（通常用于镂空对象）。',
      },
    ],
  },
  {
    id: 'create-boundary',
    name: '创建边界线',
    description: '为选中对象创建矩形边界线（刀版），并自动应用专色。',
    category: 'path',
    icon: 'square',
    params: [
      { name: 'padding', type: 'number', label: '间距 (mm)', default: 0 },
      { name: 'layerName', type: 'string', label: '图层名称', default: '矩形' },
    ],
  },
  {
    id: 'extend-along-path',
    name: '沿路径延长',
    description: '将选中的开放路径沿端点切线方向延长指定长度，闭合路径将被跳过。',
    category: 'path',
    icon: 'vector',
    params: [
      {
        name: 'startLength',
        type: 'number',
        label: '起点延长 (mm)',
        default: 10,
        description: '从路径起点沿切线方向向外延长的距离，设为 0 则不延长。',
        min: 0,
        step: 0.5,
        suffix: 'mm',
      },
      {
        name: 'endLength',
        type: 'number',
        label: '终点延长 (mm)',
        default: 10,
        description: '从路径终点沿切线方向向外延长的距离，设为 0 则不延长。',
        min: 0,
        step: 0.5,
        suffix: 'mm',
      },
    ],
  },
];
