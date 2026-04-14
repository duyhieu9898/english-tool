import { useCallback } from 'react';

// Module-level cache — avoids re-renders while handling async voice loading
let cachedVoice: SpeechSynthesisVoice | null = null;

function getEnglishVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
  return cachedVoice;
}

// Pre-load voices as early as possible
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null; // reset to re-pick on next speak()
    getEnglishVoice();
  };
}

export function useTTS() {
  const speak = useCallback((text: string, options?: { rate?: number }) => {
    if (!('speechSynthesis' in window)) throw new Error('Speech synthesis not supported');

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = options?.rate ?? 0.9;

    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak };
}
