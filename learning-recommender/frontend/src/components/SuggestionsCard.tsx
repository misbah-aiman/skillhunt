import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Skill } from '../lib/types';
import './SuggestionsCard.css';

export interface ChatGap {
  skill: string;
  reason: string;
}

interface SuggestionsCardProps {
  session: Session;
  skillsIdentified: Skill[];
  gapsFound: ChatGap[];
  topicsToAdd: string[];
}

export function SuggestionsCard({ session, skillsIdentified, gapsFound, topicsToAdd }: SuggestionsCardProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnything = skillsIdentified.length > 0 || topicsToAdd.length > 0;

  async function handleApply() {
    setApplying(true);
    setError(null);

    const res = await fetch('/api/chat/apply-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ skillsIdentified, topicsToAdd }),
    });
    const json = await res.json();

    if (!json.ok) {
      setError(json.error ?? 'Failed to update your profile.');
      setApplying(false);
      return;
    }

    setApplied(true);
    setApplying(false);
  }

  return (
    <div className="suggestions-card">
      <h2>Based on our chat, here's what I suggest adding to your profile:</h2>

      {skillsIdentified.length > 0 && (
        <section>
          <h3>Skills</h3>
          <div className="tag-list">
            {skillsIdentified.map((skill) => (
              <span className="tag" key={skill.name}>
                {skill.name} · {skill.level}
              </span>
            ))}
          </div>
        </section>
      )}

      {topicsToAdd.length > 0 && (
        <section>
          <h3>Topics</h3>
          <div className="tag-list">
            {topicsToAdd.map((topic) => (
              <span className="tag" key={topic}>
                {topic}
              </span>
            ))}
          </div>
        </section>
      )}

      {gapsFound.length > 0 && (
        <section>
          <h3>Gaps identified</h3>
          <ul className="gap-list">
            {gapsFound.map((gap) => (
              <li key={gap.skill}>
                <strong>{gap.skill}</strong> — {gap.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="auth-error">{error}</p>}

      {applied ? (
        <p className="auth-message">Added to your profile.</p>
      ) : (
        <button type="button" onClick={handleApply} disabled={applying || !hasAnything}>
          {applying ? 'Adding...' : 'Add to Profile'}
        </button>
      )}
    </div>
  );
}
