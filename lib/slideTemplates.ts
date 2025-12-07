import type { SlideTemplate } from '@/types';

/**
 * スライドテンプレート定義
 * 提案書作成時に選択可能なスライドのテンプレート
 */
export const slideTemplates: SlideTemplate[] = [
  // 現状認識セクション
  {
    id: 'background',
    category: 'current_recognition',
    title: '背景',
    description: 'クライアントの現状や業界環境を説明',
    layout: 'title-content',
    defaultContent: {
      title: '背景',
      bullets: [
        '業界・市場環境',
        '企業の現状',
        '直面している状況',
      ],
    },
  },
  {
    id: 'current-problems',
    category: 'current_recognition',
    title: '現在の問題',
    description: '顕在化している問題を整理',
    layout: 'title-bullets',
    defaultContent: {
      title: '現在直面している問題',
      bullets: [
        '問題1: [具体的な問題]',
        '問題2: [具体的な問題]',
        '問題3: [具体的な問題]',
      ],
    },
  },
  {
    id: 'root-cause',
    category: 'current_recognition',
    title: '根本原因仮説',
    description: '問題の根本原因を分析',
    layout: 'title-content',
    defaultContent: {
      title: '根本原因仮説',
      bullets: [
        '原因1: [仮説]',
        '原因2: [仮説]',
        '原因3: [仮説]',
      ],
    },
  },

  // 課題設定セクション
  {
    id: 'critical-issues',
    category: 'issue_setting',
    title: 'クリティカルな課題',
    description: '最も重要な解決すべき課題',
    layout: 'title-bullets',
    defaultContent: {
      title: '解決すべきクリティカルな課題',
      bullets: [
        '課題1: [具体的な課題]',
        '課題2: [具体的な課題]',
      ],
    },
  },
  {
    id: 'issue-breakdown',
    category: 'issue_setting',
    title: '課題の分解',
    description: '課題をMECEに分解',
    layout: 'hierarchy',
    defaultContent: {
      title: '課題の分解（MECE）',
      bullets: [
        '大課題1',
        '  - 小課題1-1',
        '  - 小課題1-2',
        '大課題2',
        '  - 小課題2-1',
        '  - 小課題2-2',
      ],
    },
  },

  // ToBe像セクション
  {
    id: 'tobe-vision',
    category: 'tobe_vision',
    title: 'ToBe像',
    description: '目指すべき理想的な姿',
    layout: 'title-content',
    defaultContent: {
      title: 'ToBe像：目指すべき姿',
      bullets: [
        'ビジョン: [将来の理想的な状態]',
        '達成指標: [KPI・目標値]',
      ],
    },
  },
  {
    id: 'goals',
    category: 'tobe_vision',
    title: '具体的な目標',
    description: '達成すべき具体的な目標',
    layout: 'title-bullets',
    defaultContent: {
      title: '具体的な目標',
      bullets: [
        '目標1: [定量的な目標]',
        '目標2: [定量的な目標]',
        '目標3: [定量的な目標]',
      ],
    },
  },
  {
    id: 'project-scope',
    category: 'tobe_vision',
    title: 'プロジェクトスコープ',
    description: 'プロジェクトの範囲と境界',
    layout: 'title-content',
    defaultContent: {
      title: 'プロジェクトスコープ',
      bullets: [
        '対象範囲: [スコープ内]',
        '対象外: [スコープ外]',
        '期間: [プロジェクト期間]',
      ],
    },
  },

  // アプローチセクション
  {
    id: 'approach-overview',
    category: 'approach',
    title: 'アプローチ全体像',
    description: 'プロジェクトの全体的なアプローチ',
    layout: 'title-content',
    defaultContent: {
      title: 'アプローチ全体像',
      bullets: [
        'フェーズ1: [内容]',
        'フェーズ2: [内容]',
        'フェーズ3: [内容]',
      ],
    },
  },
  {
    id: 'methodology',
    category: 'approach',
    title: '方法論',
    description: '採用する方法論やフレームワーク',
    layout: 'title-content',
    defaultContent: {
      title: '方法論',
      bullets: [
        '採用フレームワーク: [フレームワーク名]',
        '実施方法: [具体的な方法]',
      ],
    },
  },
  {
    id: 'steps',
    category: 'approach',
    title: '実施ステップ',
    description: '具体的な実施ステップ',
    layout: 'steps',
    defaultContent: {
      title: '実施ステップ',
      bullets: [
        'Step 1: [ステップ名] - [内容]',
        'Step 2: [ステップ名] - [内容]',
        'Step 3: [ステップ名] - [内容]',
        'Step 4: [ステップ名] - [内容]',
      ],
    },
  },
  {
    id: 'deliverables',
    category: 'approach',
    title: '成果物',
    description: 'プロジェクトの成果物',
    layout: 'title-bullets',
    defaultContent: {
      title: '主要成果物',
      bullets: [
        '成果物1: [名称と内容]',
        '成果物2: [名称と内容]',
        '成果物3: [名称と内容]',
      ],
    },
  },
  {
    id: 'timeline',
    category: 'approach',
    title: 'タイムライン',
    description: 'プロジェクトのスケジュール',
    layout: 'timeline',
    defaultContent: {
      title: 'タイムライン',
      bullets: [
        '月1: [マイルストーン]',
        '月2-3: [マイルストーン]',
        '月4-5: [マイルストーン]',
        '月6: [マイルストーン]',
      ],
    },
  },

  // その他の汎用スライド
  {
    id: 'title-slide',
    category: 'other',
    title: 'タイトルスライド',
    description: '提案書の表紙',
    layout: 'title-only',
    defaultContent: {
      title: '[提案書タイトル]',
      bullets: [
        '[作成日]',
        '[作成者]',
      ],
    },
  },
  {
    id: 'summary',
    category: 'other',
    title: 'まとめ',
    description: '提案内容のサマリー',
    layout: 'title-bullets',
    defaultContent: {
      title: 'まとめ',
      bullets: [
        'ポイント1',
        'ポイント2',
        'ポイント3',
      ],
    },
  },
  {
    id: 'next-steps',
    category: 'other',
    title: 'ネクストステップ',
    description: '今後の進め方',
    layout: 'title-bullets',
    defaultContent: {
      title: 'ネクストステップ',
      bullets: [
        'ステップ1: [内容]',
        'ステップ2: [内容]',
        'ステップ3: [内容]',
      ],
    },
  },
];

/**
 * カテゴリー別にスライドテンプレートを取得
 */
export function getTemplatesByCategory(category: SlideTemplate['category']) {
  return slideTemplates.filter((template) => template.category === category);
}

/**
 * IDでスライドテンプレートを取得
 */
export function getTemplateById(id: string) {
  return slideTemplates.find((template) => template.id === id);
}
