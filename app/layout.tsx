import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "戦略コンサルタント提案作成ツール",
  description: "対話形式で提案書を作成し、PowerPoint形式でエクスポートできるツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
