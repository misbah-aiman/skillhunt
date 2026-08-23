import "dotenv/config";
import express from "express";
import { supabase } from "./lib/supabase.js";
import { resend } from "./lib/resend.js";

const app = express();
const port = process.env.PORT || 4000;

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

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_API_KEY || "onboarding@resend.dev",
    to: email,
    subject: "Your login code",
    html: `<p>Your login code is <strong>${data.properties.email_otp}</strong>. It expires shortly.</p>`,
  });

  if (sendError) {
    res.status(500).json({ ok: false, error: sendError.message });
    return;
  }

  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
