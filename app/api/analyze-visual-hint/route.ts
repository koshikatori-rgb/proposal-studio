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

    // スライドに既にvisualIntentが設定されている場合は、それを優先的に使用
    if (slide.visualHint && slide.visualIntent) {
      console.log(`✅ Using existing visual intent: ${slide.visualHint} for slide "${slide.title}"`);
      return NextResponse.json({
        visualHint: slide.visualHint,
        visualIntent: slide.visualIntent,
        visualReason: slide.visualReason,
      });
    }

    // まずルールベースで判定を試みる
    const ruleBasedHint = analyzeWithRules(slide);
    if (ruleBasedHint) {
      console.log(`📊 Rule-based visual hint: ${ruleBasedHint} for slide "${slide.title}"`);
      return NextResponse.json({ visualHint: ruleBasedHint });
    }

    // ルールで判定できない場合はClaude APIで分析
    const prompt = buildAnalysisPrompt(slide);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // レスポンスからvisualHintを抽出
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text.trim().toLowerCase()
      : 'bullets-only';

    // 有効なvisualHintタイプかチェック
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

    const visualHint = validTypes.find(type => responseText.includes(type)) || 'bullets-only';

    console.log(`📊 AI visual hint: ${visualHint} for slide "${slide.title}"`);

    return NextResponse.json({ visualHint });
  } catch (error) {
    console.error('Visual hint analysis error:', error);

    // エラー時はデフォルトのvisualhintを返す
    return NextResponse.json({
      visualHint: 'bullets-only',
      warning: '分析に失敗したため、デフォルトのビジュアルヒントを使用します'
    });
  }
}

// ルールベースでビジュアルヒントを判定
function analyzeWithRules(slide: any): string | null {
  const bullets = slide.content?.bullets || [];
  const bulletsText = bullets.join(' ').toLowerCase();
  const title = (slide.title || '').toLowerCase();
  const mainMessage = (slide.mainMessage || '').toLowerCase();
  const slideType = slide.type || '';
  const body = (slide.content?.body || '').toLowerCase();

  // スライドタイプベースの判定
  if (slideType === 'approach_detail' && bullets.length >= 3) {
    return 'process-flow';
  }

  if (slideType === 'schedule') {
    return 'timeline';
  }

  if (slideType === 'team') {
    return 'pie-chart';
  }

  // キーワードベースの判定
  const comparisonKeywords = ['before', 'after', 'asis', 'tobe', '現状', '理想', '改善前', '改善後', 'vs', '対', '比較'];
  if (comparisonKeywords.some(kw => title.includes(kw) || mainMessage.includes(kw) || bulletsText.includes(kw))) {
    return 'comparison';
  }

  const processKeywords = ['ステップ', 'step', 'フロー', 'flow', 'プロセス', 'process', '手順', '段階'];
  if (processKeywords.some(kw => title.includes(kw) || mainMessage.includes(kw)) && bullets.length >= 3) {
    return 'process-flow';
  }

  const timelineKeywords = ['スケジュール', 'schedule', 'タイムライン', 'timeline', '期間', 'week', '週', '月', 'month'];
  if (timelineKeywords.some(kw => title.includes(kw) || mainMessage.includes(kw))) {
    return 'timeline';
  }

  const hierarchyKeywords = ['階層', '原因', '要因', '問題', 'cause', 'issue', 'problem', '構造'];
  if (hierarchyKeywords.some(kw => title.includes(kw) || mainMessage.includes(kw))) {
    return 'hierarchy';
  }

  const matrixKeywords = ['マトリクス', 'matrix', '2x2', '4象限', '象限'];
  if (matrixKeywords.some(kw => title.includes(kw) || mainMessage.includes(kw)) && bullets.length === 4) {
    return 'matrix';
  }

  const pyramidKeywords = ['ピラミッド', 'pyramid', '優先順位', 'priority', '重要度'];
  if (pyramidKeywords.some(kw => title.includes(kw) || mainMessage.includes(kw)) && bullets.length >= 3 && bullets.length <= 5) {
    return 'pyramid';
  }

  // 箇条書きの数と内容で判定
  if (bullets.length === 0 && body) {
    return 'bullets-only'; // 本文のみ
  }

  if (bullets.length >= 5) {
    return 'bullets-only'; // 多すぎる場合はシンプルに
  }

  if (bullets.length >= 3 && bullets.length <= 4) {
    return 'bullets-with-visual'; // 適度な数の箇条書き
  }

  // ルールで判定できない
  return null;
}

// Claude用の詳細なプロンプトを生成
function buildAnalysisPrompt(slide: any): string {
  const bullets = slide.content?.bullets || [];
  const body = slide.content?.body || '';

  return `あなたはビジネスプレゼンテーションのビジュアルデザイン専門家です。
以下のスライド内容を分析し、最も効果的なビジュアル表現タイプを1つ選んでください。

## スライド情報
- **タイトル**: ${slide.title || '(なし)'}
- **メインメッセージ**: ${slide.mainMessage || '(なし)'}
- **スライドタイプ**: ${slide.type || '(なし)'}
- **本文**: ${body || '(なし)'}
- **箇条書き数**: ${bullets.length}個
${bullets.length > 0 ? `- **箇条書き内容**:\n${bullets.map((b: string, i: number) => `  ${i + 1}. ${b}`).join('\n')}` : ''}

## 選択基準

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
選択肢の英語キーワードのみを回答してください（例: "process-flow"）。
理由や説明は不要です。1語のみを返してください。`;
}
