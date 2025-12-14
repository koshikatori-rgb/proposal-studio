// プロジェクト全体
export type Proposal = {
  id: string;
  title: string;
  clientName: string;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'in_progress' | 'completed';
  outline: Outline;
  slides: SlideElement[];
  settings: ProposalSettings;
};

// AIによるビジュアル表現の推奨（セクション別）
export type VisualRecommendation = {
  visualHint: string;
  reason: string;
  useComposite?: boolean;
  compositeConfig?: {
    primaryPattern: string;
    secondaryPattern: string;
    layoutType: string;
    relationDescription: string;
  };
};

export type VisualRecommendations = {
  // 主要セクション
  currentRecognition?: VisualRecommendation;
  issueSetting?: VisualRecommendation;
  toBeVision?: VisualRecommendation;
  approach?: VisualRecommendation;
  // プロジェクト実行セクション
  projectSchedule?: VisualRecommendation;
  projectTeam?: VisualRecommendation;
  meetingStructure?: VisualRecommendation;
  estimate?: VisualRecommendation;
  // 追加セクション
  executiveSummary?: VisualRecommendation;
  expectedEffect?: VisualRecommendation;
  whyUs?: VisualRecommendation;
  riskManagement?: VisualRecommendation;
  appendix?: VisualRecommendation;
};

// ===== B案: SCR（Situation-Complication-Resolution）構造 =====
// セクションごとの論理構造を明確化するためのナラティブフレームワーク
export type NarrativeStructure = {
  situation: string;                      // 状況: 誰もが認識している事実・前提
  complication: string;                   // 複雑化: そこに生じている問題・緊張
  resolution: string;                     // 解決: 我々が提示する解決策・方向性
  whyThisMatters: string;                 // なぜ重要か: 聴衆にとっての意味・インパクト
};

// ===== A案: メッセージの論理的根拠 =====
// 各スライドの「なぜこのメッセージなのか」を明示
export type MessageRationale = {
  why: string;                            // なぜこのメッセージなのか
  logicalBasis: string[];                 // 論理的根拠（3C分析、データ、事実等）
  audienceInsight: string;                // 聴衆への洞察（彼らが知りたいこと・懸念）
  connectionToPrevious?: string;          // 前スライドからの論理的つながり
  connectionToNext?: string;              // 次スライドへの論理的つながり
};

// スライド構成案（対話で明示的に言及された場合）
export type SlideProposalItem = {
  slideNumber: number;
  title: string;
  purpose: string;                        // このスライドの目的
  content: string;                        // 含める内容の概要
  keyMessage?: string;                    // 主要メッセージ
  evidenceNeeded?: string;                // Phase A: 論証に必要なデータ/不足している情報
  // A案: メッセージの論理的根拠
  messageRationale?: MessageRationale;    // なぜこのメッセージか
};

// 骨子データ
export type Outline = {
  currentRecognition: CurrentRecognition;
  issueSetting: IssueSetting;
  toBeVision: ToBeVision;
  approach: Approach;
  // プロジェクト実行セクション（オプション）
  projectSchedule?: ProjectSchedule;      // プロジェクトスケジュール
  projectTeam?: ProjectTeam;              // プロジェクト体制
  meetingStructure?: MeetingStructure;    // 会議体・コミュニケーション設計
  estimate?: ProjectEstimate;             // 見積り・費用
  // スライド構成案（対話で明示的に言及されている場合）
  slideStructureProposal?: SlideProposalItem[];
  visualRecommendations?: VisualRecommendations;  // AIが推奨するビジュアル表現
};

// プロジェクトスケジュール
export type ProjectSchedule = {
  overview: string;                       // スケジュール概要
  duration: string;                       // 期間（例：「6ヶ月」）
  phases: SchedulePhase[];                // フェーズごとのスケジュール
  milestones?: string[];                  // マイルストーン
};

export type SchedulePhase = {
  name: string;
  duration: string;
  activities: string[];
};

// プロジェクト体制
export type ProjectTeam = {
  overview: string;                       // 体制概要
  roles: ProjectRole[];                   // 役割と人員
  clientSide?: string[];                  // クライアント側の体制
  responsibilities?: string[];            // 役割分担の説明
};

export type ProjectRole = {
  role: string;
  description: string;
  headcount?: number;
};

// 会議体・コミュニケーション設計
export type MeetingStructure = {
  overview: string;                       // コミュニケーション概要
  meetings: Meeting[];                    // 会議体一覧
  reportingStructure?: string;            // 報告体制
  escalationPath?: string;                // エスカレーションパス
};

