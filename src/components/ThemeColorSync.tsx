'use client';

import { useEffect } from 'react';

/**
 * Dynamically synchronizes device status bar / browser address bar color
 * to white (#ffffff) in light mode and dark (#09090b) in dark mode.
 * Reacts instantly when the user toggles light/dark mode in system settings.
 */
export function ThemeColorSync() {
  useEffect(() => {
    const updateThemeColor = () => {
      try {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const color = isDark ? '#09090b' : '#ffffff';

        // 1. Update or create the default meta theme-color (without media attribute)
        // Android Chrome, Samsung Internet, and WebAPKs rely on this tag.
        let defaultMeta = document.querySelector('meta[name="theme-color"]:not([media])');
        if (!defaultMeta) {
          defaultMeta = document.createElement('meta');
          defaultMeta.setAttribute('name', 'theme-color');
          document.head.appendChild(defaultMeta);
        }
        defaultMeta.setAttribute('content', color);

        // 2. Also ensure Apple status bar style remains 'default'
        // which adapts icons (dark text on white in light mode, light text on dark in dark mode)
        let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!appleStatusBar) {
          appleStatusBar = document.createElement('meta');
          appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
          document.head.appendChild(appleStatusBar);
        }
        appleStatusBar.setAttribute('content', 'default');
      } catch (err) {
        console.warn('Theme color sync error:', err);
      }
    };

    // Execute immediately on mount
    updateThemeColor();

    // Listen for OS light/dark mode changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => updateThemeColor();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handler);
      return () => (mediaQuery as any).removeListener(handler);
    }
  }, []);

  return null;
}
