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
    id: 'random-palette-fill',
    name: '随机色卡填充',
    description: '将选中对象随机填充为指定色卡中的颜色，支持输入文档色板名或颜色值。',
    category: 'color',
    icon: 'shuffle',
    persistParams: true,
    params: [
      {
        name: 'palette',
        type: 'textarea',
        label: '色卡',
        description: '每行或用逗号分隔一个颜色。支持文档色板名、#RRGGBB、RGB(r,g,b)、CMYK(c,m,y,k)。',
        default: '主色\n辅色\n#FF6B6B\n#4ECDC4',
        required: true,
      },
      {
        name: 'target',
        type: 'select',
        label: '应用范围',
        default: 'fill',
        options: [
          { value: 'fill', label: '仅填充' },
          { value: 'stroke', label: '仅描边' },
          { value: 'both', label: '填充 + 描边' },
        ],
      },
      {
        name: 'includeGroups',
        type: 'boolean',
        label: '递归处理组内对象',
        default: true,
      },
      {
        name: 'seed',
        type: 'number',
        label: '随机种子',
        description: '相同种子和相同选区顺序会得到稳定结果；留空或 0 则使用当前时间。',
        default: 0,
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
