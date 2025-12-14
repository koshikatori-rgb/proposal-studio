// スライド構造定義JSON（案C: 2段階生成方式）
// ClaudeがこのJSON構造を生成し、レンダラーがCanvas/SVGで描画する

import type { ColorScheme } from './index';

// ===== レイアウトタイプ =====
export type SlideLayoutType =
  | 'single'              // 全面1要素
  | 'left-right'          // 左右2分割
  | 'left-right-detail'   // 左:図解、右:番号付き詳細説明
  | 'three-column'        // 3カラム（フロー→中間→結果）
  | 'top-bottom'          // 上下2分割
  | 'chart-callout';      // グラフ+吹き出し解説

// ===== 要素間の関係性表現 =====
export type ConnectionStyle = 'numbered' | 'arrow' | 'color-coded' | 'line';

// ===== 基本図形要素 =====
export type ShapeType =
  | 'rect'       // 四角形
  | 'rounded'    // 角丸四角形
  | 'circle'     // 円
  | 'diamond'    // ひし形
  | 'arrow'      // 矢印
  | 'line';      // 線

export type Shape = {
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
};

// ===== テキスト要素 =====
export type TextElement = {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
};

// ===== 箇条書き要素 =====
export type BulletListElement = {
  type: 'bullet-list';
  x: number;
  y: number;
  width: number;
  items: {
    text: string;
    indent?: number;
    bullet?: string;  // '-', '●', '1.', '①' など
  }[];
  fontSize: number;
  lineHeight?: number;
  color?: string;
};

// ===== 番号付き説明リスト =====
export type NumberedExplanation = {
  type: 'numbered-explanation';
  x: number;
  y: number;
  width: number;
  items: {
    number: number;
    title: string;
    description?: string;
    bullets?: string[];
    highlight?: boolean;
  }[];
  fontSize: number;
  numberColor?: string;
};

// ===== ウォーターフォールチャート =====
export type WaterfallChart = {
  type: 'waterfall';
  x: number;
  y: number;
  width: number;
  height: number;
  startLabel: string;
  startValue: number;
  steps: {
    label: string;
    delta: number;
    number?: number;
    highlight?: boolean;
  }[];
  endLabel: string;
  endValue: number;
  showConnectors?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  highlightColor?: string;
};

// ===== フローチャート =====
export type FlowChart = {
  type: 'flow';
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'horizontal' | 'vertical';
  nodes: {
    id: string;
    label: string;
    shape?: ShapeType;
    color?: string;
  }[];
  connections: {
    from: string;
    to: string;
    label?: string;
  }[];
};

// ===== 階層図（ツリー） =====
export type HierarchyChart = {
  type: 'hierarchy';
  x: number;
  y: number;
  width: number;
  height: number;
  root: HierarchyNode;
};

export type HierarchyNode = {
  id: string;
  label: string;
  children?: HierarchyNode[];
  color?: string;
};

// ===== テーブル =====
export type TableElement = {
  type: 'table';
  x: number;
  y: number;
  width: number;
  headers: string[];
  rows: string[][];
  headerBgColor?: string;
  headerTextColor?: string;
  cellPadding?: number;
  fontSize?: number;
};

// ===== 矢印・コネクタ =====
export type Connector = {
  type: 'connector';
  from: { x: number; y: number };
  to: { x: number; y: number };
  style: 'arrow' | 'line' | 'dashed';
  label?: string;
  color?: string;
};

// ===== 複合要素（左右分割など） =====
export type SplitLayout = {
  type: 'split-layout';
  direction: 'horizontal' | 'vertical';
  ratio: [number, number]; // 例: [1, 1] で50:50, [2, 1] で66:33
  left: SlideStructureElement;
  right: SlideStructureElement;
  divider?: boolean;
};

// ===== 3カラムレイアウト =====
export type ThreeColumnLayout = {
  type: 'three-column';
  columns: [SlideStructureElement, SlideStructureElement, SlideStructureElement];
  ratios?: [number, number, number];
  dividers?: boolean;
};

// ===== 棒グラフ =====
export type BarChart = {
  type: 'bar-chart';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  direction: 'vertical' | 'horizontal';
  bars: {
    label: string;
    value: number;
    color?: string;
    highlight?: boolean;
  }[];
  maxValue?: number;
  showValues?: boolean;
  showGrid?: boolean;
  unit?: string;  // '%', '億円', etc.
};

