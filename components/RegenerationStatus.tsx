'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getRegenerationQueue,
  getProgress,
  updateQueueStatus,
  clearRegenerationQueue,
  retryFailedTasks,
} from '@/lib/regenerationQueue';

interface RegenerationStatusProps {
  proposalId: string;
  onRefresh?: () => void;
}

/**
 * 再生成の進捗状況を表示するステータスバー
 * アプリ全体で表示され、ページ遷移しても状態が保持される
 */
export function RegenerationStatus({ proposalId, onRefresh }: RegenerationStatusProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<ReturnType<typeof getRegenerationQueue>>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, failed: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  // 定期的に状態を更新
  useEffect(() => {
    const updateStatus = () => {
      const q = getRegenerationQueue(proposalId);
      setQueue(q);
      if (q) {
        setProgress(getProgress(proposalId));
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [proposalId]);

  // キューがない、または完了済みで閉じた場合は表示しない
  if (!queue) return null;

  const isRunning = queue.status === 'running';
  const isCompleted = queue.status === 'completed';
  const isPaused = queue.status === 'paused';
  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  // 一時停止
  const handlePause = () => {
    updateQueueStatus(proposalId, 'paused');
    setQueue(getRegenerationQueue(proposalId));
  };

  // 再開
  const handleResume = () => {
    updateQueueStatus(proposalId, 'running');
    setQueue(getRegenerationQueue(proposalId));
  };

  // 失敗したタスクを再試行
  const handleRetry = () => {
    retryFailedTasks(proposalId);
    setQueue(getRegenerationQueue(proposalId));
  };

  // 閉じる（完了時のみ）
  const handleClose = () => {
    clearRegenerationQueue(proposalId);
    setQueue(null);
    if (onRefresh) onRefresh();
  };

  // ドラフトページへ移動
  const handleNavigateToDraft = () => {
    router.push(`/proposal/${proposalId}/draft`);
  };

  // 最小化時の表示
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all"
        >
          {isRunning && <span className="animate-spin">⏳</span>}
          {isCompleted && <span>✅</span>}
          {isPaused && <span>⏸️</span>}
          <span className="text-sm font-medium">
            {progress.completed}/{progress.total}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {isRunning && <span className="animate-spin text-purple-600">⏳</span>}
          {isCompleted && <span className="text-green-600">✅</span>}
          {isPaused && <span className="text-yellow-600">⏸️</span>}
          <span className="text-sm font-medium text-gray-700">
            {isRunning && '再生成中...'}
            {isCompleted && '再生成完了'}
            {isPaused && '一時停止中'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="最小化"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isCompleted && (
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="閉じる"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 進捗バー */}
      <div className="px-4 py-3">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : isPaused ? 'bg-yellow-500' : 'bg-purple-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {progress.completed} / {progress.total} 枚完了
          </span>
          {progress.failed > 0 && (
            <span className="text-red-500">{progress.failed} 枚失敗</span>
          )}
        </div>
      </div>

      {/* タスク一覧（最新3件） */}
      <div className="px-4 pb-2 max-h-32 overflow-y-auto">
        {queue.tasks.slice(-3).reverse().map(task => (
          <div key={task.slideId} className="flex items-center gap-2 py-1 text-xs">
            {task.status === 'completed' && <span className="text-green-500">✓</span>}
            {task.status === 'processing' && <span className="animate-pulse text-purple-500">●</span>}
            {task.status === 'pending' && <span className="text-gray-300">○</span>}
            {task.status === 'failed' && <span className="text-red-500">✗</span>}
            <span className={`truncate ${task.status === 'processing' ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>
              {task.slideTitle}
            </span>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
        {isRunning && (
          <button
            onClick={handlePause}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded"
          >
            一時停止
          </button>
        )}
        {isPaused && (
          <button
            onClick={handleResume}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded"
          >
            再開
          </button>
        )}
        {isCompleted && progress.failed > 0 && (
          <button
            onClick={handleRetry}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded"
          >
            失敗分を再試行
          </button>
        )}
        <button
          onClick={handleNavigateToDraft}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
        >
          ドラフトを見る
        </button>
      </div>
    </div>
  );
}
