import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCfEnv } from "@/lib/cf";


const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP or AVIF images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 8MB" }, { status: 400 });
  }

  const name = (globalThis.crypto?.randomUUID?.() || `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`) + ext;
  const bytes = await file.arrayBuffer();

  // Cloudflare: store in R2
  const env = await getCfEnv();
  if (env?.R2) {
    const key = `uploads/${name}`;
    await env.R2.put(key, bytes, {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    });
    return NextResponse.json({ url: `/r2/${key}` });
  }

  // Local development fallback: only available when running in a Node environment.
  if (typeof process !== "undefined" && process.versions?.node) {
    const path = await import("node:path");
    const { mkdir, writeFile } = await import("node:fs/promises");
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(bytes));
    return NextResponse.json({ url: `/uploads/${name}` });
  }

  return NextResponse.json({ error: "Upload storage is not configured in this environment." }, { status: 500 });
}
