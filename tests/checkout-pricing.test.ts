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
