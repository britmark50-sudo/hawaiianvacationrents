import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard, Home, Users, CreditCard, Flag, Newspaper, FileText, MessageSquare, ShieldCheck,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/actions/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Listings", icon: Home },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/audit", label: "USDT audit", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="shell grid items-start gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="card top-24 p-3 lg:sticky">
        <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-ink/40">
          Platform admin
        </p>
        <nav className="space-y-0.5">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-deep/75 transition hover:bg-sand hover:text-deep"
            >
              <n.icon className="h-4 w-4 text-teal" /> {n.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-2 border-t border-deep/10 px-3 pt-3">
          <button className="text-sm font-semibold text-ink/45 hover:text-deep">Log out</button>
        </form>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
