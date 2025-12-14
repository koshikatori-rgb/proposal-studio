'use client';

import { useMemo, useState } from 'react';
import type { SlideData } from '@/types';
import type { Storyline, StoryPart, SlideTransition } from '@/types/insight';

type StorylineVisualizerProps = {
  storyline: Storyline;
  slides?: SlideData[];
  onSlideClick?: (slideId: string) => void;
  selectedSlideId?: string;
};

// パートの役割ごとの色
const PART_ROLE_COLORS: Record<StoryPart['role'], { bg: string; border: string; text: string }> = {
  hook: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  context: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  tension: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  resolution: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  call_to_action: { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700' },
};

// パートの役割ラベル
const PART_ROLE_LABELS: Record<StoryPart['role'], string> = {
  hook: 'フック',
  context: '文脈',
  tension: '緊張',
  resolution: '解決',
  call_to_action: '行動喚起',
};

// 接続タイプのスタイル
const TRANSITION_STYLES: Record<SlideTransition['transitionType'], { color: string; label: string }> = {
  therefore: { color: 'text-green-600', label: 'したがって' },
  however: { color: 'text-orange-600', label: 'しかし' },
  furthermore: { color: 'text-blue-600', label: 'さらに' },
  specifically: { color: 'text-purple-600', label: '具体的には' },
  as_a_result: { color: 'text-teal-600', label: 'その結果' },
};

export function StorylineVisualizer({
  storyline,
  slides = [],
  onSlideClick,
  selectedSlideId,
}: StorylineVisualizerProps) {
  const [hoveredSlideId, setHoveredSlideId] = useState<string | null>(null);
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);

  // スライドIDからスライド情報を取得するマップ
  const slideMap = useMemo(() => {
    const map = new Map<string, { slide: SlideData; index: number }>();
    slides.forEach((slide, index) => {
      map.set(slide.id, { slide, index });
    });
    return map;
  }, [slides]);

  // スライドIDからそのパートを取得
  const slideToPartMap = useMemo(() => {
    const map = new Map<string, StoryPart>();
    storyline.parts.forEach((part) => {
      part.slideIds.forEach((slideId) => {
        map.set(slideId, part);
      });
    });
    return map;
  }, [storyline.parts]);

  // 接続情報をスライドIDでインデックス化
  const transitionMap = useMemo(() => {
    const map = new Map<string, SlideTransition>();
    storyline.transitions.forEach((transition) => {
      map.set(transition.fromSlideId, transition);
    });
    return map;
  }, [storyline.transitions]);

  // 表示用のスライドリスト（順序付き）
  const orderedSlides = useMemo(() => {
    return slides.map((slide, index) => ({
      ...slide,
      index,
      part: slideToPartMap.get(slide.id),
      transition: transitionMap.get(slide.id),
    }));
  }, [slides, slideToPartMap, transitionMap]);

  return (
    <div className="space-y-4">
      {/* ナラティブ構造の概要 */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <span className="text-lg">📊</span>
        <div>
          <p className="text-sm font-medium text-gray-800">
            {storyline.overarchingMessage}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            全体メッセージ
          </p>
        </div>
      </div>

      {/* パートごとのグループ表示 */}
      <div className="space-y-3">
        {storyline.parts.map((part, partIndex) => {
          const partColors = PART_ROLE_COLORS[part.role] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' };
          const isExpanded = expandedPartId === part.id;
          const partSlides = part.slideIds
            .map((id) => slideMap.get(id))
            .filter((s): s is { slide: SlideData; index: number } => s !== undefined);

          return (
            <div key={part.id} className="relative">
              {/* パートヘッダー */}
              <div
                className={`border-2 rounded-lg overflow-hidden ${partColors.border} ${partColors.bg}`}
              >
                <div
                  className="px-3 py-2 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${partColors.text} bg-white/50`}
                    >
                      {PART_ROLE_LABELS[part.role]}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {part.keyMessage}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">
                      {partSlides.length}スライド
                    </span>
                    <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* パートの詳細（展開時） */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-current border-opacity-20 mt-2 pt-2">
                    <p className="text-xs text-gray-600 mb-2">{part.purpose}</p>

                    {/* パート内のスライド */}
                    <div className="space-y-2">
                      {partSlides.map(({ slide, index }, slideIdx) => {
                        const isSelected = slide.id === selectedSlideId;
                        const isHovered = slide.id === hoveredSlideId;
                        const transition = transitionMap.get(slide.id);

                        return (
                          <div key={slide.id}>
                            {/* スライドカード */}
                            <div
                              className={`p-2 rounded border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                  : isHovered
                                  ? 'border-gray-400 bg-white'
                                  : 'border-gray-200 bg-white'
                              }`}
                              onClick={() => onSlideClick?.(slide.id)}
                              onMouseEnter={() => setHoveredSlideId(slide.id)}
                              onMouseLeave={() => setHoveredSlideId(null)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 w-6">
                                  #{index + 1}
                                </span>
                                <span className="text-sm text-gray-800 flex-1">
                                  {slide.title || `スライド ${index + 1}`}
                                </span>
                              </div>
                              {slide.mainMessage && (
                                <p className="text-[10px] text-gray-500 ml-8 mt-1 line-clamp-1">
                                  {slide.mainMessage}
                                </p>
                              )}
                            </div>

                            {/* スライド間の接続表示 */}
                            {transition && slideIdx < partSlides.length - 1 && (
                              <div className="flex items-center gap-2 py-1 pl-6">
                                <div className="w-px h-4 bg-gray-300" />
                                <span
                                  className={`text-[10px] font-medium ${
                                    TRANSITION_STYLES[transition.transitionType]?.color || 'text-gray-500'
                                  }`}
                                >
                                  {TRANSITION_STYLES[transition.transitionType]?.label || transition.transitionType}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* パート間の接続（次のパートへの遷移） */}
              {part.transitionTo && partIndex < storyline.parts.length - 1 && (
                <div className="flex items-center gap-2 py-2 pl-4">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
                    <span className="text-[10px] text-gray-500 italic px-2 bg-white">
                      {part.transitionTo}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-l from-gray-300 to-transparent" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* フロー図（コンパクト表示） */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
          <span>🔄</span> ストーリーフロー
        </h5>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {orderedSlides.map((slide, idx) => {
            const part = slide.part;
            const partColors = part ? (PART_ROLE_COLORS[part.role] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' }) : null;
            const isSelected = slide.id === selectedSlideId;
            const transition = slide.transition;

            return (
              <div key={slide.id} className="flex items-center shrink-0">
                {/* スライドノード */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                    ${partColors ? `${partColors.bg} ${partColors.border} border-2 ${partColors.text}` : 'bg-gray-100 border border-gray-300 text-gray-600'}
                  `.trim()}
                  onClick={() => onSlideClick?.(slide.id)}
                  title={slide.title || `スライド ${idx + 1}`}
                >
                  {idx + 1}
                </div>

                {/* 接続矢印 */}
                {idx < orderedSlides.length - 1 && (
                  <div className="flex items-center px-1">
                    <div
                      className={`text-[8px] ${
                        transition
                          ? TRANSITION_STYLES[transition.transitionType]?.color || 'text-gray-400'
                          : 'text-gray-300'
                      }`}
                    >
                      →
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-200">
          {Object.entries(PART_ROLE_LABELS).map(([role, label]) => {
            const colors = PART_ROLE_COLORS[role as StoryPart['role']] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' };
            return (
              <div key={role} className="flex items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`}
                />
                <span className="text-[10px] text-gray-600">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 接続語の凡例 */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
          <span>🔗</span> 接続語の種類
        </h5>
        <div className="flex flex-wrap gap-3">
          {Object.entries(TRANSITION_STYLES).map(([type, { color, label }]) => (
            <div key={type} className="flex items-center gap-1">
              <span className={`text-xs font-medium ${color}`}>{label}</span>
              <span className="text-[10px] text-gray-400">
                ({type === 'therefore' ? '結論導出' :
                  type === 'however' ? '逆接' :
                  type === 'furthermore' ? '追加' :
                  type === 'specifically' ? '具体化' : '結果'})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
