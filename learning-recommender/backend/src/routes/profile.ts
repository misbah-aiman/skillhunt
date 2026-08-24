import { Router } from "express";
import { isProfileInput } from "../lib/types.js";
import { getProfile, createProfile, updateProfile } from "../lib/profileController.js";

export const profileRouter = Router();

profileRouter.get("/", async (req, res) => {
  const { profile, error } = await getProfile(req.user!.id);

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, profile });
});

profileRouter.post("/", async (req, res) => {
  if (!isProfileInput(req.body)) {
    res.status(400).json({ ok: false, error: "Invalid profile data" });
    return;
  }

  const { profile, error, conflict } = await createProfile(req.user!.id, req.body);

  if (conflict) {
    res.status(409).json({ ok: false, error: "Profile already exists" });
    return;
  }

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.status(201).json({ ok: true, profile });
});

profileRouter.put("/", async (req, res) => {
  if (!isProfileInput(req.body)) {
    res.status(400).json({ ok: false, error: "Invalid profile data" });
    return;
  }

  const { profile, error, notFound } = await updateProfile(req.user!.id, req.body);

  if (notFound) {
    res.status(404).json({ ok: false, error: "Profile not found" });
    return;
  }

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, profile });
});
