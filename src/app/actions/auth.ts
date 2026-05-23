"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyCsrfToken,
  verifyPassword,
} from "@/lib/auth";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signupAction(_: unknown, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const csrf = String(formData.get("csrf") || "");

  if (!(await verifyCsrfToken(csrf))) return { error: "Security token expired. Refresh and try again." };
  if (!name || !validateEmail(email) || password.length < 8) {
    return { error: "Use a valid name, email, and password with at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account already exists for this email." };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: email === "admin@naturesbestfarm.com" ? "ADMIN" : "CUSTOMER",
    },
  });

  await createSession(user.id, user.role);
  redirect("/account");
}

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const csrf = String(formData.get("csrf") || "");

  if (!(await verifyCsrfToken(csrf))) return { error: "Security token expired. Refresh and try again." };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }
  if (user.role === "DISABLED") {
    return { error: "This account has been disabled. Contact the farm team for access." };
  }

  await createSession(user.id, user.role);
  redirect(user.role === "ADMIN" ? "/admin" : "/account");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
