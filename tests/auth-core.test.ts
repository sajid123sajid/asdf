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
