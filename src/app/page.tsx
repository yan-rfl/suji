'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Flame, 
  BrainCircuit, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Zap, 
  Play, 
  Keyboard, 
  PenTool, 
  Headphones, 
  FileText, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Check,
  Shuffle
} from 'lucide-react';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { getAllHSKWords } from '@/lib/hskData';
import { HSKWord, QuizMode } from '@/types/hsk';

const ALL_MODES: QuizMode[] = [
  'hanzi-to-meaning',
  'meaning-to-hanzi-desktop',
  'meaning-to-hanzi-mobile',
  'sentence-context',
  'audio-quiz',
];

export default function DashboardPage() {
  const router = useRouter();
  const { stats, srsData, isWordDue } = useProgress();
  const { user } = useAuth();

  const [allWords, setAllWords] = useState<HSKWord[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedModes, setSelectedModes] = useState<QuizMode[]>([
    'hanzi-to-meaning',
    'sentence-context',
    'audio-quiz',
  ]);
  const [sessionCount, setSessionCount] = useState<number>(15);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
      setIsMobileDevice(isMobile);
      if (isMobile) {
        setSelectedModes(['hanzi-to-meaning', 'meaning-to-hanzi-mobile', 'audio-quiz']);
      } else {
        setSelectedModes(['hanzi-to-meaning', 'meaning-to-hanzi-desktop', 'sentence-context', 'audio-quiz']);
      }
    }

    async function loadWords() {
      const words = await getAllHSKWords();
      setAllWords(words);
    }
    loadWords();
  }, []);

  // Compute due words
  const dueWords = allWords.filter((w) => isWordDue(w.id));
  const dueCount = dueWords.length;

  // Level breakdowns
  const levelCounts = [1, 2, 3, 4, 5].map((lvl) => {
    const lvlWords = allWords.filter((w) => w.level === lvl);
    const mastered = lvlWords.filter((w) => srsData[w.id]?.status === 'mastered').length;
    const learning = lvlWords.filter((w) => srsData[w.id]?.status === 'learning').length;
    const percentage = lvlWords.length > 0 ? Math.round((mastered / lvlWords.length) * 100) : 0;
    return {
      level: lvl,
      total: lvlWords.length,
      mastered,
      learning,
      percentage,
    };
  });

  const toggleMode = (mode: QuizMode) => {
    if (selectedModes.includes(mode)) {
      if (selectedModes.length > 1) {
        setSelectedModes(selectedModes.filter((m) => m !== mode));
      }
    } else {
      setSelectedModes([...selectedModes, mode]);
    }
  };

  const selectAllModes = () => {
    setSelectedModes([...ALL_MODES]);
  };

  const handleStartCustomQuiz = () => {
    router.push(`/quiz?level=${selectedLevel}&modes=${selectedModes.join(',')}&count=${sessionCount}`);
  };

  const handleStartSRSReview = () => {
    router.push(`/quiz?srsOnly=true&modes=${selectedModes.join(',')}&count=20`);
  };

  const modeDescriptions: Record<QuizMode, { title: string; desc: string; icon: any }> = {
    'hanzi-to-meaning': {
      title: 'Hanzi → Meaning',
      desc: 'Read character; identify pinyin & English definition',
      icon: BookOpen,
    },
    'meaning-to-hanzi-desktop': {
      title: 'Meaning → IME Typing',
      desc: 'Type Hanzi using your desktop keyboard Pinyin IME',
      icon: Keyboard,
    },
    'meaning-to-hanzi-mobile': {
      title: 'Stroke Order Drawing',
      desc: 'Interactive touch canvas stroke-by-stroke writing',
      icon: PenTool,
    },
    'sentence-context': {
      title: 'Contextual Cloze',
      desc: 'Real example sentence fill-in-the-blank practice',
      icon: FileText,
    },
    'audio-quiz': {
      title: 'Mandarin Audio Quiz',
      desc: 'Listen without visual hints; test ear & recall character',
      icon: Headphones,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Welcome Banner & Daily Streak */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-zinc-900 to-zinc-950 border border-red-900/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-600/30 text-red-300 border border-red-500/30">
                HSK Spaced Repetition (SM-2)
              </span>
              <span className="text-xs text-zinc-400">
                Welcome back, <strong className="text-zinc-200">{user?.displayName || 'Learner'}</strong>
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Suji <span className="font-serif text-red-500">速记</span> Flashcards
            </h1>
            <p className="text-zinc-300 text-sm md:text-base max-w-xl">
              Master HSK 1–5 Mandarin through science-backed SM-2 active recall, device-adaptive typing, stroke drawing, and authentic speech.
            </p>
          </div>

          {/* Quick Review Action Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-md">
            <div className="text-center sm:text-left">
              <div className="text-xs text-zinc-400 font-medium">SRS Due Today</div>
              <div className="text-3xl font-black text-red-500">
                {dueCount} <span className="text-sm font-normal text-zinc-400">words</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartSRSReview}
              disabled={dueCount === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-red-900/30 active:scale-95"
            >
              <Zap size={16} />
              <span>Review Now</span>
            </button>
          </div>
        </div>

        {/* Decorative background Hanzi watermark */}
        <div className="absolute -right-8 -bottom-10 text-9xl font-black font-serif text-red-500/5 select-none pointer-events-none">
          速
        </div>
      </div>

      {/* SRS Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Streak */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 md:p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Flame size={24} className="fill-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.currentStreak}</div>
            <div className="text-xs text-zinc-400">Day Study Streak</div>
          </div>
        </div>

        {/* Metric 2: Total Reviews */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 md:p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.totalWordsReviewed}</div>
            <div className="text-xs text-zinc-400">Total Reviews</div>
          </div>
        </div>

        {/* Metric 3: Words Learning */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 md:p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.wordsLearning}</div>
            <div className="text-xs text-zinc-400">In Progress</div>
          </div>
        </div>

        {/* Metric 4: Words Mastered */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 md:p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-100">{stats.wordsMastered}</div>
            <div className="text-xs text-zinc-400">Words Mastered</div>
          </div>
        </div>
      </div>

      {/* Main Action Section: Custom Quiz Launcher */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <BrainCircuit className="text-red-500" size={24} />
              <span>Launch Quiz Session</span>
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Select multiple practice modes to randomly vary question types during your session
            </p>
          </div>
          <Link
            href="/dictionary"
            className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            <span>Browse Dictionary</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Step 1: Select HSK Level */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            1. Select Target HSK Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`py-3 px-4 rounded-2xl border text-center transition-all ${
                  selectedLevel === lvl
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30'
                    : 'bg-zinc-950/60 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                }`}
              >
                <div className="font-bold text-base">HSK {lvl}</div>
                <div className={`text-xs mt-0.5 ${selectedLevel === lvl ? 'text-red-100' : 'text-zinc-500'}`}>
                  {lvl === 1 ? 'Beginner' : lvl === 2 ? 'Elementary' : lvl === 3 ? 'Intermediate' : lvl === 4 ? 'Upper-Int' : 'Advanced'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Multi-Mode Selector (Randomized across cards) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                2. Practice Modes (Select Multiple to Randomize)
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                <Shuffle size={11} />
                <span>{selectedModes.length} Selected</span>
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllModes}
                className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors"
              >
                Select All 5
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={() => setSelectedModes(['meaning-to-hanzi-desktop', 'meaning-to-hanzi-mobile'])}
                className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors"
              >
                Writing Focus
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={() => setSelectedModes(['hanzi-to-meaning', 'sentence-context', 'audio-quiz'])}
                className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors"
              >
                Recognition Focus
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_MODES.map((mode) => {
              const { title, desc, icon: Icon } = modeDescriptions[mode];
              const isSelected = selectedModes.includes(mode);
              const isRecommended =
                (isMobileDevice && mode === 'meaning-to-hanzi-mobile') ||
                (!isMobileDevice && mode === 'meaning-to-hanzi-desktop');

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleMode(mode)}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all relative group cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/90 text-white border-red-500/80 ring-1 ring-red-500/50 shadow-md'
                      : 'bg-zinc-950/50 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                        {title}
                      </span>
                      {isRecommended && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/30">
                          Rec
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{desc}</p>
                  </div>

                  {/* Checkbox indicator */}
                  <div className="absolute top-3.5 right-3.5">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-zinc-700 bg-zinc-900 group-hover:border-zinc-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-zinc-500 italic">
            Each card in your session will be randomly assigned one of the {selectedModes.length} selected modes.
          </p>
        </div>

        {/* Step 3: Session Count & Launch Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-zinc-400 font-medium">Session Cards:</span>
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {[10, 15, 25, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSessionCount(num)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    sessionCount === num
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartCustomQuiz}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-xl shadow-red-900/30 active:scale-95"
          >
            <Play size={18} />
            <span>Start Practice Session ({selectedModes.length} {selectedModes.length === 1 ? 'mode' : 'mixed modes'})</span>
          </button>
        </div>
      </div>

      {/* HSK Mastery Progress Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">HSK Level Mastery Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {levelCounts.map((item) => (
            <div
              key={item.level}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-200">HSK {item.level}</span>
                <span className="text-xs font-mono font-bold text-red-400">{item.percentage}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>{item.mastered} Mastered</span>
                <span>{item.total} Total</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
