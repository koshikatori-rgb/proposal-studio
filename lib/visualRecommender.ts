/**
 * スライド内容を分析して最適なビジュアル表現を自動推奨
 *
 * 山口周「外資系コンサルのスライド作成術」を参考に、
 * スライドの内容パターンに応じた最適なビジュアル表現を選択
 */

import type { SlideElement, VisualHintType, CompositeLayoutType } from '@/types';
import type { SlideStructurePreset } from '@/types/slideStructure';

// 推奨結果の型
export type VisualRecommendation = {
  preset: SlideStructurePreset;
  useStructureMode: boolean;
  visualHint: VisualHintType;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  // 複合表現の推奨
  compositeRecommendation?: CompositeRecommendation;
};

// 複合表現の推奨結果
export type CompositeRecommendation = {
  shouldUseComposite: boolean;
  primaryPattern: VisualHintType;
  secondaryPattern: VisualHintType;
  layoutType: CompositeLayoutType;
  relationDescription: string;
  reason: string;
};

// 内容パターンの検出結果
type ContentPattern = {
  hasNumbers: boolean;           // 数値データが含まれる
  hasSteps: boolean;             // ステップ/フェーズの記述
  hasComparison: boolean;        // 比較表現（vs, 対, Before/After）
  hasCausalRelation: boolean;    // 因果関係（→, から, ので）
  hasHierarchy: boolean;         // 階層構造（大中小、レベル）
  hasTimeline: boolean;          // 時間軸（年月、期間）
  hasGoals: boolean;             // 目標/ゴール表現
  hasProblems: boolean;          // 問題/課題表現
  bulletCount: number;           // 箇条書きの数
  textLength: 'short' | 'medium' | 'long';
  // 新規追加パターン
  hasFunnel: boolean;            // ファネル（漏斗）表現
  hasSwimLane: boolean;          // 部門間プロセス
  hasSWOT: boolean;              // SWOT分析キーワード
  hasMilestone: boolean;         // マイルストーン表現
  hasMultiAxis: boolean;         // 多軸評価（レーダーチャート向け）
  hasKPI: boolean;               // KPI/指標表現
  hasOrganization: boolean;      // 組織/体制表現
  hasConvergence: boolean;       // 収束表現（複数→1つ）
  hasDivergence: boolean;        // 発散表現（1つ→複数）
  hasIcons: boolean;             // アイコン・シンボル向けの短い項目
  // 複合表現判定用の追加パターン
  hasAnalysisAndEvidence: boolean;    // 分析結果と根拠データ両方
  hasProcessAndDetail: boolean;       // プロセスと各フェーズ詳細
  hasStructureAndBreakdown: boolean;  // 全体構造と部分詳細
  hasGapAndPlan: boolean;             // 現状vs目標と達成計画
  hasProblemAndSolution: boolean;     // 問題と解決策
  hasQuantitativeData: boolean;       // 定量的なデータ（具体的数値）
  contentComplexity: 'simple' | 'moderate' | 'complex'; // コンテンツ複雑度
};

/**
 * スライド内容からパターンを検出
 */
