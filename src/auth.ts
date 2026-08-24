import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import {
  registerUser,
  getUserByEmail,
  updateUserProfile,
  hashPassword,
  createOrder,
  getUserOrders as fetchUserOrders,
  getOrderById,
  type OrderRecord,
} from "./db";

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
  name?: string;
  phone?: string;
  address?: string;
  created_at?: string;
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

    const hashedPassword = await hashPassword(data.password);
    const existing = await getUserByEmail(email);

    // Explicit Sign In
    if (data.mode === "signin") {
      if (!existing) {
        throw new Error("No account found with this email. Please sign up first.");
      }
      // Check hashed password or legacy plain text
      if (existing.password !== hashedPassword && existing.password !== data.password) {
        throw new Error("Incorrect password. Please try again.");
      }
      setCookie(SESSION_COOKIE, email, COOKIE_OPTIONS);
      return {
        status: "signed_in" as const,
        user: {
          id: existing.id,
          email: existing.email,
          name: existing.name || "",
          phone: existing.phone || "",
          address: existing.address || "",
          created_at: existing.created_at,
        },
      };
    }

    // Explicit Sign Up
    if (data.mode === "signup") {
      if (existing) {
        throw new Error("An account with this email already exists. Please sign in.");
      }
      const newUser = await registerUser(
        email,
        hashedPassword,
        data.name || "",
        data.phone || "",
        data.address || ""
      );
      setCookie(SESSION_COOKIE, email, COOKIE_OPTIONS);
      return {
        status: "signed_up" as const,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name || "",
          phone: newUser.phone || "",
          address: newUser.address || "",
          created_at: newUser.created_at,
        },
      };
    }

    // Auto mode (detect existing or register new)
    if (existing) {
      if (existing.password !== hashedPassword && existing.password !== data.password) {
        throw new Error("Incorrect password. Please try again.");
      }
      setCookie(SESSION_COOKIE, email, COOKIE_OPTIONS);
      return {
        status: "signed_in" as const,
        user: {
          id: existing.id,
          email: existing.email,
          name: existing.name || "",
          phone: existing.phone || "",
          address: existing.address || "",
          created_at: existing.created_at,
        },
      };
    }

    const newUser = await registerUser(
      email,
      hashedPassword,
      data.name || "",
      data.phone || "",
      data.address || ""
    );
    setCookie(SESSION_COOKIE, email, COOKIE_OPTIONS);
    return {
      status: "signed_up" as const,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name || "",
        phone: newUser.phone || "",
        address: newUser.address || "",
        created_at: newUser.created_at,
      },
    };
  });

/**
 * Retrieve currently authenticated user from session cookie
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SafeUser | null> => {
    const sessionEmail = getCookie(SESSION_COOKIE);
    if (!sessionEmail) return null;

    const user = await getUserByEmail(sessionEmail);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      created_at: user.created_at,
    };
  }
);

/**
 * Log out user by clearing session cookie
 */
export const logout = createServerFn({ method: "POST" }).handler(async () => {
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
    const sessionEmail = getCookie(SESSION_COOKIE);
    if (!sessionEmail) {
      throw new Error("You must be signed in to update your profile.");
    }

    const updated = await updateUserProfile(sessionEmail, data);
    if (!updated) {
      throw new Error("Failed to update profile.");
    }

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name || "",
      phone: updated.phone || "",
      address: updated.address || "",
      created_at: updated.created_at,
    };
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
    const sessionEmail = getCookie(SESSION_COOKIE);
    const userEmail = data.email || sessionEmail || "guest@zupona.com";

    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const orderId = `ZUP-${randomDigits}`;

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
    const sessionEmail = getCookie(SESSION_COOKIE);
    if (!sessionEmail) return [];
    return await fetchUserOrders(sessionEmail);
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
