"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { saveProperty, type PropertyFormState } from "@/actions/owner";
import { AMENITIES, CITIES, ISLANDS, PROPERTY_TYPES } from "@/lib/constants";

interface InitialData {
  id: string;
  title: string;
  island: string;
  citySlug: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  type: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  minNights: number;
  description: string;
  licenseNumber: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  amenities: string[];
  photos: { url: string }[];
}

export function PropertyForm({
  initial,
  defaultContact,
}: {
  initial?: InitialData;
  defaultContact?: { name: string; email: string; phone?: string | null };
}) {
  const [state, action, pending] = useActionState<PropertyFormState, FormData>(
    saveProperty,
    undefined
  );
  const [island, setIsland] = useState(initial?.island || "");
  const [citySlug, setCitySlug] = useState(initial?.citySlug || "");
  const [lat, setLat] = useState<string>(initial?.lat != null ? String(initial.lat) : "");
  const [lng, setLng] = useState<string>(initial?.lng != null ? String(initial.lng) : "");
  const [photos, setPhotos] = useState<{ url: string }[]>(initial?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cities = CITIES.filter((c) => !island || c.island === island);

  function onIslandChange(v: string) {
    setIsland(v);
    const stillValid = CITIES.some((c) => c.slug === citySlug && c.island === v);
    if (!stillValid) {
      setCitySlug("");
      setLat("");
      setLng("");
    }
  }

  function onCityChange(v: string) {
    setCitySlug(v);
    const city = CITIES.find((c) => c.slug === v);
    if (city) {
      setLat(String(city.lat));
      setLng(String(city.lng));
      if (!island) setIsland(city.island);
    }
  }

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploadError(null);
    setUploading(true);
    const files = Array.from(list).slice(0, 14 - photos.length);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setUploadError(data.error || "Upload failed");
          continue;
        }
        setPhotos((p) => [...p, { url: data.url }]);
      } catch {
        setUploadError("Upload failed — please try again.");
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function movePhoto(i: number, dir: -1 | 1) {
    setPhotos((p) => {
      const arr = [...p];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  const sectionCls = "card p-6 sm:p-8";
  const sectionTitle = "font-display text-xl font-semibold text-deep";

  return (
    <form action={action} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="photosJson" value={JSON.stringify(photos)} />

      <section className={sectionCls}>
        <h2 className={sectionTitle}>Basics</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="p-title">Listing title</label>
            <input id="p-title" name="title" required minLength={8} maxLength={90} defaultValue={initial?.title} className="input" placeholder="Oceanfront villa with infinity pool in Wailea" />
          </div>
          <div>
            <label className="label" htmlFor="p-type">Property type</label>
            <select id="p-type" name="type" required defaultValue={initial?.type || ""} className="input">
              <option value="" disabled>Choose type…</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="p-island">Island</label>
            <select id="p-island" name="island" required value={island} onChange={(e) => onIslandChange(e.target.value)} className="input">
              <option value="" disabled>Choose island…</option>
              {ISLANDS.map((i) => (
                <option key={i.slug} value={i.slug}>{i.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="p-city">Town / area</label>
            <select id="p-city" name="citySlug" required value={citySlug} onChange={(e) => onCityChange(e.target.value)} className="input">
              <option value="" disabled>Choose town…</option>
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="p-address">Street address (optional)</label>
            <input id="p-address" name="address" defaultValue={initial?.address || ""} className="input" placeholder="Shown as area only" />
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="p-lat">Latitude</label>
            <input id="p-lat" name="lat" value={lat} onChange={(e) => setLat(e.target.value)} className="input" placeholder="Auto-filled from town" />
          </div>
          <div>
            <label className="label" htmlFor="p-lng">Longitude</label>
            <input id="p-lng" name="lng" value={lng} onChange={(e) => setLng(e.target.value)} className="input" placeholder="Auto-filled from town" />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink/45">
          Coordinates power the map on your listing. They are auto-filled when you pick a town — fine-tune them for a more precise pin.
        </p>
      </section>

      <section className={sectionCls}>
        <h2 className={sectionTitle}>Details</h2>
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-5">
          <div>
            <label className="label" htmlFor="p-price">Price / night ($)</label>
            <input id="p-price" name="pricePerNight" type="number" min={10} max={100000} required defaultValue={initial?.pricePerNight} className="input" placeholder="250" />
          </div>
          <div>
            <label className="label" htmlFor="p-bedrooms">Bedrooms</label>
            <input id="p-bedrooms" name="bedrooms" type="number" min={0} max={30} required defaultValue={initial?.bedrooms ?? 1} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="p-bathrooms">Bathrooms</label>
            <input id="p-bathrooms" name="bathrooms" type="number" min={0.5} max={30} step={0.5} required defaultValue={initial?.bathrooms ?? 1} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="p-guests">Max guests</label>
            <input id="p-guests" name="maxGuests" type="number" min={1} max={50} required defaultValue={initial?.maxGuests ?? 2} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="p-minNights">Min nights</label>
            <input id="p-minNights" name="minNights" type="number" min={1} max={90} required defaultValue={initial?.minNights ?? 1} className="input" />
          </div>
        </div>
        <div className="mt-5">
          <span className="label">Amenities</span>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {AMENITIES.map((a) => (
              <label key={a.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-sm text-ink/75 hover:bg-sand">
                <input type="checkbox" name="amenities" value={a.key} defaultChecked={initial?.amenities.includes(a.key)} className="h-4 w-4 rounded accent-teal" />
                {a.label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <label className="label" htmlFor="p-description">Description</label>
          <textarea id="p-description" name="description" rows={8} required minLength={40} maxLength={5000} defaultValue={initial?.description} className="input" placeholder="What makes your home special? Views, layout, distance to the beach, house rules…" />
          <p className="mt-1.5 text-xs text-ink/45">Minimum 40 characters. Use blank lines to separate paragraphs.</p>
        </div>
        <div className="mt-5">
          <label className="label" htmlFor="p-license">Hawaiʻi rental registration / license number (recommended)</label>
          <input id="p-license" name="licenseNumber" defaultValue={initial?.licenseNumber || ""} className="input" placeholder="e.g. STA-2026-001234 / TA-123-456-7890-01" />
          <p className="mt-1.5 text-xs text-ink/45">
            Most Hawaiʻi counties require short-term rentals to display a registration number in advertising. Listings with a license build far more trust.
          </p>
        </div>
      </section>

      <section className={sectionCls}>
        <h2 className={sectionTitle}>Photos</h2>
        <p className="mt-1 text-sm text-ink/55">First photo is your cover. Up to 14 photos, 8MB each (JPEG, PNG or WebP).</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <div key={p.url + i} className="group relative overflow-hidden rounded-xl border border-deep/10">
              <div className="aspect-[4/3]">
                <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              </div>
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-deep/80 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Cover</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => movePhoto(i, -1)} className="rounded-full bg-white/90 p-1.5 text-deep" aria-label="Move left"><ArrowLeft className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setPhotos((arr) => arr.filter((_, j) => j !== i))} className="rounded-full bg-white/90 p-1.5 text-coral" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => movePhoto(i, 1)} className="rounded-full bg-white/90 p-1.5 text-deep" aria-label="Move right"><ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {photos.length < 14 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-deep/20 text-sm font-medium text-ink/50 transition hover:border-teal hover:text-teal"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              {uploading ? "Uploading…" : "Add photos"}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        {uploadError && <p className="mt-3 text-sm font-medium text-coral">{uploadError}</p>}
      </section>

      <section className={sectionCls}>
        <h2 className={sectionTitle}>Contact details shown to travelers</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="p-cname">Contact name</label>
            <input id="p-cname" name="contactName" required defaultValue={initial?.contactName || defaultContact?.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="p-cemail">Contact email</label>
            <input id="p-cemail" name="contactEmail" type="email" required defaultValue={initial?.contactEmail || defaultContact?.email} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="p-cphone">Contact phone (optional)</label>
            <input id="p-cphone" name="contactPhone" defaultValue={initial?.contactPhone || defaultContact?.phone || ""} className="input" placeholder="(808) 555-0100" />
          </div>
          <div>
            <label className="label" htmlFor="p-website">Your website (optional)</label>
            <input id="p-website" name="website" type="url" defaultValue={initial?.website || ""} className="input" placeholder="https://…" />
          </div>
        </div>
        <p className="mt-3 text-xs text-ink/45">
          These details are displayed publicly on your listing so travelers can reach you directly.
        </p>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-deep/10 bg-sand-light/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/60">
            {state?.error ? (
              <span className="font-semibold text-coral">{state.error}</span>
            ) : initial?.id ? (
              "Changes go live immediately after saving."
            ) : (
              "Next step: review & pay $5 to publish for 30 days."
            )}
          </p>
          <button type="submit" disabled={pending || uploading} className="btn-primary">
            {pending ? "Saving…" : initial?.id ? "Save changes" : "Save & continue"}
          </button>
        </div>
      </div>
    </form>
  );
}
