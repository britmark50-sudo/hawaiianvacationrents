import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/StatusPill";
import { formatCents, formatDate } from "@/lib/utils";
import { kindLabel } from "@/lib/payments";
import { ISLANDS } from "@/lib/constants";

export default async function AdminOverview() {
  const now = new Date();
  const [
    userCount,
    activeCount,
    draftCount,
    expiredCount,
    suspendedCount,
    revenue,
    viewsAgg,
    openReports,
    newMessages,
    reviewPayments,
    recentPayments,
    islandRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count({ where: { status: "ACTIVE", expiresAt: { gt: now } } }),
    prisma.property.count({ where: { status: "DRAFT" } }),
    prisma.property.count({ where: { status: "EXPIRED" } }),
    prisma.property.count({ where: { status: "SUSPENDED" } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true }, _count: true }),
    prisma.property.aggregate({ _sum: { views: true, contactClicks: true } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.payment.count({ where: { status: "REVIEW" } }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { email: true } }, property: { select: { title: true } } },
    }),
    prisma.property.groupBy({
      by: ["island"],
      where: { status: "ACTIVE", expiresAt: { gt: now } },
      _count: { _all: true },
    }),
  ]);

  const islandCounts: Record<string, number> = {};
  for (const r of islandRows) islandCounts[r.island] = r._count._all;

  const cards = [
    { label: "Total revenue", value: formatCents(revenue._sum.amountCents || 0), sub: `${revenue._count} paid transactions` },
    { label: "Live listings", value: activeCount, sub: `${draftCount} drafts · ${expiredCount} expired · ${suspendedCount} suspended` },
    { label: "Registered users", value: userCount, sub: "owners & admins" },
    { label: "Engagement", value: (viewsAgg._sum.views || 0).toLocaleString(), sub: `${(viewsAgg._sum.contactClicks || 0).toLocaleString()} contact reveals` },
  ];

  return (
    <div>
      <h1 className="section-title">Overview</h1>

      {(openReports > 0 || newMessages > 0 || reviewPayments > 0) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {reviewPayments > 0 && (
            <Link href="/admin/payments" className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100">
              ⏳ {reviewPayments} PayPal payment{reviewPayments === 1 ? "" : "s"} awaiting verification
            </Link>
          )}
          {openReports > 0 && (
            <Link href="/admin/reports" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100">
              ⚑ {openReports} open report{openReports === 1 ? "" : "s"} need review
            </Link>
          )}
          {newMessages > 0 && (
            <Link href="/admin/messages" className="rounded-xl border border-teal/30 bg-teal-light px-4 py-2.5 text-sm font-semibold text-teal-dark hover:bg-teal/20">
              ✉ {newMessages} new message{newMessages === 1 ? "" : "s"}
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-deep">{c.value}</p>
            <p className="mt-1 text-xs text-ink/50">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="card overflow-x-auto">
          <p className="border-b border-deep/10 px-5 py-4 font-display text-lg font-semibold text-deep">
            Recent payments
          </p>
          <table className="w-full min-w-[560px] text-sm">
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id} className="border-b border-deep/5 last:border-0">
                  <td className="px-5 py-3 text-ink/60">{formatDate(p.createdAt)}</td>
                  <td className="max-w-[200px] truncate px-5 py-3 font-medium text-deep">{p.property?.title || "—"}</td>
                  <td className="px-5 py-3 text-ink/60">{p.user?.email || "—"}</td>
                  <td className="px-5 py-3">{kindLabel(p.kind)}</td>
                  <td className="px-5 py-3 font-semibold text-deep">{formatCents(p.amountCents)}</td>
                  <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr><td className="px-5 py-8 text-center text-ink/50">No payments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card h-fit p-5">
          <p className="font-display text-lg font-semibold text-deep">Live listings by island</p>
          <ul className="mt-4 space-y-3">
            {ISLANDS.map((i) => (
              <li key={i.slug} className="flex items-center justify-between text-sm">
                <span className="font-medium text-deep">{i.name}</span>
                <span className="rounded-full bg-teal-light px-2.5 py-0.5 text-xs font-bold text-teal-dark">
                  {islandCounts[i.slug] || 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
