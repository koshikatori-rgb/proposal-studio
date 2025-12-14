# 生成AIスライド作成の「3つの壁」突破戦略

## 問題認識

### AIスライド作成の現状
- **AI推進派**: 「構成案やドラフト（60点）を一瞬で作れる」
- **戦略コンサル**: 「細部の論理構成やレイアウト（残り40点）の修正に結局時間がかかる」

### 3つの壁

| 壁 | 問題の本質 | 現在のAIの限界 |
|---|---|---|
| ①構造化の壁 | 概念の図式化（Visualization）が文脈を読み切れない | テキスト要約はできるが、独自の切り口や複雑な事象の構造化ができない |
| ②微調整の壁 | 1ピクセル単位のこだわりに対応できない | 細かい指示の連続で誤動作、時間がかかる |
| ③ストーリーテリングの壁 | 資料全体の説得力ある流れを構築できない | スライド単体は作れるが、全体の起承転結が弱い |

---

## 壁①「構造化の壁」の突破

### 問題の深掘り
- AIは情報を羅列するのは得意だが、**「So What?（だから何？）」**のメッセージが弱い
- 複雑な概念図、因果関係のループを描くと、矢印の向きや包含関係が論理的に破綻する
- 汎用LLMでは、具体的でニッチな市場データや企業の内部事情に基づく深い洞察が出せない

### 突破機能：**インサイト・エンジン**

#### 機能概要
対話を通じて抽出した情報から、**戦略コンサルレベルの「So What?」**を自動生成する機能

#### 実装案

```typescript
// types/insight.ts
type InsightType =
  | 'pattern_recognition'    // パターン認識（「AとBに共通する問題は...」）
  | 'root_cause'            // 根本原因（「表面的な問題Xの真因は...」）
  | 'implication'           // 示唆（「これが意味するのは...」）
  | 'opportunity'           // 機会（「ここにチャンスがある」）
  | 'risk'                  // リスク（「このままだと...」）
  | 'recommendation';       // 推奨（「したがって...すべき」）

type Insight = {
  id: string;
  type: InsightType;
  headline: string;           // 強力な1行メッセージ
  evidence: string[];         // 根拠となる事実
  implication: string;        // 「だから何？」の答え
  confidence: 'high' | 'medium' | 'low';
  sourceMessages: string[];   // 根拠となった対話メッセージ
};

type SlideInsight = {
  slideId: string;
  primaryInsight: Insight;    // このスライドの核心メッセージ
  supportingInsights: Insight[];
  messageHierarchy: {
    headline: string;         // タイトル直下の1行メッセージ
    subMessages: string[];    // 補足メッセージ
  };
};
```

#### インサイト抽出のプロンプト設計

```typescript
const INSIGHT_EXTRACTION_PROMPT = `あなたはマッキンゼーのシニアパートナーレベルの戦略コンサルタントです。
以下の対話履歴から、クライアントに価値を提供できる「インサイト（洞察）」を抽出してください。

## インサイトの定義
インサイトとは、「表面的な情報の羅列」ではなく、以下の要素を含む深い洞察です：

1. **So What?（だから何？）への明確な回答**
   - 事実の羅列ではなく、その事実が意味することを言語化
   - 「Xである。だから、Yすべき」という形式

2. **パターン認識**
   - 複数の事象から共通するパターンを発見
   - 「一見無関係に見えるAとBには、実はCという共通点がある」

3. **因果関係の明確化**
   - 表面的な問題と根本原因を区別
   - 「問題Xの真因は、実はYである」

4. **実行可能な示唆**
   - 「だからこうすべき」という具体的なアクション
   - 優先順位が明確

## 抽出すべきインサイト（各セクションごと）

### 現状認識セクション
- 業界/市場のパターン認識
- クライアント固有の状況の本質
- 問題の根本原因仮説

### 課題設定セクション
- なぜこの課題が「今」「この会社に」クリティカルなのか
- 課題間の優先順位とその理由
- 放置した場合の具体的なリスク

### ToBe像セクション
- 目標の「なぜ」（Why this target?）
- 達成時のインパクト（定量化可能な場合は数値で）
- 成功の定義（何をもって成功とするか）

### アプローチセクション
- なぜこのアプローチが最適なのか（他の選択肢との比較）
- 各ステップの「狙い」と「期待効果」
- 想定されるリスクと対処法

