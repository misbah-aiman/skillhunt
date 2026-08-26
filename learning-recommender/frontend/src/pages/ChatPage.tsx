import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ChatMessage } from '../lib/types';
import { SuggestionsCard } from '../components/SuggestionsCard';
import { Spinner } from '../components/Spinner';
import { chatBubbleClasses, chatBubbleRowClasses, inputClasses, primaryButtonClasses } from '../lib/ui';

interface ChatPageProps {
  session: Session;
}

export function ChatPage({ session }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [suggestedGaps, setSuggestedGaps] = useState<string[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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
      console.error('Chat request failed:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col text-left">
      <h1 className="mb-4 text-2xl font-semibold text-stone-800">Chat with Alex</h1>

      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-1 py-2">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-stone-500">Say hello to start your skills assessment.</p>
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
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          className={`${inputClasses} flex-1`}
        />
        <button type="submit" disabled={sending || !input.trim()} className={primaryButtonClasses}>
          Send
        </button>
      </form>

      {isComplete && (
        <SuggestionsCard session={session} skills={suggestedSkills} gaps={suggestedGaps} topics={suggestedTopics} />
      )}
    </div>
  );
}
