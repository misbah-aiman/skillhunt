import { getAuthedUser } from "../../_lib/auth.js";
import { generateLearningPath } from "../../_lib/recommendationController.js";
import { markComplete } from "../../_lib/progressController.js";

export async function POST(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  // Read the id from the URL path directly rather than relying on how
  // Vercel surfaces the [topicId] dynamic segment for Web Handler
  // functions, since that isn't documented for this ("other framework")
  // API style — same approach as topics/[id].ts.
  const topicId = new URL(request.url).pathname.split("/").filter(Boolean).pop();

  if (!topicId) {
    return Response.json({ ok: false, error: "Topic id is required" }, { status: 400 });
  }

  const { progress, error, notFound } = await markComplete(user.id, topicId);

  if (notFound) {
    return Response.json({ ok: false, error: "Topic not found" }, { status: 404 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  // Completing a topic changes what's eligible (it drops out, and anything
  // gated on it as a prerequisite may now unlock), so refresh and re-save
  // the learning path immediately rather than waiting for the next request.
  const { learningPath, recommendations, error: refreshError } = await generateLearningPath(user.id);

  if (refreshError) {
    return Response.json({ ok: false, error: refreshError }, { status: 500 });
  }

  return Response.json({ ok: true, progress, learningPath, recommendations }, { status: 201 });
}
