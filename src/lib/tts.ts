/**
 * Web Speech API wrapper for Native Mandarin Chinese (zh-CN) TTS
 */

class TTSManager {
  private voice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer Chinese voices (zh-CN, cmn-Hans-CN, zh)
    const chineseVoice =
      voices.find((v) => v.lang === 'zh-CN' || v.lang === 'zh_CN') ||
      voices.find((v) => v.lang.startsWith('zh') || v.lang.includes('cmn')) ||
      voices.find((v) => v.lang.toLowerCase().includes('chinese'));

    if (chineseVoice) {
      this.voice = chineseVoice;
      this.isInitialized = true;
    }
  }

  public speak(
    text: string,
    options?: {
      rate?: number; // 0.1 to 10, default 0.85 for clear pronunciation
      pitch?: number; // 0 to 2, default 1
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    }
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      options?.onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      if (!this.isInitialized) {
        this.initVoices();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = options?.rate ?? 0.85;
      utterance.pitch = options?.pitch ?? 1.0;

      if (this.voice) {
        utterance.voice = this.voice;
      }

      if (options?.onStart) utterance.onstart = options.onStart;
      if (options?.onEnd) utterance.onend = options.onEnd;
      if (options?.onError) utterance.onerror = options.onError;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('TTS playback error:', e);
      options?.onError?.(e);
      options?.onEnd?.();
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const tts = new TTSManager();
