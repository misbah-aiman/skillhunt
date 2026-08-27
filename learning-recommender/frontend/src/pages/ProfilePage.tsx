import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile, Skill } from '../lib/types';
import { ProfileFields } from '../components/ProfileFields';
import { Spinner } from '../components/Spinner';
import { primaryButtonClasses } from '../lib/ui';

interface ProfilePageProps {
  session: Session;
}

// Views and edits the signed-in user's existing profile.
export function ProfilePage({ session }: ProfilePageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();

        if (!json.ok) {
          setError(json.error ?? 'Failed to load profile.');
          return;
        }

        const profile: Profile | null = json.profile;

        if (profile) {
          setExists(true);
          setSkills(profile.skills);
          setInterests(profile.interests);
          setGoals(profile.goals);
          setBio(profile.bio ?? '');
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setError(`Failed to reach the server: ${detail}`);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [session.access_token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: exists ? 'PUT' : 'POST',
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

      setExists(true);
      setSkills(json.profile.skills);
      setInterests(json.profile.interests);
      setGoals(json.profile.goals);
      setBio(json.profile.bio ?? '');
      setMessage('Profile saved.');
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading profile..." />
      </div>
    );
  }

  return (
    <form className="mx-auto flex w-full max-w-lg flex-col gap-6 text-left" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-semibold text-stone-800">Your Profile</h1>

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
      {message && <p className="animate-scale-in text-sm font-medium text-emerald-700">{message}</p>}

      <button type="submit" disabled={saving} className={`${primaryButtonClasses} self-start`}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
