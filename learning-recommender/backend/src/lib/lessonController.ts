import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { supabase } from "./supabase.js";
import { toLesson, type Lesson, type LessonRow } from "./types.js";

// Reads GEMINI_API_KEY from the environment — never hardcode the key.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Keep in sync with chatController.ts's MODEL constant — same reasoning
// (gemini-1.5-flash retired, gemini-2.5-flash closed to new users).
const MODEL = "gemini-3.6-flash";

const SYSTEM_PROMPT = `You are an expert instructional designer writing in-app lesson content for
SkillHunt, a learning platform. Given a topic's title, description, category,
difficulty, and tags, produce a self-contained lesson covering exactly what
someone would need to actually learn the topic — not a list of external
resources.

Write:
- summary: a 2-4 sentence overview of what the topic covers and why it matters.
- keyConcepts: 4 to 6 of the most important concepts, each with a clear title
  and a thorough explanation (3-6 sentences) a learner could study from directly.
- examples: exactly 3 worked examples that make the concepts concrete. For a
  technical/programming topic, include real, runnable code in the "code" field
  and its language in "language" (e.g. "javascript", "python"). For a
  non-technical topic (design, product, business, etc.), leave "code" and
  "language" as empty strings and instead make "explanation" a detailed
  worked scenario or case study.
- quiz: exactly 5 multiple-choice practice questions, each with exactly 4
  options, a zero-based correctIndex, and an explanation of why that answer
  is correct.

Match the difficulty level given: beginner content should assume no prior
knowledge, advanced content can move quickly and go deep.`;

const LESSON_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING, description: "2-4 sentence overview of the topic" },
    keyConcepts: {
      type: SchemaType.ARRAY,
      description: "4-6 key concepts with title and explanation",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
        required: ["title", "explanation"],
      },
    },
    examples: {
      type: SchemaType.ARRAY,
      description: "Exactly 3 worked examples",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
          code: { type: SchemaType.STRING, description: "Code sample, or empty string if not applicable" },
          language: { type: SchemaType.STRING, description: "Language of the code, or empty string" },
        },
        required: ["title", "explanation", "code", "language"],
      },
    },
    quiz: {
      type: SchemaType.ARRAY,
      description: "Exactly 5 multiple-choice practice questions",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            description: "Exactly 4 answer options",
            items: { type: SchemaType.STRING },
          },
          correctIndex: { type: SchemaType.INTEGER, description: "Zero-based index of the correct option" },
          explanation: { type: SchemaType.STRING, description: "Why the correct answer is correct" },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
  },
  required: ["summary", "keyConcepts", "examples", "quiz"],
};

const model = genAI.getGenerativeModel({
  model: MODEL,
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: LESSON_RESPONSE_SCHEMA,
  },
});

interface TopicSummaryRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string;
  tags: string[];
}

interface GeneratedLesson {
  summary: string;
  keyConcepts: Lesson["keyConcepts"];
  examples: Lesson["examples"];
  quiz: Lesson["quiz"];
}

export interface LessonResult {
  lesson: Lesson | null;
  error: string | null;
  notFound?: boolean;
}

function isRetryable503(error: unknown): boolean {
  return error instanceof Error && error.message.includes("503");
}

async function generateLesson(topic: TopicSummaryRow): Promise<GeneratedLesson> {
  const prompt = [
    `Title: ${topic.title}`,
    topic.description ? `Description: ${topic.description}` : null,
    topic.category ? `Category: ${topic.category}` : null,
    `Difficulty: ${topic.difficulty}`,
    topic.tags.length > 0 ? `Tags: ${topic.tags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // A lesson is generated once ever per topic, so a transient overload on
  // the first person to open a given topic would otherwise be permanent
  // for everyone until someone retries — worth one retry here specifically.
  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (error) {
    if (!isRetryable503(error)) throw error;
    result = await model.generateContent(prompt);
  }

  const text = result.response.text();

  if (!text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(text) as GeneratedLesson;
}

// Generates a lesson for a topic on first request and caches it in
// public.lessons; every later call for the same topic reads the cached
// row instead of calling Gemini again. See docs/superpowers/specs/
// 2026-08-27-in-app-lesson-content-design.md for the full design.
export async function getOrGenerateLesson(topicId: string): Promise<LessonResult> {
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, title, description, category, difficulty, tags")
    .eq("id", topicId)
    .maybeSingle();

  if (topicError) {
    return { lesson: null, error: topicError.message };
  }

  if (!topic) {
    return { lesson: null, error: null, notFound: true };
  }

  const { data: existing, error: existingError } = await supabase
    .from("lessons")
    .select("*")
    .eq("topic_id", topicId)
    .maybeSingle();

  if (existingError) {
    return { lesson: null, error: existingError.message };
  }

  if (existing) {
    return { lesson: toLesson(existing as LessonRow), error: null };
  }

  let generated: GeneratedLesson;
  try {
    generated = await generateLesson(topic as TopicSummaryRow);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate lesson content";
    return { lesson: null, error: message };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("lessons")
    .insert({
      topic_id: topicId,
      summary: generated.summary,
      key_concepts: generated.keyConcepts,
      examples: generated.examples,
      quiz: generated.quiz,
    })
    .select("*")
    .single();

  if (insertError) {
    // Unique-violation: another request generated and inserted this topic's
    // lesson in the meantime. Read what they wrote instead of erroring.
    if (insertError.code === "23505") {
      const { data: raced, error: racedError } = await supabase
        .from("lessons")
        .select("*")
        .eq("topic_id", topicId)
        .maybeSingle();

      if (raced) {
        return { lesson: toLesson(raced as LessonRow), error: null };
      }
      if (racedError) {
        return { lesson: null, error: racedError.message };
      }
    }

    // Best-effort caching, same tradeoff chatController's saveMessage makes:
    // don't block the user on a save failure, just don't persist this time.
    console.error("Failed to save generated lesson:", insertError.message);
    return {
      lesson: {
        id: topicId,
        topicId,
        summary: generated.summary,
        keyConcepts: generated.keyConcepts,
        examples: generated.examples,
        quiz: generated.quiz,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      error: null,
    };
  }

  return { lesson: toLesson(inserted as LessonRow), error: null };
}
