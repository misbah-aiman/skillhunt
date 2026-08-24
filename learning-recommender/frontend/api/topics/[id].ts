import { getTopicById } from "../_lib/topicController.js";

export async function GET(request: Request) {
  // Read the id from the URL path directly rather than relying on how
  // Vercel surfaces the [id] dynamic segment for Web Handler functions,
  // since that isn't documented for this ("other framework") API style.
  const id = new URL(request.url).pathname.split("/").filter(Boolean).pop();

  if (!id) {
    return Response.json({ ok: false, error: "Topic id is required" }, { status: 400 });
  }

  const { topic, error, notFound } = await getTopicById(id);

  if (notFound) {
    return Response.json({ ok: false, error: "Topic not found" }, { status: 404 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, topic });
}