// ===== 円グラフ =====
export type PieChart = {
  type: 'pie-chart';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  segments: {
    label: string;
    value: number;
    color?: string;
    highlight?: boolean;
  }[];
  showLabels?: boolean;
  showPercentage?: boolean;
  donut?: boolean;  // ドーナツチャートにする場合
  donutRatio?: number;  // 0.5 = 50%の穴
};

// ===== ガントチャート =====
export type GanttChart = {
  type: 'gantt';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  startDate?: string;  // 表示開始日
  endDate?: string;    // 表示終了日
  timeUnit: 'day' | 'week' | 'month' | 'quarter';
  tasks: {
    id: string;
    label: string;
    startOffset: number;  // 開始位置（0-100%）
    duration: number;     // 期間（0-100%）
    color?: string;
    milestone?: boolean;
    progress?: number;    // 進捗率（0-100）
  }[];
  showGrid?: boolean;
  showToday?: boolean;
};

// ===== ピラミッド図 =====
export type PyramidChart = {
  type: 'pyramid';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  direction: 'up' | 'down';  // 上向き or 下向き
  levels: {
    label: string;
    description?: string;
    color?: string;
  }[];
  showLabels?: boolean;
};

// ===== サイクル図 =====
export type CycleChart = {
  type: 'cycle';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  centerLabel?: string;
  nodes: {
    label: string;
    description?: string;
    color?: string;
    icon?: string;
  }[];
  showArrows?: boolean;
  clockwise?: boolean;
};

// ===== ベン図 =====
export type VennChart = {
  type: 'venn';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  circles: {
    label: string;
    description?: string;
    color?: string;
  }[];
  intersectionLabel?: string;  // 重なり部分のラベル
  showLabels?: boolean;
};

// ===== 2x2マトリクス =====
export type MatrixChart = {
  type: 'matrix';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  xAxisLabel?: string;  // X軸ラベル（例: 実現性）
  yAxisLabel?: string;  // Y軸ラベル（例: 効果）
  quadrants: {
    topLeft: { label: string; items?: string[]; color?: string };
    topRight: { label: string; items?: string[]; color?: string };
    bottomLeft: { label: string; items?: string[]; color?: string };
    bottomRight: { label: string; items?: string[]; color?: string };
  };
};

// ===== ファネル図 =====
export type FunnelChart = {
  type: 'funnel';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  stages: {
    label: string;
    value?: number;
    description?: string;
    color?: string;
  }[];
  showValues?: boolean;
  showPercentage?: boolean;
};

// ===== 折れ線グラフ =====
export type LineChart = {
  type: 'line-chart';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  xLabels: string[];  // X軸のラベル（例: 月名）
  lines: {
    label: string;
    values: number[];
    color?: string;
    dashed?: boolean;
  }[];
  showGrid?: boolean;
  showLegend?: boolean;
  unit?: string;
};

// ===== レーダーチャート =====
export type RadarChart = {
  type: 'radar';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  axes: string[];  // 軸のラベル（例: 品質, コスト, 納期）
  series: {
    label: string;
    values: number[];  // 各軸の値（0-100）
    color?: string;
  }[];
  showLegend?: boolean;
  maxValue?: number;
};

// ===== 収束図 =====
export type ConvergenceChart = {
  type: 'convergence';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  inputs: {
    label: string;
    description?: string;
    color?: string;
  }[];
  output: {
    label: string;
    description?: string;
    color?: string;
  };
};

// ===== 発散図 =====
export type DivergenceChart = {
  type: 'divergence';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  input: {
    label: string;
    description?: string;
    color?: string;
  };
  outputs: {
    label: string;
    description?: string;
    color?: string;
  }[];
};

// ===== アイコングリッド =====
export type IconGridChart = {
  type: 'icon-grid';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  items: {
    icon: string;  // アイコン文字（絵文字など）
    label: string;
    description?: string;
    color?: string;
  }[];
  columns?: number;  // 列数（デフォルト3）
};

// ===== 積み上げ棒グラフ =====
export type StackedBarChart = {
  type: 'stacked-bar';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  categories: string[];  // カテゴリ（X軸）
  series: {
    label: string;
    values: number[];
    color?: string;
  }[];
  showLegend?: boolean;
  showValues?: boolean;
  unit?: string;
};

