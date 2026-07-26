import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { categoryLabel, SITE_URL } from "@/lib/constants";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { BlogCard } from "@/components/BlogCard";
import { JsonLd } from "@/components/JsonLd";
import { blogPostJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const posts = await prisma.blogPost.findMany({ where: { published: true }, select: { slug: true } });
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.published) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  const related = await prisma.blogPost.findMany({
    where: { published: true, id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 2,
  });

  return (
    <article className="py-14">
      <JsonLd data={blogPostJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Blog", url: `${SITE_URL}/blog` },
          { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
        ])}
      />

      <div className="shell max-w-3xl">
        <nav className="text-xs font-medium text-ink/50">
          <Link href="/blog" className="hover:text-deep">Blog</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/blog/category/${post.category}`} className="hover:text-deep">
            {categoryLabel(post.category)}
          </Link>
        </nav>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-deep sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-ink/50">
          {formatDate(post.publishedAt)} · by the Hawaiian Vacation Rents team
        </p>
      </div>

      {post.coverImage && (
        <div className="shell mt-8 max-w-4xl">
          <img
            src={post.coverImage}
            alt={post.title}
            className="aspect-[16/8] w-full rounded-2xl object-cover"
          />
        </div>
      )}

      <div className="shell mt-10 max-w-3xl">
        <div
          className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-deep prose-a:text-teal prose-strong:text-deep"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        <div className="mt-12 rounded-2xl bg-deep p-8 text-center">
          <h3 className="font-display text-2xl font-semibold text-white">
            Ready to find your Hawaiʻi home base?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/75">
            Browse owner-listed vacation homes on all four islands and book direct — no fees.
          </p>
          <Link href="/search" className="btn-primary mt-5">Browse rentals</Link>
        </div>
      </div>

      {related.length > 0 && (
        <div className="shell mt-16 max-w-4xl border-t border-deep/10 pt-10">
          <h2 className="font-display text-2xl font-semibold text-deep">Keep reading</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {related.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
