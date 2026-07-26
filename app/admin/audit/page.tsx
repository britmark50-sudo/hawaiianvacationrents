import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { MIN_CONFIRMATIONS, MAX_TX_AGE_MINUTES } from "@/lib/tron";
import { RATE_LIMIT_ATTEMPTS, RATE_LIMIT_WINDOW_MINUTES } from "@/lib/txaudit";

const CODE_LABEL: Record<string, string> = {
  ACCEPTED: "Accepted",
  FORMAT: "Bad hash format",
  RATE_LIMIT: "Rate limited",
  REPLAY: "Replay attempt",
  EXISTENCE: "Not on-chain",
  NOT_SUCCESS: "Failed on-chain",
  CONTRACT: "Not official USDT",
  RECIPIENT: "Wrong recipient",
  AMOUNT: "Amount too low",
  CONFIRMATIONS: "Unconfirmed",
  RECENCY: "Too old",
  NETWORK: "Network error",
  PAYMENT_STATE: "Payment state",
};

export default async function AdminAudit({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const where =
    filter === "accepted" ? { ok: true } : filter === "rejected" ? { ok: false } : {};

  const [attempts, total, rejected] = await Promise.all([
    prisma.txVerifyAttempt.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.txVerifyAttempt.count(),
    prisma.txVerifyAttempt.count({ where: { ok: false } }),
  ]);

  const tabs = [
    { key: "", label: `All (${total})` },
    { key: "accepted", label: `Accepted (${total - rejected})` },
    { key: "rejected", label: `Rejected (${rejected})` },
  ];

  return (
    <div>
      <h1 className="section-title">USDT verification audit</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/55">
        Every transaction-hash submission is verified server-side against the TRON blockchain
        (TronScan, with TronGrid fallback) and logged here. Policy: official USDT contract only ·
        exact recipient match · amount ≥ price · ≥{MIN_CONFIRMATIONS} confirmations · sent within{" "}
        {MAX_TX_AGE_MINUTES} minutes · one lifetime use per hash · max {RATE_LIMIT_ATTEMPTS}{" "}
        attempts / {RATE_LIMIT_WINDOW_MINUTES} min per user or IP.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/audit?filter=${t.key}` : "/admin/audit"}
            className={
              (filter || "") === t.key
                ? "rounded-full bg-deep px-4 py-2 text-xs font-bold text-white"
                : "rounded-full border border-deep/15 bg-white px-4 py-2 text-xs font-semibold text-deep hover:bg-sand"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-deep/10 text-left text-xs font-bold uppercase tracking-wide text-ink/45">
              <th className="px-5 py-3.5">When</th>
              <th className="px-5 py-3.5">Result</th>
              <th className="px-5 py-3.5">Reason</th>
              <th className="px-5 py-3.5">Tx hash</th>
              <th className="px-5 py-3.5">Amount</th>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Listing</th>
              <th className="px-5 py-3.5">IP</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id} className="border-b border-deep/5 align-top last:border-0">
                <td className="whitespace-nowrap px-5 py-3 text-xs text-ink/60">
                  {formatDate(a.createdAt)}{" "}
                  {new Date(a.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={
                      "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide " +
                      (a.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700")
                    }
                  >
                    {a.ok ? "Accepted" : CODE_LABEL[a.code] || a.code}
                  </span>
                </td>
                <td className="max-w-[260px] px-5 py-3 text-xs leading-relaxed text-ink/65">{a.message}</td>
                <td className="px-5 py-3 font-mono text-xs">
                  {/^[0-9a-f]{64}$/.test(a.txHash) ? (
                    <a
                      href={`https://tronscan.org/#/transaction/${a.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal hover:underline"
                    >
                      {a.txHash.slice(0, 10)}…{a.txHash.slice(-6)}
                    </a>
                  ) : (
                    <span className="text-ink/50">{a.txHash.slice(0, 16)}…</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-xs text-ink/65">
                  {a.amountUsdt != null ? `${a.amountUsdt} USDT` : "—"}
                  {a.confirmations != null ? ` · ${a.confirmations} conf` : ""}
                </td>
                <td className="max-w-[150px] truncate px-5 py-3 text-xs text-ink/60">{a.userEmail || "—"}</td>
                <td className="max-w-[160px] truncate px-5 py-3 text-xs text-ink/60">{a.propertyTitle || "—"}</td>
                <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-ink/45">{a.ip || "—"}</td>
              </tr>
            ))}
            {attempts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-ink/50">
                  No verification attempts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
