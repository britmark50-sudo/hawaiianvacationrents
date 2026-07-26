"use client";

import { useActionState, useState } from "react";
import { submitPayPalClaim, type PayPalClaimState } from "@/actions/checkout";
import { Check, Copy, Loader2, Send, Wallet } from "lucide-react";

export function PayPalManualPayment({
  paymentId,
  paypalEmail,
  amount,
  referenceCode,
}: {
  paymentId: string;
  paypalEmail: string;
  amount: string;
  referenceCode: string;
}) {
  const [state, action, pending] = useActionState<PayPalClaimState, FormData>(
    submitPayPalClaim,
    undefined
  );
  const [copied, setCopied] = useState<string | null>(null);

  function copy(kind: string, value: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const rows = [
    { kind: "email", label: "Send to (PayPal email)", value: paypalEmail, mono: true },
    { kind: "amount", label: "Exact amount (USD)", value: amount, mono: false },
    { kind: "ref", label: "Add this code in the payment note", value: referenceCode, mono: true },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-deep/10 bg-[#0070BA] px-6 py-4 text-white">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Wallet className="h-4 w-4" /> Pay with PayPal
        </p>
        <p className="mt-0.5 text-xs text-white/80">
          Send directly from your PayPal account · verified by our team, usually within hours
        </p>
      </div>

      <div className="space-y-4 p-6">
        {rows.map((r) => (
          <div key={r.kind}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/45">{r.label}</p>
            <button
              type="button"
              onClick={() => copy(r.kind, r.value)}
              className={
                "mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-deep/15 bg-sand-light px-4 py-3 text-left text-sm font-semibold text-deep hover:border-[#0070BA] " +
                (r.mono ? "font-mono" : "font-display text-xl")
              }
            >
              <span className="break-all">{r.value}</span>
              {copied === r.kind ? (
                <Check className="h-4 w-4 shrink-0 text-teal" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-ink/40" />
              )}
            </button>
          </div>
        ))}

        <ol className="space-y-1.5 rounded-xl bg-sand px-4 py-3 text-xs leading-relaxed text-ink/70">
          <li>1. Open PayPal → Send &amp; Request → enter the email above.</li>
          <li>2. Send the exact amount and paste the reference code in the note.</li>
          <li>3. Come back here and submit your PayPal Transaction ID below.</li>
        </ol>
      </div>

      <div className="border-t border-deep/10 bg-sand-light/60 p-6">
        <p className="text-sm font-semibold text-deep">
          After sending, confirm your payment:
        </p>
        <form action={action} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="paymentId" value={paymentId} />
          <input
            name="reference"
            required
            placeholder="PayPal Transaction ID (e.g. 8AB12345CD678901E) or your PayPal email"
            className="input flex-1 font-mono !text-[13px]"
          />
          <button type="submit" disabled={pending} className="btn-primary shrink-0">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> I&apos;ve sent the payment
              </>
            )}
          </button>
        </form>
        {state?.error && <p className="mt-3 text-sm font-medium text-coral">{state.error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          You&apos;ll find the Transaction ID in your PayPal activity right after sending. Our team
          matches it against the account and publishes your listing — you&apos;ll receive an email
          receipt the moment it goes live.
        </p>
      </div>
    </div>
  );
}
