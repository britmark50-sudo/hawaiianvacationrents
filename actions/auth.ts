"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export type AuthState = { error?: string } | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check the form." };
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists. Try logging in instead." };
  }

  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash: await hashPassword(password) },
  });
  await createSession(user);
  redirect("/dashboard?welcome=1");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
  next: z.string().optional().or(z.literal("")),
});

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check the form." };
  }
  const { email, password, next } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  if (user.status === "SUSPENDED") {
    return { error: "This account has been suspended. Contact support if you believe this is a mistake." };
  }

  await createSession(user);

  let target = user.role === "ADMIN" ? "/admin" : "/dashboard";
  if (next && next.startsWith("/") && !next.startsWith("//")) target = next;
  redirect(target);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
