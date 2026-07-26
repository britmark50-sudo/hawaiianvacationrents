import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Dual-mode database access:
 *  - On Cloudflare Workers → D1 via the official Prisma driver adapter
 *    (binding `DB` from wrangler.toml), cached per isolate.
 *  - In local dev / build / scripts → the classic SQLite client (dev.db).
 *
 * `getDb()` resolves the right client (use it when you need `$transaction`
 * with the array form). The exported `prisma` proxy keeps the familiar
 * `prisma.model.method()` surface for everything else.
 */

const g = globalThis as unknown as {
  __prismaLocal?: PrismaClient;
  __prismaD1?: PrismaClient;
};

function localClient(): PrismaClient {
  if (!g.__prismaLocal) {
    g.__prismaLocal = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return g.__prismaLocal;
}

export async function getDb(): Promise<PrismaClient> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as { DB?: unknown } | undefined;
    if (env?.DB) {
      if (!g.__prismaD1) {
        g.__prismaD1 = new PrismaClient({
          adapter: new PrismaD1(env.DB as ConstructorParameters<typeof PrismaD1>[0]),
        });
      }
      return g.__prismaD1;
    }
  } catch {
    // Not running on Cloudflare — the local SQLite client below is used.
  }
  return localClient();
}

/** Async-resolving convenience proxy: prisma.model.method(...) / prisma.$method(...). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (typeof prop !== "string" || prop === "then") return undefined;

    // Top-level client methods ($transaction, $queryRaw, $disconnect, …)
    if (prop.startsWith("$")) {
      return (...args: unknown[]) =>
        getDb().then((db) => (db as unknown as Record<string, (...a: unknown[]) => unknown>)[prop](...args));
    }

    // Model delegates (prisma.property, prisma.payment, …)
    return new Proxy(
      {},
      {
        get(_t2, method) {
          if (typeof method !== "string" || method === "then") return undefined;
          return (...args: unknown[]) =>
            getDb().then((db) => {
              const delegate = (db as unknown as Record<string, Record<string, (...a: unknown[]) => unknown>>)[prop];
              return delegate[method](...args);
            });
        },
      }
    );
  },
}) as PrismaClient;
