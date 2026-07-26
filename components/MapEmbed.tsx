export function MapEmbed({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  const d = 0.02;
  const bbox = [lng - d * 1.6, lat - d, lng + d * 1.6, lat + d].join("%2C");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div>
      <iframe
        src={src}
        title={`Map of ${title}`}
        loading="lazy"
        className="h-72 w-full rounded-2xl border border-deep/10"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-medium text-teal hover:underline"
      >
        View larger map ↗
      </a>
    </div>
  );
}
