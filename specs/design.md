# 設計書

**プロジェクト名**: 戦略コンサルタント提案作成ツール
**作成日**: 2025-12-07

---

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: Headless UI（モーダル、ドロップダウン等）

### AI統合
- **AI API**: Claude API (Anthropic)
- **用途**: 対話形式での骨子言語化サポート、課題の深掘り質問生成

### データ管理
- **MVP**: localStorage（ブラウザローカル保存）
- **将来**: Supabase（PostgreSQL + 認証 + リアルタイム同期）

### ファイル生成
- **PowerPoint**: pptxgenjs（PPTX形式エクスポート）
- **Excel**: ExcelJS（見積もり根拠 - 将来機能）

### デプロイ
- **ホスティング**: Vercel
- **CI/CD**: Vercel自動デプロイ（GitHub連携）

---

## 🏗️ システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                              │
│                   (PC / iPad / ブラウザ)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App Router                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │ Logic Layer  │  │  Data Layer  │      │
│  │  (Pages/     │→ │  (Hooks/     │→ │ (localStorage│      │
│  │  Components) │  │   Utils)     │  │  / Supabase) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬─────────────────┬─────────────────────────────┘
             │                 │
             ▼                 ▼
    ┌────────────────┐  ┌────────────────┐
    │  Claude API    │  │   pptxgenjs    │
    │ (対話AI)       │  │ (PPTX生成)     │
    └────────────────┘  └────────────────┘
```

### データフロー（MVP）

```
1. ユーザー入力
   ↓
2. Claude APIで対話・言語化サポート
   ↓
3. 骨子データをlocalStorageに保存
   ↓
4. スライド要素選択
   ↓
5. pptxgenjsでPPTX生成
   ↓
6. ダウンロード
```

---

## 📦 コンポーネント設計

### アプリケーション構成

```
app/
├── page.tsx                    # ランディングページ
├── dashboard/
│   └── page.tsx               # プロジェクト一覧
├── proposal/
│   ├── [id]/
│   │   ├── page.tsx          # 提案書編集メイン画面
│   │   ├── outline/
│   │   │   └── page.tsx      # 骨子作成（ステップ1）
│   │   ├── slides/
│   │   │   └── page.tsx      # スライド選択（ステップ2）
│   │   └── export/
│   │       └── page.tsx      # エクスポート（ステップ3）
components/
├── layout/
│   ├── Header.tsx            # ヘッダー
│   ├── Sidebar.tsx           # サイドバー（ステップナビ）
│   └── Footer.tsx            # フッター
├── outline/
│   ├── ChatInterface.tsx     # AI対話UI
│   ├── OutlineForm.tsx       # 骨子入力フォーム
│   ├── CurrentRecognition.tsx # 現状認識セクション
│   ├── IssueSetting.tsx      # 課題仮説セクション
│   └── ToBeVision.tsx        # ToBe像セクション
├── slides/
│   ├── SlideSelector.tsx     # スライド要素選択UI
│   ├── SlidePreview.tsx      # スライドプレビュー
│   └── SlideOrderEditor.tsx  # スライド順序編集
├── export/
│   ├── ExportPreview.tsx     # エクスポート前プレビュー
│   └── ExportButton.tsx      # エクスポートボタン
└── common/
    ├── Button.tsx            # 共通ボタン
    ├── Input.tsx             # 共通入力フィールド
    ├── Card.tsx              # 共通カード
    └── ProgressBar.tsx       # 進捗バー
```

---

## 📊 データモデル

### 型定義（types/index.ts）

```typescript
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

// 骨子データ
export type Outline = {
  currentRecognition: CurrentRecognition;
  issueSetting: IssueSetting;
  toBeVision: ToBeVision;
  approach: Approach;
};

// 現状認識
export type CurrentRecognition = {
  industry?: string;
  companyOverview?: string;
  background: string;
  backgroundLayer: 'industry' | 'company' | 'division' | 'department';
  currentProblems: string[];
  rootCauseHypothesis: string[];
};

// 課題仮説
export type IssueSetting = {
  criticalIssues: string[];
  issueTree?: IssueTreeNode;
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
};

