'use client';

import React from 'react';
import { HSKWord } from '@/types/hsk';
import { HanziCanvas } from './HanziCanvas';
import { AudioButton } from './AudioButton';
import { X, Calendar, Award, Zap, Repeat } from 'lucide-react';
import { useProgress } from '@/context/ProgressContext';
import { formatInterval } from '@/lib/srs';

interface WordDetailModalProps {
  word: HSKWord | null;
  onClose: () => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({ word, onClose }) => {
  const { getWordSRS, getWordStatus } = useProgress();

  if (!word) return null;

  const srs = getWordSRS(word.id);
  const status = getWordStatus(word.id);

  const statusColors: Record<string, string> = {
    new: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    learning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    mastered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Level & Status Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span 
            className="px-3 py-1 rounded-full text-xs font-bold text-white tracking-wider"
            style={{ backgroundColor: HSK_THEMES[word.level]?.primary || '#f8b51e' }}
          >
            HSK {word.level}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              statusColors[status]
            }`}
          >
            {status}
          </span>
          {word.partOfSpeech && (
            <span className="text-xs text-zinc-400 capitalize">
              • {word.partOfSpeech}
            </span>
          )}
        </div>

        {/* Hanzi Stroke Order & Practice Canvas */}
        <div className="flex flex-col items-center justify-center py-2">
          <HanziCanvas hanzi={word.hanzi} size={220} mode="display" />
        </div>

        {/* Word Info */}
        <div className="text-center mt-3 space-y-2">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-3xl font-bold text-zinc-100 font-serif">{word.hanzi}</h2>
            <AudioButton text={word.hanzi} size="md" />
          </div>
          <p 
            className="text-xl font-medium"
            style={{ color: HSK_THEMES[word.level]?.primary || '#f8b51e' }}
          >
            {word.pinyin}
          </p>

          <p className="text-base text-zinc-300 font-medium">
            {word.translations.join(', ')}
          </p>
        </div>

        {/* Example Sentence */}
        {word.exampleSentence && (
          <div className="mt-6 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Example Sentence
              </span>
              <AudioButton text={word.exampleSentence.hanzi} size="sm" />
            </div>
            <p className="text-base text-zinc-100 font-serif">
              {word.exampleSentence.hanzi}
            </p>
            <p className="text-xs text-zinc-400 italic">
              {word.exampleSentence.pinyin}
            </p>
            <p className="text-xs text-zinc-300">
              {word.exampleSentence.translation}
            </p>
          </div>
        )}

        {/* SRS Memory Stats */}
        <div className="mt-6 pt-4 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
            <div className="flex items-center justify-center text-zinc-500 mb-1">
              <Repeat size={14} />
            </div>
            <div className="text-xs text-zinc-400">Repetitions</div>
            <div className="text-base font-bold text-zinc-100">
              {srs?.repetitions ?? 0}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
            <div className="flex items-center justify-center text-zinc-500 mb-1">
              <Calendar size={14} />
            </div>
            <div className="text-xs text-zinc-400">Interval</div>
            <div className="text-base font-bold text-zinc-100">
              {formatInterval(srs?.interval ?? 0)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
            <div className="flex items-center justify-center text-zinc-500 mb-1">
              <Zap size={14} />
            </div>
            <div className="text-xs text-zinc-400">Ease Factor</div>
            <div className="text-base font-bold text-zinc-100">
              {srs?.easeFactor ? srs.easeFactor.toFixed(2) : '2.50'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
