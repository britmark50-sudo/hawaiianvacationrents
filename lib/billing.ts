import "server-only";
import { prisma, getDb } from "@/lib/db";
import { sendMail, emailShell } from "@/lib/mailer";
import { LISTING_DURATION_DAYS, SITE_URL, tierInfo, isTierKey } from "@/lib/constants";
import { methodLabel, kindLabel } from "@/lib/payments";
import { sendTelegram, tgPaymentReceived } from "@/lib/telegram";
import { formatCents, formatDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

function revalidateProperty(p: { slug: string; island: string; citySlug: string }) {
  try {
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/rentals/${p.slug}`);
    revalidatePath(`/${p.island}`);
    revalidatePath(`/${p.island}/${p.citySlug}`);
  } catch {
    // best-effort (not available outside request scope)
  }
}

/**
 * Marks a payment as PAID and applies the purchased package:
 * activates/extends the listing (+30 days, remaining days kept) and sets its
 * visibility tier (BASIC / FEATURED / PREMIUM) to the purchased package.
 * Idempotent: safe to call twice for the same payment.
 */
export async function fulfillPayment(paymentId: string, opts?: { providerRef?: string }) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { property: true, user: true },
  });
  if (!payment) throw new Error("Payment not found: " + paymentId);
  if (payment.status === "PAID") return payment;
  if (!payment.property) throw new Error("Payment has no property: " + paymentId);

  const property = payment.property;
  const now = new Date();
  const base = property.expiresAt && property.expiresAt > now ? property.expiresAt : now;
  const expiresAt = new Date(base.getTime() + LISTING_DURATION_DAYS * 86400000);
  const tier = payment.tier && isTierKey(payment.tier) ? payment.tier : property.tier;

  const db = await getDb();
  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paidAt: now,
        providerRef: opts?.providerRef ?? payment.providerRef,
        receiptEmail: payment.user?.email ?? payment.receiptEmail,
      },
    }),
    db.property.update({
      where: { id: property.id },
      data: {
        status: "ACTIVE",
        publishedAt: property.publishedAt ?? now,
        expiresAt,
        reminderSent: false,
        tier,
      },
    }),
  ]);

  if (payment.user) {
    const pkg = tierInfo(tier);
    const kindLabel = payment.kind === "RENEWAL" ? "Listing renewal" : "Listing published";
    const listingUrl = `${SITE_URL}/rentals/${property.slug}`;
    await sendMail({
      to: payment.user.email,
      subject: `Receipt: ${kindLabel} (${pkg.name}) — ${property.title}`,
      html: emailShell(
        `${kindLabel} ✔`,
        `<p>Mahalo! Your payment was received.</p>
         <table style="width:100%;font-size:14px;border-collapse:collapse;">
           <tr><td style="padding:6px 0;color:#7A8B90;">Listing</td><td style="text-align:right;">${property.title}</td></tr>
           <tr><td style="padding:6px 0;color:#7A8B90;">Package</td><td style="text-align:right;"><strong>${pkg.name}</strong></td></tr>
           <tr><td style="padding:6px 0;color:#7A8B90;">Amount</td><td style="text-align:right;">${formatCents(payment.amountCents)} USD</td></tr>
           <tr><td style="padding:6px 0;color:#7A8B90;">Live until</td><td style="text-align:right;">${formatDate(expiresAt)}</td></tr>
         </table>
         <p style="margin-top:20px;"><a href="${listingUrl}" style="background:#EF6349;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">View your live listing</a></p>`
      ),
    });
  }

  // Instant admin notification (fire-and-forget)
  await sendTelegram(
    tgPaymentReceived({
      amountCents: payment.amountCents,
      kind: payment.kind,
      kindLabel: kindLabel(payment.kind),
      tierName: tierInfo(tier).name,
      methodLabel: methodLabel(payment.method),
      listingTitle: property.title,
      ownerEmail: payment.user?.email,
      providerRef: opts?.providerRef ?? payment.providerRef,
      listingUrl: `${SITE_URL}/rentals/${property.slug}`,
    })
  );

  revalidateProperty(property);
  return payment;
}
