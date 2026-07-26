"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Camera } from "lucide-react";

export function Gallery({ photos, title }: { photos: { url: string; alt?: string | null }[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, prev, next]);

  if (photos.length === 0) {
    return <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-sand-dark text-ink/40">No photos</div>;
  }

  const thumbs = photos.slice(1, 5);

  return (
    <>
      <div className="grid gap-2 lg:grid-cols-[2fr_1fr]">
        <button onClick={() => show(0)} className="group relative block overflow-hidden rounded-2xl" aria-label="Open photo gallery">
          <div className="aspect-[16/10]">
            <img src={photos[0].url} alt={photos[0].alt || title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          </div>
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <Camera className="h-3.5 w-3.5" /> {photos.length} photo{photos.length === 1 ? "" : "s"}
          </span>
        </button>
        {thumbs.length > 0 && (
          <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
            {thumbs.map((p, i) => (
              <button key={i} onClick={() => show(i + 1)} className="group relative block overflow-hidden rounded-xl" aria-label={`Open photo ${i + 2}`}>
                <div className="aspect-[4/3] lg:aspect-[16/10]">
                  <img src={p.url} alt={p.alt || `${title} photo ${i + 2}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                {i === thumbs.length - 1 && photos.length > 5 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">
                    +{photos.length - 5} more
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-deep/95 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium text-white/70">
              {index + 1} / {photos.length} — {title}
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close gallery" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
            <img src={photos[index].url} alt={photos[index].alt || title} className="max-h-[80vh] max-w-full rounded-xl object-contain" />
            {photos.length > 1 && (
              <>
                <button onClick={prev} aria-label="Previous photo" className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={next} aria-label="Next photo" className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
