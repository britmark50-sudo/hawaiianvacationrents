import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { capturePayPalOrder } from "@/lib/paypal";
import { fulfillPayment } from "@/lib/billing";
import { SITE_URL } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("token");
  if (!orderId) {
    return NextResponse.redirect(new URL("/dashboard?canceled=1", SITE_URL));
  }

  try {
    const { completed, paymentId } = await capturePayPalOrder(orderId);
    const payment = paymentId
      ? await prisma.payment.findUnique({ where: { id: paymentId }, include: { property: true } })
      : await prisma.payment.findUnique({ where: { providerRef: orderId }, include: { property: true } });

    if (completed && payment) {
      await fulfillPayment(payment.id, { providerRef: orderId });
      const slug = payment.property?.slug;
      const plan = (payment.tier || "basic").toLowerCase();
      return NextResponse.redirect(
        new URL(
          `/dashboard/success${slug ? `?listing=${slug}&plan=${plan}&paypal=1` : `?plan=${plan}&paypal=1`}`,
          SITE_URL
        )
      );
    }
    if (payment && payment.status === "PENDING") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }
  } catch (err) {
    console.error("[paypal] return handling failed", err);
  }
  return NextResponse.redirect(new URL("/dashboard?canceled=1", SITE_URL));
}
