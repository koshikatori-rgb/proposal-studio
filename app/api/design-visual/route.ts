import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { SlideVisualDesign, VisualPatternId } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Phase B: 視覚化設計プロンプト（JSON出力版）
function getVisualDesignPrompt(): string {
  return `# コンサルティング資料：視覚化設計プロンプト（JSON出力版）

## 役割
あなたは、戦略コンサルティングファームの資料作成専門のデザインチーム（Visual Graphics）のリーダーであり、高度なインフォメーション・アーキテクトです。
入力された**「スライドの論理構成（テキスト）」**を分析し、ユーザーのUIシステムおよび画像生成AIが解釈可能な**「JSON形式の構造化データ」**を出力してください。

## 判断基準と生成ルール（Visual Strategy）

### 1. UI推奨（UI Recommendation）
あなたのツールのUI上のボタン（プリセット）を制御するための大枠の分類です。
* **Single vs Composite:** 論理が単純なら単一（Single）、対比や因果が複雑なら複合（Composite）を選択。
* **Pattern ID:** 以下のリストから、最も適切な一般的な名称を選択。
    * 選択肢: "process", "hierarchy", "pyramid", "tree", "cycle", "convergence", "divergence", "funnel", "swimlane", "matrix", "graph", "table", "text_only"

### 2. 描画詳細指示（Generative Instruction） **<最重要>**
UIのボタンだけでは表現できない「コンサルタントのこだわり」を画像生成AIに伝えるための詳細指示です。以下の要素を必ず言語化して含めてください。
* **Highlight (強調):** スライドのキーメッセージ（Governing Thought）に対応する箇所を、**「赤枠」「色反転」「太字」「ハイライト」**などで強調する指示を含めること。
* **Flow & Connection (関係性):** 要素間がどう繋がっているか。単なる矢印か、太いシェブロンか、点線か、双方向か。
* **Metaphor (暗喩):** 「壁」「階段」「漏斗（ファネル）」「天秤」など、データの意味合いを補強する視覚イメージ。

## 出力フォーマット（JSON形式）
**重要:** 後続のシステムが自動処理するため、必ず以下の**JSONフォーマット**のみを出力してください。Markdownのコードブロック（\`\`\`json ... \`\`\`）で囲んでください。

\`\`\`json
[
  {
    "slide_no": 1,
    "title": "スライドタイトル",
    "governing_thought": "キーメッセージをここに転記",

    "ui_recommendation": {
      "mode": "composite",
      "primary_pattern_id": "process",
      "secondary_pattern_id": "matrix",
      "rationale": "全体の工程（プロセス）と、各工程における課題（マトリクス）を対比させるため。"
    },

    "generative_instruction": {
      "layout_composition": "Split Vertical (Left 40% : Right 60%)",
      "visual_metaphor_prompt": "A professional business slide. Left side shows a clean flow chart. Right side shows a detailed data table. A red arrow connects the 3rd step of the flow to a specific row in the table, indicating a bottleneck.",
      "zones": [
        {
          "zone_id": "left",
          "content_type": "chevron_process",
          "visual_detail": "5 steps chevron process flow. Color scheme is professional blue.",
          "elements": ["調達", "製造", "物流", "販売", "アフター"]
        },
        {
          "zone_id": "right",
          "content_type": "detailed_table",
          "visual_detail": "List of issues. The row for 'Delivery Delay' must be highlighted with a red border box to indicate urgency.",
          "elements": ["在庫過多", "配送遅延", "コスト増"]
        }
      ]
    }
  }
]
\`\`\`

## 重要な注意事項
- 必ずJSON配列形式で出力すること（複数スライドがある場合は配列に複数要素）
- 全てのスライドに対してvisual_metaphor_promptを具体的に記述すること
- zonesは最低1つ、複合表現の場合は2つ以上含めること
- 日本語と英語の混在OK（visual_metaphor_promptは英語推奨）`;
}

// Phase Aの出力形式（スライドテキスト）
export type PhaseASlideInput = {
  slideNo: number;
  title: string;
  keyMessage: string;
  body: string[];
  evidenceNeeded?: string;
  connectionToNext?: string;
};

// リクエスト型
export type VisualDesignRequest = {
  // Phase Aからの入力（スライドテキスト形式）
  phaseAOutput?: string;
  // または構造化されたスライドデータ
  slides?: PhaseASlideInput[];
  // アウトライン情報（コンテキスト）
  outline?: {
    currentRecognition?: { background?: string };
    issueSetting?: { criticalIssues?: string[] };
    toBeVision?: { vision?: string };
    approach?: { overview?: string };
  };
};

