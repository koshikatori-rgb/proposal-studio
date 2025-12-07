'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { getProposals, saveProposal, deleteProposal } from '@/lib/storage';
import { generateId, formatDate } from '@/lib/utils';
import type { Proposal } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = () => {
    const data = getProposals();
    setProposals(data.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleCreateProposal = () => {
    if (!newTitle.trim() || !newClient.trim()) return;

    const newProposal: Proposal = {
      id: generateId(),
      title: newTitle.trim(),
      clientName: newClient.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'draft',
      outline: {
        currentRecognition: {
          background: '',
          backgroundLayer: 'company',
          currentProblems: [],
          rootCauseHypothesis: [],
        },
        issueSetting: {
          criticalIssues: [],
        },
        toBeVision: {
          vision: '',
          goals: [],
          projectScope: '',
        },
        approach: {
          overview: '',
          methodology: '',
          steps: [],
        },
      },
      slides: [],
      settings: {
        template: 'default',
        colors: {
          primary: '#1e3a8a',
          secondary: '#3b82f6',
          accent: '#f59e0b',
          text: '#111827',
          background: '#ffffff',
        },
        font: {
          family: 'Noto Sans JP, sans-serif',
          sizes: {
            title: 24,
            heading: 18,
            body: 14,
          },
        },
      },
    };

    saveProposal(newProposal);
    setShowNewModal(false);
    setNewTitle('');
    setNewClient('');
    loadProposals();
    router.push(`/proposal/${newProposal.id}/outline`);
  };

  const handleDelete = (id: string) => {
    if (confirm('この提案書を削除してもよろしいですか？')) {
      deleteProposal(id);
      loadProposals();
    }
  };

  const getStatusBadge = (status: Proposal['status']) => {
    const styles = {
      draft: 'bg-gray-50 text-gray-600 border border-gray-300',
      in_progress: 'bg-gray-50 text-gray-900 border border-gray-400',
      completed: 'bg-black text-white border border-black',
    };

    const labels = {
      draft: '下書き',
      in_progress: '作成中',
      completed: '完成',
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium tracking-wide ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-16">
          <div>
            <h1 className="text-2xl font-medium text-black tracking-wide mb-3">Dashboard</h1>
            <p className="text-sm text-gray-500 tracking-wide">提案書の一覧と管理</p>
          </div>
          <Button onClick={() => setShowNewModal(true)}>
            新規作成
          </Button>
        </div>

        {/* 提案書一覧 */}
        {proposals.length === 0 ? (
          <Card className="text-center py-24">
            <p className="text-sm text-gray-400 mb-8 tracking-wide">
              まだ提案書がありません
            </p>
            <Button onClick={() => setShowNewModal(true)}>
              最初の提案書を作成
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {proposals.map((proposal) => (
              <Card
                key={proposal.id}
                hover
                className="cursor-pointer border-0"
                onClick={() => router.push(`/proposal/${proposal.id}/outline`)}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-base font-medium text-black line-clamp-2 tracking-wide flex-1 pr-4">
                    {proposal.title}
                  </h3>
                  {getStatusBadge(proposal.status)}
                </div>

                <p className="text-xs text-gray-500 mb-8 tracking-wide">
                  {proposal.clientName}
                </p>

                <div className="flex justify-between items-center text-xs text-gray-400 tracking-wide">
                  <span>{formatDate(proposal.updatedAt)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(proposal.id);
                    }}
                    className="text-gray-500 hover:text-black transition-colors"
                  >
                    削除
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 新規作成モーダル */}
        {showNewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 p-12 max-w-lg w-full mx-4">
              <h2 className="text-lg font-medium text-black mb-8 tracking-wide">
                新規提案書作成
              </h2>

              <div className="space-y-6 mb-12">
                <Input
                  label="提案書タイトル"
                  value={newTitle}
                  onChange={setNewTitle}
                  placeholder="例: DX推進支援提案書"
                  required
                />

                <Input
                  label="クライアント名"
                  value={newClient}
                  onChange={setNewClient}
                  placeholder="例: 株式会社ABC"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleCreateProposal}
                  disabled={!newTitle.trim() || !newClient.trim()}
                  className="flex-1"
                >
                  作成
                </Button>
                <Button
                  onClick={() => {
                    setShowNewModal(false);
                    setNewTitle('');
                    setNewClient('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
