# 実装タスク

**プロジェクト名**: 戦略コンサルタント提案作成ツール
**作成日**: 2025-12-07

---

## 📋 タスク概要

### 全体の進め方

```
Phase 1: 環境セットアップ（10-15分）
    ↓
Phase 2: 基盤実装（30-45分）
    ↓
Phase 3: 骨子作成機能（90-120分）
    ↓
Phase 4: スライド選択・生成機能（60-90分）
    ↓
Phase 5: エクスポート機能（45-60分）
    ↓
Phase 6: UI/UX改善（30-45分）
    ↓
Phase 7: テスト・デプロイ（15-20分）
```

### 推定時間
- **合計**: 約4-6時間（MVP完成まで）
- **Phase 1**: 10-15分
- **Phase 2**: 30-45分
- **Phase 3**: 90-120分
- **Phase 4**: 60-90分
- **Phase 5**: 45-60分
- **Phase 6**: 30-45分
- **Phase 7**: 15-20分

---

## Phase 1: 環境セットアップ（10-15分）

### 1.1 Next.jsプロジェクトの作成

**タスク**: Next.js 14プロジェクトを初期化

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

**選択肢**:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- import alias: No（デフォルトの@/で良い）

**完了条件**:
- [ ] プロジェクトが生成される
- [ ] `npm run dev` でローカルサーバーが起動する（http://localhost:3000）
- [ ] デフォルトのNext.jsページが表示される

---

### 1.2 必要パッケージのインストール

**タスク**: プロジェクトに必要な依存関係をインストール

```bash
npm install @anthropic-ai/sdk pptxgenjs uuid
npm install -D @types/uuid
```

**パッケージ説明**:
- `@anthropic-ai/sdk`: Claude API統合
- `pptxgenjs`: PowerPoint生成
- `uuid`: ユニークID生成
- `@types/uuid`: uuidの型定義

**完了条件**:
- [ ] すべてのパッケージがインストールされる
- [ ] `package.json`に依存関係が追加される
- [ ] TypeScriptエラーがない

---

### 1.3 ディレクトリ構成の作成

**タスク**: プロジェクトのディレクトリ構造を作成

```bash
mkdir -p app/dashboard
mkdir -p app/proposal/\[id\]/outline
mkdir -p app/proposal/\[id\]/slides
mkdir -p app/proposal/\[id\]/export
mkdir -p app/api/chat
mkdir -p app/api/export/pptx
mkdir -p components/layout
mkdir -p components/outline
mkdir -p components/slides
mkdir -p components/export
mkdir -p components/common
mkdir -p lib
mkdir -p hooks
mkdir -p types
```

**完了条件**:
- [ ] すべてのディレクトリが作成される
- [ ] プロジェクト構造が@specs/design.mdと一致する

---

### 1.4 環境変数の設定

**タスク**: `.env.local`ファイルを作成し、環境変数を設定

```bash
# .env.local
ANTHROPIC_API_KEY=your_api_key_here
```

**完了条件**:
- [ ] `.env.local`ファイルが作成される
- [ ] `.gitignore`に`.env.local`が含まれている（create-next-appで自動設定済み）
- [ ] Anthropic APIキーを取得・設定する（https://console.anthropic.com/）

**参照**:
- Anthropic Console: https://console.anthropic.com/
- @specs/design.md のセキュリティ設計

---

### 1.5 Gitコミット

**タスク**: 初期セットアップをコミット

```bash
git add .
git commit -m "feat: プロジェクト初期セットアップ（Next.js + 依存関係）"
```

**完了条件**:
- [ ] すべての変更がコミットされる
- [ ] `.env.local`はコミットされない（.gitignoreで除外）

---

## Phase 2: 基盤実装（30-45分）

### 2.1 型定義の作成

**タスク**: `types/index.ts`を作成し、全体で使用する型を定義

**参照**: @specs/design.md のデータモデル

```typescript
// types/index.ts
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

// ... その他の型定義（@specs/design.mdから全てコピー）
```

**完了条件**:
- [ ] `types/index.ts`が作成される
- [ ] すべての型定義が含まれる（Proposal, Outline, SlideElement等）
- [ ] TypeScriptエラーがない

