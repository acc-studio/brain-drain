"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

/**
 * Invite-gated registration. The access code is validated server-side (never
 * shipped to the client), the user is created email-confirmed via the admin
 * client, and the DB trigger provisions their profile. The client then signs
 * in with the password.
 */
export async function registerOperative(input: {
  email: string;
  password: string;
  username: string;
  accessCode: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  const { password, accessCode } = input;

  if (!process.env.ACCESS_CODE) {
    return { ok: false, error: "Registration is not configured." };
  }
  if (accessCode.trim() !== process.env.ACCESS_CODE) {
    return { ok: false, error: "Invalid access code." };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Callsign must be 3–20 chars (letters, numbers, - or _).",
    };
  }

  const admin = createAdminClient();

  // enforce unique callsign before creating the auth user
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (taken) {
    return { ok: false, error: "That callsign is already in use." };
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { ok: false, error: "An operative with that email already exists." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
