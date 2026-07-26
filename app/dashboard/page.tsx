import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus, Eye, MousePointerClick, Home, FileText, Pencil, ExternalLink, RefreshCw, LogOut,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logout } from "@/actions/auth";
import { deleteOwnProperty } from "@/actions/owner";
import { StatusPill } from "@/components/StatusPill";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { formatCents, formatDate, formatPrice, daysUntil, isListingLive } from "@/lib/utils";
import { methodLabel, kindLabel } from "@/lib/payments";
import { tierInfo } from "@/lib/constants";
import { TierBadge } from "@/components/TierBadge";

export const metadata: Metadata = { title: "Owner Dashboard", robots: { index: false } };

const BANNERS: Record<string, { tone: "success" | "info" | "warn"; text: string }> = {
  welcome: { tone: "success", text: "Aloha! Your account is ready — add your first property below." },
  saved: { tone: "success", text: "Listing saved successfully." },
  deleted: { tone: "info", text: "Listing deleted." },
  canceled: { tone: "warn", text: "Payment canceled — your listing was not published." },
  review: { tone: "info", text: "Mahalo! Your PayPal payment is being verified — your listing publishes automatically the moment it's approved (usually within a few hours)." },
  suspended: { tone: "warn", text: "This listing was suspended by moderation and cannot be renewed. Contact support." },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  const bannerKey =
    ["welcome", "saved", "deleted", "canceled", "review"].find((k) => sp[k]) ||
    (sp.error && BANNERS[sp.error] ? sp.error : undefined);
  const banner = bannerKey ? BANNERS[bannerKey] : undefined;

  const [properties, payments] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: "desc" },
      include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.payment.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { property: { select: { title: true } } },
    }),
  ]);

  const liveCount = properties.filter((p) => isListingLive(p)).length;
  const totalViews = properties.reduce((s, p) => s + p.views, 0);
  const totalClicks = properties.reduce((s, p) => s + p.contactClicks, 0);

  const stats = [
    { icon: Home, label: "Live listings", value: liveCount },
    { icon: FileText, label: "Total listings", value: properties.length },
    { icon: Eye, label: "Total views", value: totalViews.toLocaleString() },
    { icon: MousePointerClick, label: "Contact reveals", value: totalClicks.toLocaleString() },
  ];

  return (
    <div className="shell py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Owner dashboard</p>
          <h1 className="section-title mt-1">Aloha, {session.name.split(" ")[0]}</h1>
        </div>
        <div className="flex items-center gap-3">
          <form action={logout}>
            <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-deep">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
          <Link href="/dashboard/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Add property
          </Link>
        </div>
      </div>

      {banner && (
        <div
          className={
            "mt-6 rounded-xl px-5 py-4 text-sm font-medium " +
            (banner.tone === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : banner.tone === "warn"
                ? "border border-amber-300 bg-amber-50 text-amber-900"
                : "border border-deep/15 bg-white text-deep")
          }
        >
          {banner.text}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-light text-teal">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-deep">{s.value}</p>
                <p className="text-xs font-medium text-ink/50">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl font-semibold text-deep">Your listings</h2>
      {properties.length === 0 ? (
        <div className="card mt-6 p-14 text-center">
          <p className="font-display text-2xl font-semibold text-deep">No listings yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
            Add your property, upload photos, pay the $5 flat fee and your ad goes live for
            30 days — automatically.
          </p>
          <Link href="/dashboard/new" className="btn-primary mt-6">
            <Plus className="h-4 w-4" /> Add your first property
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {properties.map((p) => {
            const live = isListingLive(p);
            const days = daysUntil(p.expiresAt);

            return (
              <div key={p.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-sand-dark sm:w-36">
                  {p.photos[0] && (
                    <img src={p.photos[0].url} alt={p.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-lg font-semibold text-deep">{p.title}</h3>
                    <StatusPill status={live ? "ACTIVE" : p.status === "ACTIVE" ? "EXPIRED" : p.status} />
                    {live && <TierBadge tier={p.tier} />}
                  </div>
                  <p className="mt-0.5 text-sm text-ink/55">
                    {p.city} · {formatPrice(p.pricePerNight)}/night
                  </p>
                  <p className="mt-1 text-xs text-ink/45">
                    {live
                      ? `Expires ${formatDate(p.expiresAt)} (${days} day${days === 1 ? "" : "s"} left)`
                      : p.status === "DRAFT"
                        ? "Not published yet — pay $5 to go live"
                        : p.status === "SUSPENDED"
                          ? "Suspended by moderation"
                          : "Expired — renew to get back online"}
                    {" · "}
                    {p.views} views · {p.contactClicks} contact reveals
                    {live && <span className="font-semibold text-teal"> · {tierInfo(p.tier).name} package</span>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/rentals/${p.slug}`} className="btn-outline !px-4 !py-2 text-xs" title="Preview">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </Link>
                  <Link href={`/dashboard/edit/${p.id}`} className="btn-outline !px-4 !py-2 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  {p.status !== "SUSPENDED" && (
                    <Link href={`/dashboard/checkout/${p.id}`} className="btn-primary !px-4 !py-2 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" />
                      {p.status === "DRAFT"
                        ? "Publish — from $5"
                        : live
                          ? "Extend / upgrade"
                          : "Renew — from $5"}
                    </Link>
                  )}
                  <form action={deleteOwnProperty.bind(null, p.id)}>
                    <ConfirmSubmit
                      confirmText={`Delete "${p.title}" permanently? This cannot be undone.`}
                      label="Delete"
                      className="rounded-full px-3 py-2 text-xs font-semibold text-coral hover:bg-coral-light"
                    />
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {payments.length > 0 && (
        <>
          <h2 className="mt-12 font-display text-2xl font-semibold text-deep">Payment history</h2>
          <div className="card mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-deep/10 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Listing</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id} className="border-b border-deep/5 last:border-0">
                    <td className="px-5 py-3 text-ink/70">{formatDate(pay.createdAt)}</td>
                    <td className="max-w-[220px] truncate px-5 py-3 font-medium text-deep">
                      {pay.property?.title || "—"}
                    </td>
                    <td className="px-5 py-3 text-ink/70">
                      {kindLabel(pay.kind)}
                      {pay.tier ? ` · ${tierInfo(pay.tier).name}` : ""}
                    </td>
                    <td className="px-5 py-3 text-ink/70">{methodLabel(pay.method)}</td>
                    <td className="px-5 py-3 font-semibold text-deep">{formatCents(pay.amountCents)}</td>
                    <td className="px-5 py-3"><StatusPill status={pay.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
