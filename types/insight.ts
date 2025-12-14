/**
 * インサイト（洞察）関連の型定義
 *
 * 戦略コンサルレベルの「So What?」を自動生成するための型
 */

// インサイトのタイプ
export type InsightType =
  | 'pattern_recognition'    // パターン認識（「AとBに共通する問題は...」）
  | 'root_cause'            // 根本原因（「表面的な問題Xの真因は...」）
  | 'implication'           // 示唆（「これが意味するのは...」）
  | 'opportunity'           // 機会（「ここにチャンスがある」）
  | 'risk'                  // リスク（「このままだと...」）
  | 'recommendation';       // 推奨（「したがって...すべき」）

// 個別のインサイト
export type Insight = {
  id: string;
  type: InsightType;
  headline: string;           // 強力な1行メッセージ（20字以内推奨）
  soWhat: string;             // 「だから何？」への回答
  evidence: string[];         // 根拠となる事実
  implication: string;        // 示唆・含意
  confidence: 'high' | 'medium' | 'low';
  sourceContext?: string;     // 根拠となった対話の文脈
};

// セクション別インサイト
export type SectionInsights = {
  primaryInsight: Insight;    // このセクションの核心メッセージ
  supportingInsights: Insight[];
  messageHierarchy: {
    headline: string;         // タイトル直下の1行メッセージ
    subMessages: string[];    // 補足メッセージ
  };
};

// 提案書全体のインサイト
export type ProposalInsights = {
  overarchingInsight: Insight;  // 提案書全体を貫くメッセージ
  currentRecognition: SectionInsights;
  issueSetting: SectionInsights;
  toBeVision: SectionInsights;
  approach: SectionInsights;
};

// ===== ビジュアル・レトリック（表現技法）=====

// コントラスト設計
export type ContrastDesign = {
  type: 'before_after' | 'problem_solution' | 'current_future' | 'comparison' | 'emphasis';
  primaryElement: string;     // 強調する要素
  contrastElement: string;    // 対比する要素
  visualTechnique: string;    // 使用する視覚技法
  reason: string;             // なぜこのコントラストが効果的か
};

// 視線誘導設計
export type VisualFlowDesign = {
  flowPattern: 'z_pattern' | 'f_pattern' | 'central_focus' | 'sequential' | 'hierarchical';
  focalPoint: string;         // 最初に目を向けてほしい箇所
  secondaryPoints: string[];  // 次に見てほしい箇所（順序付き）
  reason: string;
};

// 余白設計
export type WhitespaceDesign = {
  strategy: 'breathing_room' | 'grouping' | 'emphasis' | 'minimalist';
  keyAreas: string[];         // 余白を設ける重要箇所
  reason: string;
};

// 情報階層設計
export type InformationHierarchy = {
  level1: string;             // 最重要（見出し）
  level2: string[];           // 重要（サブポイント）
  level3: string[];           // 補足（詳細）
  visualWeights: {
    level1: 'bold' | 'large' | 'color' | 'position';
    level2: 'medium' | 'secondary_color';
    level3: 'small' | 'muted';
  };
};

// ビジュアル・レトリック推奨
export type VisualRhetoricRecommendation = {
  slideId: string;
  contrast?: ContrastDesign;
  visualFlow: VisualFlowDesign;
  whitespace: WhitespaceDesign;
  hierarchy: InformationHierarchy;
  overallStrategy: string;    // この表現戦略の狙い
  expectedImpact: string;     // 期待される効果
};

// ===== ストーリーライン（ナラティブ）=====

// ストーリー構造のタイプ
export type NarrativeStructure =
  | 'problem_solution'      // 問題→解決策
  | 'situation_complication_resolution'  // SCR（マッキンゼー式）
  | 'why_what_how'          // なぜ→何を→どうやって
  | 'past_present_future'   // 過去→現在→未来
  | 'challenge_opportunity' // 課題→機会
  | 'custom';               // カスタム

// ストーリーの各パート
export type StoryPart = {
  id: string;
  role: 'hook' | 'context' | 'tension' | 'resolution' | 'call_to_action';
  purpose: string;          // このパートの目的
  keyMessage: string;       // 伝えるべきメッセージ
  slideIds: string[];       // 含まれるスライドID
  emotionalTarget: 'concern' | 'hope' | 'urgency' | 'confidence' | 'action';
  transitionTo?: string;    // 次のパートへの接続文
};

// スライド間の接続
export type SlideTransition = {
  fromSlideId: string;
  toSlideId: string;
  transitionType: 'therefore' | 'however' | 'furthermore' | 'specifically' | 'as_a_result';
  bridgeSentence: string;   // 「したがって」「しかし」「具体的には」などの接続
  logicalConnection: string; // 論理的なつながりの説明
};

// スライドごとの感情データ（感情曲線用）
export type SlideEmotion = {
  slideId: string;
  emotion: 'concern' | 'curiosity' | 'neutral' | 'tension' | 'urgency' | 'hope' | 'confidence' | 'action' | 'commitment';
  intensity: number;        // 0-100の強度
  reason: string;           // なぜこの感情を狙うのか
};

// ストーリーライン全体
export type Storyline = {
  structure: NarrativeStructure;
  audienceProfile?: {
    role: string;           // 「経営企画部長」など
    concerns: string[];     // 気にしていること
    decisionCriteria: string[];  // 意思決定基準
  };
  parts: StoryPart[];
  slideEmotions?: SlideEmotion[];  // 各スライドの感情データ（感情曲線用）
  transitions: SlideTransition[];
  overarchingMessage: string;  // 全体を通じて伝えたい1つのメッセージ
  emotionalArc: {
    start: 'concern' | 'curiosity' | 'neutral';
    climax: 'tension' | 'hope' | 'urgency';
    end: 'confidence' | 'action' | 'commitment';
  };
};

// ストーリー整合性チェック結果
export type StoryCoherenceCheck = {
  overallScore: number;       // 0-100
  issues: StoryIssue[];
  suggestions: StorySuggestion[];
};

export type StoryIssue = {
  type: 'logic_gap' | 'missing_transition' | 'weak_message' | 'redundancy' | 'sequence_problem';
  severity: 'critical' | 'major' | 'minor';
  location: {
    slideId?: string;
    section?: string;
    fromSlideId?: string;
    toSlideId?: string;
  };
  description: string;
  impact: string;           // この問題が与える影響
};

export type StorySuggestion = {
  issueId?: string;         // 対応する問題のID
  action: string;           // 推奨アクション
  example?: string;         // 具体例
  priority: 'high' | 'medium' | 'low';
};
