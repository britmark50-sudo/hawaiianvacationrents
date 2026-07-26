"use client";

import { useActionState } from "react";
import { adminSaveBlogPost, adminSavePage, type AdminFormState } from "@/actions/admin";
import { BLOG_CATEGORIES } from "@/lib/constants";

interface BlogInitial {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  content: string;
  published: boolean;
}

export function BlogPostForm({ initial }: { initial?: BlogInitial }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    adminSaveBlogPost,
    undefined
  );
  return (
    <form action={action} className="card space-y-5 p-8">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="b-title">Title</label>
          <input id="b-title" name="title" required defaultValue={initial?.title} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="b-slug">Slug (optional — derived from title)</label>
          <input id="b-slug" name="slug" defaultValue={initial?.slug} className="input" placeholder="my-article-slug" />
        </div>
        <div>
          <label className="label" htmlFor="b-category">Category</label>
          <select id="b-category" name="category" required defaultValue={initial?.category || ""} className="input">
            <option value="" disabled>Choose…</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="b-excerpt">Excerpt (used as meta description)</label>
          <textarea id="b-excerpt" name="excerpt" rows={2} maxLength={200} required defaultValue={initial?.excerpt} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="b-cover">Cover image URL</label>
          <input id="b-cover" name="coverImage" defaultValue={initial?.coverImage || ""} className="input" placeholder="/seed/hero.jpg or /uploads/…" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="b-content">Content (Markdown)</label>
        <textarea id="b-content" name="content" rows={22} required defaultValue={initial?.content} className="input font-mono !text-[13px]" />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-deep">
        <input type="checkbox" name="published" defaultChecked={initial ? initial.published : true} className="h-4 w-4 accent-teal" />
        Published
      </label>
      {state?.error && <p className="text-sm font-medium text-coral">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save post"}
      </button>
    </form>
  );
}

export function PageForm({
  slug,
  initial,
}: {
  slug: string;
  initial: { title: string; content: string };
}) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(
    adminSavePage,
    undefined
  );
  return (
    <form action={action} className="card space-y-5 p-8">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label className="label" htmlFor="pg-title">Page title</label>
        <input id="pg-title" name="title" required defaultValue={initial.title} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pg-content">Content (Markdown)</label>
        <textarea id="pg-content" name="content" rows={24} required defaultValue={initial.content} className="input font-mono !text-[13px]" />
      </div>
      {state?.ok && <p className="text-sm font-semibold text-teal">Saved ✓</p>}
      {state?.error && <p className="text-sm font-medium text-coral">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save page"}
      </button>
    </form>
  );
}
