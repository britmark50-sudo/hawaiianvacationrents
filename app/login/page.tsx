import type { Metadata } from "next";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Log In", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="shell flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="eyebrow">Welcome back</p>
          <h1 className="section-title mt-2">Log in</h1>
          <p className="mt-2 text-sm text-ink/55">Manage your listings and renewals.</p>
        </div>
        <div className="card mt-8 p-8">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
