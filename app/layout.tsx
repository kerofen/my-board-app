import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'シンプル掲示板',
  description: '初心者向けのシンプルな掲示板システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}