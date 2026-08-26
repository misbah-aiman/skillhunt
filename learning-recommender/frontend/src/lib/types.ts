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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Maps to a row of the public.conversations table (see supabase/migrations)
// as returned by GET /api/chat — every message ever exchanged, not just the
// current live session.
export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  createdAt: string;
}

export interface RecommendedTopic {
  topic: Topic;
  score: number;
  matchedOn: string[];
  resourceCount: number;
}

// Maps to the public.learning_paths table (see supabase/migrations). One
// row per user — regenerating a path overwrites the previous one.
export interface LearningPath {
  id: string;
  userId: string;
  topicIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProgressStatus = "in_progress" | "completed";

// Maps to the public.progress table (see supabase/migrations). One row
// per (user, topic) tracking how far the learner has gotten on it.
export interface Progress {
  id: string;
  userId: string;
  topicId: string;
  status: ProgressStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ConversationStatus = "in_progress" | "completed";

// Maps to the public.conversations table (see supabase/migrations).
// Chat history for the onboarding assistant, scoped per user.
export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
}
