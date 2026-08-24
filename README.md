# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Cloudflare deployment

This repository uses npm and commits `package-lock.json` so Cloudflare can
reproduce dependencies with `npm ci`. After changing `package.json`, regenerate
and commit the lockfile with `npm install` before deploying. Confirm the
Cloudflare deployment is building the latest `main` commit, not an older failed
deployment.

The Worker requires the `DB` D1 binding from `wrangler.jsonc`. Google OAuth also
requires the server-only `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and exact
`GOOGLE_REDIRECT_URI` secrets in the Cloudflare environment.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
