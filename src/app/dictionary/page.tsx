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
  Layers
} from 'lucide-react';
import { HSKWord, MasteryStatus } from '@/types/hsk';
import { getHSKWords, searchWords } from '@/lib/hskData';
import { useProgress } from '@/context/ProgressContext';
import { useLevel, HSK_THEMES } from '@/context/LevelContext';
import { AudioButton } from '@/components/AudioButton';
import { WordDetailModal } from '@/components/WordDetailModal';

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  new: {
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-400',
    border: 'border-zinc-700/60',
  },
  learning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  mastered: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
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
      {/* Header & Level Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-100 flex items-center gap-3">
              <BookOpen style={{ color: theme.primary }} size={30} />
              <span>HSK Dictionary & Vocabulary</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Search vocabulary, hear authentic pronunciation, and explore stroke order animations
            </p>
          </div>

          {/* HSK Level Switcher with persistent global level */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-x-auto max-w-full">
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const isSelected = currentLevel === lvl;
              const lvlTheme = HSK_THEMES[lvl] || HSK_THEMES[1];
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCurrentLevel(lvl)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
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
        </div>

        {/* Search Bar & Status Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hanzi, Pinyin (e.g. ni hao), or English..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-[var(--theme-primary)] text-zinc-100 placeholder:text-zinc-500 text-sm outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'new'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              New ({counts.newCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('learning')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'learning'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              Learning ({counts.learningCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'mastered'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              Mastered ({counts.masteredCount})
            </button>
          </div>
        </div>

        {/* Scope Selector: Full Syllabus vs Level-Specific New Words */}
        {currentLevel > 1 && (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-zinc-400 font-medium">Syllabus Scope:</span>
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setLevelScope('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  levelScope === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All HSK {currentLevel} Syllabus ({words.length})
              </button>
              <button
                type="button"
                onClick={() => setLevelScope('new-only')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  levelScope === 'new-only'
                    ? 'text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
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
          <p className="text-sm text-zinc-400">Loading HSK {currentLevel} vocabulary...</p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/80 p-8 space-y-3">
          <BookOpen size={40} className="mx-auto text-zinc-600" />
          <h3 className="text-lg font-bold text-zinc-300">No words found</h3>
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
                className="group relative bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
              >
                {/* Card Top: Hanzi & Audio */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span 
                      className="text-3xl font-bold text-zinc-100 font-serif tracking-wide transition-colors group-hover:opacity-90"
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
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {word.translations.join(', ')}
                  </p>
                </div>

                {/* Card Bottom: Part of Speech & Mastery Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px]">
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
                    <span className="text-zinc-500 capitalize">
                      {word.partOfSpeech || 'word'}
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