**依存**: なし

---

### 2.2 ローカルストレージユーティリティの作成

**タスク**: `lib/storage.ts`を作成し、localStorage操作関数を実装

**参照**: @specs/design.md の状態管理

```typescript
// lib/storage.ts
import type { Proposal, ChatSession } from '@/types';

export const STORAGE_KEYS = {
  PROPOSALS: 'proposals',
  CURRENT_PROPOSAL_ID: 'currentProposalId',
  CHAT_SESSIONS: 'chatSessions',
  SETTINGS: 'settings',
};

export const saveProposal = (proposal: Proposal): void => {
  // 実装
};

export const getProposals = (): Proposal[] => {
  // 実装
};

// ... その他の関数
```

**完了条件**:
- [ ] `lib/storage.ts`が作成される
- [ ] CRUD操作（作成、読取、更新、削除）が実装される
- [ ] TypeScriptエラーがない

**依存**: 2.1

---

### 2.3 ユーティリティ関数の作成

**タスク**: `lib/utils.ts`を作成し、共通ユーティリティを実装

```typescript
// lib/utils.ts
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => {
  return uuidv4();
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('ja-JP');
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
```

**完了条件**:
- [ ] `lib/utils.ts`が作成される
- [ ] ID生成、日付フォーマット、クラス名結合の関数が実装される
- [ ] TypeScriptエラーがない

**依存**: なし

---

### 2.4 共通コンポーネントの作成

**タスク**: 共通UIコンポーネントを作成

#### 2.4.1 Button

```typescript
// components/common/Button.tsx
type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
};

export const Button: React.FC<ButtonProps> = ({ ... }) => {
  // 実装
};
```

#### 2.4.2 Input

```typescript
// components/common/Input.tsx
type InputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
};

export const Input: React.FC<InputProps> = ({ ... }) => {
  // 実装
};
```

#### 2.4.3 Card

```typescript
// components/common/Card.tsx
type CardProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ ... }) => {
  // 実装
};
```

**完了条件**:
- [ ] Button, Input, Cardコンポーネントが作成される
- [ ] Tailwind CSSでスタイリングされる
- [ ] TypeScriptエラーがない

**依存**: なし

---

### 2.5 レイアウトコンポーネントの作成

**タスク**: Header, Sidebar, Footerコンポーネントを作成

```typescript
// components/layout/Header.tsx
export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">
          戦略コンサルタント提案作成ツール
        </h1>
      </div>
    </header>
  );
};
```

**完了条件**:
- [ ] Header, Sidebar, Footerコンポーネントが作成される
- [ ] レスポンシブデザインが考慮される
- [ ] TypeScriptエラーがない

**依存**: 2.4

---

### 2.6 Gitコミット

```bash
git add .
git commit -m "feat: 基盤実装（型定義、ストレージ、共通コンポーネント）"
```

**完了条件**:
- [ ] すべての変更がコミットされる

---

## Phase 3: 骨子作成機能（90-120分）

### 3.1 カスタムフック: useProposal

**タスク**: `hooks/useProposal.ts`を作成

**参照**: @specs/design.md のカスタムフック

```typescript
// hooks/useProposal.ts
export const useProposal = (id: string) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  // 実装
};
```

**完了条件**:
- [ ] `hooks/useProposal.ts`が作成される
- [ ] proposal取得、更新機能が実装される
- [ ] TypeScriptエラーがない

**依存**: 2.1, 2.2

**参照**: @specs/requirements.md US-1, US-2, US-3

---

### 3.2 カスタムフック: useChat

**タスク**: `hooks/useChat.ts`を作成

**参照**: @specs/design.md のカスタムフック

```typescript
// hooks/useChat.ts
export const useChat = (proposalId: string, section: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => {
    // 実装
  };

  return { messages, sendMessage, loading };
};
```

**完了条件**:
- [ ] `hooks/useChat.ts`が作成される
- [ ] メッセージ送信、受信機能が実装される
- [ ] TypeScriptエラーがない

**依存**: 2.1

**参照**: @specs/requirements.md US-1, US-2, US-3

---

### 3.3 Claude API統合

