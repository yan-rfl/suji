'use client';

import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Dynamically synchronizes device status bar / browser address bar color
 * to white (#ffffff) in light mode and dark (#09090b) in dark mode.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    try {
      const color = resolvedTheme === 'dark' ? '#09090b' : '#ffffff';

      let defaultMeta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!defaultMeta) {
        defaultMeta = document.createElement('meta');
        defaultMeta.setAttribute('name', 'theme-color');
        document.head.appendChild(defaultMeta);
      }
      defaultMeta.setAttribute('content', color);

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
  }, [resolvedTheme]);

  return null;
}