function analyzeContentPattern(slide: SlideElement): ContentPattern {
  const allText = [
    slide.title || '',
    slide.mainMessage || '',
    slide.subtitle || '',
    ...(slide.content?.bullets || []),
    slide.content?.text || '',
    slide.content?.body || '',
  ].join(' ');

  const bullets = slide.content?.bullets || [];
  const totalLength = allText.length;

  // 平均箇条書き長さ（アイコングリッド判定用）
  const avgBulletLength = bullets.length > 0
    ? bullets.reduce((sum, b) => sum + b.length, 0) / bullets.length
    : 0;

  // 基本パターンを検出
  const hasNumbers = /\d+[%億万円件個名回]/g.test(allText) || /[0-9]+\.[0-9]+/.test(allText);
  const hasSteps = /ステップ|フェーズ|段階|Step|Phase|第[一二三四五1-5]|STEP/i.test(allText) ||
            bullets.some((b) => /^[①②③④⑤⑥⑦⑧⑨⑩1-9]\.|^Step/i.test(b));
  const hasComparison = /vs|対|比較|Before|After|現状|目標|AsIs|ToBe|従来|新規|既存/i.test(allText);
  const hasCausalRelation = /→|から|ので|ため|よって|結果|原因|影響|起因|背景/g.test(allText);
  const hasHierarchy = /大課題|中課題|小課題|上位|下位|レベル|階層|分類|カテゴリ/i.test(allText) ||
                bullets.some(b => /^[・-]\s*[・-]/.test(b));
  const hasTimeline = /[0-9]{4}年|[0-9]+月|Q[1-4]|第[1-4]四半期|短期|中期|長期|週間|ヶ月/i.test(allText);
  const hasGoals = /目標|ゴール|目指す|達成|KPI|KGI|成果|効果/i.test(allText);
  const hasProblems = /課題|問題|障壁|リスク|懸念|ボトルネック|低下|減少/i.test(allText);
  const hasFunnel = /ファネル|漏斗|絞り込み|コンバージョン|CVR|見込み客|リード|商談|成約|歩留まり/i.test(allText);
  const hasSwimLane = /部門|役割|責任|担当|営業部|開発部|企画部|総務|協業|連携|レーン/i.test(allText) &&
               /プロセス|フロー|流れ|手順/i.test(allText);
  const hasSWOT = /SWOT|強み|弱み|機会|脅威|Strength|Weakness|Opportunity|Threat/i.test(allText);
  const hasMilestone = /マイルストーン|節目|達成点|チェックポイント|ゲート|リリース|ローンチ/i.test(allText);
  const hasMultiAxis = /軸|評価項目|評価基準|スコア|レーティング/i.test(allText) &&
                (bullets.length >= 4 || /[3-6]つの|5段階/i.test(allText));
  const hasKPI = /KPI|KGI|指標|メトリクス|ダッシュボード|モニタリング|実績|進捗率/i.test(allText);
  const hasOrganization = /組織|体制|チーム|メンバー|担当者|役職|部長|課長|PM|PL|リーダー/i.test(allText);
  const hasConvergence = /統合|集約|一元化|まとめる|結論として|結果として|最終的に/i.test(allText) ||
                  (/→/.test(allText) && bullets.length >= 3);
  const hasDivergence = /展開|分岐|波及|影響範囲|多面的|複数の効果|様々な/i.test(allText) ||
                 /から.*多くの|1つの.*複数/i.test(allText);
  const hasIcons = bullets.length >= 3 && bullets.length <= 6 && avgBulletLength < 20;

  // 複合表現判定用パターン
  // 分析結果と根拠データ両方（マトリクス+グラフ向け）
  const hasAnalysisAndEvidence = (hasComparison || hasHierarchy || hasSWOT) && hasNumbers;
  // プロセスと各フェーズ詳細（スイムレーン+箇条書き向け）
  const hasProcessAndDetail = hasSteps && bullets.length >= 3 && totalLength >= 200;
  // 全体構造と部分詳細（エコシステム+ツリー向け）
  const hasStructureAndBreakdown = (hasHierarchy || hasConvergence || hasDivergence) && bullets.length >= 4;
  // 現状vs目標と達成計画（ギャップ分析+ロードマップ向け）
  const hasGapAndPlan = hasComparison && hasGoals && (hasTimeline || hasSteps);
  // 問題と解決策（problem-solution向け）
  const hasProblemAndSolution = hasProblems && (hasGoals || /解決|対策|改善|施策|アプローチ/i.test(allText));
  // 定量的なデータ（具体的数値が複数ある）
  const hasQuantitativeData = (allText.match(/\d+[%億万円件個名回]/g) || []).length >= 2;

  // コンテンツ複雑度の判定
  const patternCount = [
    hasNumbers, hasSteps, hasComparison, hasCausalRelation, hasHierarchy,
    hasTimeline, hasGoals, hasProblems, hasFunnel, hasSwimLane, hasSWOT
  ].filter(Boolean).length;
  const contentComplexity: 'simple' | 'moderate' | 'complex' =
    patternCount >= 4 ? 'complex' : patternCount >= 2 ? 'moderate' : 'simple';

  return {
    hasNumbers,
    hasSteps,
    hasComparison,
    hasCausalRelation,
    hasHierarchy,
    hasTimeline,
    hasGoals,
    hasProblems,
    bulletCount: bullets.length,
    textLength: totalLength < 100 ? 'short' : totalLength < 300 ? 'medium' : 'long',
    hasFunnel,
    hasSwimLane,
    hasSWOT,
    hasMilestone,
    hasMultiAxis,
    hasKPI,
    hasOrganization,
    hasConvergence,
    hasDivergence,
    hasIcons,
    // 複合表現判定用
    hasAnalysisAndEvidence,
    hasProcessAndDetail,
    hasStructureAndBreakdown,
    hasGapAndPlan,
    hasProblemAndSolution,
    hasQuantitativeData,
    contentComplexity,
  };
}

/**
 * スライドタイプと内容パターンから最適なビジュアル表現を推奨
 */
export function recommendVisual(slide: SlideElement): VisualRecommendation {
  const pattern = analyzeContentPattern(slide);
  const slideType = slide.type;

  // スライドタイプ別のデフォルト + 内容パターンによる調整
  let baseRecommendation: VisualRecommendation;
  switch (slideType) {
    case 'executive_summary':
      baseRecommendation = recommendForExecutiveSummary(pattern);
      break;
    case 'current_recognition':
      baseRecommendation = recommendForCurrentRecognition(pattern);
      break;
    case 'issue_setting':
    case 'issue_tree':
      baseRecommendation = recommendForIssueSetting(pattern);
      break;
    case 'tobe_vision':
    case 'project_goal':
      baseRecommendation = recommendForToBeVision(pattern);
      break;
    case 'expected_effect':
      baseRecommendation = recommendForExpectedEffect(pattern);
      break;
    case 'approach_overview':
    case 'approach_detail':
      baseRecommendation = recommendForApproach(pattern);
      break;
    case 'why_this_approach':
      baseRecommendation = recommendForWhyThisApproach(pattern);
      break;
    case 'why_us':
      baseRecommendation = recommendForWhyUs(pattern);
      break;
    case 'risk_management':
      baseRecommendation = recommendForRiskManagement(pattern);
      break;
    case 'schedule':
      baseRecommendation = recommendForSchedule(pattern);
      break;
    case 'team':
    case 'project_members':
      baseRecommendation = recommendForTeam(pattern);
      break;
    case 'meeting_structure':
      baseRecommendation = recommendForMeetingStructure(pattern);
      break;
    case 'estimate':
    case 'estimate_assumptions':
      baseRecommendation = recommendForEstimate(pattern);
      break;
    case 'appendix':
      baseRecommendation = recommendForAppendix(pattern);
      break;
    default:
      baseRecommendation = recommendGeneric(pattern);
  }

  // 複合表現の推奨を追加
  const compositeRecommendation = recommendCompositeVisual(pattern);

  return {
    ...baseRecommendation,
    compositeRecommendation,
  };
}

