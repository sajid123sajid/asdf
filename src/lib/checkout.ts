export type CheckoutLineInput = {
  slug: string;
  price: number;
  qty: number;
};

export type DeliveryOption = "standard" | "express" | "pickup";

export type CheckoutTotals = {
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
};

export function calculateCheckoutTotals(
  lines: CheckoutLineInput[],
  options?: { deliveryMethod?: string | undefined; discount?: number | undefined } | undefined,
): CheckoutTotals {
  const subtotal = lines.reduce((sum, line) => {
    const qty = Number.isFinite(line.qty) ? Math.max(0, Number(line.qty)) : 0;
    const price = Number.isFinite(line.price) ? Math.max(0, Number(line.price)) : 0;
    return sum + price * qty;
  }, 0);

  let delivery = subtotal >= 999 ? 0 : 60;
  if (options?.deliveryMethod === "express") {
    delivery = 120;
  } else if (options?.deliveryMethod === "pickup") {
    delivery = 0;
  } else if (options?.deliveryMethod === "standard") {
    delivery = 60;
  }

  const discount = Math.max(0, Number(options?.discount || 0));
  const total = Math.max(0, subtotal + delivery - discount);

  return { subtotal, delivery, discount, total };
}

export function validateCheckoutOrderInput(
  lines: CheckoutLineInput[],
  order: {
    totalAmount?: number | undefined;
    shippingAddress?: string | undefined;
    shippingPostcode?: string | undefined;
    phone?: string | undefined;
    deliveryMethod?: string | undefined;
    discount?: number | undefined;
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

  const totalsWithOptions = calculateCheckoutTotals(lines, {
    deliveryMethod: order.deliveryMethod,
    discount: order.discount,
  });
  const defaultTotals = calculateCheckoutTotals(lines);

  const incomingTotal = Number(order.totalAmount);
  const matchesWithOptions = Number.isFinite(incomingTotal) && Math.abs(incomingTotal - totalsWithOptions.total) <= 0.005;
  const matchesDefault = Number.isFinite(incomingTotal) && Math.abs(incomingTotal - defaultTotals.total) <= 0.005;

  if (!matchesWithOptions && !matchesDefault) {
    throw new Error("Order total does not match the cart items.");
  }

  const resolvedTotals = matchesWithOptions ? totalsWithOptions : defaultTotals;

  if (!order.shippingAddress || !order.shippingAddress.trim() || order.shippingAddress.trim().length > 500) {
    throw new Error("A valid delivery address is required.");
  }
  if (!order.phone || !order.phone.trim() || order.phone.trim().length > 40) {
    throw new Error("A valid phone number is required.");
  }
  if (!order.shippingPostcode || !/^\d{4}$/.test(String(order.shippingPostcode).trim())) {
    throw new Error("A valid 4-digit postal code is required.");
  }

  return resolvedTotals;
}

