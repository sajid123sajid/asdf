// Database adapter for Cloudflare D1 with local development fallback

export interface UserRecord {
  id: number | string;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
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

/**
 * Standard Web Crypto SHA-256 password hashing.
 * Works uniformly in Cloudflare Workers, Node.js, and modern browser environments.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_zupona_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .run();

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
  customEnv?: any
): Promise<UserRecord> {
  const db = getD1Database(customEnv);
  const normalizedEmail = email.toLowerCase().trim();

  if (db) {
    await ensureTables(db);
    try {
      await db
        .prepare(
          "INSERT INTO users (email, password, name, phone, address) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(normalizedEmail, passwordHash, name, phone, address)
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
    const updated = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      address: data.address !== undefined ? data.address : existing.address,
    };
    memoryUsers.set(normalizedEmail, updated);
    return updated;
  }
  return null;
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