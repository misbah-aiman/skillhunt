import { supabase } from "./supabase.js";
import { toTopic, type Difficulty, type Topic, type TopicRow } from "./types.js";

export interface TopicListResult {
  topics: Topic[] | null;
  error: string | null;
}

export interface TopicResult {
  topic: Topic | null;
  error: string | null;
  notFound?: boolean;
}

export interface TopicFilters {
  category?: string;
  difficulty?: Difficulty;
  search?: string;
}

export async function getAllTopics(filters: TopicFilters = {}): Promise<TopicListResult> {
  let query = supabase.from("topics").select("*");

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query.order("category", { ascending: true }).order("title", { ascending: true });

  if (error) {
    return { topics: null, error: error.message };
  }

  return { topics: (data as TopicRow[]).map(toTopic), error: null };
}

export async function getTopicById(id: string): Promise<TopicResult> {
  const { data, error } = await supabase.from("topics").select("*").eq("id", id).maybeSingle();

  if (error) {
    return { topic: null, error: error.message };
  }

  if (!data) {
    return { topic: null, error: null, notFound: true };
  }

  return { topic: toTopic(data as TopicRow), error: null };
}
