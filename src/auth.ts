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
  createOrder,
  getUserOrders as fetchUserOrders,
  getOrderById,
  type OrderRecord,
  type UserRecord,
  type UserRole,
} from "./db";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_STATE_COOKIE = "zupona_google_oauth_state";

const SESSION_COOKIE = "zupona_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: "lax" as const,
};

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
const DEFAULT_ADMIN_EMAILS = new Set(["sajedaakter361@gmail.com"]);

async function loadCookieHelpers() {
  return await import("@tanstack/react-start/server");
}

function getGoogleConfig() {
  const env = (globalThis as { __CLOUDFLARE_ENV__?: Record<string, unknown> }).__CLOUDFLARE_ENV__ ?? {};

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

function configuredRoleFor(email: string): UserRole {
  return getConfiguredAdminEmails().has(email.toLowerCase()) ? "owner" : "customer";
}

function getConfiguredAdminEmails() {
  const env = (globalThis as { __CLOUDFLARE_ENV__?: { ADMIN_EMAILS?: unknown } }).__CLOUDFLARE_ENV__;
  const configuredEmails = typeof env?.ADMIN_EMAILS === "string" ? env.ADMIN_EMAILS : "";
  return new Set(
    configuredEmails
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .concat([...DEFAULT_ADMIN_EMAILS])
  );
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
  const { setCookie } = await loadCookieHelpers();
  setCookie(SESSION_COOKIE, session.id, COOKIE_OPTIONS);
  return { user: safeUser, sessionId: session.id };
}

/**
 * Authentication server function: Handles both Sign In and Sign Up with secure password hashing.
 */
export const authenticate = createServerFn({ method: "POST" })
  .validator(
    (data: {
      email: string;
      password: string;
      name?: string;
      phone?: string;
      address?: string;
      mode?: "signin" | "signup" | "auto";
    }) => data
  )
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

export const getGoogleAuthUrl = createServerFn({ method: "GET" }).handler(async () => {
  const { clientId, redirectUri } = getGoogleConfig();
  if (!clientId) {
    throw new Error("Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as server secrets.");
  }

  const state = crypto.randomUUID();
  const { setCookie } = await loadCookieHelpers();
  setCookie(GOOGLE_STATE_COOKIE, state, {
    ...COOKIE_OPTIONS,
    httpOnly: true,
    sameSite: "lax",
  });

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

    const { getCookie, deleteCookie } = await loadCookieHelpers();
    const storedState = getCookie(GOOGLE_STATE_COOKIE);

    if (!storedState || storedState !== state) {
      throw new Error("Google login could not be verified.");
    }

    deleteCookie(GOOGLE_STATE_COOKIE, { path: "/" });

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

    if (!user.name && displayName) {
      user = (await updateUserProfile(email, { name: displayName })) ?? user;
    }

    const signedIn = await signInUser(user);
    return { status: "signed_in" as const, user: signedIn.user };
  });

/**
 * Retrieve currently authenticated user from session cookie
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SafeUser | null> => {
    const { getCookie } = await loadCookieHelpers();
    const sessionId = getCookie(SESSION_COOKIE);
    if (!sessionId) return null;

    const user = await getUserBySession(sessionId);
    if (!user) return null;
    return toSafeUser(user);
  }
);

/** Server-only guard. Every catalog and order mutation must pass through this check. */
export async function requireAdminUser(): Promise<SafeUser> {
  const { getCookie } = await loadCookieHelpers();
  const sessionId = getCookie(SESSION_COOKIE);
  const user = sessionId ? await getUserBySession(sessionId) : null;
  if (!user) throw new Error("Sign in with an administrator account to continue.");
  const safeUser = toSafeUser(user);
  if (!ADMIN_ROLES.has(safeUser.role) || !getConfiguredAdminEmails().has(safeUser.email.toLowerCase())) {
    throw new Error("Only the configured Zupona owner can access the admin dashboard.");
  }
  return safeUser;
}

/**
 * Log out user by clearing session cookie
 */
export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { getCookie, deleteCookie } = await loadCookieHelpers();
  const sessionId = getCookie(SESSION_COOKIE);
  if (sessionId) await deleteSession(sessionId);
  deleteCookie(SESSION_COOKIE, { path: "/" });
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
    const { getCookie } = await loadCookieHelpers();
    const sessionId = getCookie(SESSION_COOKIE);
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
      phone: string;
      paymentMethod?: string;
    }) => data
  )
  .handler(async ({ data }): Promise<OrderRecord> => {
    const { getCookie } = await loadCookieHelpers();
    const sessionId = getCookie(SESSION_COOKIE);
    const sessionUser = sessionId ? await getUserBySession(sessionId) : null;
    const userEmail = sessionUser?.email || data.email || "guest@zupona.com";

    const orderId = `ZUP-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;

    const order = await createOrder({
      id: orderId,
      user_email: userEmail,
      items: JSON.stringify(data.items),
      total_amount: data.totalAmount,
      shipping_address: data.shippingAddress,
      phone: data.phone,
      payment_method: data.paymentMethod || "Cash on Delivery",
      status: "Order confirmed",
    });

    return order;
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
