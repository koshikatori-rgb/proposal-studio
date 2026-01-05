import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { getChatSystemPrompt } from '@/lib/prompts/chatSystemPrompt';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません' },
        { status: 500 }
      );
    }

    // メッセージ数をカウント（対話回数の追跡用）
    const messageCount = messages.length;
    const systemPrompt = getChatSystemPrompt(messageCount);

    // 参考情報はユーザーメッセージに含まれているため、
    // システムプロンプトへの追加は不要（AIはチャット履歴を参照する）

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192, // 長文の構成案が途切れないように増量
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
