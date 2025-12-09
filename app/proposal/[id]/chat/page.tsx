'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { ChatInterface } from '@/components/outline/ChatInterface';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { ChatSession } from '@/types';
import { getChatSession } from '@/lib/storage';
import { saveProposal } from '@/lib/storage';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);
  const [extracting, setExtracting] = useState(false);

  const handleNextStep = async () => {
    if (!proposal) return;

    setExtracting(true);

    try {
      // 統合されたチャット履歴を取得
      const chatSession = getChatSession(id, 'outline');

      // チャット履歴が空の場合は、そのまま次のページへ
      if (!chatSession || chatSession.messages.length === 0) {
        router.push(`/proposal/${id}/review`);
        return;
      }

      // 抽出APIを呼び出し
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatSession.messages }),
      });

      if (!response.ok) {
        throw new Error('Extraction failed');
      }

      const { outline } = await response.json();

      // 抽出されたデータをproposalのoutlineに保存
      const updatedProposal = {
        ...proposal,
        outline: {
          currentRecognition: {
            background: outline.currentRecognition?.background || '',
            backgroundLayer: 'company' as const,
            currentProblems: outline.currentRecognition?.currentProblems || [],
            rootCauseHypothesis: outline.currentRecognition?.rootCauseHypothesis || [],
          },
          issueSetting: {
            criticalIssues: outline.issueSetting?.criticalIssues || [],
          },
          toBeVision: {
            vision: outline.toBeVision?.vision || '',
            goals: outline.toBeVision?.goals || [],
            projectScope: outline.toBeVision?.projectScope || '',
          },
          approach: {
            overview: outline.approach?.overview || '',
            methodology: '',
            steps: (outline.approach?.steps || []).map((step: any, index: number) => ({
              id: `step-${index + 1}`,
              order: index + 1,
              title: step.title || '',
              description: step.description || '',
              deliverables: [],
            })),
          },
        },
        updatedAt: Date.now(),
      };

      saveProposal(updatedProposal);
      router.push(`/proposal/${id}/review`);
    } catch (error) {
      console.error('Extraction error:', error);
      alert('データの抽出に失敗しました。もう一度お試しください。');
    } finally {
      setExtracting(false);
    }
  };

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
                1
              </div>
              <span className="ml-3 text-xs font-medium text-black tracking-wide">AI対話</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 border border-gray-300 text-gray-400 flex items-center justify-center font-medium text-xs">
                2
              </div>
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">言語化確認</span>
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

        {/* 説明カード */}
        <Card className="mb-8">
          <h2 className="text-base font-medium text-black mb-4 tracking-wide">
            ステップ1: AI対話で骨子を作成
          </h2>
          <p className="text-sm text-gray-500 tracking-wide mb-4">
            AIと対話しながら、提案書の骨子を整理します。以下の流れで自然に進めていきましょう:
          </p>
          <ol className="text-sm text-gray-600 tracking-wide space-y-2 ml-4">
            <li>1. 現状認識（背景、問題、原因仮説）</li>
            <li>2. 課題設定（クリティカルな課題の特定）</li>
            <li>3. ToBe像（理想の姿とアプローチ概要）</li>
          </ol>
        </Card>

        {/* チャットエリア */}
        <div className="mb-16">
          <div className="h-[calc(100vh-400px)] min-h-[600px]">
            <ChatInterface
              proposalId={proposal.id}
              section="outline"
            />
          </div>
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            disabled={extracting}
          >
            ← ダッシュボードに戻る
          </Button>

          <Button
            onClick={handleNextStep}
            disabled={extracting}
          >
            {extracting ? '骨子を抽出中...' : '次へ: 言語化確認'}
          </Button>
        </div>
      </div>
    </div>
  );
}
