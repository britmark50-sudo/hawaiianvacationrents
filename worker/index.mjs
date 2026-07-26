// Cloudflare Worker entry: wraps the OpenNext-generated handler and adds the
// daily cron (Cron Triggers) that expires listings and sends reminders.
import openNext from "../.open-next/worker.js";

export default {
  fetch: openNext.fetch,

  async scheduled(controller, env, ctx) {
    const base = env.NEXT_PUBLIC_SITE_URL || "https://hawaiianvacationrents.com";
    const key = env.CRON_SECRET ? `?key=${encodeURIComponent(env.CRON_SECRET)}` : "";
    ctx.waitUntil(
      fetch(`${base}/api/cron/expire${key}`)
        .then((r) => console.log("[cron] expire →", r.status))
        .catch((e) => console.error("[cron] failed", e))
    );
  },
};

export * from "../.open-next/worker.js";
