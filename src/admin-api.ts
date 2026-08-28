import { createServerFn } from "@tanstack/react-start";
import { requireAdminUser } from "./auth.ts";
import {
  deleteCatalogProduct,
  getSiteSettings,
  listCatalog,
  saveCatalogProduct,
  saveSiteSetting,
  type CatalogProductInput,
} from "./catalog-db.ts";
import { getAdminDashboardOverview as fetchAdminDashboardOverview, getAllOrders, getOrderById, updateOrderStatus, type AdminDashboardOverview, type OrderRecord } from "./db.ts";
import { z } from "zod";

const ORDER_STATUSES = new Set([
  "Order confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
]);

const imageReferenceValidator = z.string().trim().max(2048).refine(
  (value) => /^(https?:)?\/\//i.test(value) || value.startsWith("/"),
  "Use an HTTP(S) image URL or a root-relative image path.",
);

type SerializableValue = string | number | boolean | null | SerializableValue[] | { [key: string]: SerializableValue };
type SiteSettings = Record<string, SerializableValue>;

const catalogProductValidator = z.object({
  name: z.string().trim().min(1).max(240),
  category: z.string().trim().min(1).max(120),
  price: z.number().finite().min(0),
  oldPrice: z.number().finite().min(0).optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).optional(),
  slug: z.string().max(120).optional(),
  sku: z.string().max(120).optional(),
  productType: z.enum(["physical", "digital", "service"]).optional(),
  image: imageReferenceValidator.optional(),
  galleryImages: z.array(imageReferenceValidator).max(50).optional(),
  galleryImageAlts: z.array(z.string().max(240)).max(50).optional(),
  variantSkus: z.array(z.object({
    id: z.string().max(120).optional(),
    sku: z.string().trim().min(1).max(120),
    title: z.string().max(240).optional(),
    optionValues: z.record(z.string().max(80), z.string().max(240)).optional(),
    price: z.number().finite().min(0).optional(),
    oldPrice: z.number().finite().min(0).optional(),
    stock: z.number().int().min(0).max(1_000_000).optional(),
    lowStockThreshold: z.number().int().min(0).max(1_000_000).optional(),
    image: imageReferenceValidator.optional(),
    isActive: z.boolean().optional(),
  })).max(100).optional(),
}).passthrough();

export const getPublicCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<{ catalog: Awaited<ReturnType<typeof listCatalog>>; settings: SiteSettings }> => {
  const catalog = await listCatalog(false);
  return { catalog, settings: (await getSiteSettings()) as SiteSettings };
});

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(async (): Promise<{ user: Awaited<ReturnType<typeof requireAdminUser>>; catalog: Awaited<ReturnType<typeof listCatalog>>; orders: Awaited<ReturnType<typeof getAllOrders>>; settings: SiteSettings }> => {
  const user = await requireAdminUser();
  const [catalog, orders, settings] = await Promise.all([listCatalog(true), getAllOrders(), getSiteSettings()]);
  return { user, catalog, orders, settings: settings as SiteSettings };
});

export const getAdminDashboardOverview = createServerFn({ method: "GET" }).handler(async (): Promise<AdminDashboardOverview> => {
  await requireAdminUser();
  return fetchAdminDashboardOverview();
});

export const saveAdminProduct = createServerFn({ method: "POST" })
  .validator((data: CatalogProductInput) => catalogProductValidator.parse(data) as CatalogProductInput)
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
    for (const product of data.products) saved.push(await saveCatalogProduct(catalogProductValidator.parse(product) as CatalogProductInput, user.id));
    return { saved };
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => z.object({ id: z.string().trim().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    await requireAdminUser();
    const catalog = await listCatalog(true);
    return catalog.find((item) => item.product.id === data.id) ?? null;
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
