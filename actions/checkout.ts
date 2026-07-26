"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, type Session } from "@/lib/auth";
import {
  paymentMode,
  paypalConfigured,
  paypalApiConfigured,
  paypalEmailConfigured,
  usdtConfigured,
  usdtAddress,
} from "@/lib/payments";
import { sendMail, emailShell } from "@/lib/mailer";
import { sendTelegram, tgPayPalReview } from "@/lib/telegram";
import { tierInfo as tierInfoOf } from "@/lib/constants";
import { createPayPalOrder } from "@/lib/paypal";
import { verifyUsdtStrict, normalizeTxHash, isValidTxHashFormat } from "@/lib/tron";
import {
  isRateLimited,
  isTxHashUsed,
  claimTxHash,
  recordAttempt,
  attemptFromResult,
  RATE_LIMIT_WINDOW_MINUTES,
} from "@/lib/txaudit";
import { headers } from "next/headers";
import { fulfillPayment } from "@/lib/billing";
import {
  LISTING_DURATION_DAYS,
  SITE_URL,
  isTierKey,
  tierInfo,
  tierPriceCents,
  type TierKey,
} from "@/lib/constants";
import { redirect } from "next/navigation";
import type { Property } from "@prisma/client";

async function loadOwnedProperty(propertyId: string): Promise<{ session: Session; property: Property }> {
  const session = await requireUser();
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) redirect("/dashboard");
  if (property.ownerId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");
  if (property.status === "SUSPENDED") redirect("/dashboard?error=suspended");
  return { session, property };
}

function normalizeTier(tier: string): TierKey {
  const t = (tier || "").toUpperCase();
  return isTierKey(t) ? t : "BASIC";
}

function checkoutConfig(tier: TierKey, property: Property) {
  const kind = property.status === "DRAFT" ? "PUBLISH" : "RENEWAL";
  return {
    kind,
    amountCents: tierPriceCents(tier),
    description: `${kind === "PUBLISH" ? "Publish" : "Renew"} (${tierInfo(tier).name} package, ${LISTING_DURATION_DAYS} days) — ${property.title}`,
  };
}

function successUrl(slug: string, tier: string, params: string) {
  return `/dashboard/success?listing=${slug}&plan=${tier.toLowerCase()}&${params}`;
}

// ---------- PayPal ----------

export async function payWithPayPal(propertyId: string, rawTier: string) {
  const { session, property } = await loadOwnedProperty(propertyId);
  const tier = normalizeTier(rawTier);
  if (paymentMode() === "mock" || !paypalConfigured()) {
    redirect(`/dashboard/checkout/${property.id}?tier=${tier.toLowerCase()}&error=paypal`);
  }
  const cfg = checkoutConfig(tier, property);

  // Manual mode: no API keys — owner sends to the account email, admin approves.
  if (!paypalApiConfigured() && paypalEmailConfigured()) {
    const payment = await prisma.payment.create({
      data: {
        kind: cfg.kind,
        tier,
        method: "PAYPAL",
        amountCents: cfg.amountCents,
        userId: session.userId,
        propertyId: property.id,
      },
    });
    redirect(`/dashboard/checkout/${property.id}/paypal?paymentId=${payment.id}`);
  }
  const payment = await prisma.payment.create({
    data: {
      kind: cfg.kind,
      tier,
      method: "PAYPAL",
      amountCents: cfg.amountCents,
      userId: session.userId,
      propertyId: property.id,
    },
  });

  let approveUrl = "";
  try {
    const order = await createPayPalOrder({
      amountCents: cfg.amountCents,
      description: cfg.description,
      paymentId: payment.id,
      returnUrl: `${SITE_URL}/api/paypal/return`,
      cancelUrl: `${SITE_URL}/dashboard?canceled=1`,
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: order.orderId },
    });
    approveUrl = order.approveUrl;
  } catch (err) {
    console.error("[checkout] paypal order failed", err);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }
  if (!approveUrl) {
    redirect(`/dashboard/checkout/${property.id}?tier=${tier.toLowerCase()}&error=paypal`);
  }
  redirect(approveUrl);
}

// ---------- USDT (TRC20) ----------

