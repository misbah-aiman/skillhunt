import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile as ProfileData, Skill } from '../lib/types';
import './Profile.css';

interface ProfileProps {
  session: Session;
}

export function Profile({ session }: ProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? 'Failed to load profile.');
        setLoading(false);
        return;
      }

      const profile: ProfileData | null = json.profile;

      if (profile) {
        setExists(true);
        setSkills(profile.skills);
        setInterests(profile.interests);
        setGoals(profile.goals);
        setBio(profile.bio ?? '');
      }

      setLoading(false);
    }

    load();
  }, [session.access_token]);

  function addSkill() {
    setSkills((s) => [...s, { name: '', level: '' }]);
  }

  function updateSkill(index: number, field: keyof Skill, value: string) {
    setSkills((s) => s.map((skill, i) => (i === index ? { ...skill, [field]: value } : skill)));
  }

  function removeSkill(index: number) {
    setSkills((s) => s.filter((_, i) => i !== index));
  }

  function addInterest() {
    const value = interestInput.trim();
    if (value && !interests.includes(value)) {
      setInterests((i) => [...i, value]);
    }
    setInterestInput('');
  }

  function removeInterest(value: string) {
    setInterests((i) => i.filter((item) => item !== value));
  }

  function addGoal() {
    const value = goalInput.trim();
    if (value && !goals.includes(value)) {
      setGoals((g) => [...g, value]);
    }
    setGoalInput('');
  }

  function removeGoal(value: string) {
    setGoals((g) => g.filter((item) => item !== value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch('/api/profile', {
      method: exists ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        skills: skills.filter((s) => s.name.trim() && s.level.trim()),
        interests,
        goals,
        bio: bio.trim() || null,
      }),
    });
    const json = await res.json();

    if (!json.ok) {
      setError(json.error ?? 'Failed to save profile.');
      setSaving(false);
      return;
    }

    setExists(true);
    setSkills(json.profile.skills);
    setInterests(json.profile.interests);
    setGoals(json.profile.goals);
    setBio(json.profile.bio ?? '');
    setMessage('Profile saved.');
    setSaving(false);
  }

  if (loading) {
    return <p className="profile-status">Loading profile...</p>;
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <h1>Your Profile</h1>

      <section>
        <div className="profile-section-header">
          <h2>Skills</h2>
          <button type="button" className="link-button" onClick={addSkill}>
            + Add skill
          </button>
        </div>
        {skills.length === 0 && <p className="profile-empty">No skills added yet.</p>}
        {skills.map((skill, index) => (
          <div className="skill-row" key={index}>
            <input
              type="text"
              placeholder="Skill name"
              value={skill.name}
              onChange={(e) => updateSkill(index, 'name', e.target.value)}
            />
            <input
              type="text"
              placeholder="Level (e.g. beginner)"
              value={skill.level}
              onChange={(e) => updateSkill(index, 'level', e.target.value)}
            />
            <button type="button" className="link-button remove-button" onClick={() => removeSkill(index)}>
              Remove
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>Interests</h2>
        <div className="tag-input">
          <input
            type="text"
            placeholder="Add an interest"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addInterest();
              }
            }}
          />
          <button type="button" onClick={addInterest}>
            Add
          </button>
        </div>
        <div className="tag-list">
          {interests.map((interest) => (
            <span className="tag" key={interest}>
              {interest}
              <button type="button" onClick={() => removeInterest(interest)} aria-label={`Remove ${interest}`}>
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Goals</h2>
        <div className="tag-input">
          <input
            type="text"
            placeholder="Add a goal"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGoal();
              }
            }}
          />
          <button type="button" onClick={addGoal}>
            Add
          </button>
        </div>
        <div className="tag-list">
          {goals.map((goal) => (
            <span className="tag" key={goal}>
              {goal}
              <button type="button" onClick={() => removeGoal(goal)} aria-label={`Remove ${goal}`}>
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Bio</h2>
        <textarea
          rows={4}
          placeholder="Tell us about yourself"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </section>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-message">{message}</p>}

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
