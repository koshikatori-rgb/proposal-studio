'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { saveProposal } from '@/lib/storage';
import type { SlideElement, Outline } from '@/types';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);
  const [generating, setGenerating] = useState(false);
  const [editableOutline, setEditableOutline] = useState<Outline | null>(null);
  const [previewSlides, setPreviewSlides] = useState<SlideElement[]>([]);

  // proposalが読み込まれたら編集可能なoutlineを初期化
  useEffect(() => {
    if (proposal && proposal.outline) {
      setEditableOutline(proposal.outline);
    }
  }, [proposal]);

  // outlineが変更されたらプレビュースライドを生成
  useEffect(() => {
    if (!editableOutline) return;

    const slides: SlideElement[] = [];
    let order = 0;

    // 1. エグゼクティブサマリー
    slides.push({
      id: `preview-slide-${order + 1}`,
      type: 'executive_summary',
      order: order++,
      title: 'エグゼクティブサマリー',
      mainMessage: editableOutline.currentRecognition.background || '',
      layout: 'title-content',
      content: {
        title: 'エグゼクティブサマリー',
        text: editableOutline.currentRecognition.background || '',
      },
    });

    // 2. 現状認識
    slides.push({
      id: `preview-slide-${order + 1}`,
      type: 'current_recognition',
      order: order++,
      title: '現状認識',
      mainMessage: editableOutline.currentRecognition.background || '',
      layout: 'title-bullets',
      content: {
        title: '現状認識',
        body: editableOutline.currentRecognition.background || '',
        bullets: [
          ...(editableOutline.currentRecognition.currentProblems.length > 0
            ? ['【直面している問題】', ...editableOutline.currentRecognition.currentProblems]
            : []),
          ...(editableOutline.currentRecognition.rootCauseHypothesis.length > 0
            ? ['【原因仮説】', ...editableOutline.currentRecognition.rootCauseHypothesis]
            : []),
        ],
      },
    });

    // 3. 課題設定
    if (editableOutline.issueSetting.criticalIssues.length > 0) {
      const mainIssue = editableOutline.issueSetting.criticalIssues[0];
      slides.push({
        id: `preview-slide-${order + 1}`,
        type: 'issue_setting',
        order: order++,
        title: '課題設定',
        mainMessage: `最もクリティカルな課題は「${mainIssue}」である`,
        layout: 'title-bullets',
        content: {
          title: '課題設定',
          bullets: editableOutline.issueSetting.criticalIssues,
        },
      });
    }

    // 4. ToBe像
    if (editableOutline.toBeVision.vision) {
      slides.push({
        id: `preview-slide-${order + 1}`,
        type: 'tobe_vision',
        order: order++,
        title: 'ToBe像（理想の姿）',
        mainMessage: editableOutline.toBeVision.vision,
        layout: 'title-bullets',
        content: {
          title: 'ToBe像（理想の姿）',
          body: editableOutline.toBeVision.vision,
          bullets: [
            ...(editableOutline.toBeVision.goals.length > 0
              ? ['【具体的なゴール】', ...editableOutline.toBeVision.goals]
              : []),
            ...(editableOutline.toBeVision.projectScope
              ? ['【プロジェクトスコープ】', editableOutline.toBeVision.projectScope]
              : []),
          ],
        },
      });
    }

    // 5. アプローチ概要
    if (editableOutline.approach.overview) {
      slides.push({
        id: `preview-slide-${order + 1}`,
        type: 'approach_overview',
        order: order++,
        title: 'アプローチ概要',
        mainMessage: editableOutline.approach.overview,
        layout: 'title-content',
        content: {
          title: 'アプローチ概要',
          text: editableOutline.approach.overview,
        },
      });
    }

    // 6. アプローチステップ
    editableOutline.approach.steps.forEach((step, idx) => {
      slides.push({
        id: `preview-slide-${order + 1}`,
        type: 'approach_detail',
        order: order++,
        title: `アプローチ: ${step.title}`,
        mainMessage: step.title,
        layout: 'title-content',
        content: {
          title: `STEP ${idx + 1}: ${step.title}`,
          text: step.description,
        },
      });
    });

    setPreviewSlides(slides);
  }, [editableOutline]);


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

  if (!proposal || !editableOutline) {
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

  // スライドを削除
  const handleDeleteSlide = (slideId: string) => {
    if (!confirm('このスライドを削除してもよろしいですか？')) {
      return;
    }

    const slideToDelete = previewSlides.find(s => s.id === slideId);
    if (!slideToDelete) return;

    // スライドタイプに応じてoutlineから削除
    const newOutline = { ...editableOutline };

    if (slideToDelete.type === 'issue_setting') {
      newOutline.issueSetting.criticalIssues = [];
    } else if (slideToDelete.type === 'tobe_vision') {
      newOutline.toBeVision = { vision: '', goals: [], projectScope: '' };
    } else if (slideToDelete.type === 'approach_overview') {
      newOutline.approach.overview = '';
    } else if (slideToDelete.type === 'approach_detail') {
      // アプローチステップを削除
      const stepIndex = previewSlides
        .filter(s => s.type === 'approach_detail')
        .findIndex(s => s.id === slideId);
      if (stepIndex !== -1) {
        newOutline.approach.steps = newOutline.approach.steps.filter((_, idx) => idx !== stepIndex);
      }
    }

    setEditableOutline(newOutline);
  };

  // スライドタイプのアイコンを取得
  const getSlideTypeIcon = (type: string | undefined) => {
    switch (type) {
      case 'executive_summary': return '📊';
      case 'current_recognition': return '🔍';
      case 'issue_setting': return '🎯';
      case 'tobe_vision': return '✨';
      case 'approach_overview': return '🗺️';
      case 'approach_detail': return '📝';
      default: return '📄';
    }
  };

  // スライドタイプの日本語名を取得
  const getSlideTypeName = (type: string | undefined) => {
    switch (type) {
      case 'executive_summary': return 'サマリー';
      case 'current_recognition': return '現状認識';
      case 'issue_setting': return '課題設定';
      case 'tobe_vision': return 'ToBe像';
      case 'approach_overview': return 'アプローチ概要';
      case 'approach_detail': return 'アプローチ詳細';
      default: return 'その他';
    }
  };

  const handleNextStep = async () => {
    if (!proposal || !editableOutline) return;

    // 編集された内容を保存
    const updatedProposal = {
      ...proposal,
      outline: editableOutline,
      updatedAt: Date.now(),
    };
    saveProposal(updatedProposal);

    setGenerating(true);

    try {
      // outline データから SlideElement[] を生成
      const slides: SlideElement[] = [];
      let order = 0;

      // 1. エグゼクティブサマリー（現状認識のメインメッセージ）
      slides.push({
        id: `slide-${order + 1}`,
        type: 'executive_summary',
        order: order++,
        title: 'エグゼクティブサマリー',
        mainMessage: editableOutline.currentRecognition.background || '',
        layout: 'title-content',
        content: {
          title: 'エグゼクティブサマリー',
          text: editableOutline.currentRecognition.background || '',
        },
      });

      // 2. 現状認識スライド
      slides.push({
        id: `slide-${order + 1}`,
        type: 'current_recognition',
        order: order++,
        title: '現状認識',
        mainMessage: editableOutline.currentRecognition.background || '',
        layout: 'title-bullets',
        content: {
          title: '現状認識',
          body: editableOutline.currentRecognition.background || '',
          bullets: [
            ...(editableOutline.currentRecognition.currentProblems.length > 0
              ? ['【直面している問題】', ...editableOutline.currentRecognition.currentProblems]
              : []),
            ...(editableOutline.currentRecognition.rootCauseHypothesis.length > 0
              ? ['【原因仮説】', ...editableOutline.currentRecognition.rootCauseHypothesis]
              : []),
          ],
        },
      });

      // 3. 課題設定スライド
      if (editableOutline.issueSetting.criticalIssues.length > 0) {
        const mainIssue = editableOutline.issueSetting.criticalIssues[0];
        slides.push({
          id: `slide-${order + 1}`,
          type: 'issue_setting',
          order: order++,
          title: '課題設定',
          mainMessage: `最もクリティカルな課題は「${mainIssue}」である`,
          layout: 'title-bullets',
          content: {
            title: '課題設定',
            bullets: editableOutline.issueSetting.criticalIssues,
          },
        });
      }

      // 4. ToBe像スライド
      if (editableOutline.toBeVision.vision) {
        slides.push({
          id: `slide-${order + 1}`,
          type: 'tobe_vision',
          order: order++,
          title: 'ToBe像（理想の姿）',
          mainMessage: editableOutline.toBeVision.vision,
          layout: 'title-bullets',
          content: {
            title: 'ToBe像（理想の姿）',
            body: editableOutline.toBeVision.vision,
            bullets: [
              ...(editableOutline.toBeVision.goals.length > 0
                ? ['【具体的なゴール】', ...editableOutline.toBeVision.goals]
                : []),
              ...(editableOutline.toBeVision.projectScope
                ? ['【プロジェクトスコープ】', editableOutline.toBeVision.projectScope]
                : []),
            ],
          },
        });
      }

      // 5. アプローチ概要スライド
      if (editableOutline.approach.overview) {
        slides.push({
          id: `slide-${order + 1}`,
          type: 'approach_overview',
          order: order++,
          title: 'アプローチ概要',
          mainMessage: editableOutline.approach.overview,
          layout: 'title-content',
          content: {
            title: 'アプローチ概要',
            text: editableOutline.approach.overview,
          },
        });
      }

      // 6. アプローチステップスライド（各ステップ）
      editableOutline.approach.steps.forEach((step, idx) => {
        slides.push({
          id: `slide-${order + 1}`,
          type: 'approach_detail',
          order: order++,
          title: `アプローチ: ${step.title}`,
          mainMessage: step.title,
          layout: 'title-content',
          content: {
            title: `STEP ${idx + 1}: ${step.title}`,
            text: step.description,
          },
        });
      });

      // 各スライドのビジュアル表現意図をAIで分析
      // 既にvisualIntentが設定されているスライドはスキップ
      const slidesNeedingAnalysis = slides.filter(slide => !slide.visualIntent);

      if (slidesNeedingAnalysis.length > 0) {
        console.log(`📝 ${slidesNeedingAnalysis.length} 枚のスライドにビジュアル表現意図を分析中...`);
      } else {
        console.log(`✅ 全てのスライドに既にビジュアル表現意図が設定されています`);
      }

      const slidesWithVisualHints = await Promise.all(
        slides.map(async (slide) => {
          // 既にvisualIntentが設定されている場合はスキップ
          if (slide.visualIntent) {
            console.log(`⏭️  スキップ（既存データ使用）: ${slide.title}`);
            return slide;
          }

          try {
            const response = await fetch('/api/enrich-slide-with-visual-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slide }),
            });

            if (!response.ok) {
              console.warn(`Visual intent analysis failed for slide: ${slide.title}`);
              return {
                ...slide,
                visualHint: 'bullets-only',
                visualIntent: 'シンプルな箇条書きで表現',
                visualReason: '分析に失敗したため、デフォルトの表現を使用',
              };
            }

            const { visualHint, visualIntent, visualReason } = await response.json();
            console.log(`✅ ビジュアル表現意図を生成: ${slide.title} → ${visualHint}`);
            return { ...slide, visualHint, visualIntent, visualReason };
          } catch (error) {
            console.error('Visual intent error:', error);
            return {
              ...slide,
              visualHint: 'bullets-only',
              visualIntent: 'シンプルな箇条書きで表現',
              visualReason: '分析に失敗したため、デフォルトの表現を使用',
            };
          }
        })
      );

      console.log(`✅ ビジュアル表現意図の処理完了`);

      // スライドを proposal に保存
      const updatedProposal = {
        ...proposal,
        slides: slidesWithVisualHints,
        updatedAt: Date.now(),
      };

      saveProposal(updatedProposal);

      // ドラフト確認へ遷移
      router.push(`/proposal/${id}/draft`);
    } catch (error) {
      console.error('Slide generation error:', error);
      alert('スライドの生成に失敗しました。もう一度お試しください。');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* ヘッダー */}
        <div className="mb-16">
          <h1 className="text-2xl font-medium text-black tracking-wide mb-3">ステップ2: 言語化された骨子の確認</h1>
          <p className="text-sm text-gray-500 tracking-wide mb-2">
            {proposal.title} - {proposal.clientName}
          </p>
          <p className="text-xs text-gray-400 tracking-wide">
            AI対話から抽出された提案書の骨子を確認・編集できます
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
                2
              </div>
              <span className="ml-3 text-xs font-medium text-black tracking-wide">言語化確認</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 border border-gray-300 text-gray-400 flex items-center justify-center font-medium text-xs">
                3
              </div>
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">ドラフト確認</span>
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

        <div className="space-y-12">
          {/* 現状認識 */}
          <Card>
            <h2 className="text-lg font-medium text-black tracking-wide mb-6 pb-4 border-b border-gray-200">
              1. 現状認識
            </h2>
            <div className="space-y-6">
              {/* メインメッセージ */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <label className="text-xs font-medium text-yellow-800 tracking-wider uppercase mb-3 block">
                  ⭐ メインメッセージ（このスライドで伝えたいこと）
                </label>
                <textarea
                  value={editableOutline.currentRecognition.background || ''}
                  onChange={(e) => setEditableOutline({
                    ...editableOutline,
                    currentRecognition: {
                      ...editableOutline.currentRecognition,
                      background: e.target.value,
                    },
                  })}
                  className="w-full px-4 py-3 border border-yellow-300 bg-white text-sm tracking-wide resize-none focus:outline-none focus:border-yellow-500"
                  rows={2}
                  placeholder="例: ○○業界では△△の変化により、クライアントは□□という問題に直面している"
                />
                <p className="text-xs text-yellow-700 mt-2">
                  このスライドの核となるメッセージです。1〜2文で簡潔に。
                </p>
              </div>

              {/* 背景 */}
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  背景（詳細）
                </label>
                <textarea
                  value={editableOutline.currentRecognition.background}
                  onChange={(e) => setEditableOutline({
                    ...editableOutline,
                    currentRecognition: {
                      ...editableOutline.currentRecognition,
                      background: e.target.value,
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-sm tracking-wide resize-none"
                  rows={4}
                  placeholder="AIとの対話から自動抽出されます"
                />
              </div>

              {/* 問題 */}
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  直面している問題
                </label>
                {editableOutline.currentRecognition.currentProblems.length > 0 ? (
                  <ul className="space-y-2">
                    {editableOutline.currentRecognition.currentProblems.map((problem, idx) => (
                      <li key={idx} className="flex items-start gap-3 px-4 py-3 bg-gray-50 border border-gray-200">
                        <span className="text-xs text-gray-500 font-medium mt-0.5">{idx + 1}.</span>
                        <span className="text-sm text-gray-700 tracking-wide flex-1">{problem}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic px-4 py-3 bg-gray-50 border border-gray-200">
                    AIとの対話から自動抽出されます
                  </p>
                )}
              </div>

              {/* 原因仮説 */}
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  原因仮説
                </label>
                {editableOutline.currentRecognition.rootCauseHypothesis.length > 0 ? (
                  <ul className="space-y-2">
                    {editableOutline.currentRecognition.rootCauseHypothesis.map((cause, idx) => (
                      <li key={idx} className="flex items-start gap-3 px-4 py-3 bg-gray-50 border border-gray-200">
                        <span className="text-xs text-gray-500 font-medium mt-0.5">{idx + 1}.</span>
                        <span className="text-sm text-gray-700 tracking-wide flex-1">{cause}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic px-4 py-3 bg-gray-50 border border-gray-200">
                    AIとの対話から自動抽出されます
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* 課題設定 */}
          <Card>
            <h2 className="text-lg font-medium text-black tracking-wide mb-6 pb-4 border-b border-gray-200">
              2. 課題設定
            </h2>
            <div className="space-y-6">
              {/* メインメッセージ */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <label className="text-xs font-medium text-yellow-800 tracking-wider uppercase mb-3 block">
                  ⭐ メインメッセージ（このスライドで伝えたいこと）
                </label>
                <textarea
                  value={editableOutline.issueSetting.criticalIssues.length > 0
                    ? `最もクリティカルな課題は「${editableOutline.issueSetting.criticalIssues[0]}」である`
                    : ''}
                  onChange={(e) => {
                    const newIssue = e.target.value.replace(/^最もクリティカルな課題は「/, '').replace(/」である$/, '');
                    const newCriticalIssues = [...editableOutline.issueSetting.criticalIssues];
                    if (newCriticalIssues.length > 0) {
                      newCriticalIssues[0] = newIssue;
                    } else {
                      newCriticalIssues.push(newIssue);
                    }
                    setEditableOutline({
                      ...editableOutline,
                      issueSetting: {
                        ...editableOutline.issueSetting,
                        criticalIssues: newCriticalIssues,
                      },
                    });
                  }}
                  className="w-full px-4 py-3 border border-yellow-300 bg-white text-sm tracking-wide resize-none focus:outline-none focus:border-yellow-500"
                  rows={2}
                  placeholder="例: 最もクリティカルな課題は「○○の仕組みが整っていないこと」である"
                />
                <p className="text-xs text-yellow-700 mt-2">
                  このスライドの核となるメッセージです。1〜2文で簡潔に。
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  クリティカルな課題（詳細）
                </label>
                {editableOutline.issueSetting.criticalIssues.length > 0 ? (
                  <ul className="space-y-2">
                    {editableOutline.issueSetting.criticalIssues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-3 px-4 py-3 bg-gray-50 border border-gray-200">
                        <span className="text-xs text-gray-500 font-medium mt-0.5">課題{idx + 1}</span>
                        <span className="text-sm text-gray-700 tracking-wide flex-1">{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic px-4 py-3 bg-gray-50 border border-gray-200">
                    AIとの対話から自動抽出されます
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* ToBe像 */}
          <Card>
            <h2 className="text-lg font-medium text-black tracking-wide mb-6 pb-4 border-b border-gray-200">
              3. ToBe像（理想の姿）
            </h2>
            <div className="space-y-6">
              {/* メインメッセージ */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <label className="text-xs font-medium text-yellow-800 tracking-wider uppercase mb-3 block">
                  ⭐ メインメッセージ（このスライドで伝えたいこと）
                </label>
                <textarea
                  value={editableOutline.toBeVision.vision || ''}
                  onChange={(e) => setEditableOutline({
                    ...editableOutline,
                    toBeVision: {
                      ...editableOutline.toBeVision,
                      vision: e.target.value,
                    },
                  })}
                  className="w-full px-4 py-3 border border-yellow-300 bg-white text-sm tracking-wide resize-none focus:outline-none focus:border-yellow-500"
                  rows={2}
                  placeholder="例: ○○を実現し、△△な状態を目指す"
                />
                <p className="text-xs text-yellow-700 mt-2">
                  このスライドの核となるメッセージです。1〜2文で簡潔に。
                </p>
              </div>

              {/* ビジョン */}
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  ビジョン（詳細）
                </label>
                <textarea
                  value={editableOutline.toBeVision.vision}
                  onChange={(e) => setEditableOutline({
                    ...editableOutline,
                    toBeVision: {
                      ...editableOutline.toBeVision,
                      vision: e.target.value,
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-sm tracking-wide resize-none focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="AIとの対話から自動抽出されます"
                />
              </div>

              {/* ゴール */}
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  具体的なゴール
                </label>
                {editableOutline.toBeVision.goals.length > 0 ? (
                  <ul className="space-y-2">
                    {editableOutline.toBeVision.goals.map((goal, idx) => (
                      <li key={idx} className="flex items-start gap-3 px-4 py-3 bg-gray-50 border border-gray-200">
                        <span className="text-xs text-gray-500 font-medium mt-0.5">{idx + 1}.</span>
                        <span className="text-sm text-gray-700 tracking-wide flex-1">{goal}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic px-4 py-3 bg-gray-50 border border-gray-200">
                    AIとの対話から自動抽出されます
                  </p>
                )}
              </div>

              {/* プロジェクトスコープ */}
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  プロジェクトスコープ
                </label>
                <textarea
                  value={editableOutline.toBeVision.projectScope}
                  onChange={(e) => setEditableOutline({
                    ...editableOutline,
                    toBeVision: {
                      ...editableOutline.toBeVision,
                      projectScope: e.target.value,
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-sm tracking-wide resize-none focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="AIとの対話から自動抽出されます"
                />
              </div>
            </div>
          </Card>

          {/* アプローチ概要 */}
          <Card>
            <h2 className="text-lg font-medium text-black tracking-wide mb-6 pb-4 border-b border-gray-200">
              4. アプローチ概要
            </h2>
            <div className="space-y-6">
              {/* メインメッセージ */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <label className="text-xs font-medium text-yellow-800 tracking-wider uppercase mb-3 block">
                  ⭐ メインメッセージ（このスライドで伝えたいこと）
                </label>
                <textarea
                  value={editableOutline.approach.overview || ''}
                  onChange={(e) => setEditableOutline({
                    ...editableOutline,
                    approach: {
                      ...editableOutline.approach,
                      overview: e.target.value,
                    },
                  })}
                  className="w-full px-4 py-3 border border-yellow-300 bg-white text-sm tracking-wide resize-none focus:outline-none focus:border-yellow-500"
                  rows={2}
                  placeholder="例: ○○ステップのアプローチで、△△を実現する"
                />
                <p className="text-xs text-yellow-700 mt-2">
                  このスライドの核となるメッセージです。1〜2文で簡潔に。
                </p>
              </div>

              {/* 全体像 */}
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  アプローチの全体像（詳細）
                </label>
                <textarea
                  value={editableOutline.approach.overview}
                  onChange={(e) => setEditableOutline({
                    ...editableOutline,
                    approach: {
                      ...editableOutline.approach,
                      overview: e.target.value,
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-sm tracking-wide resize-none focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="AIとの対話から自動抽出されます"
                />
              </div>

              {/* ステップ */}
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  アプローチステップ
                </label>
                {editableOutline.approach.steps.length > 0 ? (
                  <div className="space-y-3">
                    {editableOutline.approach.steps.map((step, idx) => (
                      <div key={step.id} className="px-4 py-3 bg-blue-50 border-l-4 border-blue-400">
                        <div className="flex items-start gap-3 mb-2">
                          <span className="text-xs text-blue-800 font-medium">STEP {idx + 1}</span>
                          <span className="text-sm font-medium text-gray-900 tracking-wide flex-1">{step.title}</span>
                        </div>
                        <p className="text-sm text-gray-700 tracking-wide ml-16">{step.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic px-4 py-3 bg-gray-50 border border-gray-200">
                    AIとの対話から自動抽出されます
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* スライド構成プレビュー（新規セクション） */}
        <div className="mt-16">
          <Card>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-medium text-black tracking-wide mb-2">
                  📋 スライド構成プレビュー
                </h2>
                <p className="text-xs text-gray-500 tracking-wide">
                  全 {previewSlides.length} 枚のスライドが生成されます。不足or余分なスライドがあれば、上記のセクションで内容を編集してください。
                </p>
              </div>
            </div>

            {previewSlides.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="relative border border-gray-300 rounded hover:border-black hover:shadow-lg transition-all group"
                  >
                    {/* スライド番号とタイプ */}
                    <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs font-medium z-10">
                      #{idx + 1}
                    </div>
                    <div className="absolute top-2 right-2 bg-white border border-gray-300 px-2 py-1 text-xs z-10">
                      {getSlideTypeIcon(slide.type)} {getSlideTypeName(slide.type)}
                    </div>

                    {/* スライド内容 */}
                    <div className="p-6 pt-12 pb-16 min-h-[200px] bg-gray-50">
                      <h3 className="text-sm font-bold text-black mb-3 line-clamp-2 tracking-wide">
                        {slide.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-4 tracking-wide">
                        {slide.mainMessage}
                      </p>
                    </div>

                    {/* 削除ボタン（必須スライド以外） */}
                    {slide.type !== 'executive_summary' && slide.type !== 'current_recognition' && (
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 text-xs font-medium"
                          title="このスライドを削除"
                        >
                          削除
                        </button>
                      </div>
                    )}

                    {/* 必須マーク */}
                    {(slide.type === 'executive_summary' || slide.type === 'current_recognition') && (
                      <div className="absolute bottom-2 right-2 bg-gray-200 text-gray-600 px-2 py-1 text-xs">
                        必須
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                スライドプレビューがありません
              </p>
            )}

            {/* 編集ヒント */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-xs text-blue-800 tracking-wide">
                  💡 <strong>スライドの追加・削除方法:</strong> 上記の各セクション（課題設定、ToBe像、アプローチ等）の内容を編集すると、スライド構成が自動的に更新されます。不要なスライドは「削除」ボタンで削除できます。
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between items-center mt-16 sticky bottom-0 bg-white py-6 border-t border-gray-200">
          <Button
            onClick={() => router.push(`/proposal/${id}/chat`)}
            variant="outline"
            disabled={generating}
          >
            ← AI対話に戻る
          </Button>

          <Button onClick={handleNextStep} disabled={generating}>
            {generating ? 'スライドを生成中...' : '次へ: ドラフト確認'}
          </Button>
        </div>
      </div>
    </div>
  );
}
