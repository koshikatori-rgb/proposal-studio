/**
 * スライド情報を他のAI（NotebookLM, Gamma, Canva等）向けにエクスポートするユーティリティ
 *
 * ビジュアル表現の指示も含めて、そのままコピペで画像/スライド生成を依頼できる形式で出力
 */

import type { SlideElement, VisualHintType, Outline } from '@/types';

// ビジュアルヒントの日本語説明マップ
const visualHintDescriptions: Record<VisualHintType, string> = {
  // 構造系
  'process-flow': 'プロセスフロー図（ステップ1→2→3の矢印で流れを表現）',
  'hierarchy': '階層構造図（上位概念から下位概念へツリー状に展開）',
  'pyramid': 'ピラミッド図（頂点に最重要項目、下に向かって詳細化）',
  'tree': 'ツリー図（MECE分解、枝分かれ構造）',
  'cycle': 'サイクル図（循環するプロセスを円形に表現）',
  'convergence': '収束図（複数の要素が1つの結論に向かう）',
  'divergence': '発散図（1つの原因から複数の結果に広がる）',
  'funnel': 'ファネル図（上から下へ絞り込むプロセス）',
  'swimlane': 'スイムレーン図（部門/役割ごとにレーンを分けたプロセス）',
  // 比較系
  'comparison': '比較表（項目を横並びで比較、Before/After等）',
  'matrix': '2x2マトリクス（2軸で4象限に分類）',
  'positioning-map': 'ポジショニングマップ（2軸上に複数要素を配置）',
  'gap-analysis': 'ギャップ分析図（現状とあるべき姿の差を視覚化）',
  'swot': 'SWOT分析（強み・弱み・機会・脅威の4象限）',
  // 時間軸系
  'timeline': 'タイムライン（時系列で出来事を配置）',
  'gantt': 'ガントチャート（横棒で期間を示すスケジュール）',
  'roadmap': 'ロードマップ（中長期計画を時間軸で表現）',
  'milestone': 'マイルストーン図（重要な節目をマーク）',
  // データ系
  'bar-chart': '棒グラフ（数値を棒の長さで比較）',
  'stacked-bar': '積み上げ棒グラフ（構成比を棒の中で分割）',
  'pie-chart': '円グラフ（全体に占める割合を扇形で表現）',
  'line-chart': '折れ線グラフ（時系列の推移を線で表現）',
  'waterfall': 'ウォーターフォールチャート（増減の積み上げを視覚化）',
  'radar': 'レーダーチャート（多軸評価を蜘蛛の巣状に表現）',
  'bridge': 'ブリッジチャート（差異の要因分解）',
  'kpi-dashboard': 'KPIダッシュボード（重要指標を数字ボックスで強調）',
  // 関係性系
  'cause-effect': '因果関係図（原因→結果を矢印で接続）',
  'value-chain': 'バリューチェーン（価値創出の流れを横に展開）',
  'venn': 'ベン図（重なりで共通点を表現）',
  'stakeholder-map': 'ステークホルダーマップ（関係者の位置関係を図示）',
  'org-chart': '組織図（階層的な組織構造）',
  // シンプル系
  'bullets-with-visual': 'アイコン付き箇条書き（各項目に象徴的なアイコン）',
  'icon-grid': 'アイコングリッド（3〜6個の項目をアイコン付きで並べる）',
  'bullets-only': 'シンプルな箇条書き（テキストのみ）',
  // 複合レイアウト系
  'before-after-diagram': 'Before/After図（左右分割で変化を対比）',
  'concept-explanation': '概念図+説明（左に図、右にテキスト）',
  'flow-with-message': 'フロー図+メッセージ（図と要約テキストの組み合わせ）',
  'chart-with-insight': 'グラフ+インサイト（左にグラフ、右に示唆）',
  'problem-solution': '問題→解決策（左に問題、右に解決策を対比）',
  'framework-application': 'フレームワーク適用（理論と実践の対比）',
  'summary-detail': 'サマリー+詳細（要点ボックス+展開）',
  'multi-column-options': '複数列比較（3列以上の選択肢を並べる）',
  'timeline-with-details': 'タイムライン+詳細（時間軸と各フェーズ説明）',
  'action-plan': 'アクションプラン（担当・期限を含む実行計画）',
  'impact-analysis': 'インパクト分析（現状→将来+定量効果）',
  // 戦略フレームワーク系
  'closed-loop-ecosystem': '循環エコシステム（中央ループ+外部要素）',
  'strategic-temple': '戦略の神殿（Vision/Pillars/Foundationの3層）',
  'hub-spoke-detailed': 'ハブ&スポーク（中心から放射状に展開）',
};