**タスク**: `app/api/chat/route.ts`を作成

**参照**: @specs/design.md のAPI設計

```typescript
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { messages, section } = await request.json();

  const systemPrompt = getSystemPrompt(section);

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return Response.json({
      content: response.content[0].text,
    });
  } catch (error) {
    console.error('Claude API error:', error);
    return Response.json({ error: 'AI処理に失敗しました' }, { status: 500 });
  }
}

function getSystemPrompt(section: string): string {
  // @specs/design.mdのシステムプロンプトを実装
}
```

**完了条件**:
- [ ] `app/api/chat/route.ts`が作成される
- [ ] Claude APIとの連携が実装される
- [ ] セクションごとのシステムプロンプトが設定される
- [ ] エラーハンドリングが実装される

**依存**: 1.4（環境変数）

**参照**: @specs/design.md のAPI設計、@specs/requirements.md US-1, US-2, US-3

---

### 3.4 ChatInterfaceコンポーネント

**タスク**: `components/outline/ChatInterface.tsx`を作成

```typescript
// components/outline/ChatInterface.tsx
type ChatInterfaceProps = {
  proposalId: string;
  section: 'current_recognition' | 'issue_setting' | 'tobe_vision' | 'approach';
  onUpdate: (data: any) => void;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ ... }) => {
  const { messages, sendMessage, loading } = useChat(proposalId, section);

  // 実装
};
```

**完了条件**:
- [ ] `components/outline/ChatInterface.tsx`が作成される
- [ ] メッセージ送受信UIが実装される
- [ ] ローディング状態が表示される
- [ ] レスポンシブデザインが考慮される

**依存**: 3.2

**参照**: @specs/requirements.md US-1, US-2, US-3

---

### 3.5 OutlineFormコンポーネント

**タスク**: `components/outline/OutlineForm.tsx`を作成

```typescript
// components/outline/OutlineForm.tsx
type OutlineFormProps = {
  proposalId: string;
  outline: Outline;
  onUpdate: (outline: Outline) => void;
};

export const OutlineForm: React.FC<OutlineFormProps> = ({ ... }) => {
  // 実装
};
```

**完了条件**:
- [ ] `components/outline/OutlineForm.tsx`が作成される
- [ ] 骨子入力フォームが実装される
- [ ] バリデーションが実装される
- [ ] 自動保存機能が実装される（debounce 500ms）

**依存**: 2.4, 3.1

**参照**: @specs/requirements.md US-1, US-2, US-3

---

### 3.6 CurrentRecognitionコンポーネント

**タスク**: `components/outline/CurrentRecognition.tsx`を作成

**現状認識セクション**:
- 業界/会社概要
- 背景レイヤー選択
- 顕在化している問題
- 原因仮説

**完了条件**:
- [ ] `components/outline/CurrentRecognition.tsx`が作成される
- [ ] 現状認識入力フォームが実装される
- [ ] ChatInterfaceとの連携が実装される

**依存**: 3.4, 3.5

**参照**: @specs/requirements.md US-1

---

### 3.7 IssueSettingコンポーネント

**タスク**: `components/outline/IssueSetting.tsx`を作成

**課題仮説セクション**:
- クリティカルな課題の選択
- イシューツリー（任意）

**完了条件**:
- [ ] `components/outline/IssueSetting.tsx`が作成される
- [ ] 課題入力フォームが実装される
- [ ] ChatInterfaceとの連携が実装される

**依存**: 3.4, 3.5

**参照**: @specs/requirements.md US-2

---

### 3.8 ToBeVisionコンポーネント

**タスク**: `components/outline/ToBeVision.tsx`を作成

**ToBe像セクション**:
- 将来の目指すべき姿
- プロジェクトゴール
- プロジェクトスコープ

**完了条件**:
- [ ] `components/outline/ToBeVision.tsx`が作成される
- [ ] ToBe像入力フォームが実装される
- [ ] ChatInterfaceとの連携が実装される

**依存**: 3.4, 3.5

**参照**: @specs/requirements.md US-3

---

### 3.9 骨子作成ページ

**タスク**: `app/proposal/[id]/outline/page.tsx`を作成

