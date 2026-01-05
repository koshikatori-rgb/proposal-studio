# 提案書作成アプリ - 引き継ぎドキュメント

最終更新: 2026-01-05

## プロジェクト概要

戦略コンサルティング向けの提案書作成支援アプリ。AI対話を通じて課題を深掘りし、ストーリーライン（スライド構成）を構築、最終的にPowerPointとしてエクスポートする。

## 現在のワークフロー（5ステップ）

```
ステップ1: AI対話 (/proposal/[id]/chat)
    ↓ 課題の深掘り・ストーリーライン構築
ステップ2: ストーリー編集 (/proposal/[id]/story)
    ↓ スライド構成の確認・編集・整合性チェック
ステップ3: レイアウト設計 (/proposal/[id]/layout)
    ↓ 各スライドのビジュアル表現を選択
ステップ4: ドラフト確認 (/proposal/[id]/draft)
    ↓ 最終確認・微調整
ステップ5: エクスポート (/proposal/[id]/export)
    ↓ PowerPoint出力
```

## 主要ファイル構成

### プロンプト（外部化済み）
```
lib/prompts/
├── chatSystemPrompt.ts      # AI対話用プロンプト（Phase A）
└── visualDesignPrompt.ts    # 視覚化設計プロンプト（Phase B）
```

### API
```
app/api/
├── chat/route.ts            # AI対話API（chatSystemPromptを使用）
├── design-visual/route.ts   # 視覚化設計API（visualDesignPromptを使用）
├── extract/route.ts         # テキストからスライド構造を抽出
├── check-story-coherence/   # ストーリー整合性チェック
└── ...
```

### ページ
```
app/proposal/[id]/
├── chat/page.tsx            # ステップ1: AI対話
├── story/page.tsx           # ステップ2: ストーリー編集
├── layout/page.tsx          # ステップ3: レイアウト設計
├── draft/page.tsx           # ステップ4: ドラフト確認
└── export/page.tsx          # ステップ5: エクスポート
```

### コンポーネント
```
components/
├── common/
│   ├── Button.tsx
│   ├── Card.tsx
│   └── StepIndicator.tsx    # 5ステップナビゲーション
├── outline/
│   ├── ChatInterface.tsx    # AI対話UI
│   └── SlideTreeView.tsx    # スライド一覧（ドラッグ＆ドロップ対応）
├── story/
│   └── StoryCoherencePanel.tsx  # ストーリー整合性チェックパネル
└── slide/
    └── VisualPatternPreview.tsx # ビジュアルパターンプレビュー
```

## プロンプト設計

### Phase A: AI対話プロンプト (`chatSystemPrompt.ts`)

**目的**: 対話を通じて課題を深掘りし、ストーリーライン（スライド構成）を構築

**特徴**:
- 3往復（6メッセージ）未満は構成案出力を禁止
- ヒアリングフェーズ必須（真因特定、ステークホルダー分析、期待値調整、リスク要因）
- 明示的な作成指示があって初めて構成案を出力

**出力形式**:
```
【ストーリーライン全体像】
...

**Slide 1. タイトル**
> **Governing Thought (キーメッセージ):**
> ...

**Logical Structure (論理の骨組み):**
* ...
```

### Phase B: 視覚化設計プロンプト (`visualDesignPrompt.ts`)

**目的**: スライドの論理構成を分析し、ビジュアル表現を決定

**使用タイミング**: ステップ3（レイアウト設計）の「AI推奨を取得」ボタン

**出力形式**: JSON配列
```json
[
  {
    "slide_no": 1,
    "ui_recommendation": {
      "mode": "single|composite",
      "primary_pattern_id": "process|hierarchy|...",
      "rationale": "..."
    },
    "generative_instruction": {
      "layout_composition": "...",
      "visual_metaphor_prompt": "...",
      "zones": [...]
    }
  }
]
```

## 直近の実装完了事項

### 2025-12-26

1. **プロンプトの外部化**
   - `lib/prompts/chatSystemPrompt.ts` 作成
   - `lib/prompts/visualDesignPrompt.ts` 作成
   - API側でハードコーディングされていたプロンプトを外部ファイルから読み込むように変更

2. **ストーリー編集ページの改善**
   - `StoryCoherencePanel`（整合性チェック）を復活
   - ストーリーフロー確認モードでアイコンクリック時の動作を変更（編集モードに遷移せず、同じ画面内でスライド詳細を表示）

3. **レイアウトページのバグ修正**
   - `useEffect`の依存配列修正
   - スライドが空の場合のフォールバックUI追加
   - ストーリー編集ページでスライド生成時に`hasChanges`フラグを設定

4. **AI対話プロンプトの改善**
   - 対話回数に応じた動的プロンプト生成
   - 3往復未満での構成案出力を禁止

### 2026-01-05

1. **旧ページの削除・整理**
   - `/review`, `/outline`, `/outline-edit`, `/slides` ページを削除
   - dashboard からの遷移先を `/review` → `/story` に修正
   - 5ステップワークフローに統一

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npx tsc --noEmit
```

## 環境変数

```
ANTHROPIC_API_KEY=sk-ant-...
```

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API (claude-sonnet-4-20250514)
- dnd-kit (ドラッグ＆ドロップ)
- PptxGenJS (PowerPoint生成)
- LocalStorage (データ永続化)

## データモデル

### Proposal
```typescript
type Proposal = {
  id: string;
  title: string;
  outline?: Outline;           // 骨子情報
  slides: SlideElement[];      // スライド配列
  createdAt: number;
  updatedAt: number;
};
```

### SlideElement
```typescript
type SlideElement = {
  id: string;
  type: SlideType;
  title: string;
  mainMessage?: string;        // キーメッセージ
  content?: {
    body?: string;
    bullets?: string[];
  };
  visualHint?: VisualHintType; // ビジュアル表現タイプ
  // ...
};
```

## 参考資料

- [MVP_WALL_BREAKER.md](./MVP_WALL_BREAKER.md) - MVP仕様
- [specs/requirements.md](../specs/requirements.md) - 要件定義
- [specs/design.md](../specs/design.md) - 設計ドキュメント
