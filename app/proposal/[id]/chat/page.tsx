'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { ChatInterface } from '@/components/outline/ChatInterface';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StepIndicator } from '@/components/common/StepIndicator';
import type { Outline } from '@/types';
import {
  getChatSession,
  saveProposal,
  getExtractionCache,
  saveExtractionCache,
  generateChatHash,
  isOutlineValid,
} from '@/lib/storage';

// 骨子をテキスト形式に変換（全セクション対応版）
const formatOutlineAsText = (outline: Outline): string => {
  const sections: string[] = [];
  let sectionNum = 1;

  // 現状認識
  if (outline.currentRecognition) {
    const cr = outline.currentRecognition;
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push(`【${sectionNum++}. 現状認識】`);
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('');

    if (cr.background) {
      sections.push('■ 背景');
      sections.push(`  ${cr.background}`);
      sections.push('');
    }

    if (cr.currentProblems && cr.currentProblems.length > 0) {
      sections.push('■ 直面している問題');
      cr.currentProblems.forEach((p, i) => {
        sections.push(`  ${i + 1}. ${p}`);
      });
      sections.push('');
    }

    if (cr.rootCauseHypothesis && cr.rootCauseHypothesis.length > 0) {
      sections.push('■ 原因仮説');
      cr.rootCauseHypothesis.forEach((h, i) => {
        sections.push(`  ${i + 1}. ${h}`);
      });
      sections.push('');
    }
    sections.push('');
  }

  // 課題設定
  if (outline.issueSetting && outline.issueSetting.criticalIssues?.length > 0) {
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push(`【${sectionNum++}. 課題設定】`);
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('');
    sections.push('■ クリティカルな課題');
    outline.issueSetting.criticalIssues.forEach((issue, i) => {
      sections.push(`  ${i + 1}. ${issue}`);
    });
    sections.push('');
    sections.push('');
  }

  // ToBe像
  if (outline.toBeVision) {
    const tb = outline.toBeVision;
    if (tb.vision || tb.goals?.length > 0) {
      sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      sections.push(`【${sectionNum++}. ToBe像（理想の姿）】`);
      sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      sections.push('');

      if (tb.vision) {
        sections.push('■ ビジョン');
        sections.push(`  ${tb.vision}`);
        sections.push('');
      }

      if (tb.goals && tb.goals.length > 0) {
        sections.push('■ 具体的なゴール');
        tb.goals.forEach((g, i) => {
          sections.push(`  ${i + 1}. ${g}`);
        });
        sections.push('');
      }

      if (tb.projectScope) {
        sections.push('■ プロジェクトスコープ');
        sections.push(`  ${tb.projectScope}`);
        sections.push('');
      }
      sections.push('');
    }
  }

  // アプローチ
  if (outline.approach) {
    const ap = outline.approach;
    if (ap.overview || ap.steps?.length > 0) {
      sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      sections.push(`【${sectionNum++}. アプローチ】`);
      sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      sections.push('');

      if (ap.overview) {
        sections.push('■ 概要');
        sections.push(`  ${ap.overview}`);
        sections.push('');
      }

      if (ap.steps && ap.steps.length > 0) {
        sections.push('■ 実施ステップ');
        sections.push(`  （全${ap.steps.length}ステップ）`);
        sections.push('');
        ap.steps.forEach((step, i) => {
          sections.push(`  ┌─────────────────────────`);
          sections.push(`  │ STEP ${i + 1}: ${step.title}`);
          sections.push(`  └─────────────────────────`);
          if (step.description) {
            sections.push(`    ${step.description}`);
          }
          sections.push('');
        });
      }
    }
  }

  // プロジェクトスケジュール
  if (outline.projectSchedule) {
    const ps = outline.projectSchedule;
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push(`【${sectionNum++}. プロジェクトスケジュール】`);
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('');

    if (ps.overview) {
      sections.push('■ 概要');
      sections.push(`  ${ps.overview}`);
      sections.push('');
    }

    if (ps.duration) {
      sections.push('■ 期間');
      sections.push(`  ${ps.duration}`);
      sections.push('');
    }

    if (ps.phases && Array.isArray(ps.phases) && ps.phases.length > 0) {
      sections.push('■ フェーズ別スケジュール');
      ps.phases.forEach((phase, i) => {
        sections.push(`  ${i + 1}. ${phase.name} (${phase.duration})`);
        if (phase.activities && Array.isArray(phase.activities) && phase.activities.length > 0) {
          phase.activities.forEach((act) => {
            sections.push(`     - ${act}`);
          });
        }
      });
      sections.push('');
    }

    if (ps.milestones && Array.isArray(ps.milestones) && ps.milestones.length > 0) {
      sections.push('■ マイルストーン');
      ps.milestones.forEach((m, i) => {
        sections.push(`  ${i + 1}. ${m}`);
      });
      sections.push('');
    }
    sections.push('');
  }

  // プロジェクト体制
  if (outline.projectTeam) {
    const pt = outline.projectTeam;
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push(`【${sectionNum++}. プロジェクト体制】`);
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('');

    if (pt.overview) {
      sections.push('■ 概要');
      sections.push(`  ${pt.overview}`);
      sections.push('');
    }

    if (pt.roles && Array.isArray(pt.roles) && pt.roles.length > 0) {
      sections.push('■ 役割・体制');
      pt.roles.forEach((role) => {
        const headcount = role.headcount ? ` (${role.headcount}名)` : '';
        sections.push(`  ・${role.role}${headcount}`);
        if (role.description) {
          sections.push(`    ${role.description}`);
        }
      });
      sections.push('');
    }

    if (pt.clientSide && Array.isArray(pt.clientSide) && pt.clientSide.length > 0) {
      sections.push('■ クライアント側体制');
      pt.clientSide.forEach((c) => {
        sections.push(`  ・${c}`);
      });
      sections.push('');
    } else if (pt.clientSide && typeof pt.clientSide === 'string') {
      sections.push('■ クライアント側体制');
      sections.push(`  ${pt.clientSide}`);
      sections.push('');
    }

    if (pt.responsibilities && Array.isArray(pt.responsibilities) && pt.responsibilities.length > 0) {
      sections.push('■ 役割分担');
      pt.responsibilities.forEach((r) => {
        sections.push(`  ・${r}`);
      });
      sections.push('');
    } else if (pt.responsibilities && typeof pt.responsibilities === 'string') {
      sections.push('■ 役割分担');
      sections.push(`  ${pt.responsibilities}`);
      sections.push('');
    }
    sections.push('');
  }

  // 会議体・コミュニケーション設計
  if (outline.meetingStructure) {
    const ms = outline.meetingStructure;
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push(`【${sectionNum++}. 会議体・コミュニケーション設計】`);
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('');

    if (ms.overview) {
      sections.push('■ 概要');
      sections.push(`  ${ms.overview}`);
      sections.push('');
    }

    if (ms.meetings && Array.isArray(ms.meetings) && ms.meetings.length > 0) {
      sections.push('■ 会議体一覧');
      ms.meetings.forEach((meeting) => {
        sections.push(`  ┌─────────────────────────`);
        sections.push(`  │ ${meeting.name} (${meeting.frequency})`);
        sections.push(`  └─────────────────────────`);
        if (meeting.purpose) {
          sections.push(`    目的: ${meeting.purpose}`);
        }
        if (meeting.participants && Array.isArray(meeting.participants) && meeting.participants.length > 0) {
          sections.push(`    参加者: ${meeting.participants.join(', ')}`);
        }
        sections.push('');
      });
    }

    if (ms.reportingStructure) {
      sections.push('■ 報告体制');
      sections.push(`  ${ms.reportingStructure}`);
      sections.push('');
    }

    if (ms.escalationPath) {
      sections.push('■ エスカレーションパス');
      sections.push(`  ${ms.escalationPath}`);
      sections.push('');
    }
    sections.push('');
  }

  // 見積り・費用
  if (outline.estimate) {
    const est = outline.estimate;
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push(`【${sectionNum++}. 見積り・費用】`);
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('');

    if (est.overview) {
      sections.push('■ 概要');
      sections.push(`  ${est.overview}`);
      sections.push('');
    }

    if (est.totalAmount) {
      sections.push('■ 総額');
      sections.push(`  ${est.totalAmount}`);
      sections.push('');
    }

    if (est.breakdown && Array.isArray(est.breakdown) && est.breakdown.length > 0) {
      sections.push('■ 内訳');
      est.breakdown.forEach((item) => {
        const amount = item.amount ? ` - ${item.amount}` : '';
        sections.push(`  ・${item.category}${amount}`);
        if (item.description) {
          sections.push(`    ${item.description}`);
        }
      });
      sections.push('');
    }

    if (est.assumptions && Array.isArray(est.assumptions) && est.assumptions.length > 0) {
      sections.push('■ 前提条件');
      est.assumptions.forEach((a) => {
        sections.push(`  ・${a}`);
      });
      sections.push('');
    }

    if (est.exclusions && Array.isArray(est.exclusions) && est.exclusions.length > 0) {
      sections.push('■ 対象外事項');
      est.exclusions.forEach((e) => {
        sections.push(`  ・${e}`);
      });
      sections.push('');
    }
    sections.push('');
  }

  // スライド構成案（対話で明示的に言及されている場合）
  if (outline.slideStructureProposal && Array.isArray(outline.slideStructureProposal) && outline.slideStructureProposal.length > 0) {
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push(`【${sectionNum++}. スライド構成案】`);
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('');
    sections.push(`■ 全${outline.slideStructureProposal.length}スライド`);
    sections.push('');
    outline.slideStructureProposal.forEach((slide) => {
      sections.push(`  ┌─────────────────────────`);
      sections.push(`  │ スライド${slide.slideNumber}: ${slide.title}`);
      sections.push(`  └─────────────────────────`);
      if (slide.purpose) {
        sections.push(`    目的: ${slide.purpose}`);
      }
      if (slide.content) {
        sections.push(`    内容: ${slide.content}`);
      }
      if (slide.keyMessage) {
        sections.push(`    メッセージ: ${slide.keyMessage}`);
      }
      sections.push('');
    });
  }

  return sections.join('\n');
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading, refresh } = useProposal(id);
  const [extracting, setExtracting] = useState(false);
  const [outlineText, setOutlineText] = useState<string>('');

  // 既存のoutlineがあれば表示
  useEffect(() => {
    if (proposal?.outline && isOutlineValid(proposal)) {
      setOutlineText(formatOutlineAsText(proposal.outline));
    }
  }, [proposal]);

  // 骨子をテキスト化（抽出）
  const handleExtractOutline = async () => {
    if (!proposal) return;

    const chatSession = getChatSession(id, 'outline');
    if (!chatSession || chatSession.messages.length === 0) {
      alert('まずAIと対話して、提案書の骨子となる情報を入力してください。');
      return;
    }

    setExtracting(true);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatSession.messages }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Extraction failed';
        console.error('❌ Extract API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const { outline } = data;

      const newOutline: Outline = {
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
        // プロジェクト実行セクション（対話で言及があれば保存）
        projectSchedule: outline.projectSchedule || undefined,
        projectTeam: outline.projectTeam || undefined,
        meetingStructure: outline.meetingStructure || undefined,
        estimate: outline.estimate || undefined,
        // スライド構成案（対話で明示的に言及されている場合）
        slideStructureProposal: outline.slideStructureProposal || undefined,
        // AIが推奨するビジュアル表現を保存
        visualRecommendations: outline.visualRecommendations || undefined,
      };

      // 保存
      const updatedProposal = {
        ...proposal,
        outline: newOutline,
        updatedAt: Date.now(),
      };
      saveProposal(updatedProposal);

      // キャッシュ保存
      const currentChatHash = generateChatHash(chatSession.messages);
      saveExtractionCache(id, currentChatHash);

      // 表示を更新
      setOutlineText(formatOutlineAsText(newOutline));

      // proposalを再読み込み
      refresh();

    } catch (error) {
      console.error('Extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert(`骨子の抽出に失敗しました: ${errorMessage}`);
    } finally {
      setExtracting(false);
    }
  };

  const handleNextStep = async () => {
    if (!proposal) return;

    // ★★★ 既に骨子が抽出済みの場合はAPIを呼ばずに遷移 ★★★
    // outlineTextが表示されている = 骨子抽出ボタンを押して抽出済み
    // または proposal.outline に有効なデータがある場合
    if (outlineText && outlineText.length > 0) {
      console.log('✅ 骨子テキストが既に表示されています。APIをスキップして遷移します。');
      router.push(`/proposal/${id}/review`);
      return;
    }

    // proposal.outlineが有効な場合もスキップ
    if (isOutlineValid(proposal)) {
      console.log('✅ proposal.outlineが有効です。APIをスキップして遷移します。');
      router.push(`/proposal/${id}/review`);
      return;
    }

    // 統合されたチャット履歴を取得
    const chatSession = getChatSession(id, 'outline');

    // チャット履歴が空の場合は、そのまま次のページへ
    if (!chatSession || chatSession.messages.length === 0) {
      router.push(`/proposal/${id}/review`);
      return;
    }

    // 現在のチャット履歴のハッシュを計算
    const currentChatHash = generateChatHash(chatSession.messages);

    // キャッシュをチェック：既存のoutlineが有効で、チャット履歴が変更されていない場合はスキップ
    const cache = getExtractionCache(id);
    if (cache && cache.chatHash === currentChatHash && isOutlineValid(proposal)) {
      console.log('✅ キャッシュヒット: 骨子抽出をスキップ');
      router.push(`/proposal/${id}/review`);
      return;
    }

    // キャッシュミス：APIを呼び出して抽出
    setExtracting(true);

    try {
      // 抽出APIを呼び出し
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatSession.messages }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Extraction failed';
        console.error('❌ Extract API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const { outline } = data;

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
          // プロジェクト実行セクション（対話で言及があれば保存）
          projectSchedule: outline.projectSchedule || undefined,
          projectTeam: outline.projectTeam || undefined,
          meetingStructure: outline.meetingStructure || undefined,
          estimate: outline.estimate || undefined,
          // スライド構成案（対話で明示的に言及されている場合）
          slideStructureProposal: outline.slideStructureProposal || undefined,
          // AIが推奨するビジュアル表現を保存
          visualRecommendations: outline.visualRecommendations || undefined,
        },
        updatedAt: Date.now(),
      };

      saveProposal(updatedProposal);

      // 抽出キャッシュを保存
      saveExtractionCache(id, currentChatHash);

      router.push(`/proposal/${id}/review`);
    } catch (error) {
      console.error('Extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      alert(`データの抽出に失敗しました: ${errorMessage}`);
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
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-black tracking-wide">ステップ1: AI対話で骨子を作成</h1>
              <p className="text-xs text-gray-500 tracking-wide">
                {proposal.title} - {proposal.clientName}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                disabled={extracting}
              >
                ← ダッシュボード
              </Button>
              <Button
                onClick={handleExtractOutline}
                variant="outline"
                disabled={extracting}
              >
                {extracting ? '抽出中...' : '骨子をテキスト化'}
              </Button>
              <Button onClick={handleNextStep} disabled={extracting}>
                {extracting ? '処理中...' : '次へ: 言語化確認 →'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ステップインジケーター */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <StepIndicator proposalId={proposal.id} currentStep={1} />
      </div>

      {/* メインコンテンツ: 左右分割 */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)' }}>
          {/* 左側: チャットエリア */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-50 px-4 py-2 border border-gray-200 rounded-t-lg">
              <p className="text-xs text-gray-600">
                AIと対話して骨子を作成: 現状認識 → 課題設定 → ToBe像 → アプローチ
              </p>
            </div>
            <div className="flex-1 border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
              <ChatInterface
                proposalId={proposal.id}
                section="outline"
              />
            </div>
          </div>

          {/* 右側: 骨子テキストパネル */}
          <div className="w-[400px] shrink-0 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-800">骨子テキスト</h3>
              {outlineText && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(outlineText);
                    alert('クリップボードにコピーしました');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  コピー
                </button>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-white">
              {outlineText ? (
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {outlineText}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-3">
                      まだ骨子が抽出されていません
                    </p>
                    <p className="text-xs text-gray-400">
                      AIと対話後、「骨子をテキスト化」ボタンで<br />
                      内容を確認できます
                    </p>
                  </div>
                </div>
              )}
            </div>
            {outlineText && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                  不足があれば左のチャットで追加対話し、再度「骨子をテキスト化」を実行してください
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
