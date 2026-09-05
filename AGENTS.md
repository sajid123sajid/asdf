# Project notes

This is the Zupona project. Keep changes focused, avoid unrelated refactors, and verify with the project checks before shipping.

## Current auth and persistence model

- Login and signup are implemented in `src/auth.ts` and `src/db.ts`.
- The app uses cookie-based sessions via `zupona_session`.
- Real persistence is meant to be Cloudflare D1 via the `DB` binding in `wrangler.jsonc`.
- If the `DB` binding is unavailable, the app falls back to in-memory storage for local-only development.
- Do not treat the in-memory fallback as production persistence.

## Required checks before shipping

- Update the project docs when the auth flow, env variables, or deployment steps change.
- Keep `README.md`, `wrangler.jsonc`, and `package.json` aligned with the actual runtime configuration.
- Verify that `npm run build` succeeds after dependency or config changes.
- After a change passes its focused validation and the production build, deploy the latest Worker before reporting the task complete.
