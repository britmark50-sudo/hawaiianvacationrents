import "server-only";
import { prisma } from "@/lib/db";
import type { StrictVerifyResult } from "@/lib/tron";
import { sendTelegram, tgUsdtRejected } from "@/lib/telegram";

const CODE_LABEL: Record<string, string> = {
  FORMAT: "Bad hash format",
  RATE_LIMIT: "Rate limited",
  REPLAY: "Replay attempt",
  EXISTENCE: "Not on-chain",
  NOT_SUCCESS: "Failed on-chain",
  CONTRACT: "Not official USDT",
  RECIPIENT: "Wrong recipient",
  AMOUNT: "Amount too low",
  CONFIRMATIONS: "Unconfirmed",
  RECENCY: "Too old",
  NETWORK: "Network error",
  PAYMENT_STATE: "Payment state",
};

export const RATE_LIMIT_ATTEMPTS = parseInt(process.env.USDT_RATE_LIMIT_ATTEMPTS || "5", 10);
export const RATE_LIMIT_WINDOW_MINUTES = parseInt(
  process.env.USDT_RATE_LIMIT_WINDOW_MINUTES || "10",
  10
);

/** Sliding-window rate limit per user AND per IP (guessing / brute-force protection). */
export async function isRateLimited(userId: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60000);
  const count = await prisma.txVerifyAttempt.count({
    where: {
      createdAt: { gte: since },
      code: { not: "RATE_LIMIT" },
      OR: [{ userId }, ...(ip ? [{ ip }] : [])],
    },
  });
  return count >= RATE_LIMIT_ATTEMPTS;
}

/** Lifetime replay protection: a tx hash is spendable exactly once, ever. */
export async function isTxHashUsed(txHash: string): Promise<boolean> {
  const row = await prisma.usedTxHash.findUnique({ where: { txHash } });
  return !!row;
}

/**
 * Permanently claims a tx hash. Relies on the primary-key constraint, so a
 * concurrent double-submit loses with a unique violation.
 */
export async function claimTxHash(txHash: string, paymentId: string): Promise<boolean> {
  try {
    await prisma.usedTxHash.create({ data: { txHash, paymentId } });
    return true;
  } catch {
    return false; // already claimed — replay
  }
}

export interface AttemptContext {
  txHash: string;
  userId?: string;
  userEmail?: string;
  paymentId?: string;
  propertyTitle?: string;
  ip?: string | null;
}

export async function recordAttempt(
  ctx: AttemptContext,
  outcome: { ok: boolean; code: string; message: string; amountUsdt?: number; fromAddress?: string; confirmations?: number }
) {
  try {
    await prisma.txVerifyAttempt.create({
      data: {
        txHash: ctx.txHash.slice(0, 80),
        ok: outcome.ok,
        code: outcome.code,
        message: outcome.message.slice(0, 500),
        amountUsdt: outcome.amountUsdt ?? null,
        fromAddress: outcome.fromAddress ?? null,
        confirmations: outcome.confirmations ?? null,
        ip: ctx.ip || null,
        userId: ctx.userId || null,
        userEmail: ctx.userEmail || null,
        paymentId: ctx.paymentId || null,
        propertyTitle: ctx.propertyTitle || null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record attempt", err);
  }

  if (!outcome.ok) {
    await sendTelegram(
      tgUsdtRejected({
        codeLabel: CODE_LABEL[outcome.code] || outcome.code,
        message: outcome.message,
        txHash: ctx.txHash,
        userEmail: ctx.userEmail,
        ip: ctx.ip,
        listingTitle: ctx.propertyTitle,
        amountUsdt: outcome.amountUsdt ?? null,
      })
    );
  }
}

export function attemptFromResult(r: StrictVerifyResult) {
  return {
    ok: r.ok,
    code: r.code,
    message: r.message,
    amountUsdt: r.amountUsdt,
    fromAddress: r.fromAddress,
    confirmations: r.confirmations,
  };
}
