import express from "express";
import { supabase } from "./lib/supabase.js";
import { transporter } from "./lib/mailer.js";
import { authenticate } from "./middleware/authenticate.js";
import { profileRouter } from "./routes/profile.js";
import { topicsRouter } from "./routes/topics.js";

export const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/db-check", async (_req, res) => {
  const { data, error } = await supabase
    .from("Profiles")
    .insert({ name: `DB check ${new Date().toISOString()}` })
    .select()
    .single();

  if (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }

  res.json({ ok: true, row: data });
});

app.post("/api/otp/send", async (req, res) => {
  const { email } = req.body;

  if (typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ ok: false, error: "Valid email is required" });
    return;
  }

  // "magiclink" both creates the user if they're new and issues a fresh
  // code if they already exist, so the same call covers signup and login.
  const { data, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError) {
    res.status(500).json({ ok: false, error: linkError.message });
    return;
  }

  const code = data.properties.email_otp;

  try {
    await transporter.sendMail({
      from: `"SkillHunt" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your SkillHunt login code",
      text: `Your SkillHunt verification code is ${code}. It expires in 10 minutes.`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #111;">SkillHunt</h1>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>`,
    });
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Failed to send email";
    res.status(500).json({ ok: false, error: message });
    return;
  }

  res.json({ ok: true });
});

app.use("/api/profile", authenticate, profileRouter);
app.use("/api/topics", topicsRouter);
