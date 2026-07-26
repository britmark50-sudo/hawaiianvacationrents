"use server";

import { z } from "zod";
import { prisma, getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  AMENITIES,
  PROPERTY_TYPES,
  cityBySlug,
  islandBySlug,
  isIslandSlug,
  amenityLabel,
  typeLabel,
} from "@/lib/constants";
import { slugify, randomSuffix } from "@/lib/utils";
import { sendFormspree } from "@/lib/formspree";
import { SITE_URL } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PropertyFormState = { error?: string } | undefined;

const propertySchema = z.object({
  id: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(8, "Title must be at least 8 characters.").max(90, "Title is too long (max 90)."),
  island: z.string().refine(isIslandSlug, "Please choose an island."),
  citySlug: z.string().min(1, "Please choose a city / area."),
  address: z.string().trim().max(160).optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  lng: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  type: z.string().refine((t) => PROPERTY_TYPES.some((p) => p.key === t), "Please choose a property type."),
  pricePerNight: z.coerce.number().int("Price must be a whole number.").min(10, "Minimum price is $10.").max(100000),
  bedrooms: z.coerce.number().int().min(0).max(30),
  bathrooms: z.coerce.number().min(0.5).max(30),
  maxGuests: z.coerce.number().int().min(1).max(50),
  minNights: z.coerce.number().int().min(1).max(90),
  description: z.string().trim().min(40, "Description must be at least 40 characters.").max(5000),
  licenseNumber: z.string().trim().max(60).optional().or(z.literal("")),
  contactName: z.string().trim().min(2, "Contact name is required.").max(80),
  contactEmail: z.string().trim().toLowerCase().email("Please enter a valid contact email."),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  website: z.string().trim().url("Website must be a valid URL (https://…).").max(200).optional().or(z.literal("")),
});

function safePhotoUrl(url: unknown): url is string {
  return (
    typeof url === "string" &&
    (url.startsWith("/uploads/") || url.startsWith("/r2/uploads/") || url.startsWith("/seed/"))
  );
}

export async function saveProperty(_prev: PropertyFormState, formData: FormData): Promise<PropertyFormState> {
  const session = await requireUser();

  const parsed = propertySchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    island: formData.get("island"),
    citySlug: formData.get("citySlug"),
    address: formData.get("address"),
    lat: formData.get("lat") || "",
    lng: formData.get("lng") || "",
    type: formData.get("type"),
    pricePerNight: formData.get("pricePerNight"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    maxGuests: formData.get("maxGuests"),
    minNights: formData.get("minNights"),
    description: formData.get("description"),
    licenseNumber: formData.get("licenseNumber"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    website: formData.get("website"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check the form." };
  }
  const d = parsed.data;

  const city = cityBySlug(d.citySlug);
  if (!city || city.island !== d.island) {
    return { error: "Please choose a city that belongs to the selected island." };
  }

  const amenities = formData
    .getAll("amenities")
    .map(String)
    .filter((a) => AMENITIES.some((x) => x.key === a));

  let photos: { url: string }[] = [];
  try {
    const raw = JSON.parse(String(formData.get("photosJson") || "[]"));
    if (Array.isArray(raw)) {
      photos = raw.filter((p) => p && safePhotoUrl(p.url)).map((p) => ({ url: p.url as string })).slice(0, 14);
    }
  } catch {
    // ignore malformed photo payloads
  }
  if (photos.length === 0) {
    return { error: "Please add at least one photo of your property." };
  }

  const islandName = islandBySlug(d.island)?.name || d.island;
  const searchText = [
    d.title,
    city.name,
    islandName,
    d.island.replace("-", " "),
    typeLabel(d.type),
    ...amenities.map(amenityLabel),
  ]
    .join(" ")
    .toLowerCase();

  const baseData = {
    title: d.title,
    description: d.description,
    island: d.island,
    city: city.name,
    citySlug: city.slug,
    address: d.address || null,
    lat: typeof d.lat === "number" ? d.lat : city.lat,
    lng: typeof d.lng === "number" ? d.lng : city.lng,
    type: d.type,
    pricePerNight: d.pricePerNight,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    maxGuests: d.maxGuests,
    minNights: d.minNights,
    amenities: JSON.stringify(amenities),
    licenseNumber: d.licenseNumber || null,
    contactName: d.contactName,
    contactEmail: d.contactEmail,
    contactPhone: d.contactPhone || null,
    website: d.website || null,
    searchText,
  };

  let propertyId: string;
  let isNew = false;

  if (d.id) {
    const existing = await prisma.property.findUnique({ where: { id: d.id } });
    if (!existing) return { error: "Listing not found." };
    if (existing.ownerId !== session.userId && session.role !== "ADMIN") {
      return { error: "You do not have permission to edit this listing." };
    }
    const db = await getDb();
    await db.$transaction([
      db.property.update({ where: { id: d.id }, data: baseData }),
      db.photo.deleteMany({ where: { propertyId: d.id } }),
      db.photo.createMany({
        data: photos.map((p, i) => ({ propertyId: d.id!, url: p.url, sortOrder: i })),
      }),
    ]);
    propertyId = d.id;
    const p = existing;
    revalidatePath(`/rentals/${p.slug}`);
  } else {
    isNew = true;
    const slug = `${slugify(d.title)}-${city.slug}-${randomSuffix()}`;
    const created = await prisma.property.create({
      data: {
        ...baseData,
        slug,
        status: "DRAFT",
        ownerId: session.userId,
        photos: { create: photos.map((p, i) => ({ url: p.url, sortOrder: i })) },
      },
    });
    propertyId = created.id;

    // New-owner listing request → email via Formspree (in addition to the platform)
    await sendFormspree({
      _subject: `New property submission — ${d.title} (hawaiianvacationrents.com)`,
      form: "new-property",
      owner_name: d.contactName,
      email: d.contactEmail,
      owner_phone: d.contactPhone || "",
      property: d.title,
      location: `${city.name}, ${islandName}`,
      type: d.type,
      price_per_night: `${d.pricePerNight}`,
      status: "Draft created — awaiting package payment",
      preview: `${SITE_URL}/rentals/${slug}`,
    });
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/${d.island}`);
  revalidatePath(`/${d.island}/${city.slug}`);

  if (isNew) redirect(`/dashboard/checkout/${propertyId}`);
  redirect("/dashboard?saved=1");
}

export async function deleteOwnProperty(propertyId: string) {
  const session = await requireUser();
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) redirect("/dashboard");
  if (property.ownerId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");

  await prisma.property.delete({ where: { id: propertyId } });

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/${property.island}`);
  revalidatePath(`/${property.island}/${property.citySlug}`);
  redirect("/dashboard?deleted=1");
}
