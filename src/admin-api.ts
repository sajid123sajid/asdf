import { createServerFn } from "@tanstack/react-start";
import { requireAdminUser } from "./auth";
import {
  deleteCatalogProduct,
  getSiteSettings,
  listCatalog,
  saveCatalogProduct,
  saveSiteSetting,
  type CatalogProductInput,
} from "./catalog-db";
import { getAllOrders, getOrderById, updateOrderStatus, type OrderRecord } from "./db";
import { getProductMediaBucket } from "./media";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const ORDER_STATUSES = new Set([
  "Order confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
]);

function fromDataUrl(dataUrl: string): { contentType: string; bytes: ArrayBuffer } {
  const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl);
  if (!match?.[1] || !match[2]) throw new Error("Invalid image file.");
  const contentType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error("Use a JPG, PNG, WebP, GIF, or AVIF image.");
  const binary = atob(match[2]);
  if (binary.length === 0 || binary.length > MAX_IMAGE_BYTES) throw new Error("Images must be smaller than 8 MB.");
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return { contentType, bytes: bytes.buffer };
}

function safeFileName(name: string, contentType: string): string {
  const extension = contentType.split("/")[1] ?? "image";
  const base = name.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
  return base.includes(".") ? base : `${base || "product"}.${extension}`;
}

type SerializableValue = string | number | boolean | null | SerializableValue[] | { [key: string]: SerializableValue };
type SiteSettings = Record<string, SerializableValue>;

export const getPublicCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<{ catalog: Awaited<ReturnType<typeof listCatalog>>; settings: SiteSettings }> => {
  const catalog = await listCatalog(false);
  return { catalog, settings: (await getSiteSettings()) as SiteSettings };
});

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(async (): Promise<{ user: Awaited<ReturnType<typeof requireAdminUser>>; catalog: Awaited<ReturnType<typeof listCatalog>>; orders: Awaited<ReturnType<typeof getAllOrders>>; settings: SiteSettings }> => {
  const user = await requireAdminUser();
  const [catalog, orders, settings] = await Promise.all([listCatalog(true), getAllOrders(), getSiteSettings()]);
  return { user, catalog, orders, settings: settings as SiteSettings };
});

export const saveAdminProduct = createServerFn({ method: "POST" })
  .validator((data: CatalogProductInput) => data)
  .handler(async ({ data }) => {
    const user = await requireAdminUser();
    const item = await saveCatalogProduct(data, user.id);
    return item;
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireAdminUser();
    if (!data.id || data.id.length > 100) throw new Error("Invalid product.");
    await deleteCatalogProduct(data.id, user.id);
    return { success: true };
  });

export const importAdminCatalog = createServerFn({ method: "POST" })
  .validator((data: { products: CatalogProductInput[] }) => data)
  .handler(async ({ data }) => {
    const user = await requireAdminUser();
    if (!Array.isArray(data.products) || data.products.length === 0 || data.products.length > 250) {
      throw new Error("Import between 1 and 250 products at a time.");
    }
    const saved = [];
    for (const product of data.products) saved.push(await saveCatalogProduct(product, user.id));
    return { saved };
  });

export const updateAdminOrderStatus = createServerFn({ method: "POST" })
  .validator((data: { orderId: string; status: string }) => data)
  .handler(async ({ data }): Promise<OrderRecord | null> => {
    await requireAdminUser();
    if (!ORDER_STATUSES.has(data.status)) throw new Error("Invalid order status.");
    const existing = await getOrderById(data.orderId);
    if (existing?.payment_method === "SSLCOMMERZ" && existing.status === "PENDING_PAYMENT") {
      throw new Error("This order cannot enter fulfillment before payment is verified.");
    }
    return await updateOrderStatus(data.orderId, data.status);
  });

export const saveAdminSetting = createServerFn({ method: "POST" })
  .validator((data: { key: string; value: unknown }) => data)
  .handler(async ({ data }) => {
    const user = await requireAdminUser();
    await saveSiteSetting(data.key, data.value, user.id, user.role);
    return { success: true };
  });

export const uploadProductMedia = createServerFn({ method: "POST" })
  .validator((data: { fileName: string; dataUrl: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireAdminUser();
    const bucket = getProductMediaBucket();
    if (!bucket) throw new Error("R2 product media storage is not configured yet.");
    const upload = fromDataUrl(data.dataUrl);
    const key = `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFileName(data.fileName, upload.contentType)}`;
    await bucket.put(key, upload.bytes, {
      httpMetadata: { contentType: upload.contentType },
      customMetadata: { uploadedBy: String(user.id), uploadedAt: new Date().toISOString() },
    });
    return { key, url: `/media/${key.split("/").map(encodeURIComponent).join("/")}` };
  });
