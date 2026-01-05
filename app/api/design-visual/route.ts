import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { SlideVisualDesign, VisualPatternId } from '@/types';
import { getVisualDesignSystemPrompt, RawVisualDesignItem } from '@/lib/prompts/visualDesignPrompt';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
      system: getVisualDesignSystemPrompt(),
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
