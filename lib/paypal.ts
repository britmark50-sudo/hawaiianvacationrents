import "server-only";

function baseUrl(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal is not configured");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  const data = await res.json();
  return data.access_token as string;
}

export async function createPayPalOrder(opts: {
  amountCents: number;
  description: string;
  paymentId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approveUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: opts.paymentId,
          description: opts.description.slice(0, 127),
          amount: {
            currency_code: "USD",
            value: (opts.amountCents / 100).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Hawaiian Vacation Rents",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[paypal] create order failed", JSON.stringify(data).slice(0, 500));
    throw new Error("Could not create PayPal order");
  }
  const approve = (data.links || []).find(
    (l: { rel: string; href: string }) => l.rel === "approve"
  );
  if (!approve) throw new Error("PayPal approval link missing");
  return { orderId: data.id as string, approveUrl: approve.href as string };
}

export async function capturePayPalOrder(
  orderId: string
): Promise<{ completed: boolean; paymentId?: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    // Idempotency: a double redirect may hit an already-captured order
    const issue = data?.details?.[0]?.issue;
    if (issue === "ORDER_ALREADY_CAPTURED") return { completed: true };
    console.error("[paypal] capture failed", JSON.stringify(data).slice(0, 500));
    return { completed: false };
  }
  const completed = data.status === "COMPLETED";
  const paymentId: string | undefined =
    data?.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id ||
    data?.purchase_units?.[0]?.custom_id;
  return { completed, paymentId };
}
