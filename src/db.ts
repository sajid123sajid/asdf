// Database adapter for Cloudflare D1 with local development fallback

export interface UserRecord {
  id: number | string;
  email: string;
  password: string;
  role?: UserRole;
  name?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export type UserRole = "owner" | "manager" | "staff" | "customer";

export interface SessionRecord {
  id: string;
  user_id: number | string;
  expires_at: string;
  created_at?: string;
}

export interface OrderRecord {
  id: string;
  user_email: string;
  items: string; // JSON string of cart items
  total_amount: number;
  shipping_address: string;
  phone: string;
  payment_method?: string;
  status?: string;
  created_at?: string;
}

// In-memory fallback for local dev when Cloudflare D1 binding is not active
const memoryUsers = new Map<string, UserRecord>();
const memoryOrders = new Map<string, OrderRecord>();
const memorySessions = new Map<string, SessionRecord>();

// Cloudflare Workers' PBKDF2 implementation rejects iteration counts above 100,000.
// Keep this value at the runtime maximum so hashing works in production.
const PASSWORD_ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function safeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const maxLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

/** Password hashes are salted and deliberately expensive, using Web Crypto in Workers. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

/** Supports one-time verification of the legacy Zupona hashes so users can be upgraded on sign-in. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, iterationValue, saltValue, hashValue] = storedHash.split("$");
  if (scheme === "pbkdf2-sha256" && iterationValue && saltValue && hashValue) {
    const iterations = Number(iterationValue);
    if (!Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 100_000) return false;
    const actual = await pbkdf2(password, base64ToBytes(saltValue), iterations);
    return safeEqual(actual, base64ToBytes(hashValue));
  }

  const legacy = new TextEncoder().encode(password + "_zupona_salt_v1");
  const legacyDigest = await crypto.subtle.digest("SHA-256", legacy);
  const legacyHex = Array.from(new Uint8Array(legacyDigest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return safeEqual(new TextEncoder().encode(storedHash), new TextEncoder().encode(legacyHex)) ||
    safeEqual(new TextEncoder().encode(storedHash), new TextEncoder().encode(password));
}

/**
 * Get Cloudflare D1 Database instance safely from global context or passed env
 */
export function getD1Database(customEnv?: any): any | null {
  if (customEnv && customEnv.DB) return customEnv.DB;
  const globalEnv = (globalThis as any).__CLOUDFLARE_ENV__;
  if (globalEnv && globalEnv.DB) return globalEnv.DB;
  if ((globalThis as any).DB) return (globalThis as any).DB;
  return null;
}

let dbInitialized = false;
async function ensureTables(db: any) {
  if (dbInitialized || !db) return;
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT DEFAULT '',
          phone TEXT DEFAULT '',
          address TEXT DEFAULT '',
          role TEXT DEFAULT 'customer',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .run();

    try {
      await db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'").run();
    } catch {
      // Some DBs already have the column; ignore the harmless migration failure.
    }

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_email TEXT NOT NULL,
          items TEXT NOT NULL,
          total_amount REAL NOT NULL,
          shipping_address TEXT NOT NULL,
          phone TEXT NOT NULL,
          payment_method TEXT DEFAULT 'Cash on Delivery',
          status TEXT DEFAULT 'Order confirmed',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .run();

    await db.prepare(
      `CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL UNIQUE,
        tran_id TEXT NOT NULL UNIQUE,
        val_id TEXT,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'INITIATED',
        gateway_status TEXT,
        bank_tran_id TEXT,
        card_type TEXT,
        raw_response TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )`
    ).run();

    dbInitialized = true;
  } catch (err) {
    console.warn("Table initialization note:", err);
  }
}

/**
 * Register a new user in database
 */
