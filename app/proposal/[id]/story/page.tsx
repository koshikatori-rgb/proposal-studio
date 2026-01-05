'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StepIndicator } from '@/components/common/StepIndicator';
import { SlideTreeView } from '@/components/outline/SlideTreeView';
import { StoryCoherencePanel } from '@/components/story/StoryCoherencePanel';
import { saveProposal } from '@/lib/storage';
import type { SlideElement, SlideType, Outline } from '@/types';

// ビューモード
type ViewMode = 'edit' | 'story';

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

// スライドタイトルからスライドタイプを推定
function inferSlideTypeFromTitle(title: string): SlideType {
  const lowerTitle = title.toLowerCase();

  if (/サマリー|summary|結論|概要/.test(lowerTitle)) return 'executive_summary';
  if (/現状|背景|as-is|業界動向/.test(lowerTitle)) return 'current_recognition';
  if (/イシュー|課題|issue|論点/.test(lowerTitle)) return 'issue_setting';
  if (/tobe|to-be|目指す|ビジョン|目標|ゴール/.test(lowerTitle)) return 'tobe_vision';
  if (/期待効果|roi|投資対効果|効果/.test(lowerTitle)) return 'expected_effect';
  if (/アプローチ|approach|方針|手法|phase|フェーズ|ステップ/.test(lowerTitle)) return 'approach_overview';
  if (/why us|選定理由|実績|類似/.test(lowerTitle)) return 'why_us';
  if (/リスク|risk/.test(lowerTitle)) return 'risk_management';
  if (/スケジュール|schedule|期間|工程/.test(lowerTitle)) return 'schedule';
  if (/体制|team|役割|チーム/.test(lowerTitle)) return 'team';
  if (/会議|コミュニケーション|定例/.test(lowerTitle)) return 'meeting_structure';
  if (/見積|費用|コスト|金額/.test(lowerTitle)) return 'estimate';
  if (/前提|スコープ|対象外/.test(lowerTitle)) return 'estimate_assumptions';
  if (/appendix|補足|参考/.test(lowerTitle)) return 'appendix';

  return 'approach_detail';
}

