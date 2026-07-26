import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Crown, Star, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { tierInfo, tierPriceCents } from "@/lib/constants";
import { formatCents, isListingLive } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment Successful", robots: { index: false } };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; plan?: string; mock?: string; paypal?: string; usdt?: string }>;
}) {
  await requireUser();
  const { listing, plan, mock, paypal, usdt } = await searchParams;
  const property = listing
    ? await prisma.property.findUnique({
        where: { slug: listing },
        select: { id: true, slug: true, title: true, status: true, expiresAt: true, tier: true },
      })
    : null;

  const tier = (plan || "basic").toUpperCase();
  const pkg = tierInfo(tier);
  const methodNote = paypal
    ? "Paid via PayPal."
    : usdt
      ? "Paid with USDT (TRC20) — verified on-chain."
      : mock
        ? "Simulated payment (demo mode)."
        : "";

  const headline =
    tier === "PREMIUM"
      ? "Your listing is live — Premium 👑"
      : tier === "FEATURED"
        ? "Your listing is live — Featured ⭐"
        : "Mahalo — your listing is live!";

  const detail =
    tier === "PREMIUM"
      ? "It now sits at the very top of all search results, wears the Premium badge, and gets homepage showcase placement for the next 30 days."
      : tier === "FEATURED"
        ? "It now appears above all Basic listings with a gold Featured badge for the next 30 days."
        : "It is visible to travelers for the next 30 days.";

  const showUpsell =
    property &&
    isListingLive({ status: property.status, expiresAt: property.expiresAt }) &&
    property.tier === "BASIC";

  return (
    <div className="shell flex justify-center py-20">
      <div className="w-full max-w-lg text-center">
        {tier === "PREMIUM" ? (
          <Crown className="mx-auto h-16 w-16 fill-gold text-gold" />
        ) : tier === "FEATURED" ? (
          <Star className="mx-auto h-16 w-16 fill-gold text-gold" />
        ) : (
          <CheckCircle2 className="mx-auto h-16 w-16 text-teal" />
        )}
        <h1 className="mt-5 font-display text-4xl font-semibold text-deep">{headline}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/65">
          {detail} A receipt has been sent to your email.{methodNote ? ` ${methodNote}` : ""}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {property && (
            <Link href={`/rentals/${property.slug}`} className="btn-primary">
              View your listing
            </Link>
          )}
          <Link href="/dashboard" className="btn-outline">Back to dashboard</Link>
        </div>

        {showUpsell && property && (
          <div className="mt-10 rounded-2xl border border-gold/40 bg-gold-light p-6 text-left">
            <p className="flex items-center gap-2 font-display text-lg font-semibold text-deep">
              <TrendingUp className="h-5 w-5 text-gold" /> Want more eyes on it?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
              {pkg.name === "Basic" ? "Featured listings appear above every Basic listing; Premium listings top all results and get homepage placement." : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/checkout/${property.id}?tier=featured`}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95"
              >
                <Star className="h-4 w-4" /> Featured — {formatCents(tierPriceCents("FEATURED"))}
              </Link>
              <Link
                href={`/dashboard/checkout/${property.id}?tier=premium`}
                className="inline-flex items-center gap-2 rounded-full bg-deep px-5 py-2.5 text-sm font-bold text-gold transition hover:bg-ink"
              >
                <Crown className="h-4 w-4" /> Premium — {formatCents(tierPriceCents("PREMIUM"))}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
