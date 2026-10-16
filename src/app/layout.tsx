import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import { LevelProvider } from '@/context/LevelContext';
import { Navbar } from '@/components/Navbar';

import { ThemeColorSync } from '@/components/ThemeColorSync';

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
  colorScheme: 'light dark',
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var color = isDark ? '#09090b' : '#ffffff';
                  var meta = document.querySelector('meta[name="theme-color"]:not([media])');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', 'theme-color');
                    document.head.appendChild(meta);
                  }
                  meta.setAttribute('content', color);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <ThemeColorSync />
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
