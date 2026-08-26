import { Router } from "express";
import { generateLearningPath, getRecommendations } from "../lib/recommendationController.js";

const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function parseLimit(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;

  return Math.min(Math.max(parsed, MIN_LIMIT), MAX_LIMIT);
}

export const recommendationsRouter = Router();

recommendationsRouter.get("/", async (req, res) => {
  const limit = parseLimit(req.query.limit);

  const { recommendations, error, notFound } =
    limit === undefined ? await getRecommendations(req.user!.id) : await getRecommendations(req.user!.id, limit);

  if (notFound) {
    res.status(404).json({ ok: false, error: "Profile not found" });
    return;
  }

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, recommendations });
});

recommendationsRouter.post("/generate", async (req, res) => {
  const limit = parseLimit(req.body?.limit);

  const { learningPath, recommendations, error, notFound } =
    limit === undefined ? await generateLearningPath(req.user!.id) : await generateLearningPath(req.user!.id, limit);

  if (notFound) {
    res.status(404).json({ ok: false, error: "Profile not found" });
    return;
  }

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.status(201).json({ ok: true, learningPath, recommendations });
});
