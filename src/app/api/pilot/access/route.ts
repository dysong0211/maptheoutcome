import { NextResponse } from "next/server";
import {
  createPilotAccessSession,
  pilotAccessCodeConfigured,
  pilotAccessCookieName,
  verifyPilotAccessCode,
  verifyPilotRequestOrigin,
} from "@/lib/pilot-access-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientKey(request: Request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimited(request: Request) {
  const now = Date.now();
  const key = clientKey(request);
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function POST(request: Request) {
  if (!verifyPilotRequestOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  if (!pilotAccessCodeConfigured()) {
    return NextResponse.json({ error: "Pilot access has not been configured." }, { status: 503 });
  }
  if (rateLimited(request)) {
    return NextResponse.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter the pilot access code." }, { status: 400 });
  }
  const code =
    body && typeof body === "object" && "code" in body && typeof body.code === "string"
      ? body.code
      : "";
  if (!verifyPilotAccessCode(code)) {
    return NextResponse.json({ error: "That access code was not recognized." }, { status: 401 });
  }

  const session = createPilotAccessSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(pilotAccessCookieName(), session.value, cookieOptions(session.maxAge));
  return response;
}

export async function DELETE(request: Request) {
  if (!verifyPilotRequestOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(pilotAccessCookieName(), "", cookieOptions(0));
  return response;
}
