/**
 * Password hashing with PBKDF2-SHA256 via Web Crypto — portable across
 * Node and Cloudflare Workers with no native dependencies.
 * Format: pbkdf2$<iterations>$<salt-b64>$<hash-b64>
 */

const ITERATIONS = 100_000;
const KEY_BYTES = 32;

function toB64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
function fromB64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    material,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(key)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
    if (scheme !== "pbkdf2") return false;
    const iterations = parseInt(iterStr, 10);
    if (!iterations || iterations > 1_000_000) return false;
    const expected = fromB64(hashB64);
    const actual = await derive(password, fromB64(saltB64), iterations);
    if (expected.length !== actual.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
    return diff === 0;
  } catch {
    return false;
  }
}
