import { MasteryStatus } from './hsk';
export type { MasteryStatus };

export interface SRSItem {
  wordId: string;
  repetitions: number;
  interval: number; // in days
  easeFactor: number; // default: 2.5
  nextReviewDate: string; // ISO 8601 string
  lastReviewedDate?: string; // ISO 8601 string
  status: MasteryStatus;
  history?: {
    date: string;
    grade: number;
    interval: number;
  }[];
}

export interface UserStats {
  totalWordsReviewed: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyCounts: Record<string, number>; // "2026-10-16": 25
  wordsMastered: number;
  wordsLearning: number;
}

export interface UserProgressState {
  srsData: Record<string, SRSItem>; // wordId -> SRSItem
  stats: UserStats;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}
