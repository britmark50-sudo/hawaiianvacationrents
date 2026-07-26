import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  DRAFT: "bg-deep/10 text-deep",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  SUSPENDED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-800",
  REVIEW: "bg-violet-100 text-violet-700",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-700",
  CANCELED: "bg-deep/10 text-deep",
  OPEN: "bg-red-100 text-red-700",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  DISMISSED: "bg-deep/10 text-deep",
  NEW: "bg-teal-light text-teal-dark",
  HANDLED: "bg-deep/10 text-deep",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        STYLES[status] || "bg-deep/10 text-deep",
        className
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
