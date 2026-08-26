import { useCallback, useEffect, useRef, useState } from 'react';

// The Web Speech API isn't in TypeScript's DOM lib, so it's declared here
// with just the surface this hook actually uses.
interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseSpeechRecognitionResult {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

// Firefox has never shipped SpeechRecognition/webkitSpeechRecognition, so
// feature detection alone already yields isSupported: false there — this
// just gives that specific, common case a clearer message than the
// generic "not supported in this browser" fallback.
function isFirefox(): boolean {
  return typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
}

function unsupportedMessage(): string {
  return isFirefox()
    ? 'Voice input is not supported in Firefox. Try Chrome, Edge, or Safari instead.'
    : 'Voice input is not supported in this browser.';
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access was denied. Allow microphone permissions to use voice input.',
  'permission-denied': 'Microphone access was denied. Allow microphone permissions to use voice input.',
  'service-not-allowed': 'Speech recognition isn’t allowed in this context.',
  'no-speech': "Didn't catch that — no speech was detected.",
  'audio-capture': 'No microphone was found. Check that one is connected and enabled.',
  network: 'A network error interrupted speech recognition.',
  aborted: 'Voice input was stopped.',
};

// Wraps the browser's SpeechRecognition API: a fresh recognizer per
// listening session (rather than one long-lived instance), a transcript
// that resets at the start of each session, and error/permission handling
// mapped to messages a user can actually act on.
export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const SpeechRecognitionCtor = useRef(getSpeechRecognitionConstructor()).current;
  const isSupported = SpeechRecognitionCtor !== null;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(isSupported ? null : unsupportedMessage());

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError(unsupportedMessage());
      return;
    }

    if (isListening) return;

    setTranscript('');
    setError(null);

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        }
      }
      if (finalChunk) {
        setTranscript((prev) => `${prev} ${finalChunk}`.trim());
      }
    };

    recognition.onerror = (event) => {
      // "aborted" fires from our own stopListening()/unmount cleanup — not
      // a real failure, so it shouldn't surface as an error to the user.
      if (event.error !== 'aborted') {
        setError(ERROR_MESSAGES[event.error] ?? `Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError('Failed to start voice input. Try again.');
      setIsListening(false);
    }
  }, [SpeechRecognitionCtor, isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { transcript, isListening, startListening, stopListening, error, isSupported };
}
