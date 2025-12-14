import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type {
  ProposalInsights,
  VisualRhetoricRecommendation,
} from '@/types/insight';
import type { ProposalOutline, SlideData } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const INSIGHT_EXTRACTION_PROMPT = `あなたは戦略コンサルタントのアシストAIです。
提案書の骨子データと対話履歴から、各セクションの「So What?（だから何？）」を抽出し、
プロが作成するような強力なメッセージラインを生成してください。

**あなたの役割**:
- 単なる情報の羅列ではなく、「だから何が言いたいのか」を明確化する
- 事実から示唆・含意を導き出す
- 聴衆が「なるほど」と思える洞察を提供する

**インサイトのタイプ**:
- pattern_recognition: パターン認識（「AとBに共通する問題は...」）
- root_cause: 根本原因（「表面的な問題Xの真因は...」）
- implication: 示唆（「これが意味するのは...」）
- opportunity: 機会（「ここにチャンスがある」）
- risk: リスク（「このままだと...」）
- recommendation: 推奨（「したがって...すべき」）

**出力形式**:
以下のJSON形式で出力してください:

\`\`\`json
{
  "overarchingInsight": {
    "id": "insight-main",
    "type": "recommendation",
    "headline": "提案書全体を貫く1行メッセージ（20字以内）",
    "soWhat": "だから何が言いたいのかの回答",
    "evidence": ["根拠1", "根拠2"],
    "implication": "これが意味すること",
    "confidence": "high"
  },
  "currentRecognition": {
    "primaryInsight": {
      "id": "insight-current-1",
      "type": "pattern_recognition",
      "headline": "現状認識の核心メッセージ",
      "soWhat": "...",
      "evidence": ["..."],
      "implication": "...",
      "confidence": "high"
    },
    "supportingInsights": [],
    "messageHierarchy": {
      "headline": "タイトル直下の1行メッセージ",
      "subMessages": ["補足1", "補足2"]
    }
  },
  "issueSetting": {
    "primaryInsight": {...},
    "supportingInsights": [],
    "messageHierarchy": {...}
  },
  "toBeVision": {
    "primaryInsight": {...},
    "supportingInsights": [],
    "messageHierarchy": {...}
  },
  "approach": {
    "primaryInsight": {...},
    "supportingInsights": [],
    "messageHierarchy": {...}
  }
}
\`\`\`

**重要な指針**:
- headlineは20字以内で、インパクトのある表現にする
- 抽象的な表現ではなく、具体的で行動を促す表現にする
- 根拠（evidence）は対話履歴から抽出した事実に基づく
- 推測ではなく、論理的に導き出せる示唆のみを含める
- 日本語で出力してください

JSON以外の余計なテキストは出力しないでください。`;

const VISUAL_RHETORIC_PROMPT = `あなたは戦略コンサルタント兼プレゼンテーションデザイナーです。
スライドの内容を分析し、プロフェッショナルなビジュアル・レトリック（表現技法）を推奨してください。

**ビジュアル・レトリックとは**:
情報を視覚的に最も効果的に伝えるための表現技法です。
単に「どのチャートを使うか」ではなく、「どう見せれば伝わるか」を設計します。

**分析する4つの観点**:

1. **コントラスト設計（contrast）**:
   - type: before_after / problem_solution / current_future / comparison / emphasis
   - 何を強調し、何と対比させるか
   - 例: 「現状の課題」vs「解決後の姿」を左右で対比

2. **視線誘導設計（visualFlow）**:
   - flowPattern: z_pattern / f_pattern / central_focus / sequential / hierarchical
   - 最初にどこを見せ、どの順番で目を動かすか
   - 例: 中央の数字に注目させ、周囲の根拠に視線を誘導

3. **余白設計（whitespace）**:
   - strategy: breathing_room / grouping / emphasis / minimalist
   - 余白をどう使って情報を整理するか
   - 例: 重要なメッセージの周囲に余白を設け強調

4. **情報階層設計（hierarchy）**:
   - level1: 最重要（見出し）
   - level2: 重要（サブポイント）
   - level3: 補足（詳細）
   - 視覚的な重み付け（サイズ、色、位置）

**出力形式**:
各スライドに対して以下のJSON形式で出力してください:

\`\`\`json
{
  "visualRhetoricRecommendations": [
    {
      "slideId": "slide-1",
      "contrast": {
        "type": "problem_solution",
        "primaryElement": "解決後の姿",
        "contrastElement": "現状の課題",
        "visualTechnique": "左右分割、右側を明るい色調に",
        "reason": "問題から解決への流れを視覚化"
      },
      "visualFlow": {
        "flowPattern": "z_pattern",
        "focalPoint": "中央上部の数値",
        "secondaryPoints": ["左下の現状", "右下の目標"],
        "reason": "自然な視線の流れで結論→根拠の順に理解"
      },
      "whitespace": {
        "strategy": "emphasis",
        "keyAreas": ["メインメッセージ周囲", "セクション間"],
        "reason": "核心メッセージを際立たせる"
      },
      "hierarchy": {
        "level1": "メインメッセージ",
        "level2": ["サポートポイント1", "サポートポイント2"],
        "level3": ["詳細データ"],
        "visualWeights": {
          "level1": "bold",
          "level2": "medium",
          "level3": "small"
        }
      },
      "overallStrategy": "問題と解決策の対比を強調し、行動を促す",
      "expectedImpact": "聴衆が課題と解決策を一目で理解できる"
    }
  ]
}
\`\`\`

**重要な指針**:
- スライドの目的（説得、説明、比較等）に応じて技法を選択
- 情報過多を避け、「引き算」の美学を意識
- プロのコンサルタントが作成するような洗練された表現を目指す
- 日本語で出力してください

JSON以外の余計なテキストは出力しないでください。`;

