import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { SlideStructure, SlideStructurePreset } from '@/types/slideStructure';
import type { ColorScheme } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// スライド構造生成用のシステムプロンプト
function getSystemPrompt(): string {
  return `あなたはコンサルティングスライドの構造設計エキスパートです。
与えられたスライド情報から、視覚的に表現するための構造化されたJSONを生成してください。

## 出力形式
必ず以下のJSON構造を出力してください。他の説明文は不要です。

\`\`\`json
{
  "id": "slide-xxx",
  "version": "1.0",
  "header": {
    "title": "スライドタイトル",
    "subtitle": "サブタイトル（任意）",
    "tag": "右上タグ（任意）"
  },
  "mainMessage": "メッセージライン",
  "layoutType": "single | left-right | left-right-detail | three-column | top-bottom | chart-callout",
  "content": {
    "element": { ... } または "elements": [ ... ]
  },
  "style": {
    "colors": { /* ColorSchemeを使用 */ },
    "fontFamily": "Noto Sans JP",
    "padding": 40
  },
  "footer": {
    "note": "注釈（任意）",
    "source": "出典（任意）"
  }
}
\`\`\`

## 利用可能な要素タイプ

### 1. ウォーターフォールチャート（waterfall）
数値の段階的な増減を表現。現状認識スライドで効果を分解する際に最適。
\`\`\`json
{
  "type": "waterfall",
  "x": 0, "y": 0, "width": 500, "height": 350,
  "startLabel": "開始ラベル",
  "startValue": 100,
  "steps": [
    { "label": "要因1", "delta": -15, "number": 1 },
    { "label": "要因2", "delta": -10, "number": 2, "highlight": true }
  ],
  "endLabel": "終了ラベル",
  "endValue": 75
}
\`\`\`

### 2. フローチャート（flow）
プロセスや手順を表現。アプローチ概要で有効。
\`\`\`json
{
  "type": "flow",
  "x": 0, "y": 0, "width": 600, "height": 200,
  "direction": "horizontal",
  "nodes": [
    { "id": "step1", "label": "現状分析" },
    { "id": "step2", "label": "課題抽出" },
    { "id": "step3", "label": "施策立案" }
  ],
  "connections": [
    { "from": "step1", "to": "step2" },
    { "from": "step2", "to": "step3" }
  ]
}
\`\`\`

### 3. 階層図（hierarchy）
ツリー構造を表現。課題分解や組織図に最適。
\`\`\`json
{
  "type": "hierarchy",
  "x": 0, "y": 0, "width": 600, "height": 300,
  "root": {
    "id": "root",
    "label": "売上低下",
    "children": [
      { "id": "c1", "label": "客数減少" },
      { "id": "c2", "label": "客単価低下" }
    ]
  }
}
\`\`\`

### 4. 番号付き説明リスト（numbered-explanation）
項目を番号付きで詳細説明。ウォーターフォールの右側に配置して対応関係を示す。
\`\`\`json
{
  "type": "numbered-explanation",
  "x": 550, "y": 0, "width": 500,
  "items": [
    {
      "number": 1,
      "title": "要因の概要",
      "bullets": ["詳細1", "詳細2"]
    }
  ],
  "fontSize": 13
}
\`\`\`

### 5. 箇条書き（bullet-list）
\`\`\`json
{
  "type": "bullet-list",
  "x": 0, "y": 0, "width": 500,
  "items": [
    { "text": "項目1", "bullet": "•" },
    { "text": "項目2", "indent": 1 }
  ],
  "fontSize": 14
}
\`\`\`

### 6. テーブル（table）
\`\`\`json
{
  "type": "table",
  "x": 0, "y": 0, "width": 600,
  "headers": ["項目", "現状", "目標"],
  "rows": [
    ["売上", "100億円", "150億円"],
    ["利益率", "5%", "10%"]
  ]
}
\`\`\`

### 7. 分割レイアウト（split-layout）
左右または上下に分割して異なる要素を配置。
\`\`\`json
{
  "type": "split-layout",
  "direction": "horizontal",
  "ratio": [1, 1],
  "left": { /* 左側の要素 */ },
  "right": { /* 右側の要素 */ },
  "divider": true
}
\`\`\`

## レイアウト選択ガイド

- **single**: シンプルな箇条書きやフロー図1つの場合
- **left-right**: グラフと説明、図と詳細を並べる場合
- **left-right-detail**: ウォーターフォール+番号付き説明など、左右が番号で対応する場合
- **three-column**: データの流れを3段階で示す場合
- **chart-callout**: グラフに吹き出し解説を付ける場合

## 重要な注意事項

1. 座標（x, y）は相対位置で指定。レンダラーが自動調整します
2. 色はColorScheme（primary, secondary, accent, text, background）を参照
3. 日本語テキストは適切な長さに収める（タイトル20文字以内、箇条書き40文字以内）
4. JSONのみを出力し、説明文は含めないでください
`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slideType,
      title,
      mainMessage,
      content,
      visualHint,
      colorScheme,
      fontFamily = 'Noto Sans JP',
    } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません' },
        { status: 500 }
      );
    }

    // ユーザーメッセージを構築
    const userMessage = `以下のスライド情報から、構造化JSONを生成してください。

## スライド情報
- タイプ: ${slideType}
- タイトル: ${title}
- メッセージライン: ${mainMessage}
- 視覚表現ヒント: ${visualHint || '自動選択'}

## コンテンツ
${content.bullets ? `箇条書き:\n${content.bullets.map((b: string) => `- ${b}`).join('\n')}` : ''}
${content.text ? `テキスト: ${content.text}` : ''}
${content.data ? `データ: ${JSON.stringify(content.data, null, 2)}` : ''}

## スタイル設定
- カラースキーム: ${JSON.stringify(colorScheme)}
- フォント: ${fontFamily}

上記の情報を元に、最適なレイアウトと要素を選択してSlideStructure JSONを生成してください。
JSONのみを出力してください。`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: getSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const responseContent = response.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    // JSONを抽出
    let jsonText = responseContent.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // JSONをパース
    const structure: SlideStructure = JSON.parse(jsonText.trim());

    return Response.json({
      success: true,
      structure,
    });
  } catch (error) {
    console.error('Slide structure generation error:', error);
    return Response.json(
      { error: 'スライド構造の生成に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
