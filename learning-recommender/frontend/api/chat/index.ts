import { getAuthedUser } from "../_lib/auth.js";
import { getChatHistory, sendChatMessage } from "../_lib/chatController.js";
import type { ChatMessage } from "../_lib/types.js";

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && typeof v.content === "string";
}

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const { messages, error } = await getChatHistory(user.id);

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, messages });
}

// The request body may include a `userId` field (per the client contract),
// but it is never trusted — the authenticated session is the only source of
// truth for whose conversation this is.
export async function POST(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const { messages } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
    return Response.json(
      { ok: false, error: "messages must be a non-empty array of { role, content }" },
      { status: 400 },
    );
  }

  const { reply, isComplete, suggestions, error } = await sendChatMessage(user.id, messages);

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, reply, suggestions, isComplete });
}
