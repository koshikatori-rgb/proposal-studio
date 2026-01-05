'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StepIndicator } from '@/components/common/StepIndicator';
import { VisualPatternPreview, VisualPatternsByCategory } from '@/components/slide/VisualPatternPreview';
import { saveProposal } from '@/lib/storage';
import { recommendVisual } from '@/lib/visualRecommender';
import type { SlideElement, SlideType, VisualHintType, SlideVisualDesign } from '@/types';

// スライドタイプの日本語ラベル
const slideTypeLabels: Record<SlideType, string> = {
  executive_summary: 'エグゼクティブサマリー',
  current_recognition: '現状認識',
  issue_setting: '課題設定',
  issue_tree: 'イシューツリー',
  tobe_vision: 'ToBe像',
  expected_effect: '期待効果',
  project_goal: 'プロジェクト目標',
  approach_overview: 'アプローチ概要',
  approach_detail: 'アプローチ詳細',
  why_this_approach: 'なぜこのアプローチか',
  why_us: 'Why Us',
  risk_management: 'リスク管理',
  schedule: 'スケジュール',
  team: '体制',
  project_members: 'メンバー',
  meeting_structure: '会議体',
  estimate: '見積り',
  estimate_assumptions: '前提条件',
  appendix: 'Appendix',
};

