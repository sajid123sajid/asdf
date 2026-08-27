import { getD1Database, type UserRole } from "./db.ts";
import type { Product, ProductDetail, ProductVariant } from "./components/zupona/data.ts";

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
  sku?: string;
  productType?: "physical" | "digital" | "service";
  category: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
  rating?: number;
  reviews?: number;
  bestSelling?: boolean;
  topPick?: boolean;
  status?: CatalogStatus;
  reviewStatus?: "incomplete" | "ready" | "approved" | "rejected";
  description?: string;
  shortDescription?: string;
  bulletPoints?: string[];
  features?: string[];
  specs?: Array<{ label: string; value: string }>;
  variants?: string[];
  variantLabel?: string;
  variantSkus?: Array<{
    id?: string;
    sku: string;
    title?: string;
    optionValues?: Record<string, string>;
    price?: number;
    oldPrice?: number;
    stock?: number;
    lowStockThreshold?: number;
    image?: string;
    isActive?: boolean;
  }>;
  tags?: string[];
  attributes?: Array<{ key: string; value: string }>;
  seoTitle?: string;
  seoDescription?: string;
  searchKeywords?: string;
  returnPolicy?: string;
  shippingNotes?: string;
  scheduledFor?: string;
  galleryImages?: string[];
  galleryImageAlts?: string[];
  image?: string;
  publishStatus?: "draft" | "review" | "published" | "scheduled" | "archived";
};

type ProductRow = Record<string, unknown>;
type ImageRow = { product_id: string; object_key: string; alt_text?: string; sort_order: number };
type VariantRow = Record<string, unknown>;
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
      const label = asString(record["label"]).trim();
      const specValue = asString(record["value"]).trim();
      return label && specValue ? [{ label, value: specValue }] : [];
    });
  } catch {
    return [];
  }
}

function parseAttributeList(value: unknown): Array<{ key: string; value: string }> {
  try {
    const parsed = JSON.parse(asString(value, "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const key = asString(record["key"]).trim();
      const attributeValue = asString(record["value"]).trim();
      return key && attributeValue ? [{ key, value: attributeValue }] : [];
    });
  } catch {
    return [];
  }
}

function parseVariantRows(rows: VariantRow[]): ProductVariant[] {
  return rows.flatMap((row) => {
    const sku = asString(row["sku"]).trim();
    if (!sku) return [];
    let optionValues: Record<string, string> = {};
    try {
      const parsed = JSON.parse(asString(row["option_values_json"], "{}"));
      if (parsed && typeof parsed === "object") {
        optionValues = Object.fromEntries(
          Object.entries(parsed).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []),
        );
      }
    } catch {
      optionValues = {};
    }
    return [{
      id: asString(row["id"]),
      sku,
      title: asString(row["title"]),
      optionValues,
      ...(row["price"] !== null && row["price"] !== undefined ? { price: asNumber(row["price"]) } : {}),
      ...(row["old_price"] !== null && row["old_price"] !== undefined ? { oldPrice: asNumber(row["old_price"]) } : {}),
      stock: Math.max(0, Math.floor(asNumber(row["stock"]))),
      lowStockThreshold: Math.max(0, Math.floor(asNumber(row["low_stock_threshold"], 5))),
      ...(asString(row["image_key"]) ? { image: mediaUrl(asString(row["image_key"])) } : {}),
      isActive: asBoolean(row["is_active"]),
    }];
  });
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

