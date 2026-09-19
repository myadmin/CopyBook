// 字帖类型与格子体系：格子 = 外框 + 内部线组的参数化组合

export type CopybookKind = 'pencil' | 'pen' | 'brush';

export type LineStyle = 'none' | 'dash' | 'solid';

export interface GridSpec {
  cross: LineStyle;        // 十字线
  diagonals: LineStyle;    // 对角线
  ninePalace: LineStyle;   // 九宫（井字）线
  innerSquare: number | null; // 回宫内框，占格子比例
  dots: 'none' | 'center' | 'corners' | 'both'; // 定位点
  lines357: boolean;       // 357 定位线（竖中线 + 横 30%/70% 线）
  ruled: boolean;          // 横线行款格（无竖线、无外框格）
  fourline: boolean;       // 英语四线三格（基线为第三条线）
}

export type GridType =
  | 'tian' | 'tianSolid' | 'mi' | 'jiugong' | 'huigong' | 'huimi'
  | 'fang' | 'duijiao' | 'dingwei' | 'xu' | 'g357' | 'hengxian' | 'english';

const none: GridSpec = {
  cross: 'none', diagonals: 'none', ninePalace: 'none',
  innerSquare: null, dots: 'none', lines357: false, ruled: false, fourline: false,
};

export const GRID_SPECS: Record<GridType, GridSpec> = {
  tian:      { ...none, cross: 'dash' },
  tianSolid: { ...none, cross: 'solid' },
  mi:        { ...none, cross: 'dash', diagonals: 'dash' },
  jiugong:   { ...none, ninePalace: 'dash' },
  huigong:   { ...none, cross: 'dash', innerSquare: 0.62 },
  huimi:     { ...none, cross: 'dash', diagonals: 'dash', innerSquare: 0.62 },
  fang:      { ...none },
  duijiao:   { ...none, diagonals: 'dash' },
  dingwei:   { ...none, dots: 'both' },
  xu:        { ...none, dots: 'corners' },
  g357:      { ...none, lines357: true },
  hengxian:  { ...none, ruled: true },
  english:   { ...none, ruled: true, fourline: true },
};

export const GRID_LABELS: Record<GridType, string> = {
  tian: '田字格',
  tianSolid: '十字格（实线）',
  mi: '米字格',
  jiugong: '九宫格',
  huigong: '回宫格',
  huimi: '回米格',
  fang: '方格（空白）',
  duijiao: '对角线格',
  dingwei: '定位点格',
  xu: '虚格（四角点）',
  g357: '357 定位格',
  hengxian: '横线行款格',
  english: '英语四线格',
};

export type StrokeMode = 'off' | 'first' | 'repeat'; // 关闭 / 每字首次出现 / 每次出现

export interface CopybookConfig {
  kind: CopybookKind;
  text: string;
  grid: GridType;
  cellSize: number;          // mm，格子边长
  colsOverride: number | null; // null = 按页宽自动
  traceCount: number;        // 每字描红格数
  blankCount: number;        // 每字空白格数
  // 拼音
  showPinyin: boolean;
  pinyinPlain: boolean;      // 不标声调
  pinyinScale: number;       // 拼音字号（占格边长比例）
  showPinyinOnBlank: boolean; // 空白格是否重复显示拼音
  polyphones: Record<string, string>; // 多音字覆盖：字 → 选定读音
  // 笔顺
  strokeMode: StrokeMode;
  strokeShowNumber: boolean; // 标注笔画编号
  strokeNumberFirstOnly: boolean; // 仅第一格显示编号（更简洁）
  // 版式与字形
  writing: 'h' | 'v';      // 横排 / 竖排（从右至左，竖排不支持拼音带与笔顺）
  charOutline: boolean;    // 双钩范字（空心字）
  brushLayout: 'grid' | 'banner' | 'doufang' | 'duilian'; // 毛笔版式
  charColor: string;
  charOpacity: number;
  charScale: number;         // 字形占格比例
  charOffsetY: number;       // mm，上下微调
  bold: boolean;
  fontFamily: string;
  customFont: string;        // 自定义本地字体名，优先生效
  gridColor: string;
  gridLineWidth: number;     // mm
  doubleBorder: boolean;
  showCenterDot: boolean;
  useGridBg: boolean;
  gridBg: string;
  marginX: number;
  marginY: number;
  landscape: boolean;
  showHeader: boolean;
  headerTitle: string;
  showPageNum: boolean;
}

