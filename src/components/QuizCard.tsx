'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { HSKWord, QuizMode, SRSGrade } from '@/types/hsk';
import { AudioButton } from './AudioButton';
import { HanziCanvas } from './HanziCanvas';
import { DesktopInput } from './DesktopInput';
import { 
  Sparkles, 
  HelpCircle, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Clock, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { tts } from '@/lib/tts';
import { useLevel } from '@/context/LevelContext';

interface QuizCardProps {
  word: HSKWord;
  quizMode: QuizMode;
  allWords: HSKWord[];
  onGrade: (grade: SRSGrade) => void;
  className?: string;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  word,
  quizMode,
  allWords,
  onGrade,
  className = '',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isChoiceCorrect, setIsChoiceCorrect] = useState<boolean | null>(null);
  const { theme } = useLevel();

  // Generate 4 multiple-choice distractors for multiple-choice modes
  const choices = useMemo(() => {
    const distractors = allWords
      .filter((w) => w.id !== word.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const pool = [word, ...distractors].sort(() => 0.5 - Math.random());
    return pool;
  }, [word, allWords]);

  // Reset card state when word changes
  useEffect(() => {
    setIsRevealed(false);
    setSelectedChoice(null);
    setIsChoiceCorrect(null);

    // For audio quiz mode, auto-speak target word upon card load
    if (quizMode === 'audio-quiz') {
      const timer = setTimeout(() => {
        tts.speak(word.hanzi);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [word, quizMode]);

  const handleSelectChoice = (chosenWord: HSKWord) => {
    if (isRevealed) return;
    const isCorrect = chosenWord.id === word.id;
    setSelectedChoice(chosenWord.id);
    setIsChoiceCorrect(isCorrect);
    setIsRevealed(true);
    tts.speak(word.hanzi);
  };

  const handleReveal = () => {
    setIsRevealed(true);
    tts.speak(word.hanzi);
  };

  // Mask sentence for contextual quiz
  const maskedSentence = useMemo(() => {
    if (!word.exampleSentence) return null;
    const { hanzi } = word.exampleSentence;
    const parts = hanzi.split(word.hanzi);
    return {
      before: parts[0] || '',
      target: word.hanzi,
      after: parts.slice(1).join(word.hanzi) || '',
    };
  }, [word]);

  return (
    <div
      className={`w-full max-w-xl mx-auto bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between transition-all ${className}`}
    >
      {/* Top Header: HSK Badge & Audio */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span 
            className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
            style={{
              backgroundColor: theme.badgeBg,
              color: theme.badgeText,
              border: `1px solid ${theme.badgeBorder}`
            }}
          >
            HSK {word.level}
          </span>
          {word.partOfSpeech && (
            <span className="text-xs text-zinc-500 font-medium capitalize">
              {word.partOfSpeech}
            </span>
          )}
        </div>
        <AudioButton text={word.hanzi} size="md" showLabel />
      </div>

      {/* Main Prompt Area based on Mode */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 my-2 text-center">
        {/* MODE 1: Hanzi to Meaning */}
        {quizMode === 'hanzi-to-meaning' && (
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold tracking-wide text-zinc-100 font-serif">
              {word.hanzi}
            </h1>
            {isRevealed && (
              <p 
                className="text-xl md:text-2xl font-medium animate-fadeIn"
                style={{ color: theme.primary }}
              >
                {word.pinyin}
              </p>
            )}
          </div>
        )}

        {/* MODE 2: Meaning to Hanzi (Desktop IME) */}
        {quizMode === 'meaning-to-hanzi-desktop' && (
          <div className="space-y-4 w-full">
            <div className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Translate into Hanzi
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
              {word.translations.join(', ')}
            </h2>
            <p className="text-zinc-400 text-sm italic">{word.pinyin}</p>

            <div className="pt-4">
              <DesktopInput
                targetHanzi={word.hanzi}
                onSuccess={() => {
                  setIsRevealed(true);
                  tts.speak(word.hanzi);
                }}
                disabled={isRevealed}
              />
            </div>
          </div>
        )}

        {/* MODE 3: Meaning to Hanzi (Mobile Stroke Drawing) */}
        {quizMode === 'meaning-to-hanzi-mobile' && (
          <div className="space-y-3 w-full flex flex-col items-center">
            <div className="text-center space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">
                {word.translations.join(', ')}
              </h2>
              <p className="text-sm font-medium" style={{ color: theme.primary }}>{word.pinyin}</p>
            </div>

            <HanziCanvas
              hanzi={word.hanzi}
              size={190}
              mode={isRevealed ? 'display' : 'quiz'}
              showOutline={true}
              onQuizComplete={() => {
                setIsRevealed(true);
                tts.speak(word.hanzi);
              }}
            />
          </div>
        )}

        {/* MODE 4: Contextual Sentence Quiz */}
        {quizMode === 'sentence-context' && (
          <div className="space-y-4 w-full">
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Contextual Fill-in-the-Blank
            </div>

            {maskedSentence ? (
              <div className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800 text-left space-y-2">
                <p className="text-xl md:text-2xl leading-relaxed text-zinc-100 font-serif">
                  {maskedSentence.before}
                  {isRevealed ? (
                    <span 
                      className="font-bold px-1.5 py-0.5 rounded border underline underline-offset-4"
                      style={{
                        color: theme.primary,
                        backgroundColor: theme.lightBg,
                        borderColor: `rgba(${theme.rgb}, 0.35)`,
                        textDecorationColor: theme.primary,
                      }}
                    >
                      {maskedSentence.target}
                    </span>
                  ) : (
                    <span 
                      className="font-mono font-bold px-2 py-0.5 bg-zinc-800 rounded border border-dashed"
                      style={{ color: theme.primary, borderColor: `rgba(${theme.rgb}, 0.5)` }}
                    >
                      [ ? ]
                    </span>
                  )}
                  {maskedSentence.after}
                </p>
                {isRevealed && (
                  <div className="pt-2 border-t border-zinc-800/60 text-sm text-zinc-400 space-y-1 animate-fadeIn">
                    <p className="text-zinc-300 italic">{word.exampleSentence?.pinyin}</p>
                    <p className="text-zinc-400">{word.exampleSentence?.translation}</p>
                  </div>
                )}
              </div>
            ) : (
              <h1 className="text-5xl font-bold text-zinc-100">{word.hanzi}</h1>
            )}

            {isRevealed && (
              <div className="text-center pt-2 animate-fadeIn">
                <span className="text-2xl font-bold" style={{ color: theme.primary }}>{word.hanzi}</span>
                <span className="mx-2 text-zinc-500">•</span>
                <span className="text-lg text-zinc-300 font-medium">{word.pinyin}</span>
                <p className="text-sm text-zinc-400 mt-1">{word.translations.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* MODE 5: Audio Quiz */}
        {quizMode === 'audio-quiz' && (
          <div className="space-y-5 w-full flex flex-col items-center">
            <div 
              className="p-5 rounded-full border animate-pulse"
              style={{
                backgroundColor: theme.lightBg,
                borderColor: `rgba(${theme.rgb}, 0.35)`
              }}
            >
              <AudioButton text={word.hanzi} size="lg" />
            </div>
            <p className="text-sm text-zinc-400">
              Listen to the Mandarin audio and enter the Hanzi character:
            </p>

            {isRevealed ? (
              <div className="space-y-2 animate-fadeIn text-center">
                <h1 className="text-5xl font-bold text-zinc-100 font-serif">{word.hanzi}</h1>
                <p className="text-xl font-medium" style={{ color: theme.primary }}>{word.pinyin}</p>
                <p className="text-zinc-300">{word.translations.join(', ')}</p>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-3">
                <DesktopInput
                  targetHanzi={word.hanzi}
                  onSuccess={() => {
                    setIsRevealed(true);
                  }}
                  disabled={isRevealed}
                />
                <button
                  type="button"
                  onClick={handleReveal}
                  className="flex items-center justify-center gap-1.5 mx-auto text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Don&apos;t know? Reveal character & meaning</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multiple-Choice Options for Hanzi-to-Meaning and Sentence-Context */}
      {(quizMode === 'hanzi-to-meaning' || quizMode === 'sentence-context') && !isRevealed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4">
          {choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => handleSelectChoice(choice)}
              className="p-3.5 text-left rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-200 text-sm font-medium transition-all duration-150 active:scale-98 flex items-center justify-between group cursor-pointer"
            >
              <span>{choice.translations.slice(0, 2).join(', ')}</span>
              <span className="text-xs text-zinc-400 font-sans group-hover:text-zinc-200">
                {choice.pinyin}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Reveal Button for Free-recall / Self-assessment */}
      {!isRevealed && quizMode !== 'hanzi-to-meaning' && quizMode !== 'sentence-context' && (
        <div className="flex justify-center my-3">
          <button
            type="button"
            onClick={handleReveal}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium border border-zinc-700 transition-colors cursor-pointer"
          >
            <Eye size={16} />
            <span>Reveal Answer</span>
          </button>
        </div>
      )}

      {/* Revealed View: Example Sentence & SM-2 Grading Buttons */}
      {isRevealed && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4 animate-fadeIn">
          {/* Example Sentence Section if not already shown in sentence-context */}
          {quizMode !== 'sentence-context' && word.exampleSentence && (
            <div className="p-3.5 bg-zinc-950/70 rounded-xl border border-zinc-800/80 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">Example:</span>
                <AudioButton text={word.exampleSentence.hanzi} size="sm" />
              </div>
              <p className="text-sm text-zinc-200 font-serif font-medium">
                {word.exampleSentence.hanzi}
              </p>
              <p className="text-xs text-zinc-400 italic">{word.exampleSentence.pinyin}</p>
              <p className="text-xs text-zinc-400">{word.exampleSentence.translation}</p>
            </div>
          )}

          {/* SM-2 Spaced Repetition Grading Bar */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-400 text-center font-medium">
              Rate your recall (SM-2 Spaced Repetition):
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onGrade(0)}
                className="flex flex-col items-center py-2.5 px-1 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold">Again</span>
                <span className="text-[10px] text-rose-400/80 mt-0.5">&lt; 1 day</span>
              </button>

              <button
                type="button"
                onClick={() => onGrade(2)}
                className="flex flex-col items-center py-2.5 px-1 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold">Hard</span>
                <span className="text-[10px] text-amber-400/80 mt-0.5">1-2 days</span>
              </button>

              <button
                type="button"
                onClick={() => onGrade(4)}
                className="flex flex-col items-center py-2.5 px-1 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-800/40 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold">Good</span>
                <span className="text-[10px] text-blue-400/80 mt-0.5">3-6 days</span>
              </button>

              <button
                type="button"
                onClick={() => onGrade(5)}
                className="flex flex-col items-center py-2.5 px-1 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold">Easy</span>
                <span className="text-[10px] text-emerald-400/80 mt-0.5">&gt; 1 week</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
