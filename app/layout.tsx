import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

// All data lives in the runtime database (D1 on Cloudflare) — render dynamically.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Hawaii Vacation Homes, Direct from Owners`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Browse Hawaii vacation rentals on Oahu, Maui, Kauai and the Big Island. Contact owners directly — no booking fees, no middlemen. Owners list for just $5 / 30 days.",
  keywords: [
    "Hawaii vacation rentals",
    "vacation rentals by owner Hawaii",
    "Maui vacation homes",
    "Oahu vacation rentals",
    "Kauai vacation rentals",
    "Big Island vacation rentals",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} — Hawaii Vacation Homes, Direct from Owners`,
    description:
      "The Hawaii-only vacation home directory. Search homes on all four islands and book direct with owners.",
    images: [{ url: "/seed/hero.jpg", width: 1600, height: 900, alt: "Hawaiian coastline" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
