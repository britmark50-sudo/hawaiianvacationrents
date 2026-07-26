# 🌺 Hawaiian Vacation Rents

**hawaiianvacationrents.com** — The Hawaiʻi-only vacation home directory. Owners publish
with flat 30-day packages — **Basic $5 · Featured $20 · Premium $50** — and travelers
contact owners **directly**. The platform never takes bookings, guest payments, or commissions.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma**.
Payments: **PayPal** + **USDT (TRC20)** with automatic on-chain verification.
Deployment: **Cloudflare Workers + D1 + R2 + Cron Triggers** (via OpenNext).

---

## Quick start (local)

```bash
npm install          # installs deps + generates Prisma client
npm run db:push      # creates the SQLite database (dev.db)
npm run db:seed      # demo data: 12 listings, users, payments, blog, legal pages
npm run dev          # http://localhost:3000
```

### Demo accounts (password for all: `Aloha2026!`)

| Role  | Email                              | Where |
|-------|------------------------------------|-------|
| Admin | admin@hawaiianvacationrents.com    | `/admin` |
| Owner | leilani@example.com                | `/dashboard` |
| Owner | thompson@example.com               | `/dashboard` |
| Owner | nakamura@example.com               | `/dashboard` |

> Payments run in **mock mode** by default (`PAYMENT_MODE="mock"`) so the whole
> publish → pay $5 → auto-activate flow works locally with a simulated gateway.
> For production set `PAYMENT_MODE="live"` and configure **either or both**:
> - **PayPal** — `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` (+ `PAYPAL_MODE=live`)
> - **USDT TRC20** — `USDT_TRC20_ADDRESS` (your Tron wallet; payments go straight to you)

---

## How payments work

### PayPal
1. Owner clicks **Pay with PayPal** → server creates a PayPal Order (Orders API v2)
2. Owner approves on PayPal → returns to `/api/paypal/return`
3. Server **captures** the order, marks the payment PAID and **publishes the listing instantly**
4. Receipt email sent · renewal works the same way

### USDT (TRC20) — direct to your wallet, zero middleman, strict verification
1. Owner clicks **Pay with USDT** → sees your wallet address + QR + exact amount
2. Owner sends the transfer, then pastes the **transaction hash (TxID)** — that's all
3. The server verifies against the TRON blockchain (**TronScan API primary, TronGrid fallback**), enforcing all of:
   - **Existence** — the hash is a real on-chain transaction
   - **Official contract** — Tether USDT `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` only (no lookalike tokens)
   - **Exact recipient** — full literal match against `USDT_TRC20_ADDRESS`
   - **Amount** — ≥ package price (±0.01 USDT rounding tolerance)
   - **Finality** — ≥ 19 network confirmations
   - **Freshness** — executed within the last 30 minutes
   - **Lifetime replay protection** — every hash is claimable exactly once, recorded permanently in `UsedTxHash`
   - **Rate limiting** — max 5 attempts / 10 min per user *and* per IP
4. Every attempt (accepted or rejected, with the exact rejection reason, amount, IP) lands in the
   **admin audit log** (`/admin/audit`). All thresholds are env-tunable.
5. Listing publishes automatically the instant verification passes

Both flows keep the core promise: **نشر تلقائي بعد الدفع** — no manual approval needed.

## What's inside

- **Public site** — home, `/search` with full filters (island, town, keyword, type, price, bedrooms, guests, 16 amenities), 4 island + 30 town SEO pages, listing pages with gallery/map/owner-contact-reveal/report, blog (5 categories), favorites, editable legal pages, sitemap/robots/JSON-LD
- **Owner dashboard** — signup/login, property CRUD with multi-photo upload, 3-package checkout (PayPal / USDT / demo), renewals & upgrades that keep remaining days, view & inquiry stats, payment history, email receipts
- **Admin panel** — revenue & stats, listings moderation (feature/suspend/delete), users, payments ledger (with method), reports queue, blog CMS, legal pages editor, contact inbox
- **Automation** — daily cron (`/api/cron/expire`): expires listings + emails owners, 5-day expiry reminders; expiry also enforced at query time

## Environment variables

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | SQLite locally; Postgres in production |
| `SESSION_SECRET` | JWT signing secret — long random string |
| `NEXT_PUBLIC_SITE_URL` | `https://hawaiianvacationrents.com` in production |
| `PAYMENT_MODE` | `mock` (default) or `live` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal REST app credentials |
| `PAYPAL_MODE` | `sandbox` or `live` |
| `USDT_TRC20_ADDRESS` | your Tron wallet address (receives listing fees) |
| `TRONGRID_API_KEY` | optional — higher rate limits for on-chain verification |
| `BASIC_PRICE_CENTS` / `FEATURED_PRICE_CENTS` / `PREMIUM_PRICE_CENTS` | package prices (500 / 2000 / 5000) |
| `LISTING_DURATION_DAYS` | package duration (30) |
| `RESEND_API_KEY` / `EMAIL_FROM` | receipts & reminders (console-logged if unset) |
| `CRON_SECRET` | protects the cron endpoint |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | instant Telegram alerts: every successful payment ✅, every rejected USDT attempt ❌ (with reason), every PayPal claim awaiting approval ⏳ |

## Going to production (Cloudflare)

Full step-by-step guide (Arabic): **[DEPLOYMENT.md](./DEPLOYMENT.md)**. Summary:

```bash
npx wrangler login
npm run cf:d1:create      # paste database_id into wrangler.toml
npm run cf:d1:migrate     # create tables on remote D1
npm run cf:d1:seed        # optional demo data
npx wrangler r2 bucket create hvr-uploads
npx wrangler secret put SESSION_SECRET   # + PAYPAL_EMAIL, TELEGRAM_*, CRON_SECRET…
npm run cf:deploy         # build (OpenNext) + deploy to Workers
```

Architecture on Cloudflare: **Workers** run the app (OpenNext adapter, WASM Prisma engine),
**D1** is the database (same SQLite schema — local dev still uses dev.db untouched),
**R2** stores listing photos (served via `/r2/…` through the worker), and a **Cron
Trigger** (08:00 UTC) expires listings and sends reminders. Local dev: `npm run dev`
(fast, Node+SQLite) or `npm run cf:preview` (full Workers/D1/R2 simulation).

## Future revenue hooks

- `Payment.kind` + `Payment.method` — extend with new paid products/providers (Stripe can be added later without restructuring)
- Pricing via env vars — no redeploy needed to test price points
