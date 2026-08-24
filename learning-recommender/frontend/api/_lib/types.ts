export interface Skill {
  name: string;
  level: string;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

// Maps to the public.topics table (see supabase/migrations). A
// browsable catalog entry, not owned by a particular user.
export interface Topic {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  prerequisites: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TopicRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: Difficulty;
  prerequisites: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function toTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    prerequisites: row.prerequisites,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type ResourceType = "video" | "article" | "course";

// Maps to the public.resources table (see supabase/migrations).
export interface Resource {
  id: string;
  topicId: string;
  title: string;
  url: string;
  type: ResourceType;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface ProfileRow {
  id: string;
  user_id: string;
  skills: Skill[];
  interests: string[];
  goals: string[];
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    skills: row.skills,
    interests: row.interests,
    goals: row.goals,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ProfileInput {
  skills: Skill[];
  interests: string[];
  goals: string[];
  bio?: string | null;
}

function isSkill(value: unknown): value is Skill {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Skill).name === "string" &&
    typeof (value as Skill).level === "string"
  );
}

export function isProfileInput(body: unknown): body is ProfileInput {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.skills) &&
    b.skills.every(isSkill) &&
    Array.isArray(b.interests) &&
    b.interests.every((i) => typeof i === "string") &&
    Array.isArray(b.goals) &&
    b.goals.every((g) => typeof g === "string") &&
    (b.bio === undefined || b.bio === null || typeof b.bio === "string")
  );
}
