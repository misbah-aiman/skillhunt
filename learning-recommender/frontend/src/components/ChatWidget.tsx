import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ChatHistoryMessage, ChatMessage } from '../lib/types';
import { SuggestionsCard } from './SuggestionsCard';
import { Spinner } from './Spinner';
import { ChatBubbleIcon, CloseIcon, HistoryIcon, PhoneIcon } from './icons';
import { chatBubbleClasses, chatBubbleRowClasses, inputClasses, primaryButtonClasses } from '../lib/ui';

interface ChatWidgetProps {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCall: () => void;
}

const GREETING =
  "Hi, I'm Alex! I'm here to learn about your skills and goals so I can recommend what to learn next. What are you working on?";

type Mode = 'chat' | 'history';

function formatHistoryTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ChatWidget({ session, open, onOpenChange, onOpenCall }: ChatWidgetProps) {
  const [mode, setMode] = useState<Mode>('chat');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [suggestedGaps, setSuggestedGaps] = useState<string[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);

  const [history, setHistory] = useState<ChatHistoryMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending, mode, open]);

  useEffect(() => {
    if (!open || mode !== 'history') return;

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const res = await fetch('/api/chat', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();

        if (cancelled) return;

        if (!json.ok) {
          setHistoryError(json.error ?? 'Failed to load chat history.');
          return;
        }

        setHistory(json.messages ?? []);
      } catch (err) {
        if (cancelled) return;
        const detail = err instanceof Error ? err.message : String(err);
        setHistoryError(`Failed to reach the server: ${detail}`);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [open, mode, session.access_token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
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
      setIsComplete(Boolean(json.isComplete));
      setSuggestedSkills(json.suggestions?.skills ?? []);
      setSuggestedGaps(json.suggestions?.gaps ?? []);
      setSuggestedTopics(json.suggestions?.topics ?? []);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
    } finally {
      setSending(false);
    }
  }

  function handleCallClick() {
    onOpenChange(false);
    onOpenCall();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label="Chat with Alex"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-700 sm:right-6 sm:bottom-6"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="animate-fade-up fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-30 flex h-[70vh] max-h-[32rem] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96">
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg">🤖</div>
          <div>
            <p className="font-display text-sm font-semibold leading-tight text-stone-800">Alex</p>
            <p className="text-xs text-stone-500">Learning Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'history' ? 'chat' : 'history'))}
            aria-label={mode === 'history' ? 'Back to chat' : 'View chat history'}
            title="Chat history"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              mode === 'history' ? 'bg-emerald-100 text-emerald-700' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
            }`}
          >
            <HistoryIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleCallClick}
            aria-label="Call Alex"
            title="Call Alex"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
          >
            <PhoneIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close chat"
            title="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mode === 'history' ? (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {historyLoading && (
            <div className="flex items-center justify-center py-10">
              <Spinner label="Loading history..." />
            </div>
          )}
          {!historyLoading && historyError && <p className="py-10 text-center text-sm text-rose-600">{historyError}</p>}
          {!historyLoading && !historyError && history.length === 0 && (
            <p className="py-10 text-center text-sm text-stone-500">No past conversations yet.</p>
          )}
          {!historyLoading && !historyError && history.length > 0 && (
            <div className="flex flex-col gap-3">
              {history.map((item) => (
                <div key={item.id} className={chatBubbleRowClasses(item.role)}>
                  <div className="max-w-[85%]">
                    <div className={chatBubbleClasses(item.role)}>{item.message}</div>
                    <p className={`mt-0.5 text-[11px] text-stone-400 ${item.role === 'user' ? 'text-right' : ''}`}>
                      {formatHistoryTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className={chatBubbleRowClasses('assistant')}>
                <div className={chatBubbleClasses('assistant')}>{GREETING}</div>
              </div>
            )}
            {messages.map((message, index) => (
              <div className={chatBubbleRowClasses(message.role)} key={index}>
                <div className={chatBubbleClasses(message.role)}>{message.content}</div>
              </div>
            ))}
            {sending && (
              <div className={chatBubbleRowClasses('assistant')}>
                <div className={`${chatBubbleClasses('assistant')} flex items-center`}>
                  <Spinner size={14} label="Thinking..." />
                </div>
              </div>
            )}
            {isComplete && (
              <SuggestionsCard session={session} skills={suggestedSkills} gaps={suggestedGaps} topics={suggestedTopics} />
            )}
            <div ref={bottomRef} />
          </div>

          {error && <p className="px-4 pb-1 text-xs text-rose-600">{error}</p>}

          <form className="flex gap-2 border-t border-stone-200 p-3" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              className={`${inputClasses} flex-1`}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className={primaryButtonClasses}
            >
              <ChatBubbleIcon className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
