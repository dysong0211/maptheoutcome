import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "maptoc_pilot_session";
const SESSION_SECONDS = 12 * 60 * 60;

export function pilotAccessCodeEnabled() {
  return process.env.MAPTOC_ACCESS_CODE_ENABLED === "true";
}

export function pilotAccessCodeConfigured() {
  return Boolean(
    process.env.MAPTOC_ACCESS_CODE &&
      (process.env.MAPTOC_ACCESS_SESSION_SECRET?.length ?? 0) >= 32,
  );
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(expiresAt: string) {
  return createHmac("sha256", process.env.MAPTOC_ACCESS_SESSION_SECRET!)
    .update(`maptoc-pilot:${expiresAt}`)
    .digest("hex");
}

export function verifyPilotAccessCode(candidate: string) {
  const expected = process.env.MAPTOC_ACCESS_CODE;
  return Boolean(expected && constantTimeEqual(candidate, expected));
}

export function createPilotAccessSession() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return { value: `${expiresAt}.${signature(expiresAt)}`, maxAge: SESSION_SECONDS };
}

export async function hasPilotAccessSession() {
  if (!pilotAccessCodeConfigured()) return false;
  const value = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const [expiresAt, suppliedSignature, extra] = value.split(".");
  if (!expiresAt || !suppliedSignature || extra || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  return constantTimeEqual(suppliedSignature, signature(expiresAt));
}

export function pilotAccessCookieName() {
  return COOKIE_NAME;
}

export function verifyPilotRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.MAPTOC_APP_ORIGIN || new URL(request.url).origin;
  return origin === expectedOrigin;
}
