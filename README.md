# Zupona

Zupona is a Bangladeshi e-commerce storefront and admin system for beauty, fashion, home, and lifestyle products. The project includes a storefront, customer account flow, order tracking, admin catalog controls, and Cloudflare-backed persistence.

## Tech stack

- TanStack Start
- React + TypeScript
- Tailwind CSS
- Cloudflare D1
- Cloudflare Workers / Wrangler

## Payments and orders

Checkout supports both cash on delivery and online payment through SSLCOMMERZ. The server
recalculates product prices, availability, delivery charge, and the final amount from the
catalog; browser-supplied prices and totals are not trusted.

Online orders are created as `PENDING_PAYMENT` before redirecting to SSLCOMMERZ. The Worker
validates the provider callback through the SSLCOMMERZ validation API and records transaction
details in the D1 `payments` table. Only a verified payment changes the order to `Order confirmed`.
Cash-on-delivery orders continue directly to `Order confirmed`.

Required checkout fields include customer name, phone, full delivery address, and a four-digit
Bangladesh postal code. SSLCOMMERZ callbacks are handled at `/payments/sslcommerz/success`,
`/payments/sslcommerz/fail`, `/payments/sslcommerz/cancel`, and `/payments/sslcommerz/ipn`.

## Authentication and data flow

The app includes a real login and signup flow in `src/auth.ts` and `src/db.ts`.

- Sign in / sign up endpoints are handled with `authenticate`
- Passwords are hashed with PBKDF2 before storage
- Sessions are stored in a session cookie and validated through `getUserBySession`
- User data is meant to be persisted in Cloudflare D1 using the `DB` binding
- Local development falls back to in-memory storage only when the D1 binding is unavailable

This means the system is production-ready for D1-backed auth, but the in-memory fallback is not a real database and should never be treated as persistent storage.

## Local development

Requirements:

- Node.js 20+
- npm

Install dependencies:

```sh
npm install
```

Start the Vite app:

```sh
npm run dev
```

For local Cloudflare/D1 testing:

```sh
npm run db:migrate:local
npm run dev:cf
```

The in-memory fallback is local-only. Use the local D1 migration command when testing database-backed
orders and payments locally.

## Production / Cloudflare deployment

This project expects the `DB` binding from `wrangler.jsonc` in the Cloudflare environment.

Required env values for auth features:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `ADMIN_EMAILS` (optional but used for admin access)

Required SSLCOMMERZ values for online payments:

- `SSLCOMMERZ_STORE_ID` (Cloudflare secret)
- `SSLCOMMERZ_STORE_PASSWORD` (Cloudflare secret)
- `SSLCOMMERZ_IS_SANDBOX=true` for sandbox testing, omitted or `false` for live
- `PUBLIC_SITE_URL` set to the public HTTPS origin of this Worker

The current configured production values are `SSLCOMMERZ_IS_SANDBOX=true` and
`PUBLIC_SITE_URL=https://zupona.com`, stored as non-secret Wrangler variables. The deployed
Worker is `zupona-store` and its custom domain is `zupona.com`.

Configure the secrets without putting credentials in source control:

```sh
wrangler secret put SSLCOMMERZ_STORE_ID
wrangler secret put SSLCOMMERZ_STORE_PASSWORD
```

In the SSLCOMMERZ merchant panel, enable the HTTP IPN listener and use the deployed
`/payments/sslcommerz/ipn` URL. The success, failure, and cancellation callback URLs are
registered automatically from `PUBLIC_SITE_URL`. Apply migration `0005_payments.sql` before
accepting online payments.

Apply the remote D1 migrations and deploy the Worker with its generated client assets:

```sh
wrangler d1 migrations apply zupona-db --remote
npm run build
npx wrangler deploy dist/server/server.js --config wrangler.jsonc
```

The `assets.directory` setting in `wrangler.jsonc` points to `dist/client`, and the custom-domain
route attaches `zupona.com` to this Worker. Do not use `--no-bundle` for deployment because the
TanStack Start SSR output depends on generated server chunks.

## Project structure

```text
src/
  auth.ts               # login, signup, Google OAuth, sessions
  db.ts                 # D1 + in-memory data layer
  catalog-db.ts         # catalog CRUD logic
  admin-api.ts          # admin-only protected functions
  payment.ts            # SSLCOMMERZ initiation, validation, and callbacks
  routes/               # storefront and account pages
  components/zupona/    # storefront UI components
  lib/                  # shared utilities and error handling
migrations/              # D1 SQL migrations, including 0005_payments.sql
public/                  # static assets
wrangler.jsonc           # Cloudflare Worker + D1 config
package.json             # project scripts and dependencies
```

## Notes

This codebase is intended to be developed and deployed as a standalone Zupona application, not as a Lovable template.

## Editorial catalog foundation

Migration `0004_editorial_catalog_foundation.sql` adds the first database layer for the editorial commerce system:

- Product SKU, SEO, review, scheduling, shipping, and return metadata
- Variant/SKU records with independent stock and low-stock thresholds
- Category-specific attribute definitions and product attribute values
- Inventory movement history
- Product collections and editorial pages with revisions

Apply it locally before using these tables:

```sh
npm run db:migrate:local
```

The current storefront remains compatible with the existing product shape while the admin editor is migrated to these structured records in a later step. D1 remains the production source of truth; the local in-memory fallback is for development only.
