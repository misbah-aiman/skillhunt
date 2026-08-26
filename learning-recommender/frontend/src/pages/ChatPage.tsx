import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ChatMessage, Skill } from '../lib/types';
import { SuggestionsCard, type ChatGap } from '../components/SuggestionsCard';
import './ChatPage.css';

interface ChatPageProps {
  session: Session;
}

export function ChatPage({ session }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [skillsIdentified, setSkillsIdentified] = useState<Skill[]>([]);
  const [gapsFound, setGapsFound] = useState<ChatGap[]>([]);
  const [topicsToAdd, setTopicsToAdd] = useState<string[]>([]);
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
      setAssessmentComplete(Boolean(json.assessmentComplete));
      setSkillsIdentified(json.skillsIdentified ?? []);
      setGapsFound(json.gapsFound ?? []);
      setTopicsToAdd(json.topicsToAdd ?? []);
    } catch {
      setError('Failed to reach the server. Is it running?');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-page">
      <h1>Chat with Scout</h1>

      <div className="chat-log">
        {messages.length === 0 && <p className="chat-empty">Say hello to start your skills assessment.</p>}
        {messages.map((message, index) => (
          <div className={`chat-bubble-row chat-bubble-row-${message.role}`} key={index}>
            <div className={`chat-bubble chat-bubble-${message.role}`}>{message.content}</div>
          </div>
        ))}
        {sending && (
          <div className="chat-bubble-row chat-bubble-row-assistant">
            <div className="chat-bubble chat-bubble-assistant chat-bubble-pending">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="auth-error">{error}</p>}

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>

      {assessmentComplete && (
        <SuggestionsCard
          session={session}
          skillsIdentified={skillsIdentified}
          gapsFound={gapsFound}
          topicsToAdd={topicsToAdd}
        />
      )}
    </div>
  );
}
