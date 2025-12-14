'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StepIndicator } from '@/components/common/StepIndicator';
import { SlideTreeView } from '@/components/outline/SlideTreeView';
import {
  saveProposal,
  getSlideGenerationCache,
  saveSlideGenerationCache,
  generateOutlineHash,
  areSlidesValid,
} from '@/lib/storage';
import type { SlideElement, SlideType, Outline, ToneManner, VisualHintType, ColorScheme, ProposalSettings, CompositeVisualConfig, CompositeLayoutType, VisualRecommendations } from '@/types';
import { compositePresets } from '@/types';
import {
  defaultStructurePresetBySlideType,
  type SlideStructurePreset,
} from '@/types/slideStructure';
import { recommendVisual } from '@/lib/visualRecommender';
import { VisualPatternPreview } from '@/components/slide/VisualPatternPreview';
import { StoryCoherencePanel } from '@/components/story/StoryCoherencePanel';
import { SlideExportModal } from '@/components/export/SlideExportModal';

// ビジュアルヒントの選択肢（山口周「外資系コンサルのスライド作成術」参考）
type VisualHintCategory = {
  name: string;
  options: { value: VisualHintType; label: string; description: string; icon: string }[];
};

const visualHintCategories: VisualHintCategory[] = [
  {
    name: '構造系',
    options: [
      { value: 'process-flow', label: 'プロセスフロー', description: 'ステップの流れを表現', icon: '→→' },
      { value: 'hierarchy', label: '階層構造', description: '上位→下位の関係', icon: '▽' },
      { value: 'pyramid', label: 'ピラミッド', description: '重要度の階層', icon: '△' },
      { value: 'tree', label: 'ツリー', description: 'MECE分解', icon: '⋔' },
      { value: 'cycle', label: 'サイクル', description: '循環プロセス', icon: '↻' },
      { value: 'convergence', label: '収束', description: '複数→1つに集約', icon: '⋀' },
      { value: 'divergence', label: '発散', description: '1つ→複数に展開', icon: '⋁' },
      { value: 'funnel', label: 'ファネル', description: '段階的な絞り込み', icon: '▽▽' },
      { value: 'swimlane', label: 'スイムレーン', description: '役割別のフロー', icon: '≡→' },
    ],
  },
  {
    name: '比較系',
    options: [
      { value: 'comparison', label: '比較表', description: 'Before/After対比', icon: '⇄' },
      { value: 'matrix', label: 'マトリクス', description: '2x2の4象限分析', icon: '⊞' },
      { value: 'positioning-map', label: 'ポジショニング', description: '競合との位置関係', icon: '◎' },
      { value: 'gap-analysis', label: 'ギャップ分析', description: '現状と目標の差', icon: '⟷' },
      { value: 'swot', label: 'SWOT分析', description: '強み弱み機会脅威', icon: '⊞S' },
    ],
  },
  {
    name: '時間軸系',
    options: [
      { value: 'timeline', label: 'タイムライン', description: '時系列の推移', icon: '━●' },
      { value: 'gantt', label: 'ガント', description: 'スケジュール表', icon: '▬▬' },
      { value: 'roadmap', label: 'ロードマップ', description: '中長期計画', icon: '🚩' },
      { value: 'milestone', label: 'マイルストーン', description: '重要な節目', icon: '◇◇' },
    ],
  },
  {
    name: 'データ系',
    options: [
      { value: 'bar-chart', label: '棒グラフ', description: '数値の比較', icon: '▮▯' },
      { value: 'stacked-bar', label: '積み上げ棒', description: '構成の比較', icon: '▤' },
      { value: 'pie-chart', label: '円グラフ', description: '割合・構成比', icon: '◐' },
      { value: 'line-chart', label: '折れ線', description: '推移の表現', icon: '📈' },
      { value: 'waterfall', label: 'ウォーターフォール', description: '増減分析', icon: '⫪' },
      { value: 'radar', label: 'レーダー', description: '多軸評価', icon: '⬡' },
      { value: 'bridge', label: 'ブリッジ', description: '差異の要因分解', icon: '┃┃' },
      { value: 'kpi-dashboard', label: 'KPIダッシュボード', description: '指標の一覧表示', icon: '▣▣' },
    ],
  },
  {
    name: '関係性系',
    options: [
      { value: 'cause-effect', label: '因果関係', description: '原因→結果の関係', icon: '⟹' },
      { value: 'value-chain', label: 'バリューチェーン', description: '価値の連鎖', icon: '⛓' },
      { value: 'venn', label: 'ベン図', description: '重なり・共通点', icon: '◎' },
      { value: 'stakeholder-map', label: 'ステークホルダー', description: '関係者の整理', icon: '👥' },
      { value: 'org-chart', label: '組織図', description: '組織階層', icon: '⊤⊤' },
    ],
  },
  {
    name: 'シンプル',
    options: [
      { value: 'bullets-with-visual', label: '箇条書き+図', description: '補助ビジュアル付き', icon: '▪◻' },
      { value: 'icon-grid', label: 'アイコングリッド', description: 'アイコン配置', icon: '⊞⊞' },
      { value: 'bullets-only', label: '箇条書きのみ', description: 'テキストのみ', icon: '▪▪' },
    ],
  },
  {
    name: '複合レイアウト',
    options: [
      { value: 'before-after-diagram', label: 'ビフォーアフター図解', description: '左右に図解でBefore/After', icon: '◻→◻' },
      { value: 'concept-explanation', label: '概念+説明', description: '抽象概念（左）＋説明テキスト（右）', icon: '◎｜=' },
      { value: 'flow-with-message', label: 'フロー+メッセージ', description: 'メッセージ＋フロー図', icon: '▬→→' },
      { value: 'chart-with-insight', label: 'グラフ+示唆', description: 'グラフ（左）＋インサイト（右）', icon: '📊💡' },
      { value: 'problem-solution', label: '問題→解決策', description: '問題（左）→ 解決策（右）', icon: '❌→✓' },
      { value: 'framework-application', label: 'フレームワーク適用', description: 'フレームワーク＋クライアント適用', icon: '⊞→◎' },
      { value: 'summary-detail', label: 'サマリー+詳細', description: 'エグゼクティブサマリー＋詳細展開', icon: '▬▼▼' },
      { value: 'multi-column-options', label: '複数オプション比較', description: '3列以上の選択肢比較', icon: 'A|B|C' },
      { value: 'timeline-with-details', label: 'タイムライン+詳細', description: 'タイムライン＋各フェーズ詳細', icon: '●─●▼' },
      { value: 'action-plan', label: 'アクションプラン', description: '担当・期限付きアクション一覧', icon: '☑│●│📅' },
      { value: 'impact-analysis', label: 'インパクト分析', description: '現状→将来＋定量的インパクト', icon: '→+30%' },
    ],
  },
  {
    name: '戦略フレームワーク',
    options: [
      { value: 'closed-loop-ecosystem', label: '循環エコシステム', description: '中央ループ＋レイヤー＋外部アクター', icon: '⟲◯' },
      { value: 'strategic-temple', label: '戦略の神殿', description: 'Vision/Pillars/Foundation構造', icon: '△┃┃' },
      { value: 'hub-spoke-detailed', label: 'ハブ＆スポーク', description: '中心＋放射状サテライト＋コネクタ', icon: '●━○' },
    ],
  },
];

// フラットなオプションリスト（検索用）
const visualHintOptions = visualHintCategories.flatMap(cat => cat.options);

// プリセットカラースキーム
const colorPresets: { name: string; colors: ColorScheme }[] = [
  {
    name: 'ビジネスブルー',
    colors: { primary: '#1e40af', secondary: '#3b82f6', accent: '#f59e0b', text: '#1f2937', background: '#ffffff' },
  },
  {
    name: 'モダンダーク',
    colors: { primary: '#111827', secondary: '#374151', accent: '#10b981', text: '#1f2937', background: '#ffffff' },
  },
  {
    name: 'コンサル風',
    colors: { primary: '#0f172a', secondary: '#475569', accent: '#dc2626', text: '#1e293b', background: '#ffffff' },
  },
  {
    name: 'ナチュラル',
    colors: { primary: '#166534', secondary: '#22c55e', accent: '#ca8a04', text: '#1f2937', background: '#ffffff' },
  },
  {
    name: 'エレガント',
    colors: { primary: '#581c87', secondary: '#9333ea', accent: '#f97316', text: '#1f2937', background: '#ffffff' },
  },
];

// フォントプリセット（個別選択用）
type FontOption = {
  name: string;
  family: string;
  description: string;
};

const fontOptions: FontOption[] = [
  { name: 'ゴシック', family: 'Noto Sans JP', description: 'ビジネス向け標準' },
  { name: '明朝', family: 'Noto Serif JP', description: '格調高い印象' },
  { name: 'メイリオ', family: 'Meiryo', description: 'Windows標準' },
  { name: 'ヒラギノ角ゴ', family: 'Hiragino Sans', description: 'Mac標準' },
  { name: 'BIZ UDゴシック', family: 'BIZ UDGothic', description: 'ユニバーサルデザイン' },
];

// 各要素ごとのフォント設定
type FontSettings = {
  title: FontOption;     // タイトル用フォント
  heading: FontOption;   // 見出し用フォント
  body: FontOption;      // 本文用フォント
};

const defaultFontSettings: FontSettings = {
  title: fontOptions[0],
  heading: fontOptions[0],
  body: fontOptions[0],
};

// 抽出されたトンマナスタイルの型
type ExtractedStyle = {
  name: string;
  description: string;
  colors: ColorScheme;
  font: {
    recommendation: string;
    style: string;
  };
  toneManner: {
    writingStyle: ToneManner['writingStyle'];
    formality: ToneManner['formality'];
    bulletStyle: ToneManner['bulletStyle'];
  };
  characteristics: string[];
};

// デフォルトのトンマナ設定
const defaultToneManner: ToneManner = {
  writingStyle: 'polite',
  formality: 'formal',
  bulletStyle: 'dash',
  emphasisStyle: 'bold',
};

// スライドタイプごとのデフォルトビジュアル表現（戦略コンサルのベストプラクティス）
// ★★★ 重要スライドには複合表現（compositeVisual）をデフォルト推奨 ★★★
type DefaultVisualConfig = {
  hint: VisualHintType;
  intent: string;
  useComposite?: boolean;
  compositeConfig?: CompositeVisualConfig;
};

