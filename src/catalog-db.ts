import { getD1Database, type UserRole } from "./db";
import type { Product, ProductDetail } from "./components/zupona/data";

export type CatalogStatus = "draft" | "active" | "archived";

export type CatalogItem = {
  product: Product;
  detail: ProductDetail;
  status: CatalogStatus;
};

export type CatalogProductInput = {
  id?: string;
  name: string;
  slug?: string;
  brand?: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  rating?: number;
  reviews?: number;
  bestSelling?: boolean;
  topPick?: boolean;
  status?: CatalogStatus;
  description?: string;
  features?: string[];
  specs?: Array<{ label: string; value: string }>;
  variants?: string[];
  variantLabel?: string;
  galleryImages?: string[];
  image?: string;
};

type ProductRow = Record<string, unknown>;
type ImageRow = { product_id: string; object_key: string; alt_text?: string; sort_order: number };
type Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: () => Promise<{ results?: unknown[] }>;
      first: () => Promise<unknown>;
      run: () => Promise<unknown>;
    };
  };
  batch: (statements: Array<{ run: () => Promise<unknown> }>) => Promise<unknown>;
};

const memoryCatalog = new Map<string, CatalogItem>();
const memorySettings = new Map<string, unknown>();

function asDatabase(value: unknown): Database | null {
  if (!value || typeof value !== "object" || !("prepare" in value)) return null;
  return value as Database;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function parseStringArray(value: unknown): string[] {
  try {
    const parsed = JSON.parse(asString(value, "[]"));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseSpecs(value: unknown): Array<{ label: string; value: string }> {
  try {
    const parsed = JSON.parse(asString(value, "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const label = asString(record.label).trim();
      const specValue = asString(record.value).trim();
      return label && specValue ? [{ label, value: specValue }] : [];
    });
  } catch {
    return [];
  }
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

function mediaUrl(objectKey: string): string {
  if (/^(https?:)?\/\//.test(objectKey) || objectKey.startsWith("/")) return objectKey;
  return `/media/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

function rowToCatalogItem(row: ProductRow, imageRows: ImageRow[]): CatalogItem {
  const id = asString(row.id);
  const imageKeys = imageRows
    .filter((image) => image.product_id === id)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((image) => image.object_key);
  const images = imageKeys.map(mediaUrl);
  const price = asNumber(row.price);
  const oldPrice = asNumber(row.old_price, price);
  const stock = Math.max(0, Math.floor(asNumber(row.stock)));
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return {
    product: {
      id,
      slug: asString(row.slug),
      name: asString(row.name),
      brand: asString(row.brand, "Zupona"),
      category: asString(row.category_slug),
      price,
      oldPrice,
      discount,
      rating: asNumber(row.rating, 4.8),
      reviews: Math.max(0, Math.floor(asNumber(row.reviews))),
      stock,
      bestSelling: asBoolean(row.best_selling),
      topPick: asBoolean(row.top_pick),
      image: images[0] ?? "",
    },
    detail: {
      images,
      description: asString(row.description),
      features: parseStringArray(row.features_json),
      specs: parseSpecs(row.specs_json),
      variants: parseStringArray(row.variants_json),
      variantLabel: asString(row.variant_label, "Select option"),
      stock,
    },
    status: (asString(row.status, "active") as CatalogStatus),
  };
}

function normalizeInput(input: CatalogProductInput): Required<CatalogProductInput> {
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug || name);
  const price = Math.max(0, Number(input.price) || 0);
  const oldPrice = Math.max(price, Number(input.oldPrice) || price);
  const status: CatalogStatus = ["draft", "active", "archived"].includes(input.status ?? "active")
    ? (input.status ?? "active")
    : "active";
  const galleryImages = Array.from(new Set([...(input.galleryImages ?? []), input.image ?? ""].map((value) => value.trim()).filter(Boolean)));

  return {
    id: input.id || crypto.randomUUID(),
    name,
    slug,
    brand: input.brand?.trim() || "Zupona",
    category: input.category.trim(),
    price,
    oldPrice,
    stock: Math.max(0, Math.floor(Number(input.stock) || 0)),
    rating: Math.min(5, Math.max(0, Number(input.rating) || 4.8)),
    reviews: Math.max(0, Math.floor(Number(input.reviews) || 0)),
    bestSelling: Boolean(input.bestSelling),
    topPick: Boolean(input.topPick),
    status,
    description: input.description?.trim() || "",
    features: (input.features ?? []).map((value) => value.trim()).filter(Boolean).slice(0, 24),
    specs: (input.specs ?? []).flatMap((spec) => {
      const label = spec.label.trim();
      const value = spec.value.trim();
      return label && value ? [{ label, value }] : [];
    }).slice(0, 24),
    variants: (input.variants ?? []).map((value) => value.trim()).filter(Boolean).slice(0, 50),
    variantLabel: input.variantLabel?.trim() || "Select option",
    galleryImages,
    image: galleryImages[0] ?? "",
  };
}

async function getRows(db: Database, includeUnpublished: boolean): Promise<{ products: ProductRow[]; images: ImageRow[] }> {
  const productQuery = includeUnpublished
    ? "SELECT * FROM products ORDER BY created_at DESC"
    : "SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC";
  const [productResult, imageResult] = await Promise.all([
    db.prepare(productQuery).bind().all(),
    db.prepare("SELECT product_id, object_key, alt_text, sort_order FROM product_images ORDER BY sort_order ASC").bind().all(),
  ]);
  return {
    products: (productResult.results ?? []).filter((row): row is ProductRow => Boolean(row) && typeof row === "object") as ProductRow[],
    images: (imageResult.results ?? []).filter((row): row is ImageRow => Boolean(row) && typeof row === "object") as ImageRow[],
  };
}

export async function listCatalog(includeUnpublished = false): Promise<CatalogItem[]> {
  const db = asDatabase(getD1Database());
  if (!db) {
    return Array.from(memoryCatalog.values()).filter((item) => includeUnpublished || item.status === "active");
  }
  const { products, images } = await getRows(db, includeUnpublished);
  return products.map((row) => rowToCatalogItem(row, images));
}

export async function getCatalogBySlug(slug: string, includeUnpublished = false): Promise<CatalogItem | null> {
  const normalizedSlug = normalizeSlug(slug);
  const db = asDatabase(getD1Database());
  if (!db) {
    return Array.from(memoryCatalog.values()).find((item) => item.product.slug === normalizedSlug && (includeUnpublished || item.status === "active")) ?? null;
  }
  const condition = includeUnpublished ? "" : " AND status = 'active'";
  const row = await db.prepare(`SELECT * FROM products WHERE slug = ?${condition}`).bind(normalizedSlug).first();
  if (!row || typeof row !== "object") return null;
  const product = row as ProductRow;
  const imageResult = await db
    .prepare("SELECT product_id, object_key, alt_text, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC")
    .bind(asString(product.id))
    .all();
  const images = (imageResult.results ?? []).filter((item): item is ImageRow => Boolean(item) && typeof item === "object") as ImageRow[];
  return rowToCatalogItem(product, images);
}

async function writeAuditLog(
  db: Database,
  actorId: number | string,
  action: string,
  entityType: string,
  entityId: string,
  payload: unknown
): Promise<void> {
  await db
    .prepare("INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, payload_json) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), actorId, action, entityType, entityId, JSON.stringify(payload))
    .run();
}

export async function saveCatalogProduct(input: CatalogProductInput, actorId: number | string): Promise<CatalogItem> {
  const product = normalizeInput(input);
  if (!product.name || !product.slug || !product.category) throw new Error("Product name, slug, and category are required.");
  const db = asDatabase(getD1Database());
  if (!db) {
    const item: CatalogItem = {
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice,
        discount: product.oldPrice > product.price ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0,
        rating: product.rating,
        reviews: product.reviews,
        stock: product.stock,
        bestSelling: product.bestSelling,
        topPick: product.topPick,
        image: product.image,
      },
      detail: {
        images: product.galleryImages,
        description: product.description,
        features: product.features,
        specs: product.specs,
        variants: product.variants,
        variantLabel: product.variantLabel,
        stock: product.stock,
      },
      status: product.status,
    };
    memoryCatalog.set(product.id, item);
    return item;
  }

  await db
    .prepare(
      `INSERT INTO products (
        id, slug, name, brand, category_slug, description, price, old_price, stock, rating, reviews,
        features_json, specs_json, variants_json, variant_label, best_selling, top_pick, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug, name = excluded.name, brand = excluded.brand, category_slug = excluded.category_slug,
        description = excluded.description, price = excluded.price, old_price = excluded.old_price, stock = excluded.stock,
        rating = excluded.rating, reviews = excluded.reviews, features_json = excluded.features_json,
        specs_json = excluded.specs_json, variants_json = excluded.variants_json, variant_label = excluded.variant_label,
        best_selling = excluded.best_selling, top_pick = excluded.top_pick, status = excluded.status,
        updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      product.id, product.slug, product.name, product.brand, product.category, product.description,
      product.price, product.oldPrice, product.stock, product.rating, product.reviews,
      JSON.stringify(product.features), JSON.stringify(product.specs), JSON.stringify(product.variants), product.variantLabel,
      product.bestSelling ? 1 : 0, product.topPick ? 1 : 0, product.status
    )
    .run();

  await db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(product.id).run();
  for (const [index, image] of product.galleryImages.entries()) {
    const objectKey = image.startsWith("/media/") ? decodeURIComponent(image.slice(7)) : image;
    await db
      .prepare("INSERT INTO product_images (id, product_id, object_key, sort_order) VALUES (?, ?, ?, ?)")
      .bind(crypto.randomUUID(), product.id, objectKey, index)
      .run();
  }
  await writeAuditLog(db, actorId, "catalog.product.saved", "product", product.id, { slug: product.slug, status: product.status });
  const saved = await getCatalogBySlug(product.slug, true);
  if (!saved) throw new Error("Product was saved but could not be retrieved.");
  return saved;
}

export async function deleteCatalogProduct(id: string, actorId: number | string): Promise<void> {
  const db = asDatabase(getD1Database());
  if (!db) {
    memoryCatalog.delete(id);
    return;
  }
  await db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(id).run();
  await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  await writeAuditLog(db, actorId, "catalog.product.deleted", "product", id, {});
}

export async function saveSiteSetting(
  key: string,
  value: unknown,
  actorId: number | string,
  role: UserRole
): Promise<void> {
  if (role !== "owner" && role !== "manager") throw new Error("You do not have permission to change site settings.");
  const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 80);
  if (!cleanKey) throw new Error("A valid setting name is required.");
  const db = asDatabase(getD1Database());
  if (!db) {
    memorySettings.set(cleanKey, value);
    return;
  }
  await db
    .prepare(
      `INSERT INTO site_settings (setting_key, value_json, updated_by) VALUES (?, ?, ?)
       ON CONFLICT(setting_key) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`
    )
    .bind(cleanKey, JSON.stringify(value), actorId)
    .run();
  await writeAuditLog(db, actorId, "site.setting.saved", "setting", cleanKey, value);
}

export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const db = asDatabase(getD1Database());
  if (!db) return Object.fromEntries(memorySettings.entries());
  const result = await db.prepare("SELECT setting_key, value_json FROM site_settings").bind().all();
  return Object.fromEntries((result.results ?? []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    try {
      return [[asString(row.setting_key), JSON.parse(asString(row.value_json))]];
    } catch {
      return [];
    }
  }));
}
