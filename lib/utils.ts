import { v4 as uuidv4 } from 'uuid';

/**
 * ユニークIDを生成
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * タイムスタンプを日本語形式の日付にフォーマット
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * タイムスタンプを日時形式にフォーマット
 */
export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * クラス名を結合（条件付きクラス名のヘルパー）
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * 文字列を切り詰めて省略記号を追加
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * デバウンス関数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 配列をシャッフル
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
