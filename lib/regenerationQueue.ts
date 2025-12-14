/**
 * バックグラウンド再生成キュー管理
 * ページ遷移しても処理が継続し、中断からの再開も可能
 */

export interface RegenerationTask {
  slideId: string;
  slideTitle: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface RegenerationQueue {
  proposalId: string;
  tasks: RegenerationTask[];
  startedAt: number;
  completedAt?: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
}

const QUEUE_STORAGE_KEY = 'regeneration_queue';

// キューを取得
export function getRegenerationQueue(proposalId: string): RegenerationQueue | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(`${QUEUE_STORAGE_KEY}_${proposalId}`);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// キューを保存
export function saveRegenerationQueue(queue: RegenerationQueue): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${QUEUE_STORAGE_KEY}_${queue.proposalId}`, JSON.stringify(queue));
}

// キューを削除
export function clearRegenerationQueue(proposalId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${QUEUE_STORAGE_KEY}_${proposalId}`);
}

// 新しいキューを作成
export function createRegenerationQueue(proposalId: string, slides: { id: string; title: string }[]): RegenerationQueue {
  const queue: RegenerationQueue = {
    proposalId,
    tasks: slides.map(slide => ({
      slideId: slide.id,
      slideTitle: slide.title,
      status: 'pending',
    })),
    startedAt: Date.now(),
    status: 'running',
  };

  saveRegenerationQueue(queue);
  return queue;
}

// タスクのステータスを更新
export function updateTaskStatus(
  proposalId: string,
  slideId: string,
  status: RegenerationTask['status'],
  error?: string
): RegenerationQueue | null {
  const queue = getRegenerationQueue(proposalId);
  if (!queue) return null;

  const task = queue.tasks.find(t => t.slideId === slideId);
  if (task) {
    task.status = status;
    if (error) task.error = error;
  }

  // 全タスクが完了したかチェック
  const allDone = queue.tasks.every(t => t.status === 'completed' || t.status === 'failed');
  if (allDone) {
    queue.status = 'completed';
    queue.completedAt = Date.now();
  }

  saveRegenerationQueue(queue);
  return queue;
}

// キューのステータスを更新
export function updateQueueStatus(proposalId: string, status: RegenerationQueue['status']): RegenerationQueue | null {
  const queue = getRegenerationQueue(proposalId);
  if (!queue) return null;

  queue.status = status;
  if (status === 'completed') {
    queue.completedAt = Date.now();
  }

  saveRegenerationQueue(queue);
  return queue;
}

// 次に処理すべきタスクを取得
export function getNextPendingTask(proposalId: string): RegenerationTask | null {
  const queue = getRegenerationQueue(proposalId);
  if (!queue || queue.status !== 'running') return null;

  return queue.tasks.find(t => t.status === 'pending') || null;
}

// 進捗状況を取得
export function getProgress(proposalId: string): { completed: number; total: number; failed: number } {
  const queue = getRegenerationQueue(proposalId);
  if (!queue) return { completed: 0, total: 0, failed: 0 };

  const completed = queue.tasks.filter(t => t.status === 'completed').length;
  const failed = queue.tasks.filter(t => t.status === 'failed').length;

  return {
    completed,
    total: queue.tasks.length,
    failed,
  };
}

// 失敗したタスクを再試行可能な状態にリセット
export function retryFailedTasks(proposalId: string): RegenerationQueue | null {
  const queue = getRegenerationQueue(proposalId);
  if (!queue) return null;

  queue.tasks.forEach(task => {
    if (task.status === 'failed') {
      task.status = 'pending';
      delete task.error;
    }
  });

  queue.status = 'running';
  queue.completedAt = undefined;

  saveRegenerationQueue(queue);
  return queue;
}

// アクティブなキューがあるか確認
export function hasActiveQueue(proposalId: string): boolean {
  const queue = getRegenerationQueue(proposalId);
  return queue !== null && queue.status === 'running';
}
