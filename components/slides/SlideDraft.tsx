'use client';

import type { SlideElement } from '@/types';

type SlideDraftProps = {
  slide: SlideElement;
  onEdit?: () => void;
};

export const SlideDraft: React.FC<SlideDraftProps> = ({ slide, onEdit }) => {
  return (
    <div className="bg-white border-2 border-gray-300 p-8 aspect-[16/9] flex flex-col relative">
      {/* スライド番号 */}
      <div className="absolute top-4 right-4 text-xs text-gray-400 tracking-wide">
        #{slide.order + 1}
      </div>

      {/* タイトルエリア - 手書き風の下線 */}
      <div className="mb-6 pb-3 border-b-2 border-dashed border-gray-400">
        <p className="text-base font-medium text-black tracking-wide">
          {slide.content.title || 'タイトル'}
        </p>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 space-y-4">
        {/* 箇条書き */}
        {slide.content.bullets && slide.content.bullets.length > 0 && (
          <div className="space-y-3">
            {slide.content.bullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-3">
                {/* 手書き風の箇条書きマーク */}
                <div className="w-2 h-2 bg-gray-400 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 tracking-wide line-clamp-2">
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 本文 */}
        {slide.content.body && (
          <div className="border border-dashed border-gray-300 p-4">
            <p className="text-xs text-gray-600 tracking-wide">
              {slide.content.body}
            </p>
          </div>
        )}

        {/* レイアウトタイプのプレースホルダー */}
        {slide.layout === 'two-column' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border border-dashed border-gray-300 h-20" />
            <div className="border border-dashed border-gray-300 h-20" />
          </div>
        )}

        {slide.layout === 'steps' && (
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 border border-dashed border-gray-300 h-16 flex items-center justify-center">
                <span className="text-xs text-gray-400">Step {step}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* レイアウトラベル */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 tracking-wide">
        {getLayoutLabel(slide.layout)}
      </div>

      {/* 編集ボタン */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute bottom-4 right-4 px-3 py-1 text-xs border border-gray-400 hover:border-black hover:bg-black hover:text-white transition-all tracking-wide"
        >
          編集
        </button>
      )}
    </div>
  );
};

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