// アプローチ
export type Approach = {
  overview: string;
  methodology: string;
  steps: ApproachStep[];
  schedule?: Schedule;
  team?: Team;
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

// スライド要素
export type SlideElement = {
  id: string;
  type: SlideType;
  order: number;
  title: string;
  mainMessage: string;
  content: SlideContent;
  isRequired: boolean;
};

export type SlideType =
  | 'executive_summary'
  | 'current_recognition'
  | 'issue_setting'
  | 'issue_tree'
  | 'tobe_vision'
  | 'project_goal'
  | 'approach_overview'
  | 'approach_detail'
  | 'why_this_approach'
  | 'schedule'
  | 'team'
  | 'meeting_structure'
  | 'estimate'
  | 'estimate_assumptions'
  | 'project_members'
  | 'appendix';

export type SlideContent = {
  text?: string;
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
  section: 'current_recognition' | 'issue_setting' | 'tobe_vision' | 'approach';
  messages: ChatMessage[];
};
```

---

## 🎨 UI/UXデザイン

### カラーパレット（デフォルト）

```css
:root {
  /* プライマリカラー（コンサル風の落ち着いたブルー） */
  --color-primary: #1e3a8a;      /* 濃紺 */
  --color-secondary: #3b82f6;    /* 明るいブルー */

  /* アクセントカラー */
  --color-accent: #f59e0b;       /* オレンジ（強調用） */

  /* ニュートラルカラー */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* テキストカラー */
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;

  /* 背景カラー */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
}
```

### タイポグラフィ

```css
:root {
  /* フォントファミリー */
  --font-sans: 'Inter', 'Noto Sans JP', sans-serif;

  /* フォントサイズ */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
}
```

### レスポンシブデザイン

```css
/* ブレークポイント */
--breakpoint-sm: 640px;   /* モバイル */
--breakpoint-md: 768px;   /* タブレット */
--breakpoint-lg: 1024px;  /* デスクトップ */
--breakpoint-xl: 1280px;  /* 大画面 */
```

#### レイアウト方針
- **モバイル（〜768px）**: シングルカラムレイアウト、ハンバーガーメニュー
- **タブレット（768px〜1024px）**: サイドバー折りたたみ可能
- **デスクトップ（1024px〜）**: サイドバー常時表示、2カラムレイアウト

### iPad対応（タッチUI）

- タッチターゲットサイズ: 最小44px × 44px
- スワイプジェスチャ: ステップ間の遷移
- ピンチズーム: スライドプレビュー
- Apple Pencil対応: 将来機能（手書き入力）

---

## 🔄 状態管理

### ローカルストレージ（MVP）

```typescript
// lib/storage.ts

export const STORAGE_KEYS = {
  PROPOSALS: 'proposals',
  CURRENT_PROPOSAL_ID: 'currentProposalId',
  CHAT_SESSIONS: 'chatSessions',
  SETTINGS: 'settings',
};

export const saveProposal = (proposal: Proposal): void => {
  const proposals = getProposals();
  const index = proposals.findIndex(p => p.id === proposal.id);

  if (index >= 0) {
    proposals[index] = proposal;
  } else {
    proposals.push(proposal);
  }

  localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
};

export const getProposals = (): Proposal[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
  return data ? JSON.parse(data) : [];
};

export const getProposal = (id: string): Proposal | null => {
  const proposals = getProposals();
  return proposals.find(p => p.id === id) || null;
};

export const deleteProposal = (id: string): void => {
  const proposals = getProposals().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
};
```

### カスタムフック

```typescript
// hooks/useProposal.ts

export const useProposal = (id: string) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getProposal(id);
    setProposal(data);
    setLoading(false);
  }, [id]);

  const updateProposal = (updates: Partial<Proposal>) => {
    if (!proposal) return;

    const updated = { ...proposal, ...updates, updatedAt: Date.now() };
    saveProposal(updated);
    setProposal(updated);
  };

  return { proposal, loading, updateProposal };
};
```

```typescript
// hooks/useChat.ts

export const useChat = (proposalId: string, section: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], section }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
};
```

---

## 🔌 API設計

### Claude API統合（/api/chat）

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
      messages: messages.map((m: ChatMessage) => ({
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
  const prompts = {
    current_recognition: `あなたは戦略コンサルタントのアシスタントです。
クライアントの現状認識（背景、問題、原因仮説）を言語化するサポートをしてください。

- 情報が不足している場合は、具体的な質問をしてください
- 一般論で推測せず、必要な情報を明確にしてください
- 背景のレイヤー（業界/全社/事業部等）を意識してください`,

    issue_setting: `あなたは戦略コンサルタントのアシスタントです。
原因仮説から導かれるクリティカルな課題を特定するサポートをしてください。