## 出力形式
各インサイトは以下の形式で出力してください：

{
  "insights": {
    "currentRecognition": {
      "primaryInsight": {
        "headline": "1行で言い切るメッセージ（20字以内）",
        "soWhat": "だから何？への回答",
        "evidence": ["根拠1", "根拠2"],
        "type": "pattern_recognition | root_cause | implication"
      },
      "supportingInsights": [...]
    },
    ...
  }
}
`;
```

#### スライドへの自動適用

```typescript
// 各スライドにインサイトを反映
function applyInsightToSlide(slide: SlideElement, insight: SlideInsight): SlideElement {
  return {
    ...slide,
    // タイトルはそのまま
    title: slide.title,
    // メインメッセージをインサイトのheadlineに
    mainMessage: insight.primaryInsight.headline,
    // 補足情報をsubtitleに
    subtitle: insight.primaryInsight.implication,
    // ボディにはevidenceを構造化して配置
    content: {
      ...slide.content,
      bullets: insight.primaryInsight.evidence,
    },
  };
}
```

---

## 壁②「微調整の壁」の突破

### 問題の深掘り
- プロは「オブジェクトの整列」「フォントの統一」「色の使い分け」に1ピクセル単位でこだわる
- AIが作ったレイアウトを修正するくらいなら、最初から自分で作った方が早い

### 突破機能：**インタラクティブ構造エディタ**

#### 機能概要
生成されたスライド構造を、**ドラッグ＆ドロップで直感的に編集**できる機能

#### 実装案

```typescript
// components/slide/StructureEditor.tsx

type EditableElement = {
  id: string;
  type: 'title' | 'message' | 'bullet' | 'diagram' | 'chart';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    color: string;
    alignment: 'left' | 'center' | 'right';
  };
};

type EditAction =
  | { type: 'move'; elementId: string; newPosition: { x: number; y: number } }
  | { type: 'resize'; elementId: string; newSize: { width: number; height: number } }
  | { type: 'edit_text'; elementId: string; newContent: string }
  | { type: 'change_style'; elementId: string; style: Partial<EditableElement['style']> }
  | { type: 'reorder'; elementIds: string[] }  // 箇条書きの順序変更
  | { type: 'add'; element: EditableElement }
  | { type: 'delete'; elementId: string };

// 編集履歴（Undo/Redo対応）
type EditHistory = {
  past: EditAction[];
  present: SlideStructure;
  future: EditAction[];
};
```

#### UI設計

```
┌────────────────────────────────────────────────────────────┐
│ [← 戻る] スライド構造エディタ          [リセット] [保存]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ドラッグして                                         │  │
│  │ 要素を移動  ┌─────────────────────────────────────┐ │  │
│  │            │ 課題の本質は〇〇にある               │ │  │
│  │            │ ← クリックで編集                    │ │  │
│  │            └─────────────────────────────────────┘ │  │
│  │                                                     │  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐     │  │
│  │  │ 原因A    │ → │ 原因B    │ → │ 結果     │     │  │
│  │  │ [編集]   │    │ [編集]   │    │ [編集]   │     │  │
│  │  └──────────┘    └──────────┘    └──────────┘     │  │
│  │        ↑ ドラッグで位置調整可能                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ 編集パネル ─────────────────────────────────────────┐  │
│  │ フォントサイズ: [24px ▼]  色: [■ primary ▼]         │  │
│  │ 整列: [左寄せ] [中央] [右寄せ]                       │  │
│  │ 余白: [狭い] [普通] [広い]                           │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

#### 主要機能

1. **要素の直接編集**: テキストをクリックして即座に編集
2. **ドラッグ＆ドロップ**: 要素の位置を自由に調整
3. **スマートガイド**: 他の要素との整列をガイド表示
4. **スタイルパネル**: フォント、色、サイズを一括変更
5. **Undo/Redo**: 操作履歴で安心して試行錯誤
6. **プリセット適用**: 「整列を揃える」「余白を統一」などワンクリック

---

## 壁③「ストーリーテリングの壁」の突破

### 問題の深掘り
- 戦略コンサルのスライドは、全体のストーリー（起承転結）が緻密に設計されている
- AIはスライド単体の生成は得意だが、資料全体を通して相手を説得する流れを構築する点が弱い

### 突破機能：**ナラティブ・アーキテクト**

#### 機能概要
提案書全体の**ストーリーライン（説得の流れ）**を設計・可視化・最適化する機能

#### 実装案

```typescript
// types/narrative.ts