export default function StoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id as string;
  const { proposal, loading } = useProposal(proposalId);

  const [slides, setSlides] = useState<SlideElement[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  // 骨子データからスライドを生成（初回のみ）
  useEffect(() => {
    if (proposal?.slides && proposal.slides.length > 0) {
      setSlides(proposal.slides);
      // 初回のみ最初のスライドを選択
      setSelectedSlideId(prev => prev || proposal.slides[0].id);
    } else if (proposal?.outline) {
      const generatedSlides = generateSlidesFromOutline(proposal.outline);
      setSlides(generatedSlides);
      if (generatedSlides.length > 0) {
        setSelectedSlideId(prev => prev || generatedSlides[0].id);
        // 新規生成されたスライドは変更ありとしてマーク（保存が必要）
        setHasChanges(true);
      }
    }
  }, [proposal]);

  // 骨子からスライドを生成
  function generateSlidesFromOutline(outline: Outline): SlideElement[] {
    const slides: SlideElement[] = [];
    let slideNumber = 1;

    // slideStructureProposalがある場合はそれを使用
    if (outline.slideStructureProposal && outline.slideStructureProposal.length > 0) {
      return outline.slideStructureProposal.map((item, index) => ({
        id: `slide-${index + 1}`,
        type: inferSlideTypeFromTitle(item.title),
        title: item.title,
        mainMessage: item.keyMessage || '',
        content: {
          body: item.content || '',
          bullets: item.content?.split('\n').filter(Boolean) || [],
        },
        layout: 'title-content' as const,
        order: index,
      }));
    }

    // 通常の骨子からスライドを生成
    // エグゼクティブサマリー
    slides.push({
      id: `slide-${slideNumber++}`,
      type: 'executive_summary',
      title: 'エグゼクティブサマリー',
      mainMessage: '',
      content: { body: '', bullets: [] },
      layout: 'title-content',
      order: slides.length,
    });

    // 現状認識
    if (outline.currentRecognition) {
      slides.push({
        id: `slide-${slideNumber++}`,
        type: 'current_recognition',
        title: '現状認識',
        mainMessage: outline.currentRecognition.background || '',
        content: {
          body: '',
          bullets: outline.currentRecognition.currentProblems || [],
        },
        layout: 'title-bullets',
        order: slides.length,
      });
    }

    // 課題設定
    if (outline.issueSetting) {
      slides.push({
        id: `slide-${slideNumber++}`,
        type: 'issue_setting',
        title: '課題設定',
        mainMessage: '',
        content: {
          body: '',
          bullets: outline.issueSetting.criticalIssues || [],
        },
        layout: 'title-bullets',
        order: slides.length,
      });
    }

    // ToBe像
    if (outline.toBeVision) {
      slides.push({
        id: `slide-${slideNumber++}`,
        type: 'tobe_vision',
        title: '目指すべき姿',
        mainMessage: outline.toBeVision.vision || '',
        content: {
          body: '',
          bullets: outline.toBeVision.goals || [],
        },
        layout: 'title-bullets',
        order: slides.length,
      });
    }

    // アプローチ
    if (outline.approach) {
      slides.push({
        id: `slide-${slideNumber++}`,
        type: 'approach_overview',
        title: 'アプローチ概要',
        mainMessage: outline.approach.overview || '',
        content: {
          body: '',
          bullets: outline.approach.steps?.map(s => `${s.title}: ${s.description}`) || [],
        },
        layout: 'steps',
        order: slides.length,
      });
    }

    return slides;
  }

  // スライドを更新
  const updateSlide = useCallback((slideId: string, updates: Partial<SlideElement>) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, ...updates } : s));
    setHasChanges(true);
  }, []);

  // スライドの並び替え
  const handleReorderSlides = useCallback((reorderedSlides: SlideElement[]) => {
    setSlides(reorderedSlides.map((s, i) => ({ ...s, order: i })));
    setHasChanges(true);
  }, []);

  // スライドの削除
  const handleDeleteSlide = useCallback((slideId: string) => {
    setSlides(prev => prev.filter(s => s.id !== slideId));
    if (selectedSlideId === slideId) {
      setSelectedSlideId(null);
    }
    setHasChanges(true);
  }, [selectedSlideId]);

  // スライドの追加
  const handleAddSlide = useCallback((afterSlideId?: string) => {
    const newSlide: SlideElement = {
      id: `slide-${Date.now()}`,
      type: 'approach_detail',
      title: '新しいスライド',
      mainMessage: '',
      content: { body: '', bullets: [] },
      layout: 'title-content',
      order: slides.length,
    };

    if (afterSlideId) {
      const afterIndex = slides.findIndex(s => s.id === afterSlideId);
      const newSlides = [...slides];
      newSlides.splice(afterIndex + 1, 0, newSlide);
      setSlides(newSlides.map((s, i) => ({ ...s, order: i })));
    } else {
      setSlides([...slides, newSlide]);
    }
    setSelectedSlideId(newSlide.id);
    setHasChanges(true);
  }, [slides]);

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
    router.push(`/proposal/${proposalId}/layout`);
  };

  // 選択中のスライド
  const selectedSlide = slides.find(s => s.id === selectedSlideId);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                ② ストーリー編集
              </h1>
              <p className="text-sm text-gray-500">
                テキストレベルで内容を確認・編集
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* ビューモード切り替え */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  編集
                </button>
                <button
                  onClick={() => setViewMode('story')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'story'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ストーリー確認
                </button>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/proposal/${proposalId}/chat`)}
              >
                ← 対話に戻る
              </Button>
              <Button
                variant="secondary"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
              <Button onClick={handleNext}>
                レイアウト設計へ →
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ステップインジケーター */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <StepIndicator proposalId={proposalId} currentStep={2} />
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'story' ? (
          /* ストーリー確認モード */
          <div className="grid grid-cols-12 gap-6">
            {/* 左カラム: ストーリーフロー + スライド詳細 */}
            <div className="col-span-7 space-y-6">
              <Card>
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">ストーリーフロー確認</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    全体の流れと各スライドの役割を確認。クリックで詳細表示、ドラッグで並び替え。
                  </p>
                </div>
                <div className="p-4">
                  <SlideTreeView
                    slides={slides}
                    onReorder={handleReorderSlides}
                    onDelete={handleDeleteSlide}
                    onAddSlide={handleAddSlide}
                    onEditSlideTitle={(slideId, newTitle) => updateSlide(slideId, { title: newTitle })}
                    selectedSlideId={selectedSlideId || undefined}
                    onSelectSlide={(slideId) => {
                      setSelectedSlideId(slideId);
                      // 編集モードに遷移せず、同じ画面内でスライド詳細を表示
                    }}
                    defaultViewMode="story"
                  />
                </div>
              </Card>

              {/* 選択中のスライド詳細（ストーリー確認モード用） */}
              {selectedSlide && (
                <Card>
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-gray-900">
                        スライド {slides.findIndex(s => s.id === selectedSlideId) + 1}: {selectedSlide.title || '（無題）'}
                      </h2>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setViewMode('edit')}
                      >
                        編集モードで開く
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* キーメッセージ */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        キーメッセージ
                      </label>
                      {selectedSlide.mainMessage ? (
                        <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-100">
                          {selectedSlide.mainMessage}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">未設定</p>
                      )}
                    </div>
                    {/* 論理構成 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        論理構成
                      </label>
                      {selectedSlide.content?.bullets && selectedSlide.content.bullets.length > 0 ? (
                        <ul className="text-sm text-gray-700 space-y-1">
                          {selectedSlide.content.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : selectedSlide.content?.body ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSlide.content.body}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">未設定</p>
                      )}
                    </div>
                    {/* スライドタイプ */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        スライドタイプ
                      </label>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {slideTypeLabels[selectedSlide.type as SlideType] || selectedSlide.type}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* 右カラム: 整合性チェック */}
            <div className="col-span-5 space-y-6">
              {/* ストーリー整合性チェック */}
              {proposal?.outline && (
                <StoryCoherencePanel
                  outline={proposal.outline}
                  slides={slides}
                  onSlideClick={(slideId) => setSelectedSlideId(slideId)}
                  selectedSlideId={selectedSlideId || undefined}
                />
              )}

              {/* キーメッセージ一覧 */}
              <Card>
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">キーメッセージ一覧</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    各スライドのキーメッセージを一覧で確認
                  </p>
                </div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedSlideId === slide.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedSlideId(slide.id)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {slide.title || '（無題）'}
                          </p>
                          {slide.mainMessage ? (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                              {slide.mainMessage}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-0.5 italic">
                              キーメッセージ未設定
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* 編集モード */
          <div className="grid grid-cols-12 gap-6">
            {/* 左カラム: スライド一覧 */}
            <div className="col-span-4">
              <Card>
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">スライド構成</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {slides.length}枚のスライド
                  </p>
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
                          <p className="text-xs text-gray-500 mt-0.5">
                            {slideTypeLabels[slide.type as SlideType] || slide.type}
                          </p>
                          {slide.mainMessage && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {slide.mainMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* 右カラム: スライド編集 */}
            <div className="col-span-8">
              {selectedSlide ? (
                <Card>
                  <div className="p-6 space-y-6">
                    {/* タイトル */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        スライドタイトル
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.title || ''}
                        onChange={(e) => updateSlide(selectedSlide.id, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="スライドのタイトルを入力"
                      />
                    </div>

                    {/* キーメッセージ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        キーメッセージ（Governing Thought）
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        このスライドで伝えたい結論を1文で。「〜すべきだ」「〜に起因する」など意思決定を促すメッセージに。
                      </p>
                      <textarea
                        value={selectedSlide.mainMessage || ''}
                        onChange={(e) => updateSlide(selectedSlide.id, { mainMessage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="例: 3つの課題を同時解決することで、投資対効果37倍を実現すべきだ"
                      />
                    </div>

                    {/* 論理構成 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        論理構成（Logical Structure）
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        キーメッセージを支える論点を記述。各行が1つの論点になります。
                      </p>
                      <textarea
                        value={selectedSlide.content?.body || selectedSlide.content?.bullets?.join('\n') || ''}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          updateSlide(selectedSlide.id, {
                            content: {
                              ...selectedSlide.content,
                              body: e.target.value,
                              bullets: lines.filter(Boolean),
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        rows={8}
                        placeholder="結論: 6ヶ月でCoE構築、1年で活用率70%達成&#10;ROI: 投資8,000万円に対し年間30億円効果&#10;アプローチ: 3段階スケーラブル浸透戦略"
                      />
                    </div>

                    {/* スライドタイプ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        スライドタイプ
                      </label>
                      <select
                        value={selectedSlide.type || ''}
                        onChange={(e) => updateSlide(selectedSlide.id, { type: e.target.value as SlideType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.entries(slideTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="p-12 text-center text-gray-500">
                    左のリストからスライドを選択してください
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
