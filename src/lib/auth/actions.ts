"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string };

const DEMO_CREDENTIALS = {
  email: "demo@watchtogether.app",
  password: "watchparty",
};

/** Turn Supabase's terse auth errors into friendlier copy. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) {
    return "Your email isn't confirmed yet. Confirm it from your inbox, or ask the host to disable email confirmation.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "That email is already registered. Try signing in instead.";
  }
  return message;
}

/** Sign in with email + password. Used with `useActionState`. */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  redirect(next.startsWith("/") ? next : "/");
}

/** Create an account. A profile row is auto-created by the DB trigger. */
export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!displayName) return { error: "Please choose a display name." };
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) {
    return { error: friendlyAuthError(error.message) };
  }
  // If email confirmation is enabled, there is no session yet.
  if (!data.session) {
    return {
      notice:
        "Account created! 🎉 Confirm your email from your inbox, then sign in. (Tip: the host can disable email confirmation for instant access.)",
    };
  }

  redirect("/");
}

/** One-click demo login using the seeded demo account. */
export async function signInDemo() {
  const supabase = await createClient();
  await supabase.auth.signInWithPassword(DEMO_CREDENTIALS);
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