// スライドタイプの日本語ラベル
const slideTypeLabels: Record<string, string> = {
  'executive_summary': 'エグゼクティブサマリー',
  'current_recognition': '現状認識',
  'issue_setting': '課題設定',
  'issue_tree': 'イシューツリー',
  'tobe_vision': 'ToBe像・目指すべき姿',
  'expected_effect': '期待効果・投資対効果',
  'project_goal': 'プロジェクト目標',
  'approach_overview': 'アプローチ概要',
  'approach_detail': 'アプローチ詳細',
  'why_this_approach': 'なぜこのアプローチか',
  'why_us': 'Why Us・選定理由',
  'risk_management': 'リスク管理',
  'schedule': 'スケジュール',
  'team': '体制',
  'meeting_structure': '会議体設計',
  'estimate': '見積り',
  'estimate_assumptions': '見積り前提条件',
  'project_members': 'メンバー紹介',
  'appendix': 'Appendix',
};

/**
 * 単一スライドのエクスポートテキストを生成
 */
function generateSlideExportText(slide: SlideElement, index: number): string {
  const typeLabel = slideTypeLabels[slide.type || ''] || slide.type || '未分類';
  const visualDesc = slide.visualHint ? visualHintDescriptions[slide.visualHint] : null;

  let text = `
================================================================================
スライド ${index + 1}: ${slide.title || typeLabel}
================================================================================

【スライドタイプ】${typeLabel}

【メッセージライン（このスライドで伝えたい1行メッセージ）】
${slide.mainMessage || '（未設定）'}

【本文・内容】
${formatBullets(slide.content?.bullets || [], slide.content?.body)}

`;

  // ビジュアル表現の指示
  if (visualDesc || slide.visualHint) {
    text += `【推奨ビジュアル表現】
表現タイプ: ${visualDesc || slide.visualHint}
${slide.visualReason ? `選定理由: ${slide.visualReason}` : ''}
${slide.visualIntent ? `表現意図: ${slide.visualIntent}` : ''}

`;
  }

  // 複合表現がある場合
  if (slide.compositeVisual?.enabled) {
    const primaryDesc = visualHintDescriptions[slide.compositeVisual.primaryPattern as VisualHintType] || slide.compositeVisual.primaryPattern;
    const secondaryDesc = visualHintDescriptions[slide.compositeVisual.secondaryPattern as VisualHintType] || slide.compositeVisual.secondaryPattern;

    text += `【複合表現（2つのビジュアルを組み合わせ）】
主表現: ${primaryDesc}
副表現: ${secondaryDesc}
レイアウト: ${formatLayoutType(slide.compositeVisual.layoutType)}
関係性: ${slide.compositeVisual.relationDescription || ''}

`;
  }

  // 画像生成AIへの具体的な指示
  text += generateVisualizationPrompt(slide, typeLabel);

  return text;
}

/**
 * 箇条書きをフォーマット
 */
function formatBullets(bullets: string[], body?: string): string {
  if (bullets.length > 0) {
    return bullets.map((b, i) => `  ${i + 1}. ${b}`).join('\n');
  }
  if (body) {
    return body.split('\n').map(line => `  - ${line}`).join('\n');
  }
  return '（内容未設定）';
}

/**
 * レイアウトタイプを日本語に変換
 */
function formatLayoutType(layoutType: string): string {
  const layoutMap: Record<string, string> = {
    'left-right': '左右分割（左に主表現、右に副表現）',
    'right-left': '左右分割（左に副表現、右に主表現）',
    'top-bottom': '上下分割（上に主表現、下に副表現）',
    'bottom-top': '上下分割（上に副表現、下に主表現）',
    'main-inset': 'メイン+インセット（大きな主表現の中に小さな副表現）',
    'side-by-side': '横並び均等（同じサイズで並べる）',
  };
  return layoutMap[layoutType] || layoutType;
}

/**
 * 画像生成AI向けの具体的なプロンプトを生成
 */
function generateVisualizationPrompt(slide: SlideElement, typeLabel: string): string {
  const visualHint = slide.visualHint;
  const bullets = slide.content?.bullets || [];
  const body = slide.content?.body || '';

  let prompt = `【画像生成AIへの指示（そのままコピペ可能）】
以下の内容でビジネススライドを作成してください：

タイトル: ${slide.title || typeLabel}
メッセージ: ${slide.mainMessage || ''}

`;

  // ビジュアルタイプに応じた具体的な指示
  switch (visualHint) {
    case 'process-flow':
      const steps = bullets.length > 0 ? bullets : body.split('\n').filter(Boolean);
      prompt += `ビジュアル: ${steps.length}ステップのプロセスフロー図を作成
各ステップを矢印で接続し、左から右（または上から下）に流れを表現
ステップ内容:
${steps.map((s, i) => `  Step${i + 1}: ${s}`).join('\n')}
`;
      break;

    case 'matrix':
      prompt += `ビジュアル: 2x2マトリクスを作成
縦軸と横軸にラベルを付け、4象限に項目を配置
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
      break;

    case 'comparison':
    case 'before-after-diagram':
      prompt += `ビジュアル: 左右比較図を作成
左側と右側で対比構造を明確に
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
      break;

    case 'timeline':
    case 'gantt':
    case 'roadmap':
      prompt += `ビジュアル: タイムライン/ロードマップを作成
時間軸を横に配置し、各フェーズ/マイルストーンを表示
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
      break;

    case 'hierarchy':
    case 'tree':
    case 'pyramid':
      prompt += `ビジュアル: 階層構造図を作成
上位概念から下位へツリー状に展開
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
      break;

    case 'kpi-dashboard':
    case 'bar-chart':
      prompt += `ビジュアル: KPIダッシュボード/棒グラフを作成
数値を強調し、視覚的に比較できるように
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
      break;

    case 'icon-grid':
    case 'bullets-with-visual':
      prompt += `ビジュアル: アイコン付きの項目リストを作成
各項目に象徴的なアイコンを付けて視覚的に整理
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
      break;

    case 'cause-effect':
    case 'problem-solution':
      prompt += `ビジュアル: 因果関係/問題-解決図を作成
原因→結果、または問題→解決策の関係を矢印で接続
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
      break;

    case 'org-chart':
      prompt += `ビジュアル: 組織図/体制図を作成
階層的な組織構造をボックスと線で表現
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
      break;

    default:
      prompt += `ビジュアル: ${visualHintDescriptions[visualHint as VisualHintType] || 'シンプルな箇条書き'}
内容:
${bullets.map(b => `  - ${b}`).join('\n') || body}
`;
  }

  prompt += `
デザイン指針:
- ビジネスプレゼンテーション向けのプロフェッショナルなデザイン
- シンプルで読みやすいレイアウト
- 重要なポイントが一目でわかる視覚的階層
- 配色は青系統またはモノトーンを基調
`;

  return prompt;
}

