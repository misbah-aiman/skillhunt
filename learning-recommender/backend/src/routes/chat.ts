import { Router } from "express";
import type Anthropic from "@anthropic-ai/sdk";
import { applySuggestionsToProfile, sendChatMessage, type ApplySuggestionsInput } from "../controllers/chatController.js";
import type { Skill } from "../lib/types.js";

function isChatMessage(value: unknown): value is Anthropic.MessageParam {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && typeof v.content === "string";
}

function isSkill(value: unknown): value is Skill {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Skill).name === "string" &&
    typeof (value as Skill).level === "string"
  );
}

function isApplySuggestionsInput(body: unknown): body is ApplySuggestionsInput {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;

  const skills = b.skillsIdentified;
  const topics = b.topicsToAdd;

  if (skills !== undefined && !(Array.isArray(skills) && skills.every(isSkill))) {
    return false;
  }

  if (topics !== undefined && !(Array.isArray(topics) && topics.every((t) => typeof t === "string"))) {
    return false;
  }

  const hasSkills = Array.isArray(skills) && skills.length > 0;
  const hasTopics = Array.isArray(topics) && topics.length > 0;

  return hasSkills || hasTopics;
}

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
    res.status(400).json({ ok: false, error: "messages must be a non-empty array of { role, content }" });
    return;
  }

  const { reply, assessmentComplete, skillsIdentified, gapsFound, topicsToAdd, error } =
    await sendChatMessage(messages);

  if (error) {
    res.status(500).json({ ok: false, error });
    return;
  }

  res.json({ ok: true, reply, assessmentComplete, skillsIdentified, gapsFound, topicsToAdd });
});

chatRouter.post("/apply-suggestions", async (req, res) => {
  if (!isApplySuggestionsInput(req.body)) {
    res.status(400).json({
      ok: false,
      error: "Provide a non-empty skillsIdentified and/or topicsToAdd array",
    });
    return;
  }

  const { profile, error, notFound } = await applySuggestionsToProfile(req.user!.id, req.body);

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
