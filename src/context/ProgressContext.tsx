'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SRSItem, UserStats, MasteryStatus } from '@/types/user';
import { SRSGrade } from '@/types/hsk';
import { calculateSM2, isDueForReview } from '@/lib/srs';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ProgressContextType {
  srsData: Record<string, SRSItem>;
  stats: UserStats;
  loading: boolean;
  recordReview: (wordId: string, grade: SRSGrade) => Promise<SRSItem>;
  getWordStatus: (wordId: string) => MasteryStatus;
  getWordSRS: (wordId: string) => SRSItem | undefined;
  isWordDue: (wordId: string) => boolean;
  getDueCountForWords: (wordIds: string[]) => number;
  resetProgress: () => Promise<void>;
}

const LOCAL_SRS_KEY = 'suji_srs_data';
const LOCAL_STATS_KEY = 'suji_user_stats';

const initialStats: UserStats = {
  totalWordsReviewed: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: '',
  dailyCounts: {},
  wordsMastered: 0,
  wordsLearning: 0,
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [srsData, setSrsData] = useState<Record<string, SRSItem>>({});
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial data from localStorage first (for speed and offline support)
  useEffect(() => {
    try {
      const savedSRS = localStorage.getItem(LOCAL_SRS_KEY);
      const savedStats = localStorage.getItem(LOCAL_STATS_KEY);
      if (savedSRS) setSrsData(JSON.parse(savedSRS));
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch (e) {
      console.error('Failed to load local progress:', e);
    }
  }, []);

  // Sync with Firestore if logged in with Firebase
  useEffect(() => {
    let isCancelled = false;

    async function syncFirestore() {
      if (!user || user.isAnonymous || !db) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid, 'progress', 'state');
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists() && !isCancelled) {
          const remoteData = docSnap.data();
          const remoteSRS = (remoteData.srsData || {}) as Record<string, SRSItem>;
          const remoteStats = (remoteData.stats || initialStats) as UserStats;

          // Merge local and remote
          setSrsData((prevLocal) => {
            const merged = { ...remoteSRS, ...prevLocal };
            localStorage.setItem(LOCAL_SRS_KEY, JSON.stringify(merged));
            return merged;
          });

          setStats((prevStats) => {
            const mergedStats: UserStats = {
              totalWordsReviewed: Math.max(prevStats.totalWordsReviewed, remoteStats.totalWordsReviewed || 0),
              currentStreak: Math.max(prevStats.currentStreak, remoteStats.currentStreak || 0),
              bestStreak: Math.max(prevStats.bestStreak, remoteStats.bestStreak || 0),
              lastActiveDate: prevStats.lastActiveDate || remoteStats.lastActiveDate || getTodayDateString(),
              dailyCounts: { ...(remoteStats.dailyCounts || {}), ...prevStats.dailyCounts },
              wordsMastered: Math.max(prevStats.wordsMastered, remoteStats.wordsMastered || 0),
              wordsLearning: Math.max(prevStats.wordsLearning, remoteStats.wordsLearning || 0),
            };
            localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(mergedStats));
            return mergedStats;
          });
        }
      } catch (err) {
        console.warn('Error reading from Firestore (offline or rule error):', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    syncFirestore();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Recalculate streak and counts whenever review happens
  const recordReview = useCallback(
    async (wordId: string, grade: SRSGrade): Promise<SRSItem> => {
      const today = getTodayDateString();
      const existingItem = srsData[wordId];
      const sm2Result = calculateSM2(grade, existingItem);

      const updatedItem: SRSItem = {
        wordId,
        repetitions: sm2Result.repetitions,
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewedDate: new Date().toISOString(),
        status: sm2Result.status,
        history: [
          ...(existingItem?.history || []).slice(-15),
          {
            date: new Date().toISOString(),
            grade,
            interval: sm2Result.interval,
          },
        ],
      };

      const newSrsData = {
        ...srsData,
        [wordId]: updatedItem,
      };

      // Calculate streak updates
      let newStreak = stats.currentStreak;
      if (!stats.lastActiveDate) {
        newStreak = 1;
      } else if (stats.lastActiveDate !== today) {
        const lastDate = new Date(stats.lastActiveDate);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      }

      // Counts for mastered & learning
      let masteredCount = 0;
      let learningCount = 0;
      Object.values(newSrsData).forEach((item) => {
        if (item.status === 'mastered') masteredCount++;
        else if (item.status === 'learning') learningCount++;
      });

      const todayCount = (stats.dailyCounts[today] || 0) + 1;

      const newStats: UserStats = {
        totalWordsReviewed: stats.totalWordsReviewed + 1,
        currentStreak: newStreak,
        bestStreak: Math.max(stats.bestStreak, newStreak),
        lastActiveDate: today,
        dailyCounts: {
          ...stats.dailyCounts,
          [today]: todayCount,
        },
        wordsMastered: masteredCount,
        wordsLearning: learningCount,
      };

      // Update React state
      setSrsData(newSrsData);
      setStats(newStats);

      // Persist to LocalStorage
      try {
        localStorage.setItem(LOCAL_SRS_KEY, JSON.stringify(newSrsData));
        localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(newStats));
      } catch (e) {
        console.error('Error caching progress locally:', e);
      }

      // Sync with Firestore if logged in
      if (user && !user.isAnonymous && db) {
        try {
          const userDocRef = doc(db, 'users', user.uid, 'progress', 'state');
          await setDoc(
            userDocRef,
            {
              srsData: newSrsData,
              stats: newStats,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Error syncing to Firestore:', e);
        }
      }

      return updatedItem;
    },
    [srsData, stats, user]
  );

  const getWordStatus = useCallback(
    (wordId: string): MasteryStatus => {
      const item = srsData[wordId];
      if (!item) return 'new';
      return item.status;
    },
    [srsData]
  );

  const getWordSRS = useCallback(
    (wordId: string): SRSItem | undefined => {
      return srsData[wordId];
    },
    [srsData]
  );

  const isWordDue = useCallback(
    (wordId: string): boolean => {
      const item = srsData[wordId];
      if (!item) return true; // Unlearned words are due
      return isDueForReview(item);
    },
    [srsData]
  );

  const getDueCountForWords = useCallback(
    (wordIds: string[]): number => {
      return wordIds.filter((id) => {
        const item = srsData[id];
        return !item || isDueForReview(item);
      }).length;
    },
    [srsData]
  );

  const resetProgress = useCallback(async () => {
    setSrsData({});
    setStats(initialStats);
    localStorage.removeItem(LOCAL_SRS_KEY);
    localStorage.removeItem(LOCAL_STATS_KEY);

    if (user && !user.isAnonymous && db) {
      try {
        const userDocRef = doc(db, 'users', user.uid, 'progress', 'state');
        await setDoc(userDocRef, {
          srsData: {},
          stats: initialStats,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Error clearing Firestore progress:', e);
      }
    }
  }, [user]);

  return (
    <ProgressContext.Provider
      value={{
        srsData,
        stats,
        loading,
        recordReview,
        getWordStatus,
        getWordSRS,
        isWordDue,
        getDueCountForWords,
        resetProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
