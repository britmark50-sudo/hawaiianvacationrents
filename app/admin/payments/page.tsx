import { prisma } from "@/lib/db";
import { adminApprovePayment, adminRejectPayment } from "@/actions/admin";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { StatusPill } from "@/components/StatusPill";
import { formatCents, formatDate } from "@/lib/utils";
import { methodLabel, kindLabel } from "@/lib/payments";
import { tierInfo } from "@/lib/constants";

export default async function AdminPayments() {
  const reviewQueue = await prisma.payment.findMany({
    where: { status: "REVIEW" },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { email: true } },
      property: { select: { title: true, slug: true } },
    },
  });
  const [payments, totals] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        user: { select: { email: true } },
        property: { select: { title: true, slug: true } },
      },
    }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true }, _count: true }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="section-title">Payments</h1>
        <p className="text-sm text-ink/60">
          <strong className="font-display text-2xl font-semibold text-deep">
            {formatCents(totals._sum.amountCents || 0)}
          </strong>{" "}
          collected · {totals._count} paid
        </p>
      </div>
      {reviewQueue.length > 0 && (
        <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <h2 className="font-display text-lg font-semibold text-violet-900">
            ⏳ Awaiting your verification ({reviewQueue.length})
          </h2>
          <p className="mt-1 text-xs text-violet-800/70">
            The owner reports sending this PayPal payment — check your PayPal account for the
            reference below, then approve to publish instantly.
          </p>
          <div className="mt-4 space-y-3">
            {reviewQueue.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-deep">
                    {p.property?.title || "—"}
                    <span className="ml-2 text-xs font-medium text-ink/50">
                      {kindLabel(p.kind)}{p.tier ? ` · ${tierInfo(p.tier).name}` : ""} · {formatCents(p.amountCents)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink/55">
                    {p.user?.email} · ref: <span className="font-mono font-semibold text-deep">{p.payerReference}</span>{" "}
                    · code: <span className="font-mono font-semibold text-deep">HVR-{p.id.slice(-6).toUpperCase()}</span> · {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={adminApprovePayment.bind(null, p.id)}>
                    <button className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                      ✓ Approve & publish
                    </button>
                  </form>
                  <form action={adminRejectPayment.bind(null, p.id)}>
                    <ConfirmSubmit
                      confirmText="Reject this payment claim? The listing will not be published."
                      label="Reject"
                      className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    />
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-deep/10 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Listing</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Method</th>
              <th className="px-5 py-3.5">Amount</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-deep/5 last:border-0">
                <td className="px-5 py-3 text-ink/60">{formatDate(p.createdAt)}</td>
                <td className="max-w-[170px] truncate px-5 py-3 text-ink/60">{p.user?.email || "—"}</td>
                <td className="max-w-[200px] truncate px-5 py-3 font-medium text-deep">
                  {p.property?.title || "—"}
                </td>
                <td className="px-5 py-3 text-ink/60">
                  {kindLabel(p.kind)}
                  {p.tier ? ` · ${tierInfo(p.tier).name}` : ""}
                </td>
                <td className="px-5 py-3 text-ink/60">{methodLabel(p.method)}</td>
                <td className="px-5 py-3 font-semibold text-deep">{formatCents(p.amountCents)}</td>
                <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                <td className="max-w-[160px] truncate px-5 py-3 font-mono text-xs text-ink/45">
                  {p.providerRef || p.id}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-ink/50">No payments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