/**
 * 全スライドのエクスポートテキストを生成
 */
export function generateFullExportText(slides: SlideElement[], outline?: Outline | null, proposalTitle?: string): string {
  let fullText = `
################################################################################
# 提案書スライド構成 - 他AI向けエクスポート
################################################################################

提案書タイトル: ${proposalTitle || '（未設定）'}
総スライド数: ${slides.length}枚
生成日時: ${new Date().toLocaleString('ja-JP')}

--------------------------------------------------------------------------------
使い方:
- このテキストをNotebookLM、Gamma、Canva AI、または他の生成AIにコピペしてください
- 各スライドの【画像生成AIへの指示】セクションは、そのままプロンプトとして使用できます
- スライドごとに個別に画像生成することも、全体を渡してスライドデッキを作成することも可能です
--------------------------------------------------------------------------------

`;

  // 全体サマリー
  if (outline) {
    fullText += `
================================================================================
【提案書の全体像】
================================================================================

■ 背景・現状認識
${outline.currentRecognition?.background || '（未設定）'}

■ 主要課題
${outline.issueSetting?.criticalIssues?.map((c, i) => `${i + 1}. ${c}`).join('\n') || '（未設定）'}

■ 目指すべき姿（ToBe）
${outline.toBeVision?.vision || '（未設定）'}

■ アプローチ概要
${outline.approach?.overview || '（未設定）'}

`;
  }

  // 各スライド
  fullText += `
================================================================================
【各スライドの詳細】
================================================================================
`;

  slides.forEach((slide, index) => {
    fullText += generateSlideExportText(slide, index);
    fullText += '\n';
  });

  // フッター
  fullText += `
################################################################################
# エクスポート完了
################################################################################

補足:
- 各スライドの【画像生成AIへの指示】をコピーして、画像生成AIに渡してください
- Gamma.appではこのテキスト全体を渡すと自動でスライド化できます
- NotebookLMでは資料として読み込み、質問応答に活用できます
- Canva AIではスライドごとにデザインを生成できます
`;

  return fullText;
}

/**
 * 単一スライドのエクスポートテキストを生成（外部公開）
 */
export function generateSingleSlideExport(slide: SlideElement, index: number): string {
  return generateSlideExportText(slide, index);
}

/**
 * Markdown形式でエクスポート（Gamma.app等向け）
 */
export function generateMarkdownExport(slides: SlideElement[], outline?: Outline | null, proposalTitle?: string): string {
  let md = `# ${proposalTitle || '提案書'}\n\n`;

  if (outline) {
    md += `## 概要\n\n`;
    md += `**背景**: ${outline.currentRecognition?.background || ''}\n\n`;
    md += `**目標**: ${outline.toBeVision?.vision || ''}\n\n`;
    md += `---\n\n`;
  }

  slides.forEach((slide, index) => {
    const typeLabel = slideTypeLabels[slide.type || ''] || '';
    md += `## ${index + 1}. ${slide.title || typeLabel}\n\n`;

    if (slide.mainMessage) {
      md += `> ${slide.mainMessage}\n\n`;
    }

    const bullets = slide.content?.bullets || [];
    const body = slide.content?.body || '';

    if (bullets.length > 0) {
      bullets.forEach(b => {
        md += `- ${b}\n`;
      });
      md += '\n';
    } else if (body) {
      md += `${body}\n\n`;
    }

    // ビジュアル指示をコメントとして追加
    if (slide.visualHint) {
      md += `<!-- 推奨ビジュアル: ${visualHintDescriptions[slide.visualHint] || slide.visualHint} -->\n\n`;
    }

    md += `---\n\n`;
  });

  return md;
}
