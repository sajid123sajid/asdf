import { createServerFn } from "@tanstack/react-start";
import {
  registerUser,
  getUserByEmail,
  updateUserProfile,
  hashPassword,
  verifyPassword,
  updateUserPassword,
  createSession,
  getUserBySession,
  deleteSession,
  setUserRole,
  createOrder,
  getUserOrders as fetchUserOrders,
  getOrderById,
  type OrderRecord,
  type UserRecord,
  type UserRole,
} from "./db.ts";
import { getCatalogBySlug } from "./catalog-db.ts";
import { getProduct } from "./components/zupona/data.ts";
import { createSslcommerzPayment } from "./payment.ts";
import { z } from "zod";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_STATE_COOKIE = "zupona_google_oauth_state";
const GOOGLE_RETURN_COOKIE = "zupona_google_return";

const SESSION_COOKIE = "zupona_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: "lax" as const,
};

export function sanitizeAppReturnTo(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return trimmed || undefined;
  if (!trimmed.startsWith("/")) return undefined;
  if (trimmed.startsWith("//") || trimmed.startsWith("\\\\")) return undefined;
  if (/^(?:https?:|javascript:|data:)/i.test(trimmed)) return undefined;

  return trimmed;
}

function getRuntimeEnv() {
  return (globalThis as { __CLOUDFLARE_ENV__?: Record<string, unknown> }).__CLOUDFLARE_ENV__ ?? {};
}

function getCookieOptions() {
  const publicSiteUrl = getRuntimeEnv()["PUBLIC_SITE_URL"];
  return {
    ...COOKIE_OPTIONS,
    secure: typeof publicSiteUrl === "string" && publicSiteUrl.startsWith("https://"),
  };
}

const authenticateInput = z.object({
  email: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(512),
  name: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(500).optional(),
  mode: z.enum(["signin", "signup", "auto"]).optional(),
});

export interface SafeUser {
  id: string | number;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

const ADMIN_ROLES = new Set<UserRole>(["owner"]);

export function isAdminUser(user?: Pick<SafeUser, "email" | "role"> | null): boolean {
  return Boolean(user && ADMIN_ROLES.has(user.role));
}

async function loadCookieHelpers() {
  return await import("@tanstack/react-start/server");
}

async function getCookieHelpers() {
  try {
    return await loadCookieHelpers();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/No StartEvent found in AsyncLocalStorage|server runtime/i.test(message)) {
      return {
        getCookie: () => undefined,
        setCookie: () => undefined,
        deleteCookie: () => undefined,
      } as const;
    }
    throw error;
  }
}

async function readSessionCookie(name: string): Promise<string | undefined> {
  const { getCookie } = await getCookieHelpers();
  try {
    return getCookie(name);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/No StartEvent found in AsyncLocalStorage|server runtime/i.test(message)) {
      return undefined;
    }
    throw error;
  }
}

function getGoogleConfig() {
  const env = getRuntimeEnv();

  const clientId = typeof env["GOOGLE_CLIENT_ID"] === "string" ? env["GOOGLE_CLIENT_ID"] : "";
  const clientSecret = typeof env["GOOGLE_CLIENT_SECRET"] === "string" ? env["GOOGLE_CLIENT_SECRET"] : "";
  const redirectUri = typeof env["GOOGLE_REDIRECT_URI"] === "string"
    ? env["GOOGLE_REDIRECT_URI"]
    : "http://localhost:5173/google-callback";

  return { clientId, clientSecret, redirectUri };
}

function isGoogleConfigured() {
  const { clientId, clientSecret } = getGoogleConfig();
  return Boolean(clientId && clientSecret);
}

