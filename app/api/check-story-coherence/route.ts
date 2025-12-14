import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type {
  Storyline,
  StoryCoherenceCheck,
} from '@/types/insight';
import type { SlideData } from '@/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const STORY_COHERENCE_PROMPT = `あなたは戦略コンサルタント兼プレゼンテーションの専門家です。
提案書のストーリーライン（論理の流れ）を分析し、整合性をチェックしてください。

**チェックすべき観点**:

1. **論理の飛躍（logic_gap）**:
   - AからBへの論理的なつながりがあるか
   - 「なぜそう言えるのか」が明確か
   - 結論が前提から導けるか

2. **接続の欠如（missing_transition）**:
   - スライド間のつながりが自然か
   - 「したがって」「しかし」「具体的には」などの接続が適切か
   - 聴衆が迷子にならないか

3. **弱いメッセージ（weak_message）**:
   - 「だから何？」に答えられているか
   - 具体性があるか
   - 行動を促すメッセージになっているか

4. **冗長性（redundancy）**:
   - 同じことを繰り返していないか
   - 情報の重複がないか

5. **順序の問題（sequence_problem）**:
   - 情報を提示する順序が適切か
   - 結論が先か、根拠が先か

**ナラティブ構造のタイプ**:
- problem_solution: 問題→解決策
- situation_complication_resolution: SCR（マッキンゼー式）
- why_what_how: なぜ→何を→どうやって
- past_present_future: 過去→現在→未来
- challenge_opportunity: 課題→機会

**感情曲線の設計**:
聴衆の感情を戦略的にコントロールするため、各スライドに適切な感情ターゲットを設定してください。

感情の種類と用途:
- concern（懸念）: 問題の深刻さを認識させる。序盤で使用
- curiosity（好奇心）: 興味を引く。フックで使用
- neutral（中立）: 客観的な情報提供
- tension（緊張）: 課題の緊急性を高める。クライマックスで使用
- urgency（緊急性）: 行動の必要性を訴える
- hope（希望）: 解決の可能性を示す。転換点で使用
- confidence（確信）: 提案への信頼を構築
- action（行動）: 具体的なアクションを促す
- commitment（コミットメント）: 決断・合意を促す。終盤で使用

理想的な感情曲線の例:
  関心 → 懸念 → 緊張（ピーク）→ 希望 → 確信 → 行動

**出力形式**:
以下のJSON形式で出力してください:

\`\`\`json
{
  "storyline": {
    "structure": "situation_complication_resolution",
    "audienceProfile": {
      "role": "想定される聴衆の役職",
      "concerns": ["聴衆が気にしていること"],
      "decisionCriteria": ["意思決定基準"]
    },
    "parts": [
      {
        "id": "part-1",
        "role": "hook",
        "purpose": "このパートの目的",
        "keyMessage": "伝えるべきメッセージ",
        "slideIds": ["slide-1", "slide-2"],
        "emotionalTarget": "concern",
        "transitionTo": "次のパートへの接続文"
      }
    ],
    "slideEmotions": [
      {
        "slideId": "slide-1",
        "emotion": "curiosity",
        "intensity": 60,
        "reason": "なぜこの感情を狙うのかの説明"
      },
      {
        "slideId": "slide-2",
        "emotion": "concern",
        "intensity": 70,
        "reason": "問題の深刻さを認識させるため"
      }
    ],
    "transitions": [
      {
        "fromSlideId": "slide-1",
        "toSlideId": "slide-2",
        "transitionType": "therefore",
        "bridgeSentence": "したがって...",
        "logicalConnection": "論理的なつながりの説明"
      }
    ],
    "overarchingMessage": "全体を通じて伝えたい1つのメッセージ",
    "emotionalArc": {
      "start": "concern",
      "climax": "tension",
      "end": "confidence"
    }
  },
  "coherenceCheck": {
    "overallScore": 75,
    "issues": [
      {
        "type": "logic_gap",
        "severity": "major",
        "location": {
          "slideId": "slide-3",
          "section": "課題設定"
        },
        "description": "問題の説明",
        "impact": "この問題が与える影響"
      }
    ],
    "suggestions": [
      {
        "issueId": "issue-1",
        "action": "推奨アクション",
        "example": "具体例",
        "priority": "high"
      }
    ]
  }
}
\`\`\`

**重要な指針**:
- 戦略コンサルタントの視点で厳しくチェック
- 具体的で実行可能なフィードバックを提供
- スコアは甘くしない（プロ基準）
- 日本語で出力してください

JSON以外の余計なテキストは出力しないでください。`;

export async function POST(request: NextRequest) {
  try {
    const { outline, slides } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY が設定されていません' },
        { status: 500 }
      );
    }

    // 骨子データを整形
    const outlineContext = `
## 提案書の骨子

### 現状認識
- 背景: ${outline.currentRecognition?.background || '未設定'}
- 問題: ${outline.currentRecognition?.currentProblems?.join('\n  - ') || '未設定'}
- 原因仮説: ${outline.currentRecognition?.rootCauseHypothesis?.join('\n  - ') || '未設定'}

### 課題設定
- クリティカルな課題: ${outline.issueSetting?.criticalIssues?.join('\n  - ') || '未設定'}

### ToBe像
- ビジョン: ${outline.toBeVision?.vision || '未設定'}
- ゴール: ${outline.toBeVision?.goals?.join('\n  - ') || '未設定'}
- スコープ: ${outline.toBeVision?.projectScope || '未設定'}

### アプローチ
- 概要: ${outline.approach?.overview || '未設定'}
- ステップ:
${outline.approach?.steps?.map((s: any, i: number) => `  ${i + 1}. ${s.title}: ${s.description}`).join('\n') || '未設定'}
`;

    // スライドデータを整形
    const slidesContext = slides && slides.length > 0
      ? slides.map((slide: SlideData, index: number) => `
### スライド ${index + 1}: ${slide.title}
- セクション: ${slide.type}
- メッセージライン: ${slide.mainMessage || ''}
- ビジュアルヒント: ${slide.visualHint || '未設定'}
- 内容:
${formatSlideContent(slide.content)}
`).join('\n')
      : '（スライドデータなし - 骨子のみで分析）';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: STORY_COHERENCE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `以下の提案書のストーリーラインを分析し、整合性をチェックしてください：

${outlineContext}

## スライド構成
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
      storyline: result.storyline as Storyline,
      coherenceCheck: result.coherenceCheck as StoryCoherenceCheck
    });
  } catch (error) {
    console.error('Story Coherence Check API error:', error);
    return Response.json(
      { error: 'ストーリー整合性チェックに失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}

function formatSlideContent(content: any): string {
  if (!content) return '  （内容なし）';

  let formatted = '';

  if (content.points && Array.isArray(content.points)) {
    formatted += content.points.map((p: string) => `  - ${p}`).join('\n');
  }

  if (content.items && Array.isArray(content.items)) {
    formatted += content.items.map((item: any) => {
      if (typeof item === 'string') return `  - ${item}`;
      if (item.title) return `  - ${item.title}: ${item.description || ''}`;
      return `  - ${JSON.stringify(item)}`;
    }).join('\n');
  }

  if (content.currentState && content.futureState) {
    formatted += `  現状: ${content.currentState}\n  将来: ${content.futureState}`;
  }

  if (content.steps && Array.isArray(content.steps)) {
    formatted += content.steps.map((step: any, i: number) =>
      `  ${i + 1}. ${step.title || step}: ${step.description || ''}`
    ).join('\n');
  }

  if (!formatted) {
    formatted = `  ${JSON.stringify(content).slice(0, 200)}...`;
  }

  return formatted;
}
