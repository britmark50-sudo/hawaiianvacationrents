"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "hvr_favorites";

export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function setFavoriteIds(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("hvr-favs-changed"));
}

export function FavoriteButton({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const sync = () => setFav(getFavoriteIds().includes(propertyId));
    sync();
    window.addEventListener("hvr-favs-changed", sync);
    return () => window.removeEventListener("hvr-favs-changed", sync);
  }, [propertyId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ids = getFavoriteIds();
    setFavoriteIds(fav ? ids.filter((i) => i !== propertyId) : [...ids, propertyId]);
  }

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "rounded-full bg-white/90 p-2 text-deep/60 shadow transition hover:scale-110",
        fav && "text-coral",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", fav && "fill-coral")} />
    </button>
  );
}