async function exchangeGoogleCodeForToken(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  return (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
}

async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google profile lookup failed: ${errorText}`);
  }

  return (await response.json()) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    sub?: string;
  };
}

export function configuredRoleFor(email: string): UserRole {
  const normalizedEmail = email.trim().toLowerCase();
  const env = getRuntimeEnv();
  const configuredAdmins = typeof env["ADMIN_EMAILS"] === "string"
    ? env["ADMIN_EMAILS"]
    : typeof env["ADMIN_EMAIL"] === "string"
      ? env["ADMIN_EMAIL"]
      : "";

  const adminEmails = new Set(
    configuredAdmins
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );

  return adminEmails.has(normalizedEmail) ? "owner" : "customer";
}

function toSafeUser(user: UserRecord): SafeUser {
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    role: user.role ?? configuredRoleFor(user.email),
    name: user.name ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
  };
  return user.created_at ? { ...safeUser, created_at: user.created_at } : safeUser;
}

async function signInUser(user: UserRecord): Promise<{ user: SafeUser; sessionId: string }> {
  const safeUser = toSafeUser(user);
  const session = await createSession(user.id);
  const { setCookie } = await getCookieHelpers();
  try {
    setCookie(SESSION_COOKIE, session.id, getCookieOptions());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/No StartEvent found in AsyncLocalStorage|server runtime/i.test(message)) {
      throw error;
    }
  }
  return { user: safeUser, sessionId: session.id };
}

async function requireAuthenticatedUser(): Promise<UserRecord> {
  const sessionId = await readSessionCookie(SESSION_COOKIE);
  const user = sessionId ? await getUserBySession(sessionId) : null;
  if (!user) throw new Error("You must be signed in to place an order.");
  return user;
}

/**
 * Authentication server function: Handles both Sign In and Sign Up with secure password hashing.
 */
export const authenticate = createServerFn({ method: "POST" })
  .validator((data) => authenticateInput.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase().trim();
    if (!email || !data.password) {
      throw new Error("Email and password are required.");
    }

    const existing = await getUserByEmail(email);

    const createAccount = async () => {
      const newUser = await registerUser(
        email,
        await hashPassword(data.password),
        data.name || "",
        data.phone || "",
        data.address || "",
        configuredRoleFor(email)
      );
      const signedIn = await signInUser(newUser);
      return { status: "signed_up" as const, user: signedIn.user };
    };

    const signInAccount = async (user: UserRecord) => {
      const passwordMatches = await verifyPassword(data.password, user.password);
      if (!passwordMatches) throw new Error("Incorrect password. Please try again.");
      if (!user.password.startsWith("pbkdf2-sha256$")) {
        await updateUserPassword(user.email, await hashPassword(data.password));
      }

      const expectedRole = configuredRoleFor(user.email);
      if (user.role !== expectedRole && expectedRole === "owner") {
        user = (await setUserRole(user.id, expectedRole)) ?? user;
      }

      const signedIn = await signInUser(user);
      return { status: "signed_in" as const, user: signedIn.user };
    };

    // Explicit Sign In
    if (data.mode === "signin") {
      if (!existing) {
        throw new Error("No account found with this email. Please sign up first.");
      }
      return await signInAccount(existing);
    }

    // Explicit Sign Up
    if (data.mode === "signup") {
      if (existing) {
        throw new Error("An account with this email already exists. Please sign in.");
      }
      return await createAccount();
    }

    // Auto mode (detect existing or register new)
    if (existing) {
      return await signInAccount(existing);
    }

    return await createAccount();
  });

export const getGoogleAuthUrl = createServerFn({ method: "GET" })
  .validator((data?: { returnTo?: string }) => data ?? {})
  .handler(async ({ data }) => {
  const { clientId, redirectUri } = getGoogleConfig();
  if (!clientId) {
    throw new Error("Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as server secrets.");
  }

  const state = crypto.randomUUID();
  const { setCookie } = await getCookieHelpers();
  setCookie(GOOGLE_STATE_COOKIE, state, {
    ...COOKIE_OPTIONS,
    httpOnly: true,
    sameSite: "lax",
  });
  if (data.returnTo) {
    setCookie(GOOGLE_RETURN_COOKIE, data.returnTo, {
      ...COOKIE_OPTIONS,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  });

export const completeGoogleLogin = createServerFn({ method: "POST" })
  .validator((data: { code?: string; state?: string }) => data)
  .handler(async ({ data }) => {
    const { code, state } = data;
    if (!code || !state) {
      throw new Error("The Google callback is missing required data.");
    }

    const { getCookie, deleteCookie } = await getCookieHelpers();
    let storedState: string | undefined;
    let returnTo: string | undefined;
    try {
      storedState = getCookie(GOOGLE_STATE_COOKIE);
      returnTo = getCookie(GOOGLE_RETURN_COOKIE);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/No StartEvent found in AsyncLocalStorage|server runtime/i.test(message)) {
        throw error;
      }
    }

    if (!storedState || storedState !== state) {
      throw new Error("Google login could not be verified.");
    }

    deleteCookie(GOOGLE_STATE_COOKIE, { path: "/" });
    deleteCookie(GOOGLE_RETURN_COOKIE, { path: "/" });

    if (!isGoogleConfigured()) {
      throw new Error("Google OAuth is not configured on this server.");
    }

    const token = await exchangeGoogleCodeForToken(code);
    if (!token.access_token) {
      throw new Error("Google did not return an access token.");
    }

    const profile = await fetchGoogleUserInfo(token.access_token);
    const email = (profile.email || "").trim().toLowerCase();
    if (!email || profile.email_verified !== true) {
      throw new Error("Google did not provide a verified email address.");
    }

    let user = await getUserByEmail(email);
    const displayName = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || email.split("@")[0];

    if (!user) {
      user = await registerUser(
        email,
        `google-oauth:${profile.sub ?? crypto.randomUUID()}`,
        displayName,
        "",
        "",
        configuredRoleFor(email)
      );
    }

    const expectedRole = configuredRoleFor(user.email);
    if (user.role !== expectedRole && expectedRole === "owner") {
      user = (await setUserRole(user.id, expectedRole)) ?? user;
    }

    if (!user.name && displayName) {
      user = (await updateUserProfile(email, { name: displayName })) ?? user;
    }

    const signedIn = await signInUser(user);
    return { status: "signed_in" as const, user: signedIn.user, returnTo };
  });

/**
 * Retrieve currently authenticated user from session cookie
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SafeUser | null> => {
    const sessionId = await readSessionCookie(SESSION_COOKIE);
    if (!sessionId) return null;

    const user = await getUserBySession(sessionId);
    if (!user) return null;
    return toSafeUser(user);
  }
);

/** Server-only guard. Every catalog and order mutation must pass through this check. */
export async function requireAdminUser(): Promise<SafeUser> {
  const sessionId = await readSessionCookie(SESSION_COOKIE);
  const user = sessionId ? await getUserBySession(sessionId) : null;
  if (!user) throw new Error("Sign in with an administrator account to continue.");
  const safeUser = toSafeUser(user);
  if (!isAdminUser(safeUser)) {
    throw new Error("Only the configured Zupona owner can access the admin dashboard.");
  }
  return safeUser;
}

/**
 * Log out user by clearing session cookie
 */
export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { deleteCookie } = await getCookieHelpers();
  const sessionId = await readSessionCookie(SESSION_COOKIE);
  if (sessionId) await deleteSession(sessionId);
  try {
    deleteCookie(SESSION_COOKIE, { path: "/" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/No StartEvent found in AsyncLocalStorage|server runtime/i.test(message)) {
      throw error;
    }
  }
  return { success: true };
});

/**
 * Update user's name, phone, or delivery address
 */
export const updateProfile = createServerFn({ method: "POST" })
  .validator(
    (data: { name?: string; phone?: string; address?: string }) => data
  )
  .handler(async ({ data }) => {
    const sessionId = await readSessionCookie(SESSION_COOKIE);
    const currentUser = sessionId ? await getUserBySession(sessionId) : null;
    if (!currentUser) {
      throw new Error("You must be signed in to update your profile.");
    }

    const updated = await updateUserProfile(currentUser.email, data);
    if (!updated) {
      throw new Error("Failed to update profile.");
    }

    return toSafeUser(updated);
  });

/**
 * Place a new order and persist it in the database
 */
export const placeOrder = createServerFn({ method: "POST" })
  .validator(
    (data: {
      email?: string;
      items: Array<{ slug: string; name: string; qty: number; price: number }>;
      totalAmount: number;
      shippingAddress: string;
      shippingPostcode: string;
      phone: string;
      paymentMethod?: string;
    }) => data
  )
  .handler(async ({ data }): Promise<OrderRecord> => {
    const sessionUser = await requireAuthenticatedUser();
    if (!Array.isArray(data.items) || data.items.length === 0 || data.items.length > 50) {
      throw new Error("Your cart is empty or too large.");
    }
    if (!data.shippingAddress.trim() || data.shippingAddress.trim().length > 500) {
      throw new Error("A valid delivery address is required.");
    }
    if (!data.phone.trim() || data.phone.trim().length > 40) {
      throw new Error("A valid phone number is required.");
    }
    if (!/^\d{4}$/.test(data.shippingPostcode.trim())) {
      throw new Error("A valid 4-digit postal code is required.");
    }

    const pricedItems = [] as Array<{ slug: string; name: string; qty: number; price: number }>;
    let subtotal = 0;
    for (const item of data.items) {
      if (typeof item.slug !== "string" || item.slug.length > 120 ||
          !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 100) {
        throw new Error("Invalid cart item.");
      }

      const catalogItem = await getCatalogBySlug(item.slug);
      const product = catalogItem?.product ?? getProduct(item.slug);
      if (!product || (catalogItem && catalogItem.status !== "active")) {
        throw new Error("One of the products in your cart is no longer available.");
      }
      if (product.stock !== undefined && item.qty > product.stock) {
        throw new Error(`Only ${product.stock} of ${product.name} is available.`);
      }

      const price = product.price;
      subtotal += price * item.qty;
      pricedItems.push({
        slug: product.slug,
        name: `${product.brand} ${product.name}`,
        qty: item.qty,
        price,
      });
    }

    const delivery = subtotal >= 999 ? 0 : 60;
    const totalAmount = subtotal + delivery;
    const userEmail = sessionUser.email;

    const orderId = `ZUP-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;

    const order = await createOrder({
      id: orderId,
      user_email: userEmail,
      items: JSON.stringify(pricedItems),
      total_amount: totalAmount,
      shipping_address: data.shippingAddress.trim(),
      phone: data.phone.trim(),
      payment_method: data.paymentMethod === "SSLCOMMERZ" ? "SSLCOMMERZ" : "Cash on Delivery",
      status: data.paymentMethod === "SSLCOMMERZ" ? "PENDING_PAYMENT" : "Order confirmed",
    });

    return order;
  });

