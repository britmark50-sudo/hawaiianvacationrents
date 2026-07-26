import "server-only";

/**
 * Instant admin notifications via the official Telegram Bot API.
 * Configure TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in .env — when unset,
 * notifications are silently skipped (logged in dev).
 * No SDK needed: a single HTTPS call per message.
 */

const API_BASE = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";

export function telegramConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Fire-and-forget Telegram message (HTML formatting). Never throws. */
export async function sendTelegram(html: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[telegram:skip]", html.replace(/<[^>]+>/g, "").slice(0, 120));
    }
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[telegram] send failed", res.status, (await res.text()).slice(0, 200));
    }
  } catch (err) {
    console.error("[telegram] send error", err);
  }
}

// ---------- Prebuilt notification messages ----------

export function tgPaymentReceived(p: {
  amountCents: number;
  kind: string;
  kindLabel: string;
  tierName: string;
  methodLabel: string;
  listingTitle: string;
  ownerEmail?: string | null;
  providerRef?: string | null;
  listingUrl: string;
}): string {
  const headline =
    p.kind === "PUBLISH"
      ? `🆕 <b>New listing LIVE — ${(p.amountCents / 100).toFixed(2)} received</b>`
      : `🔄 <b>Listing renewed — ${(p.amountCents / 100).toFixed(2)} received</b>`;
  const lines = [
    headline,
    `📦 ${escapeHtml(p.tierName)} package · ${escapeHtml(p.kindLabel)}`,
    `🏠 ${escapeHtml(p.listingTitle)}`,
    `👤 ${escapeHtml(p.ownerEmail || "unknown")}`,
    `💳 ${escapeHtml(p.methodLabel)}`,
  ];
  if (p.providerRef && /^[0-9a-f]{64}$/.test(p.providerRef)) {
    lines.push(`🔗 https://tronscan.org/#/transaction/${p.providerRef}`);
  } else if (p.providerRef) {
    lines.push(`🧾 ref: <code>${escapeHtml(p.providerRef)}</code>`);
  }
  lines.push(`➡️ ${p.listingUrl}`);
  return lines.join("\n");
}

export function tgUsdtRejected(a: {
  codeLabel: string;
  message: string;
  txHash: string;
  userEmail?: string | null;
  ip?: string | null;
  listingTitle?: string | null;
  amountUsdt?: number | null;
}): string {
  const lines = [
    `❌ <b>USDT attempt rejected — ${escapeHtml(a.codeLabel)}</b>`,
    `📄 ${escapeHtml(a.message)}`,
  ];
  if (/^[0-9a-f]{64}$/.test(a.txHash)) {
    lines.push(`#️⃣ https://tronscan.org/#/transaction/${a.txHash}`);
  } else {
    lines.push(`#️⃣ <code>${escapeHtml(a.txHash.slice(0, 24))}…</code>`);
  }
  if (a.amountUsdt != null) lines.push(`💰 ${a.amountUsdt} USDT`);
  lines.push(`👤 ${escapeHtml(a.userEmail || "unknown")}${a.ip ? ` · IP ${escapeHtml(a.ip)}` : ""}`);
  if (a.listingTitle) lines.push(`🏠 ${escapeHtml(a.listingTitle)}`);
  return lines.join("\n");
}

export function tgPayPalReview(p: {
  amountCents: number;
  tierName: string;
  listingTitle: string;
  ownerEmail?: string | null;
  reference: string;
  code: string;
  adminUrl: string;
}): string {
  return [
    `⏳ <b>PayPal payment awaiting your approval — $${(p.amountCents / 100).toFixed(2)}</b>`,
    `📦 ${escapeHtml(p.tierName)} package`,
    `🏠 ${escapeHtml(p.listingTitle)}`,
    `👤 ${escapeHtml(p.ownerEmail || "unknown")}`,
    `🧾 ref: <code>${escapeHtml(p.reference)}</code> · code: <code>${escapeHtml(p.code)}</code>`,
    `➡️ Approve: ${p.adminUrl}`,
  ].join("\n");
}
