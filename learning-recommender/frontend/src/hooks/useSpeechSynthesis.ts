import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

export interface UseSpeechSynthesisResult {
  speak: (text: string, options?: SpeakOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
}

const DEFAULT_RATE = 1;
const DEFAULT_PITCH = 1;

// Higher score wins: a same-locale voice, a local (not network) engine —
// generally lower latency and works offline — a browser-marked default,
// and a name that advertises itself as a premium/neural voice.
function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;

  if (/^en-us/i.test(voice.lang)) score += 2;
  if (voice.localService) score += 2;
  if (voice.default) score += 1;
  if (/natural|premium|enhanced|neural/i.test(voice.name)) score += 3;

  return score;
}

function pickBestEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const pool = english.length > 0 ? english : voices;

  return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
}

// Wraps the browser's SpeechSynthesis API: picks the best available English
// voice automatically, and makes sure only one utterance plays at a time —
// calling speak() again interrupts whatever's currently being read rather
// than queuing behind it.
export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    function loadVoices() {
      voicesRef.current = window.speechSynthesis.getVoices();
    }

    loadVoices();
    // Voices load asynchronously in most browsers — getVoices() can return
    // an empty array until this fires, sometimes well after mount.
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!isSupported || !text.trim()) return;

      // Only cancel (and only speak afterward) when something is actually
      // in progress — calling cancel() immediately before speak() with
      // nothing playing is a known source of dropped utterances in Chrome.
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? DEFAULT_RATE;
      utterance.pitch = options?.pitch ?? DEFAULT_PITCH;

      // voiceschanged may never have fired in this browser even though
      // voices are ready by now, so fall back to a fresh synchronous read.
      const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
      const voice = pickBestEnglishVoice(voices);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSpeaking };
}
