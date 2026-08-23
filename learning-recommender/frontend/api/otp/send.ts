import { supabase } from "../_lib/supabase.js";
import { resend } from "../_lib/resend.js";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (typeof email !== "string" || !email.includes("@")) {
    return Response.json({ ok: false, error: "Valid email is required" }, { status: 400 });
  }

  // "magiclink" both creates the user if they're new and issues a fresh
  // code if they already exist, so the same call covers signup and login.
  const { data, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError) {
    return Response.json({ ok: false, error: linkError.message }, { status: 500 });
  }

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject: "Your login code",
    html: `<p>Your login code is <strong>${data.properties.email_otp}</strong>. It expires shortly.</p>`,
  });

  if (sendError) {
    return Response.json({ ok: false, error: sendError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