// ストーリー構造のタイプ
type NarrativeStructure =
  | 'problem_solution'      // 問題→解決策
  | 'situation_complication_resolution'  // SCR（マッキンゼー式）
  | 'why_what_how'          // なぜ→何を→どうやって
  | 'past_present_future'   // 過去→現在→未来
  | 'challenge_opportunity' // 課題→機会
  | 'custom';               // カスタム

// ストーリーの各パート
type StoryPart = {
  id: string;
  role: 'hook' | 'context' | 'tension' | 'resolution' | 'call_to_action';
  purpose: string;          // このパートの目的
  keyMessage: string;       // 伝えるべきメッセージ
  slides: string[];         // 含まれるスライドID
  emotionalTarget: 'concern' | 'hope' | 'urgency' | 'confidence' | 'action';
  transitionTo?: string;    // 次のパートへの接続文
};

// ストーリーライン全体
type Storyline = {
  structure: NarrativeStructure;
  audienceProfile: {
    role: string;           // 「経営企画部長」など
    concerns: string[];     // 気にしていること
    decisionCriteria: string[];  // 意思決定基準
  };
  parts: StoryPart[];
  overarchingMessage: string;  // 全体を通じて伝えたい1つのメッセージ
};

// スライド間の接続
type SlideTransition = {
  fromSlideId: string;
  toSlideId: string;
  transitionType: 'therefore' | 'however' | 'furthermore' | 'specifically' | 'as_a_result';
  bridgeSentence: string;   // 「したがって」「しかし」「具体的には」などの接続
};
```

#### ストーリー設計のプロンプト

```typescript
const NARRATIVE_DESIGN_PROMPT = `あなたは戦略コンサルティングファームのディレクターです。
以下の提案書骨子から、聴衆を説得するための最適なストーリーラインを設計してください。

## ストーリーテリングの原則

### 1. ピラミッド構造（バーバラ・ミント）
- 結論を先に述べ、その後に根拠を展開
- 各スライドは「1スライド1メッセージ」
- メッセージは階層構造で論理的に繋がる

### 2. SCR構造（Situation-Complication-Resolution）
- Situation: 聴衆が「そうだよね」と頷く現状認識
- Complication: 「でも、このままだと...」という緊張感
- Resolution: 「だから、こうすべき」という解決策

### 3. 感情曲線の設計
- 聴衆の感情は一定ではなく、意図的に上下させる
- 危機感（Concern）→ 希望（Hope）→ 緊急性（Urgency）→ 自信（Confidence）→ 行動（Action）

### 4. ブリッジ（接続）の重要性
各スライド間は明確な接続詞で繋がる：
- 「したがって」（Therefore）: 論理的帰結
- 「しかし」（However）: 反転・問題提起
- 「さらに」（Furthermore）: 追加情報
- 「具体的には」（Specifically）: 詳細化
- 「その結果」（As a result）: 因果

## 設計すべき内容

1. **全体構造の選択**
   - どのナラティブ構造が最適か
   - なぜその構造が効果的か

2. **各パートの目的**
   - Hook（掴み）: 最初の30秒で関心を引く
   - Context（文脈）: 背景情報を共有
   - Tension（緊張）: 「このままではまずい」を伝える
   - Resolution（解決）: 解決策を提示
   - Call to Action: 具体的な次のアクション

3. **スライド間の接続**
   - 各スライドが「なぜこの順番か」を明確に
   - 接続詞とブリッジセンテンスを設計

4. **感情曲線**
   - どのタイミングで危機感を高め、希望を与えるか
   - 最終的に行動を促すための感情設計
`;
```

#### ストーリーライン・ビジュアライザ

```
┌────────────────────────────────────────────────────────────┐
│ ストーリーライン設計                                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  全体メッセージ: 「デジタル変革により、3年で業界No.1へ」     │
│                                                            │
│  ┌─ ストーリー構造 ─────────────────────────────────────┐  │
│  │                                                       │  │
│  │   [Hook]        [Context]      [Tension]             │  │
│  │   表紙・導入 → 現状認識 → 課題設定                   │  │
│  │       ↓            ↓           ↓                    │  │
│  │   「注目を       「共感を      「危機感を            │  │
│  │    引く」        得る」        高める」              │  │
│  │                                                       │  │
│  │        ┌──────────────────────────────────┐          │  │
│  │        ↓                                  ↓          │  │
│  │   [Resolution]                    [Call to Action]   │  │
│  │   ToBe像 → アプローチ → スケジュール → Next Step   │  │
│  │       ↓           ↓                       ↓          │  │
│  │   「希望を      「自信を                「行動を     │  │
│  │    見せる」     与える」                促す」       │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ 感情曲線 ────────────────────────────────────────────┐  │
│  │        ↗ 希望                                        │  │
│  │   緊張 ↗                        ↗ 自信              │  │
│  │       ↗                    ↗                        │  │
│  │  ──────↗────────↘危機感↗────────────→ 行動         │  │
│  │  関心           ↘    ↗                              │  │
│  │                  ↘↗                                 │  │
│  │  ─────────────────────────────────────────────────→  │  │
│  │  Slide1  2  3  4  5  6  7  8  9  10  11  12         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ スライド接続 ───────────────────────────────────────┐  │
│  │ 1→2: 「しかし、この成長も...」                       │  │
│  │ 2→3: 「その根本原因を分析すると...」                 │  │
│  │ 3→4: 「したがって、最優先で取り組むべきは...」       │  │
│  │ ...                                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

