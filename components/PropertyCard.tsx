import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { TierBadge } from "@/components/TierBadge";
import { islandBySlug, typeLabel } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export interface PropertyCardData {
  id: string;
  slug: string;
  title: string;
  city: string;
  island: string;
  type: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  tier: string;
  photos: { url: string; alt?: string | null }[];
}

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const photo = property.photos[0];
  const islandName = islandBySlug(property.island)?.name || property.island;
  return (
    <Link href={`/rentals/${property.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-dark">
        {photo ? (
          <img
            src={photo.url}
            alt={photo.alt || property.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-deep/40">
            No photo
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
        <TierBadge tier={property.tier} className="absolute left-3 top-3" />
        <FavoriteButton propertyId={property.id} className="absolute right-3 top-3" />
        <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-bold text-deep shadow">
          {formatPrice(property.pricePerNight)}
          <span className="font-medium text-deep/50"> / night</span>
        </div>
      </div>
      <div className="pt-3">
        <h3 className="font-display text-lg font-semibold leading-snug text-deep transition group-hover:text-teal">
          {property.title}
        </h3>
        <p className="mt-0.5 text-sm text-ink/60">
          {property.city}, {islandName}
        </p>
        <p className="mt-1 text-xs font-medium text-ink/50">
          {property.maxGuests} guests · {property.bedrooms === 0 ? "Studio" : `${property.bedrooms} bd`} ·{" "}
          {property.bathrooms} ba · {typeLabel(property.type)}
        </p>
      </div>
    </Link>
  );
}
