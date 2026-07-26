import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  adminSuspendProperty, adminUnsuspendProperty, adminDeleteProperty, adminSetTier,
} from "@/actions/admin";
import { StatusPill } from "@/components/StatusPill";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { formatDate, formatPrice } from "@/lib/utils";
import { TIERS } from "@/lib/constants";

const TABS = ["ALL", "ACTIVE", "DRAFT", "EXPIRED", "SUSPENDED"] as const;

export default async function AdminProperties({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = TABS.includes((status || "ALL") as (typeof TABS)[number]) ? status || "ALL" : "ALL";

  const properties = await prisma.property.findMany({
    where: filter === "ALL" ? {} : { status: filter },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { owner: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="section-title">Listings</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === "ALL" ? "/admin/properties" : `/admin/properties?status=${t}`}
            className={
              filter === t
                ? "rounded-full bg-deep px-4 py-2 text-xs font-bold text-white"
                : "rounded-full border border-deep/15 bg-white px-4 py-2 text-xs font-semibold text-deep hover:bg-sand"
            }
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-deep/10 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
              <th className="px-5 py-3.5">Listing</th>
              <th className="px-5 py-3.5">Owner</th>
              <th className="px-5 py-3.5">Location</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5">Package</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Expires</th>
              <th className="px-5 py-3.5">Views</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-b border-deep/5 align-middle last:border-0">
                <td className="max-w-[220px] px-5 py-3">
                  <Link href={`/rentals/${p.slug}`} className="block truncate font-medium text-deep hover:text-teal">
                    {p.title}
                  </Link>
                </td>
                <td className="max-w-[160px] truncate px-5 py-3 text-ink/60">{p.owner.email}</td>
                <td className="px-5 py-3 text-ink/60">{p.city}</td>
                <td className="px-5 py-3 font-semibold text-deep">{formatPrice(p.pricePerNight)}</td>
                <td className="px-5 py-3">
                  <form action={adminSetTier.bind(null, p.id)} className="flex items-center gap-1">
                    <select
                      name="tier"
                      defaultValue={p.tier}
                      className="rounded-lg border border-deep/15 bg-white px-2 py-1 text-xs font-semibold text-deep"
                    >
                      {TIERS.map((t) => (
                        <option key={t.key} value={t.key}>{t.name}</option>
                      ))}
                    </select>
                    <button className="rounded-full border border-deep/15 px-2.5 py-1 text-xs font-bold text-teal hover:bg-teal-light">
                      Set
                    </button>
                  </form>
                </td>
                <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                <td className="px-5 py-3 text-ink/60">{formatDate(p.expiresAt)}</td>
                <td className="px-5 py-3 text-ink/60">{p.views}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/dashboard/edit/${p.id}`} className="rounded-full border border-deep/15 px-3 py-1.5 text-xs font-semibold text-deep hover:bg-sand">
                      Edit
                    </Link>
                    {p.status === "SUSPENDED" ? (
                      <form action={adminUnsuspendProperty.bind(null, p.id)}>
                        <button className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                          Unsuspend
                        </button>
                      </form>
                    ) : (
                      <form action={adminSuspendProperty.bind(null, p.id)}>
                        <button className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100">
                          Suspend
                        </button>
                      </form>
                    )}
                    <form action={adminDeleteProperty.bind(null, p.id)}>
                      <ConfirmSubmit
                        confirmText={`Delete "${p.title}" permanently?`}
                        label="Delete"
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-coral hover:bg-coral-light"
                      />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-10 text-center text-ink/50">No listings.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