#### スライド接続チェッカー

```typescript
// 各スライド間の論理的接続をチェック
function checkSlideTransitions(slides: SlideElement[], storyline: Storyline): TransitionCheck[] {
  return slides.map((slide, index) => {
    if (index === 0) return { slideId: slide.id, status: 'ok' };

    const prevSlide = slides[index - 1];
    const transition = storyline.transitions.find(
      t => t.fromSlideId === prevSlide.id && t.toSlideId === slide.id
    );

    if (!transition) {
      return {
        slideId: slide.id,
        status: 'warning',
        message: `前のスライド「${prevSlide.title}」との接続が不明確です`,
        suggestion: suggestTransition(prevSlide, slide),
      };
    }

    return { slideId: slide.id, status: 'ok', transition };
  });
}

// 接続の提案
function suggestTransition(from: SlideElement, to: SlideElement): string {
  // AIを使って最適な接続詞とブリッジセンテンスを提案
  // 例: 「課題設定」→「ToBe像」なら「したがって、目指すべき姿は...」
}
```

---

## MVP実装計画

### Phase 1: インサイト・エンジン（壁①）
**目的**: 「So What?」を自動生成し、各スライドのメッセージを強化

1. `/api/extract-insights` エンドポイント追加
2. 骨子編集ページにインサイト表示
3. スライドへのインサイト自動適用

### Phase 2: ナラティブ・アーキテクト（壁③）
**目的**: 資料全体のストーリーラインを設計・可視化

1. `/api/design-narrative` エンドポイント追加
2. ストーリーライン・ビジュアライザ画面
3. スライド間接続チェッカー
4. 感情曲線エディタ

### Phase 3: インタラクティブ構造エディタ（壁②）
**目的**: 生成されたスライドを直感的に編集

1. ドラッグ＆ドロップ対応エディタ
2. スタイルパネル
3. スマートガイド
4. Undo/Redo

---

## 競合との差別化

| 機能 | Gamma | Copilot | このツール |
|---|---|---|---|
| スライド生成 | ○ | ○ | ○ |
| **インサイト抽出** | × | × | ◎（戦略コンサルレベル）|
| **ストーリーライン設計** | × | × | ◎（SCR構造、感情曲線）|
| **論理構造の可視化** | × | × | ◎（接続チェッカー）|
| 微調整UI | △ | △ | ○（Phase 3で実装）|

---

## 結論

このツールが目指すのは**「60点を100点に引き上げる」**ための機能群です。

1. **インサイト・エンジン**: 「So What?」を自動生成 → 構造化の壁を突破
2. **ナラティブ・アーキテクト**: ストーリーライン設計 → ストーリーテリングの壁を突破
3. **インタラクティブ構造エディタ**: 直感的な編集UI → 微調整の壁を突破

これにより、「AIは優秀な『アシスタント』」から**「AIは戦略コンサルの『パートナー』」**へと進化させます。