function rowToCatalogItem(row: ProductRow, imageRows: ImageRow[], variantRows: VariantRow[] = []): CatalogItem {
  const id = asString(row["id"]);
  const imageKeys = imageRows
    .filter((image) => image.product_id === id)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((image) => image.object_key);
  const images = imageKeys.map(mediaUrl);
  const price = asNumber(row["price"]);
  const oldPrice = asNumber(row["old_price"], price);
  const stock = Math.max(0, Math.floor(asNumber(row["stock"])));
  const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return {
    product: {
      id,
      slug: asString(row["slug"]),
      name: asString(row["name"]),
      brand: asString(row["brand"], "Zupona"),
      category: asString(row["category_slug"]),
      price,
      oldPrice,
      discount,
      rating: asNumber(row["rating"], 4.8),
      reviews: Math.max(0, Math.floor(asNumber(row["reviews"]))),
      stock,
      bestSelling: asBoolean(row["best_selling"]),
      topPick: asBoolean(row["top_pick"]),
      image: images[0] ?? "",
    },
    detail: {
      images,
      imageAlts: imageRows.filter((image) => image.product_id === id).sort((left, right) => left.sort_order - right.sort_order).map((image) => image.alt_text ?? ""),
      sku: asString(row["sku"]),
      productType: (asString(row["product_type"], "physical") as "physical" | "digital" | "service"),
      bulletPoints: parseStringArray(row["bullet_points_json"]),
      searchKeywords: asString(row["search_keywords"]),
      scheduledFor: asString(row["scheduled_for"]),
      reviewStatus: (asString(row["review_status"], "approved") as "incomplete" | "ready" | "approved" | "rejected"),
      returnPolicy: asString(row["return_policy"]),
      shippingNotes: asString(row["shipping_notes"]),
      description: asString(row["description"]),
      shortDescription: asString(row["short_description"]),
      features: parseStringArray(row["features_json"]),
      specs: parseSpecs(row["specs_json"]),
      variants: parseStringArray(row["variants_json"]),
      variantSkus: parseVariantRows(variantRows),
      variantLabel: asString(row["variant_label"], "Select option"),
      stock,
      tags: parseStringArray(row["tags_json"]),
      attributes: parseAttributeList(row["attributes_json"]),
      seoTitle: asString(row["seo_title"]),
      seoDescription: asString(row["seo_description"]),
      publishStatus: (asString(row["publish_status"], "draft") as "draft" | "review" | "published" | "scheduled" | "archived"),
      catalogStatus: (asString(row["status"], "active") as "draft" | "active" | "archived"),
    },
    status: (asString(row["status"], "active") as CatalogStatus),
  };
}

function normalizeInput(input: CatalogProductInput): Required<CatalogProductInput> {
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug || name);
  const price = Math.max(0, Number(input.price) || 0);
  const oldPrice = Math.max(price, Number(input.oldPrice) || price);
  const requestedStatus = input.status ?? (input.publishStatus === "archived" ? "archived" : input.publishStatus === "draft" ? "draft" : "active");
  const status: CatalogStatus = ["draft", "active", "archived"].includes(requestedStatus)
    ? requestedStatus as CatalogStatus
    : "active";
  const reviewStatus = ["incomplete", "ready", "approved", "rejected"].includes(input.reviewStatus ?? "approved")
    ? (input.reviewStatus ?? "approved")
    : "incomplete";
  const publishStatus = ["draft", "review", "published", "scheduled", "archived"].includes(input.publishStatus ?? "draft")
    ? (input.publishStatus ?? "draft")
    : "draft";
  const galleryImages = Array.from(new Set([...(input.galleryImages ?? []), input.image ?? ""].map((value) => value.trim()).filter(Boolean)));
  const galleryImageAlts = galleryImages.map((_, index) => (input.galleryImageAlts?.[index] ?? "").trim().slice(0, 240));

  return {
    id: input.id || crypto.randomUUID(),
    name,
    slug,
    brand: input.brand?.trim() || "Zupona",
    sku: input.sku?.trim() || "",
    productType: input.productType ?? "physical",
    category: input.category.trim(),
    price,
    oldPrice,
    stock: Math.max(0, Math.floor(Number(input.stock) || 0)),
    lowStockThreshold: Math.max(0, Math.floor(Number(input.lowStockThreshold) || 5)),
    rating: Math.min(5, Math.max(0, Number(input.rating) || 4.8)),
    reviews: Math.max(0, Math.floor(Number(input.reviews) || 0)),
    bestSelling: Boolean(input.bestSelling),
    topPick: Boolean(input.topPick),
    status,
    reviewStatus,
    description: input.description?.trim() || "",
    shortDescription: input.shortDescription?.trim() || "",
    bulletPoints: (input.bulletPoints ?? []).map((value) => value.trim()).filter(Boolean).slice(0, 10),
    features: (input.features ?? []).map((value) => value.trim()).filter(Boolean).slice(0, 24),
    specs: (input.specs ?? []).flatMap((spec) => {
      const label = spec.label.trim();
      const value = spec.value.trim();
      return label && value ? [{ label, value }] : [];
    }).slice(0, 24),
    variants: (input.variants ?? []).map((value) => value.trim()).filter(Boolean).slice(0, 50),
    variantLabel: input.variantLabel?.trim() || "Select option",
    variantSkus: input.variantSkus ?? [],
    tags: (input.tags ?? []).map((value) => value.trim()).filter(Boolean).slice(0, 24),
    attributes: (input.attributes ?? []).flatMap((attribute) => {
      const key = attribute.key.trim();
      const value = attribute.value.trim();
      return key && value ? [{ key, value }] : [];
    }).slice(0, 24),
    seoTitle: input.seoTitle?.trim() || "",
    seoDescription: input.seoDescription?.trim() || "",
    searchKeywords: input.searchKeywords?.trim() || "",
    returnPolicy: input.returnPolicy?.trim() || "",
    shippingNotes: input.shippingNotes?.trim() || "",
    scheduledFor: input.scheduledFor?.trim() || "",
    galleryImages,
    galleryImageAlts,
    image: galleryImages[0] ?? "",
    publishStatus,
  };
}

