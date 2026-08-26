import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ChatMessage } from '../lib/types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SuggestionsCard } from '../components/SuggestionsCard';
import { Spinner } from '../components/Spinner';
import './CallPage.css';

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
    <div className="call-page">
      <div className="call-avatar-wrap">
        <div className={`call-avatar${isSpeaking ? ' call-avatar-speaking' : ''}`}>🤖</div>
        <p className="call-timer">{formatDuration(elapsedSeconds)}</p>
        <p className="call-status">
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
        <p className="status-block status-error call-unsupported-warning">
          {recognitionError ?? 'Voice input is not supported in this browser.'}
        </p>
      )}

      <div className="call-transcript">
        {messages.length === 0 && (
          <p className="chat-empty">Press the mic and say hello to start your voice assessment.</p>
        )}
        {messages.map((message, index) => (
          <div className={`chat-bubble-row chat-bubble-row-${message.role}`} key={index}>
            <div className={`chat-bubble chat-bubble-${message.role}`}>{message.content}</div>
          </div>
        ))}
        {isListening && transcript && (
          <div className="chat-bubble-row chat-bubble-row-user">
            <div className="chat-bubble chat-bubble-user chat-bubble-pending">{transcript}</div>
          </div>
        )}
        {sending && (
          <div className="chat-bubble-row chat-bubble-row-assistant">
            <div className="chat-bubble chat-bubble-assistant chat-bubble-pending">
              <Spinner size={14} label="Thinking..." />
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      {(error || recognitionError) && isSupported && <p className="auth-error chat-error">{error ?? recognitionError}</p>}

      <div className="call-controls">
        <button
          type="button"
          className={`call-mic-button${isListening ? ' call-mic-button-active' : ''}`}
          onClick={handleMicClick}
          disabled={micDisabled}
          aria-label={isListening ? 'Stop talking' : 'Start talking'}
        >
          🎤
        </button>
        <button type="button" className="call-end-button" onClick={handleEndCall}>
          End Call
        </button>
      </div>

      {isComplete && (
        <SuggestionsCard session={session} skills={suggestedSkills} gaps={suggestedGaps} topics={suggestedTopics} />
      )}
    </div>
  );
}
