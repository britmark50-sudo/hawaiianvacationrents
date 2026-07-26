"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { ISLANDS } from "@/lib/constants";

export function HeaderClient({
  session: serverSession,
}: {
  session: { name: string; role: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(serverSession);

  // Statically-rendered pages are built without request cookies, so hydrate
  // the login state from the non-sensitive UI hint cookie on the client.
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )hvr_ui=([^;]+)/);
      if (match) {
        const d = JSON.parse(decodeURIComponent(match[1]));
        setSession({ name: d.n || "", role: d.r || "OWNER" });
      } else {
        setSession(serverSession);
      }
    } catch {
      setSession(serverSession);
    }
  }, [serverSession]);

  const navLinks = [
    ...ISLANDS.map((i) => ({ href: `/${i.slug}`, label: i.name })),
    { href: "/blog", label: "Blog" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-deep/10 bg-sand-light/90 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Hawaiian Vacation Rents — home" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-deep/75 lg:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-deep">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/favorites"
            aria-label="Saved favorites"
            className="rounded-full border border-deep/15 bg-white p-2.5 text-deep/70 transition hover:text-coral"
          >
            <Heart className="h-4 w-4" />
          </Link>
          {session ? (
            <>
              {session.role === "ADMIN" && (
                <Link href="/admin" className="text-sm font-semibold text-deep/70 hover:text-deep">
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className="btn-outline">
                Dashboard
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-deep/70 hover:text-deep">
              Log in
            </Link>
          )}
          <Link href={session ? "/dashboard/new" : "/signup"} className="btn-primary !px-5 !py-2.5">
            List your home
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-deep lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-deep/10 bg-sand-light lg:hidden">
          <nav className="shell flex flex-col gap-1 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-deep/80 hover:bg-sand"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/favorites"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-deep/80 hover:bg-sand"
            >
              Saved favorites
            </Link>
            <div className="mt-3 flex flex-col gap-2 border-t border-deep/10 pt-4">
              {session ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-outline w-full">
                    Dashboard
                  </Link>
                  {session.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="btn-outline w-full">
                      Admin panel
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline w-full">
                  Log in
                </Link>
              )}
              <Link
                href={session ? "/dashboard/new" : "/signup"}
                onClick={() => setOpen(false)}
                className="btn-primary w-full"
              >
                List your home — $5
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