// 現状認識スライドの推奨
function recommendForCurrentRecognition(pattern: ContentPattern): VisualRecommendation {
  // SWOT分析キーワードがある場合 → SWOT
  if (pattern.hasSWOT) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'swot',
      confidence: 'high',
      reason: '強み・弱み・機会・脅威を4象限で整理するため、SWOT分析を推奨',
    };
  }

  // KPI/指標データがある場合 → KPIダッシュボード
  if (pattern.hasKPI && pattern.hasNumbers) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'kpi-dashboard',
      confidence: 'high',
      reason: '現状の指標を一覧で把握するため、KPIダッシュボードを推奨',
    };
  }

  // 数値データがある場合 → ウォーターフォール
  if (pattern.hasNumbers && pattern.hasCausalRelation) {
    return {
      preset: 'waterfall-with-explanation',
      useStructureMode: true,
      visualHint: 'waterfall',
      confidence: 'high',
      reason: '数値の変化と要因の関係を視覚的に表現するため、ウォーターフォールチャートを推奨',
    };
  }

  // ファネル表現がある場合 → ファネル図
  if (pattern.hasFunnel) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'funnel',
      confidence: 'high',
      reason: '営業プロセスや絞り込みの現状を示すため、ファネル図を推奨',
    };
  }

  // 収束表現がある場合 → 収束図
  if (pattern.hasConvergence && pattern.bulletCount >= 3) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'convergence',
      confidence: 'medium',
      reason: '複数の要素が1つの結論に収束する関係を示すため、収束図を推奨',
    };
  }

  // 因果関係がある場合 → 因果関係図
  if (pattern.hasCausalRelation && pattern.bulletCount >= 3) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'cause-effect',
      confidence: 'high',
      reason: '問題の原因と結果の関係を明確にするため、因果関係図を推奨',
    };
  }

  // 比較表現がある場合 → ギャップ分析
  if (pattern.hasComparison) {
    return {
      preset: 'gap-analysis-visual',
      useStructureMode: true,
      visualHint: 'gap-analysis',
      confidence: 'medium',
      reason: '現状と理想のギャップを視覚化するため、ギャップ分析図を推奨',
    };
  }

  // デフォルト
  return {
    preset: 'waterfall-with-explanation',
    useStructureMode: true,
    visualHint: 'hierarchy',
    confidence: 'low',
    reason: '現状認識の標準的な表現として階層構造を使用',
  };
}

// 課題設定スライドの推奨
function recommendForIssueSetting(pattern: ContentPattern): VisualRecommendation {
  // 多軸評価がある場合 → レーダーチャート
  if (pattern.hasMultiAxis) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'radar',
      confidence: 'high',
      reason: '複数の評価軸で課題を分析するため、レーダーチャートを推奨',
    };
  }

  // 発散表現がある場合 → 発散図
  if (pattern.hasDivergence && pattern.bulletCount >= 3) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'divergence',
      confidence: 'high',
      reason: '1つの課題から複数の影響が広がる関係を示すため、発散図を推奨',
    };
  }

  // 2x2で分類できそうな場合 → マトリクス
  if (pattern.hasComparison && pattern.bulletCount === 4) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'matrix',
      confidence: 'high',
      reason: '課題を2軸で整理するため、2x2マトリクスを推奨',
    };
  }

  // 階層的な課題構造がある場合 → ツリー図
  if (pattern.hasHierarchy || pattern.bulletCount >= 4) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'tree',
      confidence: 'high',
      reason: '課題をMECEに分解するため、ツリー構造を推奨',
    };
  }

  // 因果関係がある場合 → 階層図
  if (pattern.hasCausalRelation) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'hierarchy',
      confidence: 'high',
      reason: '問題→原因→対策の関係を示すため、階層構造を推奨',
    };
  }

  // デフォルト
  return {
    preset: 'hierarchy-with-bullets',
    useStructureMode: true,
    visualHint: 'pyramid',
    confidence: 'medium',
    reason: '課題の重要度を示すため、ピラミッド構造を推奨',
  };
}

// ToBe像スライドの推奨
function recommendForToBeVision(pattern: ContentPattern): VisualRecommendation {
  // マイルストーン表現がある場合 → マイルストーン
  if (pattern.hasMilestone && pattern.hasTimeline) {
    return {
      preset: 'timeline-with-detail',
      useStructureMode: true,
      visualHint: 'milestone',
      confidence: 'high',
      reason: '目標達成の節目を明確にするため、マイルストーン図を推奨',
    };
  }

  // 収束表現がある場合 → 収束図
  if (pattern.hasConvergence) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'convergence',
      confidence: 'high',
      reason: '複数の取り組みが1つのゴールに向かう構造を示すため、収束図を推奨',
    };
  }

  // KPI目標がある場合 → KPIダッシュボード
  if (pattern.hasKPI && pattern.hasGoals) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'kpi-dashboard',
      confidence: 'high',
      reason: '達成すべきKPI目標を一覧で示すため、KPIダッシュボードを推奨',
    };
  }

  // 比較表現（現状vs目標）がある場合 → ギャップ分析
  if (pattern.hasComparison && pattern.hasGoals) {
    return {
      preset: 'gap-analysis-visual',
      useStructureMode: true,
      visualHint: 'gap-analysis',
      confidence: 'high',
      reason: '現状と目標のギャップを明確にするため、ギャップ分析図を推奨',
    };
  }

  // 数値目標がある場合 → 棒グラフ
  if (pattern.hasNumbers && pattern.hasGoals) {
    return {
      preset: 'gap-analysis-visual',
      useStructureMode: true,
      visualHint: 'bar-chart',
      confidence: 'high',
      reason: '数値目標の達成度を視覚化するため、棒グラフを推奨',
    };
  }

  // ステップがある場合 → ロードマップ
  if (pattern.hasSteps || pattern.hasTimeline) {
    return {
      preset: 'three-column-flow',
      useStructureMode: true,
      visualHint: 'roadmap',
      confidence: 'medium',
      reason: '段階的な目標達成を示すため、ロードマップを推奨',
    };
  }

  // アイコン向けの短い項目がある場合 → アイコングリッド
  if (pattern.hasIcons) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'icon-grid',
      confidence: 'medium',
      reason: '目標項目を視覚的に整理するため、アイコングリッドを推奨',
    };
  }

  // デフォルト
  return {
    preset: 'gap-analysis-visual',
    useStructureMode: true,
    visualHint: 'comparison',
    confidence: 'medium',
    reason: 'AsIs/ToBeの対比を示すため、比較表を推奨',
  };
}

