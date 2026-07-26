import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageForm } from "@/components/AdminForms";

export default async function AdminPageEdit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) notFound();
  return (
    <div>
      <h1 className="section-title">Edit page — {page.title}</h1>
      <div className="mt-6">
        <PageForm slug={slug} initial={{ title: page.title, content: page.content }} />
      </div>
    </div>
  );
}
