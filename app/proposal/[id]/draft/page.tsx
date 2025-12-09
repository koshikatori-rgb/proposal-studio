'use client';

import { useState, useEffect } from 'react';
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
  const [generatingSlideId, setGeneratingSlideId] = useState<string | null>(null);

  // proposalが読み込まれたらslidesを初期化
  useEffect(() => {
    if (proposal && proposal.slides.length > 0) {
      setSlides([...proposal.slides].sort((a, b) => a.order - b.order));
    }
  }, [proposal]);

  // visualIntentがあるスライドに対して自動的にワイヤーフレーム画像を生成
  useEffect(() => {
    if (!proposal || slides.length === 0) return;

    const generateWireframesForSlides = async () => {
      // visualIntentはあるが画像がまだないスライドを見つける
      const slidesNeedingImages = slides.filter(
        slide => slide.visualIntent && !slide.imageUrl
      );

      if (slidesNeedingImages.length === 0) {
        console.log(`✅ 全てのスライドに既にワイヤーフレーム画像が生成されています`);
        return;
      }

      console.log(`🎨 ${slidesNeedingImages.length} 枚のスライドにワイヤーフレーム画像を生成中...`);

      // 並列で画像生成（ただし負荷を考慮して3枚ずつ）
      const batchSize = 3;
      for (let i = 0; i < slidesNeedingImages.length; i += batchSize) {
        const batch = slidesNeedingImages.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async slide => {
            try {
              setGeneratingSlideId(slide.id);

              const response = await fetch('/api/generate-slide-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slide }),
              });

              if (!response.ok) {
                console.error(`❌ Failed to generate image for slide: ${slide.title}`);
                return;
              }

              const { imageUrl } = await response.json();

              // スライドに画像URLを追加
              setSlides(prevSlides =>
                prevSlides.map(s =>
                  s.id === slide.id ? { ...s, imageUrl } : s
                )
              );

              console.log(`✅ ワイヤーフレーム画像生成完了: ${slide.title}`);
            } catch (error) {
              console.error(`❌ Image generation error for ${slide.title}:`, error);
            }
          })
        );

        setGeneratingSlideId(null);
      }

      console.log('🎨 全てのワイヤーフレーム画像生成完了');

      // 画像生成後に提案書を保存
      const updatedProposal = {
        ...proposal,
        slides: slides,
        updatedAt: Date.now(),
      };
      saveProposal(updatedProposal);
    };

    generateWireframesForSlides();
  }, [proposal, slides.length]); // slides全体を依存配列に入れると無限ループになるのでlengthのみ

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

  const handleGenerateImage = async (slideId: string) => {
    setGeneratingSlideId(slideId);

    try {
      const slide = slides.find(s => s.id === slideId);
      if (!slide) return;

      const response = await fetch('/api/generate-slide-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide }),
      });

      if (!response.ok) {
        throw new Error('画像生成に失敗しました');
      }

      const { imageUrl } = await response.json();

      // スライドに画像URLを追加
      const updatedSlides = slides.map(s =>
        s.id === slideId ? { ...s, imageUrl } : s
      );
      setSlides(updatedSlides);

      // 保存
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
      setGeneratingSlideId(null);
    }
  };

  // ビジュアル表現意図とワイヤーフレーム画像を再生成
  const handleRegenerateSlide = async (slideId: string) => {
    if (!confirm('このスライドのビジュアル表現意図と画像を再生成しますか？')) {
      return;
    }

    setGeneratingSlideId(slideId);

    try {
      const slide = slides.find(s => s.id === slideId);
      if (!slide) return;

      // Step 1: ビジュアル表現意図を再生成
      console.log(`🔄 ビジュアル表現意図を再生成中: ${slide.title}`);
      const intentResponse = await fetch('/api/enrich-slide-with-visual-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: { ...slide, visualIntent: undefined, visualHint: undefined, visualReason: undefined } }),
      });

      if (!intentResponse.ok) {
        throw new Error('ビジュアル表現意図の再生成に失敗しました');
      }

      const { visualHint, visualIntent, visualReason } = await intentResponse.json();
      const slideWithNewIntent = { ...slide, visualHint, visualIntent, visualReason, imageUrl: undefined };

      // Step 2: ワイヤーフレーム画像を再生成
      console.log(`🎨 ワイヤーフレーム画像を再生成中: ${slide.title}`);
      const imageResponse = await fetch('/api/generate-slide-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: slideWithNewIntent }),
      });

      if (!imageResponse.ok) {
        throw new Error('画像の再生成に失敗しました');
      }

      const { imageUrl } = await imageResponse.json();

      // スライドを更新
      const updatedSlides = slides.map(s =>
        s.id === slideId ? { ...slideWithNewIntent, imageUrl } : s
      );
      setSlides(updatedSlides);

      // 保存
      const updatedProposal = {
        ...proposal,
        slides: updatedSlides,
        updatedAt: Date.now(),
      };
      saveProposal(updatedProposal);

      console.log(`✅ 再生成完了: ${slide.title}`);
    } catch (error) {
      console.error('Regeneration error:', error);
      alert('再生成に失敗しました。もう一度お試しください。');
    } finally {
      setGeneratingSlideId(null);
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
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">AI対話</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-medium text-xs">
                ✓
              </div>
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">言語化確認</span>
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
            言語化された内容をもとに生成されたスライドのラフ画（ドラフト）を確認できます。順序の変更や削除も可能です。
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
                  <div
                    className="mb-3 relative cursor-pointer"
                    onClick={() => router.push(`/proposal/${id}/draft/${slide.id}`)}
                  >
                    <SlideDraft
                      slide={slide}
                      onGenerateImage={() => handleGenerateImage(slide.id)}
                      isGenerating={generatingSlideId === slide.id}
                    />

                    {/* ホバー時のコントロールオーバーレイ */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex flex-col gap-2">
                        {/* 再生成ボタン */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateSlide(slide.id);
                          }}
                          disabled={generatingSlideId === slide.id}
                          className="px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                          title="ビジュアル表現意図と画像を再生成"
                        >
                          {generatingSlideId === slide.id ? '再生成中...' : '🔄 再生成'}
                        </button>

                        {/* 並び替え・削除ボタン */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveUp(index);
                            }}
                            disabled={index === 0}
                            className="p-2 bg-white text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium"
                            title="上へ"
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveDown(index);
                            }}
                            disabled={index === slides.length - 1}
                            className="p-2 bg-white text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium"
                            title="下へ"
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(index);
                            }}
                            className="p-2 bg-red-600 text-white hover:bg-red-700 text-xs font-medium"
                            title="削除"
                          >
                            ×
                          </button>
                        </div>
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
              言語化確認画面でスライド内容を追加してください
            </p>
            <Button
              onClick={() => router.push(`/proposal/${id}/review`)}
              variant="outline"
            >
              言語化確認に戻る
            </Button>
          </Card>
        )}

        {/* アクションボタン */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => router.push(`/proposal/${id}/review`)}
            variant="outline"
          >
            ← 言語化確認に戻る
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
