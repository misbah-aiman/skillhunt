import type { NextFunction, Request, Response } from "express";
import { getAuthedUser } from "../lib/auth.js";

// Verifies the caller's Supabase session and attaches the user to the
// request; rejects with 401 before the route handler runs otherwise.
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const { user, error } = await getAuthedUser(req);

  if (!user) {
    res.status(401).json({ ok: false, error: error ?? "Unauthorized" });
    return;
  }

  req.user = user;
  next();
}