- MECE（漏れなくダブりなく）を意識してください
- 複数の課題候補を提示し、最もクリティカルなものを選択できるようにしてください
- 課題設定が不十分な場合は、深掘り質問をしてください`,

    tobe_vision: `あなたは戦略コンサルタントのアシスタントです。
将来の目指すべき姿（ToBe像）とアプローチ方針を言語化するサポートをしてください。

- 課題を解決した先の理想的な状態を明確にしてください
- 現状とToBeのギャップから、プロジェクトスコープを導いてください
- 具体的なアプローチステップを構造化してください`,

    approach: `あなたは戦略コンサルタントのアシスタントです。
アプローチの詳細を言語化するサポートをしてください。

- 各ステップの目的と成果物を明確にしてください
- ロジカルな流れを意識してください`,
  };

  return prompts[section as keyof typeof prompts] || prompts.current_recognition;
}
```

### PPTXエクスポートAPI（/api/export/pptx）

```typescript
// app/api/export/pptx/route.ts

import PptxGenJS from 'pptxgenjs';

export async function POST(request: Request) {
  const { proposal } = await request.json();

  try {
    const pptx = new PptxGenJS();

    // スライド設定
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Strategy Consultant Tool';

    // カラー設定
    const colors = proposal.settings.colors;

    // スライド生成
    proposal.slides.forEach((slide: SlideElement) => {
      const pptxSlide = pptx.addSlide();

      // タイトル
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: colors.primary,
      });

      // メインメッセージ
      pptxSlide.addText(slide.mainMessage, {
        x: 0.5,
        y: 1.0,
        w: 9,
        h: 0.4,
        fontSize: 18,
        color: colors.accent,
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
          color: colors.text,
        });
      }

      if (slide.content.table) {
        pptxSlide.addTable(
          [slide.content.table.headers, ...slide.content.table.rows],
          {
            x: 0.5,
            y: 1.6,
            w: 9,
            colW: Array(slide.content.table.headers.length).fill(9 / slide.content.table.headers.length),
            fontSize: 12,
          }
        );
      }
    });

    // ファイル生成
    const buffer = await pptx.write({ outputType: 'nodebuffer' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${proposal.title}.pptx"`,
      },
    });
  } catch (error) {
    console.error('PPTX generation error:', error);
    return Response.json({ error: 'PPTX生成に失敗しました' }, { status: 500 });
  }
}
```

---

## 🔐 セキュリティ設計

### 環境変数管理

```bash
# .env.local

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# 将来機能（Supabase）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### データ暗号化（将来機能）

```typescript
// lib/encryption.ts

import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY!;

export const encrypt = (data: string): string => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decrypt = (encrypted: string): string => {
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

### API保護

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // API routeの保護
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const apiKey = request.headers.get('x-api-key');

    // ローカル開発環境ではスキップ
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }

    // 本番環境では認証チェック（将来機能）
    // if (!apiKey || !isValidApiKey(apiKey)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
  }

  return NextResponse.next();
}
```

---

## 🧪 テスト戦略（将来機能）

### ユニットテスト
- **ツール**: Jest + React Testing Library
- **対象**: Utils関数、カスタムフック

### E2Eテスト
- **ツール**: Playwright
- **対象**: ユーザーフロー全体（骨子作成→スライド選択→エクスポート）

---

## 📈 パフォーマンス最適化

### コード分割
```typescript
// 動的インポート
const ChatInterface = dynamic(() => import('@/components/outline/ChatInterface'), {
  loading: () => <Spinner />,
});
```

### 画像最適化
- Next.jsの`<Image>`コンポーネント使用
- WebP形式での配信

### キャッシング
- localStorageでの自動保存（500ms debounce）
- SWR（将来のSupabase連携時）

---

## 🚀 デプロイ設定

### Vercel設定

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  }
}
```

### 環境変数（Vercel Dashboard）
- `ANTHROPIC_API_KEY`: Claude APIキー
- `NODE_ENV`: production

---

## 🔄 将来拡張（フェーズ2以降）

### Supabase連携

```typescript
// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const syncProposal = async (proposal: Proposal) => {
  const { data, error } = await supabase
    .from('proposals')
    .upsert(proposal)
    .select();

  if (error) throw error;
  return data;
};
```

### データベーススキーマ

```sql
-- proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  outline JSONB NOT NULL,
  slides JSONB NOT NULL,
  settings JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- chat_sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id),
  section TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- team_members table (将来機能)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  past_projects JSONB,
  unit_price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

**作成日**: 2025-12-07
