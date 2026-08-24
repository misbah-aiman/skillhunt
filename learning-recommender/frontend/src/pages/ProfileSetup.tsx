import { useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Skill } from '../lib/types';
import { ProfileFields } from '../components/ProfileFields';
import './ProfilePage.css';
import './ProfileSetup.css';

interface ProfileSetupProps {
  session: Session;
  onComplete: () => void;
}

// Shown once, right after first sign-in, until the user has a profile row.
export function ProfileSetup({ session, onComplete }: ProfileSetupProps) {
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ skills, interests, goals, bio: bio.trim() || null }),
    });
    const json = await res.json();

    if (!json.ok) {
      setError(json.error ?? 'Failed to save profile.');
      setSaving(false);
      return;
    }

    onComplete();
  }

  return (
    <div className="profile-setup">
      <form className="profile-form" onSubmit={handleSubmit}>
        <h1>Welcome to SkillHunt</h1>
        <p className="profile-setup-intro">
          Let's set up your profile so we can find the skills that find you the job.
        </p>

        <ProfileFields
          skills={skills}
          onSkillsChange={setSkills}
          interests={interests}
          onInterestsChange={setInterests}
          goals={goals}
          onGoalsChange={setGoals}
          bio={bio}
          onBioChange={setBio}
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Finish Setup'}
        </button>
      </form>
    </div>
  );
}