// アプローチスライドの推奨
function recommendForApproach(pattern: ContentPattern): VisualRecommendation {
  // スイムレーン向けの部門間プロセスがある場合 → スイムレーン
  if (pattern.hasSwimLane) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'swimlane',
      confidence: 'high',
      reason: '部門間の役割分担と流れを示すため、スイムレーン図を推奨',
    };
  }

  // ファネル表現がある場合 → ファネル図
  if (pattern.hasFunnel) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'funnel',
      confidence: 'high',
      reason: 'プロセスの絞り込みを示すため、ファネル図を推奨',
    };
  }

  // ロードマップ向けのタイムライン + ステップがある場合 → ロードマップ
  if (pattern.hasTimeline && pattern.hasSteps) {
    return {
      preset: 'timeline-with-detail',
      useStructureMode: true,
      visualHint: 'roadmap',
      confidence: 'high',
      reason: '中長期的なアプローチ計画を示すため、ロードマップを推奨',
    };
  }

  // 明確なステップがある場合 → プロセスフロー
  if (pattern.hasSteps) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'process-flow',
      confidence: 'high',
      reason: '実行ステップの流れを示すため、プロセスフローを推奨',
    };
  }

  // 3段階の流れがある場合 → 3カラムフロー
  if (pattern.bulletCount === 3 || /3つ|三つ|3段階/.test(pattern.textLength)) {
    return {
      preset: 'three-column-flow',
      useStructureMode: true,
      visualHint: 'process-flow',
      confidence: 'high',
      reason: '3段階のアプローチを視覚化するため、3カラムフローを推奨',
    };
  }

  // アイコン向けの短い項目がある場合 → アイコングリッド
  if (pattern.hasIcons) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'icon-grid',
      confidence: 'medium',
      reason: 'アプローチ要素を視覚的に整理するため、アイコングリッドを推奨',
    };
  }

  // 因果関係がある場合 → フロー→詳細
  if (pattern.hasCausalRelation) {
    return {
      preset: 'flow-to-detail',
      useStructureMode: true,
      visualHint: 'process-flow',
      confidence: 'medium',
      reason: 'アプローチの全体像と詳細を示すため、フロー図を推奨',
    };
  }

  // デフォルト
  return {
    preset: 'flow-to-detail',
    useStructureMode: true,
    visualHint: 'process-flow',
    confidence: 'medium',
    reason: 'アプローチの流れを示すため、プロセスフローを推奨',
  };
}

// なぜこのアプローチかスライドの推奨
function recommendForWhyThisApproach(pattern: ContentPattern): VisualRecommendation {
  // 多軸評価がある場合 → レーダーチャート
  if (pattern.hasMultiAxis) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'radar',
      confidence: 'high',
      reason: '複数の評価軸でアプローチを比較するため、レーダーチャートを推奨',
    };
  }

  // SWOT分析がある場合 → SWOT
  if (pattern.hasSWOT) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'swot',
      confidence: 'high',
      reason: 'アプローチの強み・弱みを分析するため、SWOT分析を推奨',
    };
  }

  // 比較がある場合 → マトリクス
  if (pattern.hasComparison && pattern.bulletCount >= 2) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'matrix',
      confidence: 'high',
      reason: '選択肢の比較評価を示すため、マトリクスを推奨',
    };
  }

  // デフォルト → 比較表
  return {
    preset: 'comparison-table',
    useStructureMode: true,
    visualHint: 'comparison',
    confidence: 'medium',
    reason: 'アプローチの優位性を示すため、比較表を推奨',
  };
}

// スケジュールスライドの推奨
function recommendForSchedule(pattern: ContentPattern): VisualRecommendation {
  // マイルストーン表現がある場合 → マイルストーン
  if (pattern.hasMilestone) {
    return {
      preset: 'timeline-with-detail',
      useStructureMode: true,
      visualHint: 'milestone',
      confidence: 'high',
      reason: '重要な節目を強調するため、マイルストーン図を推奨',
    };
  }

  // 中長期の計画がある場合 → ロードマップ
  if (pattern.hasTimeline && /中期|長期|年|ヶ月/.test(pattern.textLength)) {
    return {
      preset: 'timeline-with-detail',
      useStructureMode: true,
      visualHint: 'roadmap',
      confidence: 'high',
      reason: '中長期スケジュールを示すため、ロードマップを推奨',
    };
  }

  // タイムライン表現がある場合 → ガントチャート
  if (pattern.hasTimeline && pattern.hasSteps) {
    return {
      preset: 'timeline-with-detail',
      useStructureMode: true,
      visualHint: 'gantt',
      confidence: 'high',
      reason: 'プロジェクトスケジュールを示すため、ガントチャートを推奨',
    };
  }

  // デフォルト → タイムライン
  return {
    preset: 'timeline-with-detail',
    useStructureMode: true,
    visualHint: 'timeline',
    confidence: 'medium',
    reason: '時系列の計画を示すため、タイムラインを推奨',
  };
}

