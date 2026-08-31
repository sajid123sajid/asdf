import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Minus, Plus, RotateCcw, ShieldCheck, Truck, PackageCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatTk, getProduct } from "@/components/zupona/data";
import { useShop } from "@/components/zupona/shop-store";
import { getCurrentUser, placeOrder, startOnlinePayment, type SafeUser } from "../auth";
import type { OrderRecord } from "../db";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    slug: typeof search["slug"] === "string" ? (search["slug"] as string) : undefined,
  }),
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: "/login", search: { returnTo: "/checkout" } });
    }
  },
  loader: async () => {
    try {
      const user = await getCurrentUser();
      return { user };
    } catch {
      return { user: null as SafeUser | null };
    }
  },
  head: () => ({
    meta: [
      { title: "Checkout — Zupona" },
      {
        name: "description",
        content:
          "Complete your Zupona order in seconds: confirm your product, add delivery details and pay cash on delivery anywhere in Bangladesh.",
      },
      { property: "og:title", content: "Checkout — Zupona" },
      { property: "og:description", content: "Fast, secure checkout with cash on delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { slug } = Route.useSearch();
  const { user } = Route.useLoaderData();
  const { cartItems: cartCheckoutItems, setQty: setCartQty, removeFromCart } = useShop();
  const product = slug ? getProduct(slug) : undefined;
  const fallbackProductEntry = product ? [{ product, qty: 1 }] : [];
  const selectedItems = cartCheckoutItems.length > 0 ? cartCheckoutItems : fallbackProductEntry;
  const [qty, setQty] = useState(1);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [shippingPostcode, setShippingPostcode] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");

  useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.address) setDeliveryAddress(user.address);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  if (selectedItems.length === 0) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">No product selected.</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  const subtotal = selectedItems.reduce((sum, { product, qty: itemQty }) => sum + product.price * itemQty, 0);
  const delivery = subtotal >= 999 ? 0 : 60;
  const totalAmount = subtotal + delivery;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        email: email || user?.email || "guest@zupona.com",
        items: selectedItems.map(({ product: itemProduct, qty: itemQty }) => ({
          slug: itemProduct.slug,
          name: `${itemProduct.brand} ${itemProduct.name}`,
          qty: itemQty,
          price: itemProduct.price,
        })),
        totalAmount,
        shippingAddress: deliveryAddress,
        shippingPostcode,
        phone,
      };
      if (paymentMethod === "ONLINE") {
        const payment = await startOnlinePayment({ data });
        window.location.assign(payment.paymentUrl);
        return;
      }
      const order = await placeOrder({ data: { ...data, paymentMethod: "Cash on Delivery" } });
      setPlacedOrder(order);
      toast.success(`Order #${order.id} placed successfully!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <main className="mx-auto max-w-[650px] px-4 py-12 text-center">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <PackageCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="mt-2 text-sm font-medium text-foreground">
            Order Number: <span className="font-mono text-gold font-bold">{placedOrder.id}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            Thank you for shopping with Zupona! We have saved your order and our representative will
            call you shortly to confirm delivery.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-background p-4 text-left text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-border pb-2">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-semibold text-foreground">
                {selectedItems.map(({ product: itemProduct, qty: itemQty }) => `${itemQty} × ${itemProduct.name}`).join(", ")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border pb-2 pt-2">
              <span className="text-muted-foreground">Delivery To:</span>
              <span className="font-semibold text-foreground">{placedOrder.shipping_address}</span>
            </div>
            <div className="flex justify-between py-1 pt-2 text-sm font-bold">
              <span>Total Payable (COD):</span>
              <span className="text-gold">{formatTk(placedOrder.total_amount)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/track-order"
              search={{ id: placedOrder.id }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-gold-deep transition-colors"
            >
              Track Order <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Go to Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Checkout</h1>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          {selectedItems.map(({ product: itemProduct, qty: itemQty }) => (
            <div key={itemProduct.slug} className="flex gap-3">
              <Link to="/product/$slug" params={{ slug: itemProduct.slug }} className="shrink-0">
                <img
                  src={itemProduct.image}
                  alt={`${itemProduct.brand} ${itemProduct.name}`}
                  width={512}
                  height={512}
                  className="h-24 w-24 rounded-md object-contain border border-border bg-background"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <p className="text-xs text-muted-foreground">{itemProduct.brand}</p>
                <p className="text-sm font-semibold text-foreground">{itemProduct.name}</p>
                <p className="mt-1 text-sm font-bold text-gold">{formatTk(itemProduct.price)}</p>
                <div className="mt-auto flex items-center rounded-md border border-border self-start">
                  <button
                    type="button"
                    aria-label={`Decrease quantity for ${itemProduct.name}`}
                    onClick={() => {
                      if (cartCheckoutItems.length > 0) {
                        setCartQty(itemProduct.slug, Math.max(0, itemQty - 1));
                        if (itemQty <= 1) removeFromCart(itemProduct.slug);
                      } else {
                        setQty((q) => Math.max(1, q - 1));
                      }
                    }}
                    className="px-2 py-1.5 hover:text-gold"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium">{itemQty}</span>
                  <button
                    type="button"
                    aria-label={`Increase quantity for ${itemProduct.name}`}
                    onClick={() => {
                      if (cartCheckoutItems.length > 0) {
                        setCartQty(itemProduct.slug, itemQty + 1);
                      } else {
                        setQty((q) => q + 1);
                      }
                    }}
                    className="px-2 py-1.5 hover:text-gold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <form
            className="mt-6 grid gap-3.5 border-t border-border pt-6 sm:grid-cols-2"
            onSubmit={handleOrderSubmit}
          >
            <h2 className="text-base font-bold text-foreground sm:col-span-2">
              Delivery Information
            </h2>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Full Name *
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sajid Ahmed"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Phone Number *
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01700000000"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            {!user && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Email (Optional for tracking)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Full Delivery Address *
              </label>
              <textarea
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="House #, Road #, Area, Police Station, District"
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Postal / ZIP Code *
              </label>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={shippingPostcode}
                onChange={(e) => setShippingPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="e.g. 1212"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 block text-xs font-medium text-muted-foreground">Payment Method</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                  Cash on Delivery
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <input type="radio" name="paymentMethod" value="ONLINE" checked={paymentMethod === "ONLINE"} onChange={() => setPaymentMethod("ONLINE")} />
                  Online Payment (SSLCOMMERZ)
                </label>
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-gold-deep transition-colors sm:col-span-2 disabled:opacity-50"
            >
              {submitting ? "Processing..." : paymentMethod === "ONLINE" ? `Pay ${formatTk(totalAmount)} Online` : `Confirm Order — ${formatTk(totalAmount)} (Cash on Delivery)`}
            </button>
          </form>
        </section>

        <aside className="h-fit rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">Order Summary</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatTk(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery Charge</dt>
              <dd className="font-medium">{delivery === 0 ? "Free" : formatTk(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-gold">{formatTk(totalAmount)}</dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gold" strokeWidth={1.5} /> Free delivery over Tk 999
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-gold" strokeWidth={1.5} /> 30-day returns
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.5} /> Cash on delivery available
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
