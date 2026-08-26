import { getAuthedUser } from "../_lib/auth.js";
import { getRecommendations } from "../_lib/recommendationController.js";

const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function parseLimit(value: string | null): number | undefined {
  if (value === null) return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;

  return Math.min(Math.max(parsed, MIN_LIMIT), MAX_LIMIT);
}

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const limit = parseLimit(new URL(request.url).searchParams.get("limit"));

  const { recommendations, error, notFound } =
    limit === undefined ? await getRecommendations(user.id) : await getRecommendations(user.id, limit);

  if (notFound) {
    return Response.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, recommendations });
}
