import Link from 'next/link';

export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
              戦略コンサルタント提案作成ツール
            </h1>
            <h1 className="text-xl font-bold text-gray-900 sm:hidden">
              提案作成ツール
            </h1>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              ダッシュボード
            </Link>
            <Link
              href="/specs/requirements.md"
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm hidden md:block"
            >
              仕様書
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
