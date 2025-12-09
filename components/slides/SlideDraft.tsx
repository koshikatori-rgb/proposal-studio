'use client';

import React from 'react';
import type { SlideElement } from '@/types';

type SlideDraftProps = {
  slide: SlideElement;
  onEdit?: () => void;
  onGenerateImage?: () => void;
  isGenerating?: boolean;
};

export const SlideDraft: React.FC<SlideDraftProps> = ({ slide, onEdit, onGenerateImage, isGenerating }) => {
  // 画像が生成されている場合は画像を表示
  if (slide.imageUrl) {
    return (
      <div className="bg-white border-2 border-gray-300 aspect-[16/9] flex flex-col relative overflow-hidden">
        {/* 生成された画像 */}
        <div className="relative w-full h-full">
          <img
            src={slide.imageUrl}
            alt={slide.title || `スライド ${slide.order + 1}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* スライド番号オーバーレイ */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-xs px-2 py-1 tracking-wide">
          #{slide.order + 1}
        </div>

        {/* ボタンエリア */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {/* 画像再生成ボタン */}
          {onGenerateImage && (
            <button
              onClick={onGenerateImage}
              disabled={isGenerating}
              className="px-3 py-1 text-xs border border-white bg-black bg-opacity-70 text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all tracking-wide"
            >
              {isGenerating ? '生成中...' : '🔄 再生成'}
            </button>
          )}

          {/* 編集ボタン */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1 text-xs border border-white bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-all tracking-wide"
            >
              編集
            </button>
          )}
        </div>
      </div>
    );
  }

  // 画像がない場合はHTMLプレビュー
  return (
    <div className="bg-white border-2 border-gray-300 p-6 aspect-[16/9] flex flex-col relative overflow-hidden">
      {/* スライド番号 */}
      <div className="absolute top-3 right-3 text-xs text-gray-400 tracking-wide">
        #{slide.order + 1}
      </div>

      {/* ヘッダーバー */}
      <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400 absolute top-0 left-0 right-0" />

      {/* タイトルエリア */}
      <div className="mb-4 pb-3 border-l-4 border-purple-600 pl-3">
        <h3 className="text-lg font-bold text-gray-900 tracking-wide leading-tight">
          {slide.title || slide.content.title || 'タイトル'}
        </h3>
        {slide.mainMessage && (
          <p className="text-xs text-gray-600 italic mt-1 tracking-wide">
            {slide.mainMessage}
          </p>
        )}
      </div>

      {/* コンテンツエリア - ビジュアルヒントに基づいて表示 */}
      <div className="flex-1 overflow-auto">
        {renderVisualContent(slide)}
      </div>

      {/* フッターエリア */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-400 tracking-wide">
          {getLayoutLabel(slide.layout)}
        </div>

        <div className="flex gap-2">
          {/* 画像生成ボタン */}
          {onGenerateImage && (
            <button
              onClick={onGenerateImage}
              disabled={isGenerating}
              className="px-3 py-1 text-xs border border-purple-400 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all tracking-wide rounded"
            >
              {isGenerating ? '生成中...' : '🎨 画像生成'}
            </button>
          )}

          {/* 編集ボタン */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1 text-xs border border-gray-400 hover:border-black hover:bg-black hover:text-white transition-all tracking-wide rounded"
            >
              編集
            </button>
          )}
        </div>
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

// ビジュアルヒントに基づいてコンテンツをレンダリング
function renderVisualContent(slide: SlideElement): JSX.Element {
  const visualHint = slide.visualHint || 'bullets-only';

  switch (visualHint) {
    case 'process-flow':
      return renderProcessFlow(slide);
    case 'comparison':
      return renderComparison(slide);
    case 'hierarchy':
      return renderHierarchy(slide);
    case 'timeline':
      return renderTimeline(slide);
    case 'bar-chart':
      return renderBarChart(slide);
    case 'pie-chart':
      return renderPieChart(slide);
    case 'matrix':
      return renderMatrix(slide);
    case 'pyramid':
      return renderPyramid(slide);
    case 'bullets-with-visual':
      return renderBulletsWithVisual(slide);
    case 'bullets-only':
    default:
      return renderBulletsOnly(slide);
  }
}

// プロセスフロー図
function renderProcessFlow(slide: SlideElement): JSX.Element {
  const steps = slide.content.bullets?.slice(0, 4) || ['ステップ1', 'ステップ2', 'ステップ3'];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 flex items-center">
            <div className="flex-1 bg-purple-100 border-2 border-purple-400 rounded p-2 text-center">
              <div className="text-xs font-bold text-purple-800 mb-1">STEP {index + 1}</div>
              <div className="text-xs text-gray-700 truncate">{step.substring(0, 20)}</div>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-1 text-purple-600 text-lg">→</div>
            )}
          </div>
        ))}
      </div>
      {slide.content.body && (
        <div className="text-xs text-gray-600 px-2">{slide.content.body.substring(0, 100)}...</div>
      )}
    </div>
  );
}

// 比較表
function renderComparison(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets || [];
  const half = Math.ceil(bullets.length / 2);
  const left = bullets.slice(0, half);
  const right = bullets.slice(half);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="border-2 border-purple-300 rounded p-3 bg-red-50">
        <div className="text-xs font-bold text-red-800 mb-2 text-center">Before / AsIs</div>
        <div className="space-y-1">
          {left.map((item, idx) => (
            <div key={idx} className="text-xs text-gray-700 flex items-start gap-1">
              <span className="text-red-600">✗</span>
              <span className="flex-1 truncate">{item.substring(0, 30)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-2 border-purple-300 rounded p-3 bg-green-50">
        <div className="text-xs font-bold text-green-800 mb-2 text-center">After / ToBe</div>
        <div className="space-y-1">
          {right.map((item, idx) => (
            <div key={idx} className="text-xs text-gray-700 flex items-start gap-1">
              <span className="text-green-600">✓</span>
              <span className="flex-1 truncate">{item.substring(0, 30)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 階層構造
function renderHierarchy(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets?.slice(0, 6) || [];
  return (
    <div className="space-y-2">
      {bullets.map((bullet, index) => (
        <div
          key={index}
          className="flex items-start gap-2"
          style={{ marginLeft: `${(index % 3) * 12}px` }}
        >
          <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0" />
          <div className="flex-1 bg-gray-50 border-l-2 border-purple-400 px-2 py-1">
            <p className="text-xs text-gray-800 truncate">{bullet}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// タイムライン
function renderTimeline(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets?.slice(0, 5) || [];
  return (
    <div className="relative pl-6">
      {/* 縦線 */}
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-purple-400"></div>
      <div className="space-y-3">
        {bullets.map((bullet, index) => (
          <div key={index} className="relative">
            {/* ドット */}
            <div className="absolute -left-5 top-1 w-3 h-3 bg-purple-600 rounded-full border-2 border-white"></div>
            <div className="bg-gray-50 border border-gray-200 rounded p-2">
              <div className="text-xs font-bold text-purple-800 mb-1">Week {index + 1}</div>
              <div className="text-xs text-gray-700 truncate">{bullet.substring(0, 40)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 棒グラフ
function renderBarChart(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets?.slice(0, 5) || [];
  const maxHeight = 80;

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-around h-24 border-b-2 border-gray-300 px-2">
        {bullets.map((_, index) => {
          const height = maxHeight - (index * 15);
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div
                className="w-8 bg-purple-500 rounded-t"
                style={{ height: `${height}px` }}
              ></div>
              <div className="text-xs text-gray-600">項目{index + 1}</div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-600 px-2">
        {bullets.map((b, i) => `${i + 1}. ${b.substring(0, 20)}...`).join(' / ')}
      </div>
    </div>
  );
}

// 円グラフ
function renderPieChart(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets?.slice(0, 4) || [];
  const colors = ['bg-purple-500', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400'];

  return (
    <div className="flex gap-4">
      {/* 円グラフ（簡易版） */}
      <div className="w-24 h-24 rounded-full border-4 border-purple-500 flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200">
        <div className="text-xs font-bold text-purple-900">割合</div>
      </div>
      {/* 凡例 */}
      <div className="flex-1 space-y-1">
        {bullets.map((bullet, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 ${colors[index % colors.length]} rounded`}></div>
            <div className="text-xs text-gray-700 truncate flex-1">{bullet.substring(0, 25)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// マトリクス
function renderMatrix(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets || [];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((index) => {
          const item = bullets[index];
          const colors = [
            'bg-red-100 border-red-400',
            'bg-yellow-100 border-yellow-400',
            'bg-blue-100 border-blue-400',
            'bg-green-100 border-green-400'
          ];
          const labels = ['高/低', '高/高', '低/低', '低/高'];

          return (
            <div key={index} className={`border-2 ${colors[index]} rounded p-2 h-16`}>
              <div className="text-xs font-bold text-gray-800 mb-1">{labels[index]}</div>
              <div className="text-xs text-gray-600 truncate">{item?.substring(0, 20) || '...'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ピラミッド
function renderPyramid(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets?.slice(0, 4) || [];

  return (
    <div className="space-y-1 flex flex-col items-center">
      {bullets.map((bullet, index) => {
        const width = 100 - (index * 20);
        return (
          <div
            key={index}
            className="bg-purple-400 border border-purple-600 flex items-center justify-center py-1 px-2"
            style={{ width: `${width}%` }}
          >
            <div className="text-xs text-white font-medium truncate">{bullet.substring(0, 15)}</div>
          </div>
        );
      })}
    </div>
  );
}

// 箇条書き+ビジュアル
function renderBulletsWithVisual(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets?.slice(0, 4) || [];

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        {bullets.map((bullet, index) => (
          <div key={index} className="flex items-start gap-2 px-2 py-1 bg-gray-50 border-l-2 border-purple-400">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-gray-800 leading-snug">{bullet.substring(0, 40)}...</p>
          </div>
        ))}
      </div>
      <div className="border-2 border-dashed border-purple-300 rounded flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <div className="text-3xl mb-1">📊</div>
          <div className="text-xs text-gray-500">補助図表</div>
        </div>
      </div>
    </div>
  );
}

// 箇条書きのみ
function renderBulletsOnly(slide: SlideElement): JSX.Element {
  const bullets = slide.content.bullets || [];
  const body = slide.content.body;

  return (
    <>
      {bullets.length > 0 && (
        <div className="space-y-2">
          {bullets.slice(0, 5).map((bullet, index) => (
            <div key={index} className="flex items-start gap-2 px-3 py-2 bg-gray-50 border-l-2 border-purple-400">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 flex-shrink-0" />
              <p className="text-sm text-gray-800 tracking-wide leading-snug flex-1">
                {bullet.length > 80 ? bullet.substring(0, 80) + '...' : bullet}
              </p>
            </div>
          ))}
          {bullets.length > 5 && (
            <p className="text-xs text-gray-400 italic px-3">
              ... 他 {bullets.length - 5} 項目
            </p>
          )}
        </div>
      )}

      {body && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded mt-3">
          <p className="text-xs text-gray-700 tracking-wide leading-relaxed">
            {body.length > 200 ? body.substring(0, 200) + '...' : body}
          </p>
        </div>
      )}

      {!bullets.length && !body && (
        <div className="text-center text-gray-400 text-xs py-8">
          コンテンツがありません
        </div>
      )}
    </>
  );
}
