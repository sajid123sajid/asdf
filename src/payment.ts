import { getD1Database, getOrderById, type OrderRecord } from "./db";

type RuntimeEnv = {
  SSLCOMMERZ_STORE_ID?: string;
  SSLCOMMERZ_STORE_PASSWORD?: string;
  SSLCOMMERZ_IS_SANDBOX?: string;
  PUBLIC_SITE_URL?: string;
};

type GatewayResponse = {
  status?: string;
  GatewayPageURL?: string;
  failedreason?: string;
};

type ValidationResponse = {
  status?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string | number;
  currency?: string;
  bank_tran_id?: string;
  card_type?: string;
};

function runtimeEnv(): RuntimeEnv {
  const value = (globalThis as { __CLOUDFLARE_ENV__?: unknown }).__CLOUDFLARE_ENV__;
  return value && typeof value === "object" ? value as RuntimeEnv : {};
}

function credentials(): { storeId: string; storePassword: string } {
  const env = runtimeEnv();
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    throw new Error("Online payment is not configured.");
  }
  return { storeId: env.SSLCOMMERZ_STORE_ID, storePassword: env.SSLCOMMERZ_STORE_PASSWORD };
}

function apiBase(): string {
  return runtimeEnv().SSLCOMMERZ_IS_SANDBOX === "true"
    ? "https://sandbox.sslcommerz.com"
    : "https://securepay.sslcommerz.com";
}

function siteUrl(): string {
  return runtimeEnv().PUBLIC_SITE_URL || "http://localhost:5173";
}

function amountMatches(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.005;
}

export async function createSslcommerzPayment(order: OrderRecord, shippingPostcode: string): Promise<{ paymentUrl: string }> {
  if (order.total_amount < 10 || order.total_amount > 500000) {
    throw new Error("SSLCOMMERZ supports payments from Tk 10 to Tk 500,000.");
  }
  const { storeId, storePassword } = credentials();
  const tranId = `ZUPPAY-${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const body = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: order.total_amount.toFixed(2),
    currency: "BDT",
    tran_id: tranId,
    product_category: "general",
    product_name: "Zupona order",
    product_profile: "physical-goods",
    cus_name: "Zupona customer",
    cus_email: order.user_email,
    cus_add1: order.shipping_address.slice(0, 150),
    cus_phone: order.phone,
    ship_postcode: shippingPostcode,
    shipping_method: "YES",
    num_of_item: "1",
    ship_name: "Zupona customer",
    ship_add1: order.shipping_address.slice(0, 150),
    ship_city: "Dhaka",
    ship_country: "Bangladesh",
    success_url: `${siteUrl()}/payments/sslcommerz/success`,
    fail_url: `${siteUrl()}/payments/sslcommerz/fail`,
    cancel_url: `${siteUrl()}/payments/sslcommerz/cancel`,
    ipn_url: `${siteUrl()}/payments/sslcommerz/ipn`,
  });
  const response = await fetch(`${apiBase()}/gwprocess/v4/api.php`, { method: "POST", body });
  if (!response.ok) throw new Error("SSLCOMMERZ payment request failed.");
  const gateway = await response.json() as GatewayResponse;
  if (gateway.status !== "SUCCESS" || !gateway.GatewayPageURL) {
    throw new Error(gateway.failedreason || "SSLCOMMERZ did not create a payment session.");
  }

  const db = getD1Database();
  if (!db) throw new Error("Payment storage is unavailable.");
  await db.prepare(
    `INSERT INTO payments (order_id, tran_id, amount, currency, status) VALUES (?, ?, ?, ?, 'INITIATED')`
  ).bind(order.id, tranId, order.total_amount, "BDT").run();
  return { paymentUrl: gateway.GatewayPageURL };
}

async function validateTransaction(data: Record<string, string>): Promise<ValidationResponse> {
  const { storeId, storePassword } = credentials();
  const validationUrl = new URL(`${apiBase()}/validator/api/validationserverAPI.php`);
  validationUrl.search = new URLSearchParams({
    val_id: data["val_id"] || "",
    store_id: storeId,
    store_passwd: storePassword,
    format: "json",
  }).toString();
  const response = await fetch(validationUrl);
  if (!response.ok) throw new Error("SSLCOMMERZ validation request failed.");
  return await response.json() as ValidationResponse;
}

export async function processSslcommerzCallback(request: Request, redirectToSite = true): Promise<Response> {
  const source = request.method === "GET"
    ? new URL(request.url).searchParams
    : await request.formData();
  const data = Object.fromEntries(Array.from(source.entries()).map(([key, value]) => [key, String(value)]));
  const tranId = (data["tran_id"] || "").trim();
  const status = (data["status"] || "").toUpperCase();
  if (!tranId) return new Response("Missing transaction ID", { status: 400 });
  const db = getD1Database();
  if (!db) return new Response("Payment storage is unavailable", { status: 503 });
  const payment = await db.prepare("SELECT * FROM payments WHERE tran_id = ?").bind(tranId).first() as Record<string, unknown> | null;
  if (!payment) return new Response("Unknown transaction", { status: 404 });
  const orderId = String(payment["order_id"] || "");
  const order = await getOrderById(orderId);
  if (!order) return new Response("Unknown order", { status: 404 });

  if (status !== "VALID") {
    await db.prepare("UPDATE payments SET status = ?, gateway_status = ?, updated_at = CURRENT_TIMESTAMP WHERE tran_id = ? AND status <> 'VALID'")
      .bind(status || "FAILED", status || "FAILED", tranId).run();
    if (!redirectToSite && ["FAILED", "CANCELLED", "EXPIRED", "UNATTEMPTED"].includes(status)) {
      await db.prepare("UPDATE orders SET status = 'Payment failed' WHERE id = ? AND status = 'PENDING_PAYMENT'")
        .bind(order.id)
        .run();
    }
    return redirectToSite
      ? Response.redirect(`${siteUrl()}/track-order?id=${encodeURIComponent(order.id)}`, 303)
      : new Response("OK");
  }

  if (!data["val_id"]) return new Response("Missing validation ID", { status: 400 });
  const validation = await validateTransaction(data);
  const validatedAmount = Number(validation.amount);
  if (!(["VALID", "VALIDATED"] as string[]).includes(validation.status || "") || validation.tran_id !== tranId || validation.currency !== "BDT" || !amountMatches(validatedAmount, order.total_amount)) {
    return new Response("Payment validation mismatch", { status: 400 });
  }

  await db.prepare(
    `UPDATE payments SET status = 'VALID', gateway_status = ?, val_id = ?, bank_tran_id = ?, card_type = ?, raw_response = ?, updated_at = CURRENT_TIMESTAMP
     WHERE tran_id = ? AND status <> 'VALID'`
  ).bind(validation.status, validation.val_id || null, validation.bank_tran_id || null, validation.card_type || null, JSON.stringify(validation), tranId).run();
  await db.prepare("UPDATE orders SET status = 'Order confirmed' WHERE id = ? AND status IN ('PENDING_PAYMENT', 'Payment failed')").bind(order.id).run();
  return redirectToSite
    ? Response.redirect(`${siteUrl()}/track-order?id=${encodeURIComponent(order.id)}`, 303)
    : new Response("OK");
}