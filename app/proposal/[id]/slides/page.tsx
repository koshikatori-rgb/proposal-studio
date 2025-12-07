'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { SlidePreview } from '@/components/slides/SlidePreview';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { slideTemplates, getTemplatesByCategory } from '@/lib/slideTemplates';
import { saveProposal } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import type { SlideElement, SlideTemplate } from '@/types';

export default function SlidesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<SlideTemplate['category']>('current_recognition');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            提案書が見つかりません
          </h1>
          <p className="text-gray-600">
            指定された提案書は存在しないか、削除されました。
          </p>
        </Card>
      </div>
    );
  }

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleGenerateSlides = () => {
    if (selectedTemplates.length === 0) {
      alert('スライドを1つ以上選択してください');
      return;
    }

    // 選択されたテンプレートからスライドを生成
    const newSlides: SlideElement[] = selectedTemplates.map((templateId, index) => {
      const template = slideTemplates.find((t) => t.id === templateId);
      if (!template) throw new Error(`Template not found: ${templateId}`);

      return {
        id: generateId(),
        templateId: template.id,
        order: index,
        layout: template.layout,
        content: {
          title: template.defaultContent.title,
          bullets: template.defaultContent.bullets || [],
          body: '',
        },
      };
    });

    // 提案書を更新
    const updatedProposal = {
      ...proposal,
      slides: newSlides,
      updatedAt: Date.now(),
    };

    saveProposal(updatedProposal);

    // ドラフトページへ遷移
    router.push(`/proposal/${id}/draft`);
  };

  const categories: { id: SlideTemplate['category']; label: string }[] = [
    { id: 'current_recognition', label: '現状認識' },
    { id: 'issue_setting', label: '課題設定' },
    { id: 'tobe_vision', label: 'ToBe像' },
    { id: 'approach', label: 'アプローチ' },
    { id: 'other', label: 'その他' },
  ];

  const filteredTemplates = getTemplatesByCategory(activeCategory);

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* ヘッダー */}
        <div className="mb-16">
          <h1 className="text-2xl font-medium text-black tracking-wide mb-3">{proposal.title}</h1>
          <p className="text-sm text-gray-500 tracking-wide">
            {proposal.clientName}
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <span className="ml-2 font-medium text-gray-500">骨子作成</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <span className="ml-2 font-medium text-gray-900">スライド選択</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-2 font-medium text-gray-500">エクスポート</span>
            </div>
          </div>
        </div>

        {/* 説明 */}
        <Card className="mb-12">
          <h2 className="text-base font-medium text-black mb-4 tracking-wide">
            スライドテンプレートを選択
          </h2>
          <p className="text-sm text-gray-500 tracking-wide mb-3">
            提案書に含めたいスライドを選択してください。選択したスライドは自動的に生成されます。
          </p>
          <p className="text-xs text-gray-400 tracking-wide">
            選択済み: {selectedTemplates.length} 件
          </p>
        </Card>

        {/* カテゴリータブ */}
        <div className="mb-12 border-b border-gray-200">
          <div className="flex gap-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  px-2 py-4 text-xs font-medium border-b-2 transition-all tracking-wider uppercase
                  ${
                    activeCategory === category.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-400 hover:text-black'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* テンプレート一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 mb-16">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="relative bg-white">
              <div
                onClick={() => handleTemplateToggle(template.id)}
                className={`
                  p-8 cursor-pointer transition-all duration-200 h-full
                  ${
                    selectedTemplates.includes(template.id)
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'
                  }
                `}
              >
                {/* 選択チェックマーク */}
                {selectedTemplates.includes(template.id) && (
                  <div className="absolute top-4 right-4 bg-black text-white w-5 h-5 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}

                <h3 className="text-sm font-medium text-black mb-3 tracking-wide">
                  {template.title}
                </h3>
                <p className="text-xs text-gray-500 mb-6 tracking-wide leading-relaxed">
                  {template.description}
                </p>

                {/* プレビュー */}
                <div className="border border-gray-200 p-4 text-xs">
                  <p className="font-medium text-gray-700 mb-2 tracking-wide">
                    {template.defaultContent.title}
                  </p>
                  <ul className="space-y-1 text-gray-500">
                    {template.defaultContent.bullets?.slice(0, 3).map((bullet: string, index: number) => (
                      <li key={index} className="line-clamp-1 tracking-wide">• {bullet}</li>
                    ))}
                  </ul>
                </div>

                {/* レイアウトタイプ */}
                <div className="mt-4 text-xs text-gray-400 tracking-wide">
                  {getLayoutLabel(template.layout)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between">
          <Button
            onClick={() => router.push(`/proposal/${id}/outline`)}
            variant="outline"
          >
            ← 骨子作成に戻る
          </Button>
          <Button
            onClick={handleGenerateSlides}
            disabled={selectedTemplates.length === 0}
          >
            次へ: ドラフト確認 ({selectedTemplates.length}件)
          </Button>
        </div>
      </div>
    </div>
  );
}

function getLayoutLabel(layout: SlideElement['layout']): string {
  const labels: Record<SlideElement['layout'], string> = {
    'title-only': 'タイトルのみ',
    'title-content': 'タイトル+本文',
    'title-bullets': 'タイトル+箇条書き',
    'two-column': '2カラム',
    'hierarchy': '階層構造',
    'steps': 'ステップ',
    'timeline': 'タイムライン',
  };
  return labels[layout] || layout;
}
