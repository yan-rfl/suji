'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface LevelTheme {
  primary: string;
  rgb: string;
  hover: string;
  lightBg: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const HSK_THEMES: Record<number, LevelTheme> = {
  1: {
    primary: '#f8b51e',
    rgb: '248, 181, 30',
    hover: '#dfa013',
    lightBg: 'rgba(248, 181, 30, 0.12)',
    badgeBg: 'rgba(248, 181, 30, 0.18)',
    badgeBorder: 'rgba(248, 181, 30, 0.4)',
    badgeText: '#fbbf24',
  },
  2: {
    primary: '#217f96',
    rgb: '33, 127, 150',
    hover: '#19677a',
    lightBg: 'rgba(33, 127, 150, 0.15)',
    badgeBg: 'rgba(33, 127, 150, 0.22)',
    badgeBorder: 'rgba(33, 127, 150, 0.45)',
    badgeText: '#67e8f9',
  },
  3: {
    primary: '#ed6e06',
    rgb: '237, 110, 6',
    hover: '#d15e02',
    lightBg: 'rgba(237, 110, 6, 0.15)',
    badgeBg: 'rgba(237, 110, 6, 0.22)',
    badgeBorder: 'rgba(237, 110, 6, 0.45)',
    badgeText: '#fb923c',
  },
  4: {
  primary: '#bb1019',
  rgb: '187, 16, 25',
  hover: '#a50e16',
  lightBg: 'rgba(187, 16, 25, 0.15)',
  badgeBg: 'rgba(187, 16, 25, 0.22)',
  badgeBorder: 'rgba(187, 16, 25, 0.45)',
  badgeText: '#f87171',
},
5: {
  primary: '#1a3f76',
  rgb: '26, 63, 118',
  hover: '#173768',
  lightBg: 'rgba(26, 63, 118, 0.15)',
  badgeBg: 'rgba(26, 63, 118, 0.22)',
  badgeBorder: 'rgba(26, 63, 118, 0.45)',
  badgeText: '#60a5fa',
},
};

interface LevelContextType {
  currentLevel: number;
  setCurrentLevel: (level: number) => void;
  theme: LevelTheme;
}

const LevelContext = createContext<LevelContextType | undefined>(undefined);

const LOCAL_LEVEL_KEY = 'suji_selected_hsk_level';

export function LevelProvider({ children }: { children: React.ReactNode }) {
  const [currentLevel, setCurrentLevelState] = useState<number>(1);

  // Load persisted level on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_LEVEL_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= 5) {
          setCurrentLevelState(parsed);
          applyThemeVariables(parsed);
        }
      } else {
        applyThemeVariables(1);
      }
    } catch (e) {
      console.warn('Failed to load saved HSK level:', e);
      applyThemeVariables(1);
    }
  }, []);

  const applyThemeVariables = (level: number) => {
    if (typeof document === 'undefined') return;
    const t = HSK_THEMES[level] || HSK_THEMES[1];
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', t.primary);
    root.style.setProperty('--theme-primary-rgb', t.rgb);
    root.style.setProperty('--theme-primary-hover', t.hover);
    root.style.setProperty('--theme-primary-light', t.lightBg);
  };

  const setCurrentLevel = (level: number) => {
    if (level < 1 || level > 5) return;
    setCurrentLevelState(level);
    applyThemeVariables(level);
    try {
      localStorage.setItem(LOCAL_LEVEL_KEY, level.toString());
    } catch (e) {
      console.warn('Failed to persist HSK level:', e);
    }
  };

  const theme = HSK_THEMES[currentLevel] || HSK_THEMES[1];

  return (
    <LevelContext.Provider value={{ currentLevel, setCurrentLevel, theme }}>
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  const context = useContext(LevelContext);
  if (!context) {
    throw new Error('useLevel must be used within a LevelProvider');
  }
  return context;
}
