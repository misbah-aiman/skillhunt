import { supabase } from "./supabase.js";
import { toProfile, type Profile, type ProfileInput, type ProfileRow } from "./types.js";

export interface ProfileResult {
  profile: Profile | null;
  error: string | null;
  conflict?: boolean;
  notFound?: boolean;
}

export async function getProfile(userId: string): Promise<ProfileResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data ? toProfile(data as ProfileRow) : null, error: null };
}

export async function createProfile(userId: string, input: ProfileInput): Promise<ProfileResult> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      skills: input.skills,
      interests: input.interests,
      goals: input.goals,
      bio: input.bio ?? null,
    })
    .select()
    .single();

  if (error) {
    // Postgres unique_violation: a profile already exists for this user.
    const conflict = error.code === "23505";
    return { profile: null, error: error.message, conflict };
  }

  return { profile: toProfile(data as ProfileRow), error: null };
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<ProfileResult> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      skills: input.skills,
      interests: input.interests,
      goals: input.goals,
      bio: input.bio ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  if (!data) {
    return { profile: null, error: null, notFound: true };
  }

  return { profile: toProfile(data as ProfileRow), error: null };
}
