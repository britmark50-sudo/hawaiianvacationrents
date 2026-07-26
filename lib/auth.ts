import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";

export const SESSION_COOKIE = "hvr_session";
export const UI_COOKIE = "hvr_ui";

function secretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET || "hvr-dev-secret");
}

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

export { hashPassword, verifyPassword } from "@/lib/password";

export async function createSession(user: { id: string; email: string; name: string; role: string }) {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  // Non-sensitive UI hint (first name + role only) — lets the header reflect
  // login state on statically-rendered pages without exposing the JWT.
  store.set(UI_COOKIE, JSON.stringify({ n: user.name.split(" ")[0] || "", r: user.role }), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(UI_COOKIE);
}

export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      email: (payload.email as string) || "",
      name: (payload.name as string) || "",
      role: (payload.role as string) || "OWNER",
    };
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/dashboard");
  return session;
}
