import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "nbf_auth";
const CSRF_COOKIE = "nbf_csrf";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function getSecret() {
  return process.env.AUTH_SECRET || "dev-only-change-me-natures-best";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function encodeSession(payload: { userId: string; role: string; exp: number }) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token?: string) {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      userId: string;
      role: string;
      exp: number;
    };
    if (!payload.userId || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function createSession(userId: string, role: string) {
  const cookieStore = await cookies();
  const token = encodeSession({ userId, role, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function ensureCsrfToken() {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE)?.value;
  if (!token) {
    token = randomBytes(24).toString("hex");
    cookieStore.set(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }
  return token;
}

export async function verifyCsrfToken(token?: string) {
  const cookieStore = await cookies();
  const expected = cookieStore.get(CSRF_COOKIE)?.value;
  return Boolean(token && expected && token === expected);
}
