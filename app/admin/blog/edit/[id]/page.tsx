import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BlogPostForm } from "@/components/AdminForms";

export default async function AdminBlogEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div>
      <h1 className="section-title">Edit post</h1>
      <div className="mt-6">
        <BlogPostForm initial={post} />
      </div>
    </div>
  );
}
