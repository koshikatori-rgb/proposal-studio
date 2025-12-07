export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-6 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-medium text-black mb-6 tracking-wide leading-tight">
          PROPOSAL STUDIO
        </h1>
        <p className="text-sm text-gray-500 mb-16 tracking-wide leading-relaxed">
          対話形式で提案書を作成し、PowerPoint形式でエクスポート
        </p>
        <div className="flex gap-6 justify-center">
          <a
            href="/dashboard"
            className="px-8 py-4 bg-black text-white border border-black hover:bg-gray-800 transition-all text-sm font-medium tracking-wide"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