export type Meeting = {
  name: string;
  frequency: string;                      // 「週次」「月次」など
  participants: string[];
  purpose: string;
};

// 見積り・費用
export type ProjectEstimate = {
  overview: string;                       // 見積り概要
  totalAmount?: string;                   // 総額
  breakdown: EstimateItem[];              // 内訳
  assumptions?: string[];                 // 前提条件
  exclusions?: string[];                  // 対象外事項
};

export type EstimateItem = {
  category: string;
  description: string;
  amount?: string;
};

// 現状認識
export type CurrentRecognition = {
  industry?: string;
  companyOverview?: string;
  background: string;
  backgroundLayer: 'industry' | 'company' | 'division' | 'department';
  currentProblems: string[];
  rootCauseHypothesis: string[];
  // B案: セクションのナラティブ構造
  narrativeStructure?: NarrativeStructure;
};

// 課題仮説
export type IssueSetting = {
  criticalIssues: string[];
  issueDetails?: string[];              // 各課題の詳細（背景・影響・対処の難しさ）
  priorityRationale?: string;           // なぜこれらが最重要課題なのか
  issueTree?: IssueTreeNode;
  // B案: セクションのナラティブ構造
  narrativeStructure?: NarrativeStructure;
};

export type IssueTreeNode = {
  id: string;
  label: string;
  children?: IssueTreeNode[];
};

// ToBe像
export type ToBeVision = {
  vision: string;
  goals: string[];
  projectScope: string;
  successCriteria?: string[];           // 成功の判断基準（KPI・評価指標）
  // B案: セクションのナラティブ構造
  narrativeStructure?: NarrativeStructure;
};

// アプローチ
export type Approach = {
  overview: string;
  methodology: string;
  steps: ApproachStep[];
  whyThisApproach?: string;             // なぜこのアプローチなのか（選定理由）
  schedule?: Schedule;
  team?: Team;
  // B案: セクションのナラティブ構造
  narrativeStructure?: NarrativeStructure;
};

export type ApproachStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  deliverables: string[];
};

export type Schedule = {
  startDate: string;
  endDate: string;
  weeks: WeekSchedule[];
};

export type WeekSchedule = {
  weekNumber: number;
  stepIds: string[];
};

export type Team = {
  totalHeadcount: number;
  roles: TeamRole[];
};

export type TeamRole = {
  role: string;
  headcount: number;
  manDays: number;
};

// 構造プリセットをインポート（循環参照を避けるため型のみ）
import type { SlideStructurePreset } from './slideStructure';

// スライド要素
// 山口周「外資系コンサルのスライド作成術」を参考にした図解表現パターン
export type VisualHintType =
  // ===== 構造系 =====
  | 'process-flow'      // プロセスフロー図（ステップ1→2→3）
  | 'hierarchy'         // 階層構造（問題→原因→対策）
  | 'pyramid'           // ピラミッド構造（上位概念→下位概念）
  | 'tree'              // ツリー構造（MECE分解）
  | 'cycle'             // サイクル図（循環プロセス）
  | 'convergence'       // 収束図（複数要素→1つの結論）
  | 'divergence'        // 発散図（1つの原因→複数の影響）
  | 'funnel'            // ファネル図（営業プロセス、絞り込み）
  | 'swimlane'          // スイムレーン図（部門間プロセス）
  // ===== 比較系 =====
  | 'comparison'        // 比較表（Before/After、AsIs/ToBe）
  | 'matrix'            // 2x2マトリクス（4象限分析）
  | 'positioning-map'   // ポジショニングマップ（競合分析）
  | 'gap-analysis'      // ギャップ分析（現状とあるべき姿の差）
  | 'swot'              // SWOT分析（強み・弱み・機会・脅威）
  // ===== 時間軸系 =====
  | 'timeline'          // タイムライン（時系列推移）
  | 'gantt'             // ガントチャート（スケジュール）
  | 'roadmap'           // ロードマップ（中長期計画）
  | 'milestone'         // マイルストーン図（重要節目）
  // ===== データ系 =====
  | 'bar-chart'         // 棒グラフ（数値比較）
  | 'stacked-bar'       // 積み上げ棒グラフ（構成比較）
  | 'pie-chart'         // 円グラフ（割合・構成比）
  | 'line-chart'        // 折れ線グラフ（推移）
  | 'waterfall'         // ウォーターフォール（増減分析）
  | 'radar'             // レーダーチャート（多軸評価）
  | 'bridge'            // ブリッジチャート（差異分析）
  | 'kpi-dashboard'     // KPIダッシュボード（指標一覧）
  // ===== 関係性系 =====
  | 'cause-effect'      // 因果関係図（原因→結果）
  | 'value-chain'       // バリューチェーン（価値連鎖）
  | 'venn'              // ベン図（重なり・共通点）
  | 'stakeholder-map'   // ステークホルダーマップ（関係者整理）
  | 'org-chart'         // 組織図（体制図）
  // ===== シンプル系 =====
  | 'bullets-with-visual' // 箇条書き+補助ビジュアル（アイコン付き）
  | 'icon-grid'         // アイコングリッド（3〜6個の項目）
  | 'bullets-only'      // シンプルな箇条書きのみ
  // ===== 複合レイアウト系 =====
  | 'before-after-diagram'  // Before/Afterを図解で示す（左右分割）
  | 'concept-explanation'   // 抽象概念（左）+ 説明（右）
  | 'flow-with-message'     // フロー図 + メッセージテキスト
  | 'chart-with-insight'    // グラフ（左）+ インサイト・示唆（右）
  | 'problem-solution'      // 問題（左）→ 解決策（右）
  | 'framework-application' // フレームワーク + クライアント適用
  | 'summary-detail'        // サマリーボックス + 詳細展開
  | 'multi-column-options'  // 3列以上の選択肢比較
  | 'timeline-with-details' // タイムライン + 各フェーズ詳細
  | 'action-plan'           // アクションプラン（担当・期限付き）
  | 'impact-analysis'       // 現状→将来 + 定量インパクト
  // ===== 戦略フレームワーク系 =====
  | 'closed-loop-ecosystem' // 循環エコシステム（中央ループ＋レイヤー＋外部アクター）
  | 'strategic-temple'      // 戦略の神殿型（Vision/Pillars/Foundation）
  | 'hub-spoke-detailed';   // ハブ＆スポーク詳細版（中心＋放射状サテライト）