// 体制スライドの推奨
function recommendForTeam(pattern: ContentPattern): VisualRecommendation {
  // 組織表現がある場合 → 組織図
  if (pattern.hasOrganization && pattern.hasHierarchy) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'org-chart',
      confidence: 'high',
      reason: 'プロジェクト体制を示すため、組織図を推奨',
    };
  }

  // 階層がある場合 → 階層図
  if (pattern.hasHierarchy) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'hierarchy',
      confidence: 'medium',
      reason: '組織構造を示すため、階層図を推奨',
    };
  }

  // アイコン向けの短い項目がある場合 → アイコングリッド
  if (pattern.hasIcons) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'icon-grid',
      confidence: 'medium',
      reason: 'チームメンバーを視覚的に整理するため、アイコングリッドを推奨',
    };
  }

  // デフォルト → シンプルな箇条書き
  return {
    preset: 'simple-bullets',
    useStructureMode: false,
    visualHint: 'bullets-only',
    confidence: 'low',
    reason: '体制情報はシンプルな箇条書きで表現',
  };
}

// 見積もりスライドの推奨
function recommendForEstimate(pattern: ContentPattern): VisualRecommendation {
  // 積み上げ表現がある場合 → 積み上げ棒グラフ
  if (pattern.hasNumbers && pattern.bulletCount >= 3) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'stacked-bar',
      confidence: 'high',
      reason: '費用の内訳を視覚化するため、積み上げ棒グラフを推奨',
    };
  }

  // 数値データが多い場合 → 棒グラフ
  if (pattern.hasNumbers) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'bar-chart',
      confidence: 'medium',
      reason: '見積もり詳細を比較しやすくするため、棒グラフを推奨',
    };
  }

  return {
    preset: 'simple-bullets',
    useStructureMode: false,
    visualHint: 'bullets-only',
    confidence: 'low',
    reason: '見積もり情報はシンプルに表現',
  };
}

// エグゼクティブサマリースライドの推奨
function recommendForExecutiveSummary(pattern: ContentPattern): VisualRecommendation {
  // KPI/指標データがある場合 → KPIダッシュボード
  if (pattern.hasKPI && pattern.hasNumbers) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'kpi-dashboard',
      confidence: 'high',
      reason: '提案の主要指標を一覧で示すため、KPIダッシュボードを推奨',
    };
  }

  // 収束表現がある場合 → 収束図
  if (pattern.hasConvergence) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'convergence',
      confidence: 'high',
      reason: '提案全体を1つの結論に集約するため、収束図を推奨',
    };
  }

  // アイコン向けの短い項目がある場合 → アイコングリッド
  if (pattern.hasIcons) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'icon-grid',
      confidence: 'medium',
      reason: '提案のキーポイントを視覚的に整理するため、アイコングリッドを推奨',
    };
  }

  // デフォルト → simple-bullets（シンプルな箇条書き）
  return {
    preset: 'simple-bullets',
    useStructureMode: true,
    visualHint: 'summary-detail',
    confidence: 'medium',
    reason: '提案全体の要点を簡潔にまとめるため、サマリー形式を推奨',
  };
}

// 期待効果・投資対効果スライドの推奨
function recommendForExpectedEffect(pattern: ContentPattern): VisualRecommendation {
  // ROI/投資対効果の数値データがある場合 → ウォーターフォール
  if (pattern.hasNumbers && pattern.hasCausalRelation) {
    return {
      preset: 'waterfall-with-explanation',
      useStructureMode: true,
      visualHint: 'waterfall',
      confidence: 'high',
      reason: '投資対効果の内訳を視覚的に示すため、ウォーターフォールチャートを推奨',
    };
  }

  // 数値目標がある場合 → 棒グラフ
  if (pattern.hasNumbers && pattern.hasGoals) {
    return {
      preset: 'gap-analysis-visual',
      useStructureMode: true,
      visualHint: 'bar-chart',
      confidence: 'high',
      reason: '期待効果を定量的に示すため、棒グラフを推奨',
    };
  }

  // KPI表現がある場合 → KPIダッシュボード
  if (pattern.hasKPI) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'kpi-dashboard',
      confidence: 'high',
      reason: '期待される改善指標を一覧で示すため、KPIダッシュボードを推奨',
    };
  }

  // 比較表現がある場合 → impact-analysis
  if (pattern.hasComparison) {
    return {
      preset: 'gap-analysis-visual',
      useStructureMode: true,
      visualHint: 'impact-analysis',
      confidence: 'high',
      reason: '現状からの改善インパクトを示すため、インパクト分析図を推奨',
    };
  }

  // デフォルト
  return {
    preset: 'simple-bullets',
    useStructureMode: true,
    visualHint: 'bullets-with-visual',
    confidence: 'medium',
    reason: '期待効果を視覚的に整理するため、アイコン付き箇条書きを推奨',
  };
}

