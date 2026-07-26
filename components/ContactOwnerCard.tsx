"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, Globe, ShieldCheck, Flag, UserRound } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Props {
  propertyId: string;
  slug: string;
  title: string;
  pricePerNight: number;
  minNights: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  licenseNumber: string | null;
}

export function ContactOwnerCard(p: Props) {
  const [revealed, setRevealed] = useState(false);

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: p.propertyId, kind: "contact" }),
    }).catch(() => {});
  }

  const mailSubject = encodeURIComponent(`Inquiry via Hawaiian Vacation Rents — ${p.title}`);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-deep/10 bg-sand-light px-6 py-5">
        <p className="font-display text-3xl font-semibold text-deep">
          {formatPrice(p.pricePerNight)}
          <span className="text-base font-medium text-ink/50"> / night</span>
        </p>
        <p className="mt-1 text-xs font-medium text-ink/55">
          {p.minNights > 1 ? `${p.minNights}-night minimum · ` : ""}Book direct — no service fees
        </p>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-light text-teal">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-deep">{p.contactName}</p>
            <p className="text-xs text-ink/50">Owner / manager</p>
          </div>
        </div>

        {p.licenseNumber && (
          <p className="flex items-center gap-2 rounded-lg bg-teal-light px-3 py-2 text-xs font-medium text-teal-dark">
            <ShieldCheck className="h-4 w-4 shrink-0" /> Hawaiʻi rental license: {p.licenseNumber}
          </p>
        )}

        {!revealed ? (
          <button onClick={reveal} className="btn-primary w-full">
            Show contact details
          </button>
        ) : (
          <div className="space-y-2.5">
            {p.contactPhone && (
              <a href={`tel:${p.contactPhone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep transition hover:border-teal hover:text-teal">
                <Phone className="h-4 w-4 shrink-0 text-teal" /> {p.contactPhone}
              </a>
            )}
            <a href={`mailto:${p.contactEmail}?subject=${mailSubject}`} className="flex items-center gap-3 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep transition hover:border-teal hover:text-teal">
              <Mail className="h-4 w-4 shrink-0 text-teal" />
              <span className="break-all">{p.contactEmail}</span>
            </a>
            {p.website && (
              <a href={p.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 rounded-xl border border-deep/15 px-4 py-3 text-sm font-semibold text-deep transition hover:border-teal hover:text-teal">
                <Globe className="h-4 w-4 shrink-0 text-teal" /> Owner website ↗
              </a>
            )}
            <p className="text-xs leading-relaxed text-ink/50">
              Mention <strong>Hawaiian Vacation Rents</strong> when you reach out.
            </p>
          </div>
        )}

        <div className="rounded-xl bg-sand px-4 py-3 text-xs leading-relaxed text-ink/60">
          <strong className="text-deep">Stay safe:</strong> we never handle bookings or
          payments. Verify the home and use a written rental agreement before sending money.
        </div>

        <Link href={`/rentals/${p.slug}/report`} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/45 transition hover:text-coral">
          <Flag className="h-3.5 w-3.5" /> Report this listing
        </Link>
      </div>
    </div>
  );
}