```typescript
// app/proposal/[id]/outline/page.tsx
export default function OutlinePage({ params }: { params: { id: string } }) {
  const { proposal, updateProposal } = useProposal(params.id);

  // 実装
}
```

**完了条件**:
- [ ] 骨子作成ページが作成される
- [ ] 3つのセクション（現状認識、課題仮説、ToBe像）が統合される
- [ ] ステップ間のナビゲーションが実装される
- [ ] 次のステップ（スライド選択）へ進めるボタンが実装される

**依存**: 3.1, 3.6, 3.7, 3.8

**参照**: @specs/requirements.md US-1, US-2, US-3

---

### 3.10 Gitコミット

```bash
git add .
git commit -m "feat: 骨子作成機能（AI対話、現状認識、課題仮説、ToBe像）"
```

**完了条件**:
- [ ] すべての変更がコミットされる

---

## Phase 4: スライド選択・生成機能（60-90分）

### 4.1 スライド生成ロジック

**タスク**: `lib/slideGenerator.ts`を作成

```typescript
// lib/slideGenerator.ts
import type { Outline, SlideElement } from '@/types';

export const generateSlides = (outline: Outline): SlideElement[] => {
  const slides: SlideElement[] = [];

  // 必須スライド生成
  slides.push(generateExecutiveSummary(outline));
  slides.push(generateCurrentRecognition(outline));
  slides.push(generateIssueSetting(outline));
  slides.push(generateToBeVision(outline));
  slides.push(generateProjectGoal(outline));
  slides.push(generateApproachOverview(outline));
  // ... その他の必須スライド

  return slides;
};

const generateExecutiveSummary = (outline: Outline): SlideElement => {
  return {
    id: generateId(),
    type: 'executive_summary',
    order: 1,
    title: 'エグゼクティブサマリー',
    mainMessage: '本提案の要点',
    content: {
      bullets: [
        `クライアント課題: ${outline.issueSetting.criticalIssues[0]}`,
        `目指すべき姿: ${outline.toBeVision.vision}`,
        `アプローチ: ${outline.approach.overview}`,
      ],
    },
    isRequired: true,
  };
};

// ... その他のスライド生成関数
```

**完了条件**:
- [ ] `lib/slideGenerator.ts`が作成される
- [ ] すべての必須スライド生成関数が実装される
- [ ] 1スライド1メッセージの原則が守られる
- [ ] TypeScriptエラーがない

**依存**: 2.1, 2.3

**参照**: @specs/requirements.md US-4

---

### 4.2 SlideSelectorコンポーネント

**タスク**: `components/slides/SlideSelector.tsx`を作成

```typescript
// components/slides/SlideSelector.tsx
type SlideSelectorProps = {
  slides: SlideElement[];
  onToggle: (slideId: string) => void;
  onReorder: (slides: SlideElement[]) => void;
};

export const SlideSelector: React.FC<SlideSelectorProps> = ({ ... }) => {
  // 実装
};
```

**完了条件**:
- [ ] `components/slides/SlideSelector.tsx`が作成される
- [ ] 必須スライドと任意スライドが区別される
- [ ] スライドの選択/解除が実装される
- [ ] ドラッグ&ドロップでの並び替えが実装される（またはボタンでの順序変更）

**依存**: 2.4

**参照**: @specs/requirements.md US-4

---

### 4.3 SlidePreviewコンポーネント

**タスク**: `components/slides/SlidePreview.tsx`を作成

```typescript
// components/slides/SlidePreview.tsx
type SlidePreviewProps = {
  slide: SlideElement;
  colors: ColorScheme;
};

export const SlidePreview: React.FC<SlidePreviewProps> = ({ ... }) => {
  // 実装（簡易プレビュー）
};
```

**完了条件**:
- [ ] `components/slides/SlidePreview.tsx`が作成される
- [ ] スライドの簡易プレビューが表示される
- [ ] タイトル、メインメッセージ、コンテンツが表示される
- [ ] カラースキームが適用される

**依存**: 2.1

**参照**: @specs/requirements.md US-4

---

### 4.4 スライド選択ページ

**タスク**: `app/proposal/[id]/slides/page.tsx`を作成

