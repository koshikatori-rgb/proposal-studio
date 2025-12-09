import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACTION_PROMPT = `あなたは戦略コンサルタントのアシストAIです。
ユーザーとの対話履歴から、提案書の骨子となる構造化データを抽出してください。

**抽出すべき情報**:

1. **現状認識**:
   - background: クライアントの背景（業界動向、全社状況など）
   - currentProblems: 直面している問題のリスト
   - rootCauseHypothesis: 問題の原因仮説のリスト

2. **課題設定**:
   - criticalIssues: 最もクリティカルな課題のリスト（1〜3個）

3. **ToBe像**:
   - vision: 課題が解決された理想的な状態（1〜2文）
   - goals: 具体的なゴールのリスト
   - projectScope: プロジェクトのスコープ（何をやるか/やらないか）

4. **アプローチ概要**:
   - overview: アプローチの全体像（2〜3文）
   - steps: アプローチステップのリスト（各ステップにtitleとdescriptionを含む、3〜5ステップ程度）

**重要な指針**:
- 対話履歴から明示的に言及されている内容のみを抽出してください
- 推測や補完はしないでください
- 情報が不足している項目は空文字列または空配列にしてください
- 日本語で出力してください

**出力形式**:
以下のJSON形式で出力してください:

\`\`\`json
{
  "currentRecognition": {
    "background": "...",
    "currentProblems": ["...", "..."],
    "rootCauseHypothesis": ["...", "..."]
  },
  "issueSetting": {
    "criticalIssues": ["...", "..."]
  },
  "toBeVision": {
    "vision": "...",
    "goals": ["...", "..."],
    "projectScope": "..."
  },
  "approach": {
    "overview": "...",
    "steps": [
      {
        "title": "ステップ1のタイトル",
        "description": "ステップ1の説明"
      }
    ]
  }
}
\`\`\`

JSON以外の余計なテキストは出力しないでください。`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません' },
        { status: 500 }
      );
    }

    // チャット履歴を整形
    let conversationSummary = '';
    messages.forEach((msg: any) => {
      conversationSummary += `**${msg.role === 'user' ? 'ユーザー' : 'AI'}**: ${msg.content}\n\n`;
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: EXTRACTION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `以下の対話履歴から、提案書の骨子データを抽出してください:\n\n${conversationSummary}`,
        },
      ],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    // JSONを抽出（```json...```のマークダウンコードブロックを除去）
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const extractedData = JSON.parse(jsonText);

    return Response.json({
      outline: extractedData,
    });
  } catch (error) {
    console.error('Extraction API error:', error);
    return Response.json(
      { error: 'データ抽出に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}
