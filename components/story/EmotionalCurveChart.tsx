'use client';

import { useMemo } from 'react';
import type { SlideData } from '@/types';
import type { Storyline } from '@/types/insight';

type EmotionalCurveChartProps = {
  storyline: Storyline;
  slides?: SlideData[];
  onSlideClick?: (slideId: string) => void;
};

// 感情の数値マッピング（Y軸の位置）
const EMOTION_VALUES: Record<string, number> = {
  // ネガティブ〜ニュートラル
  concern: 30,
  neutral: 50,
  curiosity: 55,
  // テンション
  tension: 70,
  urgency: 75,
  // ポジティブ
  hope: 80,
  confidence: 85,
  action: 90,
  commitment: 95,
};

// 感情の色マッピング
const EMOTION_COLORS: Record<string, string> = {
  concern: '#EF4444',      // red-500
  neutral: '#6B7280',      // gray-500
  curiosity: '#3B82F6',    // blue-500
  tension: '#F97316',      // orange-500
  urgency: '#DC2626',      // red-600
  hope: '#10B981',         // emerald-500
  confidence: '#22C55E',   // green-500
  action: '#14B8A6',       // teal-500
  commitment: '#8B5CF6',   // violet-500
};

// 感情のラベル
const EMOTION_LABELS: Record<string, string> = {
  concern: '懸念',
  neutral: '中立',
  curiosity: '好奇心',
  tension: '緊張',
  urgency: '緊急性',
  hope: '希望',
  confidence: '確信',
  action: '行動',
  commitment: 'コミット',
};