// ===== 複合表現（CompositeVisual）=====
// 2つのビジュアルパターンを組み合わせて関連づけ、より豊かなメッセージを伝える

// 複合表現の配置パターン
export type CompositeLayoutType =
  | 'left-right'      // 左右分割（主表現:左 / 補助表現:右）
  | 'right-left'      // 左右分割（補助表現:左 / 主表現:右）
  | 'top-bottom'      // 上下分割（主表現:上 / 補助表現:下）
  | 'bottom-top'      // 上下分割（補助表現:上 / 主表現:下）
  | 'main-inset'      // メイン+インセット（大きな主表現の中に小さな補助表現）
  | 'side-by-side';   // 横並び均等（同じサイズで横に並べる）

// 複合表現の設定
export type CompositeVisualConfig = {
  enabled: boolean;                    // 複合表現を使用するか
  primaryPattern: VisualHintType;      // 主表現パターン
  secondaryPattern: VisualHintType;    // 補助表現パターン
  layoutType: CompositeLayoutType;     // 配置パターン
  relationDescription?: string;        // 2つの表現の関連性の説明
};

// よく使う複合表現プリセット
export type CompositePreset = {
  id: string;
  name: string;
  description: string;
  icon: string;
  primary: VisualHintType;
  secondary: VisualHintType;
  defaultLayout: CompositeLayoutType;
  useCase: string;                     // どんな場面で使うか
};

