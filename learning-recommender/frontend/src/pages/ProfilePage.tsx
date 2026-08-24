import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile, Skill } from '../lib/types';
import { ProfileFields } from '../components/ProfileFields';
import './ProfilePage.css';

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

      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? 'Failed to load profile.');
        setLoading(false);
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

      setLoading(false);
    }

    load();
  }, [session.access_token]);

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
      body: JSON.stringify({ skills, interests, goals, bio: bio.trim() || null }),
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
      {message && <p className="auth-message">{message}</p>}

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