export async function payWithUsdt(propertyId: string, rawTier: string) {
  const { session, property } = await loadOwnedProperty(propertyId);
  const tier = normalizeTier(rawTier);
  if (paymentMode() === "mock" || !usdtConfigured()) {
    redirect(`/dashboard/checkout/${property.id}?tier=${tier.toLowerCase()}&error=usdt`);
  }
  const cfg = checkoutConfig(tier, property);
  const payment = await prisma.payment.create({
    data: {
      kind: cfg.kind,
      tier,
      method: "USDT_TRC20",
      amountCents: cfg.amountCents,
      userId: session.userId,
      propertyId: property.id,
    },
  });
  redirect(`/dashboard/checkout/${property.id}/usdt?paymentId=${payment.id}`);
}

export type UsdtVerifyState = { error?: string } | undefined;

const usdtSchema = z.object({
  paymentId: z.string().min(1),
  txHash: z.string().trim().min(10, "Please paste the transaction hash (TxID)."),
});

export async function submitUsdtTx(_prev: UsdtVerifyState, formData: FormData): Promise<UsdtVerifyState> {
  const session = await requireUser();
  const parsed = usdtSchema.safeParse({
    paymentId: formData.get("paymentId"),
    txHash: formData.get("txHash"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the form." };

  const hdrs = await headers();
  const ip =
    (hdrs.get("x-forwarded-for") || "").split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    null;

  const txHash = normalizeTxHash(parsed.data.txHash);
  const baseCtx = {
    txHash,
    userId: session.userId,
    userEmail: session.email,
    ip,
  };

  // 0) Format — reject junk before touching the network
  if (!isValidTxHashFormat(txHash)) {
    const message = "Invalid transaction hash — expected 64 hexadecimal characters (copy the TxID from your wallet).";
    await recordAttempt(baseCtx, { ok: false, code: "FORMAT", message });
    return { error: message };
  }

  // 1) Rate limiting per user and per IP (anti-guessing)
  if (await isRateLimited(session.userId, ip)) {
    const message = `Too many verification attempts. Please wait ${RATE_LIMIT_WINDOW_MINUTES} minutes and try again.`;
    await recordAttempt(baseCtx, { ok: false, code: "RATE_LIMIT", message });
    return { error: message };
  }

  // 2) Payment state
  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data.paymentId },
    include: { property: true },
  });
  if (!payment || !payment.property) {
    await recordAttempt(baseCtx, { ok: false, code: "PAYMENT_STATE", message: "Payment not found." });
    return { error: "Payment not found." };
  }
  const ctx = { ...baseCtx, paymentId: payment.id, propertyTitle: payment.property.title };
  if (payment.userId !== session.userId && session.role !== "ADMIN") {
    await recordAttempt(ctx, { ok: false, code: "PAYMENT_STATE", message: "Not the payment owner." });
    return { error: "You do not have permission to complete this payment." };
  }
  if (payment.status === "PAID") return { error: "This payment is already completed." };
  if (payment.method !== "USDT_TRC20") return { error: "This payment is not a USDT payment." };

  // 3) Lifetime replay protection (survives even deleted payments/listings)
  if (await isTxHashUsed(txHash)) {
    const message = "This transaction hash has already been used for a payment and can never be used again.";
    await recordAttempt(ctx, { ok: false, code: "REPLAY", message });
    return { error: message };
  }

  // 4-10) Strict on-chain verification: existence → success → official USDT
  // contract → exact recipient → amount → ≥19 confirmations → ≤30-min recency
  const result = await verifyUsdtStrict({
    txHash,
    toAddress: usdtAddress(),
    minUsdt: payment.amountCents / 100,
  });
  await recordAttempt(ctx, attemptFromResult(result));
  if (!result.ok) return { error: result.message };

  // 11) Claim the hash atomically — a concurrent double-submit loses here
  const claimed = await claimTxHash(txHash, payment.id);
  if (!claimed) {
    const message = "This transaction hash has already been used for a payment and can never be used again.";
    await recordAttempt(ctx, { ok: false, code: "REPLAY", message });
    return { error: message };
  }

  await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: txHash } });
  await fulfillPayment(payment.id, { providerRef: txHash });
  redirect(successUrl(payment.property.slug, payment.tier || "basic", "usdt=1"));
}

// ---------- PayPal manual claim (email mode) ----------

export type PayPalClaimState = { error?: string } | undefined;

