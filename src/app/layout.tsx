import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import { LevelProvider } from '@/context/LevelContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Suji (速记) - Personal HSK 1–6 Learning App',
  description:
    'Master HSK 1–6 Mandarin vocabulary using spaced repetition (SM-2), device-adaptive quizzes, stroke-order drawing, and native audio.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Suji 速记',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <AuthProvider>
          <ProgressProvider>
            <LevelProvider>
              <Navbar />
              <main className="flex-1 pb-24 md:pb-12">{children}</main>
            </LevelProvider>
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
