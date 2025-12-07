'use client';

import { useParams } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { ChatInterface } from '@/components/outline/ChatInterface';
import { Card } from '@/components/common/Card';

export default function OutlinePage() {
  const params = useParams();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            提案書が見つかりません
          </h1>
          <p className="text-gray-600">
            指定された提案書は存在しないか、削除されました。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
          <p className="text-gray-600 mt-2">
            クライアント: {proposal.clientName}
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <span className="ml-2 font-medium text-gray-900">骨子作成</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">
                2
              </div>
              <span className="ml-2 font-medium text-gray-500">スライド選択</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-2 font-medium text-gray-500">エクスポート</span>
            </div>
          </div>
        </div>

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
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => alert('スライド選択機能は次のフェーズで実装します')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            次へ: スライド選択
          </button>
        </div>
      </div>
    </div>
  );
}