// Why Us・選定理由スライドの推奨
function recommendForWhyUs(pattern: ContentPattern): VisualRecommendation {
  // 多軸評価がある場合 → レーダーチャート
  if (pattern.hasMultiAxis) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'radar',
      confidence: 'high',
      reason: '複数の強みを多軸で評価するため、レーダーチャートを推奨',
    };
  }

  // 比較表現がある場合 → マトリクス or 比較表
  if (pattern.hasComparison) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: pattern.bulletCount === 4 ? 'matrix' : 'comparison',
      confidence: 'high',
      reason: '競合との差別化ポイントを明確にするため、比較表を推奨',
    };
  }

  // 実績・事例がある場合 → アイコングリッド
  if (pattern.hasIcons || /実績|事例|プロジェクト|導入/.test(pattern.textLength)) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'icon-grid',
      confidence: 'medium',
      reason: '類似実績を視覚的に整理するため、アイコングリッドを推奨',
    };
  }

  // デフォルト → アイコン付き箇条書き
  return {
    preset: 'simple-bullets',
    useStructureMode: true,
    visualHint: 'bullets-with-visual',
    confidence: 'medium',
    reason: '選定理由を視覚的に整理するため、アイコン付き箇条書きを推奨',
  };
}

// リスク管理スライドの推奨
function recommendForRiskManagement(pattern: ContentPattern): VisualRecommendation {
  // 2x2で分類できそうな場合 → マトリクス（影響度×発生確率）
  if (pattern.hasComparison || pattern.bulletCount === 4) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'matrix',
      confidence: 'high',
      reason: 'リスクを影響度と発生確率で分類するため、2x2マトリクスを推奨',
    };
  }

  // 問題と対策がある場合 → problem-solution
  if (pattern.hasProblemAndSolution) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'problem-solution',
      confidence: 'high',
      reason: 'リスクと対応策を対比で示すため、問題-解決形式を推奨',
    };
  }

  // 階層的な構造がある場合 → ツリー
  if (pattern.hasHierarchy) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'tree',
      confidence: 'medium',
      reason: 'リスクをカテゴリ別に分類するため、ツリー構造を推奨',
    };
  }

  // デフォルト → 比較表
  return {
    preset: 'comparison-table',
    useStructureMode: true,
    visualHint: 'comparison',
    confidence: 'medium',
    reason: 'リスクと対策を表形式で整理するため、比較表を推奨',
  };
}

// 会議体・コミュニケーション設計スライドの推奨
function recommendForMeetingStructure(pattern: ContentPattern): VisualRecommendation {
  // 組織/体制表現がある場合 → 組織図
  if (pattern.hasOrganization) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'org-chart',
      confidence: 'high',
      reason: '会議体の関係性を示すため、組織図を推奨',
    };
  }

  // サイクル/循環プロセスがある場合 → サイクル図
  if (/週次|月次|定例|サイクル|循環/.test(pattern.textLength)) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'cycle',
      confidence: 'high',
      reason: '定例会議のサイクルを示すため、サイクル図を推奨',
    };
  }

  // スイムレーン向きの場合 → スイムレーン
  if (pattern.hasSwimLane) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'swimlane',
      confidence: 'high',
      reason: '部門間のコミュニケーションフローを示すため、スイムレーン図を推奨',
    };
  }

  // デフォルト → 比較表
  return {
    preset: 'comparison-table',
    useStructureMode: true,
    visualHint: 'comparison',
    confidence: 'medium',
    reason: '会議体の一覧を表形式で整理するため、比較表を推奨',
  };
}

// Appendixスライドの推奨
function recommendForAppendix(pattern: ContentPattern): VisualRecommendation {
  // データ/グラフ向きの場合
  if (pattern.hasNumbers && pattern.hasQuantitativeData) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'bar-chart',
      confidence: 'medium',
      reason: '補足データを視覚化するため、棒グラフを推奨',
    };
  }

  // 比較表現がある場合 → 比較表
  if (pattern.hasComparison) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'comparison',
      confidence: 'medium',
      reason: '補足情報を表形式で整理するため、比較表を推奨',
    };
  }

  // デフォルト → シンプルな箇条書き
  return {
    preset: 'simple-bullets',
    useStructureMode: false,
    visualHint: 'bullets-only',
    confidence: 'low',
    reason: '補足資料はシンプルに表現',
  };
}

