"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { BLOG_CATEGORIES } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AdminFormState = { ok?: boolean; error?: string } | undefined;

function revalidateProperty(p: { slug: string; island: string; citySlug: string }) {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/rentals/${p.slug}`);
  revalidatePath(`/${p.island}`);
  revalidatePath(`/${p.island}/${p.citySlug}`);
}

// ---------- Listings ----------

export async function adminSuspendProperty(id: string) {
  await requireAdmin();
  const p = await prisma.property.update({ where: { id }, data: { status: "SUSPENDED" } });
  revalidateProperty(p);
}

export async function adminUnsuspendProperty(id: string) {
  await requireAdmin();
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) return;
  const status =
    existing.expiresAt && existing.expiresAt > new Date()
      ? "ACTIVE"
      : existing.publishedAt
        ? "EXPIRED"
        : "DRAFT";
  const p = await prisma.property.update({ where: { id }, data: { status } });
  revalidateProperty(p);
}

export async function adminDeleteProperty(id: string) {
  await requireAdmin();
  const p = await prisma.property.delete({ where: { id } });
  revalidateProperty(p);
}

export async function adminSetTier(id: string, formData: FormData) {
  await requireAdmin();
  const tier = String(formData.get("tier") || "");
  if (!["BASIC", "FEATURED", "PREMIUM"].includes(tier)) return;
  const p = await prisma.property.update({ where: { id }, data: { tier } });
  revalidateProperty(p);
  revalidatePath("/admin/properties");
}

// ---------- Users ----------

export async function adminSuspendUser(id: string) {
  const session = await requireAdmin();
  if (id === session.userId) return;
  await prisma.user.update({ where: { id }, data: { status: "SUSPENDED" } });
  revalidatePath("/admin/users");
}

export async function adminActivateUser(id: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });
  revalidatePath("/admin/users");
}

export async function adminDeleteUser(id: string) {
  const session = await requireAdmin();
  if (id === session.userId) return;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role === "ADMIN") return;
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  revalidatePath("/");
  revalidatePath("/search");
}

// ---------- Payments (manual PayPal review) ----------

export async function adminApprovePayment(id: string) {
  await requireAdmin();
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.status !== "REVIEW") return;
  const { fulfillPayment } = await import("@/lib/billing");
  await fulfillPayment(id);
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
}

export async function adminRejectPayment(id: string) {
  await requireAdmin();
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.status !== "REVIEW") return;
  await prisma.payment.update({ where: { id }, data: { status: "FAILED" } });
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
}

// ---------- Reports ----------

export async function adminDismissReport(id: string) {
  await requireAdmin();
  await prisma.report.update({
    where: { id },
    data: { status: "DISMISSED", resolvedAt: new Date() },
  });
  revalidatePath("/admin/reports");
}

export async function adminResolveReport(id: string) {
  await requireAdmin();
  await prisma.report.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  revalidatePath("/admin/reports");
}

export async function adminResolveReportAndSuspend(id: string) {
  await requireAdmin();
  const report = await prisma.report.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
    include: { property: true },
  });
  if (report.property) {
    await prisma.property.update({
      where: { id: report.property.id },
      data: { status: "SUSPENDED" },
    });
    revalidateProperty(report.property);
  }
  revalidatePath("/admin/reports");
}

// ---------- Pages ----------

const pageSchema = z.object({
  slug: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(10),
});

export async function adminSavePage(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = pageSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the form." };
  const { slug, title, content } = parsed.data;
  await prisma.page.upsert({
    where: { slug },
    create: { slug, title, content },
    update: { title, content },
  });
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  return { ok: true };
}

// ---------- Blog ----------

const blogSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(4).max(140),
  slug: z.string().trim().max(140).optional().or(z.literal("")),
  excerpt: z.string().trim().min(10).max(200),
  category: z.string().refine((c) => BLOG_CATEGORIES.some((x) => x.key === c), "Choose a category."),
  coverImage: z.string().trim().max(300).optional().or(z.literal("")),
  content: z.string().trim().min(50),
});

export async function adminSaveBlogPost(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = blogSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    category: formData.get("category"),
    coverImage: formData.get("coverImage"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the form." };
  const d = parsed.data;
  const published = formData.get("published") === "on";
  const slug = d.slug ? slugify(d.slug) : slugify(d.title);
  if (!slug) return { error: "Could not derive a slug from the title." };

  const clash = await prisma.blogPost.findUnique({ where: { slug } });
  if (clash && clash.id !== d.id) return { error: `A post with slug "${slug}" already exists.` };

  if (d.id) {
    await prisma.blogPost.update({
      where: { id: d.id },
      data: {
        title: d.title,
        slug,
        excerpt: d.excerpt,
        category: d.category,
        coverImage: d.coverImage || null,
        content: d.content,
        published,
      },
    });
  } else {
    await prisma.blogPost.create({
      data: {
        title: d.title,
        slug,
        excerpt: d.excerpt,
        category: d.category,
        coverImage: d.coverImage || null,
        content: d.content,
        published,
      },
    });
  }
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  redirect("/admin/blog?saved=1");
}

export async function adminDeleteBlogPost(id: string) {
  await requireAdmin();
  const post = await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin/blog");
}

// ---------- Messages ----------

export async function adminMarkMessageHandled(id: string) {
  await requireAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { status: "HANDLED" } });
  revalidatePath("/admin/messages");
}