export async function POST(request: NextRequest) {
  try {
    const { outline, slides, messages, type = 'insights' } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません' },
        { status: 500 }
      );
    }

    if (type === 'insights') {
      return await extractInsights(outline, messages);
    } else if (type === 'visual-rhetoric') {
      return await recommendVisualRhetoric(slides, outline);
    }

    return Response.json(
      { error: '無効なタイプです。insights または visual-rhetoric を指定してください。' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Insight Extraction API error:', error);
    return Response.json(
      { error: 'インサイト抽出に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}

async function extractInsights(outline: ProposalOutline, messages: any[]): Promise<Response> {
  // 対話履歴を整形
  let conversationContext = '';
  if (messages && messages.length > 0) {
    messages.forEach((msg: any) => {
      conversationContext += `**${msg.role === 'user' ? 'ユーザー' : 'AI'}**: ${msg.content}\n\n`;
    });
  }

  // 骨子データを整形
  const outlineContext = `
## 現状認識
- 背景: ${outline.currentRecognition?.background || '未設定'}
- 問題: ${outline.currentRecognition?.currentProblems?.join(', ') || '未設定'}
- 原因仮説: ${outline.currentRecognition?.rootCauseHypothesis?.join(', ') || '未設定'}

## 課題設定
- クリティカルな課題: ${outline.issueSetting?.criticalIssues?.join(', ') || '未設定'}

## ToBe像
- ビジョン: ${outline.toBeVision?.vision || '未設定'}
- ゴール: ${outline.toBeVision?.goals?.join(', ') || '未設定'}
- スコープ: ${outline.toBeVision?.projectScope || '未設定'}

## アプローチ
- 概要: ${outline.approach?.overview || '未設定'}
- ステップ: ${outline.approach?.steps?.map(s => `${s.title}: ${s.description}`).join('\n') || '未設定'}
`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: INSIGHT_EXTRACTION_PROMPT,
    messages: [
      {
        role: 'user',
        content: `以下の提案書骨子と対話履歴から、戦略的インサイトを抽出してください：

## 提案書骨子
${outlineContext}

## 対話履歴
${conversationContext || '対話履歴なし'}`,
      },
    ],
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '';

  // JSONを抽出
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  const insights: ProposalInsights = JSON.parse(jsonText);

  return Response.json({ insights });
}

async function recommendVisualRhetoric(slides: SlideData[], outline: ProposalOutline): Promise<Response> {
  // スライドデータを整形
  const slidesContext = slides.map((slide, index) => `
### スライド ${index + 1}: ${slide.title}
- セクション: ${slide.type}
- メッセージライン: ${slide.mainMessage || ''}
- ビジュアルヒント: ${slide.visualHint || '未設定'}
- 内容: ${JSON.stringify(slide.content)}
`).join('\n');

  // 骨子の文脈も追加
  const outlineContext = `
## 提案書の文脈
- 背景: ${outline.currentRecognition?.background || '未設定'}
- 課題: ${outline.issueSetting?.criticalIssues?.join(', ') || '未設定'}
- ビジョン: ${outline.toBeVision?.vision || '未設定'}
`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: VISUAL_RHETORIC_PROMPT,
    messages: [
      {
        role: 'user',
        content: `以下のスライドに対して、プロフェッショナルなビジュアル・レトリックを推奨してください：

${outlineContext}

## スライド一覧
${slidesContext}`,
      },
    ],
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '';

  // JSONを抽出
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  const result = JSON.parse(jsonText);

  return Response.json({
    visualRhetoricRecommendations: result.visualRhetoricRecommendations as VisualRhetoricRecommendation[]
  });
}
