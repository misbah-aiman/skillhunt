import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { supabase } from "../lib/supabase.js";
import type { ChatMessage, Skill } from "../lib/types.js";
import { getProfile, updateProfile } from "../lib/profileController.js";

// Reads GEMINI_API_KEY from the environment — never hardcode the key.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// gemini-1.5-flash is fully retired for this API key, and gemini-2.5-flash
// is closed to new users — both confirmed via live 404s on generateContent,
// the second explicitly pointing at this as the replacement.
const MODEL = "gemini-3.6-flash";

// The onboarding persona: introduces itself, draws out the user's current
// skills/experience/goals/knowledge level one question at a time, and —
// after 6-8 exchanges — summarizes into suggestions for the profile.
const SYSTEM_PROMPT = `You are Nova, a friendly learning assistant for SkillHunt's Learning Recommender.

In this conversation you:
1. Ask about the user's current skills, interests, goals, and knowledge level —
   ONE focused question at a time, never a long form.
2. Keep every reply to 2-3 sentences at most — replies may be read aloud, so
   stay short and conversational.
3. After roughly 6-8 exchanges, once you have enough to go on, summarize what
   you've learned: set isComplete to true and populate suggestions.
4. Until isComplete is true, leave suggestions.skills, suggestions.gaps, and
   suggestions.topics empty.

On every turn, populate these fields from what's been said so far:
- suggestions.skills: skill names the user already has, as stated or clearly implied.
- suggestions.gaps: specific gaps between what the user has and their stated goals.
- suggestions.topics: topic or interest names worth adding to their profile.

Only set isComplete to true once you're confident in these findings — don't
rush it after a single exchange.`;

const CHAT_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: {
      type: SchemaType.STRING,
      description: "Nova's conversational reply to the user, 2-3 sentences max",
    },
    isComplete: {
      type: SchemaType.BOOLEAN,
      description: "True once enough is known to finalize suggestions",
    },
    suggestions: {
      type: SchemaType.OBJECT,
      properties: {
        skills: {
          type: SchemaType.ARRAY,
          description: "Skill names the user already has",
          items: { type: SchemaType.STRING },
        },
        gaps: {
          type: SchemaType.ARRAY,
          description: "Gaps between the user's current skills and their stated goals",
          items: { type: SchemaType.STRING },
        },
        topics: {
          type: SchemaType.ARRAY,
          description: "Topic or interest names to add to the user's profile",
          items: { type: SchemaType.STRING },
        },
      },
      required: ["skills", "gaps", "topics"],
    },
  },
  required: ["reply", "isComplete", "suggestions"],
};

const model = genAI.getGenerativeModel({
  model: MODEL,
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: CHAT_RESPONSE_SCHEMA,
  },
});

export interface ChatSuggestions {
  skills: string[];
  gaps: string[];
  topics: string[];
}

interface ParsedChatResponse {
  reply: string;
  isComplete: boolean;
  suggestions: ChatSuggestions;
}

export interface ChatResult {
  reply: string | null;
  isComplete: boolean | null;
  suggestions: ChatSuggestions | null;
  error: string | null;
}

function emptyResult(error: string): ChatResult {
  return { reply: null, isComplete: null, suggestions: null, error };
}

function isRetryable503(error: unknown): boolean {
  return error instanceof Error && error.message.includes("503");
}

// Best-effort: a save failure shouldn't break the conversation the user is
// actively having, so this logs rather than surfacing an error turn-to-turn.
async function saveMessage(userId: string, role: "user" | "assistant", message: string): Promise<void> {
  const { error } = await supabase.from("conversations").insert({ user_id: userId, role, message });

  if (error) {
    console.error("Failed to save chat message:", error.message);
  }
}

export async function sendChatMessage(userId: string, messages: ChatMessage[]): Promise<ChatResult> {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    await saveMessage(userId, "user", lastMessage.content);
  }

  const request = {
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
  };

  try {
    // One retry on a transient overload — mirrors lessonController's
    // getOrGenerateLesson, since a live chat turn shouldn't dead-end on a
    // momentary Gemini blip any more than a lesson generation should.
    let result;
    try {
      result = await model.generateContent(request);
    } catch (error) {
      if (!isRetryable503(error)) throw error;
      result = await model.generateContent(request);
    }

    const text = result.response.text();

    if (!text) {
      return emptyResult("No response from Gemini");
    }

    const parsed = JSON.parse(text) as ParsedChatResponse;

    await saveMessage(userId, "assistant", parsed.reply);

    return {
      reply: parsed.reply,
      isComplete: parsed.isComplete,
      suggestions: parsed.suggestions,
      error: null,
    };
  } catch (error) {
    const fallbackMessage = error instanceof Error ? error.message : "Failed to get chat response";
    return emptyResult(fallbackMessage);
  }
}

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  createdAt: string;
}

export interface ChatHistoryResult {
  messages: ChatHistoryMessage[] | null;
  error: string | null;
}

export async function getChatHistory(userId: string): Promise<ChatHistoryResult> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, role, message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return { messages: null, error: error.message };
  }

  const rows = data as { id: string; role: "user" | "assistant"; message: string; created_at: string }[];
  const messages = rows.map((row) => ({
    id: row.id,
    role: row.role,
    message: row.message,
    createdAt: row.created_at,
  }));

  return { messages, error: null };
}

export interface ApplySuggestionsInput {
  skills?: string[];
  topics?: string[];
}

export interface ApplySuggestionsResult {
  profile: Awaited<ReturnType<typeof getProfile>>["profile"];
  error: string | null;
  notFound?: boolean;
}

// Adds a new skill, or leaves an existing one alone (matched case-insensitively
// by name) — the chat only gives us names, not levels, so a name that's
// already on the profile keeps whatever level the user set for it.
function mergeSkills(existing: Skill[], additions: string[]): Skill[] {
  const merged = [...existing];

  for (const name of additions) {
    const alreadyHas = merged.some((skill) => skill.name.toLowerCase() === name.toLowerCase());
    if (!alreadyHas) {
      merged.push({ name, level: "beginner" });
    }
  }

  return merged;
}

function mergeInterests(existing: string[], additions: string[]): string[] {
  const merged = [...existing];

  for (const addition of additions) {
    if (!merged.some((interest) => interest.toLowerCase() === addition.toLowerCase())) {
      merged.push(addition);
    }
  }

  return merged;
}

// Applies confirmed chat suggestions to the learner's profile: skills merge
// into profile.skills, topics merge into profile.interests.
export async function applySuggestionsToProfile(
  userId: string,
  input: ApplySuggestionsInput,
): Promise<ApplySuggestionsResult> {
  const { profile: existing, error: getError } = await getProfile(userId);

  if (getError) {
    return { profile: null, error: getError };
  }

  if (!existing) {
    return { profile: null, error: null, notFound: true };
  }

  const skills = input.skills ? mergeSkills(existing.skills, input.skills) : existing.skills;
  const interests = input.topics ? mergeInterests(existing.interests, input.topics) : existing.interests;

  const { profile, error } = await updateProfile(userId, {
    skills,
    interests,
    goals: existing.goals,
    bio: existing.bio,
  });

  if (error) {
    return { profile: null, error };
  }

  return { profile, error: null };
}