```typescript
// app/proposal/[id]/slides/page.tsx
export default function SlidesPage({ params }: { params: { id: string } }) {
  const { proposal, updateProposal } = useProposal(params.id);
  const [slides, setSlides] = useState<SlideElement[]>([]);

  useEffect(() => {
    if (proposal && proposal.slides.length === 0) {
      // 骨子から初回スライド生成
      const generatedSlides = generateSlides(proposal.outline);
      setSlides(generatedSlides);
      updateProposal({ slides: generatedSlides });
    } else if (proposal) {
      setSlides(proposal.slides);
    }
  }, [proposal]);

  // 実装
}
```

**完了条件**:
- [ ] スライド選択ページが作成される
- [ ] 骨子から自動スライド生成が実装される
- [ ] スライド選択・並び替え機能が実装される
- [ ] プレビュー表示が実装される
- [ ] 次のステップ（エクスポート）へ進めるボタンが実装される

**依存**: 3.1, 4.1, 4.2, 4.3

**参照**: @specs/requirements.md US-4

---

### 4.5 Gitコミット

```bash
git add .
git commit -m "feat: スライド選択・生成機能"
```

**完了条件**:
- [ ] すべての変更がコミットされる

---

## Phase 5: エクスポート機能（45-60分）

### 5.1 PPTXエクスポートAPI

**タスク**: `app/api/export/pptx/route.ts`を作成

**参照**: @specs/design.md のAPI設計

```typescript
// app/api/export/pptx/route.ts
import PptxGenJS from 'pptxgenjs';
import type { Proposal } from '@/types';

export async function POST(request: Request) {
  const { proposal } = await request.json();

  try {
    const pptx = new PptxGenJS();

    // スライド設定
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Strategy Consultant Tool';

    const colors = proposal.settings.colors;

    // スライド生成
    proposal.slides.forEach((slide: any) => {
      const pptxSlide = pptx.addSlide();

      // タイトル
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: colors.primary.replace('#', ''),
      });

      // メインメッセージ
      pptxSlide.addText(slide.mainMessage, {
        x: 0.5,
        y: 1.0,
        w: 9,
        h: 0.4,
        fontSize: 18,
        color: colors.accent.replace('#', ''),
      });

      // コンテンツ
      if (slide.content.bullets) {
        pptxSlide.addText(slide.content.bullets, {
          x: 0.5,
          y: 1.6,
          w: 9,
          h: 4,
          fontSize: 14,
          bullet: true,
          color: colors.text.replace('#', ''),
        });
      }

      if (slide.content.table) {
        pptxSlide.addTable(
          [slide.content.table.headers, ...slide.content.table.rows],
          {
            x: 0.5,
            y: 1.6,
            w: 9,
            colW: Array(slide.content.table.headers.length).fill(
              9 / slide.content.table.headers.length
            ),
            fontSize: 12,
          }
        );
      }
    });

    // ファイル生成
    const buffer = await pptx.write({ outputType: 'nodebuffer' });

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${proposal.title}.pptx"`,
      },
    });
  } catch (error) {
    console.error('PPTX generation error:', error);
    return Response.json(
      { error: 'PPTX生成に失敗しました' },
      { status: 500 }
    );
  }
}
```

**完了条件**:
- [ ] `app/api/export/pptx/route.ts`が作成される
- [ ] pptxgenjsでPPTX生成が実装される
- [ ] カラースキームが適用される
- [ ] ファイルダウンロードが実装される
- [ ] エラーハンドリングが実装される

**依存**: 1.2（pptxgenjs）

**参照**: @specs/requirements.md US-5

---

### 5.2 ExportPreviewコンポーネント

**タスク**: `components/export/ExportPreview.tsx`を作成

```typescript
// components/export/ExportPreview.tsx
type ExportPreviewProps = {
  slides: SlideElement[];
  colors: ColorScheme;
};

