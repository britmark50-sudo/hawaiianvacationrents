import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BLOG_CATEGORIES, categoryLabel } from "@/lib/constants";
import { BlogCard } from "@/components/BlogCard";

export const revalidate = 600;

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ category: c.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!BLOG_CATEGORIES.some((c) => c.key === category)) return {};
  return {
    title: `${categoryLabel(category)} — Hawaii Travel Blog`,
    description: `Hawaii ${categoryLabel(category).toLowerCase()} articles from Hawaiian Vacation Rents.`,
  };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!BLOG_CATEGORIES.some((c) => c.key === category)) notFound();

  const posts = await prisma.blogPost.findMany({
    where: { published: true, category },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="shell py-14">
      <p className="eyebrow">Hawaiʻi travel blog</p>
      <h1 className="section-title mt-2">{categoryLabel(category)}</h1>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/blog" className="rounded-full border border-deep/15 bg-white px-4 py-2 text-xs font-semibold text-deep hover:bg-sand">
          All posts
        </Link>
        {BLOG_CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/blog/category/${c.key}`}
            className={
              c.key === category
                ? "rounded-full bg-deep px-4 py-2 text-xs font-bold text-white"
                : "rounded-full border border-deep/15 bg-white px-4 py-2 text-xs font-semibold text-deep hover:bg-sand"
            }
          >
            {c.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="card mt-10 p-14 text-center text-ink/60">No articles in this category yet.</div>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
