import Link from 'next/link';

export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center py-6">
          <Link href="/" className="group">
            <h1 className="text-sm font-medium tracking-wider text-black transition-opacity hover:opacity-60">
              PROPOSAL STUDIO
            </h1>
          </Link>

          <nav className="flex items-center gap-10">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-black transition-colors tracking-wide"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
