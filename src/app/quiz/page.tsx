'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HSKWord, QuizMode, SRSGrade } from '@/types/hsk';
import { getAllHSKWords, getHSKWords } from '@/lib/hskData';
import { useProgress } from '@/context/ProgressContext';
import { QuizCard } from '@/components/QuizCard';

function QuizEngineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { recordReview, isWordDue, stats } = useProgress();

  const levelParam = searchParams.get('level');
  const modeParam = searchParams.get('mode') as QuizMode | null;
  const countParam = searchParams.get('count');
  const srsOnlyParam = searchParams.get('srsOnly') === 'true';

  const [currentLevel, setCurrentLevel] = useState<number>(levelParam ? parseInt(levelParam, 10) : 1);
  const [currentMode, setCurrentMode] = useState<QuizMode>(modeParam || 'hanzi-to-meaning');
  const [sessionWords, setSessionWords] = useState<HSKWord[]>([]);
  const [allLevelWords, setAllLevelWords] = useState<HSKWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<{ word: HSKWord; grade: SRSGrade }[]>([]);

  // Load vocabulary for session
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

        setSessionWords(selected);
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
    const currentWord = sessionWords[currentIndex];
    if (!currentWord) return;

    // Record review in SRS engine
    await recordReview(currentWord.id, grade);

    // Track results for final recap
    setSessionResults((prev) => [...prev, { word: currentWord, grade }]);

    // Move to next card or finish session
    if (currentIndex + 1 < sessionWords.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSessionComplete(true);
      // Fire celebration confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      });
    }
  };

  const restartSession = () => {
    const shuffled = [...allLevelWords].sort(() => 0.5 - Math.random());
    const targetCount = countParam ? parseInt(countParam, 10) : 15;
    setSessionWords(shuffled.slice(0, targetCount));
    setCurrentIndex(0);
    setIsSessionComplete(false);
    setSessionResults([]);
  };

  const modeIcons: Record<QuizMode, any> = {
    'hanzi-to-meaning': BookOpen,
    'meaning-to-hanzi-desktop': Keyboard,
    'meaning-to-hanzi-mobile': PenTool,
    'sentence-context': FileText,
    'audio-quiz': Headphones,
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

  const currentWord = sessionWords[currentIndex];

  if (!currentWord) {
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Session Navigation & Progress Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>

          {/* Quick Mode Switcher Dropdown / Pills */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {(
              [
                'hanzi-to-meaning',
                'meaning-to-hanzi-desktop',
                'meaning-to-hanzi-mobile',
                'sentence-context',
                'audio-quiz',
              ] as QuizMode[]
            ).map((mode) => {
              const Icon = modeIcons[mode];
              const isActive = currentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCurrentMode(mode)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                  title={mode}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono font-bold text-zinc-400">
            {currentIndex + 1} / {sessionWords.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-red-500 h-full rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / sessionWords.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Main Flashcard Quiz Card */}
      <QuizCard
        key={`${currentWord.id}-${currentMode}`}
        word={currentWord}
        quizMode={currentMode}
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
