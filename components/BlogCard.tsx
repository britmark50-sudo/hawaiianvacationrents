import Link from "next/link";
import { categoryLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export interface BlogCardData {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  publishedAt: Date;
}

export function BlogCard({ post }: { post: BlogCardData }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-sand-dark">
        <img
          src={post.coverImage || "/seed/hero.jpg"}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="pt-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="chip">{categoryLabel(post.category)}</span>
          <span className="text-ink/45">{formatDate(post.publishedAt)}</span>
        </div>
        <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-deep transition group-hover:text-teal">
          {post.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{post.excerpt}</p>
      </div>
    </Link>
  );
}
