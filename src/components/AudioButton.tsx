'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { tts } from '@/lib/tts';
import { useLevel } from '@/context/LevelContext';

interface AudioButtonProps {
  text: string;
  rate?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  rate = 0.85,
  size = 'md',
  className = '',
  showLabel = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { theme } = useLevel();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      tts.stop();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    tts.speak(text, {
      rate,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const sizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 22,
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={`Listen to pronunciation for ${text}`}
      title="Listen to native Mandarin pronunciation"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
        isPlaying
          ? 'text-white shadow-md ring-2 ring-white/40'
          : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/60'
      } ${sizeClasses[size]} ${className}`}
      style={
        isPlaying
          ? {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
              boxShadow: `0 2px 10px rgba(${theme.rgb}, 0.45)`,
            }
          : undefined
      }
    >
      <Volume2
        size={iconSizes[size]}
        className={isPlaying ? 'animate-pulse text-white' : ''}
      />
      {showLabel && (
        <span className="font-medium text-xs pr-1">
          {isPlaying ? 'Playing...' : 'Audio'}
        </span>
      )}
    </button>
  );
};