// レスポンス型（内部JSON形式）
type RawVisualDesignItem = {
  slide_no: number;
  title: string;
  governing_thought: string;
  ui_recommendation: {
    mode: 'single' | 'composite';
    primary_pattern_id: string;
    secondary_pattern_id: string | null;
    rationale: string;
  };
  generative_instruction: {
    layout_composition: string;
    visual_metaphor_prompt: string;
    zones: {
      zone_id: string;
      content_type: string;
      visual_detail: string;
      elements: string[];
    }[];
  };
};

// snake_case → camelCase 変換
function transformResponse(raw: RawVisualDesignItem[]): SlideVisualDesign[] {
  return raw.map(item => ({
    slideNo: item.slide_no,
    title: item.title,
    governingThought: item.governing_thought,
    uiRecommendation: {
      mode: item.ui_recommendation.mode,
      primaryPatternId: item.ui_recommendation.primary_pattern_id as VisualPatternId,
      secondaryPatternId: item.ui_recommendation.secondary_pattern_id as VisualPatternId | null,
      rationale: item.ui_recommendation.rationale,
    },
    generativeInstruction: {
      layoutComposition: item.generative_instruction.layout_composition,
      visualMetaphorPrompt: item.generative_instruction.visual_metaphor_prompt,
      zones: item.generative_instruction.zones.map(zone => ({
        zoneId: zone.zone_id,
        contentType: zone.content_type,
        visualDetail: zone.visual_detail,
        elements: zone.elements,
      })),
    },
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body: VisualDesignRequest = await request.json();
    const { phaseAOutput, slides, outline } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'APIキーが設定されていません' },
        { status: 500 }
      );
    }

    // Phase Aの出力をテキスト化
    let slidesText = '';

    if (phaseAOutput) {
      // Phase Aからの生テキスト出力をそのまま使用
      slidesText = phaseAOutput;
    } else if (slides && slides.length > 0) {
      // 構造化されたスライドデータをテキスト化
      slidesText = slides.map((slide) => {
        return `
--------------------------------------------------
**Slide ${slide.slideNo}. ${slide.title}**

> **Key Message:**
> ${slide.keyMessage}

**Body:**
${slide.body.map(b => `* ${b}`).join('\n')}

**Evidence/Data Needed:** ${slide.evidenceNeeded || '（なし）'}

**次スライドへの接続:** ${slide.connectionToNext || '（なし）'}
--------------------------------------------------`;
      }).join('\n\n');
    } else {
      return Response.json(
        { error: 'Phase A出力またはスライドデータが必要です' },
        { status: 400 }
      );
    }

    // アウトライン情報（コンテキスト）
    const outlineText = outline ? `
【提案書の背景情報】
- 現状認識: ${outline.currentRecognition?.background || '（未設定）'}
- 主要課題: ${outline.issueSetting?.criticalIssues?.join('、') || '（未設定）'}
- ToBe像: ${outline.toBeVision?.vision || '（未設定）'}
- アプローチ: ${outline.approach?.overview || '（未設定）'}
` : '';

    const userMessage = `以下のスライド構成（Phase Aの出力）に対して、視覚化設計を行ってください。

${outlineText}

## 入力情報（Phase Aで生成されたテキスト）

${slidesText}

各スライドに対して、ui_recommendation と generative_instruction を含むJSON配列を出力してください。`;

    console.log('📤 Phase B API: Sending request to Claude...');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: getVisualDesignPrompt(),
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    // レスポンスからJSONを抽出
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('AI応答にテキストが含まれていません');
    }

    const responseText = textContent.text;
    console.log('📥 Phase B API: Response received, length:', responseText.length);

    // JSON部分を抽出
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error('JSON extraction failed. Response:', responseText.substring(0, 500));
      throw new Error('ビジュアル設計結果のJSON抽出に失敗しました');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const rawResult: RawVisualDesignItem[] = JSON.parse(jsonStr);

    // snake_case → camelCase 変換
    const result = transformResponse(rawResult);

    console.log('✅ Phase B API: Successfully parsed', result.length, 'slides');

    return Response.json({
      success: true,
      slides: result,
    });

  } catch (error) {
    console.error('Visual design API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return Response.json(
      { error: `ビジュアル設計に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
