import type { SlideElement, SlideType } from '@/types';
import { generateId } from '@/lib/utils';
import { defaultStructurePresetBySlideType } from '@/types/slideStructure';

/**
 * 提案書テンプレート定義
 * 新規作成時に選択可能な提案書の雛形
 */
export type ProposalTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  slides: {
    type: SlideType;
    title: string;
    mainMessage: string;
    bullets: string[];
  }[];
};

/**
 * 標準コンサル提案書テンプレート
 */
export const proposalTemplates: ProposalTemplate[] = [
  {
    id: 'consulting-standard',
    name: 'コンサル提案書（標準）',
    description: '現状認識→課題設定→ToBe像→アプローチの標準的な構成',
    icon: '📋',
    slides: [
      {
        type: 'executive_summary',
        title: 'エグゼクティブサマリー',
        mainMessage: '本提案の概要と期待される成果',
        bullets: ['背景と課題', '提案内容', '期待効果', '実施スケジュール'],
      },
      {
        type: 'current_recognition',
        title: '現状認識',
        mainMessage: '現在の状況と直面している問題',
        bullets: ['業界・市場環境', '自社の現状', '顕在化している問題'],
      },
      {
        type: 'issue_setting',
        title: '課題設定',
        mainMessage: '解決すべき本質的な課題',
        bullets: ['根本原因の分析', 'クリティカルな課題', '課題の優先順位'],
      },
      {
        type: 'tobe_vision',
        title: 'ToBe像',
        mainMessage: '目指すべき理想の姿',
        bullets: ['ビジョン', '達成目標', 'KPI設定'],
      },
      {
        type: 'approach_overview',
        title: 'アプローチ全体像',
        mainMessage: '目標達成に向けた実行計画',
        bullets: ['実施フェーズ', '主要施策', 'マイルストーン'],
      },
      {
        type: 'schedule',
        title: 'スケジュール',
        mainMessage: 'プロジェクトの実施計画',
        bullets: ['フェーズ1', 'フェーズ2', 'フェーズ3'],
      },
      {
        type: 'team',
        title: '体制',
        mainMessage: 'プロジェクト推進体制',
        bullets: ['プロジェクトマネージャー', 'コンサルタント', 'クライアント側担当'],
      },
    ],
  },
  {
    id: 'consulting-detailed',
    name: 'コンサル提案書（詳細版）',
    description: '課題ツリーや詳細アプローチを含む充実した構成',
    icon: '📊',
    slides: [
      {
        type: 'executive_summary',
        title: 'エグゼクティブサマリー',
        mainMessage: '本提案の概要と期待される成果',
        bullets: ['背景と課題', '提案内容', '期待効果', '実施スケジュール'],
      },
      {
        type: 'current_recognition',
        title: '現状認識：業界環境',
        mainMessage: '業界を取り巻く環境変化',
        bullets: ['市場トレンド', '競合動向', '規制環境'],
      },
      {
        type: 'current_recognition',
        title: '現状認識：自社状況',
        mainMessage: '自社の現状と課題',
        bullets: ['事業状況', '組織体制', '直面する問題'],
      },
      {
        type: 'issue_setting',
        title: '課題の構造化',
        mainMessage: '問題の根本原因を構造的に分析',
        bullets: ['表面的な問題', '構造的な原因', '根本原因仮説'],
      },
      {
        type: 'issue_tree',
        title: '課題ツリー',
        mainMessage: '課題をMECEに分解',
        bullets: ['大課題1', '大課題2', '大課題3'],
      },
      {
        type: 'tobe_vision',
        title: 'ToBe像',
        mainMessage: '3年後に目指す姿',
        bullets: ['事業面', '組織面', '財務面'],
      },
      {
        type: 'project_goal',
        title: 'プロジェクト目標',
        mainMessage: '本プロジェクトで達成する目標',
        bullets: ['短期目標', '中期目標', '成功指標'],
      },
      {
        type: 'approach_overview',
        title: 'アプローチ全体像',
        mainMessage: '目標達成に向けた3つのフェーズ',
        bullets: ['現状分析', '戦略策定', '実行支援'],
      },
      {
        type: 'approach_detail',
        title: 'アプローチ詳細',
        mainMessage: '各フェーズの詳細内容',
        bullets: ['フェーズ1詳細', 'フェーズ2詳細', 'フェーズ3詳細'],
      },
      {
        type: 'why_this_approach',
        title: 'なぜこのアプローチか',
        mainMessage: '本アプローチを選択した理由',
        bullets: ['過去の成功事例', '貴社への適合性', '期待効果'],
      },
      {
        type: 'schedule',
        title: 'スケジュール',
        mainMessage: '6ヶ月間のプロジェクト計画',
        bullets: ['Month 1-2', 'Month 3-4', 'Month 5-6'],
      },
      {
        type: 'team',
        title: '体制',
        mainMessage: 'プロジェクト推進体制',
        bullets: ['PMO', 'コンサルチーム', 'クライアントチーム'],
      },
      {
        type: 'estimate',
        title: '見積もり',
        mainMessage: 'プロジェクト費用',
        bullets: ['コンサルティングフィー', '実費', '合計'],
      },
    ],
  },
  {
    id: 'quick-proposal',
    name: 'クイック提案',
    description: '最小限の構成でスピーディに作成',
    icon: '⚡',
    slides: [
      {
        type: 'current_recognition',
        title: '現状と課題',
        mainMessage: '現在直面している課題',
        bullets: ['現状', '課題', '影響'],
      },
      {
        type: 'tobe_vision',
        title: '目指す姿',
        mainMessage: '解決後の理想像',
        bullets: ['目標', '効果', 'KPI'],
      },
      {
        type: 'approach_overview',
        title: '提案内容',
        mainMessage: '課題解決のアプローチ',
        bullets: ['施策1', '施策2', '施策3'],
      },
    ],
  },
];

/**
 * テンプレートからスライド要素を生成
 */
export function generateSlidesFromTemplate(template: ProposalTemplate): SlideElement[] {
  return template.slides.map((slideConfig, index) => {
    const defaultPreset = defaultStructurePresetBySlideType[slideConfig.type];

    return {
      id: generateId(),
      type: slideConfig.type,
      order: index,
      title: slideConfig.title,
      mainMessage: slideConfig.mainMessage,
      layout: 'title-bullets' as const,
      content: {
        bullets: slideConfig.bullets,
      },
      // 構造プリセットのデフォルト設定
      structurePreset: defaultPreset?.preset,
      useStructureMode: defaultPreset?.useStructureMode ?? false,
    };
  });
}

/**
 * 白紙のスライド構成（最小限）
 */
export function generateBlankSlides(): SlideElement[] {
  return [
    {
      id: generateId(),
      type: 'executive_summary',
      order: 0,
      title: '表紙',
      mainMessage: '',
      layout: 'title-only' as const,
      content: {
        bullets: [],
      },
    },
  ];
}

/**
 * テンプレートIDから取得
 */
export function getProposalTemplateById(id: string): ProposalTemplate | undefined {
  return proposalTemplates.find((t) => t.id === id);
}
