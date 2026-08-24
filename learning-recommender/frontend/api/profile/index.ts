import { getAuthedUser } from "../_lib/auth.js";
import { isProfileInput } from "../_lib/types.js";
import { getProfile, createProfile, updateProfile } from "../_lib/profileController.js";

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const { profile, error } = await getProfile(user.id);

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, profile });
}

export async function POST(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isProfileInput(body)) {
    return Response.json({ ok: false, error: "Invalid profile data" }, { status: 400 });
  }

  const { profile, error, conflict } = await createProfile(user.id, body);

  if (conflict) {
    return Response.json({ ok: false, error: "Profile already exists" }, { status: 409 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, profile }, { status: 201 });
}

export async function PUT(request: Request) {
  const { user, error: authError } = await getAuthedUser(request);

  if (!user) {
    return Response.json({ ok: false, error: authError ?? "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!isProfileInput(body)) {
    return Response.json({ ok: false, error: "Invalid profile data" }, { status: 400 });
  }

  const { profile, error, notFound } = await updateProfile(user.id, body);

  if (notFound) {
    return Response.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  if (error) {
    return Response.json({ ok: false, error }, { status: 500 });
  }

  return Response.json({ ok: true, profile });
}
