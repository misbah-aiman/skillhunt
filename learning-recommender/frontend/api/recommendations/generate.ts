import { getAuthedUser } from "../_lib/auth.js";
import { generateLearningPath } from "../_lib/recommendationController.js";

const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function parseLimit(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;

  return Math.min(Math.max(parsed, MIN_LIMIT), MAX_LIMIT);
}

export async function POST(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = parseLimit(body?.limit);

  const { learningPath, recommendations, error, notFound } =
    limit === undefined ? await generateLearningPath(user.id) : await generateLearningPath(user.id, limit);

  if (notFound) {
    return Response.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, learningPath, recommendations }, { status: 201 });
}
