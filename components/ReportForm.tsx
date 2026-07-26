"use client";

import { useActionState } from "react";
import { submitReport, type PublicFormState } from "@/actions/public";
import { REPORT_REASONS } from "@/lib/constants";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function ReportForm({ propertyId, slug }: { propertyId: string; slug: string }) {
  const [state, action, pending] = useActionState<PublicFormState, FormData>(submitReport, undefined);

  if (state?.ok) {
    return (
      <div className="card p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-deep">Mahalo for the report</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink/60">
          Our team will review this listing shortly. Reports help keep the platform safe for everyone.
        </p>
        <Link href={`/rentals/${slug}`} className="btn-outline mt-6">Back to listing</Link>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-5 p-8">
      <input type="hidden" name="propertyId" value={propertyId} />
      <div>
        <label className="label" htmlFor="r-reason">Reason</label>
        <select id="r-reason" name="reason" required className="input" defaultValue="">
          <option value="" disabled>Choose a reason…</option>
          {REPORT_REASONS.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="r-details">Details (optional)</label>
        <textarea id="r-details" name="details" rows={5} className="input" placeholder="Tell us what's wrong with this listing…" />
      </div>
      <div>
        <label className="label" htmlFor="r-email">Your email (optional)</label>
        <input id="r-email" name="reporterEmail" type="email" className="input" placeholder="you@example.com" />
        <p className="mt-1.5 text-xs text-ink/45">Only used if we need to follow up. Never shared.</p>
      </div>
      {state?.error && <p className="text-sm font-medium text-coral">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
