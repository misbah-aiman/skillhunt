import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ChatMessage } from '../lib/types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SuggestionsCard } from '../components/SuggestionsCard';
import { Spinner } from '../components/Spinner';
import { chatBubbleClasses, chatBubbleRowClasses, statusErrorClasses } from '../lib/ui';

interface CallPageProps {
  session: Session;
  onEndCall: () => void;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export function CallPage({ session, onEndCall }: CallPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callActive, setCallActive] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [suggestedGaps, setSuggestedGaps] = useState<string[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);

  const { transcript, isListening, startListening, stopListening, error: recognitionError, isSupported } =
    useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const wasListeningRef = useRef(false);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!callActive) return;

    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  // The mic captures one utterance per press: when isListening flips from
  // true to false (either the user pressed the mic again, or recognition
  // ended on its own after silence) and something was actually said, that's
  // the signal to send it — decoupling "how the utterance ended" from
  // "what happens next" so both paths behave the same way.
  useEffect(() => {
    if (wasListeningRef.current && !isListening && transcript.trim()) {
      sendMessage(transcript.trim());
    }
    wasListeningRef.current = isListening;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  async function sendMessage(text: string) {
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? 'Failed to get a response.');
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: json.reply }]);
      speak(json.reply);

      if (json.isComplete) {
        setIsComplete(true);
        setSuggestedSkills(json.suggestions?.skills ?? []);
        setSuggestedGaps(json.suggestions?.gaps ?? []);
        setSuggestedTopics(json.suggestions?.topics ?? []);
        setCallActive(false);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
    } finally {
      setSending(false);
    }
  }

  function handleMicClick() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function handleEndCall() {
    stopListening();
    stopSpeaking();
    setCallActive(false);
    onEndCall();
  }

  const micDisabled = !isSupported || sending || isSpeaking || !callActive;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center">
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-4xl transition-shadow ${isSpeaking ? 'animate-pulse-ring border-emerald-400' : ''}`}
        >
          🤖
        </div>
        <p className="font-mono text-xl font-bold tabular-nums text-stone-800">{formatDuration(elapsedSeconds)}</p>
        <p className="text-sm text-stone-500">
          {!callActive
            ? isComplete
              ? 'Assessment complete'
              : 'Call ended'
            : isSpeaking
              ? 'Alex is speaking...'
              : sending
                ? 'Alex is thinking...'
                : isListening
                  ? 'Listening...'
                  : 'Press the mic to talk'}
        </p>
      </div>

      {!isSupported && (
        <p className={`${statusErrorClasses} w-full rounded-xl bg-rose-50 py-4`}>
          {recognitionError ?? 'Voice input is not supported in this browser.'}
        </p>
      )}

      <div className="flex max-h-[45vh] w-full flex-col gap-3 overflow-y-auto px-1 py-2 text-left">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-stone-500">Press the mic and say hello to start your voice assessment.</p>
        )}
        {messages.map((message, index) => (
          <div className={chatBubbleRowClasses(message.role)} key={index}>
            <div className={chatBubbleClasses(message.role)}>{message.content}</div>
          </div>
        ))}
        {isListening && transcript && (
          <div className={chatBubbleRowClasses('user')}>
            <div className={`${chatBubbleClasses('user')} opacity-70`}>{transcript}</div>
          </div>
        )}
        {sending && (
          <div className={chatBubbleRowClasses('assistant')}>
            <div className={`${chatBubbleClasses('assistant')} flex items-center`}>
              <Spinner size={14} label="Thinking..." />
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      {(error || recognitionError) && isSupported && <p className="text-sm text-rose-600">{error ?? recognitionError}</p>}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleMicClick}
          disabled={micDisabled}
          aria-label={isListening ? 'Stop talking' : 'Start talking'}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isListening ? 'animate-pulse-ring bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
          style={isListening ? ({ '--pulse-ring-color': 'rgb(225 29 72 / 0.2)' } as CSSProperties) : undefined}
        >
          🎤
        </button>
        <button
          type="button"
          onClick={handleEndCall}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        >
          End Call
        </button>
      </div>

      {isComplete && (
        <SuggestionsCard session={session} skills={suggestedSkills} gaps={suggestedGaps} topics={suggestedTopics} />
      )}
    </div>
  );
}
