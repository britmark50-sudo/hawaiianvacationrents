import { Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  if (tier === "PREMIUM") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-deep px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold shadow ring-1 ring-gold/60",
          className
        )}
      >
        <Crown className="h-3 w-3 fill-gold" /> Premium
      </span>
    );
  }
  if (tier === "FEATURED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow",
          className
        )}
      >
        <Star className="h-3 w-3 fill-white" /> Featured
      </span>
    );
  }
  return null;
}