const defaultVisualHintBySlideType: Record<string, DefaultVisualConfig> = {
  // ===== コア・コンサルティングスライド（複合表現推奨） =====
  executive_summary: {
    hint: 'pyramid',
    intent: '【戦略の神殿構造】提案の全体像をVision/戦略の柱/基盤で構造化し、核心メッセージを頂点に据える。右側に各要素の具体的内容を補足。',
    useComposite: true,
    compositeConfig: {
      enabled: true,
      primaryPattern: 'strategic-temple',
      secondaryPattern: 'bullets-with-visual',
      layoutType: 'left-right',
      relationDescription: '左: 提案の構造（Vision/戦略の柱/基盤）、右: 各要素の詳細説明と期待効果',
    },
  },
  current_recognition: {
    hint: 'cause-effect',
    intent: '【因果関係+重要度階層】現状の問題構造を因果連鎖で分解し、根本原因を特定。右側に問題の重要度階層を示すことで、なぜこの問題に取り組むべきかを論理的に説明。',
    useComposite: true,
    compositeConfig: {
      enabled: true,
      primaryPattern: 'cause-effect',
      secondaryPattern: 'pyramid',
      layoutType: 'left-right',
      relationDescription: '左: 問題の因果連鎖（原因→症状→影響）、右: 問題の重要度・緊急度の階層',
    },
  },
  issue_setting: {
    hint: 'tree',
    intent: '【イシューツリー+優先度マトリクス】論点をMECE分解し、最もクリティカルな課題を特定。右側に緊急度×重要度マトリクスで優先順位の根拠を示す。',
    useComposite: true,
    compositeConfig: {
      enabled: true,
      primaryPattern: 'tree',
      secondaryPattern: 'matrix',
      layoutType: 'left-right',
      relationDescription: '左: イシューツリー（論点の構造的分解）、右: 課題の緊急度×重要度マトリクス',
    },
  },
  tobe_vision: {
    hint: 'gap-analysis',
    intent: '【ギャップ分析+ロードマップ】As-Is/To-Beのギャップを上部で可視化し、下部にギャップを埋めるロードマップを示すことで、ビジョンの実現可能性を論証。',
    useComposite: true,
    compositeConfig: {
      enabled: true,
      primaryPattern: 'gap-analysis',
      secondaryPattern: 'roadmap',
      layoutType: 'top-bottom',
      relationDescription: '上: As-Is（現状）とTo-Be（理想）のギャップ分析、下: ギャップを埋める変革ロードマップ',
    },
  },
  approach_overview: {
    hint: 'process-flow',
    intent: '【プロセスフロー+タイムライン】アプローチの論理フローを上部に、実行タイムラインを下部に配置。「何を」「いつ」の両面から実現方法を説明。',
    useComposite: true,
    compositeConfig: {
      enabled: true,
      primaryPattern: 'process-flow',
      secondaryPattern: 'timeline',
      layoutType: 'top-bottom',
      relationDescription: '上: アプローチの論理フロー（Phase 1→2→3）、下: 実行タイムラインとマイルストーン',
    },
  },
  // ===== 詳細スライド（単一表現でも可） =====
  approach_detail: {
    hint: 'swimlane',
    intent: '各ステップの担当・成果物・マイルストーンをスイムレーンで可視化',
    useComposite: false,
  },
  schedule: {
    hint: 'gantt',
    intent: 'プロジェクト全体のスケジュールと依存関係をガントチャートで表現',
    useComposite: false,
  },
  team: {
    hint: 'org-chart',
    intent: 'プロジェクト体制と役割分担を組織図形式で表現',
    useComposite: false,
  },
  meeting_structure: {
    hint: 'matrix',
    intent: '会議体の種類・頻度・参加者をマトリクスで整理',
    useComposite: false,
  },
  estimate: {
    hint: 'waterfall',
    intent: '【コスト構成+根拠】見積り内訳をウォーターフォールチャートで積み上げ表示し、右側に前提条件と算出根拠を明示',
    useComposite: true,
    compositeConfig: {
      enabled: true,
      primaryPattern: 'waterfall',
      secondaryPattern: 'bullets-with-visual',
      layoutType: 'left-right',
      relationDescription: '左: コスト構成の積み上げ可視化、右: 前提条件・工数算出根拠',
    },
  },
  estimate_assumptions: {
    hint: 'bullets-with-visual',
    intent: '見積り前提条件を箇条書きで明確にする',
    useComposite: false,
  },
  project_members: {
    hint: 'icon-grid',
    intent: 'プロジェクトメンバーの経歴・スキルをアイコングリッドで表示',
    useComposite: false,
  },
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);
  const [generating, setGenerating] = useState(false);
  const [editableOutline, setEditableOutline] = useState<Outline | null>(null);
  const [originalOutline, setOriginalOutline] = useState<Outline | null>(null); // 編集前の状態を保持
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewSlides, setPreviewSlides] = useState<SlideElement[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [toneManner, setToneManner] = useState<ToneManner>(defaultToneManner);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(colorPresets[0].colors);
  const [isCustomColorMode, setIsCustomColorMode] = useState(false);
  const [fontSettings, setFontSettings] = useState<FontSettings>(defaultFontSettings);
  const [extractedStyles, setExtractedStyles] = useState<ExtractedStyle[]>([]);
  const [isAnalyzingSlide, setIsAnalyzingSlide] = useState(false);
  // 複合表現用の状態
  const [showCompositeMode, setShowCompositeMode] = useState(false);
  const [selectedCompositePresetId, setSelectedCompositePresetId] = useState<string | null>(null);
  // エクスポートモーダル用の状態
  const [showExportModal, setShowExportModal] = useState(false);
  // ビジュアル最適化用の状態（Phase B）
  const [isOptimizingVisual, setIsOptimizingVisual] = useState(false);
  const [visualOptimizationDone, setVisualOptimizationDone] = useState(false);

  // トンマナ設定とカラースキームを初期化
  useEffect(() => {
    if (proposal?.settings?.toneManner) {
      setToneManner(proposal.settings.toneManner);
    }
    if (proposal?.settings?.colors) {
      setColorScheme(proposal.settings.colors);
    }
  }, [proposal]);

  // proposalが読み込まれたら編集可能なoutlineを初期化
  useEffect(() => {
    if (proposal && proposal.outline) {
      console.log('📋 review/page: proposalからoutlineを初期化');
      console.log('  - background:', proposal.outline.currentRecognition?.background?.substring(0, 50) || '(なし)');
      console.log('  - slideStructureProposal:', proposal.outline.slideStructureProposal?.length || 0, '枚');
      console.log('  - visualRecommendations:', proposal.outline.visualRecommendations ? '有り' : 'なし');

      // ★★★ 常にproposalからの最新データで更新する ★★★
      // （ユーザーがchat/page.tsxから遷移してきた時に最新データを反映するため）
      setEditableOutline(proposal.outline);

      // 初回のみoriginalOutlineを設定（リセット用）
      // ★★★ proposal.idを使って、異なるproposalの場合はリセットする ★★★
      setOriginalOutline((prev) => {
        // 初回、またはproposalが変わった場合は新しいoriginalOutlineを設定
        if (!prev) {
          return JSON.parse(JSON.stringify(proposal.outline));
        }
        return prev;
      });
    }
  }, [proposal]);

  // editableOutlineが変更されたら自動保存
  useEffect(() => {
    if (!proposal || !editableOutline || !originalOutline) return;

    // 変更があるかチェック
    const isChanged = JSON.stringify(editableOutline) !== JSON.stringify(originalOutline);
    setHasUnsavedChanges(isChanged);

    // 変更がある場合は自動保存（デバウンス）
    const timeoutId = setTimeout(() => {
      if (isChanged) {
        const updatedProposal = {
          ...proposal,
          outline: editableOutline,
          updatedAt: Date.now(),
        };
        saveProposal(updatedProposal);
        console.log('✅ 骨子を自動保存しました');
      }
    }, 500); // 500ms のデバウンス

    return () => clearTimeout(timeoutId);
  }, [editableOutline, proposal, originalOutline]);

  // スライドタイプとvisualRecommendationsセクションのマッピング
  const slideTypeToRecommendationSection: Record<string, keyof VisualRecommendations> = {
    // 主要セクション
    'executive_summary': 'executiveSummary',
    'current_recognition': 'currentRecognition',
    'issue_setting': 'issueSetting',
    'issue_tree': 'issueSetting',
    'tobe_vision': 'toBeVision',
    'expected_effect': 'expectedEffect',
    'project_goal': 'toBeVision',
    'approach_overview': 'approach',
    'approach_detail': 'approach',
    'why_this_approach': 'approach',
    'why_us': 'whyUs',
    'risk_management': 'riskManagement',
    // プロジェクト実行セクション
    'schedule': 'projectSchedule',
    'team': 'projectTeam',
    'meeting_structure': 'meetingStructure',
    'estimate': 'estimate',
    'estimate_assumptions': 'estimate',
    'project_members': 'projectTeam',
    'appendix': 'appendix',
  };

  // ビジュアル表現と構造プリセットを取得するヘルパー
  // 優先順位:
  // 1. 既存のproposal.slidesに保存済みの設定（ユーザー手動設定）
  // 2. AIが抽出したvisualRecommendations（対話内容ベース）
  // 3. スライド内容を分析して推奨（ルールベース）
  // 4. デフォルト設定
  const getVisualHintForPreview = (type: string, slideData?: Partial<SlideElement>, orderNum?: number) => {
    // 1. まず既存のproposal.slidesからvisualHintを探す（ユーザーが手動で変更した場合を優先）
    if (proposal?.slides) {
      const existing = proposal.slides.find(s => {
        if (type === 'approach_detail') {
          return s.type === type && s.order === orderNum;
        }
        return s.type === type;
      });
      // 既存の設定があり、ユーザーが明示的に設定した可能性がある場合は使用
      if (existing?.visualIntent && existing.visualReason !== '内容分析による自動推奨' && existing.visualReason !== 'AI対話内容に基づく推奨') {
        return {
          visualHint: existing.visualHint,
          visualIntent: existing.visualIntent,
          visualReason: existing.visualReason,
          structurePreset: existing.structurePreset,
          useStructureMode: existing.useStructureMode,
        };
      }
    }

    // 2. AIが抽出したvisualRecommendationsを参照
    const sectionKey = slideTypeToRecommendationSection[type];
    if (sectionKey && editableOutline?.visualRecommendations?.[sectionKey]) {
      const aiRecommendation = editableOutline.visualRecommendations[sectionKey];
      if (aiRecommendation?.visualHint) {
        return {
          visualHint: aiRecommendation.visualHint as VisualHintType,
          visualIntent: aiRecommendation.reason || 'AI対話内容に基づく推奨',
          visualReason: 'AI対話内容に基づく推奨',
          structurePreset: undefined,
          useStructureMode: false,
        };
      }
    }

    // 3. スライドデータがある場合は内容分析ベースで推奨
    if (slideData) {
      const tempSlide: SlideElement = {
        id: 'temp',
        type: type as SlideElement['type'],
        order: orderNum || 0,
        layout: 'title-bullets',
        content: slideData.content || { bullets: [] },
        title: slideData.title,
        mainMessage: slideData.mainMessage,
        subtitle: slideData.subtitle,
      };
      const recommendation = recommendVisual(tempSlide);
      return {
        visualHint: recommendation.visualHint,
        visualIntent: `${recommendation.reason}（確度: ${recommendation.confidence === 'high' ? '高' : recommendation.confidence === 'medium' ? '中' : '低'}）`,
        visualReason: '内容分析による自動推奨',
        structurePreset: recommendation.preset,
        useStructureMode: recommendation.useStructureMode,
      };
    }

    // 4. フォールバック: デフォルトを使用（複合表現対応）
    const defaultHint = defaultVisualHintBySlideType[type];
    const defaultStructure = defaultStructurePresetBySlideType[type];
    if (defaultHint) {
      return {
        visualHint: defaultHint.hint,
        visualIntent: defaultHint.intent,
        visualReason: defaultHint.useComposite ? '戦略コンサル推奨: 複合表現' : 'スライドタイプに基づくデフォルト推奨',
        structurePreset: defaultStructure?.preset,
        useStructureMode: defaultStructure?.useStructureMode ?? false,
        // ★★★ 複合表現をデフォルトで適用 ★★★
        compositeVisual: defaultHint.useComposite ? defaultHint.compositeConfig : undefined,
      };
    }
    return {
      visualHint: 'bullets-only' as VisualHintType,
      visualIntent: 'シンプルな箇条書きで表現',
      visualReason: 'デフォルト設定',
      structurePreset: 'simple-bullets' as SlideStructurePreset,
      useStructureMode: false,
    };
  };

  // スライドタイトルからスライドタイプを推定するヘルパー関数
  const inferSlideTypeFromTitle = (title: string): string => {
    const lowerTitle = title.toLowerCase();

    // 1. サマリー・表紙・目次（最優先）
    if (lowerTitle.includes('サマリー') || lowerTitle.includes('summary') || lowerTitle.includes('エグゼクティブ')) return 'executive_summary';
    if (lowerTitle.includes('表紙') || lowerTitle.includes('タイトル')) return 'executive_summary';
    if (lowerTitle.includes('目次') || lowerTitle.includes('アジェンダ') || lowerTitle.includes('agenda')) return 'executive_summary';

    // 2. 現状認識（背景・課題認識）- ★★★改善: 複合タイトルにも対応★★★
    if (lowerTitle.includes('現状認識') || lowerTitle.includes('課題認識') || lowerTitle.includes('as-is')) return 'current_recognition';
    // 「背景」「課題」の複合タイトル（例: 「現状認識（背景・課題）」「背景と課題」など）
    if (lowerTitle.includes('背景') && lowerTitle.includes('課題')) return 'current_recognition';
    // 「背景」単体（「課題」が含まれない場合）
    if (lowerTitle.includes('背景')) return 'current_recognition';

    // 3. イシューツリー・論点分解（課題設定の一種）
    if (lowerTitle.includes('イシュー') || lowerTitle.includes('issue') || lowerTitle.includes('論点')) return 'issue_setting';
    if (lowerTitle.includes('課題設定')) return 'issue_setting';
    // ★★★注意: 「課題」単体は後のフォールバックで処理（「現状認識（背景・課題）」と区別するため）★★★

    // 4. ToBe像・目指すべき姿（目標系）
    if (lowerTitle.includes('tobe') || lowerTitle.includes('to-be') || lowerTitle.includes('理想')) return 'tobe_vision';
    if (lowerTitle.includes('目指すべき') || lowerTitle.includes('あるべき姿')) return 'tobe_vision';
    if ((lowerTitle.includes('ゴール') || lowerTitle.includes('goal')) && !lowerTitle.includes('アプローチ') && !lowerTitle.includes('方針')) return 'tobe_vision';
    if (lowerTitle.includes('目標') && !lowerTitle.includes('アプローチ')) return 'tobe_vision';
    if (lowerTitle.includes('vision')) return 'tobe_vision';

    // 4.5. 期待効果・投資対効果（ToBe像と別スライドの場合）
    if (lowerTitle.includes('期待効果') || lowerTitle.includes('投資対効果') || lowerTitle.includes('roi')) return 'expected_effect';
    if (lowerTitle.includes('効果') && (lowerTitle.includes('投資') || lowerTitle.includes('コスト'))) return 'expected_effect';

    // 5. アプローチ概要
    if (lowerTitle.includes('アプローチ概要') || lowerTitle.includes('提案概要')) return 'approach_overview';
    if (lowerTitle.includes('解決策') || lowerTitle.includes('ソリューション')) return 'approach_overview';
    // 「アプローチ」単体で「詳細」が含まれない場合
    if (lowerTitle.includes('アプローチ') && !lowerTitle.includes('詳細')) return 'approach_overview';
    if (lowerTitle.includes('方針') && !lowerTitle.includes('詳細')) return 'approach_overview';

    // 6. アプローチ詳細（STEP, Phase, 詳細）
    if (lowerTitle.includes('step') || lowerTitle.includes('phase') || lowerTitle.includes('フェーズ') || lowerTitle.includes('ステップ')) return 'approach_detail';
    if (lowerTitle.includes('アプローチ詳細') || lowerTitle.includes('詳細')) return 'approach_detail';

    // 7. スケジュール
    if (lowerTitle.includes('スケジュール') || lowerTitle.includes('schedule')) return 'schedule';
    if (lowerTitle.includes('タイムライン') || lowerTitle.includes('timeline')) return 'schedule';
    if (lowerTitle.includes('ロードマップ') || lowerTitle.includes('roadmap')) return 'schedule';

    // 8. 体制・メンバー
    if (lowerTitle.includes('体制') || lowerTitle.includes('team')) return 'team';
    if (lowerTitle.includes('メンバー') && lowerTitle.includes('経歴')) return 'team';
    if (lowerTitle.includes('組織') || lowerTitle.includes('organization')) return 'team';

    // 9. 会議体・コミュニケーション
    if (lowerTitle.includes('会議') || lowerTitle.includes('コミュニケーション')) return 'meeting_structure';
    if (lowerTitle.includes('meeting') || lowerTitle.includes('定例') || lowerTitle.includes('報告')) return 'meeting_structure';

    // 10. 見積り・費用
    if (lowerTitle.includes('見積') || lowerTitle.includes('estimate')) return 'estimate';
    if (lowerTitle.includes('費用') || lowerTitle.includes('予算') || lowerTitle.includes('コスト')) return 'estimate';
    if (lowerTitle.includes('価格') || lowerTitle.includes('投資')) return 'estimate';

    // 11. 前提条件・スコープ
    if (lowerTitle.includes('前提') || lowerTitle.includes('スコープ') || lowerTitle.includes('scope')) return 'estimate';

    // 12. Why Us・類似事例・実績
    if (lowerTitle.includes('why us') || lowerTitle.includes('why ')) return 'why_us';
    if (lowerTitle.includes('類似事例') || lowerTitle.includes('成功事例') || lowerTitle.includes('実績')) return 'why_us';
    if (lowerTitle.includes('選ばれる理由') || lowerTitle.includes('選定理由')) return 'why_us';
    if (lowerTitle.includes('case') || lowerTitle.includes('ケース')) return 'why_us';

    // 13. リスク管理
    if (lowerTitle.includes('リスク') || lowerTitle.includes('risk')) return 'risk_management';

    // 14. Appendix・補足
    if (lowerTitle.includes('appendix') || lowerTitle.includes('補足') || lowerTitle.includes('付録') || lowerTitle.includes('参考')) return 'appendix';

    // 15. Next Step・アクション
    if (lowerTitle.includes('next') || lowerTitle.includes('アクション') || lowerTitle.includes('action') || lowerTitle.includes('今後')) return 'approach_detail';

    // 16. その他のフォールバック
    // 「現状」単体
    if (lowerTitle.includes('現状')) return 'current_recognition';
    // 「課題」「問題」単体（ただし「課題設定」「イシュー」は上で処理済み）
    if (lowerTitle.includes('課題') || lowerTitle.includes('問題')) return 'issue_setting';
    // 「提案」単体
    if (lowerTitle.includes('提案')) return 'approach_overview';

    return 'approach_detail'; // デフォルト
  };

  // outlineが変更されたらプレビュースライドを生成
  useEffect(() => {
    if (!editableOutline) {
      console.log('⏳ review/page: editableOutlineがまだ設定されていません');
      return;
    }

    console.log('🎯 review/page: スライド生成を開始');
    console.log('  - currentRecognition:', editableOutline.currentRecognition ? '有り' : '無し');
    console.log('  - issueSetting:', editableOutline.issueSetting ? '有り' : '無し');
    console.log('  - toBeVision:', editableOutline.toBeVision ? '有り' : '無し');
    console.log('  - approach:', editableOutline.approach ? '有り' : '無し');
    console.log('  - slideStructureProposal:', editableOutline.slideStructureProposal?.length || 0, '枚');
    console.log('  - visualRecommendations:', editableOutline.visualRecommendations ? '有り' : '無し');

    const slides: SlideElement[] = [];
    let order = 0;

    // 安全にアクセスするためのヘルパー
    const currentRecognition = editableOutline.currentRecognition || { background: '', currentProblems: [], rootCauseHypothesis: [] };
    const issueSetting = editableOutline.issueSetting || { criticalIssues: [] };
    const toBeVision = editableOutline.toBeVision || { vision: '', goals: [], projectScope: '' };
    const approach = editableOutline.approach || { overview: '', steps: [] };

    // ★★★ slideStructureProposalがある場合は、それを使用（AIが提案した構成） ★★★
    const slideProposal = editableOutline.slideStructureProposal;

    if (slideProposal && Array.isArray(slideProposal) && slideProposal.length > 0) {
      console.log('📊 slideStructureProposalを使用:', slideProposal.length, '枚');

      // ★★★ slideNumberでソートして正しい順序にする ★★★
      const sortedProposal = [...slideProposal].sort((a, b) => {
        const numA = typeof a.slideNumber === 'number' ? a.slideNumber : parseInt(String(a.slideNumber)) || 999;
        const numB = typeof b.slideNumber === 'number' ? b.slideNumber : parseInt(String(b.slideNumber)) || 999;
        return numA - numB;
      });

      console.log('🔍 ソート後の順序（詳細デバッグ）:');
      sortedProposal.forEach((sp, idx) => {
        const inferredType = inferSlideTypeFromTitle(String(sp.title || ''));
        console.log(`  [${idx}] #${sp.slideNumber} "${sp.title}" → type: ${inferredType}`);
        console.log(`       content: "${String(sp.content || '').substring(0, 50)}..."`);
        console.log(`       keyMessage: "${String(sp.keyMessage || '').substring(0, 50)}..."`);
      });

      sortedProposal.forEach((sp, arrayIndex) => {
        const slideTitle = String(sp.title || `スライド${arrayIndex + 1}`).trim();

        // 空のタイトルはスキップ
        if (!slideTitle || slideTitle === 'スライド' || slideTitle === 'undefined') {
          return;
        }

        // タイトルからスライドタイプを推定（ビジュアル推奨用のみ）
        const slideType = inferSlideTypeFromTitle(slideTitle);

        // ★★★ slideStructureProposalのデータをそのまま使用 ★★★
        // 骨子データからの補完は行わない（誤った内容が混入するのを防ぐ）
        const proposalContent = String(sp.content || '').trim();
        const proposalPurpose = String(sp.purpose || '').trim();
        const proposalKeyMessage = String(sp.keyMessage || '').trim();

        // proposalのデータから直接コンテンツを生成
        const finalMainMessage = proposalKeyMessage || proposalPurpose || slideTitle;
        const finalBody = proposalContent || proposalPurpose || '';

        // コンテンツがある場合は箇条書きに変換
        let finalBullets: string[] = [];
        if (finalBody) {
          // 【】形式の複合構造か判定
          const hasCompositeFormat = finalBody.includes('【') && finalBody.includes('】');

          if (hasCompositeFormat) {
            // 【】形式を改行区切りに変換
            // 例: "【結論】...。【効果】..." → ["結論: ...", "効果: ..."]
            finalBullets = finalBody
              .split(/【/)
              .filter(s => s.trim())
              .map(s => {
                const match = s.match(/^([^】]+)】(.+)/);
                if (match) {
                  return `${match[1]}: ${match[2].trim().replace(/。$/, '')}`;
                }
                return s.trim().replace(/。$/, '');
              })
              .filter(Boolean);
          } else {
            // 改行で分割（新形式対応）
            const lines = finalBody.split(/\n/).filter(line => line.trim());
            if (lines.length > 1) {
              finalBullets = lines.map(line => line.trim()).filter(Boolean);
            } else {
              // 改行がない場合は句点で分割
              const sentences = finalBody.split(/。/).filter(s => s.trim());
              if (sentences.length > 1) {
                finalBullets = sentences.map(s => s.trim()).filter(Boolean);
              } else {
                finalBullets = [finalBody];
              }
            }
          }
        }

        const slideContent = {
          title: slideTitle,
          mainMessage: finalMainMessage,
          content: {
            title: slideTitle,
            text: finalBody,
            body: finalBody,
            bullets: finalBullets.length > 0 ? finalBullets : ['内容を編集してください'],
          },
        };

        const slideVisual = getVisualHintForPreview(slideType, slideContent, order);
        slides.push({
          id: `preview-slide-${order + 1}`,
          type: slideType as SlideType,
          order: order++,
          layout: finalBullets.length > 1 ? 'title-bullets' : 'title-content',
          ...slideContent,
          ...slideVisual,
        });
      });

      if (slides.length > 0) {
        console.log('✅ slideStructureProposalから', slides.length, '枚のスライドを生成しました');
        setPreviewSlides(slides);
        return;
      }
    }

    // ★★★ フォールバック: slideStructureProposalがない場合は骨子データから生成 ★★★
    console.log('📊 骨子データから標準構造でスライドを生成（フォールバック）');
    console.log('  - steps:', approach.steps?.length || 0, '個');

    // 1. エグゼクティブサマリー
    const execSummaryContent = {
      title: 'エグゼクティブサマリー',
      mainMessage: '提案の全体像',
      content: {
        title: 'エグゼクティブサマリー',
        text: currentRecognition.background || '',
        bullets: [
          currentRecognition.background || '',
          ...(issueSetting.criticalIssues?.slice(0, 2) || []),
          toBeVision.vision || '',
        ].filter(Boolean),
      },
    };
    const execSummaryVisual = getVisualHintForPreview('executive_summary', execSummaryContent);
    slides.push({
      id: `preview-slide-${order + 1}`,
      type: 'executive_summary',
      order: order++,
      layout: 'title-bullets',
      ...execSummaryContent,
      ...execSummaryVisual,
    });

    // 2. 現状認識
    const currentProblems = currentRecognition.currentProblems || [];
    const rootCauseHypothesis = currentRecognition.rootCauseHypothesis || [];
    const currentRecogContent = {
      title: '現状認識',
      mainMessage: currentRecognition.background || '',
      content: {
        title: '現状認識',
        body: currentRecognition.background || '',
        bullets: [
          ...(currentProblems.length > 0
            ? ['【直面している問題】', ...currentProblems]
            : []),
          ...(rootCauseHypothesis.length > 0
            ? ['【原因仮説】', ...rootCauseHypothesis]
            : []),
        ],
      },
    };
    const currentRecogVisual = getVisualHintForPreview('current_recognition', currentRecogContent);
    slides.push({
      id: `preview-slide-${order + 1}`,
      type: 'current_recognition',
      order: order++,
      layout: 'title-bullets',
      ...currentRecogContent,
      ...currentRecogVisual,
    });

    // 3. 課題設定
    const criticalIssues = issueSetting.criticalIssues || [];
    if (criticalIssues.length > 0) {
      const mainIssue = criticalIssues[0];
      const issueContent = {
        title: '課題設定',
        mainMessage: `最もクリティカルな課題は「${mainIssue}」である`,
        content: {
          title: '課題設定',
          bullets: criticalIssues,
        },
      };
      const issueVisual = getVisualHintForPreview('issue_setting', issueContent);
      slides.push({
        id: `preview-slide-${order + 1}`,
        type: 'issue_setting',
        order: order++,
        layout: 'title-bullets',
        ...issueContent,
        ...issueVisual,
      });
    }

    // 4. ToBe像
    const vision = toBeVision.vision || '';
    const goals = toBeVision.goals || [];
    const projectScope = toBeVision.projectScope || '';
    if (vision) {
      const tobeContent = {
        title: 'ToBe像（理想の姿）',
        mainMessage: vision,
        content: {
          title: 'ToBe像（理想の姿）',
          body: vision,
          bullets: [
            ...(goals.length > 0
              ? ['【具体的なゴール】', ...goals]
              : []),
            ...(projectScope
              ? ['【プロジェクトスコープ】', projectScope]
              : []),
          ],
        },
      };
      const tobeVisual = getVisualHintForPreview('tobe_vision', tobeContent);
      slides.push({
        id: `preview-slide-${order + 1}`,
        type: 'tobe_vision',
        order: order++,
        layout: 'title-bullets',
        ...tobeContent,
        ...tobeVisual,
      });
    }

    // 5. アプローチ概要
    const overview = approach.overview || '';
    const steps = approach.steps || [];

    if (overview || steps.length > 0) {
      const stepBullets = steps.map((step, idx) =>
        step.description
          ? `STEP ${idx + 1}: ${step.title} - ${step.description}`
          : `STEP ${idx + 1}: ${step.title}`
      );

      const approachOverviewContent = {
        title: 'アプローチ概要',
        mainMessage: overview || (steps.length > 0 ? `${steps.length}つのSTEPで実現する` : ''),
        content: {
          title: 'アプローチ概要',
          text: overview,
          body: overview,
          bullets: stepBullets,
        },
      };
      const approachOverviewVisual = getVisualHintForPreview('approach_overview', approachOverviewContent);
      slides.push({
        id: `preview-slide-${order + 1}`,
        type: 'approach_overview',
        order: order++,
        layout: 'title-bullets',
        ...approachOverviewContent,
        ...approachOverviewVisual,
      });
    }

    // 6. アプローチステップ（詳細）- 各ステップを個別スライドとして作成
    steps.forEach((step, idx) => {
      const currentOrder = order++;
      const approachDetailContent = {
        title: `アプローチ: ${step.title}`,
        mainMessage: step.title,
        content: {
          title: `STEP ${idx + 1}: ${step.title}`,
          text: step.description,
          body: step.description,
          bullets: step.description ? [step.description] : [],
        },
      };
      const approachDetailVisual = getVisualHintForPreview('approach_detail', approachDetailContent, currentOrder);
      slides.push({
        id: `preview-slide-${currentOrder + 1}`,
        type: 'approach_detail',
        order: currentOrder,
        layout: 'title-content',
        ...approachDetailContent,
        ...approachDetailVisual,
      });
    });

    // 7. スケジュール（抽出データがあれば使用、なければデフォルト）
    const ps = editableOutline.projectSchedule;
    const scheduleContent = {
      title: 'プロジェクトスケジュール',
      mainMessage: ps?.overview || '各フェーズの実施期間と主要マイルストーン',
      content: {
        title: 'プロジェクトスケジュール',
        text: ps?.duration ? `総期間: ${ps.duration}` : '詳細なスケジュールはドラフト編集で設定してください',
        bullets: ps?.phases && Array.isArray(ps.phases) && ps.phases.length > 0
          ? ps.phases.map((phase) => `${phase.name} (${phase.duration})`)
          : steps.map((step, idx) => `Phase ${idx + 1}: ${step.title}`),
      },
    };
    const scheduleVisual = getVisualHintForPreview('schedule', scheduleContent);
    slides.push({
      id: `preview-slide-${order + 1}`,
      type: 'schedule',
      order: order++,
      layout: 'timeline',
      ...scheduleContent,
      ...scheduleVisual,
    });

    // 8. プロジェクト体制図（抽出データがあれば使用、なければデフォルト）
    const pt = editableOutline.projectTeam;
    const teamContent = {
      title: 'プロジェクト体制',
      mainMessage: pt?.overview || 'プロジェクト推進のための体制と役割分担',
      content: {
        title: 'プロジェクト体制',
        text: Array.isArray(pt?.responsibilities)
          ? pt.responsibilities.join(' / ')
          : (typeof pt?.responsibilities === 'string' ? pt.responsibilities : '詳細な体制はドラフト編集で設定してください'),
        bullets: pt?.roles && Array.isArray(pt.roles) && pt.roles.length > 0
          ? pt.roles.map((r) => r.headcount ? `${r.role} (${r.headcount}名): ${r.description}` : `${r.role}: ${r.description}`)
          : [
              'プロジェクトオーナー',
              'プロジェクトマネージャー',
              '各チームリーダー',
              'メンバー',
            ],
      },
    };
    const teamVisual = getVisualHintForPreview('team', teamContent);
    slides.push({
      id: `preview-slide-${order + 1}`,
      type: 'team',
      order: order++,
      layout: 'title-content',
      ...teamContent,
      ...teamVisual,
    });

    // 9. 会議体・コミュニケーション（抽出データがあれば使用、なければデフォルト）
    const ms = editableOutline.meetingStructure;
    const meetingContent = {
      title: '会議体・コミュニケーション設計',
      mainMessage: ms?.overview || 'プロジェクト進行を円滑にするコミュニケーション体制',
      content: {
        title: '会議体・コミュニケーション設計',
        text: ms?.reportingStructure || '詳細な会議体はドラフト編集で設定してください',
        bullets: ms?.meetings && Array.isArray(ms.meetings) && ms.meetings.length > 0
          ? ms.meetings.map((m) => `${m.name}（${m.frequency}）: ${m.purpose}`)
          : [
              'ステアリングコミッティ（月次）',
              '進捗報告会（週次）',
              '作業部会（随時）',
            ],
      },
    };
    const meetingVisual = getVisualHintForPreview('meeting_structure', meetingContent);
    slides.push({
      id: `preview-slide-${order + 1}`,
      type: 'meeting_structure',
      order: order++,
      layout: 'title-bullets',
      ...meetingContent,
      ...meetingVisual,
    });

    // 10. 見積り・費用（抽出データがあれば使用、なければデフォルト）
    const est = editableOutline.estimate;
    const estimateContent = {
      title: '概算見積り',
      mainMessage: est?.overview || 'プロジェクト全体の概算費用',
      content: {
        title: '概算見積り',
        text: est?.totalAmount ? `総額: ${est.totalAmount}` : '詳細な見積りはドラフト編集で設定してください',
        bullets: est?.breakdown && Array.isArray(est.breakdown) && est.breakdown.length > 0
          ? est.breakdown.map((item) => item.amount ? `${item.category}: ${item.amount}` : item.category)
          : [
              '人件費',
              'システム構築費',
              '運用・保守費',
            ],
      },
    };
    const estimateVisual = getVisualHintForPreview('estimate', estimateContent);
    slides.push({
      id: `preview-slide-${order + 1}`,
      type: 'estimate',
      order: order++,
      layout: 'title-content',
      ...estimateContent,
      ...estimateVisual,
    });

    setPreviewSlides(slides);
  }, [editableOutline]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black mx-auto mb-6"></div>
          <p className="text-xs text-gray-400 tracking-wide">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!proposal || !editableOutline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="text-center">
          <h1 className="text-lg font-medium text-black mb-4 tracking-wide">
            提案書が見つかりません
          </h1>
        </Card>
      </div>
    );
  }

  // スライドを削除
  const handleDeleteSlide = (slideId: string) => {
    if (!confirm('このスライドを削除してもよろしいですか？')) {
      return;
    }

    const slideToDelete = previewSlides.find(s => s.id === slideId);
    if (!slideToDelete) return;

    // 骨子に紐づかないスライド（schedule, team, meeting_structure, estimate）は
    // previewSlidesから直接削除
    const standaloneSlideTypes = ['schedule', 'team', 'meeting_structure', 'estimate', 'estimate_assumptions', 'project_members'];
    if (standaloneSlideTypes.includes(slideToDelete.type || '')) {
      setPreviewSlides(previewSlides.filter(s => s.id !== slideId));
      return;
    }

    // スライドタイプに応じてoutlineから削除
    const newOutline = { ...editableOutline };

    if (slideToDelete.type === 'issue_setting') {
      newOutline.issueSetting.criticalIssues = [];
    } else if (slideToDelete.type === 'tobe_vision') {
      newOutline.toBeVision = { vision: '', goals: [], projectScope: '' };
    } else if (slideToDelete.type === 'approach_overview') {
      newOutline.approach.overview = '';
    } else if (slideToDelete.type === 'approach_detail') {
      // アプローチステップを削除
      const stepIndex = previewSlides
        .filter(s => s.type === 'approach_detail')
        .findIndex(s => s.id === slideId);
      if (stepIndex !== -1) {
        newOutline.approach.steps = newOutline.approach.steps.filter((_, idx) => idx !== stepIndex);
      }
    }

    setEditableOutline(newOutline);
  };

  // スライドの順序を変更
  const handleReorderSlides = (reorderedSlides: SlideElement[]) => {
    setPreviewSlides(reorderedSlides);
  };

  // スライドを追加
  const handleAddSlide = (afterSlideId?: string) => {
    const newSlideId = `slide-${Date.now()}`;
    const newSlide: SlideElement = {
      id: newSlideId,
      type: 'approach_detail',
      order: previewSlides.length,
      layout: 'title-bullets',
      title: '新しいスライド',
      mainMessage: 'ここにメッセージを入力',
      content: {
        title: '新しいスライド',
        body: '',
        bullets: ['内容を編集してください'],
      },
    };

    if (afterSlideId) {
      // 指定されたスライドの後に挿入
      const insertIndex = previewSlides.findIndex(s => s.id === afterSlideId);
      if (insertIndex !== -1) {
        const newSlides = [
          ...previewSlides.slice(0, insertIndex + 1),
          newSlide,
          ...previewSlides.slice(insertIndex + 1),
        ].map((s, idx) => ({ ...s, order: idx }));
        setPreviewSlides(newSlides);
        setSelectedSlideId(newSlideId);
        return;
      }
    }

    // 末尾に追加
    setPreviewSlides([...previewSlides, newSlide]);
    setSelectedSlideId(newSlideId);
  };

  // スライドタイトルを編集
  const handleEditSlideTitle = (slideId: string, newTitle: string) => {
    setPreviewSlides(previewSlides.map(slide => {
      if (slide.id === slideId) {
        return {
          ...slide,
          title: newTitle,
          content: {
            ...slide.content,
            title: newTitle,
          },
        };
      }
      return slide;
    }));
  };

  // ★★★ Phase B: ビジュアル最適化API呼び出し ★★★
  const handleOptimizeVisual = async () => {
    if (!editableOutline || previewSlides.length === 0) return;

    setIsOptimizingVisual(true);
    try {
      // Phase Aの形式でスライドデータを構築
      const slidesForApi = previewSlides.map((slide, index) => ({
        slideNo: index + 1,
        title: slide.title || `スライド ${index + 1}`,
        keyMessage: slide.mainMessage || '',
        body: slide.content?.bullets || (slide.content?.body ? slide.content.body.split('\n').filter(Boolean) : []),
        evidenceNeeded: undefined,
        connectionToNext: undefined,
      }));

      // アウトライン情報も含めて送信
      const requestBody = {
        slides: slidesForApi,
        outline: {
          currentRecognition: editableOutline.currentRecognition,
          issueSetting: editableOutline.issueSetting,
          toBeVision: editableOutline.toBeVision,
          approach: editableOutline.approach,
        },
      };

      const response = await fetch('/api/design-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('ビジュアル設計APIの呼び出しに失敗しました');
      }

      const result = await response.json();
      console.log('🎨 Phase B ビジュアル最適化結果:', result);

      // 結果をスライドに反映（新しいPhase B形式に対応）
      if (result.success && result.slides && Array.isArray(result.slides)) {
        // slideNoでマッピング
        const optimizedMap = new Map<number, typeof result.slides[0]>();
        result.slides.forEach((opt: typeof result.slides[0]) => {
          optimizedMap.set(opt.slideNo, opt);
        });

        // previewSlidesを更新
        setPreviewSlides(prev => prev.map((slide, index) => {
          const slideNo = index + 1;
          const optimized = optimizedMap.get(slideNo);
          if (optimized) {
            // Phase BのpatternIdからvisualHintへのマッピング
            const patternToHintMap: Record<string, VisualHintType> = {
              'process': 'process-flow',
              'hierarchy': 'hierarchy',
              'pyramid': 'pyramid',
              'tree': 'tree',
              'cycle': 'cycle',
              'convergence': 'convergence',
              'divergence': 'divergence',
              'funnel': 'funnel',
              'swimlane': 'swimlane',
              'matrix': 'matrix',
              'graph': 'bar-chart',
              'table': 'comparison',
              'text_only': 'bullets-only',
            };

            const primaryPatternId = optimized.uiRecommendation?.primaryPatternId || 'text_only';
            const visualHint = patternToHintMap[primaryPatternId] || 'bullets-only';

            return {
              ...slide,
              visualHint: visualHint,
              visualIntent: optimized.uiRecommendation?.rationale || '',
              visualReason: optimized.generativeInstruction?.layoutComposition || 'AI最適化による推奨',
              // Phase B固有のフィールドを保存
              uiRecommendation: optimized.uiRecommendation,
              generativeInstruction: optimized.generativeInstruction,
              // 複合表現設定
              compositeVisual: optimized.uiRecommendation?.mode === 'composite' && optimized.uiRecommendation?.secondaryPatternId ? {
                enabled: true,
                primaryPattern: patternToHintMap[optimized.uiRecommendation.primaryPatternId] || 'bullets-only',
                secondaryPattern: patternToHintMap[optimized.uiRecommendation.secondaryPatternId] || 'bullets-only',
                layoutType: 'left-right' as CompositeLayoutType,
                relationDescription: optimized.uiRecommendation.rationale,
              } : undefined,
            };
          }
          return slide;
        }));

        setVisualOptimizationDone(true);
        console.log('✅ Phase B ビジュアル最適化をスライドに反映しました');
      }
    } catch (error) {
      console.error('ビジュアル最適化エラー:', error);
      alert('ビジュアル最適化に失敗しました。もう一度お試しください。');
    } finally {
      setIsOptimizingVisual(false);
    }
  };

  const handleNextStep = async () => {
    if (!proposal || !editableOutline) return;

    // 現在のoutlineのハッシュを計算
    const currentOutlineHash = generateOutlineHash(editableOutline);

    // トンマナ設定とカラースキームを含む更新されたsettings
    const updatedSettings: ProposalSettings = {
      ...proposal.settings,
      toneManner: toneManner,
      colors: colorScheme,
    };

    // キャッシュをチェック：outlineが変更されておらず、スライドが有効な場合はスキップ
    // ただし、ビジュアルヒントが変更されている可能性があるので、スライドは常に更新する
    const cache = getSlideGenerationCache(id);
    if (cache && cache.outlineHash === currentOutlineHash && areSlidesValid(proposal)) {
      console.log('✅ キャッシュヒット: AI分析をスキップ、スライドのvisualHintは更新');

      // previewSlidesからvisualHintの変更を既存スライドにマージ
      // previewSlidesをマップ化（type+orderでマッチング）
      const previewSlidesByKey = new Map<string, SlideElement>();
      previewSlides.forEach(slide => {
        if (slide.type) {
          const key = slide.type === 'approach_detail' ? `${slide.type}_${slide.order}` : slide.type;
          previewSlidesByKey.set(key, slide);
        }
      });

      // また、visualIntentがないスライドにはデフォルト値を設定
      const updatedSlides = proposal.slides.map(slide => {
        const key = slide.type === 'approach_detail' ? `${slide.type}_${slide.order}` : slide.type;
        const previewSlide = key ? previewSlidesByKey.get(key) : undefined;

        // previewSlidesからvisualHintを取得（ユーザーが変更した可能性があるため優先）
        if (previewSlide) {
          const visualHintChanged = previewSlide.visualHint !== slide.visualHint;
          return {
            ...slide,
            visualHint: previewSlide.visualHint,
            visualIntent: previewSlide.visualIntent,
            visualReason: previewSlide.visualReason,
            compositeVisual: previewSlide.compositeVisual, // 複合表現設定も保存
            structurePreset: previewSlide.structurePreset,
            useStructureMode: previewSlide.useStructureMode,
            imageUrl: visualHintChanged ? undefined : slide.imageUrl, // visualHintが変更されていたら画像を再生成
          };
        }

        // visualIntentがない場合はデフォルト値を設定
        if (!slide.visualIntent) {
          const defaultHint = slide.type ? defaultVisualHintBySlideType[slide.type] : null;
          return {
            ...slide,
            visualHint: defaultHint?.hint || 'bullets-only',
            visualIntent: defaultHint?.intent || 'シンプルな箇条書きで表現',
            visualReason: 'スライドタイプに基づくデフォルト推奨',
            imageUrl: undefined, // 画像を再生成するためクリア
          };
        }

        return slide;
      });

      const updatedProposal = {
        ...proposal,
        outline: editableOutline,
        slides: updatedSlides,
        settings: updatedSettings,
        updatedAt: Date.now(),
      };
      saveProposal(updatedProposal);
      console.log('✅ トンマナ設定を保存:', updatedSettings.toneManner);
      console.log('✅ カラースキームを保存:', updatedSettings.colors);
      router.push(`/proposal/${id}/draft`);
      return;
    }

    // 編集された内容を保存
    const updatedProposalWithOutline = {
      ...proposal,
      outline: editableOutline,
      updatedAt: Date.now(),
    };
    saveProposal(updatedProposalWithOutline);

    setGenerating(true);

    try {
      // 既存のスライドをマップ化（typeでマッチング）
      const existingSlidesByType = new Map<string, SlideElement>();
      proposal.slides.forEach(slide => {
        if (slide.type) {
          // approach_detailは複数あるのでtype+orderでキーを作成
          const key = slide.type === 'approach_detail' ? `${slide.type}_${slide.order}` : slide.type;
          existingSlidesByType.set(key, slide);
        }
      });

      // outline データから SlideElement[] を生成
      const slides: SlideElement[] = [];
      let order = 0;

      // previewSlidesをマップ化（typeでマッチング）- ユーザーが選択したvisualHintを優先
      const previewSlidesByType = new Map<string, SlideElement>();
      previewSlides.forEach(slide => {
        if (slide.type) {
          const key = slide.type === 'approach_detail' ? `${slide.type}_${slide.order}` : slide.type;
          previewSlidesByType.set(key, slide);
        }
      });

      // ヘルパー関数：previewSlides（ユーザー選択）を優先、次に既存スライドからvisualIntent等を引き継ぐ
      const getExistingVisualData = (type: string, orderNum?: number) => {
        const key = type === 'approach_detail' ? `${type}_${orderNum}` : type;

        // まずpreviewSlides（ユーザーが選択したもの）から取得
        const preview = previewSlidesByType.get(key);
        if (preview?.visualIntent) {
          return {
            visualHint: preview.visualHint,
            visualIntent: preview.visualIntent,
            visualReason: preview.visualReason,
            compositeVisual: preview.compositeVisual,
            structurePreset: preview.structurePreset,
            useStructureMode: preview.useStructureMode,
          };
        }

        // なければ既存のproposal.slidesから取得
        const existing = existingSlidesByType.get(key);
        if (existing?.visualIntent) {
          return {
            visualHint: existing.visualHint,
            visualIntent: existing.visualIntent,
            visualReason: existing.visualReason,
            compositeVisual: existing.compositeVisual,
            structurePreset: existing.structurePreset,
            useStructureMode: existing.useStructureMode,
          };
        }

        // どちらもなければデフォルト値を返す（ビジュアル生成のため必須）
        const defaultHint = defaultVisualHintBySlideType[type];
        if (defaultHint) {
          return {
            visualHint: defaultHint.hint,
            visualIntent: defaultHint.intent,
            visualReason: 'スライドタイプに基づくデフォルト推奨',
            compositeVisual: defaultHint.useComposite ? defaultHint.compositeConfig : undefined,
          };
        }

        // 最終的なフォールバック
        return {
          visualHint: 'bullets-only' as VisualHintType,
          visualIntent: 'シンプルな箇条書きで表現',
          visualReason: 'デフォルト設定',
        };
      };

      // 1. エグゼクティブサマリー（現状認識のメインメッセージ）
      slides.push({
        id: `slide-${order + 1}`,
        type: 'executive_summary',
        order: order++,
        title: 'エグゼクティブサマリー',
        mainMessage: editableOutline.currentRecognition.background || '',
        layout: 'title-content',
        content: {
          title: 'エグゼクティブサマリー',
          text: editableOutline.currentRecognition.background || '',
        },
        imageUrl: undefined, // 新しく生成するため画像URLをクリア
        ...getExistingVisualData('executive_summary'),
      });

      // 2. 現状認識スライド
      slides.push({
        id: `slide-${order + 1}`,
        type: 'current_recognition',
        order: order++,
        title: '現状認識',
        mainMessage: editableOutline.currentRecognition.background || '',
        layout: 'title-bullets',
        content: {
          title: '現状認識',
          body: editableOutline.currentRecognition.background || '',
          bullets: [
            ...(editableOutline.currentRecognition.currentProblems.length > 0
              ? ['【直面している問題】', ...editableOutline.currentRecognition.currentProblems]
              : []),
            ...(editableOutline.currentRecognition.rootCauseHypothesis.length > 0
              ? ['【原因仮説】', ...editableOutline.currentRecognition.rootCauseHypothesis]
              : []),
          ],
        },
        imageUrl: undefined, // 新しく生成するため画像URLをクリア
        ...getExistingVisualData('current_recognition'),
      });

      // 3. 課題設定スライド
      if (editableOutline.issueSetting.criticalIssues.length > 0) {
        const mainIssue = editableOutline.issueSetting.criticalIssues[0];
        slides.push({
          id: `slide-${order + 1}`,
          type: 'issue_setting',
          order: order++,
          title: '課題設定',
          mainMessage: `最もクリティカルな課題は「${mainIssue}」である`,
          layout: 'title-bullets',
          content: {
            title: '課題設定',
            bullets: editableOutline.issueSetting.criticalIssues,
          },
          imageUrl: undefined, // 新しく生成するため画像URLをクリア
          ...getExistingVisualData('issue_setting'),
        });
      }

      // 4. ToBe像スライド
      if (editableOutline.toBeVision.vision) {
        slides.push({
          id: `slide-${order + 1}`,
          type: 'tobe_vision',
          order: order++,
          title: 'ToBe像（理想の姿）',
          mainMessage: editableOutline.toBeVision.vision,
          layout: 'title-bullets',
          content: {
            title: 'ToBe像（理想の姿）',
            body: editableOutline.toBeVision.vision,
            bullets: [
              ...(editableOutline.toBeVision.goals.length > 0
                ? ['【具体的なゴール】', ...editableOutline.toBeVision.goals]
                : []),
              ...(editableOutline.toBeVision.projectScope
                ? ['【プロジェクトスコープ】', editableOutline.toBeVision.projectScope]
                : []),
            ],
          },
          imageUrl: undefined, // 新しく生成するため画像URLをクリア
          ...getExistingVisualData('tobe_vision'),
        });
      }

      // 5. アプローチ概要スライド
      if (editableOutline.approach.overview) {
        slides.push({
          id: `slide-${order + 1}`,
          type: 'approach_overview',
          order: order++,
          title: 'アプローチ概要',
          mainMessage: editableOutline.approach.overview,
          layout: 'title-content',
          content: {
            title: 'アプローチ概要',
            text: editableOutline.approach.overview,
          },
          imageUrl: undefined, // 新しく生成するため画像URLをクリア
          ...getExistingVisualData('approach_overview'),
        });
      }

      // 6. アプローチステップスライド（各ステップ）
      editableOutline.approach.steps.forEach((step, idx) => {
        const stepOrder = order++;
        slides.push({
          id: `slide-${stepOrder + 1}`,
          type: 'approach_detail',
          order: stepOrder,
          title: `アプローチ: ${step.title}`,
          mainMessage: step.title,
          layout: 'title-content',
          content: {
            title: `STEP ${idx + 1}: ${step.title}`,
            text: step.description,
          },
          imageUrl: undefined, // 新しく生成するため画像URLをクリア
          ...getExistingVisualData('approach_detail', stepOrder),
        });
      });

      // 各スライドのビジュアル表現意図をAIで分析
      // 既にvisualIntentが設定されているスライドはスキップ
      const slidesNeedingAnalysis = slides.filter(slide => !slide.visualIntent);

      if (slidesNeedingAnalysis.length > 0) {
        console.log(`📝 ${slidesNeedingAnalysis.length} 枚のスライドにビジュアル表現意図を分析中...`);
      } else {
        console.log(`✅ 全てのスライドに既にビジュアル表現意図が設定されています`);
      }

      const slidesWithVisualHints = await Promise.all(
        slides.map(async (slide) => {
          // 既にvisualIntentが設定されている場合はスキップ
          if (slide.visualIntent) {
            console.log(`⏭️  スキップ（既存データ使用）: ${slide.title}`);
            return slide;
          }

          try {
            const response = await fetch('/api/enrich-slide-with-visual-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slide }),
            });

            if (!response.ok) {
              console.warn(`Visual intent analysis failed for slide: ${slide.title}`);
              return {
                ...slide,
                visualHint: 'bullets-only',
                visualIntent: 'シンプルな箇条書きで表現',
                visualReason: '分析に失敗したため、デフォルトの表現を使用',
              };
            }

            const { visualHint, visualIntent, visualReason } = await response.json();
            console.log(`✅ ビジュアル表現意図を生成: ${slide.title} → ${visualHint}`);
            return { ...slide, visualHint, visualIntent, visualReason };
          } catch (error) {
            console.error('Visual intent error:', error);
            return {
              ...slide,
              visualHint: 'bullets-only',
              visualIntent: 'シンプルな箇条書きで表現',
              visualReason: '分析に失敗したため、デフォルトの表現を使用',
            };
          }
        })
      );

      console.log(`✅ ビジュアル表現意図の処理完了`);

      // スライドを proposal に保存（トンマナ設定も含める）
      const updatedProposal = {
        ...proposal,
        outline: editableOutline,
        slides: slidesWithVisualHints,
        settings: updatedSettings,
        updatedAt: Date.now(),
      };

      saveProposal(updatedProposal);
      console.log('✅ トンマナ設定を保存:', updatedSettings.toneManner);
      console.log('✅ カラースキームを保存:', updatedSettings.colors);

      // キャッシュを保存
      saveSlideGenerationCache(id, currentOutlineHash);

      // ドラフト確認へ遷移
      router.push(`/proposal/${id}/draft`);
    } catch (error) {
      console.error('Slide generation error:', error);
      alert('スライドの生成に失敗しました。もう一度お試しください。');
    } finally {
      setGenerating(false);
    }
  };

  // 選択されたスライドのタイプを取得
  const selectedSlide = previewSlides.find(s => s.id === selectedSlideId);
  const selectedSlideType = selectedSlide?.type;

  // スライドタイプに対応する編集セクション
  const getEditSectionForSlideType = (type: string | undefined) => {
    switch (type) {
      case 'executive_summary':
      case 'current_recognition':
        return 'current_recognition';
      case 'issue_setting':
        return 'issue_setting';
      case 'tobe_vision':
        return 'tobe_vision';
      case 'approach_overview':
      case 'approach_detail':
        return 'approach';
      default:
        return null;
    }
  };

  const activeSection = getEditSectionForSlideType(selectedSlideType);

  // セクションごとに変更があるかをチェック
  const isSectionChanged = (section: string): boolean => {
    if (!originalOutline || !editableOutline) return false;

    switch (section) {
      case 'current_recognition':
        return JSON.stringify(editableOutline.currentRecognition) !== JSON.stringify(originalOutline.currentRecognition);
      case 'issue_setting':
        return JSON.stringify(editableOutline.issueSetting) !== JSON.stringify(originalOutline.issueSetting);
      case 'tobe_vision':
        return JSON.stringify(editableOutline.toBeVision) !== JSON.stringify(originalOutline.toBeVision);
      case 'approach':
        return JSON.stringify(editableOutline.approach) !== JSON.stringify(originalOutline.approach);
      default:
        return false;
    }
  };

  // セクションごとにリセット
  const resetSection = (section: string) => {
    if (!originalOutline || !editableOutline) return;

    switch (section) {
      case 'current_recognition':
        setEditableOutline({
          ...editableOutline,
          currentRecognition: JSON.parse(JSON.stringify(originalOutline.currentRecognition)),
        });
        break;
      case 'issue_setting':
        setEditableOutline({
          ...editableOutline,
          issueSetting: JSON.parse(JSON.stringify(originalOutline.issueSetting)),
        });
        break;
      case 'tobe_vision':
        setEditableOutline({
          ...editableOutline,
          toBeVision: JSON.parse(JSON.stringify(originalOutline.toBeVision)),
        });
        break;
      case 'approach':
        setEditableOutline({
          ...editableOutline,
          approach: JSON.parse(JSON.stringify(originalOutline.approach)),
        });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-black tracking-wide">ステップ2: 言語化された骨子の確認</h1>
              <p className="text-xs text-gray-500 tracking-wide">
                {proposal.title} - {proposal.clientName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* 変更状態の表示 */}
              {hasUnsavedChanges && (
                <span className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded">
                  自動保存済み
                </span>
              )}
              <Button
                onClick={() => router.push(`/proposal/${id}/chat`)}
                variant="outline"
                disabled={generating}
              >
                <span className="flex items-center gap-1">
                  <span>🤖</span>
                  <span>AIに相談</span>
                </span>
              </Button>
              <Button
                onClick={handleOptimizeVisual}
                variant="outline"
                disabled={generating || isOptimizingVisual || previewSlides.length === 0}
              >
                <span className="flex items-center gap-1">
                  {isOptimizingVisual ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span>最適化中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>{visualOptimizationDone ? 'ビジュアル再最適化' : 'ビジュアル最適化'}</span>
                    </>
                  )}
                </span>
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="outline"
                disabled={generating || previewSlides.length === 0}
              >
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>他AIへ出力</span>
                </span>
              </Button>
              <Button onClick={handleNextStep} disabled={generating}>
                {generating ? 'スライドを生成中...' : '次へ: ドラフト確認 →'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ステップインジケーター */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <StepIndicator proposalId={id} currentStep={2} />
      </div>

      {/* メインコンテンツ: 左右分割 */}
      <div className="max-w-7xl mx-auto px-6 pb-4">
        <div className="flex gap-6" style={{ height: 'calc(100vh - 280px)' }}>
          {/* 左側: ツリービュー */}
          <div className="w-[320px] shrink-0 flex flex-col min-h-0">
            <SlideTreeView
              slides={previewSlides}
              onReorder={handleReorderSlides}
              onDelete={handleDeleteSlide}
              onAddSlide={handleAddSlide}
              onEditSlideTitle={handleEditSlideTitle}
              selectedSlideId={selectedSlideId || undefined}
              onSelectSlide={setSelectedSlideId}
            />
          </div>

          {/* 右側: 詳細編集エリア（フル高さ） */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* 詳細編集エリア */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg min-h-0">
            {!selectedSlideId ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-gray-400">← 左のツリーからスライドを選択してください</p>
              </div>
            ) : (
              <div className="p-5">
                {/* 選択スライドのヘッダー */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {selectedSlide?.type === 'executive_summary' && 'エグゼクティブサマリー'}
                        {selectedSlide?.type === 'current_recognition' && '現状認識'}
                        {selectedSlide?.type === 'issue_setting' && '課題設定'}
                        {selectedSlide?.type === 'tobe_vision' && 'ToBe像'}
                        {selectedSlide?.type === 'approach_overview' && 'アプローチ概要'}
                        {selectedSlide?.type === 'approach_detail' && 'アプローチ詳細'}
                        {selectedSlide?.type === 'schedule' && 'スケジュール'}
                        {selectedSlide?.type === 'team' && '体制・メンバー'}
                        {selectedSlide?.type === 'meeting_structure' && '会議体'}
                        {selectedSlide?.type === 'estimate' && '見積り'}
                        {/* その他のタイプはタイトルから表示 */}
                        {!['executive_summary', 'current_recognition', 'issue_setting', 'tobe_vision', 'approach_overview', 'approach_detail', 'schedule', 'team', 'meeting_structure', 'estimate'].includes(selectedSlide?.type || '') && selectedSlide?.title}
                      </span>
                      <span className="text-xs text-gray-400">スライド {(selectedSlide?.order || 0) + 1}</span>
                    </div>
                    {/* セクションごとのリセットボタン */}
                    {activeSection && isSectionChanged(activeSection) && (
                      <button
                        onClick={() => {
                          if (confirm('このセクションの編集内容を元に戻しますか？')) {
                            resetSection(activeSection);
                          }
                        }}
                        className="text-[10px] text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        元に戻す
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedSlide?.type === 'executive_summary' && '提案全体のサマリーを1枚で伝えるスライド'}
                    {selectedSlide?.type === 'current_recognition' && 'クライアントの現状と課題の背景を説明するスライド'}
                    {selectedSlide?.type === 'issue_setting' && '解決すべきクリティカルな課題を定義するスライド'}
                    {selectedSlide?.type === 'tobe_vision' && '目指すべき理想の姿を描くスライド'}
                    {selectedSlide?.type === 'approach_overview' && 'アプローチ全体像を説明するスライド'}
                    {selectedSlide?.type === 'approach_detail' && '各ステップの詳細を説明するスライド'}
                    {selectedSlide?.type === 'schedule' && 'プロジェクトのスケジュールを説明するスライド'}
                    {selectedSlide?.type === 'team' && 'プロジェクト体制やメンバーを紹介するスライド'}
                    {selectedSlide?.type === 'meeting_structure' && 'コミュニケーション体制を説明するスライド'}
                    {selectedSlide?.type === 'estimate' && '見積りや費用を説明するスライド'}
                    {/* その他のタイプは汎用説明 */}
                    {!['executive_summary', 'current_recognition', 'issue_setting', 'tobe_vision', 'approach_overview', 'approach_detail', 'schedule', 'team', 'meeting_structure', 'estimate'].includes(selectedSlide?.type || '') && 'スライドの内容を編集できます'}
                  </p>
                </div>

                {/* 現状認識の編集 */}
                {(activeSection === 'current_recognition') && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        メッセージライン
                        <span className="text-gray-400 ml-2">（このスライドで伝えたい一番のポイント）</span>
                      </label>
                      <textarea
                        value={editableOutline.currentRecognition.background || ''}
                        onChange={(e) => setEditableOutline({
                          ...editableOutline,
                          currentRecognition: {
                            ...editableOutline.currentRecognition,
                            background: e.target.value,
                          },
                        })}
                        className="w-full px-3 py-2 border border-gray-300 text-sm tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent rounded"
                        rows={3}
                        placeholder="例: 〇〇業界では△△の変化により、従来のビジネスモデルが限界を迎えている"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">直面している問題</label>
                        {editableOutline.currentRecognition.currentProblems.length > 0 ? (
                          <div className="space-y-1">
                            {editableOutline.currentRecognition.currentProblems.map((problem, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={problem}
                                onChange={(e) => {
                                  const newProblems = [...editableOutline.currentRecognition.currentProblems];
                                  newProblems[idx] = e.target.value;
                                  setEditableOutline({
                                    ...editableOutline,
                                    currentRecognition: {
                                      ...editableOutline.currentRecognition,
                                      currentProblems: newProblems,
                                    },
                                  });
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic py-2">AI対話から自動抽出</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">原因仮説</label>
                        {editableOutline.currentRecognition.rootCauseHypothesis.length > 0 ? (
                          <div className="space-y-1">
                            {editableOutline.currentRecognition.rootCauseHypothesis.map((cause, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={cause}
                                onChange={(e) => {
                                  const newCauses = [...editableOutline.currentRecognition.rootCauseHypothesis];
                                  newCauses[idx] = e.target.value;
                                  setEditableOutline({
                                    ...editableOutline,
                                    currentRecognition: {
                                      ...editableOutline.currentRecognition,
                                      rootCauseHypothesis: newCauses,
                                    },
                                  });
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic py-2">AI対話から自動抽出</p>
                        )}
                      </div>
                    </div>

                    {/* WHY構造（SCR） */}
                    {editableOutline.currentRecognition.narrativeStructure && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                          <span>💡</span> なぜこのメッセージか（SCR構造）
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-amber-700">状況 (S):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.currentRecognition.narrativeStructure.situation}</p>
                          </div>
                          <div>
                            <span className="font-medium text-amber-700">複雑化 (C):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.currentRecognition.narrativeStructure.complication}</p>
                          </div>
                          <div>
                            <span className="font-medium text-amber-700">解決 (R):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.currentRecognition.narrativeStructure.resolution}</p>
                          </div>
                          <div className="pt-2 border-t border-amber-200">
                            <span className="font-medium text-amber-700">なぜ重要か:</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.currentRecognition.narrativeStructure.whyThisMatters}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 課題設定の編集 */}
                {activeSection === 'issue_setting' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        最もクリティカルな課題
                        <span className="text-gray-400 ml-2">（メッセージラインの核となる課題）</span>
                      </label>
                      <textarea
                        value={editableOutline.issueSetting.criticalIssues[0] || ''}
                        onChange={(e) => {
                          const newCriticalIssues = [...editableOutline.issueSetting.criticalIssues];
                          if (newCriticalIssues.length > 0) {
                            newCriticalIssues[0] = e.target.value;
                          } else {
                            newCriticalIssues.push(e.target.value);
                          }
                          setEditableOutline({
                            ...editableOutline,
                            issueSetting: {
                              ...editableOutline.issueSetting,
                              criticalIssues: newCriticalIssues,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 text-sm tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent rounded"
                        rows={2}
                        placeholder="例: AI活用の組織能力（スキル・知見）が不足している"
                      />
                      {editableOutline.issueSetting.criticalIssues[0] && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          → メッセージライン: 最もクリティカルな課題は「{editableOutline.issueSetting.criticalIssues[0]}」である
                        </p>
                      )}
                    </div>
                    {/* その他の課題（2番目以降） */}
                    {editableOutline.issueSetting.criticalIssues.length > 1 && (
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">その他の課題</label>
                        <div className="space-y-1">
                          {editableOutline.issueSetting.criticalIssues.slice(1).map((issue, idx) => (
                            <div key={idx + 1} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-6">{idx + 2}.</span>
                              <input
                                type="text"
                                value={issue}
                                onChange={(e) => {
                                  const newIssues = [...editableOutline.issueSetting.criticalIssues];
                                  newIssues[idx + 1] = e.target.value;
                                  setEditableOutline({
                                    ...editableOutline,
                                    issueSetting: {
                                      ...editableOutline.issueSetting,
                                      criticalIssues: newIssues,
                                    },
                                  });
                                }}
                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-sm rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* WHY構造（SCR） */}
                    {editableOutline.issueSetting.narrativeStructure && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                          <span>💡</span> なぜこの課題設定か（SCR構造）
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-amber-700">状況 (S):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.issueSetting.narrativeStructure.situation}</p>
                          </div>
                          <div>
                            <span className="font-medium text-amber-700">複雑化 (C):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.issueSetting.narrativeStructure.complication}</p>
                          </div>
                          <div>
                            <span className="font-medium text-amber-700">解決 (R):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.issueSetting.narrativeStructure.resolution}</p>
                          </div>
                          <div className="pt-2 border-t border-amber-200">
                            <span className="font-medium text-amber-700">なぜ重要か:</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.issueSetting.narrativeStructure.whyThisMatters}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ToBe像の編集 */}
                {activeSection === 'tobe_vision' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        目指す姿（ビジョン）
                        <span className="text-gray-400 ml-2">（このプロジェクトで実現したい理想の状態）</span>
                      </label>
                      <textarea
                        value={editableOutline.toBeVision.vision || ''}
                        onChange={(e) => setEditableOutline({
                          ...editableOutline,
                          toBeVision: {
                            ...editableOutline.toBeVision,
                            vision: e.target.value,
                          },
                        })}
                        className="w-full px-3 py-2 border border-gray-300 text-sm tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent rounded"
                        rows={2}
                        placeholder="例: 全社員がAIを日常業務で活用し、生産性30%向上を実現する"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">具体的なゴール</label>
                        {editableOutline.toBeVision.goals.length > 0 ? (
                          <div className="space-y-1">
                            {editableOutline.toBeVision.goals.map((goal, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={goal}
                                onChange={(e) => {
                                  const newGoals = [...editableOutline.toBeVision.goals];
                                  newGoals[idx] = e.target.value;
                                  setEditableOutline({
                                    ...editableOutline,
                                    toBeVision: {
                                      ...editableOutline.toBeVision,
                                      goals: newGoals,
                                    },
                                  });
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic py-2">AI対話から自動抽出</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">プロジェクトスコープ</label>
                        <textarea
                          value={editableOutline.toBeVision.projectScope || ''}
                          onChange={(e) => setEditableOutline({
                            ...editableOutline,
                            toBeVision: {
                              ...editableOutline.toBeVision,
                              projectScope: e.target.value,
                            },
                          })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-sm resize-none rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                          rows={3}
                          placeholder="スコープを記載"
                        />
                      </div>
                    </div>

                    {/* WHY構造（SCR） */}
                    {editableOutline.toBeVision.narrativeStructure && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                          <span>💡</span> なぜこのToBe像か（SCR構造）
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-amber-700">状況 (S):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.toBeVision.narrativeStructure.situation}</p>
                          </div>
                          <div>
                            <span className="font-medium text-amber-700">複雑化 (C):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.toBeVision.narrativeStructure.complication}</p>
                          </div>
                          <div>
                            <span className="font-medium text-amber-700">解決 (R):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.toBeVision.narrativeStructure.resolution}</p>
                          </div>
                          <div className="pt-2 border-t border-amber-200">
                            <span className="font-medium text-amber-700">なぜ重要か:</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.toBeVision.narrativeStructure.whyThisMatters}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* アプローチの編集 */}
                {activeSection === 'approach' && (
                  <div className="space-y-4">
                    {/* approach_overview の場合 */}
                    {selectedSlide?.type === 'approach_overview' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          アプローチ概要
                          <span className="text-gray-400 ml-2">（どのような進め方で課題を解決するか）</span>
                        </label>
                        <textarea
                          value={editableOutline.approach.overview || ''}
                          onChange={(e) => setEditableOutline({
                            ...editableOutline,
                            approach: {
                              ...editableOutline.approach,
                              overview: e.target.value,
                            },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 text-sm tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent rounded"
                          rows={2}
                          placeholder="例: 3フェーズ・6ヶ月のアプローチで、段階的にAI活用を浸透させる"
                        />
                      </div>
                    )}
                    {/* approach_detail の場合 */}
                    {selectedSlide?.type === 'approach_detail' && (() => {
                      // このスライドに対応するstepを見つける
                      const stepMatch = selectedSlide.content?.title?.match(/STEP (\d+)/);
                      const stepNum = stepMatch ? parseInt(stepMatch[1], 10) - 1 : -1;
                      const step = stepNum >= 0 && stepNum < editableOutline.approach.steps.length
                        ? editableOutline.approach.steps[stepNum]
                        : null;
                      if (!step) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded font-medium">STEP {stepNum + 1}</span>
                            <span className="text-xs text-gray-500">アプローチ詳細</span>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">ステップ名</label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => {
                                const newSteps = [...editableOutline.approach.steps];
                                newSteps[stepNum] = { ...step, title: e.target.value };
                                setEditableOutline({
                                  ...editableOutline,
                                  approach: {
                                    ...editableOutline.approach,
                                    steps: newSteps,
                                  },
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                              placeholder="ステップ名"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">説明</label>
                            <textarea
                              value={step.description}
                              onChange={(e) => {
                                const newSteps = [...editableOutline.approach.steps];
                                newSteps[stepNum] = { ...step, description: e.target.value };
                                setEditableOutline({
                                  ...editableOutline,
                                  approach: {
                                    ...editableOutline.approach,
                                    steps: newSteps,
                                  },
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 text-sm rounded resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                              rows={3}
                              placeholder="このステップで何を行うか説明"
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* WHY構造（SCR） - アプローチセクション */}
                    {editableOutline.approach.narrativeStructure && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                          <span>💡</span> なぜこのアプローチか（SCR構造）
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium text-amber-700">状況 (S):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.approach.narrativeStructure.situation}</p>
                          </div>
                          <div>
                            <span className="font-medium text-amber-700">複雑化 (C):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.approach.narrativeStructure.complication}</p>
                          </div>
                          <div>
                            <span className="font-medium text-amber-700">解決 (R):</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.approach.narrativeStructure.resolution}</p>
                          </div>
                          <div className="pt-2 border-t border-amber-200">
                            <span className="font-medium text-amber-700">なぜ重要か:</span>
                            <p className="text-gray-700 mt-0.5">{editableOutline.approach.narrativeStructure.whyThisMatters}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 汎用スライドコンテンツ表示（activeSection がない場合） */}
                {!activeSection && selectedSlide && (
                  <div className="space-y-4">
                    {/* スライドタイトル */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        スライドタイトル
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.title || ''}
                        onChange={(e) => {
                          setPreviewSlides(prev => prev.map(s =>
                            s.id === selectedSlideId
                              ? { ...s, title: e.target.value }
                              : s
                          ));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="スライドのタイトル"
                      />
                    </div>

                    {/* メインメッセージ */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        メインメッセージ
                        <span className="text-gray-400 ml-2">（このスライドで伝えたいこと）</span>
                      </label>
                      <textarea
                        value={selectedSlide.mainMessage || ''}
                        onChange={(e) => {
                          setPreviewSlides(prev => prev.map(s =>
                            s.id === selectedSlideId
                              ? { ...s, mainMessage: e.target.value }
                              : s
                          ));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 text-sm tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent rounded"
                        rows={2}
                        placeholder="このスライドで伝えたいメッセージ"
                      />
                    </div>

                    {/* コンテンツ本文 */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        コンテンツ
                        <span className="text-gray-400 ml-2">（詳細な内容・箇条書き）</span>
                      </label>
                      <textarea
                        value={selectedSlide.content?.body || selectedSlide.content?.text || selectedSlide.content?.bullets?.join('\n') || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const lines = newValue.split('\n').filter(line => line.trim());
                          setPreviewSlides(prev => prev.map(s =>
                            s.id === selectedSlideId
                              ? {
                                  ...s,
                                  content: {
                                    ...s.content,
                                    body: newValue,
                                    text: newValue,
                                    bullets: lines.length > 0 ? lines : ['内容を編集してください'],
                                  },
                                }
                              : s
                          ));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 text-sm tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent rounded"
                        rows={6}
                        placeholder="スライドの詳細内容を入力&#10;（改行で箇条書きに変換されます）"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        ※ 改行ごとに箇条書きとして表示されます
                      </p>
                    </div>

                    {/* メッセージの論理的根拠（messageRationale） */}
                    {(() => {
                      // slideStructureProposalから対応するスライドのmessageRationaleを取得
                      const slideIndex = selectedSlide.order;
                      const proposalItem = editableOutline.slideStructureProposal?.[slideIndex];
                      const rationale = proposalItem?.messageRationale;
                      if (!rationale) return null;
                      return (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                            <span>🎯</span> なぜこのメッセージか（論理的根拠）
                          </h4>
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="font-medium text-blue-700">WHY:</span>
                              <p className="text-gray-700 mt-0.5">{rationale.why}</p>
                            </div>
                            {rationale.logicalBasis && rationale.logicalBasis.length > 0 && (
                              <div>
                                <span className="font-medium text-blue-700">論理的根拠:</span>
                                <ul className="mt-0.5 space-y-0.5">
                                  {rationale.logicalBasis.map((basis, i) => (
                                    <li key={i} className="text-gray-700 pl-2 flex items-start gap-1">
                                      <span className="text-blue-400">•</span>
                                      <span>{basis}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-blue-700">聴衆への洞察:</span>
                              <p className="text-gray-700 mt-0.5">{rationale.audienceInsight}</p>
                            </div>
                            {(rationale.connectionToPrevious || rationale.connectionToNext) && (
                              <div className="pt-2 border-t border-blue-200 flex gap-4">
                                {rationale.connectionToPrevious && (
                                  <div className="flex-1">
                                    <span className="font-medium text-blue-700 text-[10px]">← 前スライドから:</span>
                                    <p className="text-gray-600 text-[10px] mt-0.5">{rationale.connectionToPrevious}</p>
                                  </div>
                                )}
                                {rationale.connectionToNext && (
                                  <div className="flex-1">
                                    <span className="font-medium text-blue-700 text-[10px]">次スライドへ →:</span>
                                    <p className="text-gray-600 text-[10px] mt-0.5">{rationale.connectionToNext}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ビジュアル表現（下部に配置） */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {(() => {
                    // デフォルト推奨を取得
                    const defaultHint = selectedSlide?.type ? defaultVisualHintBySlideType[selectedSlide.type] : null;
                    const defaultHintLabel = defaultHint
                      ? visualHintOptions.find(o => o.value === defaultHint.hint)?.label || defaultHint.hint
                      : null;
                    const currentHintLabel = selectedSlide?.visualHint
                      ? visualHintOptions.find(o => o.value === selectedSlide.visualHint)?.label || selectedSlide.visualHint
                      : null;
                    const isModified = defaultHint && selectedSlide?.visualHint !== defaultHint.hint;

                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-xs font-medium text-gray-600">ビジュアル表現</label>
                          {currentHintLabel && (
                            <span className={`text-[10px] px-2 py-0.5 rounded ${
                              isModified
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isModified ? '変更済: ' : ''}{currentHintLabel}
                            </span>
                          )}
                        </div>

                        {/* デフォルト推奨の表示（常に表示） */}
                        {defaultHint && (
                          <div className={`mb-3 p-2 rounded border ${
                            isModified
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">デフォルト推奨: </span>
                                  <span className={isModified ? 'text-gray-500' : 'text-yellow-800 font-medium'}>
                                    {defaultHintLabel}
                                  </span>
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{defaultHint.intent}</p>
                              </div>
                              {isModified && (
                                <button
                                  onClick={() => {
                                    setPreviewSlides(prev => prev.map(s =>
                                      s.id === selectedSlideId
                                        ? { ...s, visualHint: defaultHint.hint, visualIntent: defaultHint.intent }
                                        : s
                                    ));
                                  }}
                                  className="ml-2 px-2 py-1 text-[10px] bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors shrink-0"
                                >
                                  推奨に戻す
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 現在の設定が変更されている場合の表示 */}
                        {isModified && selectedSlide?.visualIntent && (
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-700">
                              <span className="font-medium">現在の設定: </span>
                              {selectedSlide.visualIntent}
                            </p>
                          </div>
                        )}

                        {/* ビジュアル表現選択UI */}
                        <details className="group" open>
                          <summary className="text-[11px] text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            表現を変更する
                          </summary>
                          <div className="mt-3 space-y-4 max-h-[400px] overflow-y-auto">
                            {/* 単一表現 / 複合表現の切り替え */}
                            <div className="flex items-center gap-2 mb-3">
                              <button
                                onClick={() => {
                                  setShowCompositeMode(false);
                                  // 複合表現を解除
                                  if (selectedSlide?.compositeVisual?.enabled) {
                                    setPreviewSlides(prev => prev.map(s =>
                                      s.id === selectedSlideId
                                        ? { ...s, compositeVisual: undefined }
                                        : s
                                    ));
                                  }
                                }}
                                className={`px-3 py-1.5 text-[10px] rounded-full border transition-all ${
                                  !showCompositeMode
                                    ? 'bg-gray-800 text-white border-gray-800'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                単一表現
                              </button>
                              <button
                                onClick={() => setShowCompositeMode(true)}
                                className={`px-3 py-1.5 text-[10px] rounded-full border transition-all ${
                                  showCompositeMode
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                🔗 複合表現（2つの表現を組み合わせ）
                              </button>
                            </div>

                            {/* 複合表現モード */}
                            {showCompositeMode && (
                              <div className="space-y-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-[10px] text-purple-700 font-medium">
                                  💡 2つの表現を組み合わせて、より豊かなメッセージを伝えます
                                </p>

                                {/* プリセット選択 */}
                                <div>
                                  <p className="text-[10px] text-gray-600 mb-2 font-medium">おすすめプリセット</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {compositePresets.map((preset) => {
                                      const isSelected = selectedCompositePresetId === preset.id;
                                      const primaryOpt = visualHintOptions.find(o => o.value === preset.primary);
                                      const secondaryOpt = visualHintOptions.find(o => o.value === preset.secondary);
                                      return (
                                        <button
                                          key={preset.id}
                                          onClick={() => {
                                            setSelectedCompositePresetId(preset.id);
                                            setPreviewSlides(prev => prev.map(s =>
                                              s.id === selectedSlideId
                                                ? {
                                                    ...s,
                                                    compositeVisual: {
                                                      enabled: true,
                                                      primaryPattern: preset.primary,
                                                      secondaryPattern: preset.secondary,
                                                      layoutType: preset.defaultLayout,
                                                      relationDescription: preset.description,
                                                    },
                                                    visualHint: preset.primary,
                                                    visualIntent: `${preset.name}: ${preset.description}`,
                                                  }
                                                : s
                                            ));
                                          }}
                                          className={`flex flex-col p-2 rounded-lg border-2 transition-all text-left ${
                                            isSelected
                                              ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-200'
                                              : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1 mb-1">
                                            <span className="text-base">{preset.icon}</span>
                                            <span className={`text-[10px] font-medium ${isSelected ? 'text-purple-800' : 'text-gray-700'}`}>
                                              {preset.name}
                                            </span>
                                          </div>
                                          <span className="text-[8px] text-gray-500 leading-tight">
                                            {primaryOpt?.label} + {secondaryOpt?.label}
                                          </span>
                                          <span className="text-[8px] text-gray-400 mt-0.5">
                                            {preset.useCase}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* カスタム複合表現（詳細設定） */}
                                <details className="border-t border-purple-200 pt-3">
                                  <summary className="text-[10px] text-purple-600 cursor-pointer hover:text-purple-800">
                                    ▶ カスタム設定（表現を個別に選択）
                                  </summary>
                                  <div className="mt-3 space-y-3">
                                    {/* 主表現選択 */}
                                    <div>
                                      <label className="text-[9px] text-gray-500 mb-1 block">主表現（メイン）</label>
                                      <select
                                        value={selectedSlide?.compositeVisual?.primaryPattern || selectedSlide?.visualHint || ''}
                                        onChange={(e) => {
                                          const value = e.target.value as VisualHintType;
                                          setPreviewSlides(prev => prev.map(s =>
                                            s.id === selectedSlideId
                                              ? {
                                                  ...s,
                                                  compositeVisual: {
                                                    ...s.compositeVisual,
                                                    enabled: true,
                                                    primaryPattern: value,
                                                    secondaryPattern: s.compositeVisual?.secondaryPattern || 'bullets-only',
                                                    layoutType: s.compositeVisual?.layoutType || 'left-right',
                                                  },
                                                  visualHint: value,
                                                }
                                              : s
                                          ));
                                          setSelectedCompositePresetId(null);
                                        }}
                                        className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded bg-white"
                                      >
                                        {visualHintCategories.map(cat => (
                                          <optgroup key={cat.name} label={cat.name}>
                                            {cat.options.map(opt => (
                                              <option key={opt.value} value={opt.value}>
                                                {opt.icon} {opt.label}
                                              </option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                    </div>

                                    {/* 補助表現選択 */}
                                    <div>
                                      <label className="text-[9px] text-gray-500 mb-1 block">補助表現（サブ）</label>
                                      <select
                                        value={selectedSlide?.compositeVisual?.secondaryPattern || ''}
                                        onChange={(e) => {
                                          const value = e.target.value as VisualHintType;
                                          setPreviewSlides(prev => prev.map(s =>
                                            s.id === selectedSlideId
                                              ? {
                                                  ...s,
                                                  compositeVisual: {
                                                    ...s.compositeVisual,
                                                    enabled: true,
                                                    primaryPattern: s.compositeVisual?.primaryPattern || s.visualHint || 'bullets-only',
                                                    secondaryPattern: value,
                                                    layoutType: s.compositeVisual?.layoutType || 'left-right',
                                                  },
                                                }
                                              : s
                                          ));
                                          setSelectedCompositePresetId(null);
                                        }}
                                        className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded bg-white"
                                      >
                                        {visualHintCategories.map(cat => (
                                          <optgroup key={cat.name} label={cat.name}>
                                            {cat.options.map(opt => (
                                              <option key={opt.value} value={opt.value}>
                                                {opt.icon} {opt.label}
                                              </option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                    </div>

                                    {/* レイアウト配置選択 */}
                                    <div>
                                      <label className="text-[9px] text-gray-500 mb-1 block">配置パターン</label>
                                      <div className="grid grid-cols-3 gap-1">
                                        {([
                                          { value: 'left-right', label: '左右', icon: '◧' },
                                          { value: 'right-left', label: '右左', icon: '◨' },
                                          { value: 'top-bottom', label: '上下', icon: '⬒' },
                                          { value: 'bottom-top', label: '下上', icon: '⬓' },
                                          { value: 'main-inset', label: 'インセット', icon: '◫' },
                                          { value: 'side-by-side', label: '均等', icon: '▥' },
                                        ] as const).map((layout) => (
                                          <button
                                            key={layout.value}
                                            onClick={() => {
                                              setPreviewSlides(prev => prev.map(s =>
                                                s.id === selectedSlideId && s.compositeVisual
                                                  ? {
                                                      ...s,
                                                      compositeVisual: {
                                                        ...s.compositeVisual,
                                                        layoutType: layout.value,
                                                      },
                                                    }
                                                  : s
                                              ));
                                              setSelectedCompositePresetId(null);
                                            }}
                                            className={`flex flex-col items-center p-1.5 rounded border transition-all ${
                                              selectedSlide?.compositeVisual?.layoutType === layout.value
                                                ? 'bg-purple-100 border-purple-400'
                                                : 'bg-white border-gray-200 hover:border-purple-300'
                                            }`}
                                          >
                                            <span className="text-sm">{layout.icon}</span>
                                            <span className="text-[8px] text-gray-600">{layout.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </details>

                                {/* 現在の複合表現プレビュー */}
                                {selectedSlide?.compositeVisual?.enabled && (
                                  <div className="mt-3 p-2 bg-white rounded border border-purple-300">
                                    <p className="text-[9px] text-purple-700 font-medium mb-1">選択中の複合表現:</p>
                                    <div className="flex items-center gap-2 text-[10px]">
                                      <span className="px-2 py-0.5 bg-purple-100 rounded">
                                        {visualHintOptions.find(o => o.value === selectedSlide.compositeVisual?.primaryPattern)?.label || '未選択'}
                                      </span>
                                      <span className="text-gray-400">+</span>
                                      <span className="px-2 py-0.5 bg-purple-100 rounded">
                                        {visualHintOptions.find(o => o.value === selectedSlide.compositeVisual?.secondaryPattern)?.label || '未選択'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 単一表現モード：全パターンを表示 */}
                            {!showCompositeMode && (
                            <details className="border-t border-gray-200 pt-3">
                              <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600">
                                ▶ 全てのパターンを表示（従来のカテゴリ別）
                              </summary>
                              <div className="mt-3 space-y-3">
                                {visualHintCategories.map((category) => (
                                  <div key={category.name}>
                                    <p className="text-[9px] text-gray-400 mb-1 font-medium">{category.name}</p>
                                    <div className="grid grid-cols-4 gap-1">
                                      {category.options.map((opt) => {
                                        const isSelected = selectedSlide?.visualHint === opt.value;
                                        return (
                                          <button
                                            key={opt.value}
                                            onClick={() => {
                                              setPreviewSlides(prev => prev.map(s =>
                                                s.id === selectedSlideId
                                                  ? { ...s, visualHint: opt.value, visualIntent: opt.description, visualReason: 'ユーザーが手動で選択' }
                                                  : s
                                              ));
                                            }}
                                            className={`flex flex-col items-center p-1.5 rounded border transition-all ${
                                              isSelected
                                                ? 'bg-yellow-50 border-yellow-400'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                            title={opt.description}
                                          >
                                            <VisualPatternPreview
                                              pattern={opt.value}
                                              size="sm"
                                              showLabel={false}
                                            />
                                            <span className="text-[8px] mt-0.5 text-gray-500 truncate w-full text-center">
                                              {opt.label}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                            )}
                          </div>
                        </details>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* フッター: トンマナ設定パネル */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <details className="group">
            <summary className="py-2 cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-medium text-gray-700">トンマナ設定</h3>
                {/* 現在の設定サマリー */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: colorScheme.primary }} />
                    <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: colorScheme.secondary }} />
                    <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: colorScheme.accent }} />
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {toneManner.writingStyle === 'polite' ? 'ですます調' : toneManner.writingStyle === 'casual' ? 'である調' : '体言止め'}
                  </span>
                </div>
              </div>
              <span className="text-gray-400 text-[10px] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="pb-3 pt-1">
              <div className="flex gap-6">
                {/* 左側: 文体・フォーマル度・箇条書き */}
                <div className="flex gap-4">
                  <div className="w-28">
                    <label className="text-[10px] text-gray-500 mb-0.5 block">文体</label>
                    <select
                      value={toneManner.writingStyle}
                      onChange={(e) => setToneManner({ ...toneManner, writingStyle: e.target.value as ToneManner['writingStyle'] })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                    >
                      <option value="polite">ですます調</option>
                      <option value="casual">である調</option>
                      <option value="noun-ending">体言止め</option>
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="text-[10px] text-gray-500 mb-0.5 block">フォーマル度</label>
                    <select
                      value={toneManner.formality}
                      onChange={(e) => setToneManner({ ...toneManner, formality: e.target.value as ToneManner['formality'] })}
                      className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                    >
                      <option value="formal">フォーマル</option>
                      <option value="semi-formal">セミフォーマル</option>
                      <option value="casual">カジュアル</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-gray-500 mb-0.5 block">箇条書き</label>
                    <div className="flex gap-1">
                      {[
                        { value: 'dash', label: '-' },
                        { value: 'circle', label: '●' },
                        { value: 'number', label: '1.' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setToneManner({ ...toneManner, bulletStyle: opt.value as ToneManner['bulletStyle'] })}
                          className={`flex-1 px-1.5 py-1 text-[11px] rounded border transition-colors ${
                            toneManner.bulletStyle === opt.value
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 中央: カラースキーム */}
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 mb-0.5 block">カラースキーム</label>
                  <div className="flex flex-wrap gap-1.5">
                    {colorPresets.map((preset) => {
                      const isSelected =
                        !isCustomColorMode &&
                        colorScheme.primary === preset.colors.primary &&
                        colorScheme.secondary === preset.colors.secondary &&
                        colorScheme.accent === preset.colors.accent;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setColorScheme(preset.colors);
                            setIsCustomColorMode(false);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                            isSelected
                              ? 'bg-white border-gray-400 ring-1 ring-gray-400'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                          title={preset.name}
                        >
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: preset.colors.primary }} />
                            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: preset.colors.secondary }} />
                            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: preset.colors.accent }} />
                          </div>
                          <span className="text-[10px] text-gray-600">{preset.name}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setIsCustomColorMode(true)}
                      className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                        isCustomColorMode
                          ? 'bg-white border-gray-400 ring-1 ring-gray-400'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                      title="カスタム"
                    >
                      <div className="flex gap-0.5">
                        <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: isCustomColorMode ? colorScheme.primary : '#888' }} />
                        <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: isCustomColorMode ? colorScheme.secondary : '#aaa' }} />
                        <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: isCustomColorMode ? colorScheme.accent : '#ccc' }} />
                      </div>
                      <span className="text-[10px] text-gray-600">カスタム</span>
                    </button>
                    {isCustomColorMode && (
                      <div className="flex items-center gap-2 ml-2">
                        <div className="flex items-center gap-1">
                          <input type="color" value={colorScheme.primary} onChange={(e) => setColorScheme({ ...colorScheme, primary: e.target.value })} className="w-5 h-5 rounded cursor-pointer border border-gray-300" />
                        </div>
                        <div className="flex items-center gap-1">
                          <input type="color" value={colorScheme.secondary} onChange={(e) => setColorScheme({ ...colorScheme, secondary: e.target.value })} className="w-5 h-5 rounded cursor-pointer border border-gray-300" />
                        </div>
                        <div className="flex items-center gap-1">
                          <input type="color" value={colorScheme.accent} onChange={(e) => setColorScheme({ ...colorScheme, accent: e.target.value })} className="w-5 h-5 rounded cursor-pointer border border-gray-300" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 右側: サンプルスライドから抽出 */}
                <div className="w-40">
                  <label className="text-[10px] text-gray-500 mb-0.5 block">サンプルから抽出</label>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsAnalyzingSlide(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const response = await fetch('/api/analyze-slide-tone', { method: 'POST', body: formData });
                          if (!response.ok) throw new Error('Analysis failed');
                          const { extractedStyle } = await response.json();
                          setExtractedStyles((prev) => [extractedStyle, ...prev.slice(0, 2)]);
                        } catch (error) {
                          console.error('Slide analysis error:', error);
                          alert('スライドの分析に失敗しました');
                        } finally {
                          setIsAnalyzingSlide(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] rounded border cursor-pointer transition-colors ${
                      isAnalyzingSlide ? 'bg-gray-100 border-gray-300 text-gray-400' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                      {isAnalyzingSlide ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          分析中...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          画像を選択
                        </>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* 抽出されたスタイル一覧（展開時のみ表示） */}
              {extractedStyles.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {extractedStyles.map((style, index) => (
                    <div
                      key={index}
                      className="flex-1 p-2 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => {
                        setColorScheme(style.colors);
                        setToneManner({
                          ...toneManner,
                          writingStyle: style.toneManner.writingStyle,
                          formality: style.toneManner.formality,
                          bulletStyle: style.toneManner.bulletStyle,
                        });
                        const fontRec = style.font.recommendation.toLowerCase();
                        let selectedFont: FontOption;
                        if (fontRec.includes('明朝') || fontRec.includes('serif')) {
                          selectedFont = fontOptions.find(f => f.family.includes('Serif')) || fontOptions[0];
                        } else {
                          selectedFont = fontOptions[0];
                        }
                        setFontSettings({ title: selectedFont, heading: selectedFont, body: selectedFont });
                        setIsCustomColorMode(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: style.colors.primary }} />
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: style.colors.secondary }} />
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: style.colors.accent }} />
                          </div>
                          <span className="text-[10px] font-medium text-blue-800">{style.name}</span>
                        </div>
                        <span className="text-[9px] text-blue-600">適用</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          {/* ストーリー整合性チェック */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none py-2 border-t border-gray-200 mt-4">
              <span className="text-gray-400 group-open:rotate-90 transition-transform">▶</span>
              <span className="text-xs font-medium text-gray-700">ストーリー整合性チェック</span>
              <span className="text-[10px] text-gray-400 ml-2">提案書全体の論理構成をAIがチェック</span>
            </summary>
            <div className="pt-3 pb-2">
              <StoryCoherencePanel
                outline={editableOutline}
                slides={previewSlides}
              />
            </div>
          </details>
        </div>
      </div>

      {/* エクスポートモーダル */}
      <SlideExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        slides={previewSlides}
        outline={editableOutline}
        proposalTitle={proposal?.title}
        selectedSlideId={selectedSlideId || undefined}
      />
    </div>
  );
}
