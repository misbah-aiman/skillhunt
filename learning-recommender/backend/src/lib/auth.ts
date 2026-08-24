import type { Request } from "express";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase.js";

// Verifies the caller's Supabase session by validating the bearer token
// against Supabase Auth, so route handlers know who they're serving data to.
export async function getAuthedUser(
  req: Request,
): Promise<{ user: User | null; error: string | null }> {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null, error: "Missing bearer token" };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: error?.message ?? "Invalid token" };
  }

  return { user: data.user, error: null };
}
