'use client';

import { useState, useCallback } from 'react';
import type { SlideElement, Outline } from '@/types';
import { generateFullExportText, generateMarkdownExport, generateSingleSlideExport } from '@/lib/slideExporter';

type ExportFormat = 'full' | 'markdown' | 'single';

type SlideExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideElement[];
  outline?: Outline | null;
  proposalTitle?: string;
  selectedSlideId?: string;
};

export const SlideExportModal: React.FC<SlideExportModalProps> = ({
  isOpen,
  onClose,
  slides,
  outline,
  proposalTitle,
  selectedSlideId,
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('full');
  const [copied, setCopied] = useState(false);

  const selectedSlide = selectedSlideId
    ? slides.find(s => s.id === selectedSlideId)
    : null;
  const selectedSlideIndex = selectedSlideId
    ? slides.findIndex(s => s.id === selectedSlideId)
    : -1;

  const generateExportText = useCallback(() => {
    switch (exportFormat) {
      case 'full':
        return generateFullExportText(slides, outline, proposalTitle);
      case 'markdown':
        return generateMarkdownExport(slides, outline, proposalTitle);
      case 'single':
        if (selectedSlide && selectedSlideIndex >= 0) {
          return generateSingleSlideExport(selectedSlide, selectedSlideIndex);
        }
        return '// スライドを選択してください';
      default:
        return '';
    }
  }, [exportFormat, slides, outline, proposalTitle, selectedSlide, selectedSlideIndex]);

  const exportText = generateExportText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('クリップボードへのコピーに失敗:', err);
    }
  };

  const handleDownload = () => {
    const extension = exportFormat === 'markdown' ? 'md' : 'txt';
    const filename = `${proposalTitle || 'proposal'}_export.${extension}`;
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              他AIへエクスポート
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              NotebookLM, Gamma, Canva AI等にコピペして画像/スライド生成
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* フォーマット選択 */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">出力形式:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('full')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  exportFormat === 'full'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                全スライド（詳細）
              </button>
              <button
                onClick={() => setExportFormat('markdown')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  exportFormat === 'markdown'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Markdown（Gamma向け）
              </button>
              <button
                onClick={() => setExportFormat('single')}
                disabled={!selectedSlide}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  exportFormat === 'single'
                    ? 'bg-blue-600 text-white'
                    : selectedSlide
                    ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                選択スライドのみ
              </button>
            </div>
            {exportFormat === 'single' && selectedSlide && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {selectedSlide.title || `スライド ${selectedSlideIndex + 1}`}
              </span>
            )}
          </div>
        </div>

        {/* プレビュー */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">プレビュー</h3>
              <span className="text-xs text-gray-400">
                {exportText.length.toLocaleString()} 文字
              </span>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 rounded-lg p-4">
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
                {exportText}
              </pre>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0 bg-gray-50">
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">推奨利用先:</p>
            <ul className="space-y-0.5">
              <li>- <strong>Gamma.app</strong>: Markdown形式をペーストしてスライド自動生成</li>
              <li>- <strong>NotebookLM</strong>: 全文を資料として読み込み、Q&Aに活用</li>
              <li>- <strong>Canva AI</strong>: 各スライドの指示でデザイン生成</li>
              <li>- <strong>ChatGPT/Claude</strong>: 画像生成指示をそのままプロンプトに</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              ダウンロード
            </button>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  コピー完了!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  クリップボードにコピー
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
