import "server-only";

/**
 * Sends a submission to Formspree (email delivery channel).
 * Configured via FORMSPREE_ENDPOINT — silently skipped when unset.
 * Runs alongside the platform database, never instead of it.
 */
export async function sendFormspree(fields: Record<string, string>): Promise<void> {
  const endpoint = process.env.FORMSPREE_ENDPOINT;
  if (!endpoint) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[formspree:skip]", fields._subject || "submission");
    }
    return;
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(fields),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[formspree] send failed", res.status, (await res.text()).slice(0, 200));
    }
  } catch (err) {
    console.error("[formspree] send error", err);
  }
}
