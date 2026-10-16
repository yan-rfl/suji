'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Check } from 'lucide-react';
import { useLevel } from '@/context/LevelContext';

export const PWAInstaller: React.FC = () => {
  const { theme } = useLevel();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showOtherModal, setShowOtherModal] = useState(false);

  useEffect(() => {
    // Check if already installed / running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };
    checkStandalone();

    // Check if running on iOS (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Register service worker if supported and trigger immediate update check
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update().catch(() => {});
          })
          .catch((err) => {
            console.warn('SW registration failed:', err);
          });
      });
    }

    // Capture Chrome/Android PWA install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    // If native prompt is available (Android / Chromium)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
      return;
    }

    // If on iOS (Safari doesn't support beforeinstallprompt)
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Otherwise show general mobile install instructions
    setShowOtherModal(true);
  };

  // If already installed and running as standalone app, hide the button
  if (isStandalone) return null;

  return (
    <>
      {/* Install Button - Visible on both mobile and desktop */}
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
        style={{
          backgroundColor: theme.badgeBg,
          color: theme.badgeText,
          border: `1px solid ${theme.badgeBorder}`,
        }}
        title="Download and install Suji to your phone or desktop"
        aria-label="Install Suji App"
      >
        <Download size={14} className="shrink-0" />
        <span className="hidden xs:inline sm:inline">Install</span>
        <span className="inline xs:hidden sm:hidden">App</span>
      </button>

      {/* iOS Safari Install Guide Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: theme.lightBg, color: theme.primary }}
              >
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Install Suji on iOS</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Add to your iPhone Home Screen</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80">
                <span 
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: theme.primary }}
                >
                  1
                </span>
                <p className="leading-relaxed">
                  In <strong className="text-zinc-900 dark:text-zinc-100">Safari</strong>, tap the <strong className="text-zinc-900 dark:text-zinc-100">Share</strong> button at the bottom of your screen <span className="inline-flex items-center p-1 bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-300 ml-1"><Share size={12} /></span>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80">
                <span 
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: theme.primary }}
                >
                  2
                </span>
                <p className="leading-relaxed">
                  Scroll down the menu and tap <strong className="text-zinc-900 dark:text-zinc-100">Add to Home Screen</strong> <span className="inline-flex items-center p-1 bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-300 ml-1"><PlusSquare size={12} /></span>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80">
                <span 
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: theme.primary }}
                >
                  3
                </span>
                <p className="leading-relaxed">
                  Tap <strong className="text-zinc-900 dark:text-zinc-100">Add</strong> in the top-right corner. Suji will appear right on your home screen!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-xl text-white font-bold text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
              style={{ backgroundColor: theme.primary }}
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Other Browsers Install Guide Modal */}
      {showOtherModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowOtherModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowOtherModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: theme.lightBg, color: theme.primary }}
              >
                <Download size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Install Suji</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Install as a standalone PWA</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
              <p className="leading-relaxed">
                To install Suji on your device:
              </p>
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 space-y-2">
                <p className="leading-relaxed">
                  1. Tap the browser menu (<strong className="text-zinc-900 dark:text-zinc-100">⋮</strong> or <strong className="text-zinc-900 dark:text-zinc-100">⋯</strong>) in the corner of your browser.
                </p>
                <p className="leading-relaxed">
                  2. Select <strong className="text-zinc-900 dark:text-zinc-100">&quot;Install app&quot;</strong> or <strong className="text-zinc-900 dark:text-zinc-100">&quot;Add to Home screen&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOtherModal(false)}
              className="w-full py-3 rounded-xl text-white font-bold text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
              style={{ backgroundColor: theme.primary }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