// 汎用的な推奨
function recommendGeneric(pattern: ContentPattern): VisualRecommendation {
  // SWOT分析がある場合 → SWOT
  if (pattern.hasSWOT) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'swot',
      confidence: 'high',
      reason: '強み・弱み・機会・脅威を分析するため、SWOT分析を推奨',
    };
  }

  // ファネル表現がある場合 → ファネル図
  if (pattern.hasFunnel) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'funnel',
      confidence: 'high',
      reason: '絞り込みプロセスを示すため、ファネル図を推奨',
    };
  }

  // 多軸評価がある場合 → レーダーチャート
  if (pattern.hasMultiAxis) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'radar',
      confidence: 'high',
      reason: '複数の軸で評価するため、レーダーチャートを推奨',
    };
  }

  // KPI表現がある場合 → KPIダッシュボード
  if (pattern.hasKPI && pattern.hasNumbers) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'kpi-dashboard',
      confidence: 'high',
      reason: '指標を一覧で把握するため、KPIダッシュボードを推奨',
    };
  }

  // 収束表現がある場合 → 収束図
  if (pattern.hasConvergence) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'convergence',
      confidence: 'medium',
      reason: '複数要素が1つに収束する関係を示すため、収束図を推奨',
    };
  }

  // 発散表現がある場合 → 発散図
  if (pattern.hasDivergence) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'divergence',
      confidence: 'medium',
      reason: '1つの要素から複数に広がる関係を示すため、発散図を推奨',
    };
  }

  // 組織表現がある場合 → 組織図
  if (pattern.hasOrganization) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'org-chart',
      confidence: 'medium',
      reason: '組織・体制を示すため、組織図を推奨',
    };
  }

  // スイムレーン向けの表現がある場合 → スイムレーン
  if (pattern.hasSwimLane) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'swimlane',
      confidence: 'medium',
      reason: '部門間プロセスを示すため、スイムレーン図を推奨',
    };
  }

  // ステップがある場合 → フロー
  if (pattern.hasSteps) {
    return {
      preset: 'process-steps',
      useStructureMode: true,
      visualHint: 'process-flow',
      confidence: 'medium',
      reason: 'ステップの流れを示すため、プロセスフローを推奨',
    };
  }

  // マイルストーン表現がある場合 → マイルストーン
  if (pattern.hasMilestone) {
    return {
      preset: 'timeline-with-detail',
      useStructureMode: true,
      visualHint: 'milestone',
      confidence: 'medium',
      reason: '重要な節目を示すため、マイルストーン図を推奨',
    };
  }

  // 比較がある場合 → 比較表
  if (pattern.hasComparison) {
    return {
      preset: 'comparison-table',
      useStructureMode: true,
      visualHint: 'comparison',
      confidence: 'medium',
      reason: '比較情報を整理するため、比較表を推奨',
    };
  }

  // 階層がある場合 → ツリー
  if (pattern.hasHierarchy) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'tree',
      confidence: 'medium',
      reason: '階層構造を示すため、ツリー図を推奨',
    };
  }

  // 因果関係がある場合 → 因果図
  if (pattern.hasCausalRelation) {
    return {
      preset: 'hierarchy-with-bullets',
      useStructureMode: true,
      visualHint: 'cause-effect',
      confidence: 'medium',
      reason: '因果関係を示すため、因果関係図を推奨',
    };
  }

  // アイコン向けの短い項目がある場合 → アイコングリッド
  if (pattern.hasIcons) {
    return {
      preset: 'simple-bullets',
      useStructureMode: true,
      visualHint: 'icon-grid',
      confidence: 'medium',
      reason: '項目を視覚的に整理するため、アイコングリッドを推奨',
    };
  }

  // デフォルト → シンプルな箇条書き
  return {
    preset: 'simple-bullets',
    useStructureMode: false,
    visualHint: 'bullets-only',
    confidence: 'low',
    reason: 'シンプルな内容のため、箇条書きを使用',
  };
}

/**
 * 複合表現が適切かどうかを判断し、推奨を返す
 *
 * 判断基準:
 * - コンテンツが複雑で、1つの表現では伝えきれない場合
 * - 「分析結果」と「根拠データ」を同時に見せたい
 * - 「プロセス」と「各フェーズの詳細」を見せたい
 * - 「全体構造」と「一部の詳細分解」を見せたい
 * - 「現状vs目標」と「達成計画」を見せたい
 * - 「問題」と「解決策」を対比で見せたい
 */
