import { getAuthedUser } from "../_lib/auth.js";
import { getProgress } from "../_lib/progressController.js";

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
