'use client';

import { useParams } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { ChatInterface } from '@/components/outline/ChatInterface';
import { OutlineSummary } from '@/components/outline/OutlineSummary';
import { Card } from '@/components/common/Card';

export default function OutlinePage() {
  const params = useParams();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);

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
              <span className="ml-3 text-xs font-medium text-black tracking-wide">骨子作成</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 border border-gray-300 text-gray-400 flex items-center justify-center font-medium text-xs">
                2
              </div>
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">スライド選択</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 border border-gray-300 text-gray-400 flex items-center justify-center font-medium text-xs">
                3
              </div>
              <span className="ml-3 text-xs font-medium text-gray-400 tracking-wide">エクスポート</span>
            </div>
          </div>
        </div>

        {/* 骨子サマリー */}
        <OutlineSummary proposal={proposal} />

        {/* コンテンツエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 現状認識 */}
          <div className="h-[600px]">
            <ChatInterface
              proposalId={proposal.id}
              section="current_recognition"
            />
          </div>

          {/* 課題仮説 */}
          <div className="h-[600px]">
            <ChatInterface
              proposalId={proposal.id}
              section="issue_setting"
            />
          </div>

          {/* ToBe像 */}
          <div className="h-[600px]">
            <ChatInterface
              proposalId={proposal.id}
              section="tobe_vision"
            />
          </div>
        </div>

        {/* 次へボタン */}
        <div className="mt-16 flex justify-end">
          <button
            onClick={() => window.location.href = `/proposal/${proposal.id}/slides`}
            className="px-8 py-4 bg-black text-white border border-black hover:bg-gray-800 transition-all text-sm font-medium tracking-wide"
          >
            次へ: スライド選択
          </button>
        </div>
      </div>
    </div>
  );
}
