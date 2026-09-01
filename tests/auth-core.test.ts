import assert from "node:assert/strict";
import test from "node:test";

import {
  createSession,
  deleteSession,
  getUserByEmail,
  getUserBySession,
  hashPassword,
  registerUser,
  verifyPassword,
} from "../src/db.ts";
import { configuredRoleFor, getGoogleConfig, sanitizeAppReturnTo } from "../src/auth.ts";

test("passwords are stored as verifiable non-plaintext hashes", async () => {
  const password = "auth-core-password";
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.match(hash, /^pbkdf2-sha256\$100000\$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("registration normalizes email and rejects duplicate accounts", async () => {
  const email = `Auth-Core-${crypto.randomUUID()}@Example.COM`;
  const user = await registerUser(email, await hashPassword("signup-password"), "Core User");
  const stored = await getUserByEmail(email);

  assert.equal(stored?.id, user.id);
  assert.equal(stored?.email, email.toLowerCase());
  assert.equal(stored?.name, "Core User");
  assert.notEqual(stored?.password, "signup-password");
  await assert.rejects(
    async () => registerUser(email, await hashPassword("another-password")),
    /already exists/i,
  );
});

test("sessions resolve to the correct user and logout invalidates them", async () => {
  const email = `Auth-Session-${crypto.randomUUID()}@example.com`;
  const user = await registerUser(email, await hashPassword("session-password"));
  const session = await createSession(user.id);

  const resolved = await getUserBySession(session.id);
  assert.equal(resolved?.id, user.id);
  assert.equal(resolved?.email, user.email);
  assert.notEqual(session.id, user.email);

  await deleteSession(session.id);
  assert.equal(await getUserBySession(session.id), null);
});

test("admin emails from runtime config map to the owner role", async () => {
  const previousEnv = (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__;
  (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__ = {
    ADMIN_EMAILS: "owner@example.com, admin@zupona.com",
  };

  try {
    assert.equal(configuredRoleFor("owner@example.com"), "owner");
    assert.equal(configuredRoleFor("customer@example.com"), "customer");
    assert.equal(configuredRoleFor("ADMIN@ZUPONA.COM"), "owner");
  } finally {
    if (previousEnv === undefined) {
      delete (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__;
    } else {
      (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__ = previousEnv;
    }
  }
});

test("Google OAuth config resolves from runtime and local env values", () => {
  const previousEnv = (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__;
  const previousClientId = process.env.GOOGLE_CLIENT_ID;
  const previousClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const previousPublicSiteUrl = process.env.PUBLIC_SITE_URL;

  delete (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__;
  process.env.GOOGLE_CLIENT_ID = "local-google-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "local-google-client-secret";
  process.env.PUBLIC_SITE_URL = "https://example.com";

  try {
    const config = getGoogleConfig();
    assert.equal(config.clientId, "local-google-client-id");
    assert.equal(config.clientSecret, "local-google-client-secret");
    assert.equal(config.redirectUri, "https://example.com/google-callback");
  } finally {
    if (previousEnv === undefined) {
      delete (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__;
    } else {
      (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__ = previousEnv;
    }

    if (previousClientId === undefined) {
      delete process.env.GOOGLE_CLIENT_ID;
    } else {
      process.env.GOOGLE_CLIENT_ID = previousClientId;
    }

    if (previousClientSecret === undefined) {
      delete process.env.GOOGLE_CLIENT_SECRET;
    } else {
      process.env.GOOGLE_CLIENT_SECRET = previousClientSecret;
    }

    if (previousPublicSiteUrl === undefined) {
      delete process.env.PUBLIC_SITE_URL;
    } else {
      process.env.PUBLIC_SITE_URL = previousPublicSiteUrl;
    }
  }
});

test("safe return destinations stay internal while unsafe redirects are rejected", () => {
  assert.equal(sanitizeAppReturnTo("/checkout"), "/checkout");
  assert.equal(sanitizeAppReturnTo("/cart?returnTo=%2Fcheckout"), "/cart?returnTo=%2Fcheckout");
  assert.equal(sanitizeAppReturnTo("/checkout#shipping"), "/checkout#shipping");
  assert.equal(sanitizeAppReturnTo("https://evil.example/checkout"), undefined);
  assert.equal(sanitizeAppReturnTo("//evil.example/checkout"), undefined);
  assert.equal(sanitizeAppReturnTo("javascript:alert(1)"), undefined);
});
