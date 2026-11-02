# Marginly — Marketplace Analytics SaaS (MongoDB edition)

The uploaded React + Vite + Express app has been extended with multi-tenant MongoDB persistence, JWT login, demo seeding, unit-economics endpoints, DeepSeek insights, inventory forecasts, Telegram account pairing and alert scheduling. The existing UI and report pages are preserved.

## Setup (Node.js 20+ and MongoDB)

```bash
npm install
cp .env.example .env             # Windows PowerShell: Copy-Item .env.example .env
```

Set `MONGODB_URI`, `JWT_SECRET` (32+ random characters), `CREDENTIAL_ENCRYPTION_KEY` (32 random bytes encoded as 64 lowercase hex characters), and `DEMO_PASSWORD` (10+ characters) in `.env`. Set DeepSeek and Telegram keys only when enabling those integrations. **Do not commit `.env` or paste provider secrets into the frontend.**

```bash
npm run seed
npm run dev
```

Open http://localhost:5173 and log in using `DEMO_EMAIL` / `DEMO_PASSWORD`. `npm run seed` is destructive **for the demo user's existing products, orders, returns, fees and AI suggestions**. Other tenants are not affected. `npm test` executes existing financial helper tests. `npm run build` builds the browser bundle; `NODE_ENV=production npm start` serves its output.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/state`, `PATCH /api/business`, `PATCH /api/settings`
- `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- `GET /api/analytics/profit` (net, margin and ROI across products)
- `GET /api/inventory/predictions`, `POST /api/inventory/predictions/:id/refresh`
- `GET /api/ai/daily-advice?lang=uz|ru|en`, `POST /api/advisor`
- `POST /api/connections`, `DELETE /api/connections/:marketplace`
- `POST /api/telegram/link`
- `POST /api/demo/reset` (demo users only)

All endpoints except auth and health require `Authorization: Bearer <JWT>`. Store secrets are encrypted in MongoDB using AES-256-GCM and are never returned from any read route. Link Telegram by generating a temporary pairing code under Settings and sending `/start <code>` to the Telegram bot. The server receives bot updates using Telegram long polling (`getUpdates`), so no public webhook URL or webhook secret is required. Run only one polling server per bot token. An in-process alert scanner checks every 15 minutes and limits repeat messages to one per SKU per day.

### Accuracy and scope

The app calculates **recorded** revenue minus item COGS, marketplace referral fee, shipping/fulfillment, storage, advertising, other per-order charges and refunds. ROI uses `profit / COGS * 100`. Profit excludes tax, settlement corrections, payroll, subscriptions and unrecorded overhead. Historical order `unitCost` remains frozen to avoid changing past margins when product costs change. UZS values must not be summed with USD values; this release seeds only UZS data; a multi-currency ledger needs FX conversion at transaction time before mixed-currency live ingestion.

The forecasting baseline uses 30 UTC daily sales buckets and a blended 30/7-day velocity; DeepSeek can add a short trend, seasonality and days-left estimate. Cached predictions invalidate on source changes and expire after 24 hours. AI failure falls back to deterministic calculations. The AI payload contains only SKU-independent sales arrays, stock and baseline metrics for forecast; the daily advisor sends SKU-linked aggregates but no customer personal information. DeepSeek API uses JSON mode and limited tokens. Output is advisory, not a deterministic forecast.

**Not yet production-complete:** Saving a marketplace API token is **not** the same as connecting to Uzum or syncing orders: the licensed/official marketplace-specific API adapters and ingestion/webhook jobs must still be implemented and tested. The main dashboard retains much of its original English UI; the navbar, settings language choice, and generated AI cards support Uzbek, Russian and English, but full-screen i18n coverage is not yet complete. A production deployment also needs TLS, external worker/cron with distributed locking (instead of an in-process interval), centralized rate limits, comprehensive integration tests, audit logs, deployment secrets, currency conversion and a durable refresh/session strategy.

### Security notes

Do not serve a demo password to clients, do not use the example secret strings in deployment, and do not expose `CREDENTIAL_ENCRYPTION_KEY`. Credentials should be scoped to read-only access where the marketplace allows it. The demo state is per-user; resetting it will replace that demo account's data. JWTs are currently stored in per-tab `sessionStorage`; production should prefer appropriately hardened HTTP-only secure cookies with CSRF protection.
