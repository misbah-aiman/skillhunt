import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Spinner } from './Spinner';
import './SuggestionsCard.css';

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
      <div className="suggestions-card">
        <p className="auth-message">Added to your profile.</p>
      </div>
    );
  }

  return (
    <div className="suggestions-card">
      <h2>Based on our chat, here's what Alex suggests adding to your profile:</h2>

      <section>
        <h3>Skills</h3>
        <div className="tag-input">
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
          />
          <button type="button" onClick={addSkill}>
            Add
          </button>
        </div>
        {skills.length === 0 ? (
          <p className="profile-empty">No skills selected.</p>
        ) : (
          <div className="tag-list">
            {skills.map((skill) => (
              <span className="tag" key={skill}>
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3>Topics</h3>
        <div className="tag-input">
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
          />
          <button type="button" onClick={addTopic}>
            Add
          </button>
        </div>
        {topics.length === 0 ? (
          <p className="profile-empty">No topics selected.</p>
        ) : (
          <div className="tag-list">
            {topics.map((topic) => (
              <span className="tag" key={topic}>
                {topic}
                <button type="button" onClick={() => removeTopic(topic)} aria-label={`Remove ${topic}`}>
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {gaps.length > 0 && (
        <section>
          <h3>Gaps identified</h3>
          <ul className="gap-list">
            {gaps.map((gap, index) => (
              <li key={index}>{gap}</li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="auth-error">{error}</p>}

      <button type="button" onClick={handleApply} disabled={applying || !hasAnything}>
        {applying ? <Spinner size={14} label="Adding..." /> : 'Confirm & Add to Profile'}
      </button>
    </div>
  );
}
