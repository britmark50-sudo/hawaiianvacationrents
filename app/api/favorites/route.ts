import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  let ids: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body.ids)) ids = body.ids.map(String).slice(0, 100);
  } catch {
    return NextResponse.json({ items: [] });
  }
  if (ids.length === 0) return NextResponse.json({ items: [] });

  const items = await prisma.property.findMany({
    where: { id: { in: ids }, status: "ACTIVE", expiresAt: { gt: new Date() } },
    include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      city: p.city,
      island: p.island,
      type: p.type,
      pricePerNight: p.pricePerNight,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      maxGuests: p.maxGuests,
      tier: p.tier,
      photos: p.photos.map((ph) => ({ url: ph.url, alt: ph.alt })),
    })),
  });
}
