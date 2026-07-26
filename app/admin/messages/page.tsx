import { prisma } from "@/lib/db";
import { adminMarkMessageHandled } from "@/actions/admin";
import { StatusPill } from "@/components/StatusPill";
import { formatDate } from "@/lib/utils";

export default async function AdminMessages() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return (
    <div>
      <h1 className="section-title">Contact messages</h1>
      <div className="mt-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-deep">
                  {m.subject || "(no subject)"} <StatusPill status={m.status} className="ml-1.5" />
                </p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {m.name} · <a href={`mailto:${m.email}`} className="text-teal hover:underline">{m.email}</a> · {formatDate(m.createdAt)}
                </p>
                <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-ink/75">{m.message}</p>
              </div>
              {m.status === "NEW" && (
                <form action={adminMarkMessageHandled.bind(null, m.id)}>
                  <button className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                    Mark handled
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="card p-10 text-center text-sm text-ink/50">No messages yet.</div>
        )}
      </div>
    </div>
  );
}
