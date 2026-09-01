export type CheckoutLineInput = {
  slug: string;
  price: number;
  qty: number;
};

export type CheckoutTotals = {
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
};

export function calculateCheckoutTotals(lines: CheckoutLineInput[]): CheckoutTotals {
  const subtotal = lines.reduce((sum, line) => {
    const qty = Number.isFinite(line.qty) ? Math.max(0, Number(line.qty)) : 0;
    const price = Number.isFinite(line.price) ? Math.max(0, Number(line.price)) : 0;
    return sum + price * qty;
  }, 0);

  const delivery = subtotal >= 999 ? 0 : 60;
  const discount = 0;
  const total = subtotal + delivery - discount;

  return { subtotal, delivery, discount, total };
}

export function validateCheckoutOrderInput(
  lines: CheckoutLineInput[],
  order: {
    totalAmount?: number;
    shippingAddress?: string;
    shippingPostcode?: string;
    phone?: string;
  },
): CheckoutTotals {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Your cart is empty.");
  }

  for (const line of lines) {
    if (!line || typeof line.slug !== "string" || !line.slug.trim()) {
      throw new Error("One of the cart items is invalid.");
    }
    if (!Number.isFinite(line.price) || line.price < 0) {
      throw new Error("One of the cart item prices is invalid.");
    }
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > 100) {
      throw new Error("Each cart item must have a valid quantity.");
    }
  }

  const totals = calculateCheckoutTotals(lines);
  const incomingTotal = Number(order.totalAmount);
  if (!Number.isFinite(incomingTotal) || Math.abs(incomingTotal - totals.total) > 0.005) {
    throw new Error("Order total does not match the cart items.");
  }

  if (!order.shippingAddress || !order.shippingAddress.trim() || order.shippingAddress.trim().length > 500) {
    throw new Error("A valid delivery address is required.");
  }
  if (!order.phone || !order.phone.trim() || order.phone.trim().length > 40) {
    throw new Error("A valid phone number is required.");
  }
  if (!order.shippingPostcode || !/^\d{4}$/.test(String(order.shippingPostcode).trim())) {
    throw new Error("A valid 4-digit postal code is required.");
  }

  return totals;
}