export function EmotionalCurveChart({
  storyline,
  slides = [],
  onSlideClick,
}: EmotionalCurveChartProps) {
  // スライドごとの感情データを計算
  const emotionalData = useMemo(() => {
    // APIから返されたslideEmotionsを優先して使用
    if (storyline.slideEmotions && storyline.slideEmotions.length > 0) {
      return storyline.slideEmotions.map((se) => {
        const slideIndex = slides.findIndex((s) => s.id === se.slideId);
        return {
          slideId: se.slideId,
          emotion: se.emotion,
          intensity: se.intensity,
          reason: se.reason,
          index: slideIndex !== -1 ? slideIndex : 0,
          title: slideIndex !== -1 ? slides[slideIndex]?.title || `スライド ${slideIndex + 1}` : se.slideId,
        };
      }).sort((a, b) => a.index - b.index);
    }

    // フォールバック: partsから各スライドの感情を抽出
    const slideEmotions: { slideId: string; emotion: string; index: number; intensity?: number }[] = [];

    storyline.parts.forEach((part) => {
      part.slideIds.forEach((slideId) => {
        const slideIndex = slides.findIndex((s) => s.id === slideId);
        if (slideIndex !== -1) {
          slideEmotions.push({
            slideId,
            emotion: part.emotionalTarget,
            index: slideIndex,
          });
        }
      });
    });

    // インデックス順にソート
    slideEmotions.sort((a, b) => a.index - b.index);

    // データがない場合はemotionalArcから補間
    if (slideEmotions.length === 0 && slides.length > 0) {
      const { start, climax, end } = storyline.emotionalArc;
      const midPoint = Math.floor(slides.length / 2);

      return slides.map((slide, idx) => {
        let emotion: string;
        let intensity: number;
        if (idx < midPoint * 0.6) {
          emotion = start;
          intensity = 40 + (idx / (midPoint * 0.6)) * 30;
        } else if (idx < midPoint * 1.4) {
          emotion = climax;
          intensity = 70 + ((idx - midPoint * 0.6) / (midPoint * 0.8)) * 20;
        } else {
          emotion = end;
          intensity = 85 - ((idx - midPoint * 1.4) / (slides.length - midPoint * 1.4)) * 5;
        }
        return {
          slideId: slide.id,
          emotion,
          intensity: Math.round(intensity),
          index: idx,
          title: slide.title || `スライド ${idx + 1}`,
        };
      });
    }

    return slideEmotions.map((se) => ({
      ...se,
      intensity: EMOTION_VALUES[se.emotion] || 50,
      title: slides[se.index]?.title || `スライド ${se.index + 1}`,
    }));
  }, [storyline, slides]);

  // SVGパスを生成
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 30, right: 40, bottom: 50, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (emotionalData.length === 0) return [];

    return emotionalData.map((data, idx) => {
      const x = padding.left + (idx / Math.max(emotionalData.length - 1, 1)) * innerWidth;
      const value = EMOTION_VALUES[data.emotion] || 50;
      const y = padding.top + innerHeight - (value / 100) * innerHeight;
      return { x, y, ...data };
    });
  }, [emotionalData, innerWidth, innerHeight]);

  // 曲線パスを生成（ベジェ曲線で滑らかに）
  const curvePath = useMemo(() => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;

      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  }, [points]);

  // グラデーションのIDを生成
  const gradientId = 'emotionalGradient';

  // 塗りつぶしパスを生成
  const fillPath = useMemo(() => {
    if (points.length < 2) return '';

    return `${curvePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;
  }, [curvePath, points, innerHeight]);

  if (emotionalData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">スライドデータがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={chartHeight}
        className="mx-auto"
        style={{ minWidth: chartWidth }}
      >
        {/* グラデーション定義 */}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#F97316" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Y軸ラベル（感情レベル） */}
        <g className="text-[10px] fill-gray-400">
          <text x={padding.left - 10} y={padding.top + 5} textAnchor="end">
            高揚
          </text>
          <text x={padding.left - 10} y={padding.top + innerHeight / 2} textAnchor="end">
            中立
          </text>
          <text x={padding.left - 10} y={padding.top + innerHeight - 5} textAnchor="end">
            懸念
          </text>
        </g>

        {/* 水平グリッドライン */}
        <g className="stroke-gray-200">
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left + innerWidth}
            y2={padding.top}
            strokeDasharray="4,4"
          />
          <line
            x1={padding.left}
            y1={padding.top + innerHeight / 2}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight / 2}
            strokeDasharray="4,4"
          />
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight}
          />
        </g>

        {/* 感情ゾーン表示 */}
        <g className="text-[8px] fill-gray-300">
          <text x={padding.left + innerWidth + 5} y={padding.top + 20}>
            行動
          </text>
          <text x={padding.left + innerWidth + 5} y={padding.top + 45}>
            確信
          </text>
          <text x={padding.left + innerWidth + 5} y={padding.top + 70}>
            希望
          </text>
          <text x={padding.left + innerWidth + 5} y={padding.top + innerHeight / 2}>
            中立
          </text>
          <text x={padding.left + innerWidth + 5} y={padding.top + innerHeight - 20}>
            懸念
          </text>
        </g>

        {/* 塗りつぶし領域 */}
        <path d={fillPath} fill={`url(#${gradientId})`} />

        {/* 曲線 */}
        <path
          d={curvePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* データポイント */}
        {points.map((point, idx) => (
          <g
            key={point.slideId}
            className="cursor-pointer"
            onClick={() => onSlideClick?.(point.slideId)}
          >
            {/* ポイントの背景（クリック領域拡大） */}
            <circle
              cx={point.x}
              cy={point.y}
              r="15"
              fill="transparent"
            />
            {/* ポイント本体 */}
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill={EMOTION_COLORS[point.emotion] || '#6B7280'}
              stroke="white"
              strokeWidth="2"
              className="transition-all hover:r-10"
            />
            {/* スライド番号 */}
            <text
              x={point.x}
              y={point.y + 4}
              textAnchor="middle"
              className="text-[9px] font-bold fill-white pointer-events-none"
            >
              {idx + 1}
            </text>
          </g>
        ))}

        {/* X軸ラベル（スライドタイトル） */}
        <g className="text-[9px] fill-gray-500">
          {points.map((point, idx) => (
            <g key={`label-${point.slideId}`}>
              <text
                x={point.x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="cursor-pointer hover:fill-blue-600"
                onClick={() => onSlideClick?.(point.slideId)}
              >
                {idx + 1}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* 凡例 */}
      <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
        {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
          <div key={emotion} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-gray-600">
              {EMOTION_LABELS[emotion]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
