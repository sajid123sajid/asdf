import assert from "node:assert/strict";
import test from "node:test";

import { requireAdminUser } from "../src/auth.ts";
import { saveCatalogProduct } from "../src/catalog-db.ts";
import {
  buildProductMediaUrl,
  createProductMediaObjectKey,
  validateProductImageUpload,
  validateProductVideoUpload,
} from "../src/media.ts";

test("requireAdminUser blocks non-admin access", async () => {
  await assert.rejects(() => requireAdminUser(), /administrator|admin|access/i);
});

test("product media keys are safe and URL conversion preserves manual paths", () => {
  const objectKey = createProductMediaObjectKey("My Product.png");

  assert.match(objectKey, /^products\//);
  assert.doesNotMatch(objectKey, /\\/);
  assert.match(objectKey, /\.png$/i);
  assert.equal(buildProductMediaUrl("https://example.com/image.jpg"), "https://example.com/image.jpg");
  assert.equal(buildProductMediaUrl("/images/local.png"), "/images/local.png");
  assert.ok(buildProductMediaUrl(objectKey).startsWith("/media/"));
});

test("uploaded product images must be image data and within a sane size limit", async () => {
  const valid = await validateProductImageUpload(new File(["hello"], "photo.png", { type: "image/png" }), 5 * 1024 * 1024);
  assert.equal(valid.ok, true);

  const oversized = await validateProductImageUpload(new File([new Uint8Array(8 * 1024 * 1024)], "big.png", { type: "image/png" }), 5 * 1024 * 1024);
  assert.equal(oversized.ok, false);
  assert.match(oversized.error ?? "", /size/i);

  const wrongType = await validateProductImageUpload(new File(["hello"], "notes.txt", { type: "text/plain" }), 5 * 1024 * 1024);
  assert.equal(wrongType.ok, false);
  assert.match(wrongType.error ?? "", /image/i);
});

test("uploaded product videos accept MP4/WebM and reject other media", async () => {
  const valid = await validateProductVideoUpload(new File(["video"], "demo.mp4", { type: "video/mp4" }), 50 * 1024 * 1024);
  assert.equal(valid.ok, true);

  const wrongType = await validateProductVideoUpload(new File(["image"], "demo.jpg", { type: "image/jpeg" }), 50 * 1024 * 1024);
  assert.equal(wrongType.ok, false);
  assert.match(wrongType.error ?? "", /MP4|WebM/i);
});

test("saveCatalogProduct preserves editorial metadata and attributes", async () => {
  const saved = await saveCatalogProduct(
    {
      id: "editorial-test-id",
      name: "Editorial Product",
      slug: "editorial-product",
      category: "mens-fashion",
      price: 1000,
      oldPrice: 1500,
      stock: 12,
      description: "A premium product",
      shortDescription: "Premium daily wear",
      seoTitle: "Editorial Product | Zupona",
      seoDescription: "Premium daily wear for everyday style.",
      publishStatus: "published",
      tags: ["fashion", "premium"],
      attributes: [
        { key: "fabric", value: "cotton" },
        { key: "fit", value: "regular" },
      ],
      galleryImages: ["/media/test-1.png", "/media/test-2.png"],
    },
    "admin-1"
  );

  assert.equal(saved.product.name, "Editorial Product");
  assert.equal(saved.detail.shortDescription, "Premium daily wear");
  assert.equal(saved.detail.seoTitle, "Editorial Product | Zupona");
  assert.equal(saved.detail.publishStatus, "published");
  assert.deepEqual(saved.detail.attributes, [
    { key: "fabric", value: "cotton" },
    { key: "fit", value: "regular" },
  ]);
  assert.deepEqual(saved.detail.tags, ["fashion", "premium"]);
});

test("products insert keeps the column count aligned to its bound values", async () => {
  const calls: Array<{ sql: string; args: unknown[] }> = [];
  const stubDb = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({
        async run() {
          calls.push({ sql, args });
          return { success: true };
        },
        async all() {
          return {
            results: [
              {
                id: "persisted-product-id",
                slug: "persisted-product",
                name: "Persisted Product",
                brand: "Zupona",
                category_slug: "mens-fashion",
                description: "A persisted product",
                short_description: "Persisted",
                price: 499,
                old_price: 599,
                stock: 7,
                rating: 4.8,
                reviews: 24,
                features_json: JSON.stringify(["Feature 1"]),
                specs_json: JSON.stringify([]),
                variants_json: JSON.stringify([]),
                variant_label: "Select option",
                best_selling: 0,
                top_pick: 0,
                status: "active",
                sku: "ZUP-123",
                product_type: "physical",
                bullet_points_json: JSON.stringify([]),
                search_keywords: "persisted",
                published_at: "2026-01-01T00:00:00.000Z",
                scheduled_for: null,
                review_status: "approved",
                return_policy: "30-day return",
                shipping_notes: "Ships in 2 days",
                tags_json: JSON.stringify(["new"]),
                attributes_json: JSON.stringify([]),
                seo_title: "Persisted Product",
                seo_description: "A persisted product",
                publish_status: "published",
                product_video: "/media/demo.mp4",
              },
            ],
          };
        },
        async first() {
          return {
            id: "persisted-product-id",
            slug: "persisted-product",
            name: "Persisted Product",
            brand: "Zupona",
            category_slug: "mens-fashion",
            description: "A persisted product",
            short_description: "Persisted",
            price: 499,
            old_price: 599,
            stock: 7,
            rating: 4.8,
            reviews: 24,
            features_json: JSON.stringify(["Feature 1"]),
            specs_json: JSON.stringify([]),
            variants_json: JSON.stringify([]),
            variant_label: "Select option",
            best_selling: 0,
            top_pick: 0,
            status: "active",
            sku: "ZUP-123",
            product_type: "physical",
            bullet_points_json: JSON.stringify([]),
            search_keywords: "persisted",
            published_at: "2026-01-01T00:00:00.000Z",
            scheduled_for: null,
            review_status: "approved",
            return_policy: "30-day return",
            shipping_notes: "Ships in 2 days",
            tags_json: JSON.stringify(["new"]),
            attributes_json: JSON.stringify([]),
            seo_title: "Persisted Product",
            seo_description: "A persisted product",
            publish_status: "published",
            product_video: "/media/demo.mp4",
          };
        },
      }),
    }),
    batch: async () => Promise.resolve([]),
  } as any;

  const previous = (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__;
  (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__ = { DB: stubDb };

  try {
    const saved = await saveCatalogProduct({
      id: "persisted-product-id",
      name: "Persisted Product",
      slug: "persisted-product",
      category: "mens-fashion",
      price: 499,
      oldPrice: 599,
      stock: 7,
      description: "A persisted product",
      shortDescription: "Persisted",
      sku: "ZUP-123",
      publishStatus: "published",
      galleryImages: ["/media/demo.png"],
      galleryImageAlts: ["Demo product"],
      productVideo: "/media/demo.mp4",
    }, "admin-1");

    const insertCall = calls.find((call) => call.sql.includes("INSERT INTO products"));
    assert.ok(insertCall, "expected a products insert call");
    assert.equal(insertCall.args.length, 34, "product insert binds must match schema column count");
    assert.equal(saved.product.id, "persisted-product-id");
    assert.equal(saved.detail.publishStatus, "published");
  } finally {
    if (previous === undefined) {
      delete (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__;
    } else {
      (globalThis as Record<string, unknown>).__CLOUDFLARE_ENV__ = previous;
    }
  }
});
