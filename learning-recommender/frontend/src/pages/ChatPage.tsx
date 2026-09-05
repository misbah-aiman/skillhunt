import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ChatMessage } from '../lib/types';
import { SuggestionsCard } from '../components/SuggestionsCard';
import { PhoneIcon, SendIcon } from '../components/icons';
import { chatBubbleClasses, secondaryButtonClasses } from '../lib/ui';

const ASSISTANT_NAME = 'Alex';

const GREETING = `Hi, I'm ${ASSISTANT_NAME}! I'm here to learn about your skills and goals so I can recommend what to learn next. What are you working on?`;

// Shown only on an empty chat — an opening line is the hardest part of
// talking to an assistant, so offer three ways in.
const STARTERS = [
  "I'm learning web development",
  'I want to move into data science',
  'Help me spot my skill gaps',
];

const MAX_COMPOSER_HEIGHT = 140;

interface ChatPageProps {
  session: Session;
  onOpenCall?: () => void;
}

interface AvatarProps {
  /** Sizing + font-size utilities; the gradient and shape are fixed. */
  className?: string;
}

function AlexAvatar({ className = 'h-9 w-9 text-lg' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`animate-gradient-pan flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 bg-[length:200%_200%] shadow-[0_4px_12px_-4px_rgba(5,150,105,0.6)] ${className}`}
    >
      🤖
    </span>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-stone-400"
          style={{ animationDelay: `${index * 0.16}s` }}
        />
      ))}
    </span>
  );
}

export function ChatPage({ session, onOpenCall }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [suggestedGaps, setSuggestedGaps] = useState<string[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Alex populates suggestions on every turn, so ending the chat by hand is
  // just as valid a way to see the card as waiting for isComplete.
  const showSuggestions = ended || isComplete;
  const canSend = input.trim().length > 0 && !sending && !ended;

  // Scroll the transcript itself rather than the window, so the page chrome
  // (nav, header, composer) stays put as messages arrive.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, showSuggestions]);

  // Grow the composer with its content up to a few lines, then let it scroll.
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }, [input]);

  async function sendMessage(text: string) {
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    sendMessage(input.trim());
  }

  // Enter sends, Shift+Enter starts a new line — the convention every other
  // chat app has trained people to expect.
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) sendMessage(input.trim());
    }
  }

  function handleStarter(starter: string) {
    if (sending || ended) return;
    sendMessage(starter);
  }

  function handleReset() {
    setMessages([]);
    setInput('');
    setError(null);
    setEnded(false);
    setIsComplete(false);
    setSuggestedSkills([]);
    setSuggestedGaps([]);
    setSuggestedTopics([]);
    composerRef.current?.focus();
  }

  return (
    // dvh (not vh) so mobile browser chrome collapsing doesn't crop the
    // composer; the subtracted space is the app shell's nav + page padding.
    <div className="flex h-[calc(100dvh-17rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_18px_40px_-20px_rgba(41,37,36,0.28)] sm:h-[calc(100dvh-13rem)]">
      <header className="flex items-center justify-between gap-3 border-b border-stone-200/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50/60 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <AlexAvatar className="h-11 w-11 text-xl" />
          <div className="min-w-0">
            <h1 className="font-display text-base font-semibold leading-tight text-stone-800 sm:text-lg">
              {ASSISTANT_NAME}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="relative flex h-2 w-2 shrink-0">
                {!ended && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70 [animation-duration:2s]" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${ended ? 'bg-stone-400' : 'bg-emerald-500'}`}
                />
              </span>
              <span className="truncate">
                {sending ? `${ASSISTANT_NAME} is typing…` : ended ? 'Chat ended' : 'Online'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onOpenCall && !ended && (
            <button
              type="button"
              onClick={onOpenCall}
              aria-label={`Call ${ASSISTANT_NAME}`}
              title={`Call ${ASSISTANT_NAME}`}
              className="flex h-11 w-11 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
            >
              <PhoneIcon className="h-4.5 w-4.5" />
            </button>
          )}
          {ended ? (
            <button type="button" onClick={handleReset} className={`${secondaryButtonClasses} px-3`}>
              New chat
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEnded(true)}
              disabled={messages.length === 0 || sending}
              className={`${secondaryButtonClasses} px-3`}
            >
              End Chat
            </button>
          )}
        </div>
      </header>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${ASSISTANT_NAME}`}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <div className="animate-fade-up flex items-end gap-2">
            <AlexAvatar className="h-8 w-8 text-base" />
            <div className={chatBubbleClasses('assistant')}>{GREETING}</div>
          </div>

          {messages.length === 0 && (
            <div className="animate-fade-up flex flex-wrap gap-2 pl-10" style={{ animationDelay: '120ms' }}>
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => handleStarter(starter)}
                  disabled={sending || ended}
                  className="rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-sm active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) =>
            message.role === 'assistant' ? (
              <div className="animate-fade-up flex items-end gap-2" key={index}>
                <AlexAvatar className="h-8 w-8 text-base" />
                <div className={chatBubbleClasses('assistant')}>{message.content}</div>
              </div>
            ) : (
              <div className="animate-fade-up flex justify-end" key={index}>
                <div className={chatBubbleClasses('user')}>{message.content}</div>
              </div>
            ),
          )}

          {sending && (
            <div className="animate-fade-up flex items-end gap-2">
              <AlexAvatar className="h-8 w-8 text-base" />
              <div className={chatBubbleClasses('assistant')}>
                <span className="sr-only">{ASSISTANT_NAME} is typing</span>
                <TypingDots />
              </div>
            </div>
          )}

          {showSuggestions && (
            <SuggestionsCard
              session={session}
              skills={suggestedSkills}
              gaps={suggestedGaps}
              topics={suggestedTopics}
              assistantName={ASSISTANT_NAME}
            />
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="border-t border-rose-100 bg-rose-50/70 px-4 py-2 text-xs text-rose-700 sm:px-5">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-stone-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-5"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={composerRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={ended}
            placeholder={ended ? 'This chat has ended.' : `Message ${ASSISTANT_NAME}…`}
            aria-label={`Message ${ASSISTANT_NAME}`}
            className="max-h-35 min-h-11 w-full flex-1 resize-none rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm leading-relaxed text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 hover:border-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_16px_-6px_rgba(5,150,105,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_12px_20px_-6px_rgba(5,150,105,0.5)] active:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <SendIcon className="h-4.5 w-4.5 -translate-x-px translate-y-px" />
          </button>
        </div>
        {!ended && (
          <p className="mx-auto mt-1.5 hidden max-w-2xl text-[11px] text-stone-400 sm:block">
            Press <kbd className="font-sans font-medium text-stone-500">Enter</kbd> to send,{' '}
            <kbd className="font-sans font-medium text-stone-500">Shift + Enter</kbd> for a new line.
          </p>
        )}
      </form>
    </div>
  );
}
