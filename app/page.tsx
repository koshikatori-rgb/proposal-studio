export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          戦略コンサルタント<br />提案作成ツール
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          対話形式で提案書を作成し、PowerPoint形式でエクスポート
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ダッシュボードへ
          </a>
          <a
            href="/specs/requirements.md"
            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold border border-blue-600"
          >
            仕様書を見る
          </a>
        </div>
      </div>
    </div>
  );
}
