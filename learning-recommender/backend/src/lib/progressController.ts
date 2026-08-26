import { supabase } from "./supabase.js";
import { toProgress, type Progress, type ProgressRow } from "./types.js";

export interface MarkCompleteResult {
  progress: Progress | null;
  error: string | null;
  notFound?: boolean;
}

// Upserts on (user_id, topic_id): marking an already-completed topic
// complete again just refreshes completed_at rather than erroring.
export async function markComplete(userId: string, topicId: string): Promise<MarkCompleteResult> {
  const { data, error } = await supabase
    .from("progress")
    .upsert(
      {
        user_id: userId,
        topic_id: topicId,
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,topic_id" },
    )
    .select()
    .single();

  if (error) {
    // Postgres foreign_key_violation: topic_id doesn't reference a real topic.
    if (error.code === "23503") {
      return { progress: null, error: null, notFound: true };
    }

    return { progress: null, error: error.message };
  }

  return { progress: toProgress(data as ProgressRow), error: null };
}

export interface ProgressListResult {
  progress: Progress[] | null;
  error: string | null;
}

export async function getProgress(userId: string): Promise<ProgressListResult> {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { progress: null, error: error.message };
  }

  return { progress: (data as ProgressRow[]).map(toProgress), error: null };
}

export interface CompletedTopicsResult {
  topicIds: string[] | null;
  error: string | null;
}

export async function getCompletedTopics(userId: string): Promise<CompletedTopicsResult> {
  const { data, error } = await supabase
    .from("progress")
    .select("topic_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) {
    return { topicIds: null, error: error.message };
  }

  return { topicIds: (data as { topic_id: string }[]).map((row) => row.topic_id), error: null };
}