// ===== ロードマップ =====
export type RoadmapChart = {
  type: 'roadmap';
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  phases: {
    label: string;
    period: string;  // 期間表示（例: "2024年Q1"）
    items: string[];
    color?: string;
  }[];
  showConnectors?: boolean;
};

// ===== 全要素のユニオン型 =====
export type SlideStructureElement =
  | Shape
  | TextElement
  | BulletListElement
  | NumberedExplanation
  | WaterfallChart
  | FlowChart
  | HierarchyChart
  | TableElement
  | Connector
  | SplitLayout
  | ThreeColumnLayout
  | BarChart
  | PieChart
  | GanttChart
  | PyramidChart
  | CycleChart
  | VennChart
  | MatrixChart
  | FunnelChart
  | LineChart
  | RadarChart
  | ConvergenceChart
  | DivergenceChart
  | IconGridChart
  | StackedBarChart
  | RoadmapChart;

// ===== スライド全体の構造定義 =====
export type SlideStructure = {
  // メタ情報
  id: string;
  version: '1.0';

  // スライドヘッダー
  header: {
    title: string;
    subtitle?: string;
    tag?: string;  // 右上のタグ（例: "机上試算"）
  };

  // メッセージライン（タイトル下の主張）
  mainMessage?: string;

  // レイアウトタイプ
  layoutType: SlideLayoutType;

  // コンテンツ領域（ヘッダー・メッセージ下のエリア）
  content: {
    // 単一要素の場合
    element?: SlideStructureElement;
    // 複数要素の場合
    elements?: SlideStructureElement[];
  };

  // 要素間の接続・関係性
  connections?: {
    from: string;  // 要素ID or 座標
    to: string;
    style: ConnectionStyle;
    label?: string;
  }[];

  // スタイル設定
  style: {
    colors: ColorScheme;
    fontFamily: string;
    padding: number;
  };

  // フッター
  footer?: {
    note?: string;      // 注釈
    source?: string;    // 出典
    pageNumber?: number;
  };
};

// ===== プリセット構造（よく使うパターン） =====
export type SlideStructurePreset =
  | 'waterfall-with-explanation'    // ウォーターフォール + 右側番号付き説明
  | 'flow-to-detail'                // 左フロー図 + 右詳細リスト
  | 'hierarchy-with-bullets'        // 左階層図 + 右箇条書き
  | 'three-column-flow'             // 3カラムのデータフロー
  | 'comparison-table'              // 比較表形式
  | 'process-steps'                 // ステップ形式のプロセス
  | 'simple-bullets'                // シンプルな箇条書き
  | 'cause-effect-detail'           // 因果関係図 + 詳細説明
  | 'gap-analysis-visual'           // ギャップ分析の視覚化
  | 'timeline-with-detail'          // タイムライン + 詳細説明
  | 'matrix-with-callout';          // マトリクス + 吹き出し解説

// ===== 構造プリセットの詳細定義 =====
export type StructurePresetConfig = {
  id: SlideStructurePreset;
  label: string;
  description: string;
  layoutType: SlideLayoutType;
  recommendedFor: string[];  // 推奨されるスライドタイプ
  complexity: 'simple' | 'medium' | 'complex';
};