function recommendCompositeVisual(
  pattern: ContentPattern
): CompositeRecommendation | undefined {
  // シンプルなコンテンツには複合表現は不要
  if (pattern.contentComplexity === 'simple') {
    return undefined;
  }

  // 1. 分析結果＋根拠データ（マトリクス/比較 + グラフ）
  // 判断: 比較・分析表現があり、かつ定量的なデータがある場合
  // レイアウト: left-right（分析結果を左、根拠となるグラフを右に配置し因果関係を示す）
  if (pattern.hasAnalysisAndEvidence) {
    // マトリクスやSWOTがある場合
    if (pattern.hasSWOT || pattern.hasMultiAxis) {
      return {
        shouldUseComposite: true,
        primaryPattern: pattern.hasSWOT ? 'swot' : 'matrix',
        secondaryPattern: pattern.hasQuantitativeData ? 'bar-chart' : 'kpi-dashboard',
        layoutType: 'left-right',
        relationDescription: '分析フレームワークで構造を示し、数値データで裏付けを提供',
        reason: '分析結果と定量的根拠を並列で示すことで、説得力を高めるため左右分割を推奨',
      };
    }
    // 比較表現がある場合
    if (pattern.hasComparison && pattern.hasNumbers) {
      return {
        shouldUseComposite: true,
        primaryPattern: 'comparison',
        secondaryPattern: 'bar-chart',
        layoutType: 'left-right',
        relationDescription: '定性的な比較と定量的なデータを並べて根拠を示す',
        reason: '比較分析の結論（左）と数値的根拠（右）を同時に見せるため左右分割を推奨',
      };
    }
  }

  // 2. プロセス＋各フェーズ詳細（フロー + 箇条書き/タイムライン）
  // 判断: ステップがあり、詳細な説明も必要な場合
  // レイアウト: top-bottom（上でプロセス全体を俯瞰し、下で詳細を展開。抽象→具体の流れ）
  if (pattern.hasProcessAndDetail) {
    // 部門間プロセスの場合
    if (pattern.hasSwimLane) {
      return {
        shouldUseComposite: true,
        primaryPattern: 'swimlane',
        secondaryPattern: 'bullets-with-visual',
        layoutType: 'top-bottom',
        relationDescription: '上部で部門間の流れを俯瞰し、下部で各フェーズの詳細を補足',
        reason: '全体プロセス（上）から詳細（下）へ視線を誘導する自然な流れのため上下分割を推奨',
      };
    }
    // タイムラインを伴うプロセス
    if (pattern.hasTimeline) {
      return {
        shouldUseComposite: true,
        primaryPattern: 'process-flow',
        secondaryPattern: 'timeline',
        layoutType: 'top-bottom',
        relationDescription: '上部でプロセスフローを示し、下部でタイムラインを補足',
        reason: 'プロセスの論理構造（上）と時間軸（下）を分離して示すため上下分割を推奨',
      };
    }
    // 通常のプロセス詳細
    return {
      shouldUseComposite: true,
      primaryPattern: 'process-flow',
      secondaryPattern: 'bullets-with-visual',
      layoutType: 'top-bottom',
      relationDescription: '上部でステップ全体を俯瞰し、下部で各ステップの詳細を展開',
      reason: 'フロー全体（上）を見せてから詳細（下）に展開する認知負荷が低い構成のため上下分割を推奨',
    };
  }

  // 3. 現状vs目標＋達成計画（ギャップ分析 + ロードマップ）
  // 判断: 比較表現と目標があり、時間軸やステップもある場合
  // レイアウト: top-bottom（上でギャップ＝What を示し、下でロードマップ＝How を展開）
  if (pattern.hasGapAndPlan) {
    return {
      shouldUseComposite: true,
      primaryPattern: 'gap-analysis',
      secondaryPattern: pattern.hasTimeline ? 'roadmap' : 'process-flow',
      layoutType: 'top-bottom',
      relationDescription: '上部で現状と目標のギャップを示し、下部でその達成計画を展開',
      reason: '「何を達成するか」（上）と「どう達成するか」（下）を論理的に分離するため上下分割を推奨',
    };
  }

  // 4. 問題＋解決策（problem-solution）
  // 判断: 問題表現と解決策表現の両方がある場合
  // レイアウト: left-right（問題を左、解決策を右に配置し、対比構造を明確化）
  if (pattern.hasProblemAndSolution) {
    return {
      shouldUseComposite: true,
      primaryPattern: 'cause-effect',
      secondaryPattern: 'process-flow',
      layoutType: 'left-right',
      relationDescription: '左側で問題と原因を示し、右側で解決アプローチを展開',
      reason: '問題（左）→解決策（右）の因果関係を横方向の視線移動で自然に理解させるため左右分割を推奨',
    };
  }

  // 5. 全体構造＋部分詳細（階層/エコシステム + ツリー/箇条書き）
  // 判断: 階層構造があり、詳細な分解も必要な場合
  // レイアウト: left-right（左で全体構造を示し、右で詳細を展開。空間的な「全体→部分」の関係）
  if (pattern.hasStructureAndBreakdown) {
    // 収束パターンの場合
    if (pattern.hasConvergence) {
      return {
        shouldUseComposite: true,
        primaryPattern: 'convergence',
        secondaryPattern: 'bullets-with-visual',
        layoutType: 'left-right',
        relationDescription: '左側で複数要素の収束構造を示し、右側で各要素の詳細を補足',
        reason: '収束構造の全体像（左）と各要素の詳細（右）を並列で示すため左右分割を推奨',
      };
    }
    // 発散パターンの場合
    if (pattern.hasDivergence) {
      return {
        shouldUseComposite: true,
        primaryPattern: 'divergence',
        secondaryPattern: 'bullets-with-visual',
        layoutType: 'left-right',
        relationDescription: '左側で1つから複数への展開を示し、右側で各分岐の詳細を補足',
        reason: '発散構造の起点と展開（左）、各分岐の詳細（右）を対応させるため左右分割を推奨',
      };
    }
    // 通常の階層構造
    return {
      shouldUseComposite: true,
      primaryPattern: 'hierarchy',
      secondaryPattern: 'bullets-only',
      layoutType: 'left-right',
      relationDescription: '左側で階層構造の全体像を示し、右側で各レベルの詳細を補足',
      reason: '構造図（左）と詳細テキスト（右）を分離し、視覚と言語の両面から理解を促すため左右分割を推奨',
    };
  }

  // 6. ファネル＋数値データ（ファネル + グラフ）
  // 判断: ファネル表現があり、数値データもある場合
  // レイアウト: left-right（ファネルの視覚的インパクトを左に、数値根拠を右に配置）
  if (pattern.hasFunnel && pattern.hasQuantitativeData) {
    return {
      shouldUseComposite: true,
      primaryPattern: 'funnel',
      secondaryPattern: 'stacked-bar',
      layoutType: 'left-right',
      relationDescription: '左側でファネルプロセスを示し、右側で各段階の数値を可視化',
      reason: 'ファネルの定性的流れ（左）と定量的な数値（右）を同時に示すため左右分割を推奨',
    };
  }

  // 複合表現が不要な場合
  return undefined;
}

/**
 * 複数のスライドに対して推奨を適用
 */
export function applyRecommendationsToSlides(slides: SlideElement[]): SlideElement[] {
  return slides.map(slide => {
    const recommendation = recommendVisual(slide);

    // 複合表現の設定を構築
    const compositeVisual = recommendation.compositeRecommendation?.shouldUseComposite
      ? {
          enabled: true,
          primaryPattern: recommendation.compositeRecommendation.primaryPattern,
          secondaryPattern: recommendation.compositeRecommendation.secondaryPattern,
          layoutType: recommendation.compositeRecommendation.layoutType,
          relationDescription: recommendation.compositeRecommendation.relationDescription,
        }
      : undefined;

    return {
      ...slide,
      structurePreset: recommendation.preset,
      useStructureMode: recommendation.useStructureMode,
      visualHint: recommendation.visualHint,
      visualReason: recommendation.reason,
      compositeVisual,
    };
  });
}
