import Link from "next/link";
import { CheckCircle2, Search, MessageCircle, HandCoins, ArrowRight, Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { latestListings, countActiveByIsland } from "@/lib/listings";
import { ISLANDS, SITE_NAME, TIERS, tierPriceCents } from "@/lib/constants";
import { formatCents } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { BlogCard } from "@/components/BlogCard";
import { JsonLd } from "@/components/JsonLd";
import { websiteJsonLd } from "@/lib/seo";

export const revalidate = 600;

export default async function HomePage() {
  const [counts, listings, posts] = await Promise.all([
    countActiveByIsland(),
    latestListings(8),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <>
      <JsonLd data={websiteJsonLd()} />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <img
            src="/seed/hero.jpg"
            alt="Aerial view of the Hawaiian coastline at golden hour"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep/75 via-deep/35 to-deep/75" />
        </div>
        <div className="shell relative flex min-h-[78vh] flex-col items-center justify-center py-24 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-light/90">
            The Hawaiʻi-only vacation home directory
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.04] sm:text-6xl md:text-7xl">
            Find your place in paradise.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/85 sm:text-lg">
            Vacation homes across Oʻahu, Maui, Kauaʻi and the Big Island — listed by real
            owners. No booking fees, no middlemen. Reach out and book direct.
          </p>
          <SearchBar />
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-medium text-white/80">
            {["No booking fees", "Direct owner contact", "100% Hawaiʻi"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-gold" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Islands */}
      <section className="shell py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Four islands, four moods</p>
            <h2 className="section-title mt-2">Choose your island</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-teal hover:underline">
            Browse all rentals →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ISLANDS.map((island) => (
            <Link key={island.slug} href={`/${island.slug}`} className="group relative block overflow-hidden rounded-2xl">
              <div className="aspect-[4/5]">
                <img
                  src={island.image}
                  alt={`${island.name} — ${island.nickname}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-light/90">
                  {island.nickname}
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-white">{island.name}</h3>
                <p className="mt-1 text-xs font-semibold text-white/75">
                  {counts[island.slug] || 0} homes listed
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest listings */}
      {listings.length > 0 && (
        <section className="bg-white py-20">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Fresh on the market</p>
                <h2 className="section-title mt-2">Latest vacation homes</h2>
              </div>
            </div>
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {listings.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/search" className="btn-outline">
                Browse all rentals <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="shell py-20" id="how-it-works">
        <div className="text-center">
          <p className="eyebrow">Book direct, save big</p>
          <h2 className="section-title mt-2">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">
            {SITE_NAME} is a directory, not a booking site. You deal directly with the
            homeowner — the way vacation rentals used to work.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Search & filter",
              text: "Explore homes by island, town, price, size and amenities. Every listing is in Hawaiʻi — nothing else.",
            },
            {
              icon: MessageCircle,
              title: "Contact the owner",
              text: "Each listing shows the owner's real contact details. Call or email them directly with your dates and questions.",
            },
            {
              icon: HandCoins,
              title: "Book direct & save",
              text: "Agree on terms with the owner, sign their rental agreement and skip the 15–20% platform service fees.",
            },
          ].map((step, i) => (
            <div key={step.title} className="card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-light text-teal">
                <step.icon className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink/40">Step {i + 1}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-deep">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Owner CTA */}
      <section className="shell pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-deep">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #C6A15B 0%, transparent 70%)" }}
          />
          <div className="relative grid items-center gap-10 px-7 py-14 lg:grid-cols-2 lg:px-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">For homeowners</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
                Own a home in Hawaiʻi? <br /> Get it in front of travelers.
              </h2>
              <p className="mt-4 max-w-md text-white/75">
                No commissions. No booking fees. Travelers contact you directly — you stay
                in full control of your calendar, pricing and guests.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-white/85">
                {[
                  "Live in minutes — your ad publishes automatically after payment",
                  "Packages from $5 — Featured & Premium placement for maximum exposure",
                  "Photo gallery, map, amenities and direct contact details",
                  "View and inquiry stats in your owner dashboard",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-lift">
              <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-ink/45">
                Simple flat packages · 30 days each
              </p>
              <div className="mt-5 space-y-3">
                {TIERS.map((t) => (
                  <div
                    key={t.key}
                    className={
                      "flex items-baseline justify-between gap-3 rounded-xl border px-4 py-3 " +
                      (t.key === "PREMIUM"
                        ? "border-gold/60 bg-gold-light"
                        : t.key === "FEATURED"
                          ? "border-gold/30 bg-sand-light"
                          : "border-deep/10")
                    }
                  >
                    <div>
                      <p className="font-display text-lg font-semibold text-deep">
                        {t.name}
                        {t.highlight && (
                          <span className="ml-2 rounded-full bg-coral px-2 py-0.5 align-middle text-[9px] font-bold uppercase text-white">
                            Popular
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink/55">{t.tagline}</p>
                    </div>
                    <p className="font-display text-2xl font-semibold text-deep">
                      {formatCents(tierPriceCents(t.key))}
                    </p>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="btn-primary mt-6 w-full">
                List your home
              </Link>
              <p className="mt-3 text-center text-xs text-ink/45">
                Pay with PayPal or USDT (TRC20) · publishes automatically
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog teasers */}
      {posts.length > 0 && (
        <section className="shell pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Plan your trip</p>
              <h2 className="section-title mt-2">From the travel blog</h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-teal hover:underline">
              All articles →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
