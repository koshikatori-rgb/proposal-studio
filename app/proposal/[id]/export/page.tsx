'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProposal } from '@/hooks/useProposal';
import { SlidePreview } from '@/components/slides/SlidePreview';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StepIndicator } from '@/components/common/StepIndicator';
import { generatePowerPoint } from '@/lib/pptxGenerator';

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { proposal, loading } = useProposal(id);
  const [exporting, setExporting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            提案書が見つかりません
          </h1>
          <p className="text-gray-600">
            指定された提案書は存在しないか、削除されました。
          </p>
        </Card>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      setExporting(true);
      await generatePowerPoint(proposal);
      alert('PowerPointファイルのダウンロードが完了しました！');
    } catch (error) {
      console.error('Export error:', error);
      alert('エクスポートに失敗しました。もう一度お試しください。');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* ヘッダー */}
        <div className="mb-16">
          <h1 className="text-2xl font-medium text-black tracking-wide mb-3">{proposal.title}</h1>
          <p className="text-sm text-gray-500 tracking-wide">
            {proposal.clientName}
          </p>
        </div>

        {/* ステップインジケーター */}
        <StepIndicator proposalId={id} currentStep={5} />

        {/* 説明カード */}
        <Card className="mb-12">
          <h2 className="text-base font-medium text-black mb-4 tracking-wide">
            提案書のエクスポート
          </h2>
          <p className="text-sm text-gray-500 mb-6 tracking-wide">
            作成したスライドをPowerPoint形式でダウンロードできます。
          </p>
          <div className="bg-gray-50 border border-gray-200 p-6">
            <h3 className="text-xs font-medium text-black mb-3 tracking-wider uppercase">生成されるスライド</h3>
            <ul className="text-xs text-gray-600 space-y-2 tracking-wide">
              <li>• 表紙スライド（タイトル、クライアント名、日付）</li>
              <li>• 選択した {proposal.slides.length} 枚のスライド</li>
              <li>• カスタマイズされたカラーテーマ</li>
            </ul>
          </div>
        </Card>

        {/* スライドプレビュー */}
        {proposal.slides.length > 0 ? (
          <div className="mb-16">
            <h2 className="text-base font-medium text-black mb-8 tracking-wide">
              スライドプレビュー ({proposal.slides.length}枚)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
              {proposal.slides
                .sort((a, b) => a.order - b.order)
                .map((slide) => (
                  <SlidePreview key={slide.id} slide={slide} />
                ))}
            </div>
          </div>
        ) : (
          <Card className="mb-16 text-center py-24">
            <div className="text-gray-300 text-6xl mb-6">📄</div>
            <h3 className="text-base font-medium text-black mb-3 tracking-wide">
              スライドがありません
            </h3>
            <p className="text-sm text-gray-500 mb-8 tracking-wide">
              言語化確認画面でスライド内容を追加してください
            </p>
            <Button
              onClick={() => router.push(`/proposal/${id}/review`)}
              variant="outline"
            >
              言語化確認に戻る
            </Button>
          </Card>
        )}

        {/* アクションボタン */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => router.push(`/proposal/${id}/draft`)}
            variant="outline"
          >
            ← ドラフト確認に戻る
          </Button>

          <div className="flex gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
            >
              ダッシュボードへ
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || proposal.slides.length === 0}
            >
              {exporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  エクスポート中...
                </>
              ) : (
                '📥 PowerPointをダウンロード'
              )}
            </Button>
          </div>
        </div>

        {/* 注意事項 */}
        <Card className="mt-16 bg-gray-50 border-gray-200">
          <h3 className="text-xs font-medium text-black mb-4 tracking-wider uppercase">ヒント</h3>
          <ul className="text-xs text-gray-600 space-y-2 tracking-wide leading-relaxed">
            <li>• ダウンロードしたPowerPointファイルは、自由に編集できます</li>
            <li>• スライドの順序を変更したい場合は、スライド選択画面で再度選択してください</li>
            <li>• カラーテーマは提案書の設定から変更できます</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
