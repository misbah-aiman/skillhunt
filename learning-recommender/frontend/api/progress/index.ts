import { getAuthedUser } from "../_lib/auth.js";
import { getProgress } from "../_lib/progressController.js";
import { isValidLocalDate, recordActivity } from "../_lib/activityController.js";

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const { progress, error } = await getProgress(user.id);

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, progress });
}

// Records today's Dashboard-streak activity for the caller and returns
// the resulting streak + week. `localDate` is the caller's local day
// (YYYY-MM-DD) — see activityController for why the server trusts it.
export async function POST(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const localDate = (body as { localDate?: unknown } | null)?.localDate;

  if (!isValidLocalDate(localDate)) {
    return Response.json({ ok: false, error: "localDate must be a YYYY-MM-DD string" }, { status: 400 });
  }

  const { streak, week, error } = await recordActivity(user.id, localDate);

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, streak, week });
}
