import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function AdminPages() {
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  return (
    <div>
      <h1 className="section-title">Legal & content pages</h1>
      <p className="mt-2 text-sm text-ink/55">
        These pages are rendered on the public site. Edit them in Markdown.
      </p>
      <div className="card mt-6 divide-y divide-deep/5">
        {pages.map((p) => (
          <div key={p.slug} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-deep">{p.title}</p>
              <p className="mt-0.5 text-xs text-ink/50">/{p.slug} · updated {formatDate(p.updatedAt)}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/${p.slug}`} className="rounded-full border border-deep/15 px-3.5 py-1.5 text-xs font-semibold text-deep hover:bg-sand">
                View
              </Link>
              <Link href={`/admin/pages/edit/${p.slug}`} className="rounded-full bg-deep px-3.5 py-1.5 text-xs font-bold text-white hover:bg-ink">
                Edit
              </Link>
            </div>
          </div>
        ))}
        {pages.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink/50">No pages yet — run the seed.</p>}
      </div>
    </div>
  );
}
