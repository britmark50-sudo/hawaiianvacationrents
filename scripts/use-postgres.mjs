// Switches the Prisma datasource from SQLite (local dev) to PostgreSQL (production).
// Usage: node scripts/use-postgres.mjs   (then set DATABASE_URL to your Postgres URL)
import { readFileSync, writeFileSync } from "fs";

const file = new URL("../prisma/schema.prisma", import.meta.url);
let schema = readFileSync(file, "utf8");
if (schema.includes('provider = "postgresql"')) {
  console.log("Already using postgresql.");
  process.exit(0);
}
schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
writeFileSync(file, schema);
console.log('✓ prisma/schema.prisma now uses provider = "postgresql"');
console.log('Next: set DATABASE_URL to your Postgres connection string, then run:');
console.log("  npx prisma db push && npm run db:seed");
