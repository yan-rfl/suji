'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, ArrowRight, Keyboard } from 'lucide-react';
import { useLevel } from '@/context/LevelContext';

interface DesktopInputProps {
  targetHanzi: string;
  onSuccess: () => void;
  onFail?: () => void;
  disabled?: boolean;
}

export const DesktopInput: React.FC<DesktopInputProps> = ({
  targetHanzi,
  onSuccess,
  onFail,
  disabled = false,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useLevel();

  // Auto focus input on mount or target change
  useEffect(() => {
    setInputVal('');
    setHasEvaluated(false);
    setIsCorrect(null);
    inputRef.current?.focus();
  }, [targetHanzi]);

  const cleanText = (str: string) => str.replace(/\s+/g, '').trim();

  const handleVerify = () => {
    if (disabled || !inputVal.trim()) return;

    const cleanedInput = cleanText(inputVal);
    const cleanedTarget = cleanText(targetHanzi);

    const matches = cleanedInput === cleanedTarget;
    setHasEvaluated(true);
    setIsCorrect(matches);

    if (matches) {
      setTimeout(() => {
        onSuccess();
      }, 400);
    } else {
      onFail?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Avoid submitting while Chinese IME composition is actively selecting candidates
    if (isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <Keyboard size={14} className="text-zinc-500 dark:text-zinc-400" />
        <span>Type using your Chinese Pinyin IME:</span>
      </div>

      <div className="w-full relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          disabled={disabled || (hasEvaluated && isCorrect === true)}
          onChange={(e) => {
            setInputVal(e.target.value);
            if (hasEvaluated) {
              setHasEvaluated(false);
              setIsCorrect(null);
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            setInputVal((e.target as HTMLInputElement).value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="例如: 你好..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className={`w-full px-5 py-3.5 text-center text-2xl font-medium rounded-2xl bg-white dark:bg-zinc-900 border-2 transition-all outline-none shadow-sm ${
            hasEvaluated
              ? isCorrect
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                : 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20'
              : 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600'
          }`}
          style={
            !hasEvaluated
              ? {
                  borderColor: undefined,
                }
              : undefined
          }
        />

        {/* Verification indicator icon */}
        {hasEvaluated && (
          <div className="absolute right-4 flex items-center">
            {isCorrect ? (
              <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Check size={20} />
              </span>
            ) : (
              <span className="p-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <X size={20} />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          onClick={handleVerify}
          disabled={disabled || !inputVal.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
          style={{
            backgroundColor: theme.primary,
            boxShadow: `0 4px 14px rgba(${theme.rgb}, 0.35)`
          }}
        >
          <span>Verify Hanzi</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {hasEvaluated && !isCorrect && (
        <div className="text-sm text-rose-600 dark:text-rose-400 animate-fadeIn">
          Target character was: <span className="font-bold text-lg text-zinc-900 dark:text-white ml-1">{targetHanzi}</span>
        </div>
      )}
    </div>
  );
};