export async function registerUser(
  email: string,
  passwordHash: string,
  name = "",
  phone = "",
  address = "",
  role: UserRole = "customer",
  customEnv?: any
): Promise<UserRecord> {
  const db = getD1Database(customEnv);
  const normalizedEmail = email.toLowerCase().trim();

  if (db) {
    await ensureTables(db);
    try {
      await db
        .prepare(
          "INSERT INTO users (email, password, name, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(normalizedEmail, passwordHash, name, phone, address, role)
        .run();
    } catch (err: any) {
      // If column doesn't exist yet in an older D1 schema, fallback insert
      if (err?.message?.includes("has no column")) {
        await db
          .prepare("INSERT INTO users (email, password) VALUES (?, ?)")
          .bind(normalizedEmail, passwordHash)
          .run();
      } else {
        throw err;
      }
    }
    const user = await getUserByEmail(normalizedEmail, customEnv);
    return user!;
  }

  // Dev in-memory storage fallback
  const user: UserRecord = {
    id: Date.now(),
    email: normalizedEmail,
    password: passwordHash,
    role,
    name,
    phone,
    address,
    created_at: new Date().toISOString(),
  };
  memoryUsers.set(normalizedEmail, user);
  return user;
}

/**
 * Fetch a user by email
 */
export async function getUserByEmail(
  email: string,
  customEnv?: any
): Promise<UserRecord | null> {
  const db = getD1Database(customEnv);
  const normalizedEmail = email.toLowerCase().trim();

  if (db) {
    await ensureTables(db);
    const user = await db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(normalizedEmail)
      .first();
    return user ? (user as UserRecord) : null;
  }

  return memoryUsers.get(normalizedEmail) || null;
}

/**
 * Update user profile details (name, phone, address)
 */
export async function updateUserProfile(
  email: string,
  data: { name?: string; phone?: string; address?: string },
  customEnv?: any
): Promise<UserRecord | null> {
  const db = getD1Database(customEnv);
  const normalizedEmail = email.toLowerCase().trim();

  if (db) {
    await ensureTables(db);
    await db
      .prepare(
        "UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE email = ?"
      )
      .bind(data.name ?? null, data.phone ?? null, data.address ?? null, normalizedEmail)
      .run();
    return await getUserByEmail(normalizedEmail, customEnv);
  }

  const existing = memoryUsers.get(normalizedEmail);
  if (existing) {
    const updated: UserRecord = { ...existing };
    if (data.name !== undefined) updated.name = data.name;
    if (data.phone !== undefined) updated.phone = data.phone;
    if (data.address !== undefined) updated.address = data.address;
    memoryUsers.set(normalizedEmail, updated);
    return updated;
  }
  return null;
}

export async function updateUserPassword(
  email: string,
  passwordHash: string,
  customEnv?: any
): Promise<void> {
  const db = getD1Database(customEnv);
  const normalizedEmail = email.toLowerCase().trim();
  if (db) {
    await db.prepare("UPDATE users SET password = ? WHERE email = ?").bind(passwordHash, normalizedEmail).run();
    return;
  }
  const existing = memoryUsers.get(normalizedEmail);
  if (existing) memoryUsers.set(normalizedEmail, { ...existing, password: passwordHash });
}

/**
 * Create and persist an order
 */
export async function createOrder(
  order: {
    id: string;
    user_email: string;
    items: string;
    total_amount: number;
    shipping_address: string;
    phone: string;
    payment_method?: string;
    status?: string;
  },
  customEnv?: any
): Promise<OrderRecord> {
  const db = getD1Database(customEnv);
  const record: OrderRecord = {
    id: order.id,
    user_email: order.user_email.toLowerCase().trim(),
    items: order.items,
    total_amount: order.total_amount,
    shipping_address: order.shipping_address,
    phone: order.phone,
    payment_method: order.payment_method || "Cash on Delivery",
    status: order.status || "Order confirmed",
    created_at: new Date().toISOString(),
  };

  if (db) {
    await ensureTables(db);
    await db
      .prepare(
        `INSERT INTO orders (id, user_email, items, total_amount, shipping_address, phone, payment_method, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.user_email,
        record.items,
        record.total_amount,
        record.shipping_address,
        record.phone,
        record.payment_method,
        record.status
      )
      .run();
    return record;
  }

  memoryOrders.set(record.id, record);
  return record;
}

/**
 * Get all orders for a specific user email
 */
export async function getUserOrders(
  email: string,
  customEnv?: any
): Promise<OrderRecord[]> {
  const db = getD1Database(customEnv);
  const normalizedEmail = email.toLowerCase().trim();

  if (db) {
    await ensureTables(db);
    const { results } = await db
      .prepare("SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC")
      .bind(normalizedEmail)
      .all();
    return (results || []) as OrderRecord[];
  }

  return Array.from(memoryOrders.values())
    .filter((o) => o.user_email === normalizedEmail)
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

/**
 * Fetch a single order by its ID (for live order tracking)
 */
export async function getOrderById(
  orderId: string,
  customEnv?: any
): Promise<OrderRecord | null> {
  const db = getD1Database(customEnv);
  const cleanId = orderId.trim().toUpperCase();

  if (db) {
    await ensureTables(db);
    const order = await db
      .prepare("SELECT * FROM orders WHERE id = ?")
      .bind(cleanId)
      .first();
    return order ? (order as OrderRecord) : null;
  }

  return memoryOrders.get(cleanId) || null;
}

/**
 * Get all orders in the entire system (for Admin dashboard)
 */
export async function getAllOrders(customEnv?: any): Promise<OrderRecord[]> {
  const db = getD1Database(customEnv);

  if (db) {
    await ensureTables(db);
    const { results } = await db
      .prepare("SELECT * FROM orders ORDER BY created_at DESC")
      .all();
    return (results || []) as OrderRecord[];
  }

  return Array.from(memoryOrders.values()).sort((a, b) =>
    (b.created_at || "").localeCompare(a.created_at || "")
  );
}

/**
 * Update the status of an order
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  customEnv?: any
): Promise<OrderRecord | null> {
  const db = getD1Database(customEnv);
  const cleanId = orderId.trim().toUpperCase();

  if (db) {
    await ensureTables(db);
    await db
      .prepare("UPDATE orders SET status = ? WHERE id = ?")
      .bind(newStatus, cleanId)
      .run();
    return await getOrderById(cleanId, customEnv);
  }

  const existing = memoryOrders.get(cleanId);
  if (existing) {
    const updated = { ...existing, status: newStatus };
    memoryOrders.set(cleanId, updated);
    return updated;
  }
  return null;
}

/** Create a short-lived opaque session token. Never store personal data in the cookie itself. */
export async function createSession(
  userId: number | string,
  customEnv?: any
): Promise<SessionRecord> {
  const db = getD1Database(customEnv);
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    created_at: new Date().toISOString(),
  };

  if (db) {
    await db
      .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(session.id, session.user_id, session.expires_at)
      .run();
  } else {
    memorySessions.set(session.id, session);
  }

  return session;
}

/** Resolve a valid session together with its user and role. */
export async function getUserBySession(
  sessionId: string,
  customEnv?: any
): Promise<UserRecord | null> {
  const db = getD1Database(customEnv);
  if (!sessionId) return null;

  if (db) {
    const user = await db
      .prepare(
        `SELECT users.*
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.id = ? AND sessions.expires_at > CURRENT_TIMESTAMP`
      )
      .bind(sessionId)
      .first();
    return user ? (user as UserRecord) : null;
  }

  const session = memorySessions.get(sessionId);
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
    memorySessions.delete(sessionId);
    return null;
  }

  return Array.from(memoryUsers.values()).find((user) => String(user.id) === String(session.user_id)) ?? null;
}

export async function deleteSession(sessionId: string, customEnv?: any): Promise<void> {
  const db = getD1Database(customEnv);
  if (db) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    return;
  }
  memorySessions.delete(sessionId);
}

export async function setUserRole(
  userId: number | string,
  role: UserRole,
  customEnv?: any
): Promise<UserRecord | null> {
  const db = getD1Database(customEnv);
  if (db) {
    await db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, userId).run();
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    return user ? (user as UserRecord) : null;
  }

  const existing = Array.from(memoryUsers.values()).find((user) => String(user.id) === String(userId));
  if (!existing) return null;
  const updated: UserRecord = { ...existing, role };
  memoryUsers.set(updated.email, updated);
  return updated;
}
