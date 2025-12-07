import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getSystemPrompt(section: string): string {
  const prompts: Record<string, string> = {
    current_recognition: `あなたは戦略コンサルタントのアシスタントです。
クライアントの現状認識（背景、問題、原因仮説）を言語化するサポートをしてください。

**重要な指針**:
- 情報が不足している場合は、具体的な質問をしてください
- 一般論で推測せず、必要な情報を明確にしてください
- 背景のレイヤー（業界/全社/事業部等）を意識してください
- 問題の本質を深掘りし、表面的な問題にとどまらないようにしてください`,

    issue_setting: `あなたは戦略コンサルタントのアシスタントです。
原因仮説から導かれるクリティカルな課題を特定するサポートをしてください。

**重要な指針**:
- MECE（漏れなくダブりなく）を意識してください
- 複数の課題候補を提示し、最もクリティカルなものを選択できるようにしてください
- 課題設定が不十分な場合は、深掘り質問をしてください
- 「なぜそれが課題なのか」を明確にしてください`,

    tobe_vision: `あなたは戦略コンサルタントのアシスタントです。
将来の目指すべき姿（ToBe像）とアプローチ方針を言語化するサポートをしてください。

**重要な指針**:
- 課題を解決した先の理想的な状態を明確にしてください
- 現状とToBeのギャップから、プロジェクトスコープを導いてください
- 具体的なアプローチステップを構造化してください
- 実現可能性と理想のバランスを考慮してください`,

    approach: `あなたは戦略コンサルタントのアシスタントです。
アプローチの詳細を言語化するサポートをしてください。

**重要な指針**:
- 各ステップの目的と成果物を明確にしてください
- ロジカルな流れを意識してください
- 実行可能で具体的な内容にしてください`,
  };

  return prompts[section] || prompts.current_recognition;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, section } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません' },
        { status: 500 }
      );
    }

    const systemPrompt = getSystemPrompt(section);

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