// 複合表現プリセット一覧
export const compositePresets: CompositePreset[] = [
  // ===== 分析+根拠 =====
  {
    id: 'matrix-chart',
    name: 'マトリクス+グラフ',
    description: 'マトリクスで分類しつつ、グラフで定量的根拠を示す',
    icon: '⊞📊',
    primary: 'matrix',
    secondary: 'bar-chart',
    defaultLayout: 'left-right',
    useCase: '課題の優先順位づけ、ポートフォリオ分析',
  },
  {
    id: 'positioning-chart',
    name: 'ポジショニング+グラフ',
    description: 'ポジショニングマップで位置づけ、グラフで市場データを補足',
    icon: '◎📈',
    primary: 'positioning-map',
    secondary: 'line-chart',
    defaultLayout: 'left-right',
    useCase: '競合分析、市場ポジション',
  },
  // ===== プロセス+詳細 =====
  {
    id: 'swimlane-bullets',
    name: 'スイムレーン+箇条書き',
    description: 'プロセスフローを示しつつ、各フェーズの詳細を箇条書きで補足',
    icon: '≡→▪',
    primary: 'swimlane',
    secondary: 'bullets-with-visual',
    defaultLayout: 'top-bottom',
    useCase: '業務プロセス改善、役割分担の説明',
  },
  {
    id: 'process-timeline',
    name: 'プロセス+タイムライン',
    description: 'プロセスフローと時間軸を組み合わせてスケジュール感を表現',
    icon: '→→📅',
    primary: 'process-flow',
    secondary: 'timeline',
    defaultLayout: 'top-bottom',
    useCase: 'プロジェクト計画、導入ステップ',
  },
  // ===== 構造+分解 =====
  {
    id: 'ecosystem-tree',
    name: '循環エコシステム+ツリー',
    description: '全体のエコシステム構造を示しつつ、一部をツリーで詳細分解',
    icon: '⟲⋔',
    primary: 'closed-loop-ecosystem',
    secondary: 'tree',
    defaultLayout: 'left-right',
    useCase: 'ビジネスモデル、バリューチェーン分析',
  },
  {
    id: 'hierarchy-bullets',
    name: '階層構造+箇条書き',
    description: '階層構造で全体像を示し、各レベルの詳細を箇条書きで説明',
    icon: '▽▪',
    primary: 'hierarchy',
    secondary: 'bullets-only',
    defaultLayout: 'left-right',
    useCase: '組織構造、課題の構造化',
  },
  // ===== 比較+インサイト =====
  {
    id: 'comparison-kpi',
    name: '比較表+KPI',
    description: 'Before/After比較とKPIダッシュボードで改善効果を可視化',
    icon: '⇄▣',
    primary: 'comparison',
    secondary: 'kpi-dashboard',
    defaultLayout: 'top-bottom',
    useCase: '改善提案、効果測定',
  },
  {
    id: 'gap-roadmap',
    name: 'ギャップ分析+ロードマップ',
    description: '現状と目標のギャップを示し、そこに至るロードマップを提示',
    icon: '⟷🚩',
    primary: 'gap-analysis',
    secondary: 'roadmap',
    defaultLayout: 'top-bottom',
    useCase: 'ToBe像の説明、変革計画',
  },
  // ===== 因果関係 =====
  {
    id: 'cause-pyramid',
    name: '因果関係+ピラミッド',
    description: '因果関係図で原因を示し、ピラミッドで重要度の階層を表現',
    icon: '⟹△',
    primary: 'cause-effect',
    secondary: 'pyramid',
    defaultLayout: 'left-right',
    useCase: '課題の根本原因分析',
  },
  {
    id: 'funnel-chart',
    name: 'ファネル+グラフ',
    description: 'ファネルでプロセスを示し、各段階の数値をグラフで可視化',
    icon: '▽▽📊',
    primary: 'funnel',
    secondary: 'stacked-bar',
    defaultLayout: 'left-right',
    useCase: '営業プロセス、コンバージョン分析',
  },
  // ===== 戦略フレームワーク =====
  {
    id: 'temple-bullets',
    name: '戦略の神殿+箇条書き',
    description: 'Vision/Pillars/Foundationの構造と各柱の詳細説明',
    icon: '△┃▪',
    primary: 'strategic-temple',
    secondary: 'bullets-with-visual',
    defaultLayout: 'left-right',
    useCase: '戦略説明、ビジョン策定',
  },
  {
    id: 'hub-spoke-matrix',
    name: 'ハブ&スポーク+マトリクス',
    description: '中心と周辺の関係を示しつつ、マトリクスで分類',
    icon: '●━○⊞',
    primary: 'hub-spoke-detailed',
    secondary: 'matrix',
    defaultLayout: 'left-right',
    useCase: 'ステークホルダー分析、サービス構成',
  },
];

export type SlideElement = {
  id: string;
  templateId?: string;
  type?: SlideType;
  order: number;
  title?: string;                // ①タイトル - スライドの見出し
  mainMessage?: string;          // ②メッセージライン - 読み手に伝えたい一番のポイント
  subtitle?: string;             // ③サブタイトル - メッセージラインを補足する情報
  layout: 'title-only' | 'title-content' | 'title-bullets' | 'two-column' | 'hierarchy' | 'steps' | 'timeline';
  content: SlideContent;         // ④ボディ - メッセージラインの内容を補足・補完する内容
  imageUrl?: string;             // 生成された画像のURL（Base64またはURL）
  visualHint?: VisualHintType;   // AIが推奨するビジュアルタイプ
  visualIntent?: string;         // このスライドが視覚的にどう表現されるべきか（AI判断時の意図）
  visualReason?: string;         // なぜその視覚表現が適切かの理由
  isRequired?: boolean;
  // 構造ベースレンダリング用
  structurePreset?: SlideStructurePreset;  // 使用する構造プリセット
  useStructureMode?: boolean;              // 構造ベースレンダリングを使用するかどうか
  // 複合表現用
  compositeVisual?: CompositeVisualConfig; // 複合表現の設定（2つのパターンを組み合わせる場合）
  // Phase B: 視覚化設計（generative instruction用）
  uiRecommendation?: UIRecommendation;           // UI推奨パターン
  generativeInstruction?: GenerativeInstruction; // 画像生成AI用詳細指示
};

