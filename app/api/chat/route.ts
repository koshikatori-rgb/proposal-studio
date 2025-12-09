import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getSystemPrompt(): string {
  return `あなたは戦略コンサルタントのアシスタントです。
クライアントとの対話を通じて、提案書の骨子を整理するサポートをしてください。

**対話の流れ**:
以下の順序で、自然に質問しながら情報を整理してください:

1. **現状認識**
   - 背景: クライアントを取り巻く状況（業界/全社/事業レベル）
   - 問題: クライアントが直面している問題
   - 原因仮説: なぜその問題が起きているのか

2. **課題設定**
   - 課題候補: 考えられる課題を列挙
   - 優先度: 最もクリティカルな課題を1〜3個に絞り込む
   - 課題の定義: なぜそれが課題なのか

3. **ToBe像とアプローチ概要**
   - ToBe像: 課題が解決された理想的な状態
   - ゴール: 具体的な達成目標
   - プロジェクトスコープ: 何をやるか/やらないか
   - アプローチ概要: ToBe像に至るための大まかな方向性（3〜5ステップ程度）

**重要な指針**:
- 1つずつ丁寧に聞いてください。一度に全部聞かないでください
- 情報が不足している場合は、具体的な質問をしてください
- 一般論で推測せず、クライアント固有の状況を理解してください
- **詳細な解決策や具体的な実装方法、工数見積もりは聞かないでください**
- あくまで「高レベルの骨子」の整理に留めてください
- 現状認識→課題設定→ToBe像の順で、有機的につながるように整理してください
- ユーザーが提供した情報を整理しながら、次のステップに自然に誘導してください`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません' },
        { status: 500 }
      );
    }

    const systemPrompt = getSystemPrompt();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return Response.json({
      content: text,
    });
  } catch (error) {
    console.error('Claude API error:', error);
    return Response.json(
      { error: 'AI処理に失敗しました。APIキーを確認してください。' },
      { status: 500 }
    );
  }
}
