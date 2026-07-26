"use client";

import { useActionState, useState } from "react";
import { submitUsdtTx, type UsdtVerifyState } from "@/actions/checkout";
import { Check, Copy, Loader2, ShieldCheck } from "lucide-react";

export function UsdtPayment({
  paymentId,
  address,
  qrSvg,
  amountUsdt,
}: {
  paymentId: string;
  address: string;
  qrSvg: string;
  amountUsdt: string;
}) {
  const [state, action, pending] = useActionState<UsdtVerifyState, FormData>(
    submitUsdtTx,
    undefined
  );
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);

  function copy(kind: "address" | "amount", value: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-deep/10 bg-[#26A17B] px-6 py-4 text-white">
        <p className="flex items-center gap-2 text-sm font-bold">
          <ShieldCheck className="h-4 w-4" /> Pay with USDT — TRC20 network
        </p>
        <p className="mt-0.5 text-xs text-white/80">
          Direct on-chain payment · verified automatically · no card needed
        </p>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[200px_1fr]">
        <div className="mx-auto text-center">
          <div
            role="img"
            aria-label="USDT TRC20 payment address QR code"
            className="mx-auto h-44 w-44 rounded-xl border border-deep/10 bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-2 text-xs text-ink/50">Scan with your wallet app</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Send exactly</p>
            <button
              type="button"
              onClick={() => copy("amount", amountUsdt)}
              className="mt-1 inline-flex items-center gap-2 rounded-xl border border-deep/15 bg-sand-light px-4 py-2.5 font-display text-2xl font-semibold text-deep hover:border-teal"
            >
              {amountUsdt} USDT
              {copied === "amount" ? <Check className="h-4 w-4 text-teal" /> : <Copy className="h-4 w-4 text-ink/40" />}
            </button>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/45">To this address (TRC20)</p>
            <button
              type="button"
              onClick={() => copy("address", address)}
              className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-deep/15 bg-sand-light px-4 py-3 text-left font-mono text-sm font-semibold text-deep hover:border-teal"
            >
              <span className="break-all">{address}</span>
              {copied === "address" ? <Check className="h-4 w-4 shrink-0 text-teal" /> : <Copy className="h-4 w-4 shrink-0 text-ink/40" />}
            </button>
          </div>
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-medium leading-relaxed text-amber-900">
            ⚠ Send on the <strong>TRC20 (Tron)</strong> network only. Funds sent on other
            networks (ERC20, BEP20…) cannot be recovered.
          </div>
          <div className="rounded-xl bg-teal-light px-4 py-3 text-xs font-medium leading-relaxed text-teal-dark">
            ⏱ <strong>Send now, verify now:</strong> the transaction must be submitted within
            30 minutes of sending and needs ~1 minute (19 network confirmations) before it
            verifies. Each TxID can be used exactly once.
          </div>
        </div>
      </div>

      <div className="border-t border-deep/10 bg-sand-light/60 p-6">
        <p className="text-sm font-semibold text-deep">
          After sending, paste your transaction hash (TxID) below:
        </p>
        <form action={action} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="paymentId" value={paymentId} />
          <input
            name="txHash"
            required
            placeholder="e.g. 7c2f0e6a9b41d8…  (64 characters)"
            className="input flex-1 font-mono !text-[13px]"
          />
          <button type="submit" disabled={pending} className="btn-primary shrink-0">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying on-chain…
              </>
            ) : (
              "Verify & publish"
            )}
          </button>
        </form>
        {state?.error && <p className="mt-3 text-sm font-medium text-coral">{state.error}</p>}
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          You will find the TxID in your wallet's transaction details right after sending.
          We verify directly against the TRON blockchain — the exact contract, recipient,
          amount, confirmations and freshness. Your listing publishes automatically the
          moment verification passes.
        </p>
      </div>
    </div>
  );
}
