import { getAuthedUser } from "../_lib/auth.js";
import { applySuggestionsToProfile, type ApplySuggestionsInput } from "../_lib/chatController.js";
import type { Skill } from "../_lib/types.js";

function isSkill(value: unknown): value is Skill {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Skill).name === "string" &&
    typeof (value as Skill).level === "string"
  );
}

function isApplySuggestionsInput(body: unknown): body is ApplySuggestionsInput {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;

  const skills = b.skillsIdentified;
  const topics = b.topicsToAdd;

  if (skills !== undefined && !(Array.isArray(skills) && skills.every(isSkill))) {
    return false;
  }

  if (topics !== undefined && !(Array.isArray(topics) && topics.every((t) => typeof t === "string"))) {
    return false;
  }

  const hasSkills = Array.isArray(skills) && skills.length > 0;
  const hasTopics = Array.isArray(topics) && topics.length > 0;

  return hasSkills || hasTopics;
}

export async function POST(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isApplySuggestionsInput(body)) {
    return Response.json(
      { ok: false, error: "Provide a non-empty skillsIdentified and/or topicsToAdd array" },
      { status: 400 },
    );
  }

  const { profile, error, notFound } = await applySuggestionsToProfile(user.id, body);

  if (notFound) {
    return Response.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, profile });
}
