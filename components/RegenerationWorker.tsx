'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  getRegenerationQueue,
  getNextPendingTask,
  updateTaskStatus,
  updateQueueStatus,
  getProgress,
  type RegenerationQueue,
} from '@/lib/regenerationQueue';
import { getProposal, saveProposal } from '@/lib/storage';

interface RegenerationWorkerProps {
  proposalId: string;
  onProgressUpdate?: (progress: { completed: number; total: number; failed: number }) => void;
  onSlideUpdate?: (slideId: string, imageUrl: string) => void;
  onComplete?: () => void;
}

/**
 * バックグラウンドで再生成を実行するワーカーコンポーネント
 * ページ遷移しても処理が継続し、キューの状態をlocalStorageで永続化
 */
export function RegenerationWorker({
  proposalId,
  onProgressUpdate,
  onSlideUpdate,
  onComplete,
}: RegenerationWorkerProps) {
  const isProcessingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 単一タスクを処理
  const processTask = useCallback(async (task: { slideId: string; slideTitle: string }) => {
    const proposal = getProposal(proposalId);
    if (!proposal) {
      console.error('Proposal not found:', proposalId);
      return false;
    }

    const slide = proposal.slides.find(s => s.id === task.slideId);
    if (!slide) {
      console.error('Slide not found:', task.slideId);
      return false;
    }

    try {
      // Step 1: ビジュアル表現意図を再生成
      console.log(`🔄 ビジュアル表現意図を再生成中: ${task.slideTitle}`);
      const intentResponse = await fetch('/api/enrich-slide-with-visual-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide: {
            ...slide,
            visualIntent: undefined,
            visualHint: undefined,
            visualReason: undefined,
          },
        }),
      });

      if (!intentResponse.ok) {
        throw new Error('ビジュアル表現意図の再生成に失敗しました');
      }

      const { visualHint, visualIntent, visualReason } = await intentResponse.json();
      const slideWithNewIntent = {
        ...slide,
        visualHint,
        visualIntent,
        visualReason,
        imageUrl: undefined,
      };

      // Step 2: ワイヤーフレーム画像を再生成
      console.log(`🎨 ワイヤーフレーム画像を再生成中: ${task.slideTitle}`);
      const imageResponse = await fetch('/api/generate-slide-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: slideWithNewIntent, colorScheme: proposal.settings?.colors }),
      });

      if (!imageResponse.ok) {
        throw new Error('画像の再生成に失敗しました');
      }

      const { imageUrl } = await imageResponse.json();

      // proposalを更新
      const currentProposal = getProposal(proposalId);
      if (currentProposal) {
        const updatedSlides = currentProposal.slides.map(s =>
          s.id === task.slideId ? { ...slideWithNewIntent, imageUrl } : s
        );
        const updatedProposal = {
          ...currentProposal,
          slides: updatedSlides,
          updatedAt: Date.now(),
        };
        saveProposal(updatedProposal);
      }

      // コールバックで通知
      if (onSlideUpdate) {
        onSlideUpdate(task.slideId, imageUrl);
      }

      console.log(`✅ 再生成完了: ${task.slideTitle}`);
      return true;
    } catch (error) {
      console.error(`❌ 再生成エラー [${task.slideTitle}]:`, error);
      return false;
    }
  }, [proposalId, onSlideUpdate]);

  // キューを処理
  const processQueue = useCallback(async () => {
    // 既に処理中なら何もしない
    if (isProcessingRef.current) return;

    const queue = getRegenerationQueue(proposalId);
    if (!queue || queue.status !== 'running') return;

    const nextTask = getNextPendingTask(proposalId);
    if (!nextTask) {
      // 全タスク完了
      updateQueueStatus(proposalId, 'completed');
      if (onComplete) {
        onComplete();
      }
      return;
    }

    isProcessingRef.current = true;

    // タスクをprocessingに更新
    updateTaskStatus(proposalId, nextTask.slideId, 'processing');

    // タスクを実行
    const success = await processTask(nextTask);

    // 結果を更新
    updateTaskStatus(
      proposalId,
      nextTask.slideId,
      success ? 'completed' : 'failed',
      success ? undefined : '処理中にエラーが発生しました'
    );

    // 進捗を通知
    if (onProgressUpdate) {
      const progress = getProgress(proposalId);
      onProgressUpdate(progress);
    }

    isProcessingRef.current = false;

    // 次のタスクがあれば続行
    const updatedQueue = getRegenerationQueue(proposalId);
    if (updatedQueue?.status === 'running') {
      // 少し待ってから次のタスクを処理（API負荷軽減）
      setTimeout(() => processQueue(), 1000);
    }
  }, [proposalId, processTask, onProgressUpdate, onComplete]);

  // 定期的にキューをチェック
  useEffect(() => {
    // 初回チェック
    const checkAndProcess = () => {
      const queue = getRegenerationQueue(proposalId);
      if (queue?.status === 'running' && !isProcessingRef.current) {
        processQueue();
      }

      // 進捗を通知
      if (onProgressUpdate && queue) {
        const progress = getProgress(proposalId);
        onProgressUpdate(progress);
      }
    };

    // 即座に実行
    checkAndProcess();

    // 定期的にチェック（5秒ごと）
    intervalRef.current = setInterval(checkAndProcess, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [proposalId, processQueue, onProgressUpdate]);

  // UIは表示しない（純粋なワーカー）
  return null;
}
