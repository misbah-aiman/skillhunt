import { Router } from "express";
import { getAllTopics, getTopicById } from "../lib/topicController.js";
import { getOrGenerateLesson } from "../lib/lessonController.js";
import type { Difficulty } from "../lib/types.js";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as string[]).includes(value);
}

export const topicsRouter = Router();

topicsRouter.get("/", async (req, res) => {
  const { category, difficulty, search } = req.query;

  if (difficulty !== undefined && !isDifficulty(difficulty)) {
    res.status(400).json({ ok: false, error: "Invalid difficulty" });
    return;
  }

  const { topics, error } = await getAllTopics({
    category: typeof category === "string" ? category : undefined,
    difficulty: typeof difficulty === "string" ? difficulty : undefined,
    search: typeof search === "string" ? search : undefined,
  });

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, topics });
});

// The lesson is served off this same route via a ?lesson query param
// rather than a nested /:id/lesson path — see frontend/api/topics/[id].ts
// for why (Vercel's zero-config API routing for this project only matches
// a single dynamic path segment per function, so both environments share
// this query-param contract instead of diverging).
topicsRouter.get("/:id", async (req, res) => {
  if (req.query.lesson !== undefined) {
    const { lesson, error, notFound } = await getOrGenerateLesson(req.params.id);

    if (notFound) {
      res.status(404).json({ ok: false, error: "Topic not found" });
      return;
    }

    if (error) {
      res.status(500).json({ ok: false, error });
      return;
    }

    res.json({ ok: true, lesson });
    return;
  }

  const { topic, resources, error, notFound } = await getTopicById(req.params.id);

  if (notFound) {
    res.status(404).json({ ok: false, error: "Topic not found" });
    return;
  }

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, topic, resources });
});
