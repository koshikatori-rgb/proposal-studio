'use client';

import type { SlideElement } from '@/types';

type SlidePreviewProps = {
  slide: SlideElement;
  onClick?: () => void;
  selected?: boolean;
};

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  slide,
  onClick,
  selected = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white p-8 cursor-pointer transition-all duration-200 aspect-[16/9] flex flex-col
        ${selected ? 'bg-gray-50' : 'hover:bg-gray-50'}
      `}
    >
      {/* スライド番号 */}
      <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 tracking-wide">
        {slide.order + 1}
      </div>

      {/* タイトル */}
      <h3 className="text-sm font-medium text-black mb-4 line-clamp-2 tracking-wide">
        {slide.content.title}
      </h3>

      {/* コンテンツ */}
      <div className="space-y-2 flex-1 overflow-hidden">
        {slide.content.bullets && slide.content.bullets.length > 0 && (
          <ul className="space-y-1">
            {slide.content.bullets.slice(0, 4).map((bullet, index) => (
              <li
                key={index}
                className="text-xs text-gray-500 line-clamp-1 flex items-start tracking-wide"
              >
                <span className="mr-2">•</span>
                <span>{bullet}</span>
              </li>
            ))}
            {slide.content.bullets.length > 4 && (
              <li className="text-xs text-gray-400 tracking-wide">
                +{slide.content.bullets.length - 4} more
              </li>
            )}
          </ul>
        )}

        {slide.content.body && (
          <p className="text-xs text-gray-500 line-clamp-3 tracking-wide">
            {slide.content.body}
          </p>
        )}
      </div>

      {/* レイアウトタイプ */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 tracking-wide">
        {getLayoutLabel(slide.layout)}
      </div>
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
