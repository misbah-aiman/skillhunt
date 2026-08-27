import { getOrGenerateLesson } from "../../_lib/lessonController.js";

export async function GET(request: Request) {
  // Same approach as ../[id].ts: read the id from the URL path directly
  // rather than relying on how Vercel surfaces nested dynamic segments for
  // Web Handler functions, since that isn't documented for this style.
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const id = segments[segments.length - 2];

  if (!id) {
    return Response.json({ ok: false, error: "Topic id is required" }, { status: 400 });
  }

  const { lesson, error, notFound } = await getOrGenerateLesson(id);

  if (notFound) {
    return Response.json({ ok: false, error: "Topic not found" }, { status: 404 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, lesson });
}