export type SlideType =
  | 'executive_summary'
  | 'current_recognition'
  | 'issue_setting'
  | 'issue_tree'
  | 'tobe_vision'
  | 'expected_effect'  // 期待効果・投資対効果（ToBe像と別スライドの場合）
  | 'project_goal'
  | 'approach_overview'
  | 'approach_detail'
  | 'why_this_approach'
  | 'why_us'  // Why Us・選定理由・類似実績
  | 'risk_management'  // リスク管理
  | 'schedule'
  | 'team'
  | 'meeting_structure'
  | 'estimate'
  | 'estimate_assumptions'
  | 'project_members'
  | 'appendix';

export type SlideContent = {
  title?: string;
  text?: string;
  body?: string;
  bullets?: string[];
  table?: TableData;
  diagram?: DiagramData;
};

export type TableData = {
  headers: string[];
  rows: string[][];
};

export type DiagramData = {
  type: 'tree' | 'flow' | 'gantt';
  data: any;
};

// 設定
export type ProposalSettings = {
  template: 'default' | 'custom';
  colors: ColorScheme;
  font: FontSettings;
  toneManner?: ToneManner;
};

// トンマナ設定
export type ToneManner = {
  writingStyle: 'polite' | 'casual' | 'noun-ending';  // ですます調 / カジュアル / 体言止め
  formality: 'formal' | 'semi-formal' | 'casual';     // フォーマル度
  bulletStyle: 'dash' | 'circle' | 'number';          // 箇条書きスタイル
  emphasisStyle: 'bold' | 'underline' | 'color';      // 強調表現
};

export type ColorScheme = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
};

export type FontSettings = {
  family: string;
  sizes: {
    title: number;
    heading: number;
    body: number;
  };
};

// AI対話履歴
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type ChatSession = {
  proposalId: string;
  section: 'current_recognition' | 'issue_setting' | 'tobe_vision' | 'approach' | 'outline';
  messages: ChatMessage[];
};

// スライドテンプレート
export type SlideTemplate = {
  id: string;
  category: 'current_recognition' | 'issue_setting' | 'tobe_vision' | 'approach' | 'other';
  title: string;
  description: string;
  layout: SlideElement['layout'];
  defaultContent: SlideContent;
};

// APIで使用する型エイリアス
export type ProposalOutline = Outline;
export type SlideData = SlideElement;

// ===== Phase B: 視覚化設計（Visual Design）の型定義 =====

// UI推奨パターンID（プリセットアイコン選択用）
export type VisualPatternId =
  | 'process'
  | 'hierarchy'
  | 'pyramid'
  | 'tree'
  | 'cycle'
  | 'convergence'
  | 'divergence'
  | 'funnel'
  | 'swimlane'
  | 'matrix'
  | 'graph'
  | 'table'
  | 'text_only';

// UI制御用パラメータ
export type UIRecommendation = {
  mode: 'single' | 'composite';
  primaryPatternId: VisualPatternId;
  secondaryPatternId: VisualPatternId | null;  // composite時のみ
  rationale: string;  // なぜこの表現か？の理由
};

// 描画ゾーン（レイアウトの各エリア）
export type GenerativeZone = {
  zoneId: string;  // "left", "right", "top", "bottom", "center", "A", "B" など
  contentType: string;  // "chevron_process", "detailed_table", "bullet_list" など
  visualDetail: string;  // 描画の詳細指示（強調・色・スタイル含む）
  elements: string[];  // 描画する要素のリスト
};

// 画像生成/描画エンジン用パラメータ
export type GenerativeInstruction = {
  layoutComposition: string;  // "Split Vertical (Left 40% : Right 60%)" など
  visualMetaphorPrompt: string;  // 画像生成AI用の情景描写（英語推奨）
  zones: GenerativeZone[];
};

// Phase B出力: 各スライドの視覚化設計
export type SlideVisualDesign = {
  slideNo: number;
  title: string;
  governingThought: string;  // キーメッセージ
  uiRecommendation: UIRecommendation;
  generativeInstruction: GenerativeInstruction;
};

// Phase B API レスポンス
export type VisualDesignResponse = SlideVisualDesign[];
