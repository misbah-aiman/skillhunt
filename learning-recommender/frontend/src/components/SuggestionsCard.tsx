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

// Lets the user review and edit the AI's findings before they're written to
// the profile. gapsFound has no profile field to land in, so it's shown as
// read-only context rather than being editable alongside skills/topics.
export function SuggestionsCard({ session, skillsIdentified, gapsFound, topicsToAdd }: SuggestionsCardProps) {
  const [skills, setSkills] = useState<Skill[]>(skillsIdentified);
  const [topics, setTopics] = useState<string[]>(topicsToAdd);
  const [skillNameInput, setSkillNameInput] = useState('');
  const [skillLevelInput, setSkillLevelInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnything = skills.length > 0 || topics.length > 0;

  function removeSkill(index: number) {
    setSkills((s) => s.filter((_, i) => i !== index));
  }

  function addSkill() {
    const name = skillNameInput.trim();
    const level = skillLevelInput.trim();
    if (name && level) {
      setSkills((s) => [...s, { name, level }]);
    }
    setSkillNameInput('');
    setSkillLevelInput('');
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

    const res = await fetch('/api/chat/apply-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ skillsIdentified: skills, topicsToAdd: topics }),
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

  if (applied) {
    return (
      <div className="suggestions-card">
        <p className="auth-message">Added to your profile.</p>
      </div>
    );
  }

  return (
    <div className="suggestions-card">
      <h2>Based on our chat, here's what I suggest adding to your profile:</h2>

      <section>
        <h3>Skills</h3>
        <div className="tag-input">
          <input
            type="text"
            placeholder="Skill name"
            value={skillNameInput}
            onChange={(e) => setSkillNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <input
            type="text"
            placeholder="Level"
            value={skillLevelInput}
            onChange={(e) => setSkillLevelInput(e.target.value)}
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
            {skills.map((skill, index) => (
              <span className="tag" key={`${skill.name}-${index}`}>
                {skill.name} · {skill.level}
                <button type="button" onClick={() => removeSkill(index)} aria-label={`Remove ${skill.name}`}>
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

      {gapsFound.length > 0 && (
        <section>
          <h3>Gaps identified</h3>
          <ul className="gap-list">
            {gapsFound.map((gap, index) => (
              <li key={`${gap.skill}-${index}`}>
                <strong>{gap.skill}</strong> — {gap.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="auth-error">{error}</p>}

      <button type="button" onClick={handleApply} disabled={applying || !hasAnything}>
        {applying ? 'Adding...' : 'Confirm & Add to Profile'}
      </button>
    </div>
  );
}
