'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Volume2, 
  BookOpen, 
  X, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Layers,
  FileDown
} from 'lucide-react';
import { HSKWord, MasteryStatus } from '@/types/hsk';
import { getHSKWords, searchWords, formatPartOfSpeech } from '@/lib/hskData';
import { exportVocabularyToPDF } from '@/lib/pdfExport';
import { useProgress } from '@/context/ProgressContext';
import { useLevel, HSK_THEMES } from '@/context/LevelContext';
import { AudioButton } from '@/components/AudioButton';
import { WordDetailModal } from '@/components/WordDetailModal';

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  new: {
    bg: 'bg-zinc-100 dark:bg-zinc-800/80',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-700/60',
  },
  learning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  mastered: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
};

export default function DictionaryPage() {
  const { getWordStatus, getWordSRS } = useProgress();
  const { currentLevel, setCurrentLevel, theme } = useLevel();

  const [words, setWords] = useState<HSKWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | MasteryStatus>('all');
  const [levelScope, setLevelScope] = useState<'all' | 'new-only'>('all');
  const [activeModalWord, setActiveModalWord] = useState<HSKWord | null>(null);

  // Fetch words for global currentLevel
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadLevelWords() {
      const data = await getHSKWords(currentLevel);
      if (isMounted) {
        setWords(data);
        setLoading(false);
      }
    }

    loadLevelWords();

    return () => {
      isMounted = false;
    };
  }, [currentLevel]);

  // Filter and search words
  const filteredWords = useMemo(() => {
    let result = words;

    // Filter by level scope (e.g. only new words for current level)
    if (levelScope === 'new-only') {
      result = result.filter((w) => w.level === currentLevel);
    }

    // Filter by mastery status
    if (statusFilter !== 'all') {
      result = result.filter((w) => getWordStatus(w.id) === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      result = searchWords(result, searchQuery);
    }

    return result;
  }, [words, searchQuery, statusFilter, levelScope, currentLevel, getWordStatus]);

  // Counts by status
  const counts = useMemo(() => {
    let newCount = 0;
    let learningCount = 0;
    let masteredCount = 0;
    let currentLevelCount = 0;

    words.forEach((w) => {
      if (w.level === currentLevel) currentLevelCount++;
      const status = getWordStatus(w.id);
      if (status === 'mastered') masteredCount++;
      else if (status === 'learning') learningCount++;
      else newCount++;
    });

    return { total: words.length, newCount, learningCount, masteredCount, currentLevelCount };
  }, [words, currentLevel, getWordStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls Rows */}
      <div className="space-y-4">
        {/* Row 1: Header and subheader */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <BookOpen style={{ color: theme.primary }} size={26} className="shrink-0" />
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight whitespace-nowrap">
              HSK Dictionary
            </h1>
            <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              HSK 1–6 Vocabulary
            </span>
          </div>
        </div>

        {/* Row 2: HSK Level Selection and PDF Export Button */}
        <div className="flex items-stretch sm:items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          {/* HSK Level Switcher (2 rows of 3 on mobile, fits snugly until HSK 6 on desktop) */}
          <div className="flex-1 sm:flex-none sm:w-auto grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const isSelected = currentLevel === lvl;
              const lvlTheme = HSK_THEMES[lvl] || HSK_THEMES[1];
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCurrentLevel(lvl)}
                  className={`py-2 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: lvlTheme.primary,
                          boxShadow: `0 2px 10px rgba(${lvlTheme.rgb}, 0.35)`
                        }
                      : undefined
                  }
                >
                  HSK {lvl}
                </button>
              );
            })}
          </div>

          {/* PDF Export Button (Square on mobile, rests directly next to levels on desktop) */}
          <button
            type="button"
            onClick={() => exportVocabularyToPDF(currentLevel, words)}
            className="aspect-square sm:aspect-auto self-stretch sm:self-auto flex items-center justify-center gap-2 p-0 sm:px-4 sm:py-2.5 sm:h-11 rounded-2xl text-xs sm:text-sm font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900/60 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
            title={`Export HSK ${currentLevel} PDF`}
            aria-label={`Export HSK ${currentLevel} PDF`}
          >
            <FileDown size={20} className="text-red-500 shrink-0" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>

        {/* Row 3: Search Bar & Status Filter Bar with matching height (h-12) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hanzi, Pinyin, or English..."
              className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--theme-primary)] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filter Buttons (space-between / grid on mobile to fill width without gaps, matching h-12 height) */}
          <div className="h-12 w-full sm:w-auto p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`h-full px-2.5 sm:px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('new')}
              className={`h-full px-2.5 sm:px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer ${
                statusFilter === 'new'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              New ({counts.newCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('learning')}
              className={`h-full px-2.5 sm:px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer ${
                statusFilter === 'learning'
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-300'
              }`}
            >
              Learning ({counts.learningCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('mastered')}
              className={`h-full px-2.5 sm:px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer ${
                statusFilter === 'mastered'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              Mastered ({counts.masteredCount})
            </button>
          </div>
        </div>

        {/* Row 4: Scope Selector: Full Syllabus vs Level-Specific New Words (full width on mobile) */}
        {currentLevel > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Syllabus Scope:</span>
            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setLevelScope('all')}
                className={`w-full sm:w-auto text-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  levelScope === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                All HSK {currentLevel} Syllabus ({words.length})
              </button>
              <button
                type="button"
                onClick={() => setLevelScope('new-only')}
                className={`w-full sm:w-auto text-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  levelScope === 'new-only'
                    ? 'text-white shadow-md'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                style={levelScope === 'new-only' ? { backgroundColor: theme.primary } : undefined}
              >
                HSK {currentLevel} New Only ({counts.currentLevelCount})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div 
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto" 
            style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading HSK {currentLevel} vocabulary...</p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-zinc-900/40 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 p-8 space-y-3 shadow-sm">
          <BookOpen size={40} className="mx-auto text-zinc-400 dark:text-zinc-600" />
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-300">No words found</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search query or switching your status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWords.map((word) => {
            const status = getWordStatus(word.id);
            const style = statusStyles[status] || statusStyles['new'];

            return (
              <div
                key={word.id}
                onClick={() => setActiveModalWord(word)}
                className="group relative bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
              >
                {/* Card Top: Hanzi & Audio */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span 
                      className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-serif tracking-wide transition-colors group-hover:opacity-90"
                      style={{ color: undefined }}
                    >
                      {word.hanzi}
                    </span>
                    <p className="text-sm font-medium" style={{ color: theme.primary }}>
                      {word.pinyin}
                    </p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <AudioButton text={word.hanzi} size="sm" />
                  </div>
                </div>

                {/* Card Center: English Translations */}
                <div className="my-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {word.translations.join(', ')}
                  </p>
                </div>

                {/* Card Bottom: Part of Speech & Mastery Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: HSK_THEMES[word.level]?.badgeBg || theme.badgeBg,
                        color: HSK_THEMES[word.level]?.badgeText || theme.badgeText,
                        border: `1px solid ${HSK_THEMES[word.level]?.badgeBorder || theme.badgeBorder}`
                      }}
                    >
                      HSK {word.level}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500 capitalize">
                      {formatPartOfSpeech(word.partOfSpeech) || 'word'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px] border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Word Detail & Stroke Practice Modal */}
      {activeModalWord && (
        <WordDetailModal
          word={activeModalWord}
          onClose={() => setActiveModalWord(null)}
        />
      )}
    </div>
  );
}
