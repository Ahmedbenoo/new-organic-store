import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAdminPasswordHash } from "@/lib/settings-store";

const COOKIE_NAME = "admin-session";
const LOCAL_DEV_SESSION_SECRET = "organic-store-local-dev-secret";

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET must be set in production.");
  }

  return LOCAL_DEV_SESSION_SECRET;
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function signSessionToken(sessionId: string, passwordHash: string): string {
  const signature = createHmac("sha256", getSessionSecret())
    .update(`${sessionId}:${passwordHash}`)
    .digest("hex");

  return `${sessionId}.${signature}`;
}

function verifySignedSessionToken(
  token: string,
  passwordHash: string,
): boolean {
  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0) {
    return false;
  }

  const sessionId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(`${sessionId}:${passwordHash}`)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    return false;
  }
}

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return false;

  const passwordHash = await getAdminPasswordHash();
  if (!passwordHash) return false;

  return verifySignedSessionToken(token, passwordHash);
}

export async function setAdminSession() {
  const passwordHash = await getAdminPasswordHash();
  if (!passwordHash) {
    throw new Error("Admin password is not configured.");
  }

  const sessionId = randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, signSessionToken(sessionId, passwordHash), {
    ...getSessionCookieOptions(),
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export async function requireAdminSession() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}
