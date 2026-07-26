import { BlogPostForm } from "@/components/AdminForms";

export default function AdminBlogNew() {
  return (
    <div>
      <h1 className="section-title">New blog post</h1>
      <div className="mt-6">
        <BlogPostForm />
      </div>
    </div>
  );
}
