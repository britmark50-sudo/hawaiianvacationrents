import Link from "next/link";
import { notFound } from "next/navigation";
import { islandBySlug, citiesForIsland } from "@/lib/constants";
import { latestListings } from "@/lib/listings";
import { PropertyCard } from "@/components/PropertyCard";

export const revalidate = 600;

export default async function IslandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const island = islandBySlug(slug);
  if (!island) return notFound();

  const listings = await latestListings(12, slug);
  const cities = citiesForIsland(slug);

  return (
    <div>
      <section className="relative">
        <div className="absolute inset-0">
          <img src={island.image} alt={`${island.name} hero`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-deep/75 via-deep/35 to-deep/75" />
        </div>
        <div className="shell relative flex min-h-[40vh] flex-col justify-end py-24 text-white">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-semibold">{island.name}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/85">{island.tagline}</p>
          </div>
        </div>
      </section>

      <section className="shell py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            {island.description.map((p, i) => (
              <p key={i} className="mb-4 text-base text-ink/80">
                {p}
              </p>
            ))}

            <h2 className="section-title mt-8">Featured homes on {island.name}</h2>
            <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>

          <aside>
            <div className="card p-5">
              <h3 className="font-display text-lg font-semibold text-deep">Explore towns</h3>
              <ul className="mt-3 space-y-2">
                {cities.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/search?city=${c.slug}`} className="text-sm text-teal hover:underline">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
