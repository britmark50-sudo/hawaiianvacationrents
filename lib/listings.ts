import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const PER_PAGE = 12;

export type PropertyListItem = Prisma.PropertyGetPayload<{
  include: { photos: true };
}>;

export function activeWhere(): Prisma.PropertyWhereInput {
  return { status: "ACTIVE", expiresAt: { gt: new Date() } };
}

export interface SearchFilters {
  island?: string;
  citySlug?: string;
  q?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  guests?: number;
  amenities?: string[];
  sort?: "newest" | "price-asc" | "price-desc";
  page?: number;
}

export async function searchProperties(f: SearchFilters) {
  const where: Prisma.PropertyWhereInput = { ...activeWhere() };
  if (f.island) where.island = f.island;
  if (f.citySlug) where.citySlug = f.citySlug;
  if (f.type) where.type = f.type;
  if (f.minPrice || f.maxPrice) {
    where.pricePerNight = {
      ...(f.minPrice ? { gte: f.minPrice } : {}),
      ...(f.maxPrice ? { lte: f.maxPrice } : {}),
    };
  }
  if (f.bedrooms) where.bedrooms = { gte: f.bedrooms };
  if (f.guests) where.maxGuests = { gte: f.guests };
  if (f.q) where.searchText = { contains: f.q.toLowerCase() };
  if (f.amenities && f.amenities.length > 0) {
    where.AND = f.amenities.map((a) => ({ amenities: { contains: `"${a}"` } }));
  }

  // Lexicographic luck: PREMIUM > FEATURED > BASIC, so tier desc == paid priority
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] = [{ tier: "desc" }];
  if (f.sort === "price-asc") orderBy.push({ pricePerNight: "asc" });
  else if (f.sort === "price-desc") orderBy.push({ pricePerNight: "desc" });
  else orderBy.push({ publishedAt: "desc" });

  const page = Math.max(1, f.page || 1);
  const [total, items] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { photos: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export async function latestListings(n = 8, island?: string): Promise<PropertyListItem[]> {
  return prisma.property.findMany({
    where: { ...activeWhere(), ...(island ? { island } : {}) },
    orderBy: [{ tier: "desc" }, { publishedAt: "desc" }],
    take: n,
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function countActiveByIsland(): Promise<Record<string, number>> {
  const rows = await prisma.property.groupBy({
    by: ["island"],
    where: activeWhere(),
    _count: { _all: true },
  });
  const map: Record<string, number> = {};
  for (const r of rows) map[r.island] = r._count._all;
  return map;
}

export async function relatedListings(propertyId: string, island: string, citySlug: string, n = 3) {
  const sameCity = await prisma.property.findMany({
    where: { ...activeWhere(), citySlug, id: { not: propertyId } },
    take: n,
    orderBy: { publishedAt: "desc" },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (sameCity.length >= n) return sameCity;
  const more = await prisma.property.findMany({
    where: {
      ...activeWhere(),
      island,
      id: { notIn: [propertyId, ...sameCity.map((p) => p.id)] },
    },
    take: n - sameCity.length,
    orderBy: { publishedAt: "desc" },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  return [...sameCity, ...more];
}
