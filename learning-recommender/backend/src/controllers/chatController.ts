import { ApiError, GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, Profile, Skill } from "../lib/types.js";
import { getProfile, updateProfile } from "../lib/profileController.js";

// Reads GEMINI_API_KEY from the environment — never hardcode the key.
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// "-preview" model: Google may change/retire it without the usual notice
// (gemini-3-pro-preview was already retired mid-development). Using flash
// because this API key's free tier has zero quota for the pro model
// (confirmed via a live 429: "limit: 0" on generate_content_free_tier
// for gemini-3.1-pro) — switch to a "-pro-" variant once billing is on.
const MODEL = "gemini-3-flash-preview";

// The onboarding persona: introduces itself, draws out the user's current
// skills/experience/goals, runs a short assessment, and — once it has
// enough to go on — finalizes skills/gaps/topic findings for the profile.
const SYSTEM_PROMPT = `You are Scout, SkillHunt's onboarding assistant, running a short skills assessment.

In this conversation you:
1. Introduce yourself briefly on your first turn and explain that you're here to
   assess the user's current skills and goals so SkillHunt can recommend what to
   learn next.
2. Ask about the user's current skills, experience level, and career or learning
   goals — one or two focused questions at a time, not a long form.
3. Once you have enough information (usually after a few exchanges), set
   assessmentComplete to true and finalize your findings.
4. Keep your reply warm and concise, focused on a single next question or step
   at a time until the assessment is complete.

On every turn, populate these fields from what's been said so far:
- skillsIdentified: skills the user already has, as stated or clearly implied.
  Leave empty until something concrete has come up.
- gapsFound: specific gaps between what the user has and what their stated
  goals require. Leave empty until you have enough to ground a gap in what
  they've actually told you.
- topicsToAdd: topic or interest names worth adding to the user's profile,
  based on the gaps you've found. Leave empty until assessmentComplete is true.

Only set assessmentComplete to true once you're confident in these findings —
don't rush it after a single message.`;

const CHAT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING, description: "The assistant's conversational reply to the user" },
    assessmentComplete: {
      type: Type.BOOLEAN,
      description: "True once enough is known to finalize skillsIdentified, gapsFound, and topicsToAdd",
    },
    skillsIdentified: {
      type: Type.ARRAY,
      description: "Skills the user already has, as stated or clearly implied in the conversation",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Skill name" },
          level: {
            type: Type.STRING,
            description: "The user's level at this skill, e.g. beginner/intermediate/advanced",
          },
        },
        required: ["name", "level"],
      },
    },
    gapsFound: {
      type: Type.ARRAY,
      description: "Specific gaps between the user's current skills and their stated goals",
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING, description: "The skill or topic identified as a gap" },
          reason: { type: Type.STRING, description: "Why this is a gap, grounded in what the user has said" },
        },
        required: ["skill", "reason"],
      },
    },
    topicsToAdd: {
      type: Type.ARRAY,
      description: "Topic or interest names to add to the user's profile, based on the gaps found",
      items: { type: Type.STRING },
    },
  },
  required: ["reply", "assessmentComplete", "skillsIdentified", "gapsFound", "topicsToAdd"],
};

export interface ChatGap {
  skill: string;
  reason: string;
}

interface ParsedChatResponse {
  reply: string;
  assessmentComplete: boolean;
  skillsIdentified: Skill[];
  gapsFound: ChatGap[];
  topicsToAdd: string[];
}

export interface ChatResult {
  reply: string | null;
  assessmentComplete: boolean | null;
  skillsIdentified: Skill[] | null;
  gapsFound: ChatGap[] | null;
  topicsToAdd: string[] | null;
  error: string | null;
}

function emptyResult(error: string): ChatResult {
  return {
    reply: null,
    assessmentComplete: null,
    skillsIdentified: null,
    gapsFound: null,
    topicsToAdd: null,
    error,
  };
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResult> {
  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: CHAT_RESPONSE_SCHEMA,
      },
    });

    if (!response.text) {
      return emptyResult("No response from Gemini");
    }

    const parsed = JSON.parse(response.text) as ParsedChatResponse;

    return {
      reply: parsed.reply,
      assessmentComplete: parsed.assessmentComplete,
      skillsIdentified: parsed.skillsIdentified,
      gapsFound: parsed.gapsFound,
      topicsToAdd: parsed.topicsToAdd,
      error: null,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        return emptyResult("Invalid Gemini API key");
      }

      if (error.status === 429) {
        return emptyResult("Rate limited by the Gemini API, try again shortly");
      }

      return emptyResult(error.message);
    }

    const fallbackMessage = error instanceof Error ? error.message : "Failed to get chat response";
    return emptyResult(fallbackMessage);
  }
}

export interface ApplySuggestionsInput {
  skillsIdentified?: Skill[];
  topicsToAdd?: string[];
}

export interface ApplySuggestionsResult {
  profile: Profile | null;
  error: string | null;
  notFound?: boolean;
}

// Adds a new skill, or replaces the level of an existing one (matched
// case-insensitively by name) — a re-assessment can update a stale level.
function mergeSkills(existing: Skill[], additions: Skill[]): Skill[] {
  const merged = [...existing];

  for (const addition of additions) {
    const index = merged.findIndex((skill) => skill.name.toLowerCase() === addition.name.toLowerCase());
    if (index === -1) {
      merged.push(addition);
    } else {
      merged[index] = addition;
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

// Applies confirmed chat suggestions to the learner's profile: skills
// merge into profile.skills, topics merge into profile.interests.
// gapsFound has no profile field to land in, so it's not applied here.
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

  const skills = input.skillsIdentified ? mergeSkills(existing.skills, input.skillsIdentified) : existing.skills;
  const interests = input.topicsToAdd ? mergeInterests(existing.interests, input.topicsToAdd) : existing.interests;

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
