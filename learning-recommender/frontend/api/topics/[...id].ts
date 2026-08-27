import { getTopicById } from "../_lib/topicController.js";
import { getOrGenerateLesson } from "../_lib/lessonController.js";

// Catch-all for /api/topics/:id and /api/topics/:id/lesson, combined into
// one function rather than a separate file per route: the Hobby plan caps
// deployments at 12 Serverless Functions, and this project's api/ directory
// is already at that limit (see errorCode "exceeded_serverless_functions_
// per_deployment" from the first attempt at a standalone lesson.ts file).
export async function GET(request: Request) {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  // segments looks like ["api", "topics", ":id"] or ["api", "topics", ":id", "lesson"]
  const topicsIndex = segments.indexOf("topics");
  const rest = segments.slice(topicsIndex + 1);

  const isLesson = rest.length === 2 && rest[1] === "lesson";
  const id = isLesson ? rest[0] : rest[rest.length - 1];

  if (!id) {
    return Response.json({ ok: false, error: "Topic id is required" }, { status: 400 });
  }

  if (isLesson) {
    const { lesson, error, notFound } = await getOrGenerateLesson(id);

    if (notFound) {
      return Response.json({ ok: false, error: "Topic not found" }, { status: 404 });
    }

    if (error) {
      return Response.json({ ok: false, error }, { status: 500 });
    }

    return Response.json({ ok: true, lesson });
  }

  const { topic, resources, error, notFound } = await getTopicById(id);

  if (notFound) {
    return Response.json({ ok: false, error: "Topic not found" }, { status: 404 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, topic, resources });
}
