import { Router } from "express";
import { generateLearningPath } from "../lib/recommendationController.js";
import { getProgress, markComplete } from "../lib/progressController.js";
import { isValidLocalDate, recordActivity } from "../lib/activityController.js";

export const progressRouter = Router();

progressRouter.get("/", async (req, res) => {
  const { progress, error } = await getProgress(req.user!.id);

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, progress });
});

// Records today's Dashboard-streak activity for the caller and returns
// the resulting streak + week. `localDate` is the caller's local day
// (YYYY-MM-DD) — see activityController for why the server trusts it.
progressRouter.post("/", async (req, res) => {
  const { localDate } = req.body ?? {};

  if (!isValidLocalDate(localDate)) {
    res.status(400).json({ ok: false, error: "localDate must be a YYYY-MM-DD string" });
    return;
  }

  const { streak, week, error } = await recordActivity(req.user!.id, localDate);

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, streak, week });
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