export const ExportPreview: React.FC<ExportPreviewProps> = ({ ... }) => {
  // 実装
};
```

**完了条件**:
- [ ] `components/export/ExportPreview.tsx`が作成される
- [ ] 全スライドのサムネイルプレビューが表示される
- [ ] スライド内容が確認できる

**依存**: 4.3

**参照**: @specs/requirements.md US-5

---

### 5.3 ExportButtonコンポーネント

**タスク**: `components/export/ExportButton.tsx`を作成

```typescript
// components/export/ExportButton.tsx
type ExportButtonProps = {
  proposal: Proposal;
  onExport: () => void;
};

export const ExportButton: React.FC<ExportButtonProps> = ({ ... }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposal.title}.pptx`;
      a.click();
      window.URL.revokeObjectURL(url);

      onExport();
    } catch (error) {
      console.error('Export error:', error);
      alert('エクスポートに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 実装
};
```

**完了条件**:
- [ ] `components/export/ExportButton.tsx`が作成される
- [ ] PPTXエクスポート処理が実装される
- [ ] ローディング状態が表示される
- [ ] ダウンロード完了後の処理が実装される

**依存**: 2.4

**参照**: @specs/requirements.md US-5

---

### 5.4 エクスポートページ

**タスク**: `app/proposal/[id]/export/page.tsx`を作成

```typescript
// app/proposal/[id]/export/page.tsx
export default function ExportPage({ params }: { params: { id: string } }) {
  const { proposal, updateProposal } = useProposal(params.id);

  const handleExport = () => {
    updateProposal({ status: 'completed' });
  };

  // 実装
}
```

**完了条件**:
- [ ] エクスポートページが作成される
- [ ] プレビュー表示が実装される
- [ ] エクスポートボタンが実装される
- [ ] エクスポート完了後、ステータスが更新される

**依存**: 3.1, 5.2, 5.3

**参照**: @specs/requirements.md US-5

---

### 5.5 Gitコミット

```bash
git add .
git commit -m "feat: PowerPointエクスポート機能"
```

**完了条件**:
- [ ] すべての変更がコミットされる

---

## Phase 6: UI/UX改善（30-45分）

### 6.1 ダッシュボードページ

**タスク**: `app/dashboard/page.tsx`を作成

**機能**:
- 提案書一覧表示
- 新規作成ボタン
- 各提案書へのリンク
- ステータス表示
- 削除機能

**完了条件**:
- [ ] ダッシュボードページが作成される
- [ ] 提案書一覧が表示される
- [ ] 新規作成、編集、削除機能が実装される
- [ ] レスポンシブデザインが実装される

**依存**: 2.2, 2.4, 2.5, 3.1

---

### 6.2 ランディングページ

**タスク**: `app/page.tsx`を更新

**機能**:
- ツール紹介
- 主要機能の説明
- ダッシュボードへのリンク

**完了条件**:
- [ ] ランディングページが作成される
- [ ] ツールの説明が表示される
- [ ] ダッシュボードへのCTAボタンが実装される

**依存**: 2.5

---

### 6.3 ステップナビゲーション

**タスク**: `components/layout/Sidebar.tsx`を更新

**機能**:
- 現在のステップ表示
- ステップ間の遷移
- 進捗バー

**完了条件**:
- [ ] サイドバーにステップナビゲーションが実装される
- [ ] 現在のステップがハイライトされる
- [ ] 完了したステップにチェックマークが表示される

**依存**: 2.5

---

### 6.4 レスポンシブ対応

**タスク**: モバイル・タブレット対応の調整

**対応範囲**:
- ハンバーガーメニュー（モバイル）
- サイドバー折りたたみ（タブレット）
- タッチターゲットサイズ調整（iPad）

**完了条件**:
- [ ] モバイル（〜768px）で適切に表示される
- [ ] タブレット（768px〜1024px）で適切に表示される
- [ ] デスクトップ（1024px〜）で適切に表示される

**依存**: すべてのコンポーネント

**参照**: @specs/design.md のレスポンシブデザイン

---

### 6.5 Gitコミット

```bash
git add .
git commit -m "feat: UI/UX改善（ダッシュボード、ナビゲーション、レスポンシブ）"
```

**完了条件**:
- [ ] すべての変更がコミットされる

---

## Phase 7: テスト・デプロイ（15-20分）

### 7.1 動作確認

**タスク**: ローカル環境でE2Eテスト

