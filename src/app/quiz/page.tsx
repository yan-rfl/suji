'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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

  const levelParam = searchParams.get('level');
  const modesParam = searchParams.get('modes');
  const modeParam = searchParams.get('mode') as QuizMode | null;
  const countParam = searchParams.get('count');
  const srsOnlyParam = searchParams.get('srsOnly') === 'true';

  const [currentLevel, setCurrentLevel] = useState<number>(levelParam ? parseInt(levelParam, 10) : 1);
  
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
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [allLevelWords, setAllLevelWords] = useState<HSKWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<{ word: HSKWord; mode: QuizMode; grade: SRSGrade }[]>([]);

  // Update active modes if URL changes
  useEffect(() => {
    setActiveModes(parsedModes);
  }, [parsedModes]);

  // Load vocabulary for session and randomize modes for each card
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function prepareSession() {
      try {
        let pool: HSKWord[] = [];
        if (srsOnlyParam) {
          pool = await getAllHSKWords();
          // Filter to words due for review
          const dueList = pool.filter((w) => isWordDue(w.id));
          if (dueList.length > 0) {
            pool = dueList;
          }
        } else {
          pool = await getHSKWords(currentLevel);
        }

        if (!isMounted) return;

        setAllLevelWords(pool);

        // Shuffle pool
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const targetCount = countParam ? parseInt(countParam, 10) : 15;
        const selected = shuffled.slice(0, targetCount);

        // Assign randomized mode from activeModes to each card
        const cards: SessionCard[] = selected.map((word) => {
          const randomMode = activeModes[Math.floor(Math.random() * activeModes.length)];
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
  }, [currentLevel, countParam, srsOnlyParam, activeModes]);

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
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      });
    }
  };

  // Toggle a mode in or out of the active randomization pool
  const toggleActiveMode = (mode: QuizMode) => {
    let newModes: QuizMode[];
    if (activeModes.includes(mode)) {
      if (activeModes.length <= 1) {
        return; // Prevent deselecting all modes - keep at least one active
      }
      newModes = activeModes.filter((m) => m !== mode);
    } else {
      newModes = [...activeModes, mode];
    }

    setActiveModes(newModes);

    // Update remaining session cards to reflect the new active pool
    setSessionCards((prev) => {
      const next = [...prev];
      // If current card's mode was just disabled, immediately reassign it to one of the active modes
      if (next[currentIndex] && !newModes.includes(next[currentIndex].mode)) {
        const replacementMode = newModes[Math.floor(Math.random() * newModes.length)];
        next[currentIndex] = { ...next[currentIndex], mode: replacementMode };
      }
      // Reassign upcoming cards to draw from the updated activeModes
      for (let i = currentIndex + 1; i < next.length; i++) {
        const randomMode = newModes[Math.floor(Math.random() * newModes.length)];
        next[i] = { ...next[i], mode: randomMode };
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
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-zinc-200">Preparing Quiz Session...</h2>
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <Award size={36} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">
              Session Completed! 恭喜！
            </h1>
            <p className="text-sm text-zinc-400">
              Your spaced repetition memory intervals have been updated in your profile.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 py-4 border-y border-zinc-800">
            <div className="p-3 bg-zinc-950/50 rounded-2xl">
              <div className="text-2xl font-bold text-zinc-100">
                {sessionResults.length}
              </div>
              <div className="text-xs text-zinc-400">Cards Studied</div>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-2xl">
              <div className="text-2xl font-bold text-emerald-400">
                {goodEasyCount}
              </div>
              <div className="text-xs text-zinc-400">Recalled</div>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-2xl">
              <div className="text-2xl font-bold text-amber-400">
                {againCount}
              </div>
              <div className="text-xs text-zinc-400">Need Practice</div>
            </div>
          </div>

          {/* Practice Mode Breakdown */}
          <div className="space-y-2 text-left bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Shuffle size={13} className="text-red-400" />
              <span>Mixed Modes Completed:</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(modeCounts).map(([mode, count]) => {
                const info = modeDescriptions[mode as QuizMode];
                const Icon = info?.icon || BookOpen;
                return (
                  <div
                    key={mode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium"
                  >
                    <Icon size={14} className="text-red-400" />
                    <span>{info?.name}:</span>
                    <strong className="text-white">{count}</strong>
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
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/30 active:scale-95"
            >
              <RotateCcw size={16} />
              <span>Study More Words</span>
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition-colors border border-zinc-700"
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
        <h2 className="text-xl font-bold text-zinc-200">No review cards available.</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium text-sm"
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
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          {/* Active Mode Pill with Shuffle indicator & Mode Toggler */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200">
              {activeModes.length > 1 && (
                <span title={`Randomizing across ${activeModes.length} modes`}>
                  <Shuffle size={13} className="text-red-400 animate-pulse" />
                </span>
              )}
              <CurrentModeIcon size={14} className="text-red-400" />
              <span className="font-semibold">{currentModeInfo.name}</span>
            </div>

            {/* 5 Mode Toggle Buttons to actively enable/disable modes from the shuffle */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
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
                    className={`p-1.5 rounded-lg transition-all duration-150 relative cursor-pointer ${
                      isCurrent
                        ? 'bg-red-600 text-white shadow-md ring-2 ring-white/40'
                        : isInPool
                        ? 'bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 border border-zinc-700/60'
                        : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 opacity-40 hover:opacity-75'
                    }`}
                    title={
                      isInPool
                        ? activeModes.length === 1
                          ? `${info.name} (Active - only mode remaining)`
                          : `Active: Click to disable ${info.name} from shuffle`
                        : `Inactive: Click to enable ${info.name} in shuffle`
                    }
                  >
                    <Icon size={15} />
                    {isInPool && !isCurrent && (
                      <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>


          <div className="text-xs font-mono font-bold text-zinc-400">
            {currentIndex + 1} / {sessionCards.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-red-500 h-full rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / sessionCards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Main Flashcard Quiz Card */}
      <QuizCard
        key={`${currentCard.word.id}-${currentCard.mode}-${currentIndex}`}
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
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <QuizEngineContent />
    </Suspense>
  );
}
