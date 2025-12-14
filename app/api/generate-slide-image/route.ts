import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { renderSlideToSVG } from '@/lib/slideRenderer';
import type { SlideStructure } from '@/types/slideStructure';
import type { CompositeVisualConfig, CompositeLayoutType } from '@/types';

// Anthropic クライアント
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// デフォルトのカラースキーム
const defaultColorScheme = {
  primary: '#7c3aed',
  secondary: '#0284c7',
  accent: '#f59e0b',
  text: '#1f2937',
  background: '#ffffff',
};

// カラースキーム型
type ColorScheme = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
};

// スライドから構造JSONを生成する関数
async function generateSlideStructure(slide: any, colorScheme: ColorScheme = defaultColorScheme): Promise<SlideStructure> {
  const {
    type,
    title,
    mainMessage,
    content,
    visualHint,
    structurePreset,
  } = slide;

  const systemPrompt = `あなたはコンサルティングスライドの構造設計エキスパートです。
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

  const userMessage = `以下のスライド情報から、構造化JSONを生成してください。

## スライド情報
- タイプ: ${type || 'unknown'}
- タイトル: ${title || 'タイトル未設定'}
- メッセージライン: ${mainMessage || ''}
- 視覚表現ヒント: ${visualHint || '自動選択'}
- 構造プリセット: ${structurePreset || '自動選択'}

## コンテンツ
${content?.bullets ? `箇条書き:\n${content.bullets.map((b: string) => `- ${b}`).join('\n')}` : ''}
${content?.text || content?.body ? `テキスト: ${content.text || content.body}` : ''}

## スタイル設定
- カラースキーム: ${JSON.stringify(colorScheme)}
- フォント: Noto Sans JP

上記の情報を元に、最適なレイアウトと要素を選択してSlideStructure JSONを生成してください。
${structurePreset ? `プリセット「${structurePreset}」を参考にレイアウトを設計してください。` : ''}
JSONのみを出力してください。`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
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
  return structure;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slide, mode, structure, colorScheme: requestColorScheme } = body;

    // リクエストから受け取ったカラースキーム、なければデフォルト使用
    const colorScheme: ColorScheme = requestColorScheme || defaultColorScheme;

    // 構造ベースモード: 事前に生成されたSlideStructureからSVGをレンダリング
    if (mode === 'structure' && structure) {
      console.log('🎨 構造ベースモード: SlideStructureからSVGを生成します');
      const result = renderSlideToSVG(structure as SlideStructure);

      if (!result.success) {
        throw new Error(result.error || 'SVGレンダリングに失敗しました');
      }

      const svgBase64 = Buffer.from(result.svgData || '').toString('base64');
      return Response.json({
        imageUrl: `data:image/svg+xml;base64,${svgBase64}`,
        isMock: false,
        generatedBy: 'structure-renderer',
      });
    }

    // useStructureModeがtrueの場合: 自動的に構造生成→SVGレンダリング
    if (slide?.useStructureMode === true) {
      console.log('🎨 自動構造ベースモード: スライドから構造JSONを生成してSVGを作成します');
      console.log(`   - プリセット: ${slide.structurePreset || '自動選択'}`);

      try {
        // Step 1: スライド情報から構造JSONを生成（カラースキームを渡す）
        const generatedStructure = await generateSlideStructure(slide, colorScheme);
        console.log('✅ 構造JSON生成完了');

        // Step 2: 構造JSONからSVGをレンダリング
        const result = renderSlideToSVG(generatedStructure);

        if (!result.success) {
          throw new Error(result.error || 'SVGレンダリングに失敗しました');
        }

        const svgBase64 = Buffer.from(result.svgData || '').toString('base64');
        return Response.json({
          imageUrl: `data:image/svg+xml;base64,${svgBase64}`,
          isMock: false,
          generatedBy: 'auto-structure-renderer',
          structurePreset: slide.structurePreset,
        });
      } catch (structureError) {
        console.error('構造ベース生成エラー、Claude SVG生成にフォールバック:', structureError);
        // フォールバックとしてClaude SVG生成を使用
      }
    }

    // モックモードの場合は、従来のモック画像を返す（フォールバック）
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_IMAGES === 'true';
    const useClaudeSVG = process.env.NEXT_PUBLIC_USE_CLAUDE_SVG !== 'false'; // デフォルトでClaude SVG生成を使用

    // Claude SVG生成モード（推奨）
    if (useClaudeSVG && process.env.ANTHROPIC_API_KEY) {
      console.log('🎨 Claude SVG生成モード: AIでSVGを生成します');
      try {
        const svgImageUrl = await generateSVGWithClaude(slide, colorScheme);
        return Response.json({
          imageUrl: svgImageUrl,
          isMock: false,
          generatedBy: 'claude-svg',
        });
      } catch (claudeError) {
        console.error('Claude SVG生成エラー、フォールバックモードへ:', claudeError);
        // フォールバックとして従来のモック画像を使用
      }
    }

    // フォールバック: 従来のモック画像
    if (useMock || !process.env.ANTHROPIC_API_KEY) {
      console.log('🎨 フォールバックモード: 静的SVGを生成します');
      const mockImageUrl = generateMockSlideImage(slide);
      return Response.json({
        imageUrl: mockImageUrl,
        isMock: true,
        generatedBy: 'fallback',
      });
    }

    // デフォルト: Claude SVG生成を試行
    const svgImageUrl = await generateSVGWithClaude(slide, colorScheme);
    return Response.json({
      imageUrl: svgImageUrl,
      isMock: false,
      generatedBy: 'claude-svg',
    });

  } catch (error) {
    console.error('Image generation error:', error);

    // 詳細なエラー情報をログ出力
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return Response.json(
      {
        error: '画像生成に失敗しました。もう一度お試しください。',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Claude APIを使用してSVGを生成
async function generateSVGWithClaude(slide: any, colorScheme: ColorScheme = defaultColorScheme): Promise<string> {
  const { title, mainMessage, content, visualHint, visualIntent, compositeVisual } = slide;
  const bullets = content?.bullets || [];
  const bodyText = content?.body || content?.text || '';

  // 複合表現が有効な場合は複合表現用の指示を使用
  const isCompositeMode = compositeVisual?.enabled === true;
  const visualHintInstructions = isCompositeMode
    ? getCompositeLayoutInstructions(compositeVisual, bullets)
    : getVisualHintInstructions(visualHint, bullets);

  const prompt = `あなたはビジネスプレゼンテーション用のSVG図解を生成するエキスパートです。
以下のスライド情報に基づいて、プロフェッショナルなSVG画像を生成してください。

## スライド情報
- タイトル: ${title || 'タイトル未設定'}
- メインメッセージ: ${mainMessage || ''}
- ビジュアル意図: ${visualIntent || '情報を視覚的に整理'}
- レイアウトタイプ: ${visualHint || 'bullets-only'}

## コンテンツ
${bullets.length > 0 ? `箇条書き項目:\n${bullets.map((b: string, i: number) => `${i + 1}. ${b}`).join('\n')}` : ''}
${bodyText ? `本文: ${bodyText}` : ''}

## 生成指示
${visualHintInstructions}

## SVG要件
1. サイズ: width="1600" height="900"
2. 背景: ${colorScheme.background}（背景色）
3. フォント: sans-serif系（日本語対応）
4. カラーパレット（必ず以下の色を使用してください）:
   - プライマリカラー: ${colorScheme.primary}（メインの強調色、見出し、重要要素）
   - セカンダリカラー: ${colorScheme.secondary}（補助色、サブ要素）
   - アクセントカラー: ${colorScheme.accent}（強調、ハイライト）
   - テキストカラー: ${colorScheme.text}（本文テキスト）
   - 背景カラー: ${colorScheme.background}（背景）
5. スタイル: クリーンでモダンなビジネスデザイン
6. **レイアウト構成（必須）**:
   - 上部（y=60-100）: タイトルを大きく表示（font-size: 36-42px、font-weight: bold、色: ${colorScheme.text}）
   - タイトル直下（y=120-160）: **メインメッセージを必ず表示**（font-size: 20-24px、色: ${colorScheme.primary}）
   - 中央〜下部（y=200以降）: コンテンツ（図解、箇条書きなど）
7. 適切な余白（padding: 60-80px）
8. **重要**: メインメッセージは必ずスライドに含めてください。これはスライドで最も伝えたいポイントです

## 出力形式
SVGコードのみを出力してください。説明や前置きは不要です。
<svg>タグから始めて</svg>タグで終わる完全なSVGコードを出力してください。`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // レスポンスからSVGを抽出
  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('予期しないレスポンス形式');
  }

  let svgCode = textContent.text.trim();

  // SVGタグの抽出（コードブロックで囲まれている場合も対応）
  if (svgCode.includes('```svg')) {
    svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '');
  } else if (svgCode.includes('```xml')) {
    svgCode = svgCode.replace(/```xml\n?/g, '').replace(/```\n?/g, '');
  } else if (svgCode.includes('```')) {
    svgCode = svgCode.replace(/```\n?/g, '');
  }

  // <svg>タグが含まれていることを確認
  if (!svgCode.includes('<svg')) {
    throw new Error('有効なSVGが生成されませんでした');
  }

  // SVG部分のみを抽出
  const svgMatch = svgCode.match(/<svg[\s\S]*<\/svg>/);
  if (!svgMatch) {
    throw new Error('SVGの抽出に失敗しました');
  }

  svgCode = svgMatch[0];

  // Base64エンコードしてデータURIとして返す
  const base64 = Buffer.from(svgCode).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// visualHintタイプに応じた生成指示を返す
function getVisualHintInstructions(visualHint: string, bullets: string[]): string {
  const itemCount = bullets.length || 4;

  switch (visualHint) {
    case 'process-flow':
      return `【プロセスフロー図】
- ${itemCount}個のステップを横に並べたフローチャートを作成
- 各ステップは角丸の四角形で、矢印で接続
- ステップ番号とタイトルを明記
- グラデーションや影で立体感を演出
- 左から右への流れを明確に`;

    case 'comparison':
      return `【比較図（Before/After）】
- 画面を左右2列に分割
- 左側: "現状/Before" を赤系の色調で表示
- 右側: "理想/After" を緑系の色調で表示
- 中央に"→"や"VS"などの区切りを配置
- 各項目を箇条書きで整理`;

    case 'hierarchy':
      return `【階層図/組織図】
- トップに主要な概念を配置
- 下位に${itemCount - 1}個のサブ項目を配置
- 親子関係を線で接続
- 各ボックスは統一されたスタイル
- ツリー構造を明確に表現`;

    case 'timeline':
      return `【タイムライン図】
- 横向きの時間軸を描画
- ${itemCount}個のマイルストーンを配置
- 各ポイントに円形のマーカーと説明文
- 時系列の進行方向を矢印で示す
- フェーズごとに色分け`;

    case 'matrix':
      return `【2x2マトリクス図】
- 縦軸と横軸でエリアを4分割
- 各象限にラベルとアイテムを配置
- 軸にはHigh/Lowなどのラベル
- 色で各象限を区別
- 重要度や優先度を視覚化`;

    case 'pyramid':
      return `【ピラミッド図】
- ${itemCount}段のピラミッド構造
- 上部ほど重要/少数、下部ほど基盤/多数
- 各段にラベルを配置
- グラデーションで階層感を表現
- 中央揃えの安定した構図`;

    case 'bar-chart':
      return `【棒グラフ】
- ${itemCount}本の縦棒グラフ
- X軸にカテゴリ、Y軸に数値
- 各棒に異なる色を使用
- グリッド線で読みやすく
- 数値ラベルを棒の上に表示`;

    case 'pie-chart':
      return `【円グラフ】
- ${itemCount}セグメントの円グラフ
- 各セグメントを異なる色で表示
- パーセンテージと凡例を追加
- 最大セグメントを強調
- ドーナツチャート形式も可`;

    case 'bullets-with-visual':
      return `【箇条書き+ビジュアル】
- 左側に${itemCount}個の箇条書き
- 右側に関連するアイコンや図形
- 各項目にチェックマークや番号
- 視覚要素と項目を対応させる
- バランスの取れたレイアウト`;

    case 'bullets-only':
    default:
      return `【箇条書きリスト】
- ${itemCount}個の箇条書き項目を縦に配置
- 各項目にブレットポイント（●または番号）
- 十分な行間で読みやすく
- 重要な項目は太字やアクセントカラー
- 整然とした左揃えレイアウト`;
  }
}

// ワイヤーフレームスタイルのモック画像を生成
function generateWireframeMockImage(slide: any): string {
  const { title, mainMessage, content, visualHint, visualIntent } = slide;
  let bullets = content?.bullets || [];
  const slideTitle = title || 'タイトル';
  const message = mainMessage || '';
  // bodyまたはtextのいずれかを使用
  const bodyText = content?.body || content?.text || '';

  // bulletsが空または少なすぎる場合、visualIntentやbodyTextからダミーデータを生成
  // ワイヤーフレームを正しく表示するには最低3-5個の項目が必要
  const MIN_ITEMS = 3;

  if (bullets.length < MIN_ITEMS) {
    // bodyTextがあれば分割してbulletsとして使う
    if (bodyText) {
      const bodyBullets = bodyText.split(/[。、\n]/).filter((s: string) => s.trim().length > 5).slice(0, 5);
      if (bodyBullets.length > bullets.length) {
        bullets = bodyBullets;
      }
    }
    // それでも足りなければvisualHintに応じたデフォルト値を使用
    if (bullets.length < MIN_ITEMS) {
      const defaultBulletsByHint: { [key: string]: string[] } = {
        'process-flow': ['現状分析', '課題設定', '施策立案', '実行', '評価'],
        'timeline': ['Phase 1: 準備', 'Phase 2: 導入', 'Phase 3: 展開', 'Phase 4: 定着', 'Phase 5: 最適化'],
        'hierarchy': ['メインテーマ', 'サブ項目A', 'サブ項目B', 'サブ項目C', 'サブ項目D'],
        'comparison': ['現状の課題A', '現状の課題B', '理想の状態A', '理想の状態B'],
        'matrix': ['高優先・高効果', '高優先・低効果', '低優先・高効果', '低優先・低効果'],
        'pyramid': ['最重要課題', '重要施策A', '重要施策B', '基盤整備A', '基盤整備B'],
        'bar-chart': ['売上', '利益', 'コスト', '成長率', '効率'],
        'pie-chart': ['製品A', '製品B', '製品C', 'その他'],
        'bullets-with-visual': ['主要ポイント1', '主要ポイント2', '主要ポイント3', '主要ポイント4'],
        'bullets-only': ['概要説明', '背景情報', '課題認識', '提案内容', '期待効果'],
      };
      bullets = defaultBulletsByHint[visualHint] || ['項目1', '項目2', '項目3', '項目4', '項目5'];
    }
  }

  console.log(`📊 ワイヤーフレーム生成: visualHint=${visualHint}, bullets数=${bullets.length}, bullets=`, bullets.slice(0, 3));

  // Grid background pattern for wireframe aesthetic
  const gridPattern = `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
      </pattern>
    </defs>`;

  // Base wireframe structure
  let wireframeContent = '';

  // Generate wireframe based on visualHint type
  switch (visualHint) {
    case 'process-flow':
      wireframeContent = generateProcessFlowWireframe(bullets);
      break;
    case 'comparison':
      wireframeContent = generateComparisonWireframe(bullets);
      break;
    case 'hierarchy':
      wireframeContent = generateHierarchyWireframe(bullets);
      break;
    case 'timeline':
      wireframeContent = generateTimelineWireframe(bullets);
      break;
    case 'matrix':
      wireframeContent = generateMatrixWireframe(bullets);
      break;
    case 'pyramid':
      wireframeContent = generatePyramidWireframe(bullets);
      break;
    case 'bar-chart':
      wireframeContent = generateBarChartWireframe(bullets);
      break;
    case 'pie-chart':
      wireframeContent = generatePieChartWireframe(bullets);
      break;
    case 'bullets-with-visual':
      wireframeContent = generateBulletsWithVisualWireframe(bullets);
      break;
    case 'bullets-only':
    default:
      wireframeContent = generateBulletsOnlyWireframe(bullets);
      break;
  }

  const svg = `
    <svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
      ${gridPattern}

      <!-- Background with grid -->
      <rect width="1600" height="900" fill="white"/>
      <rect width="1600" height="900" fill="url(#grid)"/>

      <!-- Border frame -->
      <rect x="40" y="40" width="1520" height="820" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="10,5"/>

      <!-- Title area with sketch style -->
      <rect x="80" y="80" width="1440" height="120" fill="none" stroke="#666" stroke-width="2"/>
      <text x="100" y="130" font-family="'Courier New', monospace" font-size="36" font-weight="bold" fill="#222">
        ${escapeXml(slideTitle)}
      </text>
      <line x1="100" y1="150" x2="${Math.min(100 + slideTitle.length * 20, 1400)}" y2="150" stroke="#7c3aed" stroke-width="3"/>

      ${message ? `
      <text x="100" y="180" font-family="'Courier New', monospace" font-size="20" fill="#555">
        ${escapeXml(message.substring(0, 80))}${message.length > 80 ? '...' : ''}
      </text>` : ''}

      <!-- Visual Intent annotation -->
      <rect x="80" y="220" width="1440" height="60" fill="#fffbeb" stroke="#f59e0b" stroke-width="1" stroke-dasharray="5,3"/>
      <text x="100" y="245" font-family="'Courier New', monospace" font-size="16" fill="#92400e" font-style="italic">
        💡 Visual Intent: ${escapeXml(visualIntent || '')}
      </text>

      <!-- Main wireframe content -->
      <g transform="translate(0, 300)">
        ${wireframeContent}
      </g>

      <!-- Footer annotation -->
      <text x="800" y="870" font-family="'Courier New', monospace" font-size="14" fill="#999" text-anchor="middle">
        [WIREFRAME DRAFT - ${visualHint?.toUpperCase() || 'LAYOUT'}]
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Wireframe generation functions for each visual type
function generateProcessFlowWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['現状分析', '課題設定', '施策立案', '実行'];

  const boxWidth = 280;
  const boxHeight = 120;
  const spacing = 80;
  const startX = 100;
  const startY = 50;

  return items.slice(0, 4).map((bullet, idx) => {
    const x = startX + idx * (boxWidth + spacing);
    return `
      <!-- Step ${idx + 1} -->
      <rect x="${x}" y="${startY}" width="${boxWidth}" height="${boxHeight}"
            fill="#f0f9ff" stroke="#0284c7" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="${x + boxWidth / 2}" y="${startY + 40}"
            font-family="'Courier New', monospace" font-size="18" font-weight="bold"
            fill="#0c4a6e" text-anchor="middle">
        STEP ${idx + 1}
      </text>
      <text x="${x + boxWidth / 2}" y="${startY + 70}"
            font-family="'Courier New', monospace" font-size="14"
            fill="#333" text-anchor="middle">
        ${escapeXml(bullet.substring(0, 25))}
      </text>
      <text x="${x + boxWidth / 2}" y="${startY + 90}"
            font-family="'Courier New', monospace" font-size="14"
            fill="#333" text-anchor="middle">
        ${escapeXml(bullet.substring(25, 50))}
      </text>
      ${idx < items.length - 1 && idx < 3 ? `
      <!-- Arrow -->
      <line x1="${x + boxWidth}" y1="${startY + boxHeight / 2}"
            x2="${x + boxWidth + spacing}" y2="${startY + boxHeight / 2}"
            stroke="#7c3aed" stroke-width="3" marker-end="url(#arrowhead)"/>
      ` : ''}
    `;
  }).join('') + `
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#7c3aed"/>
      </marker>
    </defs>
  `;
}

function generateComparisonWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['現状の課題A', '現状の課題B', '理想の状態A', '理想の状態B'];
  const leftBullets = items.slice(0, Math.ceil(items.length / 2));
  const rightBullets = items.slice(Math.ceil(items.length / 2));

  return `
    <!-- Left column (Before/AsIs) -->
    <rect x="100" y="30" width="600" height="400" fill="#fef2f2" stroke="#dc2626" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="400" y="60" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#991b1b" text-anchor="middle">
      BEFORE / AS-IS
    </text>
    ${leftBullets.map((bullet, idx) => `
      <text x="120" y="${100 + idx * 40}" font-family="'Courier New', monospace" font-size="16" fill="#333">
        ✗ ${escapeXml(bullet.substring(0, 40))}
      </text>
    `).join('')}

    <!-- VS divider -->
    <line x1="800" y1="30" x2="800" y2="430" stroke="#666" stroke-width="3"/>
    <circle cx="800" cy="230" r="40" fill="white" stroke="#666" stroke-width="3"/>
    <text x="800" y="240" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#666" text-anchor="middle">
      VS
    </text>

    <!-- Right column (After/ToBe) -->
    <rect x="900" y="30" width="600" height="400" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="1200" y="60" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#166534" text-anchor="middle">
      AFTER / TO-BE
    </text>
    ${rightBullets.map((bullet, idx) => `
      <text x="920" y="${100 + idx * 40}" font-family="'Courier New', monospace" font-size="16" fill="#333">
        ✓ ${escapeXml(bullet.substring(0, 40))}
      </text>
    `).join('')}
  `;
}

function generateHierarchyWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['メインテーマ', 'サブ項目A', 'サブ項目B', 'サブ項目C', 'サブ項目D'];

  return `
    <!-- Root node -->
    <rect x="600" y="20" width="400" height="80" fill="#dbeafe" stroke="#0284c7" stroke-width="2"/>
    <text x="800" y="65" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#0c4a6e" text-anchor="middle">
      ${escapeXml(items[0]?.substring(0, 35) || 'Root')}
    </text>

    <!-- Child nodes -->
    ${items.slice(1, 5).map((bullet, idx) => {
      const x = 150 + idx * 350;
      return `
        <line x1="800" y1="100" x2="${x + 150}" y2="180" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3,3"/>
        <rect x="${x}" y="180" width="300" height="70" fill="#f1f5f9" stroke="#64748b" stroke-width="2"/>
        <text x="${x + 150}" y="220" font-family="'Courier New', monospace" font-size="14" fill="#334155" text-anchor="middle">
          ${escapeXml(bullet.substring(0, 30))}
        </text>
      `;
    }).join('')}
  `;
}

function generateTimelineWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];

  return `
    <!-- Timeline line -->
    <line x1="100" y1="200" x2="1500" y2="200" stroke="#666" stroke-width="4"/>

    <!-- Timeline points -->
    ${items.slice(0, 5).map((bullet, idx) => {
      const x = 200 + idx * 300;
      return `
        <circle cx="${x}" cy="200" r="15" fill="white" stroke="#7c3aed" stroke-width="3"/>
        <circle cx="${x}" cy="200" r="8" fill="#7c3aed"/>
        <text x="${x}" y="170" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#5b21b6" text-anchor="middle">
          Week ${idx + 1}
        </text>
        <text x="${x}" y="240" font-family="'Courier New', monospace" font-size="12" fill="#333" text-anchor="middle">
          ${escapeXml(bullet.substring(0, 20))}
        </text>
        <text x="${x}" y="260" font-family="'Courier New', monospace" font-size="12" fill="#333" text-anchor="middle">
          ${escapeXml(bullet.substring(20, 40))}
        </text>
      `;
    }).join('')}
  `;
}

function generateMatrixWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['高優先・高効果', '高優先・低効果', '低優先・高効果', '低優先・低効果'];

  return `
    <!-- Matrix grid -->
    <line x1="800" y1="50" x2="800" y2="450" stroke="#333" stroke-width="3"/>
    <line x1="150" y1="250" x2="1450" y2="250" stroke="#333" stroke-width="3"/>

    <!-- Axis labels -->
    <text x="800" y="30" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#666" text-anchor="middle">HIGH</text>
    <text x="800" y="480" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#666" text-anchor="middle">LOW</text>
    <text x="100" y="255" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#666" text-anchor="end">LOW</text>
    <text x="1500" y="255" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#666" text-anchor="start">HIGH</text>

    <!-- Quadrant items -->
    ${items.slice(0, 4).map((bullet, idx) => {
      const positions = [
        { x: 1000, y: 100 },  // Q1: High-High
        { x: 475, y: 100 },   // Q2: Low-High
        { x: 475, y: 320 },   // Q3: Low-Low
        { x: 1000, y: 320 }   // Q4: High-Low
      ];
      const pos = positions[idx] || positions[0];
      return `
        <rect x="${pos.x}" y="${pos.y}" width="280" height="100" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="${pos.x + 140}" y="${pos.y + 35}" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#92400e" text-anchor="middle">
          Q${idx + 1}
        </text>
        <text x="${pos.x + 140}" y="${pos.y + 60}" font-family="'Courier New', monospace" font-size="12" fill="#333" text-anchor="middle">
          ${escapeXml(bullet.substring(0, 25))}
        </text>
      `;
    }).join('')}
  `;
}

function generatePyramidWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['最重要課題', '重要施策A', '重要施策B', '基盤整備A', '基盤整備B'];

  return items.slice(0, 5).map((bullet, idx) => {
    const width = 300 + idx * 250;
    const x = 800 - width / 2;
    const y = 50 + idx * 90;
    return `
      <polygon points="${x},${y} ${x + width},${y} ${x + width - 30},${y + 80} ${x + 30},${y + 80}"
               fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/>
      <text x="800" y="${y + 50}" font-family="'Courier New', monospace" font-size="16" fill="#312e81" text-anchor="middle">
        ${escapeXml(bullet.substring(0, 30))}
      </text>
    `;
  }).join('');
}

function generateBarChartWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['売上', '利益', 'コスト', '成長率', '効率'];

  return `
    <!-- Y-axis -->
    <line x1="150" y1="50" x2="150" y2="450" stroke="#333" stroke-width="3"/>
    <!-- X-axis -->
    <line x1="150" y1="450" x2="1450" y2="450" stroke="#333" stroke-width="3"/>

    <!-- Bars -->
    ${items.slice(0, 5).map((bullet, idx) => {
      const height = 100 + Math.random() * 300;
      const x = 250 + idx * 240;
      return `
        <rect x="${x}" y="${450 - height}" width="180" height="${height}"
              fill="#a5b4fc" stroke="#6366f1" stroke-width="2"/>
        <text x="${x + 90}" y="${430 - height}" font-family="'Courier New', monospace" font-size="14"
              fill="#312e81" text-anchor="middle">
          ${Math.floor(height)}
        </text>
        <text x="${x + 90}" y="480" font-family="'Courier New', monospace" font-size="12"
              fill="#333" text-anchor="middle">
          ${escapeXml(bullet.substring(0, 12))}
        </text>
      `;
    }).join('')}
  `;
}

function generatePieChartWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['製品A', '製品B', '製品C', 'その他'];
  const total = items.length;
  let currentAngle = 0;

  return `
    <g transform="translate(800, 250)">
      ${items.slice(0, 6).map((bullet, idx) => {
        const angle = (360 / total);
        const startAngle = currentAngle * Math.PI / 180;
        const endAngle = (currentAngle + angle) * Math.PI / 180;
        const x1 = Math.cos(startAngle) * 200;
        const y1 = Math.sin(startAngle) * 200;
        const x2 = Math.cos(endAngle) * 200;
        const y2 = Math.sin(endAngle) * 200;
        const largeArcFlag = angle > 180 ? 1 : 0;

        const labelAngle = (currentAngle + angle / 2) * Math.PI / 180;
        const labelX = Math.cos(labelAngle) * 280;
        const labelY = Math.sin(labelAngle) * 280;

        currentAngle += angle;

        const colors = ['#fecaca', '#fed7aa', '#fde68a', '#d9f99d', '#a7f3d0', '#a5f3fc'];
        const strokeColors = ['#dc2626', '#ea580c', '#ca8a04', '#65a30d', '#059669', '#0891b2'];

        return `
          <path d="M 0 0 L ${x1} ${y1} A 200 200 0 ${largeArcFlag} 1 ${x2} ${y2} Z"
                fill="${colors[idx % colors.length]}" stroke="${strokeColors[idx % strokeColors.length]}" stroke-width="2"/>
          <line x1="0" y1="0" x2="${labelX * 0.7}" y2="${labelY * 0.7}" stroke="#666" stroke-width="1" stroke-dasharray="2,2"/>
          <text x="${labelX}" y="${labelY}" font-family="'Courier New', monospace" font-size="12"
                fill="#333" text-anchor="middle">
            ${escapeXml(bullet.substring(0, 15))}
          </text>
          <text x="${labelX}" y="${labelY + 15}" font-family="'Courier New', monospace" font-size="11"
                fill="#666" text-anchor="middle">
            ${Math.round(100 / total)}%
          </text>
        `;
      }).join('')}
      <circle cx="0" cy="0" r="200" fill="none" stroke="#333" stroke-width="2"/>
    </g>
  `;
}

function generateBulletsWithVisualWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['主要ポイント1', '主要ポイント2', '主要ポイント3', '主要ポイント4'];

  return `
    <!-- Left side: Bullets -->
    <g>
      ${items.slice(0, 4).map((bullet, idx) => `
        <circle cx="120" cy="${60 + idx * 90}" r="8" fill="none" stroke="#7c3aed" stroke-width="2"/>
        <text x="150" y="${65 + idx * 90}" font-family="'Courier New', monospace" font-size="16" fill="#333">
          ${escapeXml(bullet.substring(0, 40))}
        </text>
      `).join('')}
    </g>

    <!-- Right side: Visual placeholder -->
    <rect x="900" y="50" width="600" height="350" fill="#f0f9ff" stroke="#0284c7" stroke-width="2" stroke-dasharray="10,5"/>
    <line x1="950" y1="100" x2="1450" y2="300" stroke="#cbd5e1" stroke-width="1"/>
    <line x1="1450" y1="100" x2="950" y2="300" stroke="#cbd5e1" stroke-width="1"/>
    <text x="1200" y="230" font-family="'Courier New', monospace" font-size="18" fill="#64748b" text-anchor="middle">
      [VISUAL ELEMENT]
    </text>
    <text x="1200" y="260" font-family="'Courier New', monospace" font-size="14" fill="#94a3b8" text-anchor="middle">
      Icon / Diagram / Chart
    </text>
  `;
}

function generateBulletsOnlyWireframe(bullets: string[]): string {
  // bulletsが空の場合はデフォルト値を使用
  const items = bullets.length > 0 ? bullets : ['概要説明', '背景情報', '課題認識', '提案内容', '期待効果', '次のステップ'];

  return items.slice(0, 6).map((bullet, idx) => `
    <rect x="100" y="${50 + idx * 80}" width="1400" height="70" fill="${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}" stroke="#e2e8f0" stroke-width="1"/>
    <circle cx="140" cy="${85 + idx * 80}" r="6" fill="#7c3aed"/>
    <text x="170" y="${90 + idx * 80}" font-family="'Courier New', monospace" font-size="16" fill="#333">
      ${escapeXml(bullet.substring(0, 90))}
    </text>
  `).join('');
}

