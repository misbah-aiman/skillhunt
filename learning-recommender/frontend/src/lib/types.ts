export interface Skill {
  name: string;
  level: string;
}

// Maps to the public.profiles table (see supabase/migrations).
// Postgres columns are snake_case; this type uses the camelCase
// shape the app code works with.
export interface Profile {
  id: string;
  userId: string;
  skills: Skill[];
  interests: string[];
  goals: string[];
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}
