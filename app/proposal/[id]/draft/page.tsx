'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { SlideDraft } from '@/components/slides/SlideDraft';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { saveProposal } from '@/lib/storage';
import type { SlideElement } from '@/types';

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);
  const [slides, setSlides] = useState<SlideElement[]>([]);

  // proposalが読み込まれたらslidesを初期化
  if (proposal && slides.length === 0 && proposal.slides.length > 0) {
    setSlides([...proposal.slides].sort((a, b) => a.order - b.order));
  }

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
          <p className="text-sm text-gray-500 tracking-wide">
            指定された提案書は存在しないか、削除されました。
          </p>
        </Card>
      </div>
    );
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSlides = [...slides];
    [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
    // 順序を更新
    newSlides.forEach((slide, i) => {
      slide.order = i;
    });
    setSlides(newSlides);
  };

  const handleMoveDown = (index: number) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
    // 順序を更新
    newSlides.forEach((slide, i) => {
      slide.order = i;
    });
    setSlides(newSlides);
  };

  const handleDelete = (index: number) => {
    if (confirm('このスライドを削除してもよろしいですか？')) {
      const newSlides = slides.filter((_, i) => i !== index);
      // 順序を更新
      newSlides.forEach((slide, i) => {
        slide.order = i;
      });
      setSlides(newSlides);
    }
  };

  const handleSaveAndContinue = () => {
    // 変更を保存
    const updatedProposal = {
      ...proposal,
      slides: slides,
      updatedAt: Date.now(),
    };
    saveProposal(updatedProposal);

    // エクスポートページへ遷移
    router.push(`/proposal/${id}/export`);
  };

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
        <div className="mb-12">
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-medium text-xs">
                ✓
              </div>
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">骨子作成</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-medium text-xs">
                ✓
              </div>
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">スライド選択</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-medium text-xs">
                3
              </div>
              <span className="ml-3 text-xs font-medium text-black tracking-wide">ドラフト確認</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 border border-gray-300 text-gray-400 flex items-center justify-center font-medium text-xs">
                4
              </div>
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">エクスポート</span>
            </div>
          </div>
        </div>

        {/* 説明カード */}
        <Card className="mb-12">
          <h2 className="text-base font-medium text-black mb-4 tracking-wide">
            ドラフト確認
          </h2>
          <p className="text-sm text-gray-500 tracking-wide mb-3">
            スライドのラフ画（ドラフト）を確認できます。順序の変更や削除も可能です。
          </p>
          <p className="text-xs text-gray-400 tracking-wide">
            全 {slides.length} 枚のスライド
          </p>
        </Card>

        {/* ドラフト一覧 - グリッド表示 */}
        {slides.length > 0 ? (
          <div className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {slides.map((slide, index) => (
                <div key={slide.id} className="relative group">
                  {/* スライドドラフト - サムネイルサイズ */}
                  <div className="mb-3 relative">
                    <SlideDraft slide={slide} />

                    {/* ホバー時のコントロールオーバーレイ */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-2 bg-white text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium"
                          title="上へ"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === slides.length - 1}
                          className="p-2 bg-white text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium"
                          title="下へ"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="p-2 bg-red-600 text-white hover:bg-red-700 text-xs font-medium"
                          title="削除"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* スライド番号 */}
                  <p className="text-xs text-gray-400 tracking-wide text-center">
                    {index + 1} / {slides.length}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="mb-16 text-center py-24">
            <div className="text-gray-300 text-6xl mb-6">📄</div>
            <h3 className="text-base font-medium text-black mb-3 tracking-wide">
              スライドがありません
            </h3>
            <p className="text-sm text-gray-500 mb-8 tracking-wide">
              スライド選択画面でスライドを追加してください
            </p>
            <Button
              onClick={() => router.push(`/proposal/${id}/slides`)}
              variant="outline"
            >
              スライド選択に戻る
            </Button>
          </Card>
        )}

        {/* アクションボタン */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => router.push(`/proposal/${id}/slides`)}
            variant="outline"
          >
            ← スライド選択に戻る
          </Button>

          <Button
            onClick={handleSaveAndContinue}
            disabled={slides.length === 0}
          >
            次へ: エクスポート
          </Button>
        </div>
      </div>
    </div>
  );
}
