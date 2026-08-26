import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Spinner } from './Spinner';
import { Tag } from './Tag';
import { cardClasses, inputClasses, primaryButtonClasses, secondaryButtonClasses } from '../lib/ui';

interface SuggestionsCardProps {
  session: Session;
  skills: string[];
  gaps: string[];
  topics: string[];
}

// Lets the user review and edit Alex's findings before they're written to
// the profile. gaps has no profile field to land in, so it's shown as
// read-only context rather than being editable alongside skills/topics.
export function SuggestionsCard({ session, skills: initialSkills, gaps, topics: initialTopics }: SuggestionsCardProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [skillInput, setSkillInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnything = skills.length > 0 || topics.length > 0;

  function removeSkill(name: string) {
    setSkills((s) => s.filter((item) => item !== name));
  }

  function addSkill() {
    const value = skillInput.trim();
    if (value && !skills.includes(value)) {
      setSkills((s) => [...s, value]);
    }
    setSkillInput('');
  }

  function removeTopic(topic: string) {
    setTopics((t) => t.filter((item) => item !== topic));
  }

  function addTopic() {
    const value = topicInput.trim();
    if (value && !topics.includes(value)) {
      setTopics((t) => [...t, value]);
    }
    setTopicInput('');
  }

  async function handleApply() {
    setApplying(true);
    setError(null);

    try {
      const res = await fetch('/api/chat/apply-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ skills, topics }),
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? 'Failed to update your profile.');
        return;
      }

      setApplied(true);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
    } finally {
      setApplying(false);
    }
  }

  if (applied) {
    return (
      <div className={`${cardClasses} mt-6 animate-fade-up border-emerald-200 bg-emerald-50`}>
        <p className="text-sm font-medium text-emerald-800">Added to your profile.</p>
      </div>
    );
  }

  return (
    <div className={`${cardClasses} mt-6 flex animate-fade-up flex-col gap-4 border-emerald-200 bg-emerald-50/40`}>
      <h2 className="font-display text-lg text-stone-800">
        Based on our chat, here's what Alex suggests adding to your profile:
      </h2>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Skills</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Add a skill"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
            className={`${inputClasses} min-w-36 flex-1`}
          />
          <button type="button" onClick={addSkill} className={secondaryButtonClasses}>
            Add
          </button>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-stone-500">No skills selected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Tag key={skill} label={skill} onRemove={() => removeSkill(skill)}>
                {skill}
              </Tag>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Topics</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Add a topic"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTopic();
              }
            }}
            className={`${inputClasses} min-w-36 flex-1`}
          />
          <button type="button" onClick={addTopic} className={secondaryButtonClasses}>
            Add
          </button>
        </div>
        {topics.length === 0 ? (
          <p className="text-sm text-stone-500">No topics selected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Tag key={topic} label={topic} onRemove={() => removeTopic(topic)}>
                {topic}
              </Tag>
            ))}
          </div>
        )}
      </section>

      {gaps.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Gaps identified</h3>
          <ul className="flex flex-col gap-1 pl-5 text-sm text-stone-600">
            {gaps.map((gap, index) => (
              <li key={index} className="list-disc">
                {gap}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="button"
        onClick={handleApply}
        disabled={applying || !hasAnything}
        className={`${primaryButtonClasses} self-start`}
      >
        {applying ? <Spinner size={14} label="Adding..." /> : 'Confirm & Add to Profile'}
      </button>
    </div>
  );
}
