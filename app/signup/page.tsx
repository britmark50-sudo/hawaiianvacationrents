import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Create Account", robots: { index: false } };

export default function SignupPage() {
  return (
    <div className="shell flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="eyebrow">Create owner account</p>
          <h1 className="section-title mt-2">Sign up</h1>
          <p className="mt-2 text-sm text-ink/55">Create your account to start managing listings and renewals.</p>
        </div>
        <div className="card mt-8 p-8">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-teal hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
