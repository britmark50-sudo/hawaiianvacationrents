import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PropertyForm } from "@/components/PropertyForm";

export const metadata: Metadata = { title: "Add Property", robots: { index: false } };

export default async function NewPropertyPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  return (
    <div className="shell max-w-4xl py-10">
      <p className="eyebrow">Step 1 of 2</p>
      <h1 className="section-title mt-1">Add your property</h1>
      <p className="mt-2 text-sm text-ink/60">
        Fill in the details below. Next you will review and pay the flat $5 fee — your
        listing publishes automatically the moment payment succeeds.
      </p>
      <div className="mt-8">
        <PropertyForm
          defaultContact={{
            name: user?.name || session.name,
            email: user?.email || session.email,
            phone: user?.phone,
          }}
        />
      </div>
    </div>
  );
}
