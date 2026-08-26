import assert from "node:assert/strict";
import test from "node:test";

import { requireAdminUser } from "../src/auth.ts";
import { saveCatalogProduct } from "../src/catalog-db.ts";

test("requireAdminUser blocks non-admin access", async () => {
  await assert.rejects(() => requireAdminUser(), /administrator|admin|access/i);
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
