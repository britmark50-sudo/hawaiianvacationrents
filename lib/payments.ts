import "server-only";

export type PayMethod = "PAYPAL" | "USDT_TRC20" | "MOCK";

/** Automatic PayPal via REST API (Client ID + Secret). */
export function paypalApiConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/** Manual PayPal: owners send to this account email, admin approves. Active only without API keys. */
export function paypalEmail(): string {
  return process.env.PAYPAL_EMAIL || "";
}
export function paypalEmailConfigured(): boolean {
  return !!paypalEmail() && !paypalApiConfigured();
}

/** Any PayPal rail available (API or manual email). */
export function paypalConfigured(): boolean {
  return paypalApiConfigured() || paypalEmailConfigured();
}

export function usdtConfigured(): boolean {
  return !!process.env.USDT_TRC20_ADDRESS;
}

export function usdtAddress(): string {
  return process.env.USDT_TRC20_ADDRESS || "";
}

/**
 * "live"  → at least one real provider (PayPal / USDT wallet) is configured
 * "mock"  → simulated gateway for local dev & demos (default)
 */
export function paymentMode(): "live" | "mock" {
  if (process.env.PAYMENT_MODE === "mock") return "mock";
  return paypalConfigured() || usdtConfigured() ? "live" : "mock";
}

export function methodLabel(method: string): string {
  switch (method) {
    case "PAYPAL":
      return "PayPal";
    case "USDT_TRC20":
      return "USDT (TRC20)";
    case "MOCK":
      return "Demo";
    default:
      return method;
  }
}

export function kindLabel(kind: string): string {
  switch (kind) {
    case "PUBLISH":
      return "Listing publication";
    case "RENEWAL":
      return "Listing renewal";
    default:
      return kind;
  }
}
