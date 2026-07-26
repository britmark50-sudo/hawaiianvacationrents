"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getFavoriteIds } from "@/components/FavoriteButton";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";

export default function FavoritesPage() {
  const [items, setItems] = useState<PropertyCardData[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const ids = getFavoriteIds();
      if (ids.length === 0) {
        if (!cancelled) setItems([]);
        return;
      }
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    load();
    window.addEventListener("hvr-favs-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("hvr-favs-changed", load);
    };
  }, []);

  return (
    <div className="shell py-14">
      <p className="eyebrow">Your shortlist</p>
      <h1 className="section-title mt-2">Saved favorites</h1>
      <p className="mt-2 text-sm text-ink/55">
        Favorites are saved on this device — no account needed.
      </p>

      {items === null ? (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] rounded-2xl bg-sand-dark" />
              <div className="mt-3 h-4 w-2/3 rounded bg-sand-dark" />
              <div className="mt-2 h-3 w-1/2 rounded bg-sand-dark" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card mt-10 p-14 text-center">
          <Heart className="mx-auto h-10 w-10 text-coral/40" />
          <p className="mt-4 font-display text-2xl font-semibold text-deep">Nothing saved yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
            Tap the heart on any listing to keep it here while you plan your trip.
          </p>
          <Link href="/search" className="btn-primary mt-6">Browse rentals</Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
