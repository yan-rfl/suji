'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  BrainCircuit, 
  BookOpen, 
  Keyboard, 
  PenTool, 
  FileText, 
  Headphones,
  Award,
  Zap,
  Shuffle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HSKWord, QuizMode, SRSGrade } from '@/types/hsk';
import { getAllHSKWords, getHSKWords } from '@/lib/hskData';
import { useProgress } from '@/context/ProgressContext';
import { useLevel } from '@/context/LevelContext';
import { QuizCard } from '@/components/QuizCard';

const ALL_MODES: QuizMode[] = [
  'hanzi-to-meaning',
  'meaning-to-hanzi-desktop',
  'meaning-to-hanzi-mobile',
  'sentence-context',
  'audio-quiz',
];

interface SessionCard {
  word: HSKWord;
  mode: QuizMode;
}

function QuizEngineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { recordReview, isWordDue, stats } = useProgress();
  const { currentLevel, setCurrentLevel, theme } = useLevel();

  const levelParam = searchParams.get('level');
  const modesParam = searchParams.get('modes');
  const modeParam = searchParams.get('mode') as QuizMode | null;
  const countParam = searchParams.get('count');
  const srsOnlyParam = searchParams.get('srsOnly') === 'true';

  // Sync levelParam to global currentLevel if explicitly passed in URL
  useEffect(() => {
    if (levelParam) {
      const parsed = parseInt(levelParam, 10);
      if (parsed >= 1 && parsed <= 6 && parsed !== currentLevel) {
        setCurrentLevel(parsed);
      }
    }
  }, [levelParam, currentLevel, setCurrentLevel]);

  // Parse multiple active modes
  const parsedModes = useMemo<QuizMode[]>(() => {
    if (modesParam) {
      const list = modesParam.split(',').filter((m) => ALL_MODES.includes(m as QuizMode)) as QuizMode[];
      if (list.length > 0) return list;
    }
    if (modeParam && ALL_MODES.includes(modeParam)) {
      return [modeParam];
    }
    return ['hanzi-to-meaning', 'sentence-context', 'audio-quiz'];
  }, [modesParam, modeParam]);

  const [activeModes, setActiveModes] = useState<QuizMode[]>(parsedModes);
  const activeModesRef = useRef<QuizMode[]>(parsedModes);
  activeModesRef.current = activeModes;

  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [allLevelWords, setAllLevelWords] = useState<HSKWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<{ word: HSKWord; mode: QuizMode; grade: SRSGrade }[]>([]);

  // Update active modes if URL search params change
  useEffect(() => {
    setActiveModes(parsedModes);
    activeModesRef.current = parsedModes;
  }, [parsedModes]);

  // Load vocabulary for session - intentionally DO NOT depend on activeModes to prevent resetting on toggle!
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function prepareSession() {
      try {
        let pool: HSKWord[] = [];
        if (srsOnlyParam) {
          pool = await getAllHSKWords();
          const dueList = pool.filter((w) => isWordDue(w.id));
          if (dueList.length > 0) {
            pool = dueList;
          }
        } else {
          // Use current global HSK level
          pool = await getHSKWords(currentLevel);
        }

        if (!isMounted) return;

        setAllLevelWords(pool);

        // Shuffle pool
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const targetCount = countParam ? parseInt(countParam, 10) : 15;
        const selected = shuffled.slice(0, targetCount);

        const currentActivePool: QuizMode[] = activeModesRef.current.length > 0
          ? activeModesRef.current
          : ['hanzi-to-meaning' as QuizMode];

        // Assign randomized mode from current active pool to each card
        const cards: SessionCard[] = selected.map((word) => {
          const randomMode = currentActivePool[Math.floor(Math.random() * currentActivePool.length)];
          return { word, mode: randomMode };
        });


        setSessionCards(cards);
        setCurrentIndex(0);
        setIsSessionComplete(false);
        setSessionResults([]);
        setIsLoading(false);
      } catch (err) {
        console.error('Error preparing quiz:', err);
        setIsLoading(false);
      }
    }

    prepareSession();

    return () => {
      isMounted = false;
    };
  }, [currentLevel, countParam, srsOnlyParam]);

  // Handle grading of current card
  const handleGrade = async (grade: SRSGrade) => {
    const currentCard = sessionCards[currentIndex];
    if (!currentCard) return;

    // Record review in SRS engine
    await recordReview(currentCard.word.id, grade);

    // Track results with mode for final recap
    setSessionResults((prev) => [
      ...prev,
      { word: currentCard.word, mode: currentCard.mode, grade },
    ]);

    // Move to next card or finish session
    if (currentIndex + 1 < sessionCards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSessionComplete(true);
      // Fire celebration confetti!
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
        colors: [theme.primary, '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      });
    }
  };

  // Toggle a mode in or out of the active randomization pool without resetting the session
  const toggleActiveMode = (mode: QuizMode) => {
    let newModes: QuizMode[];
    const isDisabling = activeModes.includes(mode);

    if (isDisabling) {
      if (activeModes.length <= 1) {
        return; // Prevent deselecting all modes - keep at least one active
      }
      newModes = activeModes.filter((m) => m !== mode);
    } else {
      newModes = [...activeModes, mode];
    }

    setActiveModes(newModes);
    activeModesRef.current = newModes;

    setSessionCards((prev) => {
      const next = [...prev];
      const currentCard = next[currentIndex];

      // ONLY if the disabled mode is the mode of the CURRENT question,
      // change the current question's mode to one of the remaining active modes!
      if (currentCard && isDisabling && currentCard.mode === mode) {
        const replacementMode = newModes[Math.floor(Math.random() * newModes.length)];
        next[currentIndex] = { ...currentCard, mode: replacementMode };
      }
      // If the current question's mode was NOT the one disabled, next[currentIndex] is untouched!

      // For future/upcoming cards in the session (i > currentIndex),
      // update any card that was set to the disabled mode
      for (let i = currentIndex + 1; i < next.length; i++) {
        if (!newModes.includes(next[i].mode)) {
          const replacementMode = newModes[Math.floor(Math.random() * newModes.length)];
          next[i] = { ...next[i], mode: replacementMode };
        }
      }

      return next;
    });
  };

  const restartSession = () => {
    const shuffled = [...allLevelWords].sort(() => 0.5 - Math.random());
    const targetCount = countParam ? parseInt(countParam, 10) : 15;
    const cards: SessionCard[] = shuffled.slice(0, targetCount).map((word) => {
      const randomMode = activeModes[Math.floor(Math.random() * activeModes.length)];
      return { word, mode: randomMode };
    });
    setSessionCards(cards);
    setCurrentIndex(0);
    setIsSessionComplete(false);
    setSessionResults([]);
  };

  const modeDescriptions: Record<QuizMode, { name: string; icon: any }> = {
    'hanzi-to-meaning': { name: 'Hanzi → Meaning', icon: BookOpen },
    'meaning-to-hanzi-desktop': { name: 'IME Typing', icon: Keyboard },
    'meaning-to-hanzi-mobile': { name: 'Stroke Order', icon: PenTool },
    'sentence-context': { name: 'Sentence Cloze', icon: FileText },
    'audio-quiz': { name: 'Mandarin Audio', icon: Headphones },
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div 
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" 
          style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}
        />
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Preparing HSK {currentLevel} Session...</h2>
      </div>
    );
  }

  // Session Complete View
  if (isSessionComplete) {
    const againCount = sessionResults.filter((r) => r.grade < 3).length;
    const goodEasyCount = sessionResults.filter((r) => r.grade >= 3).length;

    // Count breakdown per mode
    const modeCounts = sessionResults.reduce((acc, curr) => {
      acc[curr.mode] = (acc[curr.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-xl dark:shadow-2xl">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{
              backgroundColor: theme.badgeBg,
              color: theme.primary,
              border: `1px solid ${theme.badgeBorder}`
            }}
          >
            <Award size={36} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              Session Completed! 恭喜！
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your HSK {currentLevel} spaced repetition memory intervals have been updated in your profile.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 py-4 border-y border-zinc-200 dark:border-zinc-800">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {sessionResults.length}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Cards Studied</div>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {goodEasyCount}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Recalled</div>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {againCount}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Need Practice</div>
            </div>
          </div>

          {/* Practice Mode Breakdown */}
          <div className="space-y-2 text-left bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/60">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Shuffle size={13} style={{ color: theme.primary }} />
              <span>Mixed Modes Completed:</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(modeCounts).map(([mode, count]) => {
                const info = modeDescriptions[mode as QuizMode];
                const Icon = info?.icon || BookOpen;
                return (
                  <div
                    key={mode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-medium shadow-sm"
                  >
                    <Icon size={14} style={{ color: theme.primary }} />
                    <span>{info?.name}:</span>
                    <strong className="text-zinc-900 dark:text-white">{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={restartSession}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 4px 16px rgba(${theme.rgb}, 0.35)`
              }}
            >
              <RotateCcw size={16} />
              <span>Study More Words</span>
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-sm transition-colors border border-zinc-300 dark:border-zinc-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = sessionCards[currentIndex];

  if (!currentCard) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">No review cards available for HSK {currentLevel}.</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm"
          style={{ backgroundColor: theme.primary }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentModeInfo = modeDescriptions[currentCard.mode];
  const CurrentModeIcon = currentModeInfo.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Session Navigation & Progress Bar */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Back navigation & Counter */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span 
              className="px-2 py-0.5 rounded text-[11px] font-bold"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                border: `1px solid ${theme.badgeBorder}`
              }}
            >
              HSK {currentCard.word.level}
            </span>
            <div className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">
              {currentIndex + 1} / {sessionCards.length}
            </div>
          </div>
        </div>

        {/* Row 2: Active Mode Pill & Mode Selector (matching h-10 height, dedicated row to avoid text cramping) */}
        <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3">
          {/* Active Mode Pill with Shuffle indicator */}
          <div className="h-10 px-3 sm:px-3.5 flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 shadow-sm whitespace-nowrap shrink-0">
            {activeModes.length > 1 && (
              <span title={`Randomizing across ${activeModes.length} active modes`}>
                <Shuffle size={13} style={{ color: theme.primary }} className="animate-pulse shrink-0" />
              </span>
            )}
            <CurrentModeIcon size={15} style={{ color: theme.primary }} className="shrink-0" />
            <span className="font-semibold">{currentModeInfo.name}</span>
          </div>

          {/* 5 Mode Toggle Buttons with matching h-10 container height */}
          <div className="h-10 px-1 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner shrink-0">
            {ALL_MODES.map((mode) => {
              const info = modeDescriptions[mode];
              const Icon = info.icon;
              const isCurrent = currentCard.mode === mode;
              const isInPool = activeModes.includes(mode);

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleActiveMode(mode)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-all duration-150 relative cursor-pointer ${
                    isCurrent
                      ? 'text-white shadow-md ring-2 ring-white/40'
                      : isInPool
                      ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 shadow-sm'
                      : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 opacity-40 hover:opacity-75'
                  }`}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                          boxShadow: `0 2px 10px rgba(${theme.rgb}, 0.35)`
                        }
                      : undefined
                  }
                  title={
                    isInPool
                      ? activeModes.length === 1
                        ? `${info.name} (Active - only mode remaining)`
                        : `Active: Click to disable ${info.name} from shuffle`
                      : `Inactive: Click to enable ${info.name} in shuffle`
                  }
                >
                  <Icon size={14} />
                  {isInPool && !isCurrent && (
                    <span 
                      className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full shadow-sm"
                      style={{ backgroundColor: theme.primary }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar styled with current level color */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / sessionCards.length) * 100}%`,
              backgroundColor: theme.primary,
            }}
          />
        </div>
      </div>

      {/* Main Flashcard Quiz Card */}
      <QuizCard
        key={`${currentCard.word.id}-${currentCard.mode}`}
        word={currentCard.word}
        quizMode={currentCard.mode}
        allWords={allLevelWords}
        onGrade={handleGrade}
      />
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-24 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <QuizEngineContent />
    </Suspense>
  );
}