**テストシナリオ**:
1. ダッシュボードで新規提案書を作成
2. 骨子作成：現状認識、課題仮説、ToBe像を入力（AI対話を含む）
3. スライド選択：必須スライドの確認、任意スライドの選択
4. エクスポート：PPTXダウンロード、ファイル確認

**完了条件**:
- [ ] すべてのステップが正常に動作する
- [ ] PPTXファイルがダウンロードできる
- [ ] PPTXファイルがPowerPointで開ける
- [ ] スライド内容が正しい
- [ ] TypeScriptエラーがない
- [ ] Console エラーがない

**参照**: @specs/requirements.md の成功指標

---

### 7.2 ビルド確認

**タスク**: プロダクションビルドのテスト

```bash
npm run build
npm run start
```

**完了条件**:
- [ ] ビルドエラーがない
- [ ] プロダクションモードで動作する
- [ ] パフォーマンスが許容範囲内（LCP < 3秒）

---

### 7.3 Vercelデプロイ

**タスク**: Vercelにデプロイ

**手順**:
1. GitHubリポジトリにpush
2. Vercelでプロジェクトをインポート
3. 環境変数（ANTHROPIC_API_KEY）を設定
4. デプロイ

**完了条件**:
- [ ] Vercelにデプロイされる
- [ ] 本番環境で動作する
- [ ] 環境変数が正しく設定される
- [ ] HTTPSでアクセスできる

**参照**: @specs/design.md のデプロイ設定

---

### 7.4 最終Gitコミット

```bash
git add .
git commit -m "chore: プロダクションビルド対応とデプロイ設定"
git push origin main
```

**完了条件**:
- [ ] すべての変更がGitHubにpushされる

---

## ✅ MVP完成チェックリスト

以下のすべてを満たしていることを確認してください:

### 機能要件
- [ ] US-1: 対話形式での骨子作成（現状認識）が動作する
- [ ] US-2: 対話形式での骨子作成（課題仮説）が動作する
- [ ] US-3: 対話形式での骨子作成（ToBe像とアプローチ）が動作する
- [ ] US-4: 必須スライド要素の選択・生成が動作する
- [ ] US-5: パワーポイント形式でのエクスポートが動作する

### 非機能要件
- [ ] ページ読み込み時間が3秒以内
- [ ] AI対話のレスポンスが5秒以内
- [ ] PPTXエクスポートが10秒以内
- [ ] モバイル・タブレット・デスクトップで動作する
- [ ] Chrome, Safari, Edgeで動作する

### デプロイ
- [ ] ローカルで動作する
- [ ] Vercelにデプロイされている
- [ ] 本番環境で動作する

### ドキュメント
- [ ] @specs/requirements.md が最新
- [ ] @specs/design.md が最新
- [ ] @specs/tasks.md が最新（本ファイル）
- [ ] README.md が更新されている

---

## 🔮 次のステップ（フェーズ2以降）

MVP完成後、以下の機能を段階的に実装していきます:

### フェーズ2（優先度: 高）
- US-6: 前ステップへの戻り機能
- US-7: 複数デバイス対応（Supabase連携）
- 手書き入力対応（iPad + Apple Pencil）

### フェーズ3（優先度: 中）
- US-8: チームメンバー情報管理
- US-9: 見積もり根拠の自動生成（Excel出力）
- 過去提案書の再利用機能

### フェーズ4（優先度: 低）
- US-10: 他フォーマット対応（研修資料等）
- AI学習による提案品質の向上

---

## 🆘 トラブルシューティング

### Claude API接続エラー
- 環境変数（ANTHROPIC_API_KEY）が正しく設定されているか確認
- APIキーの有効性を確認
- レート制限に達していないか確認

### PPTXエクスポートエラー
- pptxgenjsのバージョンを確認
- スライドデータの型が正しいか確認
- ブラウザのコンソールでエラー確認

### ビルドエラー
- `npm run build`でエラー内容を確認
- TypeScriptエラーを修正
- 環境変数が設定されているか確認

### デプロイエラー
- Vercelの環境変数が設定されているか確認
- ビルドログを確認
- Node.jsバージョンが互換性があるか確認

---

**作成日**: 2025-12-07
