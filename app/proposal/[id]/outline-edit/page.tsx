'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { saveProposal } from '@/lib/storage';

export default function OutlineEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);

  // 編集用のstate
  const [background, setBackground] = useState('');
  const [currentProblems, setCurrentProblems] = useState('');
  const [rootCauseHypothesis, setRootCauseHypothesis] = useState('');
  const [criticalIssues, setCriticalIssues] = useState('');
  const [vision, setVision] = useState('');
  const [goals, setGoals] = useState('');
  const [projectScope, setProjectScope] = useState('');

  // proposalが読み込まれたら初期値を設定
  useEffect(() => {
    if (proposal) {
      setBackground(proposal.outline.currentRecognition.background || '');
      setCurrentProblems(proposal.outline.currentRecognition.currentProblems.join('\n') || '');
      setRootCauseHypothesis(proposal.outline.currentRecognition.rootCauseHypothesis.join('\n') || '');
      setCriticalIssues(proposal.outline.issueSetting.criticalIssues.join('\n') || '');
      setVision(proposal.outline.toBeVision.vision || '');
      setGoals(proposal.outline.toBeVision.goals.join('\n') || '');
      setProjectScope(proposal.outline.toBeVision.projectScope || '');
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

  const handleSave = () => {
    const updatedProposal = {
      ...proposal,
      outline: {
        ...proposal.outline,
        currentRecognition: {
          ...proposal.outline.currentRecognition,
          background,
          currentProblems: currentProblems.split('\n').filter(p => p.trim()),
          rootCauseHypothesis: rootCauseHypothesis.split('\n').filter(h => h.trim()),
        },
        issueSetting: {
          ...proposal.outline.issueSetting,
          criticalIssues: criticalIssues.split('\n').filter(i => i.trim()),
        },
        toBeVision: {
          ...proposal.outline.toBeVision,
          vision,
          goals: goals.split('\n').filter(g => g.trim()),
          projectScope,
        },
      },
      updatedAt: Date.now(),
    };

    saveProposal(updatedProposal);
    router.push(`/proposal/${id}/outline`);
  };

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* ヘッダー */}
        <div className="mb-16">
          <h1 className="text-2xl font-medium text-black tracking-wide mb-3">骨子編集</h1>
          <p className="text-sm text-gray-500 tracking-wide">
            {proposal.title} - {proposal.clientName}
          </p>
        </div>

        <div className="space-y-12">
          {/* 現状認識 */}
          <Card>
            <h2 className="text-lg font-medium text-black mb-8 tracking-wide">
              現状認識
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  背景
                </label>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                  rows={4}
                  placeholder="クライアントの背景を記述..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  現在の問題（1行1項目）
                </label>
                <textarea
                  value={currentProblems}
                  onChange={(e) => setCurrentProblems(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                  rows={6}
                  placeholder="問題1&#10;問題2&#10;問題3"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  根本原因仮説（1行1項目）
                </label>
                <textarea
                  value={rootCauseHypothesis}
                  onChange={(e) => setRootCauseHypothesis(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                  rows={6}
                  placeholder="原因仮説1&#10;原因仮説2&#10;原因仮説3"
                />
              </div>
            </div>
          </Card>

          {/* 課題設定 */}
          <Card>
            <h2 className="text-lg font-medium text-black mb-8 tracking-wide">
              課題設定
            </h2>

            <div>
              <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                重要課題（1行1項目）
              </label>
              <textarea
                value={criticalIssues}
                onChange={(e) => setCriticalIssues(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                rows={6}
                placeholder="重要課題1&#10;重要課題2&#10;重要課題3"
              />
            </div>
          </Card>

          {/* ToBe像 */}
          <Card>
            <h2 className="text-lg font-medium text-black mb-8 tracking-wide">
              ToBe像
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  ビジョン
                </label>
                <textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                  rows={4}
                  placeholder="目指すべき姿を記述..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  目標（1行1項目）
                </label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                  rows={6}
                  placeholder="目標1&#10;目標2&#10;目標3"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 tracking-wider uppercase mb-3 block">
                  プロジェクトスコープ
                </label>
                <textarea
                  value={projectScope}
                  onChange={(e) => setProjectScope(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black transition-all text-sm tracking-wide resize-none"
                  rows={4}
                  placeholder="プロジェクトの範囲を記述..."
                />
              </div>
            </div>
          </Card>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between items-center mt-16">
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
