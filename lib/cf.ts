import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Returns Cloudflare Workers bindings (D1, R2, vars) when running on
 * Cloudflare via OpenNext, or null in local Node development / build.
 */
export async function getCfEnv(): Promise<Record<string, any> | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as Record<string, any>) || null;
  } catch {
    return null;
  }
}
