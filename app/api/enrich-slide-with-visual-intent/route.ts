import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { slide } = await request.json();

    if (!slide) {
      return NextResponse.json(
        { error: 'スライドデータが必要です' },
        { status: 400 }
      );
    }

    // Claudeにスライドの内容から最適なビジュアル表現を判断させる
    const prompt = buildVisualIntentPrompt(slide);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : '';

    // レスポンスをパース（JSON形式で返されることを期待）
    const lines = responseText.split('\n').filter(line => line.trim());

    let visualHint = 'bullets-only';
    let visualIntent = '';
    let visualReason = '';

    // レスポンスから各フィールドを抽出
    for (const line of lines) {
      if (line.startsWith('visualHint:')) {
        const hint = line.replace('visualHint:', '').trim().toLowerCase();
        const validTypes = [
          'process-flow',
          'comparison',
          'hierarchy',
          'timeline',
          'bar-chart',
          'pie-chart',
          'matrix',
          'pyramid',
          'bullets-with-visual',
          'bullets-only',
        ];
        visualHint = validTypes.find(type => hint.includes(type)) || 'bullets-only';
      } else if (line.startsWith('visualIntent:')) {
        visualIntent = line.replace('visualIntent:', '').trim();
      } else if (line.startsWith('visualReason:')) {
        visualReason = line.replace('visualReason:', '').trim();
      }
    }

    console.log(`🎨 Visual intent for "${slide.title}": ${visualHint} - ${visualIntent}`);

    return NextResponse.json({
      visualHint,
      visualIntent,
      visualReason,
    });
  } catch (error) {
    console.error('Visual intent analysis error:', error);

    return NextResponse.json({
      visualHint: 'bullets-only',
      visualIntent: 'シンプルな箇条書きで表現',
      visualReason: '分析に失敗したため、デフォルトの表現を使用します',
    });
  }
}

function buildVisualIntentPrompt(slide: any): string {
  const bullets = slide.content?.bullets || [];
  const body = slide.content?.body || '';
  const text = slide.content?.text || '';

  return `あなたはビジネスプレゼンテーションのビジュアルデザイン専門家です。
以下のスライド内容を分析し、最も効果的なビジュアル表現を判断してください。

## スライド情報
- **タイトル**: ${slide.title || '(なし)'}
- **メインメッセージ**: ${slide.mainMessage || '(なし)'}
- **スライドタイプ**: ${slide.type || '(なし)'}
- **本文**: ${text || body || '(なし)'}
- **箇条書き数**: ${bullets.length}個
${bullets.length > 0 ? `- **箇条書き内容**:\n${bullets.map((b: string, i: number) => `  ${i + 1}. ${b}`).join('\n')}` : ''}

## ビジュアル表現タイプ

### 1. process-flow
- 使用条件: ステップやプロセスが3つ以上、順序性がある
- 例: 「ステップ1→2→3」「実施フロー」「手順」

### 2. comparison
- 使用条件: 2つの状態・概念の対比がある
- 例: Before/After、AsIs/ToBe、現状vs理想

### 3. hierarchy
- 使用条件: 階層構造や因果関係がある
- 例: 問題→原因→対策、ツリー構造

### 4. timeline
- 使用条件: 時系列情報やスケジュールがある
- 例: 週次計画、プロジェクト期間

### 5. bar-chart
- 使用条件: 数値比較やランキングがある
- 例: 売上推移、実績比較

### 6. pie-chart
- 使用条件: 割合や構成比を示す
- 例: シェア、配分、比率

### 7. matrix
- 使用条件: 2軸で分類、箇条書きがちょうど4つ
- 例: 緊急度×重要度、2x2マトリクス

### 8. pyramid
- 使用条件: 階層や優先順位、箇条書きが3-5個
- 例: ピラミッド構造、重要度順

### 9. bullets-with-visual
- 使用条件: 箇条書き3-4個で補助図が有効
- 例: 特徴説明+イメージ

### 10. bullets-only
- 使用条件: 上記に該当しない、箇条書きが5個以上
- 例: シンプルな箇条書きリスト

## 回答形式

以下の形式で3行で回答してください:

visualHint: [選択したタイプのキーワード]
visualIntent: [このスライドをどう視覚的に表現すべきか、1文で説明]
visualReason: [なぜその表現が適切か、1文で理由を説明]

例:
visualHint: process-flow
visualIntent: 3つのステップを左から右へ矢印で繋いだフロー図で表現
visualReason: 順序性のある手順が明確に示されており、プロセスの流れを視覚的に理解しやすいため`;
}
