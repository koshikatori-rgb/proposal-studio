'use client';

import { useState } from 'react';
import type { ProposalOutline, SlideData } from '@/types';
import type {
  Storyline,
  StoryCoherenceCheck,
  StoryIssue,
  StorySuggestion,
} from '@/types/insight';
import { EmotionalCurveChart } from './EmotionalCurveChart';
import { StorylineVisualizer } from './StorylineVisualizer';

type StoryCoherencePanelProps = {
  outline: ProposalOutline;
  slides?: SlideData[];
  onApplySuggestion?: (suggestion: StorySuggestion) => void;
  onSlideClick?: (slideId: string) => void;
  selectedSlideId?: string;
};

// 表示モード
type ViewMode = 'overview' | 'emotional-curve' | 'storyline';

export function StoryCoherencePanel({
  outline,
  slides,
  onApplySuggestion,
  onSlideClick,
  selectedSlideId,
}: StoryCoherencePanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [storyline, setStoryline] = useState<Storyline | null>(null);
  const [coherenceCheck, setCoherenceCheck] = useState<StoryCoherenceCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const analyzeStory = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/check-story-coherence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, slides }),
      });

      if (!response.ok) {
        throw new Error('ストーリー分析に失敗しました');
      }

      const data = await response.json();
      setStoryline(data.storyline);
      setCoherenceCheck(data.coherenceCheck);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityColor = (severity: 'critical' | 'major' | 'minor') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'major':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getIssueTypeLabel = (type: StoryIssue['type']) => {
    switch (type) {
      case 'logic_gap':
        return '論理の飛躍';
      case 'missing_transition':
        return '接続の欠如';
      case 'weak_message':
        return 'メッセージが弱い';
      case 'redundancy':
        return '冗長性';
      case 'sequence_problem':
        return '順序の問題';
    }
  };

  const getTransitionTypeLabel = (type: string) => {
    switch (type) {
      case 'therefore':
        return 'したがって';
      case 'however':
        return 'しかし';
      case 'furthermore':
        return 'さらに';
      case 'specifically':
        return '具体的には';
      case 'as_a_result':
        return 'その結果';
      default:
        return type;
    }
  };

  const getEmotionalLabel = (emotion: string) => {
    switch (emotion) {
      case 'concern':
        return '懸念';
      case 'curiosity':
        return '好奇心';
      case 'neutral':
        return '中立';
      case 'tension':
        return '緊張';
      case 'hope':
        return '希望';
      case 'urgency':
        return '緊急性';
      case 'confidence':
        return '確信';
      case 'action':
        return '行動';
      case 'commitment':
        return 'コミットメント';
      default:
        return emotion;
    }
  };

  const getStructureLabel = (structure: string) => {
    switch (structure) {
      case 'problem_solution':
        return '問題→解決策';
      case 'situation_complication_resolution':
        return 'SCR（マッキンゼー式）';
      case 'why_what_how':
        return 'なぜ→何を→どうやって';
      case 'past_present_future':
        return '過去→現在→未来';
      case 'challenge_opportunity':
        return '課題→機会';
      case 'custom':
        return 'カスタム';
      default:
        return structure;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <h3 className="text-sm font-medium text-gray-900">ナラティブ・アーキテクト</h3>
          </div>
          <button
            onClick={analyzeStory}
            disabled={isAnalyzing}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              isAnalyzing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isAnalyzing ? '分析中...' : coherenceCheck ? '再分析' : 'ストーリーを分析'}
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          SCR構造の自動設計・感情曲線・スライド間接続をAIが分析します
        </p>

        {/* 表示モード切り替えタブ */}
        {coherenceCheck && storyline && (
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                viewMode === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setViewMode('emotional-curve')}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                viewMode === 'emotional-curve'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📈 感情曲線
            </button>
            <button
              onClick={() => setViewMode('storyline')}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                viewMode === 'storyline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔄 ストーリーフロー
            </button>
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {!coherenceCheck && !isAnalyzing && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm mb-2">「ストーリーを分析」ボタンをクリックして</p>
            <p className="text-sm">提案書全体の論理構成をチェックしましょう</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
            <p className="text-sm text-gray-500">ストーリーラインを分析中...</p>
          </div>
        )}

        {coherenceCheck && storyline && (
          <div className="space-y-6">
            {/* スコア表示（常に表示） */}
            <div className="flex items-center gap-4">
              <div
                className={`px-4 py-2 rounded-lg font-bold text-2xl ${getScoreColor(
                  coherenceCheck.overallScore
                )}`}
              >
                {coherenceCheck.overallScore}
                <span className="text-sm font-normal ml-1">/ 100</span>
              </div>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      coherenceCheck.overallScore >= 80
                        ? 'bg-green-500'
                        : coherenceCheck.overallScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${coherenceCheck.overallScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {coherenceCheck.overallScore >= 80
                    ? 'ストーリーは概ね整合しています'
                    : coherenceCheck.overallScore >= 60
                    ? 'いくつかの改善点があります'
                    : '重要な修正が必要です'}
                </p>
              </div>
            </div>

            {/* 感情曲線ビュー */}
            {viewMode === 'emotional-curve' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-medium text-gray-700 mb-3 flex items-center gap-1">
                  <span>📈</span> 感情曲線（Emotional Arc）
                </h4>
                <p className="text-[10px] text-gray-500 mb-4">
                  聴衆の感情を戦略的にコントロールする曲線。スライドをクリックで詳細表示
                </p>
                <EmotionalCurveChart
                  storyline={storyline}
                  slides={slides}
                  onSlideClick={onSlideClick}
                />
              </div>
            )}

            {/* ストーリーラインビュー */}
            {viewMode === 'storyline' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-medium text-gray-700 mb-3 flex items-center gap-1">
                  <span>🔄</span> ストーリーライン・ビジュアライザ
                </h4>
                <p className="text-[10px] text-gray-500 mb-4">
                  スライド間の論理的な接続とナラティブ構造を可視化
                </p>
                <StorylineVisualizer
                  storyline={storyline}
                  slides={slides}
                  onSlideClick={onSlideClick}
                  selectedSlideId={selectedSlideId}
                />
              </div>
            )}

            {/* 概要ビュー（デフォルト） */}
            {viewMode === 'overview' && (
              <>
                {/* ナラティブ構造 */}
            <div className="border border-gray-200 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                <span>🎭</span> ナラティブ構造
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {getStructureLabel(storyline.structure)}
                </span>
              </div>
              <p className="text-xs text-gray-600">{storyline.overarchingMessage}</p>

              {/* 感情アーク */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 mb-1">感情アーク</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                    {getEmotionalLabel(storyline.emotionalArc.start)}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="px-1.5 py-0.5 bg-orange-100 rounded">
                    {getEmotionalLabel(storyline.emotionalArc.climax)}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="px-1.5 py-0.5 bg-green-100 rounded">
                    {getEmotionalLabel(storyline.emotionalArc.end)}
                  </span>
                </div>
              </div>
            </div>

            {/* スライド間の接続 */}
            {storyline.transitions && storyline.transitions.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <span>🔗</span> スライド間の接続
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {storyline.transitions.map((transition, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded"
                    >
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded shrink-0">
                        {getTransitionTypeLabel(transition.transitionType)}
                      </span>
                      <span className="text-gray-600">{transition.bridgeSentence}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 問題点 */}
            {coherenceCheck.issues && coherenceCheck.issues.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <span>⚠️</span> 検出された問題点（{coherenceCheck.issues.length}件）
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {coherenceCheck.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`border rounded p-2 cursor-pointer transition-colors ${getSeverityColor(
                        issue.severity
                      )} ${expandedIssue === `issue-${idx}` ? 'ring-2 ring-blue-300' : ''}`}
                      onClick={() =>
                        setExpandedIssue(expandedIssue === `issue-${idx}` ? null : `issue-${idx}`)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              issue.severity === 'critical'
                                ? 'bg-red-200'
                                : issue.severity === 'major'
                                ? 'bg-orange-200'
                                : 'bg-yellow-200'
                            }`}
                          >
                            {issue.severity === 'critical'
                              ? '重大'
                              : issue.severity === 'major'
                              ? '主要'
                              : '軽微'}
                          </span>
                          <span className="text-xs font-medium">
                            {getIssueTypeLabel(issue.type)}
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {expandedIssue === `issue-${idx}` ? '▲' : '▼'}
                        </span>
                      </div>
                      <p className="text-xs mt-1">{issue.description}</p>
                      {expandedIssue === `issue-${idx}` && (
                        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                          <p className="text-[10px] text-gray-600">
                            <strong>影響:</strong> {issue.impact}
                          </p>
                          {issue.location.section && (
                            <p className="text-[10px] text-gray-500 mt-1">
                              場所: {issue.location.section}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 改善提案 */}
            {coherenceCheck.suggestions && coherenceCheck.suggestions.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <span>💡</span> 改善提案（{coherenceCheck.suggestions.length}件）
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {coherenceCheck.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="border border-green-200 bg-green-50 rounded p-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            suggestion.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : suggestion.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {suggestion.priority === 'high'
                            ? '優先度: 高'
                            : suggestion.priority === 'medium'
                            ? '優先度: 中'
                            : '優先度: 低'}
                        </span>
                        {onApplySuggestion && (
                          <button
                            onClick={() => onApplySuggestion(suggestion)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 underline"
                          >
                            適用
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-800">{suggestion.action}</p>
                      {suggestion.example && (
                        <p className="text-[10px] text-gray-600 mt-1 italic">
                          例: {suggestion.example}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 聴衆プロファイル（推定） */}
            {storyline.audienceProfile && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <span>👤</span> 想定される聴衆
                </h4>
                <p className="text-xs text-gray-800 font-medium mb-1">
                  {storyline.audienceProfile.role}
                </p>
                {storyline.audienceProfile.concerns.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-500">関心事:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {storyline.audienceProfile.concerns.map((concern, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded"
                        >
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