async function getRows(db: Database, includeUnpublished: boolean): Promise<{ products: ProductRow[]; images: ImageRow[]; variants: VariantRow[] }> {
  const productQuery = includeUnpublished
    ? "SELECT * FROM products ORDER BY created_at DESC"
    : "SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC";
  const [productResult, imageResult, variantResult] = await Promise.all([
    db.prepare(productQuery).bind().all(),
    db.prepare("SELECT product_id, object_key, alt_text, sort_order FROM product_images ORDER BY sort_order ASC").bind().all(),
    db.prepare("SELECT * FROM product_variants ORDER BY created_at ASC").bind().all(),
  ]);
  return {
    products: (productResult.results ?? []).filter((row): row is ProductRow => Boolean(row) && typeof row === "object") as ProductRow[],
    images: (imageResult.results ?? []).filter((row): row is ImageRow => Boolean(row) && typeof row === "object") as ImageRow[],
    variants: (variantResult.results ?? []).filter((row): row is VariantRow => Boolean(row) && typeof row === "object") as VariantRow[],
  };
}

export async function listCatalog(includeUnpublished = false): Promise<CatalogItem[]> {
  const db = asDatabase(getD1Database());
  if (!db) {
    return Array.from(memoryCatalog.values()).filter((item) => includeUnpublished || item.status === "active");
  }
  const { products, images, variants } = await getRows(db, includeUnpublished);
  return products.map((row) => rowToCatalogItem(row, images, variants.filter((variant) => asString(variant["product_id"]) === asString(row["id"]))));
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
    .bind(asString(product["id"]))
    .all();
  const images = (imageResult.results ?? []).filter((item): item is ImageRow => Boolean(item) && typeof item === "object") as ImageRow[];
  const variantResult = await db.prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at ASC").bind(asString(product["id"])).all();
  const variants = (variantResult.results ?? []).filter((item): item is VariantRow => Boolean(item) && typeof item === "object") as VariantRow[];
  return rowToCatalogItem(product, images, variants);
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
        imageAlts: product.galleryImageAlts,
        description: product.description,
        shortDescription: product.shortDescription,
        features: product.features,
        specs: product.specs,
        variants: product.variants,
        variantLabel: product.variantLabel,
        stock: product.stock,
        tags: product.tags,
        attributes: product.attributes,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        publishStatus: product.publishStatus,
        variantSkus: product.variantSkus.map((variant) => ({
          id: variant.id ?? crypto.randomUUID(),
          sku: variant.sku,
          title: variant.title ?? "",
          optionValues: variant.optionValues ?? {},
          ...(variant.price !== undefined ? { price: variant.price } : {}),
          ...(variant.oldPrice !== undefined ? { oldPrice: variant.oldPrice } : {}),
          stock: Math.max(0, Math.floor(Number(variant.stock) || 0)),
          lowStockThreshold: Math.max(0, Math.floor(Number(variant.lowStockThreshold) || 5)),
          ...(variant.image ? { image: variant.image } : {}),
          isActive: variant.isActive !== false,
        })),
      },
      status: product.status,
    };
    memoryCatalog.set(product.id, item);
    return item;
  }

  await db
    .prepare(
      `INSERT INTO products (
        id, slug, name, brand, category_slug, description, short_description, price, old_price, stock, rating, reviews,
        features_json, specs_json, variants_json, variant_label, best_selling, top_pick, status,
        sku, product_type, bullet_points_json, search_keywords, published_at, scheduled_for, review_status, return_policy, shipping_notes,
        tags_json, attributes_json, seo_title, seo_description, publish_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug, name = excluded.name, brand = excluded.brand, category_slug = excluded.category_slug,
        description = excluded.description, short_description = excluded.short_description, price = excluded.price,
        old_price = excluded.old_price, stock = excluded.stock, rating = excluded.rating, reviews = excluded.reviews,
        features_json = excluded.features_json, specs_json = excluded.specs_json, variants_json = excluded.variants_json,
        variant_label = excluded.variant_label, best_selling = excluded.best_selling, top_pick = excluded.top_pick,
        status = excluded.status, tags_json = excluded.tags_json, attributes_json = excluded.attributes_json,
        sku = excluded.sku, product_type = excluded.product_type, bullet_points_json = excluded.bullet_points_json,
        search_keywords = excluded.search_keywords,
        published_at = CASE WHEN excluded.publish_status = 'published' THEN COALESCE(products.published_at, excluded.published_at) ELSE products.published_at END,
        scheduled_for = excluded.scheduled_for,
        review_status = excluded.review_status, return_policy = excluded.return_policy, shipping_notes = excluded.shipping_notes,
        seo_title = excluded.seo_title, seo_description = excluded.seo_description, publish_status = excluded.publish_status,
        updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      product.id, product.slug, product.name, product.brand, product.category, product.description, product.shortDescription,
      product.price, product.oldPrice, product.stock, product.rating, product.reviews,
      JSON.stringify(product.features), JSON.stringify(product.specs), JSON.stringify(product.variants), product.variantLabel,
      product.bestSelling ? 1 : 0, product.topPick ? 1 : 0, product.status,
      product.sku, product.productType, JSON.stringify(product.bulletPoints), product.searchKeywords,
      product.publishStatus === "published" ? new Date().toISOString() : null, product.scheduledFor || null,
      product.reviewStatus, product.returnPolicy, product.shippingNotes,
      JSON.stringify(product.tags), JSON.stringify(product.attributes), product.seoTitle, product.seoDescription, product.publishStatus
    )
    .run();

  await db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(product.id).run();
  for (const [index, image] of product.galleryImages.entries()) {
    const objectKey = image.startsWith("/media/") ? decodeURIComponent(image.slice(7)) : image;
    await db
      .prepare("INSERT INTO product_images (id, product_id, object_key, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), product.id, objectKey, product.galleryImageAlts[index] ?? "", index)
      .run();
  }
  await db.prepare("DELETE FROM product_variants WHERE product_id = ?").bind(product.id).run();
  for (const variant of product.variantSkus) {
    const sku = variant.sku.trim();
    if (!sku) continue;
    await db.prepare(
      `INSERT INTO product_variants (id, product_id, sku, title, option_values_json, price, old_price, stock, low_stock_threshold, image_key, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      variant.id || crypto.randomUUID(), product.id, sku, variant.title?.trim() || "", JSON.stringify(variant.optionValues ?? {}),
      variant.price ?? null, variant.oldPrice ?? null, Math.max(0, Math.floor(Number(variant.stock) || 0)),
      Math.max(0, Math.floor(Number(variant.lowStockThreshold) || 5)),
      variant.image?.startsWith("/media/") ? decodeURIComponent(variant.image.slice(7)) : variant.image ?? null,
      variant.isActive === false ? 0 : 1,
    ).run();
  }
  await writeAuditLog(db, actorId, "catalog.product.saved", "product", product.id, { slug: product.slug, status: product.status });
  const saved = await getCatalogBySlug(product.slug, true);
  if (!saved) throw new Error("Product was saved but could not be retrieved.");
  return saved;
}

export async function deleteCatalogProduct(id: string, actorId: number | string): Promise<void> {
  const db = asDatabase(getD1Database());
  if (!db) {
    const existing = memoryCatalog.get(id);
    if (existing) {
      memoryCatalog.set(id, {
        ...existing,
        status: "archived",
        detail: { ...existing.detail, catalogStatus: "archived", publishStatus: "archived" },
      });
    }
    return;
  }
  await db.prepare("UPDATE products SET status = 'archived', publish_status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
  await writeAuditLog(db, actorId, "catalog.product.archived", "product", id, {});
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
      return [[asString(row["setting_key"]), JSON.parse(asString(row["value_json"]))]];
    } catch {
      return [];
    }
  }));
}
