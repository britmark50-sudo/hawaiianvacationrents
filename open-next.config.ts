import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Fully dynamic rendering (data lives in D1) — no incremental cache needed.
export default defineCloudflareConfig({});
