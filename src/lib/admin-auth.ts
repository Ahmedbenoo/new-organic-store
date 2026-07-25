import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAdminPassword } from "@/lib/settings-store";

const COOKIE_NAME = "admin-session";
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "organic-store-local-secret";

export function createSessionToken(password: string) {
  return createHmac("sha256", SESSION_SECRET).update(password).digest("hex");
}

export function verifySessionToken(token: string, password: string) {
  const expected = createSessionToken(password);

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return false;

  const password = await getAdminPassword();
  return verifySessionToken(token, password);
}

export async function setAdminSession(password: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdminSession() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}
