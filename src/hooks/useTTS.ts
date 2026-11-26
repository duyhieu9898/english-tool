import { useCallback } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

// Module-level cache — avoids re-renders while handling async voice loading
let cachedVoice: SpeechSynthesisVoice | null = null;
let currentAudio: HTMLAudioElement | null = null;
let speakRequestId = 0;

function getEnglishVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => v.lang === 'en-US' && /natural|google/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null;
  return cachedVoice;
}

// Pre-load voices as early as possible
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    getEnglishVoice();
  };
}

function speakWithBrowser(text: string, rate: number) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  const voice = getEnglishVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function useTTS() {
  const speak = useCallback((text: string, options?: { rate?: number }) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const rate = options?.rate ?? 0.9;
    const requestId = ++speakRequestId;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const url = `${API_BASE_URL}/tts?text=${encodeURIComponent(trimmed)}&rate=${rate}`;
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onerror = () => {
      if (speakRequestId === requestId) {
        speakWithBrowser(trimmed, rate);
      }
    };

    audio.play().catch(() => {
      if (speakRequestId === requestId) {
        speakWithBrowser(trimmed, rate);
      }
    });
  }, []);

  return { speak };
}
