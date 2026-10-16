import { SRSItem, MasteryStatus } from '@/types/user';
import { SRSGrade } from '@/types/hsk';

export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

/**
 * Calculate the next review schedule based on the SM-2 algorithm.
 *
 * Grade values:
 * 0 - Blackout (complete failure)
 * 1 - Incorrect; remembered upon viewing answer
 * 2 - Incorrect; seemed easy upon viewing answer
 * 3 - Correct; recalled with significant difficulty
 * 4 - Correct; recalled after hesitation
 * 5 - Correct; instant and perfect recall
 */
export function calculateSM2(
  grade: SRSGrade,
  currentItem?: Partial<SRSItem>
): {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
  status: MasteryStatus;
} {
  const currentReps = currentItem?.repetitions ?? 0;
  const currentInterval = currentItem?.interval ?? 0;
  const currentEF = currentItem?.easeFactor ?? DEFAULT_EASE_FACTOR;

  let newReps = currentReps;
  let newInterval = currentInterval;
  let newEF = currentEF;

  // Calculate new Ease Factor
  // EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  newEF = currentEF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEF < MIN_EASE_FACTOR) {
    newEF = MIN_EASE_FACTOR;
  }
  // Round to 2 decimal places
  newEF = Math.round(newEF * 100) / 100;

  if (grade < 3) {
    // Failure: reset repetition count and schedule for 1 day (or immediate queue)
    newReps = 0;
    newInterval = 1;
  } else {
    // Success
    if (newReps === 0) {
      newInterval = 1;
    } else if (newReps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEF);
    }
    newReps += 1;
  }

  // Calculate next review timestamp (in days from now)
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  // Status mapping
  let status: MasteryStatus = 'learning';
  if (newReps >= 4 && newInterval >= 20) {
    status = 'mastered';
  } else if (newReps === 0 && grade < 3) {
    status = 'learning';
  }

  return {
    repetitions: newReps,
    interval: newInterval,
    easeFactor: newEF,
    nextReviewDate: nextDate.toISOString(),
    status,
  };
}

/**
 * Check if a word is due for review today.
 */
export function isDueForReview(item?: SRSItem): boolean {
  if (!item || !item.nextReviewDate) return true; // Unseen words can be queued
  const reviewTime = new Date(item.nextReviewDate).getTime();
  const now = new Date().getTime();
  return reviewTime <= now;
}

/**
 * Get display string for interval
 */
export function formatInterval(days: number): string {
  if (days <= 0) return 'Immediate';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  return `${months} mo`;
}
