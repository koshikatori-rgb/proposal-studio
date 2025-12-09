'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { SlideDraft } from '@/components/slides/SlideDraft';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { saveProposal } from '@/lib/storage';

export default function SlidePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;
  const slideId = params.slideId as string;
  const { proposal, loading } = useProposal(proposalId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<any>(null);

  // スライドを取得
  const slide = proposal?.slides.find((s) => s.id === slideId);

  // slideIdが変わったらcurrentSlideを更新（すべてのフックは早期returnの前に配置）
  useEffect(() => {
    if (slide) {
      setCurrentSlide(slide);
    }
  }, [slideId, slide]);

  // 早期return
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black mx-auto mb-6"></div>
          <p className="text-xs text-gray-400 tracking-wide">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="text-center">
          <h1 className="text-lg font-medium text-black mb-4 tracking-wide">
            提案書が見つかりません
          </h1>
        </Card>
      </div>
    );
  }

  const displaySlide = currentSlide || slide;

  if (!displaySlide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="text-center">
          <h1 className="text-lg font-medium text-black mb-4 tracking-wide">
            スライドが見つかりません
          </h1>
          <Button
            onClick={() => router.push(`/proposal/${proposalId}/draft`)}
            variant="outline"
          >
            ドラフト一覧に戻る
          </Button>
        </Card>
      </div>
    );
  }

  const sortedSlides = [...proposal.slides].sort((a, b) => a.order - b.order);
  const currentIndex = sortedSlides.findIndex((s) => s.id === slideId);
  const prevSlide = currentIndex > 0 ? sortedSlides[currentIndex - 1] : null;
  const nextSlide = currentIndex < sortedSlides.length - 1 ? sortedSlides[currentIndex + 1] : null;

  // 画像生成ハンドラー
  const handleGenerateImage = async () => {
    if (!displaySlide) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-slide-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: displaySlide }),
      });

      if (!response.ok) {
        throw new Error('画像生成に失敗しました');
      }

      const { imageUrl } = await response.json();

      // スライドを更新
      const updatedSlide = { ...displaySlide, imageUrl };
      setCurrentSlide(updatedSlide);

      // 提案書全体を更新して保存
      const updatedSlides = proposal.slides.map(s =>
        s.id === slideId ? updatedSlide : s
      );
      const updatedProposal = {
        ...proposal,
        slides: updatedSlides,
        updatedAt: Date.now(),
      };
      saveProposal(updatedProposal);
    } catch (error) {
      console.error('Image generation error:', error);
      alert('画像の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-medium text-black tracking-wide mb-3">
                スライドプレビュー
              </h1>
              <p className="text-sm text-gray-500 tracking-wide">
                {proposal.title} - スライド {currentIndex + 1} / {sortedSlides.length}
              </p>
            </div>
            <Button
              onClick={() => router.push(`/proposal/${proposalId}/draft`)}
              variant="outline"
            >
              ← 一覧に戻る
            </Button>
          </div>
        </div>

        {/* スライドプレビュー - 大きく表示 */}
        <div className="mb-12">
          <div className="max-w-4xl mx-auto">
            <SlideDraft
              slide={displaySlide}
              onGenerateImage={handleGenerateImage}
              isGenerating={isGenerating}
            />
          </div>
        </div>

        {/* スライド情報 */}
        <Card className="mb-12">
          <h2 className="text-base font-medium text-black mb-4 tracking-wide">
            スライド情報
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex">
              <span className="text-xs text-gray-500 w-32 tracking-wide">レイアウト</span>
              <span className="tracking-wide">{getLayoutLabel(displaySlide.layout)}</span>
            </div>
            {displaySlide.visualHint && (
              <div className="flex">
                <span className="text-xs text-gray-500 w-32 tracking-wide">ビジュアルヒント</span>
                <span className="tracking-wide">{displaySlide.visualHint}</span>
              </div>
            )}
            {displaySlide.visualIntent && (
              <div className="flex">
                <span className="text-xs text-gray-500 w-32 tracking-wide">ビジュアル意図</span>
                <span className="tracking-wide">{displaySlide.visualIntent}</span>
              </div>
            )}
            {displaySlide.type && (
              <div className="flex">
                <span className="text-xs text-gray-500 w-32 tracking-wide">タイプ</span>
                <span className="tracking-wide">{getTypeLabel(displaySlide.type)}</span>
              </div>
            )}
            {displaySlide.mainMessage && (
              <div className="flex">
                <span className="text-xs text-gray-500 w-32 tracking-wide">メインメッセージ</span>
                <span className="tracking-wide">{displaySlide.mainMessage}</span>
              </div>
            )}
          </div>
        </Card>

        {/* ナビゲーション */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => {
              if (prevSlide) {
                router.push(`/proposal/${proposalId}/draft/${prevSlide.id}`);
              }
            }}
            variant="outline"
            disabled={!prevSlide}
          >
            ← 前のスライド
          </Button>

          <div className="text-xs text-gray-400 tracking-wide">
            {currentIndex + 1} / {sortedSlides.length}
          </div>

          <Button
            onClick={() => {
              if (nextSlide) {
                router.push(`/proposal/${proposalId}/draft/${nextSlide.id}`);
              } else {
                router.push(`/proposal/${proposalId}/export`);
              }
            }}
            variant={nextSlide ? "outline" : "primary"}
          >
            {nextSlide ? '次のスライド →' : 'エクスポートへ →'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getLayoutLabel(layout: string): string {
  const labels: Record<string, string> = {
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

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    executive_summary: 'エグゼクティブサマリー',
    current_recognition: '現状認識',
    issue_setting: '課題設定',
    issue_tree: '課題ツリー',
    tobe_vision: 'ToBe像',
    project_goal: 'プロジェクトゴール',
    approach_overview: 'アプローチ概要',
    approach_detail: 'アプローチ詳細',
    why_this_approach: 'アプローチの理由',
    schedule: 'スケジュール',
    team: 'チーム体制',
    meeting_structure: '会議体',
    estimate: '見積もり',
    estimate_assumptions: '見積もり前提',
    project_members: 'プロジェクトメンバー',
    appendix: '付録',
  };
  return labels[type] || type;
}
