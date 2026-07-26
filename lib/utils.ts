import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['‘’ʻ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function randomSuffix(len = 4): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function formatPrice(dollars: number): string {
  return "$" + dollars.toLocaleString("en-US");
}

export function formatCents(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(d: Date | string | null | undefined): number {
  if (!d) return 0;
  const date = typeof d === "string" ? new Date(d) : d;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export function parseAmenities(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((a) => typeof a === "string") : [];
  } catch {
    return [];
  }
}

export function truncate(text: string, len = 160): string {
  if (text.length <= len) return text;
  return text.slice(0, len - 1).trimEnd() + "…";
}

export function isListingLive(p: { status: string; expiresAt: Date | null }): boolean {
  return p.status === "ACTIVE" && !!p.expiresAt && p.expiresAt.getTime() > Date.now();
}