// モック画像を生成する関数（SVGをBase64に変換）
function generateMockSlideImage(slide: any): string {
  const { title, mainMessage, content, layout, order, visualHint, visualIntent } = slide;

  // If visualIntent exists, generate wireframe-style mock
  if (visualIntent) {
    return generateWireframeMockImage(slide);
  }

  // スライドタイトルを取得
  const slideTitle = title || content.title || 'タイトル';
  const message = mainMessage || '';
  const bullets = content.bullets || [];
  const bodyText = content.body || '';

  // レイアウトに応じてデザインを変更
  let contentSVG = '';

  if (bullets.length > 0) {
    // 箇条書きレイアウト：プロフェッショナルなデザイン
    contentSVG = `
      <!-- 箇条書きセクション -->
      ${bullets.slice(0, 5).map((bullet: string, idx: number) => {
        const yPos = 320 + idx * 95;
        return `
        <!-- 箇条書き項目 ${idx + 1} -->
        <rect x="80" y="${yPos - 25}" width="1440" height="80" fill="${idx % 2 === 0 ? '#f8f9fa' : '#ffffff'}" stroke="#e9ecef" stroke-width="1"/>
        <circle cx="120" cy="${yPos + 10}" r="6" fill="#7c3aed"/>
        <text x="150" y="${yPos + 5}" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#1f2937">
          ${escapeXml(bullet.substring(0, 100))}
        </text>
        ${bullet.length > 100 ? `
        <text x="150" y="${yPos + 30}" font-family="Arial, sans-serif" font-size="20" fill="#6b7280">
          ${escapeXml(bullet.substring(100, 180))}${bullet.length > 180 ? '...' : ''}
        </text>
        ` : ''}
      `}).join('')}
    `;
  } else if (bodyText) {
    // 本文レイアウト：カード風デザイン
    const lines = wrapText(bodyText, 90);
    contentSVG = `
      <!-- 本文カード -->
      <rect x="80" y="300" width="1440" height="${Math.min(500, lines.length * 40 + 60)}" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2" rx="8"/>
      ${lines.slice(0, 10).map((line: string, idx: number) => `
        <text x="120" y="${350 + idx * 40}" font-family="Arial, sans-serif" font-size="24" fill="#374151">
          ${escapeXml(line)}
        </text>
      `).join('')}
    `;
  } else {
    // デフォルト：ビジュアル要素のラフスケッチ
    contentSVG = `
      <!-- 左側：プロセスフロー図のラフ -->
      <rect x="80" y="320" width="680" height="480" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="8"/>

      <!-- プロセスステップ1 -->
      <rect x="120" y="360" width="180" height="100" fill="#e0e7ff" stroke="#7c3aed" stroke-width="2" rx="4"/>
      <text x="210" y="405" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#5b21b6" text-anchor="middle">
        STEP 1
      </text>
      <text x="210" y="430" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        現状分析
      </text>

      <!-- 矢印1 -->
      <path d="M 310 410 L 350 410" stroke="#7c3aed" stroke-width="3" fill="none"/>
      <path d="M 345 405 L 355 410 L 345 415" fill="#7c3aed"/>

      <!-- プロセスステップ2 -->
      <rect x="360" y="360" width="180" height="100" fill="#ddd6fe" stroke="#7c3aed" stroke-width="2" rx="4"/>
      <text x="450" y="405" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#5b21b6" text-anchor="middle">
        STEP 2
      </text>
      <text x="450" y="430" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        課題設定
      </text>

      <!-- 矢印2 -->
      <path d="M 550 410 L 590 410" stroke="#7c3aed" stroke-width="3" fill="none"/>
      <path d="M 585 405 L 595 410 L 585 415" fill="#7c3aed"/>

      <!-- プロセスステップ3 -->
      <rect x="600" y="360" width="140" height="100" fill="#c4b5fd" stroke="#7c3aed" stroke-width="2" rx="4"/>
      <text x="670" y="405" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#5b21b6" text-anchor="middle">
        STEP 3
      </text>
      <text x="670" y="430" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        実行
      </text>

      <!-- サブテキスト -->
      <text x="120" y="500" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • データ収集
      </text>
      <text x="120" y="530" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 要因分析
      </text>
      <text x="120" y="560" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 仮説構築
      </text>

      <text x="360" y="500" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 課題の特定
      </text>
      <text x="360" y="530" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 優先順位付け
      </text>

      <text x="600" y="500" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 施策立案
      </text>
      <text x="600" y="530" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        • 実行計画
      </text>

      <!-- 右側：データチャートのラフ -->
      <rect x="840" y="320" width="680" height="480" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="8"/>

      <!-- チャートタイトル -->
      <text x="1180" y="360" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#1f2937" text-anchor="middle">
        実績推移（イメージ）
      </text>

      <!-- 棒グラフ風 -->
      <rect x="900" y="550" width="80" height="120" fill="#93c5fd" stroke="#3b82f6" stroke-width="2"/>
      <text x="940" y="590" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1e40af" text-anchor="middle">
        85%
      </text>
      <text x="940" y="690" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        2022
      </text>

      <rect x="1020" y="500" width="80" height="170" fill="#86efac" stroke="#22c55e" stroke-width="2"/>
      <text x="1060" y="545" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#166534" text-anchor="middle">
        95%
      </text>
      <text x="1060" y="690" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        2023
      </text>

      <rect x="1140" y="420" width="80" height="250" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
      <text x="1180" y="460" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#92400e" text-anchor="middle">
        120%
      </text>
      <text x="1180" y="690" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        2024
      </text>

      <rect x="1260" y="380" width="80" height="290" fill="#c084fc" stroke="#a855f7" stroke-width="2"/>
      <text x="1300" y="420" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#6b21a8" text-anchor="middle">
        145%
      </text>
      <text x="1300" y="690" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">
        目標
      </text>

      <!-- 軸線 -->
      <line x1="880" y1="680" x2="1360" y2="680" stroke="#9ca3af" stroke-width="2"/>
      <line x1="880" y1="380" x2="880" y2="680" stroke="#9ca3af" stroke-width="2"/>

      <!-- 成長トレンド矢印 -->
      <path d="M 920 520 Q 1060 450, 1320 390" stroke="#7c3aed" stroke-width="3" fill="none" stroke-dasharray="5,5"/>
      <text x="1180" y="440" font-family="Arial, sans-serif" font-size="16" fill="#7c3aed" font-style="italic">
        ↗ 成長トレンド
      </text>
    `;
  }

  // SVGでプロフェッショナルなスライドモックアップを作成
  const svg = `
    <svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
      <!-- グラデーション背景 -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- 背景 -->
      <rect width="1600" height="900" fill="url(#bgGradient)"/>

      <!-- ヘッダーバー -->
      <rect width="1600" height="8" fill="url(#headerGradient)"/>

      <!-- スライド番号バッジ -->
      <circle cx="1500" cy="60" r="32" fill="#7c3aed" opacity="0.1"/>
      <text x="1500" y="70" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#7c3aed" text-anchor="middle">
        ${(order || 0) + 1}
      </text>

      <!-- タイトルエリア -->
      <rect x="60" y="100" width="1480" height="140" fill="#ffffff" stroke="#e5e7eb" stroke-width="1" rx="4"/>

      <!-- アクセントライン -->
      <rect x="60" y="100" width="8" height="140" fill="#7c3aed" rx="4"/>

      <!-- タイトルテキスト -->
      <text x="90" y="155" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#1f2937">
        ${escapeXml(slideTitle)}
      </text>

      <!-- メインメッセージ -->
      ${message ? `
      <text x="90" y="205" font-family="Arial, sans-serif" font-size="26" fill="#6b7280" font-style="italic">
        ${escapeXml(message.substring(0, 120))}${message.length > 120 ? '...' : ''}
      </text>
      ` : ''}

      <!-- コンテンツエリア -->
      ${contentSVG}

      <!-- フッター -->
      <rect y="880" width="1600" height="20" fill="#f1f5f9"/>

      <!-- モックラベル（小さく控えめに） -->
      <rect x="1380" y="840" width="180" height="32" fill="#fef3c7" stroke="#fbbf24" stroke-width="1" rx="4"/>
      <text x="1470" y="862" font-family="Arial, sans-serif" font-size="16" fill="#92400e" text-anchor="middle">
        🎨 DEMO SLIDE
      </text>

      <!-- レイアウト情報 -->
      <text x="60" y="865" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
        Layout: ${layout}
      </text>
    </svg>
  `;

  // SVGをBase64に変換
  const base64 = Buffer.from(svg.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// テキストを指定文字数で折り返す補助関数
function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

// XMLエスケープ関数
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 複合表現用のレイアウト指示を生成する関数
function getCompositeLayoutInstructions(
  compositeVisual: CompositeVisualConfig,
  bullets: string[]
): string {
  const { primaryPattern, secondaryPattern, layoutType, relationDescription } = compositeVisual;
  const itemCount = bullets.length || 4;

  // レイアウトタイプに応じた配置指示
  const layoutInstructions: Record<CompositeLayoutType, string> = {
    'left-right': `【左右分割レイアウト】
- 画面を左右に分割（左60%、右40%程度）
- 左側: 主表現（${getPatternLabel(primaryPattern)}）を配置
- 右側: 補助表現（${getPatternLabel(secondaryPattern)}）を配置
- 左右の要素は視覚的に関連づけてください`,

    'right-left': `【右左分割レイアウト】
- 画面を左右に分割（左40%、右60%程度）
- 左側: 補助表現（${getPatternLabel(secondaryPattern)}）を配置
- 右側: 主表現（${getPatternLabel(primaryPattern)}）を配置
- 左右の要素は視覚的に関連づけてください`,

    'top-bottom': `【上下分割レイアウト】
- 画面を上下に分割（上40%、下60%程度）
- 上部: 主表現（${getPatternLabel(primaryPattern)}）を配置
- 下部: 補助表現（${getPatternLabel(secondaryPattern)}）を配置
- 上下の要素は矢印や線で関連を示してください`,

    'bottom-top': `【下上分割レイアウト】
- 画面を上下に分割（上60%、下40%程度）
- 上部: 補助表現（${getPatternLabel(secondaryPattern)}）を配置
- 下部: 主表現（${getPatternLabel(primaryPattern)}）を配置
- 上下の要素は矢印や線で関連を示してください`,

    'main-inset': `【メイン+インセットレイアウト】
- メインエリア: 主表現（${getPatternLabel(primaryPattern)}）を大きく配置
- 右下または左下のコーナーに補助表現（${getPatternLabel(secondaryPattern)}）をインセットで小さく配置
- インセットは背景を少し透過させて重ねる`,

    'side-by-side': `【横並び均等レイアウト】
- 画面を均等に2分割（各50%）
- 左側: 主表現（${getPatternLabel(primaryPattern)}）
- 右側: 補助表現（${getPatternLabel(secondaryPattern)}）
- 同じサイズで並列表示し、両者の関連を明確に`,
  };

  const baseLayoutInstruction = layoutInstructions[layoutType] || layoutInstructions['left-right'];

  // 各表現タイプの詳細指示
  const primaryInstruction = getPatternInstruction(primaryPattern, itemCount, '主表現');
  const secondaryInstruction = getPatternInstruction(secondaryPattern, itemCount, '補助表現');

  return `## 複合表現スライド
${relationDescription ? `【表現の関連性】${relationDescription}\n` : ''}
${baseLayoutInstruction}

### 主表現の詳細（${getPatternLabel(primaryPattern)}）
${primaryInstruction}

### 補助表現の詳細（${getPatternLabel(secondaryPattern)}）
${secondaryInstruction}

### 重要な注意点
- 2つの表現は**視覚的に関連づけ**てください（色の統一、矢印での接続、共通要素の強調など）
- 両者が**1つのメッセージを伝える**よう統合的にデザインしてください
- 情報が分断されないよう、適切な視覚的つながりを設けてください`;
}

// パターンのラベルを取得
function getPatternLabel(pattern: string): string {
  const labels: Record<string, string> = {
    'process-flow': 'プロセスフロー',
    'hierarchy': '階層構造',
    'pyramid': 'ピラミッド',
    'tree': 'ツリー図',
    'cycle': 'サイクル図',
    'comparison': '比較表',
    'matrix': 'マトリクス',
    'positioning-map': 'ポジショニングマップ',
    'gap-analysis': 'ギャップ分析',
    'timeline': 'タイムライン',
    'roadmap': 'ロードマップ',
    'bar-chart': '棒グラフ',
    'line-chart': '折れ線グラフ',
    'pie-chart': '円グラフ',
    'kpi-dashboard': 'KPIダッシュボード',
    'cause-effect': '因果関係図',
    'funnel': 'ファネル図',
    'swimlane': 'スイムレーン',
    'bullets-with-visual': '箇条書き+ビジュアル',
    'bullets-only': '箇条書き',
    'closed-loop-ecosystem': '循環エコシステム',
    'strategic-temple': '戦略の神殿',
    'hub-spoke-detailed': 'ハブ&スポーク',
  };
  return labels[pattern] || pattern;
}

// パターンごとの詳細指示を取得
function getPatternInstruction(pattern: string, itemCount: number, role: string): string {
  const instructions: Record<string, string> = {
    'process-flow': `${role}として${itemCount}ステップのプロセスフローを描画。矢印で接続。`,
    'hierarchy': `${role}として階層構造を描画。上位から下位への関係を明確に。`,
    'pyramid': `${role}としてピラミッド図を描画。重要度の階層を表現。`,
    'tree': `${role}としてツリー図を描画。MECE分解を視覚化。`,
    'matrix': `${role}として2x2マトリクスを描画。4象限に分類。`,
    'comparison': `${role}としてBefore/After比較を描画。左右または上下で対比。`,
    'timeline': `${role}として時系列を描画。マイルストーンを配置。`,
    'roadmap': `${role}としてロードマップを描画。フェーズごとの計画を表示。`,
    'bar-chart': `${role}として棒グラフを描画。数値比較を視覚化。`,
    'line-chart': `${role}として折れ線グラフを描画。推移を表現。`,
    'kpi-dashboard': `${role}としてKPI指標を描画。重要数値を大きく表示。`,
    'cause-effect': `${role}として因果関係図を描画。原因→結果の流れを矢印で表現。`,
    'funnel': `${role}としてファネル図を描画。段階的な絞り込みを表現。`,
    'gap-analysis': `${role}として現状と目標のギャップを描画。差分を強調。`,
    'bullets-with-visual': `${role}として箇条書きとアイコンを組み合わせて描画。`,
    'bullets-only': `${role}として${itemCount}項目の箇条書きを描画。`,
    'closed-loop-ecosystem': `${role}として循環するエコシステム図を描画。`,
    'strategic-temple': `${role}として戦略の神殿構造を描画。Vision/Pillars/Foundation。`,
    'hub-spoke-detailed': `${role}として中心から放射状に広がる図を描画。`,
  };
  return instructions[pattern] || `${role}として適切な図解を描画。`;
}

