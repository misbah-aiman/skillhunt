import { getProfile } from "./profileController.js";
import { supabase } from "./supabase.js";
import { getAllTopics } from "./topicController.js";
import { toLearningPath, type Difficulty, type LearningPath, type LearningPathRow, type Profile, type Topic } from "./types.js";

export interface RecommendedTopic {
  topic: Topic;
  score: number;
  matchedOn: string[];
}

export interface RecommendationsResult {
  recommendations: RecommendedTopic[] | null;
  error: string | null;
  notFound?: boolean;
}

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// There's no separate completion-tracking table yet, so a same-named skill
// on the profile is the closest signal we have for "already covered" —
// this doubles as both the completed-topics filter and the prerequisite check,
// since prerequisites are stored as free-text topic titles (see the topics migration).
function buildKnownTopics(skills: Profile["skills"]): Set<string> {
  return new Set(skills.map((skill) => normalize(skill.name)));
}

function prerequisitesMet(topic: Topic, known: Set<string>): boolean {
  return topic.prerequisites.every((prerequisite) => known.has(normalize(prerequisite)));
}

// A tag match is a strong, deliberate signal (the topic was authored with
// that keyword in mind); category/title matches are weaker but still relevant.
function scoreTopic(topic: Topic, goalsAndInterests: string[]): { score: number; matchedOn: string[] } {
  let score = 0;
  const matchedOn = new Set<string>();

  for (const raw of goalsAndInterests) {
    const term = normalize(raw);
    if (!term) continue;

    let matched = false;

    if (topic.tags.some((tag) => normalize(tag).includes(term) || term.includes(normalize(tag)))) {
      score += 2;
      matched = true;
    }

    if (topic.category && (normalize(topic.category).includes(term) || term.includes(normalize(topic.category)))) {
      score += 1;
      matched = true;
    }

    if (normalize(topic.title).includes(term)) {
      score += 1;
      matched = true;
    }

    if (matched) {
      matchedOn.add(raw);
    }
  }

  return { score, matchedOn: [...matchedOn] };
}

const DEFAULT_LIMIT = 20;

export async function getRecommendations(userId: string, limit: number = DEFAULT_LIMIT): Promise<RecommendationsResult> {
  const { profile, error: profileError } = await getProfile(userId);

  if (profileError) {
    return { recommendations: null, error: profileError };
  }

  if (!profile) {
    return { recommendations: null, error: null, notFound: true };
  }

  const { topics, error: topicsError } = await getAllTopics();

  if (topicsError) {
    return { recommendations: null, error: topicsError };
  }

  const known = buildKnownTopics(profile.skills);
  const goalsAndInterests = [...profile.goals, ...profile.interests];

  const recommendations = (topics ?? [])
    .filter((topic) => !known.has(normalize(topic.title))) // already completed
    .filter((topic) => prerequisitesMet(topic, known)) // prerequisites satisfied
    .map((topic) => ({ topic, ...scoreTopic(topic, goalsAndInterests) }))
    .filter((entry) => entry.score > 0) // must match a stated goal/interest
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const difficultyDelta = DIFFICULTY_RANK[a.topic.difficulty] - DIFFICULTY_RANK[b.topic.difficulty];
      if (difficultyDelta !== 0) return difficultyDelta;

      return a.topic.title.localeCompare(b.topic.title);
    })
    .slice(0, limit);

  return { recommendations, error: null };
}

export interface GenerateLearningPathResult {
  learningPath: LearningPath | null;
  recommendations: RecommendedTopic[] | null;
  error: string | null;
  notFound?: boolean;
}

// Runs the same scoring as getRecommendations and persists the ordering as
// this user's learning path — one row per user, overwritten on regeneration.
export async function generateLearningPath(userId: string, limit: number = DEFAULT_LIMIT): Promise<GenerateLearningPathResult> {
  const { recommendations, error, notFound } = await getRecommendations(userId, limit);

  if (notFound) {
    return { learningPath: null, recommendations: null, error: null, notFound: true };
  }

  if (error) {
    return { learningPath: null, recommendations: null, error };
  }

  const topicIds = (recommendations ?? []).map((entry) => entry.topic.id);

  const { data, error: saveError } = await supabase
    .from("learning_paths")
    .upsert({ user_id: userId, topic_ids: topicIds, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    .select()
    .single();

  if (saveError) {
    return { learningPath: null, recommendations: null, error: saveError.message };
  }

  return { learningPath: toLearningPath(data as LearningPathRow), recommendations, error: null };
}
