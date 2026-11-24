import { createClient } from "./server";

export function pilotAuthEnabled() {
  return process.env.MAPTOC_REQUIRE_AUTH === "true";
}

export function supabaseAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function allowedEmails(variable: "MAPTOC_PILOT_ADMIN_EMAILS" | "MAPTOC_PILOT_USER_EMAILS") {
  return (process.env[variable] ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getPilotAccount() {
  const admins = allowedEmails("MAPTOC_PILOT_ADMIN_EMAILS");
  const pilots = allowedEmails("MAPTOC_PILOT_USER_EMAILS");
  if (!supabaseAuthConfigured() || (!admins.length && !pilots.length)) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    const email = data.user?.email?.toLowerCase();
    if (error || !email) return null;
    if (admins.includes(email)) return { user: data.user, role: "admin" as const };
    if (pilots.includes(email)) return { user: data.user, role: "pilot" as const };
    return null;
  } catch {
    return null;
  }
}
