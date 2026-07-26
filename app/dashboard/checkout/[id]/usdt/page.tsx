import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { paymentMode, usdtConfigured, usdtAddress, kindLabel } from "@/lib/payments";
import { tierInfo } from "@/lib/constants";

export const metadata: Metadata = { title: "Pay with USDT", robots: { index: false } };

export default async function UsdtPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const session = await requireUser();
  if (paymentMode() !== "live" || !usdtConfigured()) redirect("/dashboard");

  const { id } = await params;
  const { paymentId } = await searchParams;
  if (!paymentId) redirect(`/dashboard/checkout/${id}`);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { property: true },
  });
  if (!payment || payment.propertyId !== id || !payment.property) notFound();
  if (payment.userId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");
  if (payment.status !== "PENDING") redirect("/dashboard");

  const address = usdtAddress();
  const amountUsdt = (payment.amountCents / 100).toFixed(0);
  const qrSvg = await QRCode.toString(address, { type: "svg", margin: 1, width: 240 });

  const { UsdtPayment } = await import("@/components/UsdtPayment");

  return (
    <div className="shell max-w-3xl py-12">
      <p className="eyebrow">USDT · TRC20</p>
      <h1 className="section-title mt-1">Crypto payment</h1>
      <p className="mt-2 text-sm text-ink/60">
        {kindLabel(payment.kind)} ({tierInfo(payment.tier).name} package) —{" "}
        <strong className="text-deep">{payment.property.title}</strong> for {amountUsdt} USDT.
      </p>

      <div className="mt-8">
        <UsdtPayment
          paymentId={payment.id}
          address={address}
          qrSvg={qrSvg}
          amountUsdt={amountUsdt}
        />
      </div>

      <p className="mt-6 text-center">
        <Link href={`/dashboard/checkout/${id}`} className="text-sm font-semibold text-ink/50 hover:text-deep">
          ← Choose a different payment method
        </Link>
      </p>
    </div>
  );
}
