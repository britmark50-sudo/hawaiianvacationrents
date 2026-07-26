import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { adminDeleteBlogPost } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { categoryLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function AdminBlog() {
  const posts = await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title">Blog</h1>
        <Link href="/admin/blog/new" className="btn-primary !px-5 !py-2.5">
          <Plus className="h-4 w-4" /> New post
        </Link>
      </div>
      <div className="card mt-6 divide-y divide-deep/5">
        {posts.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-deep">
                {p.title}
                {!p.published && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                    draft
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-ink/50">
                {categoryLabel(p.category)} · {formatDate(p.publishedAt)} · /blog/{p.slug}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/blog/${p.slug}`} className="rounded-full border border-deep/15 px-3.5 py-1.5 text-xs font-semibold text-deep hover:bg-sand">
                View
              </Link>
              <Link href={`/admin/blog/edit/${p.id}`} className="rounded-full border border-deep/15 px-3.5 py-1.5 text-xs font-semibold text-deep hover:bg-sand">
                Edit
              </Link>
              <form action={adminDeleteBlogPost.bind(null, p.id)}>
                <ConfirmSubmit
                  confirmText={`Delete post "${p.title}"?`}
                  label="Delete"
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-coral hover:bg-coral-light"
                />
              </form>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink/50">No posts yet.</p>}
      </div>
    </div>
  );
}
