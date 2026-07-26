import { prisma } from "@/lib/db";
import { adminSuspendUser, adminActivateUser, adminDeleteUser } from "@/actions/admin";
import { StatusPill } from "@/components/StatusPill";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { formatDate } from "@/lib/utils";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { _count: { select: { properties: true } } },
  });

  return (
    <div>
      <h1 className="section-title">Users</h1>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-deep/10 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Phone</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Listings</th>
              <th className="px-5 py-3.5">Joined</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-deep/5 last:border-0">
                <td className="px-5 py-3 font-medium text-deep">{u.name}</td>
                <td className="px-5 py-3 text-ink/60">{u.email}</td>
                <td className="px-5 py-3 text-ink/60">{u.phone || "—"}</td>
                <td className="px-5 py-3">
                  <span className={u.role === "ADMIN" ? "font-bold text-teal" : "text-ink/60"}>{u.role}</span>
                </td>
                <td className="px-5 py-3"><StatusPill status={u.status} /></td>
                <td className="px-5 py-3 text-ink/60">{u._count.properties}</td>
                <td className="px-5 py-3 text-ink/60">{formatDate(u.createdAt)}</td>
                <td className="px-5 py-3">
                  {u.role !== "ADMIN" && (
                    <div className="flex items-center justify-end gap-1.5">
                      {u.status === "SUSPENDED" ? (
                        <form action={adminActivateUser.bind(null, u.id)}>
                          <button className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                            Activate
                          </button>
                        </form>
                      ) : (
                        <form action={adminSuspendUser.bind(null, u.id)}>
                          <button className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100">
                            Suspend
                          </button>
                        </form>
                      )}
                      <form action={adminDeleteUser.bind(null, u.id)}>
                        <ConfirmSubmit
                          confirmText={`Delete ${u.email} and ALL their listings permanently?`}
                          label="Delete"
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-coral hover:bg-coral-light"
                        />
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
