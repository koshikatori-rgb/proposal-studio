'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { saveProposal } from '@/lib/storage';
import type { SlideElement } from '@/types';

export default function OutlineEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);

  // 各スライドの編集用state
  const [slideContents, setSlideContents] = useState<Record<string, { title: string; bullets: string; body: string }>>({});

  // proposalが読み込まれたらスライド内容を初期化
  useEffect(() => {
    if (proposal && proposal.slides.length > 0) {
      const contents: Record<string, { title: string; bullets: string; body: string }> = {};
      proposal.slides.forEach((slide) => {
        contents[slide.id] = {
          title: slide.content.title || '',
          bullets: (slide.content.bullets || []).join('\n'),
          body: slide.content.body || '',
        };
      });
      setSlideContents(contents);
    }
  }, [proposal]);

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

  const handleSlideContentChange = (slideId: string, field: 'title' | 'bullets' | 'body', value: string) => {
    setSlideContents((prev) => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    // スライド内容を更新
    const updatedSlides = proposal.slides.map((slide) => {
      const content = slideContents[slide.id];
      if (!content) return slide;

      return {
        ...slide,
        content: {
          ...slide.content,
          title: content.title,
          bullets: content.bullets.split('\n').filter((b) => b.trim()),
          body: content.body,
        },
      };
    });

    const updatedProposal = {
      ...proposal,
      slides: updatedSlides,
      updatedAt: Date.now(),
    };

    saveProposal(updatedProposal);
    router.push(`/proposal/${id}/outline`);
  };

  // スライドを順序順にソート
  const sortedSlides = [...proposal.slides].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* ヘッダー */}
        <div className="mb-16">
          <h1 className="text-2xl font-medium text-black tracking-wide mb-3">提案書全体の骨子編集</h1>
          <p className="text-sm text-gray-500 tracking-wide">
            {proposal.title} - {proposal.clientName}
          </p>
          <p className="text-xs text-gray-400 tracking-wide mt-2">
            全 {sortedSlides.length} 枚のスライド内容を言語化された状態で確認・編集できます
          </p>
        </div>

        <div className="space-y-12">
          {sortedSlides.map((slide, index) => {
            const content = slideContents[slide.id] || { title: '', bullets: '', body: '' };

            return (
              <Card key={slide.id}>
                {/* スライド番号とレイアウト */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <h2 className="text-base font-medium text-black tracking-wide">
                      スライド {index + 1}
                    </h2>
                    <p className="text-xs text-gray-400 tracking-wide mt-1">
                      レイアウト: {getLayoutLabel(slide.layout)}
                    </p>
                  </div>
                  {slide.type && (
                    <span className="text-xs text-gray-500 tracking-wide px-2 py-1 bg-gray-50 border border-gray-200">
                      {getTypeLabel(slide.type)}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  {/* タイトル */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={content.title}
                      onChange={(e) => handleSlideContentChange(slide.id, 'title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide"
                      placeholder="スライドのタイトルを入力..."
                    />
                  </div>

                  {/* 箇条書き（メインメッセージ） */}
                  {(slide.layout === 'title-bullets' || slide.layout === 'hierarchy' || slide.layout === 'steps') && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                        箇条書き・要点（1行1項目）
                      </label>
                      <textarea
                        value={content.bullets}
                        onChange={(e) => handleSlideContentChange(slide.id, 'bullets', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                        rows={8}
                        placeholder="要点1&#10;要点2&#10;要点3"
                      />
                    </div>
                  )}

                  {/* 本文 */}
                  {(slide.layout === 'title-content' || slide.layout === 'two-column') && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                        本文・説明
                      </label>
                      <textarea
                        value={content.body}
                        onChange={(e) => handleSlideContentChange(slide.id, 'body', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                        rows={6}
                        placeholder="詳細な説明を記述..."
                      />
                    </div>
                  )}

                  {/* メインメッセージ（title-only以外） */}
                  {slide.mainMessage && (
                    <div className="bg-gray-50 border border-gray-200 p-4">
                      <p className="text-xs text-gray-500 mb-2">メインメッセージ</p>
                      <p className="text-sm text-gray-700 tracking-wide">{slide.mainMessage}</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between items-center mt-16 sticky bottom-0 bg-white py-6 border-t border-gray-200">
          <Button
            onClick={() => router.push(`/proposal/${id}/outline`)}
            variant="outline"
          >
            ← キャンセル
          </Button>

          <Button onClick={handleSave}>
            保存して戻る
          </Button>
        </div>
      </div>
    </div>
  );
}

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
