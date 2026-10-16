'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Eye, CheckCircle2, HelpCircle } from 'lucide-react';

interface HanziCanvasProps {
  hanzi: string;
  size?: number;
  mode?: 'quiz' | 'display';
  showOutline?: boolean;
  onQuizComplete?: () => void;
  className?: string;
}

export const HanziCanvas: React.FC<HanziCanvasProps> = ({
  hanzi,
  size = 200,
  mode = 'display',
  showOutline = true,
  onQuizComplete,
  className = '',
}) => {
  const characters = Array.from(hanzi.replace(/[^\u4e00-\u9fa5]/g, ''));
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [completedChars, setCompletedChars] = useState<boolean[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const writerInstanceRef = useRef<any>(null);

  const activeChar = characters[activeCharIndex] || characters[0] || '';

  // Initialize or reset completed states when hanzi changes
  useEffect(() => {
    setActiveCharIndex(0);
    setCompletedChars(new Array(characters.length).fill(false));
    setMistakes(0);
  }, [hanzi, characters.length]);

  useEffect(() => {
    let isMounted = true;

    async function setupWriter() {
      if (!containerRef.current || !activeChar) return;

      containerRef.current.innerHTML = '';

      try {
        const HanziWriterModule = await import('hanzi-writer');
        const HanziWriter = HanziWriterModule.default;

        if (!isMounted || !containerRef.current) return;

        const writer = HanziWriter.create(containerRef.current, activeChar, {
          width: size,
          height: size,
          padding: 16,
          showOutline: mode === 'quiz' ? showOutline : true,
          showCharacter: mode !== 'quiz',
          strokeColor: '#f43f5e',
          outlineColor: '#52525b',
          drawingColor: '#38bdf8',
          strokeAnimationSpeed: 1.2,
          delayBetweenStrokes: 150,
          highlightColor: '#22c55e',
        });

        writerInstanceRef.current = writer;

        if (mode === 'quiz') {
          writer.quiz({
            onMistake: (strokeData: any) => {
              setMistakes((prev) => prev + 1);
            },
            onCorrectStroke: () => {
              // Stroke correct
            },
            onComplete: (summary: any) => {
              setCompletedChars((prev) => {
                const next = [...prev];
                next[activeCharIndex] = true;
                return next;
              });

              // Check if there is a next character in multi-character word
              if (activeCharIndex + 1 < characters.length) {
                setTimeout(() => {
                  setActiveCharIndex((prev) => prev + 1);
                }, 400);
              } else {
                // Completed all characters
                if (onQuizComplete) {
                  setTimeout(() => {
                    onQuizComplete();
                  }, 500);
                }
              }
            },
          });
        }
      } catch (err) {
        console.error('Error loading HanziWriter:', err);
      }
    }

    setupWriter();

    return () => {
      isMounted = false;
    };
  }, [activeChar, activeCharIndex, size, mode, showOutline, characters.length, onQuizComplete]);

  const handleAnimate = () => {
    if (writerInstanceRef.current && !isAnimating) {
      setIsAnimating(true);
      writerInstanceRef.current.animateCharacter({
        onComplete: () => {
          setIsAnimating(false);
        },
      });
    }
  };

  const handleReset = () => {
    if (writerInstanceRef.current) {
      if (mode === 'quiz') {
        writerInstanceRef.current.quiz({
          onMistake: () => setMistakes((prev) => prev + 1),
          onComplete: () => {
            setCompletedChars((prev) => {
              const next = [...prev];
              next[activeCharIndex] = true;
              return next;
            });
            if (activeCharIndex + 1 < characters.length) {
              setActiveCharIndex((prev) => prev + 1);
            } else {
              onQuizComplete?.();
            }
          },
        });
      } else {
        writerInstanceRef.current.showCharacter();
      }
    }
  };

  const handleHint = () => {
    if (writerInstanceRef.current && mode === 'quiz') {
      writerInstanceRef.current.animateStroke(0);
    }
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Character switcher tabs for multi-character words */}
      {characters.length > 1 && (
        <div className="flex items-center gap-2 mb-3 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          {characters.map((char, idx) => (
            <button
              key={`${char}-${idx}`}
              type="button"
              onClick={() => setActiveCharIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeCharIndex === idx
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span>{char}</span>
              {completedChars[idx] && (
                <CheckCircle2 size={14} className="text-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Drawing Canvas Area with traditional Mi Zi Ge guidelines */}
      <div className="relative rounded-2xl bg-zinc-950 border-2 border-red-900/40 shadow-inner p-2 overflow-hidden">
        {/* Traditional Rice Grid (米字格) SVG overlay behind character */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="#dc2626" strokeDasharray="4,4" strokeWidth="1" />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="#dc2626" strokeDasharray="4,4" strokeWidth="1" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#dc2626" strokeDasharray="4,4" strokeWidth="1" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#dc2626" strokeDasharray="4,4" strokeWidth="1" />
        </svg>

        {/* HanziWriter target div */}
        <div ref={containerRef} className="cursor-crosshair touch-none" />
      </div>

      {/* Control Buttons & Feedback */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {mode === 'display' ? (
          <>
            <button
              type="button"
              onClick={handleAnimate}
              disabled={isAnimating}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors border border-zinc-700"
            >
              <Play size={13} className={isAnimating ? 'animate-spin' : ''} />
              <span>{isAnimating ? 'Writing...' : 'Play Stroke Order'}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700"
              title="Reset"
            >
              <RotateCcw size={14} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">
              Draw character with finger or mouse
            </span>
            <button
              type="button"
              onClick={handleHint}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-medium rounded-md border border-amber-500/30 transition-colors"
              title="Give stroke hint"
            >
              <HelpCircle size={13} />
              <span>Hint</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium rounded-md border border-zinc-700 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>

      {mode === 'quiz' && mistakes > 0 && (
        <p className="text-xs text-amber-400/80 mt-1">
          {mistakes} stroke {mistakes === 1 ? 'correction' : 'corrections'}
        </p>
      )}
    </div>
  );
};