// ===== 利用可能なプリセット一覧 =====
export const structurePresetConfigs: StructurePresetConfig[] = [
  {
    id: 'simple-bullets',
    label: 'シンプル箇条書き',
    description: '基本的な箇条書きレイアウト',
    layoutType: 'single',
    recommendedFor: ['executive_summary', 'appendix'],
    complexity: 'simple',
  },
  {
    id: 'waterfall-with-explanation',
    label: 'ウォーターフォール+説明',
    description: '数値の増減を左側に、詳細説明を右側に配置',
    layoutType: 'left-right-detail',
    recommendedFor: ['current_recognition', 'issue_setting'],
    complexity: 'complex',
  },
  {
    id: 'flow-to-detail',
    label: 'フロー図+詳細',
    description: 'プロセスフローを左側に、各ステップの詳細を右側に配置',
    layoutType: 'left-right-detail',
    recommendedFor: ['approach_overview', 'approach_detail'],
    complexity: 'complex',
  },
  {
    id: 'hierarchy-with-bullets',
    label: '階層図+箇条書き',
    description: '課題の階層構造を左側に、詳細を右側に配置',
    layoutType: 'left-right',
    recommendedFor: ['issue_setting', 'issue_tree'],
    complexity: 'medium',
  },
  {
    id: 'three-column-flow',
    label: '3カラムフロー',
    description: '現状→変革→目標の3段階を並べて表現',
    layoutType: 'three-column',
    recommendedFor: ['tobe_vision', 'project_goal'],
    complexity: 'complex',
  },
  {
    id: 'comparison-table',
    label: '比較表',
    description: 'Before/AfterやAsIs/ToBeの比較を表形式で表現',
    layoutType: 'left-right',
    recommendedFor: ['tobe_vision', 'current_recognition'],
    complexity: 'medium',
  },
  {
    id: 'process-steps',
    label: 'ステップ形式',
    description: '段階的なプロセスをステップ番号付きで表現',
    layoutType: 'single',
    recommendedFor: ['approach_overview', 'approach_detail'],
    complexity: 'simple',
  },
  {
    id: 'cause-effect-detail',
    label: '因果関係+詳細',
    description: '原因→結果の関係を図解し、詳細説明を添える',
    layoutType: 'left-right-detail',
    recommendedFor: ['current_recognition', 'issue_setting'],
    complexity: 'complex',
  },
  {
    id: 'gap-analysis-visual',
    label: 'ギャップ分析',
    description: '現状と目標のギャップを視覚的に表現',
    layoutType: 'left-right',
    recommendedFor: ['tobe_vision', 'project_goal'],
    complexity: 'medium',
  },
  {
    id: 'timeline-with-detail',
    label: 'タイムライン+詳細',
    description: '時系列の流れを上部に、詳細を下部に配置',
    layoutType: 'top-bottom',
    recommendedFor: ['schedule', 'approach_overview'],
    complexity: 'medium',
  },
  {
    id: 'matrix-with-callout',
    label: 'マトリクス+解説',
    description: '2x2マトリクスに吹き出し解説を追加',
    layoutType: 'chart-callout',
    recommendedFor: ['issue_setting', 'approach_overview'],
    complexity: 'complex',
  },
];

// ===== スライドタイプ別のデフォルト構造プリセット =====
export const defaultStructurePresetBySlideType: Record<string, {
  preset: SlideStructurePreset;
  useStructureMode: boolean;  // 構造ベースレンダリングを使うか
}> = {
  executive_summary: { preset: 'simple-bullets', useStructureMode: false },
  current_recognition: { preset: 'waterfall-with-explanation', useStructureMode: true },
  issue_setting: { preset: 'hierarchy-with-bullets', useStructureMode: true },
  issue_tree: { preset: 'hierarchy-with-bullets', useStructureMode: true },
  tobe_vision: { preset: 'gap-analysis-visual', useStructureMode: true },
  project_goal: { preset: 'three-column-flow', useStructureMode: true },
  approach_overview: { preset: 'flow-to-detail', useStructureMode: true },
  approach_detail: { preset: 'process-steps', useStructureMode: true },
  why_this_approach: { preset: 'comparison-table', useStructureMode: true },
  schedule: { preset: 'timeline-with-detail', useStructureMode: true },
  team: { preset: 'simple-bullets', useStructureMode: false },
  meeting_structure: { preset: 'simple-bullets', useStructureMode: false },
  estimate: { preset: 'simple-bullets', useStructureMode: false },
  estimate_assumptions: { preset: 'simple-bullets', useStructureMode: false },
  project_members: { preset: 'simple-bullets', useStructureMode: false },
  appendix: { preset: 'simple-bullets', useStructureMode: false },
};

// ===== プリセットIDからConfigを取得 =====
export function getStructurePresetConfig(presetId: SlideStructurePreset): StructurePresetConfig | undefined {
  return structurePresetConfigs.find(config => config.id === presetId);
}

// ===== Claude AIが生成するJSON構造のリクエスト =====
export type SlideStructureRequest = {
  slideType: string;
  title: string;
  mainMessage: string;
  content: {
    bullets?: string[];
    data?: Record<string, unknown>;
  };
  visualHint?: string;
  suggestedPreset?: SlideStructurePreset;
};

// ===== レンダリング結果 =====
export type RenderResult = {
  success: boolean;
  imageData?: string;  // Base64 PNG
  svgData?: string;    // SVG文字列
  error?: string;
};
