import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreditCard, Lock } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { completeMockPayment } from "@/actions/checkout";
import { paymentMode, kindLabel } from "@/lib/payments";
import { tierInfo } from "@/lib/constants";
import { formatCents } from "@/lib/utils";

export const metadata: Metadata = { title: "Test Payment", robots: { index: false } };

export default async function MockPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const session = await requireUser();
  if (paymentMode() !== "mock") redirect("/dashboard");

  const { id } = await params;
  const { paymentId } = await searchParams;
  if (!paymentId) redirect("/dashboard");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { property: true },
  });
  if (!payment || payment.propertyId !== id || !payment.property) notFound();
  if (payment.userId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");
  if (payment.status !== "PENDING") redirect("/dashboard");

  return (
    <div className="shell flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-t-2xl bg-deep px-6 py-4 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-gold" /> HVR Simulated Gateway
          </p>
          <p className="mt-0.5 text-xs text-white/60">TEST MODE — no real charge will occur (PayPal / USDT in production)</p>
        </div>
        <div className="card !rounded-t-none p-6">
          <div className="flex items-center justify-between border-b border-deep/10 pb-4">
            <div className="min-w-0 pr-3">
              <p className="truncate text-sm font-semibold text-deep">{payment.property.title}</p>
              <p className="text-xs text-ink/50">
                {kindLabel(payment.kind)} · {tierInfo(payment.tier).name} package · 30 days
              </p>
            </div>
            <p className="font-display text-2xl font-semibold text-deep">
              {formatCents(payment.amountCents)}
            </p>
          </div>

          <div className="mt-5 space-y-3 opacity-70">
            <div>
              <span className="label">Card number</span>
              <div className="input flex items-center gap-2 bg-sand">
                <CreditCard className="h-4 w-4 text-ink/40" /> 4242 4242 4242 4242
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="label">Expiry</span>
                <div className="input bg-sand">12 / 30</div>
              </div>
              <div>
                <span className="label">CVC</span>
                <div className="input bg-sand">424</div>
              </div>
            </div>
          </div>

          <form action={completeMockPayment.bind(null, payment.id)} className="mt-6">
            <button className="btn-primary w-full !py-3.5">
              Pay {formatCents(payment.amountCents)} (simulated)
            </button>
          </form>
          <Link href="/dashboard?canceled=1" className="mt-3 block text-center text-sm font-semibold text-ink/50 hover:text-deep">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