export const startOnlinePayment = createServerFn({ method: "POST" })
  .validator(
    (data: {
      email?: string;
      items: Array<{ slug: string; name: string; qty: number; price: number }>;
      totalAmount: number;
      shippingAddress: string;
      shippingPostcode: string;
      phone: string;
    }) => data
  )
  .handler(async ({ data }) => {
    const order = await placeOrder({ data: { ...data, paymentMethod: "SSLCOMMERZ" } });
    const payment = await createSslcommerzPayment(
      { ...order, status: "PENDING_PAYMENT", payment_method: "SSLCOMMERZ" },
      data.shippingPostcode.trim(),
    );
    return { order: { ...order, status: "PENDING_PAYMENT", payment_method: "SSLCOMMERZ" }, paymentUrl: payment.paymentUrl };
  });

/**
 * Get all orders for the current logged-in user
 */
export const getUserOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderRecord[]> => {
    const { getCookie } = await loadCookieHelpers();
    const sessionId = getCookie(SESSION_COOKIE);
    const user = sessionId ? await getUserBySession(sessionId) : null;
    if (!user) return [];
    return await fetchUserOrders(user.email);
  }
);

/**
 * Live Track Order by order number
 */
export const trackOrder = createServerFn({ method: "POST" })
  .validator((data: { orderId: string }) => data)
  .handler(async ({ data }): Promise<OrderRecord | null> => {
    if (!data.orderId) return null;
    return await getOrderById(data.orderId);
  });
