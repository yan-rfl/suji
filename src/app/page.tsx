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
import { useLevel, HSK_THEMES } from '@/context/LevelContext';
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
  const { currentLevel, setCurrentLevel, theme } = useLevel();

  const [allWords, setAllWords] = useState<HSKWord[]>([]);
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
  const levelCounts = [1, 2, 3, 4, 5, 6].map((lvl) => {
    const cumulativeWords = allWords.filter((w) => w.level <= lvl);
    const newWords = allWords.filter((w) => w.level === lvl);
    const mastered = cumulativeWords.filter((w) => srsData[w.id]?.status === 'mastered').length;
    const learning = cumulativeWords.filter((w) => srsData[w.id]?.status === 'learning').length;
    const percentage = cumulativeWords.length > 0 ? Math.round((mastered / cumulativeWords.length) * 100) : 0;
    return {
      level: lvl,
      total: cumulativeWords.length,
      newCount: newWords.length,
      mastered,
      learning,
      percentage,
      color: HSK_THEMES[lvl]?.primary || '#f8b51e',
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
    router.push(`/quiz?level=${currentLevel}&modes=${selectedModes.join(',')}&count=${sessionCount}`);
  };

  const handleStartSRSReview = () => {
    router.push(`/quiz?srsOnly=true&level=${currentLevel}&modes=${selectedModes.join(',')}&count=20`);
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
      {/* Welcome Banner & Daily Streak styled with dynamic Level color */}
      <div 
        className="relative overflow-hidden rounded-3xl bg-zinc-900 border p-6 md:p-8 shadow-2xl transition-colors duration-300"
        style={{
          borderColor: `rgba(${theme.rgb}, 0.3)`,
          background: `radial-gradient(ellipse at top left, rgba(${theme.rgb}, 0.15), rgba(24, 24, 27, 0.95) 70%)`
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: theme.badgeBg,
                  color: theme.badgeText,
                  border: `1px solid ${theme.badgeBorder}`
                }}
              >
                HSK {currentLevel} Active Track
              </span>
              <span className="text-xs text-zinc-400">
                Welcome back, <strong className="text-zinc-200">{user?.displayName || 'Learner'}</strong>
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Suji <span className="font-serif font-medium" style={{ color: theme.primary }}>速记</span> Flashcards
            </h1>
            <p className="text-zinc-300 text-sm md:text-base max-w-xl">
              Master HSK 1–5 Mandarin through science-backed SM-2 active recall, device-adaptive typing, stroke drawing, and authentic speech.
            </p>
          </div>

          {/* Quick Review Action Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-md">
            <div className="text-center sm:text-left">
              <div className="text-xs text-zinc-400 font-medium">SRS Due Today</div>
              <div className="text-3xl font-black" style={{ color: theme.primary }}>
                {dueCount} <span className="text-sm font-normal text-zinc-400">words</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartSRSReview}
              disabled={dueCount === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg active:scale-95"
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 4px 16px rgba(${theme.rgb}, 0.3)`
              }}
            >
              <Zap size={16} />
              <span>Review Now</span>
            </button>
          </div>
        </div>

        {/* Decorative background Hanzi watermark with theme color */}
        <div 
          className="absolute -right-8 -bottom-10 text-9xl font-black font-serif select-none pointer-events-none opacity-5 transition-colors"
          style={{ color: theme.primary }}
        >
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
              <BrainCircuit style={{ color: theme.primary }} size={24} />
              <span>Launch Quiz Session</span>
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Select multiple practice modes to randomly vary question types during your session
            </p>
          </div>
          <Link
            href="/dictionary"
            className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-colors"
            style={{ color: theme.primary }}
          >
            <span>Browse Dictionary</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Step 1: Select HSK Level (Global persistence) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              1. Select Target HSK Level
            </label>
            <span className="text-[11px] text-zinc-500">
              Persists across Dictionary and Quiz Engine
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const isSelected = currentLevel === lvl;
              const lvlTheme = HSK_THEMES[lvl] || HSK_THEMES[1];
              const levelNames: Record<number, string> = {
                1: 'Beginner',
                2: 'Elementary',
                3: 'Intermediate',
                4: 'Upper-Int',
                5: 'Advanced',
                6: 'Mastery',
              };
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCurrentLevel(lvl)}
                  className={`py-3 px-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-zinc-950/60 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: lvlTheme.primary,
                          borderColor: lvlTheme.primary,
                          boxShadow: `0 4px 16px rgba(${lvlTheme.rgb}, 0.35)`,
                        }
                      : undefined
                  }
                >
                  <div className="font-bold text-base">HSK {lvl}</div>
                  <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/90' : 'text-zinc-500'}`}>
                    {levelNames[lvl]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Multi-Mode Selector (Randomized across cards) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                2. Practice Modes (Select Multiple to Randomize)
              </label>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                style={{
                  backgroundColor: theme.badgeBg,
                  color: theme.badgeText,
                  border: `1px solid ${theme.badgeBorder}`
                }}
              >
                <Shuffle size={11} />
                <span>{selectedModes.length} Selected</span>
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllModes}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Select All 5
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={() => setSelectedModes(['meaning-to-hanzi-desktop', 'meaning-to-hanzi-mobile'])}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Writing Focus
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={() => setSelectedModes(['hanzi-to-meaning', 'sentence-context', 'audio-quiz'])}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
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
                      ? 'bg-zinc-800/90 text-white shadow-md'
                      : 'bg-zinc-950/50 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: theme.primary,
                          boxShadow: `0 2px 10px rgba(${theme.rgb}, 0.2)`
                        }
                      : undefined
                  }
                >
                  <div 
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isSelected ? 'text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}
                    style={isSelected ? { backgroundColor: theme.primary } : undefined}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                        {title}
                      </span>
                      {isRecommended && (
                        <span 
                          className="px-1.5 py-0.2 rounded text-[9px] font-medium"
                          style={{
                            backgroundColor: theme.badgeBg,
                            color: theme.badgeText,
                            border: `1px solid ${theme.badgeBorder}`
                          }}
                        >
                          Rec
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{desc}</p>
                  </div>

                  {/* Checkbox indicator */}
                  <div className="absolute top-3.5 right-3.5">
                    {isSelected ? (
                      <div 
                        className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: theme.primary }}
                      >
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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-xl active:scale-95 cursor-pointer"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 4px 18px rgba(${theme.rgb}, 0.35)`
            }}
          >
            <Play size={18} />
            <span>Start Practice Session ({selectedModes.length} {selectedModes.length === 1 ? 'mode' : 'mixed modes'})</span>
          </button>
        </div>
      </div>

      {/* HSK Mastery Progress Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-200">HSK Level Mastery Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {levelCounts.map((item) => (
            <div
              key={item.level}
              className={`bg-zinc-900/60 border rounded-2xl p-4 space-y-3 transition-colors ${
                currentLevel === item.level ? 'border-zinc-700 bg-zinc-900/90' : 'border-zinc-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-200">HSK {item.level}</span>
                <span className="text-xs font-mono font-bold" style={{ color: item.color }}>
                  {item.percentage}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <div className="space-y-0.5 text-[11px] text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>{item.mastered} Mastered</span>
                  <span className="font-medium text-zinc-300">{item.total.toLocaleString()} Total</span>
                </div>
                {item.level > 1 && (
                  <div className="text-[10px] text-zinc-500 text-right">
                    +{item.newCount.toLocaleString()} new
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
