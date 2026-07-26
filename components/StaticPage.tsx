import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

export async function StaticPage({ slug }: { slug: string }) {
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) notFound();
  return (
    <div className="shell max-w-3xl py-14">
      <h1 className="section-title">{page.title}</h1>
      <p className="mt-2 text-xs text-ink/45">Last updated {formatDate(page.updatedAt)}</p>
      <div
        className="prose prose-slate mt-8 max-w-none prose-headings:font-display prose-headings:text-deep prose-a:text-teal"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
      />
    </div>
  );
}
