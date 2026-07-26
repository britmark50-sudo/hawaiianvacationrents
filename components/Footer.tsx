import Link from "next/link";
import { Linkedin } from "lucide-react";
import { Wordmark } from "@/components/Logo";
import { ISLANDS, SOCIAL_LINKS } from "@/lib/constants";

const columns = [
  {
    title: "Islands",
    links: ISLANDS.map((i) => ({ href: `/${i.slug}`, label: `${i.name} rentals` })),
  },
  {
    title: "Explore",
    links: [
      { href: "/search", label: "All rentals" },
      { href: "/favorites", label: "Saved favorites" },
      { href: "/blog", label: "Travel blog" },
      { href: "/about-us", label: "About us" },
    ],
  },
  {
    title: "For owners",
    links: [
      { href: "/signup", label: "List your home — $5" },
      { href: "/login", label: "Owner log in" },
      { href: "/dashboard", label: "Owner dashboard" },
      { href: "/terms-of-service", label: "Listing rules" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms-of-service", label: "Terms of service" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/contact", label: "Contact us" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-deep text-white">
      <div className="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Wordmark light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            The Hawaiʻi-only vacation home directory. Browse homes on all four islands and
            book direct with owners — no booking fees, no commissions.
          </p>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hawaiian Vacation Rents on LinkedIn"
            className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-[#0A66C2] hover:text-white"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-sm text-white/75 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 sm:flex-row">
          <p>© 2026 Hawaiian Vacation Rents · hawaiianvacationrents.com</p>
          <p>
            We are an advertising platform only — not a party to any rental transaction.
          </p>
        </div>
      </div>
    </footer>
  );
}
