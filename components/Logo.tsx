import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <circle cx="21" cy="9" r="5" fill="#C6A15B" />
      <path
        d="M3 20c4.3-3.2 8.7-3.2 13 0s8.7 3.2 13 0"
        stroke="currentColor"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M3 26c4.3-3.2 8.7-3.2 13 0s8.7 3.2 13 0"
        stroke="currentColor"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={light ? "text-sand-light" : "text-teal"} />
      <span
        className={cn(
          "font-display text-lg font-semibold leading-none tracking-tight sm:text-xl",
          light ? "text-white" : "text-deep"
        )}
      >
        Hawaiian
        <span className={light ? "text-gold" : "text-teal"}> Vacation Rents</span>
      </span>
    </span>
  );
}
