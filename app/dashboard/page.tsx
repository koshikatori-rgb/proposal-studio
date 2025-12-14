'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { getProposals, saveProposal, deleteProposal } from '@/lib/storage';
import { generateId, formatDate } from '@/lib/utils';
import {
  proposalTemplates,
  generateSlidesFromTemplate,
  generateBlankSlides,
  type ProposalTemplate,
} from '@/lib/proposalTemplates';
import type { Proposal } from '@/types';

// 作成モードの型
type CreateMode = 'ai' | 'template' | 'blank';

export default function DashboardPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [createMode, setCreateMode] = useState<CreateMode>('ai');
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [step, setStep] = useState<'mode' | 'details'>('mode');

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = () => {
    const data = getProposals();
    setProposals(data.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleCreateProposal = () => {
    if (!newTitle.trim() || !newClient.trim()) return;

    // モードに応じてスライドを生成
    let slides: Proposal['slides'] = [];
    if (createMode === 'template' && selectedTemplate) {
      slides = generateSlidesFromTemplate(selectedTemplate);
    } else if (createMode === 'blank') {
      slides = generateBlankSlides();
    }
    // AIモードの場合はslidesは空のまま

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
      slides,
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
    resetModal();
    loadProposals();

    // モードに応じて遷移先を変更
    if (createMode === 'ai') {
      router.push(`/proposal/${newProposal.id}/chat`);
    } else {
      // テンプレート・白紙の場合は言語化確認ページへ直接遷移
      router.push(`/proposal/${newProposal.id}/review`);
    }
  };

  const resetModal = () => {
    setShowNewModal(false);
    setNewTitle('');
    setNewClient('');
    setCreateMode('ai');
    setSelectedTemplate(null);
    setStep('mode');
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
                onClick={() => router.push(`/proposal/${proposal.id}/chat`)}
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
            <div className="bg-white border border-gray-200 p-12 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {step === 'mode' ? (
                <>
                  <h2 className="text-lg font-medium text-black mb-8 tracking-wide">
                    作成方法を選択
                  </h2>

                  <div className="grid grid-cols-1 gap-4 mb-8">
                    {/* AI対話で作成 */}
                    <button
                      onClick={() => {
                        setCreateMode('ai');
                        setStep('details');
                      }}
                      className={`p-6 border-2 text-left transition-all hover:border-purple-500 hover:bg-purple-50 ${
                        createMode === 'ai' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-2xl">🤖</span>
                        <div>
                          <h3 className="font-medium text-black mb-1">AI対話で作成</h3>
                          <p className="text-sm text-gray-500">
                            AIと対話しながらストーリーを構築します。初めての方や、アイデアを整理したい方におすすめ。
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* テンプレートから作成 */}
                    <button
                      onClick={() => {
                        setCreateMode('template');
                        setStep('details');
                      }}
                      className={`p-6 border-2 text-left transition-all hover:border-blue-500 hover:bg-blue-50 ${
                        createMode === 'template' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-2xl">📋</span>
                        <div>
                          <h3 className="font-medium text-black mb-1">テンプレートから作成</h3>
                          <p className="text-sm text-gray-500">
                            標準的なスライド構成から始めます。自分でストーリーを考えたい方におすすめ。
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* 白紙から作成 */}
                    <button
                      onClick={() => {
                        setCreateMode('blank');
                        setStep('details');
                      }}
                      className={`p-6 border-2 text-left transition-all hover:border-gray-500 hover:bg-gray-50 ${
                        createMode === 'blank' ? 'border-gray-500 bg-gray-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-2xl">📄</span>
                        <div>
                          <h3 className="font-medium text-black mb-1">白紙から作成</h3>
                          <p className="text-sm text-gray-500">
                            完全に自由な構成で始めます。経験豊富な方向け。
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={resetModal} variant="outline">
                      キャンセル
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-8">
                    <button
                      onClick={() => setStep('mode')}
                      className="text-gray-500 hover:text-black transition-colors"
                    >
                      ←
                    </button>
                    <h2 className="text-lg font-medium text-black tracking-wide">
                      {createMode === 'ai' && '🤖 AI対話で作成'}
                      {createMode === 'template' && '📋 テンプレートから作成'}
                      {createMode === 'blank' && '📄 白紙から作成'}
                    </h2>
                  </div>

                  {/* テンプレート選択（テンプレートモードのみ） */}
                  {createMode === 'template' && (
                    <div className="mb-8">
                      <label className="block text-xs font-medium text-gray-600 mb-3 tracking-wide">
                        テンプレートを選択
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {proposalTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`p-4 border-2 text-left transition-all ${
                              selectedTemplate?.id === template.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl">{template.icon}</span>
                              <div>
                                <h4 className="font-medium text-black text-sm">{template.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {template.slides.length}枚のスライド
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6 mb-8">
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
                      disabled={
                        !newTitle.trim() ||
                        !newClient.trim() ||
                        (createMode === 'template' && !selectedTemplate)
                      }
                      className="flex-1"
                    >
                      {createMode === 'ai' ? 'AI対話を開始' : '言語化確認へ進む'}
                    </Button>
                    <Button onClick={resetModal} variant="outline" className="flex-1">
                      キャンセル
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
