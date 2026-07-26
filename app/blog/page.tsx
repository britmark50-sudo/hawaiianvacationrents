import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { BLOG_CATEGORIES } from "@/lib/constants";
import { BlogCard } from "@/components/BlogCard";

export const metadata: Metadata = {
  title: "Hawaii Travel Blog — Guides, Beaches, Food & Tips",
  description: "Practical Hawaii travel guides from the Hawaiian Vacation Rents team: the best beaches, activities, restaurants and first-timer tips for all four islands.",
};
export const revalidate = 600;

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="shell py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Plan like a local</p>
        <h1 className="section-title mt-2">Hawaiʻi travel blog</h1>
        <p className="mt-3 text-ink/65">
          Guides written to help you get the most out of the islands — beaches, food,
          adventures and honest advice on renting direct from owners.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/blog" className="rounded-full bg-deep px-4 py-2 text-xs font-bold text-white">
          All posts
        </Link>
        {BLOG_CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/blog/category/${c.key}`}
            className="rounded-full border border-deep/15 bg-white px-4 py-2 text-xs font-semibold text-deep hover:bg-sand"
          >
            {c.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="card mt-10 p-14 text-center text-ink/60">No articles yet — check back soon.</div>
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