const claimSchema = z.object({
  paymentId: z.string().min(1),
  reference: z
    .string()
    .trim()
    .min(5, "Please paste your PayPal Transaction ID (or the email you sent from)."),
});

export async function submitPayPalClaim(
  _prev: PayPalClaimState,
  formData: FormData
): Promise<PayPalClaimState> {
  const session = await requireUser();
  if (!paypalEmailConfigured()) return { error: "PayPal payments are not available right now." };

  const parsed = claimSchema.safeParse({
    paymentId: formData.get("paymentId"),
    reference: formData.get("reference"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Please check the form." };

  const payment = await prisma.payment.findUnique({
    where: { id: parsed.data.paymentId },
    include: { property: true, user: true },
  });
  if (!payment || !payment.property) return { error: "Payment not found." };
  if (payment.userId !== session.userId && session.role !== "ADMIN") {
    return { error: "You do not have permission to complete this payment." };
  }
  if (payment.status === "PAID") return { error: "This payment is already completed." };
  if (payment.method !== "PAYPAL") return { error: "This payment is not a PayPal payment." };

  const reference = parsed.data.reference.trim();
  const providerRef = `pp_manual_${reference.replace(/[^a-zA-Z0-9@._-]/g, "").slice(0, 60) || payment.id}`;

  const reused = await prisma.payment.findFirst({
    where: { providerRef, NOT: { id: payment.id } },
  });
  if (reused) return { error: "This PayPal transaction reference has already been used." };

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "REVIEW", providerRef, payerReference: reference },
  });

  // Notify the platform admin (best-effort)
  if (process.env.ADMIN_EMAIL) {
    await sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: `PayPal payment to verify — ${payment.property.title}`,
      html: emailShell(
        "PayPal payment awaiting review",
        `<p><strong>${payment.user?.email || "An owner"}</strong> reports sending a PayPal payment.</p>
         <table style="width:100%;font-size:14px;border-collapse:collapse;">
           <tr><td style="padding:6px 0;color:#7A8B90;">Listing</td><td style="text-align:right;">${payment.property.title}</td></tr>
           <tr><td style="padding:6px 0;color:#7A8B90;">Amount</td><td style="text-align:right;">${(payment.amountCents / 100).toFixed(2)}</td></tr>
           <tr><td style="padding:6px 0;color:#7A8B90;">Reference</td><td style="text-align:right;">${reference}</td></tr>
           <tr><td style="padding:6px 0;color:#7A8B90;">Code</td><td style="text-align:right;">HVR-${payment.id.slice(-6).toUpperCase()}</td></tr>
         </table>
         <p style="margin-top:16px;">Check your PayPal account, then approve it in the admin panel → Payments.</p>`
      ),
    });
  }

  await sendTelegram(
    tgPayPalReview({
      amountCents: payment.amountCents,
      tierName: tierInfoOf(payment.tier).name,
      listingTitle: payment.property.title,
      ownerEmail: payment.user?.email,
      reference,
      code: `HVR-${payment.id.slice(-6).toUpperCase()}`,
      adminUrl: `${SITE_URL}/admin/payments`,
    })
  );

  redirect("/dashboard?review=1");
}

// ---------- Mock (demo) gateway ----------

export async function startMockCheckout(propertyId: string, rawTier: string) {
  const { session, property } = await loadOwnedProperty(propertyId);
  const tier = normalizeTier(rawTier);
  if (paymentMode() !== "mock") redirect(`/dashboard/checkout/${property.id}?tier=${tier.toLowerCase()}`);
  const cfg = checkoutConfig(tier, property);
  const payment = await prisma.payment.create({
    data: {
      kind: cfg.kind,
      tier,
      method: "MOCK",
      amountCents: cfg.amountCents,
      userId: session.userId,
      propertyId: property.id,
    },
  });
  redirect(`/dashboard/checkout/${property.id}/mock?paymentId=${payment.id}`);
}

export async function completeMockPayment(paymentId: string) {
  const session = await requireUser();
  if (paymentMode() !== "mock") redirect("/dashboard");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { property: true },
  });
  if (!payment || !payment.property) redirect("/dashboard");
  if (payment.userId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");

  await fulfillPayment(paymentId, { providerRef: `demo_${paymentId.slice(-10)}` });
  redirect(successUrl(payment.property.slug, payment.tier || "basic", "mock=1"));
}
