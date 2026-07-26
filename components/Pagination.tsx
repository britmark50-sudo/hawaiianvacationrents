import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pages,
  basePath,
  params,
}: {
  page: number;
  pages: number;
  basePath: string;
  params?: Record<string, string | string[] | undefined>;
}) {
  if (pages <= 1) return null;

  function href(p: number) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (k === "page" || v === undefined) continue;
      if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
      else if (v !== "") sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const nums: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) nums.push(p);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-full border border-deep/15 bg-white p-2.5 text-deep hover:bg-sand" aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {nums[0] > 1 && <span className="px-1 text-sm text-ink/40">…</span>}
      {nums.map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={
            p === page
              ? "rounded-full bg-deep px-4 py-2 text-sm font-semibold text-white"
              : "rounded-full border border-deep/15 bg-white px-4 py-2 text-sm font-medium text-deep hover:bg-sand"
          }
        >
          {p}
        </Link>
      ))}
      {nums[nums.length - 1] < pages && <span className="px-1 text-sm text-ink/40">…</span>}
      {page < pages && (
        <Link href={href(page + 1)} className="rounded-full border border-deep/15 bg-white p-2.5 text-deep hover:bg-sand" aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