export default function LayoutDesignPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;
  const { proposal, loading } = useProposal(proposalId);

  const [slides, setSlides] = useState<SlideElement[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [visualDesigns, setVisualDesigns] = useState<Map<number, SlideVisualDesign>>(new Map());
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPatternSelector, setShowPatternSelector] = useState(false);

  // スライドを読み込み
  useEffect(() => {
    if (proposal?.slides && proposal.slides.length > 0) {
      setSlides(proposal.slides);
      // 初回のみ最初のスライドを選択
      setSelectedSlideId(prev => prev || proposal.slides[0].id);
    }
  }, [proposal]);

  // Phase B APIでAI推奨を取得
  const generateAIRecommendations = async () => {
    if (!proposal || slides.length === 0) return;

    setIsGeneratingAI(true);
    try {
      // スライドデータをPhase A形式に変換
      const phaseASlides = slides.map((slide, index) => ({
        slideNo: index + 1,
        title: slide.title || '',
        keyMessage: slide.mainMessage || '',
        body: slide.content?.bullets || [],
        evidenceNeeded: '',
        connectionToNext: '',
      }));

      const response = await fetch('/api/design-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: phaseASlides,
          outline: proposal.outline,
        }),
      });

      if (!response.ok) {
        throw new Error('AI推奨の取得に失敗しました');
      }

      const data = await response.json();
      if (data.success && data.slides) {
        const designMap = new Map<number, SlideVisualDesign>();
        data.slides.forEach((design: SlideVisualDesign) => {
          designMap.set(design.slideNo, design);
        });
        setVisualDesigns(designMap);

        // スライドにAI推奨を適用
        const updatedSlides = slides.map((slide, index) => {
          const design = designMap.get(index + 1);
          if (design) {
            return {
              ...slide,
              uiRecommendation: design.uiRecommendation,
              generativeInstruction: design.generativeInstruction,
              visualHint: mapPatternIdToVisualHint(design.uiRecommendation.primaryPatternId),
              visualReason: design.uiRecommendation.rationale,
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
        setHasChanges(true);
      }
    } catch (err) {
      console.error('AI recommendation error:', err);
      // フォールバック: ルールベース推奨を使用
      applyRuleBasedRecommendations();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ルールベース推奨を適用
  const applyRuleBasedRecommendations = () => {
    const updatedSlides = slides.map(slide => {
      const recommendation = recommendVisual(slide);
      return {
        ...slide,
        visualHint: recommendation.visualHint,
        visualReason: recommendation.reason,
        structurePreset: recommendation.preset,
        useStructureMode: recommendation.useStructureMode,
      };
    });
    setSlides(updatedSlides);
    setHasChanges(true);
  };

  // Phase BのPatternIDをVisualHintTypeに変換
  const mapPatternIdToVisualHint = (patternId: string): VisualHintType => {
    const mapping: Record<string, VisualHintType> = {
      'process': 'process-flow',
      'hierarchy': 'hierarchy',
      'pyramid': 'pyramid',
      'tree': 'tree',
      'cycle': 'cycle',
      'convergence': 'convergence',
      'divergence': 'divergence',
      'funnel': 'funnel',
      'swimlane': 'swimlane',
      'matrix': 'matrix',
      'graph': 'bar-chart',
      'table': 'comparison',
      'text_only': 'bullets-only',
    };
    return mapping[patternId] || 'bullets-only';
  };

  // スライドのビジュアルヒントを更新
  const updateSlideVisualHint = useCallback((slideId: string, visualHint: VisualHintType) => {
    setSlides(prev => prev.map(s =>
      s.id === slideId
        ? { ...s, visualHint, visualReason: '手動で選択' }
        : s
    ));
    setHasChanges(true);
    setShowPatternSelector(false);
  }, []);

  // 保存
  const handleSave = async () => {
    if (!proposal) return;
    setIsSaving(true);
    try {
      saveProposal({
        ...proposal,
        slides,
        updatedAt: Date.now(),
      });
      setHasChanges(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 次のステップへ
  const handleNext = async () => {
    if (hasChanges) {
      await handleSave();
    }
    router.push(`/proposal/${proposalId}/draft`);
  };

  // 選択中のスライド
  const selectedSlide = slides.find(s => s.id === selectedSlideId);
  const selectedIndex = slides.findIndex(s => s.id === selectedSlideId);
  const selectedDesign = selectedIndex >= 0 ? visualDesigns.get(selectedIndex + 1) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">提案書が見つかりません</div>
      </div>
    );
  }

  // スライドが空の場合の処理
  if (!loading && slides.length === 0 && (!proposal.slides || proposal.slides.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">スライドデータがありません</p>
          <p className="text-sm text-gray-400 mb-6">
            ストーリー編集ページでスライドを作成・保存してからレイアウト設計に進んでください
          </p>
          <Button onClick={() => router.push(`/proposal/${proposalId}/story`)}>
            ストーリー編集に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                ③ レイアウト・表現設計
              </h1>
              <p className="text-sm text-gray-500">
                各スライドの視覚的表現を選択
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/proposal/${proposalId}/story`)}
              >
                ← ストーリー編集に戻る
              </Button>
              <Button
                variant="secondary"
                onClick={generateAIRecommendations}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? 'AI分析中...' : 'AI推奨を取得'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
              <Button onClick={handleNext}>
                ドラフト生成へ →
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ステップインジケーター */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <StepIndicator proposalId={proposalId} currentStep={3} />
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 左カラム: スライド一覧 */}
          <div className="col-span-4">
            <Card>
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">スライド一覧</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {slides.length}枚のスライド
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={applyRuleBasedRecommendations}
                  >
                    一括推奨
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-300px)] overflow-y-auto">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setSelectedSlideId(slide.id)}
                    className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                      selectedSlideId === slide.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {slide.title || '（無題）'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {slide.visualHint && (
                            <VisualPatternPreview
                              pattern={slide.visualHint}
                              size="sm"
                              showLabel={false}
                            />
                          )}
                          <span className="text-xs text-gray-500">
                            {slideTypeLabels[slide.type as SlideType] || slide.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* 右カラム: レイアウト設定 */}
          <div className="col-span-8">
            {selectedSlide ? (
              <div className="space-y-6">
                {/* スライド情報 */}
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedSlide.title || '（無題）'}
                    </h3>
                    {selectedSlide.mainMessage && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">キーメッセージ: </span>
                        {selectedSlide.mainMessage}
                      </p>
                    )}
                  </div>
                </Card>

                {/* AI推奨 */}
                {(selectedDesign || selectedSlide.visualReason) && (
                  <Card>
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        推奨パターン
                      </h4>
                      <div className="flex items-start gap-4">
                        {selectedSlide.visualHint && (
                          <div className="flex-shrink-0">
                            <VisualPatternPreview
                              pattern={selectedSlide.visualHint}
                              size="lg"
                              showLabel={true}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            {selectedDesign?.uiRecommendation?.rationale || selectedSlide.visualReason || ''}
                          </p>
                          {selectedDesign?.generativeInstruction && (
                            <div className="mt-3 text-xs text-gray-500">
                              <p className="font-medium">レイアウト構成:</p>
                              <p>{selectedDesign.generativeInstruction.layoutComposition}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                        onClick={() => setShowPatternSelector(!showPatternSelector)}
                      >
                        {showPatternSelector ? 'パターン選択を閉じる' : '別のパターンを選択'}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* パターンセレクタ */}
                {showPatternSelector && (
                  <Card>
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">
                        パターンを選択
                      </h4>
                      <VisualPatternsByCategory
                        size="sm"
                        selectedPattern={selectedSlide.visualHint}
                        onSelect={(pattern) => updateSlideVisualHint(selectedSlide.id, pattern)}
                      />
                    </div>
                  </Card>
                )}

                {/* 推奨がまだない場合 */}
                {!selectedSlide.visualHint && !selectedDesign && (
                  <Card>
                    <div className="p-12 text-center">
                      <p className="text-gray-500 mb-4">
                        このスライドにはまだ表現パターンが設定されていません
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const recommendation = recommendVisual(selectedSlide);
                            updateSlideVisualHint(selectedSlide.id, recommendation.visualHint);
                          }}
                        >
                          自動推奨を適用
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setShowPatternSelector(true)}
                        >
                          手動で選択
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <div className="p-12 text-center text-gray-500">
                  左のリストからスライドを選択してください
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
