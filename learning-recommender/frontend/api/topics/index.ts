import { getAllTopics } from "../_lib/topicController.js";
import type { Difficulty } from "../_lib/types.js";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

function isDifficulty(value: string | null): value is Difficulty {
  return value !== null && (DIFFICULTIES as string[]).includes(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");

  if (difficulty !== null && !isDifficulty(difficulty)) {
    return Response.json({ ok: false, error: "Invalid difficulty" }, { status: 400 });
  }

  const { topics, error } = await getAllTopics({
    category: category ?? undefined,
    difficulty: difficulty ?? undefined,
    search: search ?? undefined,
  });

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, topics });
}
