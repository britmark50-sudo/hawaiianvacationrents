"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";

export type AuthState = { error?: string } | undefined;

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name."),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({ code: "custom", message: "Passwords do not match.", path: ["confirmPassword"] });
    }
  });

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check the form." };
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists. Try logging in instead." };
    }

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: await hashPassword(password),
          role: "OWNER",
          status: "ACTIVE",
        },
      });
      await tx.ownerProfile.create({
        data: { userId: createdUser.id },
      });
      return createdUser;
    });

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch {
    return { error: "We couldn't create your account. Please try again." };
  }

  redirect("/dashboard/new");
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
