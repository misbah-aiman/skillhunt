import { useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Skill } from '../lib/types';
import { ProfileFields } from '../components/ProfileFields';
import { primaryButtonClasses } from '../lib/ui';

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

    try {
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
        return;
      }

      onComplete();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full justify-center">
      <form className="animate-fade-up mx-auto flex w-full max-w-lg flex-col gap-6 text-left" onSubmit={handleSubmit}>
        <div>
          <span className="animate-float mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl shadow-[0_6px_14px_-4px_rgba(5,150,105,0.55)]">
            🎯
          </span>
          <h1 className="font-display text-2xl font-semibold text-stone-800">Welcome to SkillHunt</h1>
          <p className="mt-1 text-stone-500">Let's set up your profile so we can find the skills that find you the job.</p>
        </div>

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

        {error && <p className="animate-scale-in text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={saving} className={`${primaryButtonClasses} self-start`}>
          {saving ? 'Saving...' : 'Finish Setup'}
        </button>
      </form>
    </div>
  );
}
