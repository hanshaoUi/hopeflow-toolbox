import type { ScriptMetadata } from '../script-manifest';

export const artboardScripts: ScriptMetadata[] = [
  {
    id: 'select-by-artboards',
    name: '按画板选择对象',
    description: '按当前画板、全部画板或指定画板编号范围选择对象',
    category: 'artboard',
    icon: 'select',
    params: [
      {
        name: 'target',
        type: 'select',
        label: '选择范围',
        default: 'current',
        options: [
          { value: 'current', label: '当前画板' },
          { value: 'all', label: '全部画板' },
          { value: 'custom', label: '指定编号/范围' },
        ],
      },
      {
        name: 'artboards',
        type: 'string',
        label: '画板编号',
        description: '仅在“指定编号/范围”时使用，例如 1,3,5-8',
        default: '',
        required: false,
      },
      {
        name: 'matchMode',
        type: 'select',
        label: '匹配方式',
        default: 'overlap',
        options: [
          { value: 'overlap', label: '与画板相交即选中' },
          { value: 'inside', label: '必须完全位于画板内' },
        ],
      },
    ],
  },
  {
    id: 'group-by-artboard',
    name: '按画板分组对象',
    description: '按当前画板、全部画板或指定画板，将对象归入对应分组',
    category: 'artboard',
    icon: 'group',
    params: [
      {
        name: 'target',
        type: 'select',
        label: '处理范围',
        default: 'all',
        options: [
          { value: 'current', label: '当前画板' },
          { value: 'all', label: '全部画板' },
          { value: 'custom', label: '指定编号/范围' },
        ],
      },
      {
        name: 'artboards',
        type: 'string',
        label: '画板编号',
        description: '仅在“指定编号/范围”时使用，例如 1,3,5-8',
        default: '',
        required: false,
      },
      {
        name: 'nameMode',
        type: 'select',
        label: '分组命名',
        default: 'artboard-name',
        options: [
          { value: 'artboard-name', label: '使用画板名称' },
          { value: 'artboard-index', label: '使用画板编号' },
        ],
      },
      {
        name: 'prefix',
        type: 'string',
        label: '组名前缀',
        default: '',
        required: false,
      },
    ],
  },
  {
    id: 'select-off-artboard-objects',
    name: '选择画板外对象',
    description: '选择位于画板外的对象，也可反向选择画板内对象',
    category: 'artboard',
    icon: 'select',
    params: [
      {
        name: 'mode',
        type: 'select',
        label: '选择目标',
        default: 'outside',
        options: [
          { value: 'outside', label: '画板外对象' },
          { value: 'inside', label: '画板内对象' },
        ],
      },
      {
        name: 'matchMode',
        type: 'select',
        label: '匹配方式',
        default: 'center',
        options: [
          { value: 'center', label: '按中心点判断' },
          { value: 'overlap', label: '按与画板相交判断' },
        ],
      },
    ],
  },
  {
    id: 'create-artboards-from-selection',
    name: '从选区创建画板',
    description: '为每个选中对象创建一个适配的画板',
    category: 'artboard',
    icon: 'artboard-add',
    params: [
      { name: 'padding', type: 'number', label: '内边距 (pt)', default: 10 },
    ],
  },
  {
    id: 'fit-artboard-to-selection',
    name: '画板适配选区',
    description: '调整当前画板尺寸以适配选中内容',
    category: 'artboard',
    icon: 'artboard-fit',
    params: [
      { name: 'padding', type: 'number', label: '内边距 (pt)', default: 10 },
    ],
  },
  {
    id: 'create-rectangle-by-artboard',
    name: '按画板创建矩形',
    description: '为每个画板创建匹配的矩形',
    category: 'artboard',
    icon: 'rectangle',
  },
  {
    id: 'batch-rename-artboards',
    name: '批量重命名画板',
    description: '批量重命名所有画板，支持模式、前缀、后缀和尺寸',
    category: 'artboard',
    icon: 'edit',
    params: [
      { name: 'namePattern', type: 'string', label: '命名模式', default: '画板#' },
      { name: 'prefix', type: 'string', label: '前缀', default: '' },
      { name: 'suffix', type: 'string', label: '后缀', default: '' },
      { name: 'startNum', type: 'number', label: '起始编号', default: 1 },
      { name: 'includeSize', type: 'boolean', label: '包含尺寸', default: false },
      {
        name: 'sizeUnit',
        type: 'select',
        label: '尺寸单位',
        default: 'mm',
        options: [
          { value: 'mm', label: '毫米 (mm)' },
          { value: 'cm', label: '厘米 (cm)' },
          { value: 'px', label: '像素 (px)' },
          { value: 'pt', label: '点 (pt)' },
          { value: 'in', label: '英寸 (in)' },
        ],
      },
    ],
  },
  {
    id: 'show-artboard-name',
    name: '显示画板名称',
    description: '显示指定画板的名称和尺寸',
    category: 'artboard',
    icon: 'text',
    params: [
      {
        name: 'target',
        type: 'select',
        label: '目标',
        default: 'all',
        options: [
          { value: 'all', label: '所有画板' },
          { value: 'current', label: '当前画板' },
        ],
      },
    ],
  },
];
