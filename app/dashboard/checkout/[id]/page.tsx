import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, CheckCircle2, Coins, Lock, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { payWithPayPal, payWithUsdt, startMockCheckout } from "@/actions/checkout";
import { paymentMode, paypalConfigured, paypalApiConfigured, usdtConfigured } from "@/lib/payments";
import {
  LISTING_DURATION_DAYS,
  TIERS,
  isTierKey,
  tierInfo,
  tierPriceCents,
  tierRank,
  type TierKey,
} from "@/lib/constants";
import { formatCents, formatDate, isListingLive } from "@/lib/utils";
import { TierBadge } from "@/components/TierBadge";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

const ERRORS: Record<string, string> = {
  paypal: "PayPal payment could not be started. Please try again or choose another method.",
  usdt: "USDT payments are not available right now. Please try another method.",
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; tier?: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const property = await prisma.property.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  if (!property) notFound();
  if (property.ownerId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");
  if (property.status === "SUSPENDED") redirect("/dashboard?error=suspended");

  const requested = (sp.tier || "").toUpperCase();
  const selected: TierKey = isTierKey(requested)
    ? requested
    : isListingLive(property) && isTierKey(property.tier)
      ? property.tier
      : "FEATURED"; // default to the most popular package

  const kind = property.status === "DRAFT" ? "PUBLISH" : "RENEWAL";
  const now = new Date();
  const base = property.expiresAt && property.expiresAt > now ? property.expiresAt : now;
  const until = new Date(base.getTime() + LISTING_DURATION_DAYS * 86400000);
  const priceCents = tierPriceCents(selected);
  const live = isListingLive(property);
  const downgrade = live && tierRank(selected) < tierRank(property.tier);

  const mock = paymentMode() === "mock";
  const paypal = !mock && paypalConfigured();
  const usdt = !mock && usdtConfigured();
  const error = sp.error;

  return (
    <div className="shell max-w-4xl py-12">
      <p className="eyebrow">{kind === "PUBLISH" ? "Step 2 of 2" : "Renew or change package"}</p>
      <h1 className="section-title mt-1">
        {kind === "PUBLISH" ? "Choose your package" : "Renew your listing"}
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        Every package runs {LISTING_DURATION_DAYS} days and publishes automatically after payment
        {kind === "RENEWAL" ? " — remaining days are always kept" : ""}.
      </p>

      {error && ERRORS[error] && (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3.5 text-sm font-medium text-amber-900">
          {ERRORS[error]}
        </div>
      )}

      {/* Property mini-card */}
      <div className="card mt-8 flex items-center gap-4 p-4">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-sand-dark">
          {property.photos[0] && (
            <img src={property.photos[0].url} alt={property.title} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-deep">{property.title}</p>
          <p className="text-xs text-ink/55">
            {property.city}
            {live && (
              <>
                {" "}· currently <strong className="text-deep">{tierInfo(property.tier).name}</strong> until{" "}
                {formatDate(property.expiresAt)}
              </>
            )}
          </p>
        </div>
        {live && <TierBadge tier={property.tier} />}
      </div>

      {/* Package selector */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => {
          const active = t.key === selected;
          return (
            <Link
              key={t.key}
              href={`/dashboard/checkout/${property.id}?tier=${t.key.toLowerCase()}`}
              className={
                "relative block rounded-2xl border-2 bg-white p-5 transition " +
                (active
                  ? "border-teal shadow-lift"
                  : "border-deep/10 hover:border-deep/30 hover:shadow-card")
              }
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-semibold text-deep">{t.name}</p>
                <span
                  className={
                    "flex h-5 w-5 items-center justify-center rounded-full border-2 " +
                    (active ? "border-teal bg-teal text-white" : "border-deep/20 bg-white")
                  }
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-semibold text-deep">
                {formatCents(tierPriceCents(t.key))}
                <span className="text-sm font-medium text-ink/45"> / {LISTING_DURATION_DAYS} days</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-teal">{t.tagline}</p>
              <ul className="mt-3 space-y-1.5">
                {t.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-xs leading-relaxed text-ink/65">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal" /> {b}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>

      {downgrade && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3.5 text-sm font-medium text-amber-900">
          This listing currently has the <strong>{tierInfo(property.tier).name}</strong> package.
          Buying <strong>{tierInfo(selected).name}</strong> will apply {tierInfo(selected).name}{" "}
          placement to the whole remaining period.
        </div>
      )}

      {/* Payment */}
      <div className="card mt-6 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-ink/60">
            {kind === "PUBLISH" ? "Publish" : "Renew"} with the{" "}
            <strong className="text-deep">{tierInfo(selected).name}</strong> package — live until{" "}
            {formatDate(until)}
          </p>
          <p className="font-display text-3xl font-semibold text-deep">{formatCents(priceCents)}</p>
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink/45">
          Choose your payment method
        </p>

        <div className="mt-3 space-y-3">
          {mock && (
            <>
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-medium leading-relaxed text-amber-900">
                Demo mode: no payment keys are configured, so the next step simulates a
                successful payment. In production, owners pay here with PayPal or USDT (TRC20).
              </div>
              <form action={startMockCheckout.bind(null, property.id, selected)}>
                <button className="btn-primary w-full !py-4 text-base">
                  <Lock className="h-4 w-4" /> Continue to simulated payment — {formatCents(priceCents)}
                </button>
              </form>
            </>
          )}

          {paypal && (
            <form action={payWithPayPal.bind(null, property.id, selected)}>
              <button className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-[#0070BA]/20 bg-white p-4 text-left transition hover:border-[#0070BA] hover:shadow-card">
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0070BA]/10">
                    <Wallet className="h-5 w-5 text-[#0070BA]" />
                  </span>
                  <span>
                    <span className="block font-display text-lg font-semibold text-[#003087]">
                      Pay<span className="text-[#0070BA]">Pal</span>
                    </span>
                    <span className="block text-xs text-ink/55">
                      {paypalApiConfigured()
                        ? "PayPal balance or credit/debit card · instant activation"
                        : "Send from your PayPal account · verified same day"}
                    </span>
                  </span>
                </span>
                <span className="rounded-full bg-[#0070BA] px-5 py-2 text-sm font-bold text-white">
                  Pay {formatCents(priceCents)}
                </span>
              </button>
            </form>
          )}

          {usdt && (
            <form action={payWithUsdt.bind(null, property.id, selected)}>
              <button className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-[#26A17B]/25 bg-white p-4 text-left transition hover:border-[#26A17B] hover:shadow-card">
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#26A17B]/10">
                    <Coins className="h-5 w-5 text-[#26A17B]" />
                  </span>
                  <span>
                    <span className="block font-display text-lg font-semibold text-[#1a7a5c]">
                      USDT <span className="text-ink/40">· TRC20</span>
                    </span>
                    <span className="block text-xs text-ink/55">
                      Crypto payment on Tron · verified on-chain automatically
                    </span>
                  </span>
                </span>
                <span className="rounded-full bg-[#26A17B] px-5 py-2 text-sm font-bold text-white">
                  Pay {(priceCents / 100).toFixed(0)} USDT
                </span>
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink/45">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal" />
          No auto-charges — renewals are always manual and keep your remaining days.
        </p>
      </div>

      <p className="mt-6 text-center">
        <Link href="/dashboard" className="text-sm font-semibold text-ink/50 hover:text-deep">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
