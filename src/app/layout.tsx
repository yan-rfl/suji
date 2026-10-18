import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import { LevelProvider } from '@/context/LevelContext';
import { Navbar } from '@/components/Navbar';

import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'Suji 速记',
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('suji_theme_mode');
                  var isDark = saved === 'dark' || (!saved || saved === 'system') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
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
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
        <AuthProvider>
          <ThemeProvider>
            <ProgressProvider>
              <LevelProvider>
                <Navbar />
                <main className="flex-1 pb-24 md:pb-12">{children}</main>
              </LevelProvider>
            </ProgressProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
