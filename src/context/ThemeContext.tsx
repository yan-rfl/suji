'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_THEME_KEY = 'suji_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState<boolean>(false);

  // Sync class on <html> and meta theme-color
  const applyTheme = (resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Synchronize default meta theme-color
    const color = resolved === 'dark' ? '#09090b' : '#ffffff';
    let defaultMeta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!defaultMeta) {
      defaultMeta = document.createElement('meta');
      defaultMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(defaultMeta);
    }
    defaultMeta.setAttribute('content', color);

    // Keep Apple status bar style aligned
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBar) {
      appleStatusBar.setAttribute('content', 'default');
    }
  };

  // Determine resolved theme based on mode
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(LOCAL_THEME_KEY) as ThemeMode | null;
      const initialMode: ThemeMode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
      setThemeModeState(initialMode);

      const resolved = initialMode === 'system' ? getSystemTheme() : initialMode;
      setResolvedTheme(resolved);
      applyTheme(resolved);
    } catch (e) {
      console.warn('Failed to load saved theme mode:', e);
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      applyTheme(resolved);
    }
  }, []);

  // Listen to OS system theme changes when in 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeMode === 'system') {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemChange);
      return () => (mediaQuery as any).removeListener(handleSystemChange);
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    const resolved = mode === 'system' ? getSystemTheme() : mode;
    setResolvedTheme(resolved);
    applyTheme(resolved);
    try {
      localStorage.setItem(LOCAL_THEME_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme mode:', e);
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
