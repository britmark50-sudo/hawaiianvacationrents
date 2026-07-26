import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { paymentMode, paypalEmailConfigured, paypalEmail, kindLabel } from "@/lib/payments";
import { tierInfo } from "@/lib/constants";
import { PayPalManualPayment } from "@/components/PayPalManualPayment";

export const metadata: Metadata = { title: "Pay with PayPal", robots: { index: false } };

export default async function PayPalManualPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const session = await requireUser();
  if (paymentMode() !== "live" || !paypalEmailConfigured()) redirect("/dashboard");

  const { id } = await params;
  const { paymentId } = await searchParams;
  if (!paymentId) redirect(`/dashboard/checkout/${id}`);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { property: true },
  });
  if (!payment || payment.propertyId !== id || !payment.property) notFound();
  if (payment.userId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");
  if (payment.status === "PAID") redirect("/dashboard");

  const amount = `$${(payment.amountCents / 100).toFixed(2)}`;
  const referenceCode = `HVR-${payment.id.slice(-6).toUpperCase()}`;

  return (
    <div className="shell max-w-3xl py-12">
      <p className="eyebrow">PayPal</p>
      <h1 className="section-title mt-1">Complete your payment</h1>
      <p className="mt-2 text-sm text-ink/60">
        {kindLabel(payment.kind)} ({tierInfo(payment.tier).name} package) —{" "}
        <strong className="text-deep">{payment.property.title}</strong> for {amount}.
      </p>

      <div className="mt-8">
        <PayPalManualPayment
          paymentId={payment.id}
          paypalEmail={paypalEmail()}
          amount={amount}
          referenceCode={referenceCode}
        />
      </div>

      <p className="mt-6 text-center">
        <Link
          href={`/dashboard/checkout/${id}`}
          className="text-sm font-semibold text-ink/50 hover:text-deep"
        >
          ← Choose a different payment method
        </Link>
      </p>
    </div>
  );
}
