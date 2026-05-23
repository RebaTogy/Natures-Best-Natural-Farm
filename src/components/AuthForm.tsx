"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loginAction, signupAction } from "@/app/actions/auth";

interface AuthFormProps {
  mode: "login" | "signup";
  csrfToken?: string;
}

export default function AuthForm({ mode, csrfToken: initialCsrfToken }: AuthFormProps) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, null);
  const [csrfToken, setCsrfToken] = useState<string>(initialCsrfToken || "");
  const [csrfLoading, setCsrfLoading] = useState(!initialCsrfToken);

  useEffect(() => {
    if (csrfToken || initialCsrfToken) return;

    setCsrfLoading(true);
    fetch("/api/csrf", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.csrf) setCsrfToken(data.csrf);
      })
      .catch(() => {
        // Keep token empty and show user-friendly state.
      })
      .finally(() => setCsrfLoading(false));
  }, [csrfToken, initialCsrfToken]);

  return (
    <form action={formAction} className="mx-auto w-full max-w-md glass-panel rounded-3xl bg-farm-cream-50 p-8 space-y-5">
      <input type="hidden" name="csrf" value={csrfToken} />
      <div>
        <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </span>
        <h1 className="mt-1 font-serif text-3xl font-bold text-farm-green-950">
          {mode === "login" ? "Login" : "Signup"}
        </h1>
      </div>

      {mode === "signup" && (
        <label className="block space-y-1">
          <span className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">Name</span>
          <input name="name" required className="w-full rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:outline-none" />
        </label>
      )}

      <label className="block space-y-1">
        <span className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">Email</span>
        <input name="email" type="email" required className="w-full rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:outline-none" />
      </label>

      <label className="block space-y-1">
        <span className="text-2xs uppercase tracking-wider text-farm-green-700 font-semibold">Password</span>
        <input name="password" type="password" required minLength={8} className="w-full rounded-xl border border-farm-green-900/10 bg-farm-cream-100/50 p-3 text-sm focus:outline-none" />
      </label>

      {state?.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{state.error}</p>
      )}

      <button
        disabled={pending || csrfLoading}
        className="w-full rounded-full bg-farm-green-900 px-6 py-3 text-xs font-semibold tracking-wider text-farm-cream-100 hover:bg-farm-gold-600 disabled:opacity-50"
      >
        {pending ? "Processing..." : mode === "login" ? "Login" : "Create Account"}
      </button>

      {csrfLoading && (
        <p className="text-center text-xs text-farm-green-700">Securing your session…</p>
      )}

      <p className="text-center text-xs text-farm-green-700">
        {mode === "login" ? "New here? " : "Already registered? "}
        <Link href={mode === "login" ? "/signup" : "/login"} className="font-semibold text-farm-green-950 hover:text-farm-gold-600">
          {mode === "login" ? "Create an account" : "Login"}
        </Link>
      </p>
    </form>
  );
}
