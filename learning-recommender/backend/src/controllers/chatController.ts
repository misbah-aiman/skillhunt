import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment — never hardcode the key.
const client = new Anthropic();

const SYSTEM_PROMPT =
  "You are the SkillHunt learning assistant. Help users figure out what skills, " +
  "topics, and resources to pursue based on their goals and interests. Keep answers " +
  "concise and practical.";

export interface ChatResult {
  reply: string | null;
  error: string | null;
}

export async function sendChatMessage(
  message: string,
  history: Anthropic.MessageParam[] = [],
): Promise<ChatResult> {
  try {
    const stream = client.messages.stream({
      model: "claude-opus-5",
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [...history, { role: "user", content: message }],
    });

    const response = await stream.finalMessage();

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );

    if (!textBlock) {
      return { reply: null, error: "No text response from Claude" };
    }

    return { reply: textBlock.text, error: null };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { reply: null, error: "Invalid Anthropic API key" };
    }

    if (error instanceof Anthropic.RateLimitError) {
      return { reply: null, error: "Rate limited by the Anthropic API, try again shortly" };
    }

    if (error instanceof Anthropic.APIError) {
      return { reply: null, error: error.message };
    }

    const fallbackMessage = error instanceof Error ? error.message : "Failed to get chat response";
    return { reply: null, error: fallbackMessage };
  }
}
