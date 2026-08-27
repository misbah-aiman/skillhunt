import { getTopicById } from "../_lib/topicController.js";
import { getOrGenerateLesson } from "../_lib/lessonController.js";

// Vercel's zero-config API routing for non-Next projects only matches a
// single dynamic path segment per file ([...id].ts catch-all routing was
// tried and 404'd at the platform level here) — the lesson is served off
// this same route via a query param instead of a nested path segment.
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Read the id from the URL path directly rather than relying on how
  // Vercel surfaces the [id] dynamic segment for Web Handler functions,
  // since that isn't documented for this ("other framework") API style.
  const id = url.pathname.split("/").filter(Boolean).pop();

  if (!id) {
    return Response.json({ ok: false, error: "Topic id is required" }, { status: 400 });
  }

  if (url.searchParams.has("lesson")) {
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
