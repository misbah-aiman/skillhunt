import { Router } from "express";
import { generateLearningPath } from "../lib/recommendationController.js";
import { getProgress, markComplete } from "../lib/progressController.js";

export const progressRouter = Router();

progressRouter.get("/", async (req, res) => {
  const { progress, error } = await getProgress(req.user!.id);

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, progress });
});

progressRouter.post("/complete/:topicId", async (req, res) => {
  const { progress, error, notFound } = await markComplete(req.user!.id, req.params.topicId);

  if (notFound) {
    res.status(404).json({ ok: false, error: "Topic not found" });
    return;
  }

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  // Completing a topic changes what's eligible (it drops out, and anything
  // gated on it as a prerequisite may now unlock), so refresh and re-save
  // the learning path immediately rather than waiting for the next request.
  const { learningPath, recommendations, error: refreshError } = await generateLearningPath(req.user!.id);

  if (refreshError) {
    res.status(500).json({ ok: false, error: refreshError });
    return;
  }

  res.status(201).json({ ok: true, progress, learningPath, recommendations });
});
