import { getProfile } from "./profileController.js";
import { getCompletedTopics } from "./progressController.js";
import { supabase } from "./supabase.js";
import { getAllTopics } from "./topicController.js";
import { toLearningPath, type Difficulty, type LearningPath, type LearningPathRow, type Profile, type Topic } from "./types.js";

export interface RecommendedTopic {
  topic: Topic;
  score: number;
  matchedOn: string[];
  resourceCount: number;
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

// "Known" feeds both the completed-topics filter and the prerequisite check
// (prerequisites are stored as free-text topic titles — see the topics
// migration), so a topic counts as known either by a matching profile skill
// or by an explicit completed row in the progress table.
function buildKnownTopics(skills: Profile["skills"], completedTitles: string[]): Set<string> {
  const known = new Set(skills.map((skill) => normalize(skill.name)));
  for (const title of completedTitles) {
    known.add(normalize(title));
  }
  return known;
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

  const { topicIds: completedTopicIds, error: progressError } = await getCompletedTopics(userId);

  if (progressError) {
    return { recommendations: null, error: progressError };
  }

  const completedIdSet = new Set(completedTopicIds ?? []);
  const completedTitles = (topics ?? [])
    .filter((topic) => completedIdSet.has(topic.id))
    .map((topic) => topic.title);

  const known = buildKnownTopics(profile.skills, completedTitles);
  const goalsAndInterests = [...profile.goals, ...profile.interests];

  const ranked = (topics ?? [])
    .filter((topic) => !completedIdSet.has(topic.id)) // explicitly marked complete
    .filter((topic) => !known.has(normalize(topic.title))) // completed via skill match
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

  const resourceCounts = await getResourceCounts(ranked.map((entry) => entry.topic.id));
  const recommendations = ranked.map((entry) => ({
    ...entry,
    resourceCount: resourceCounts.get(entry.topic.id) ?? 0,
  }));

  return { recommendations, error: null };
}

// Counts resources per topic for just the final, already-ranked shortlist —
// cheap in practice since that list is capped at `limit`, unlike the full catalog.
async function getResourceCounts(topicIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (topicIds.length === 0) return counts;

  const { data, error } = await supabase.from("resources").select("topic_id").in("topic_id", topicIds);

  if (error || !data) return counts;

  for (const row of data as { topic_id: string }[]) {
    counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
  }

  return counts;
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
