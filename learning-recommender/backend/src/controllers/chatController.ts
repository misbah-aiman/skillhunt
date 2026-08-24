import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// Reads ANTHROPIC_API_KEY from the environment — never hardcode the key.
const client = new Anthropic();

// The onboarding persona: introduces itself, draws out the user's current
// skills/experience/goals, and names concrete gaps as it learns enough to.
const SYSTEM_PROMPT = `You are Scout, SkillHunt's onboarding assistant.

In this conversation you:
1. Introduce yourself briefly on your first turn and explain that you're here to
   help the user figure out what to learn next.
2. Ask about the user's current skills, experience level, and career or learning
   goals — one or two focused questions at a time, not a long form.
3. As you learn more, identify specific gaps between where the user is now and
   where they want to be.
4. Keep your reply warm, concise, and focused on a single next question or step
   at a time.

Alongside your reply, extract any skill gaps or learning suggestions you've
identified so far into the suggestions field. Each suggestion names a specific
skill or topic and explains why it's relevant to this user, based only on what
they've actually told you. If you don't have enough information yet (e.g. the
conversation just started), return an empty suggestions array — don't invent
suggestions before you have something to base them on.`;

const ChatResponseSchema = z.object({
  reply: z.string().describe("The assistant's conversational reply to the user"),
  suggestions: z
    .array(
      z.object({
        skill: z.string().describe("A specific skill or topic identified as a gap or next step"),
        reason: z.string().describe("Why this was suggested, grounded in what the user has said"),
      }),
    )
    .describe("Skill gaps or learning suggestions identified from the conversation so far"),
});

export type ChatSuggestion = z.infer<typeof ChatResponseSchema>["suggestions"][number];

export interface ChatResult {
  reply: string | null;
  suggestions: ChatSuggestion[] | null;
  error: string | null;
}

export async function sendChatMessage(messages: Anthropic.MessageParam[]): Promise<ChatResult> {
  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages,
      output_config: {
        format: zodOutputFormat(ChatResponseSchema),
      },
    });

    if (!response.parsed_output) {
      return { reply: null, suggestions: null, error: "Failed to parse assistant response" };
    }

    return {
      reply: response.parsed_output.reply,
      suggestions: response.parsed_output.suggestions,
      error: null,
    };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { reply: null, suggestions: null, error: "Invalid Anthropic API key" };
    }

    if (error instanceof Anthropic.RateLimitError) {
      return { reply: null, suggestions: null, error: "Rate limited by the Anthropic API, try again shortly" };
    }

    if (error instanceof Anthropic.APIError) {
      return { reply: null, suggestions: null, error: error.message };
    }

    const fallbackMessage = error instanceof Error ? error.message : "Failed to get chat response";
    return { reply: null, suggestions: null, error: fallbackMessage };
  }
}
