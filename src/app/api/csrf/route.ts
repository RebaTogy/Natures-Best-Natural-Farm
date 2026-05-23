import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const CSRF_COOKIE = "nbf_csrf";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export async function GET() {
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

  return new Response(JSON.stringify({ csrf: token }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
