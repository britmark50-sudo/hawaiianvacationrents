/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  poweredByHeader: false,
  // Keep Prisma external so the OpenNext/esbuild pass resolves it with the
  // "workerd" export condition → WASM query engine on Cloudflare Workers
  // (locally, Node resolves the same package to the native engine).
  serverExternalPackages: ["@prisma/client", ".prisma/client", "@prisma/adapter-d1"],
};
export default nextConfig;
