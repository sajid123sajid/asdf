import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCheckoutTotals,
  validateCheckoutOrderInput,
} from "../src/lib/checkout.ts";

test("checkout totals are computed from the real cart values", () => {
  const totals = calculateCheckoutTotals([
    { slug: "omega-bottle", price: 250, qty: 2 },
    { slug: "travel-bag", price: 799, qty: 1 },
  ]);

  assert.equal(totals.subtotal, 1299);
  assert.equal(totals.delivery, 0);
  assert.equal(totals.discount, 0);
  assert.equal(totals.total, 1299);
});

test("checkout totals support selectable delivery methods and discounts", () => {
  const lines = [
    { slug: "omega-bottle", price: 250, qty: 1 },
    { slug: "travel-bag", price: 799, qty: 1 },
  ]; // subtotal = 1049

  const standard = calculateCheckoutTotals(lines, { deliveryMethod: "standard" });
  assert.equal(standard.subtotal, 1049);
  assert.equal(standard.delivery, 60);
  assert.equal(standard.total, 1109);

  const express = calculateCheckoutTotals(lines, { deliveryMethod: "express" });
  assert.equal(express.subtotal, 1049);
  assert.equal(express.delivery, 120);
  assert.equal(express.total, 1169);

  const pickup = calculateCheckoutTotals(lines, { deliveryMethod: "pickup" });
  assert.equal(pickup.subtotal, 1049);
  assert.equal(pickup.delivery, 0);
  assert.equal(pickup.total, 1049);

  const withDiscount = calculateCheckoutTotals(lines, { deliveryMethod: "standard", discount: 100 });
  assert.equal(withDiscount.subtotal, 1049);
  assert.equal(withDiscount.delivery, 60);
  assert.equal(withDiscount.discount, 100);
  assert.equal(withDiscount.total, 1009);
});

test("checkout validation rejects tampered totals and missing shipping data", () => {
  assert.throws(
    () =>
      validateCheckoutOrderInput(
        [
          { slug: "omega-bottle", price: 250, qty: 1 },
          { slug: "travel-bag", price: 799, qty: 1 },
        ],
        {
          totalAmount: 1500,
          shippingAddress: "",
          phone: "01712345678",
          shippingPostcode: "1207",
        },
      ),
    /address|total/i,
  );
});