export const KIND_LABELS: Record<CopybookKind, string> = {
  pencil: '铅笔帖',
  pen: '钢笔帖',
  brush: '毛笔帖',
};

export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: '霞鹜文楷（内置）', value: "'LXGW WenKai', 'KaiTi', 'STKaiti', serif" },
  { label: '楷体（系统）', value: "'KaiTi', 'STKaiti', serif" },
  { label: '宋体（系统）', value: "'SimSun', 'SimSun-ExtB', serif" },
  { label: '仿宋（系统）', value: "'FangSong', 'STFangsong', serif" },
  { label: '黑体（系统）', value: "'SimHei', serif" },
  { label: '微软雅黑（系统）', value: "'Microsoft YaHei', serif" },
  { label: '华文楷体（系统）', value: "'STKaiti', serif" },
  { label: '华文行楷（系统）', value: "'STXingkai', serif" },
  { label: '华文隶书（系统）', value: "'STLiti', serif" },
];

// 切换字帖类型时套用的预设（不覆盖文字内容与页面设置）
export const KIND_PRESETS: Record<CopybookKind, Partial<CopybookConfig>> = {
  pencil: {
    grid: 'tian', cellSize: 14, charScale: 0.72,
    charColor: '#e8736a', charOpacity: 0.55,
    traceCount: 2, blankCount: 2, gridColor: '#3f7f5f', gridLineWidth: 0.35,
    showPinyin: true, strokeMode: 'off', // 默认整字范字＋拼音；笔顺在「笔顺分步格」选项中按需打开
  },
  pen: {
    grid: 'tian', cellSize: 11, charScale: 0.74,
    charColor: '#8a8f98', charOpacity: 0.55,
    traceCount: 2, blankCount: 3, gridColor: '#5b7fa6', gridLineWidth: 0.3,
    showPinyin: true, strokeMode: 'off',
  },
  brush: {
    grid: 'mi', cellSize: 60, charScale: 0.85,
    charColor: '#c0392b', charOpacity: 0.32,
    traceCount: 1, blankCount: 1, gridColor: '#b03a2e', gridLineWidth: 0.5,
    showPinyin: false, strokeMode: 'off',
  },
};

export const STROKE_MODE_LABELS: Record<StrokeMode, string> = {
  off: '不显示',
  first: '每字首次出现时',
  repeat: '每次出现都显示',
};

export const BRUSH_LAYOUT_LABELS: Record<CopybookConfig['brushLayout'], string> = {
  grid: '自由格阵列',
  banner: '竖幅条幅',
  doufang: '斗方',
  duilian: '对联',
};

export const DEFAULT_CONFIG: CopybookConfig = {
  kind: 'pencil',
  text: '一二三四五\n人口手\n山石田土\n日月水火',
  grid: 'tian',
  cellSize: 14,
  colsOverride: null,
  traceCount: 2,
  blankCount: 2,
  showPinyin: true,
  pinyinPlain: false,
  pinyinScale: 0.22,
  showPinyinOnBlank: false,
  polyphones: {},
  strokeMode: 'off',
  strokeShowNumber: true,
  strokeNumberFirstOnly: false,
  writing: 'h',
  charOutline: false,
  brushLayout: 'grid',
  charColor: '#e8736a',
  charOpacity: 0.55,
  charScale: 0.72,
  charOffsetY: 0,
  bold: false,
  fontFamily: FONT_OPTIONS[0].value,
  customFont: '',
  gridColor: '#3f7f5f',
  gridLineWidth: 0.35,
  doubleBorder: false,
  showCenterDot: false,
  useGridBg: false,
  gridBg: '#fbf6ea',
  marginX: 12,
  marginY: 12,
  landscape: false,
  showHeader: false,
  headerTitle: '我的字帖',
  showPageNum: false,
};
