import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  adminDismissReport, adminResolveReport, adminResolveReportAndSuspend,
} from "@/actions/admin";
import { StatusPill } from "@/components/StatusPill";
import { REPORT_REASONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

function reasonLabel(key: string) {
  return REPORT_REASONS.find((r) => r.key === key)?.label || key;
}

export default async function AdminReports() {
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { property: { select: { title: true, slug: true, status: true } } },
  });

  const open = reports.filter((r) => r.status === "OPEN");
  const closed = reports.filter((r) => r.status !== "OPEN");

  return (
    <div>
      <h1 className="section-title">Reports</h1>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wider text-ink/45">
        Open ({open.length})
      </h2>
      <div className="mt-3 space-y-4">
        {open.length === 0 && (
          <div className="card p-8 text-center text-sm text-ink/50">No open reports. 🎉</div>
        )}
        {open.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-coral">{reasonLabel(r.reason)}</p>
                <p className="mt-1 font-medium text-deep">
                  <Link href={`/rentals/${r.property.slug}`} className="hover:text-teal">
                    {r.property.title}
                  </Link>{" "}
                  <StatusPill status={r.property.status} className="ml-1" />
                </p>
                {r.details && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/70">“{r.details}”</p>}
                <p className="mt-2 text-xs text-ink/45">
                  {formatDate(r.createdAt)}
                  {r.reporterEmail ? ` · reported by ${r.reporterEmail}` : " · anonymous report"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <form action={adminDismissReport.bind(null, r.id)}>
                  <button className="rounded-full border border-deep/15 px-4 py-2 text-xs font-semibold text-deep hover:bg-sand">
                    Dismiss
                  </button>
                </form>
                <form action={adminResolveReport.bind(null, r.id)}>
                  <button className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                    Resolve
                  </button>
                </form>
                <form action={adminResolveReportAndSuspend.bind(null, r.id)}>
                  <button className="rounded-full bg-coral px-4 py-2 text-xs font-bold text-white hover:bg-coral-dark">
                    Resolve + suspend listing
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {closed.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-ink/45">
            Closed ({closed.length})
          </h2>
          <div className="card mt-3 divide-y divide-deep/5">
            {closed.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span className="text-ink/60">
                  {reasonLabel(r.reason)} — <span className="font-medium text-deep">{r.property.title}</span>
                </span>
                <span className="flex items-center gap-3 text-xs text-ink/45">
                  {formatDate(r.resolvedAt)} <StatusPill status={r.status} />
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
