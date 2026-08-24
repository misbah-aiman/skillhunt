import { Router } from "express";
import type Anthropic from "@anthropic-ai/sdk";
import { sendChatMessage } from "../controllers/chatController.js";

function isChatMessage(value: unknown): value is Anthropic.MessageParam {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && typeof v.content === "string";
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
