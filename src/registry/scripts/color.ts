import type { ScriptMetadata } from '../script-manifest';

export const colorScripts: ScriptMetadata[] = [
  {
    id: 'color-notation',
    name: '颜色标注',
    description: '为选中对象添加颜色标注，支持集中放置或分散放置',
    category: 'color',
    icon: 'palette',
    params: [
      {
        name: 'drawBackground',
        type: 'boolean',
        label: '绘制底色和底部信息',
        description: '是否在标注区域绘制背景和汇总信息',
        default: true,
      },
      {
        name: 'centralPlacement',
        type: 'boolean',
        label: '集中放置',
        description: 'true: 画布右上角集中放置；false: 对象附近分别放置',
        default: true,
      },
    ],
  },
  {
    id: 'swap-fill-stroke',
    name: '交换填充/描边颜色',
    description: '交换选中对象的填充色和描边色。',
    category: 'color',
    icon: 'swap',
  },
];
