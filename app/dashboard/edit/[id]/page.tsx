import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseAmenities } from "@/lib/utils";
import { PropertyForm } from "@/components/PropertyForm";

export const metadata: Metadata = { title: "Edit Listing", robots: { index: false } };

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!property) notFound();
  if (property.ownerId !== session.userId && session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="shell max-w-4xl py-10">
      <p className="eyebrow">Edit listing</p>
      <h1 className="section-title mt-1">{property.title}</h1>
      <div className="mt-8">
        <PropertyForm
          initial={{
            id: property.id,
            title: property.title,
            island: property.island,
            citySlug: property.citySlug,
            address: property.address,
            lat: property.lat,
            lng: property.lng,
            type: property.type,
            pricePerNight: property.pricePerNight,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            maxGuests: property.maxGuests,
            minNights: property.minNights,
            description: property.description,
            licenseNumber: property.licenseNumber,
            contactName: property.contactName,
            contactEmail: property.contactEmail,
            contactPhone: property.contactPhone,
            website: property.website,
            amenities: parseAmenities(property.amenities),
            photos: property.photos.map((p) => ({ url: p.url })),
          }}
        />
      </div>
    </div>
  );
}
