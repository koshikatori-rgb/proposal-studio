'use client';

import { useRouter } from 'next/navigation';
import type { Proposal } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

type OutlineSummaryProps = {
  proposal: Proposal;
};

export const OutlineSummary: React.FC<OutlineSummaryProps> = ({ proposal }) => {
  const router = useRouter();
  const { outline } = proposal;

  return (
    <Card className="mb-12">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-lg font-medium text-black tracking-wide">
          骨子サマリー
        </h2>
        <Button
          onClick={() => router.push(`/proposal/${proposal.id}/outline-edit`)}
          variant="outline"
          size="sm"
        >
          編集
        </Button>
      </div>

      <div className="space-y-8">
        {/* 現状認識 */}
        <div className="border-l-2 border-black pl-6">
          <h3 className="text-sm font-medium text-black mb-4 tracking-wide uppercase">
            現状認識
          </h3>

          {outline.currentRecognition.background && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 tracking-wide">背景</p>
              <p className="text-sm text-black tracking-wide">
                {outline.currentRecognition.background}
              </p>
            </div>
          )}

          {outline.currentRecognition.currentProblems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 tracking-wide">現在の問題</p>
              <ul className="space-y-2">
                {outline.currentRecognition.currentProblems.map((problem, index) => (
                  <li key={index} className="text-sm text-black flex items-start tracking-wide">
                    <span className="mr-2">•</span>
                    <span>{problem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outline.currentRecognition.rootCauseHypothesis.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 tracking-wide">根本原因仮説</p>
              <ul className="space-y-2">
                {outline.currentRecognition.rootCauseHypothesis.map((cause, index) => (
                  <li key={index} className="text-sm text-black flex items-start tracking-wide">
                    <span className="mr-2">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 課題設定 */}
        <div className="border-l-2 border-black pl-6">
          <h3 className="text-sm font-medium text-black mb-4 tracking-wide uppercase">
            課題設定
          </h3>

          {outline.issueSetting.criticalIssues.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 tracking-wide">重要課題</p>
              <ul className="space-y-2">
                {outline.issueSetting.criticalIssues.map((issue, index) => (
                  <li key={index} className="text-sm text-black flex items-start tracking-wide">
                    <span className="mr-2">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ToBe像 */}
        <div className="border-l-2 border-black pl-6">
          <h3 className="text-sm font-medium text-black mb-4 tracking-wide uppercase">
            ToBe像
          </h3>

          {outline.toBeVision.vision && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 tracking-wide">ビジョン</p>
              <p className="text-sm text-black tracking-wide">
                {outline.toBeVision.vision}
              </p>
            </div>
          )}

          {outline.toBeVision.goals.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 tracking-wide">目標</p>
              <ul className="space-y-2">
                {outline.toBeVision.goals.map((goal, index) => (
                  <li key={index} className="text-sm text-black flex items-start tracking-wide">
                    <span className="mr-2">•</span>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outline.toBeVision.projectScope && (
            <div>
              <p className="text-xs text-gray-500 mb-2 tracking-wide">プロジェクトスコープ</p>
              <p className="text-sm text-black tracking-wide">
                {outline.toBeVision.projectScope}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
