import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Lock, Minus, PackageCheck, Plus, ShieldCheck, Trash2, Truck } from "lucide-react";
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
  const navigate = useNavigate();
  const { slug } = Route.useSearch();
  const { user } = Route.useLoaderData();
  const { cartItems: cartCheckoutItems, setQty: setCartQty, removeFromCart } = useShop();
  const product = slug ? getProduct(slug) : undefined;
  const fallbackProductEntry = product ? [{ product, qty: 1 }] : [];
  const selectedItems = cartCheckoutItems.length > 0 ? cartCheckoutItems : fallbackProductEntry;
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      <main className="mx-auto max-w-[640px] px-4 py-10 sm:py-16">
        <div className="rounded-[28px] border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Checkout</p>
          <h1 className="mt-3 text-3xl font-black text-foreground">Your cart is empty</h1>
          <p className="mt-3 text-sm text-muted-foreground">Add products to continue to secure payment.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-deep"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = selectedItems.reduce((sum, { product, qty: itemQty }) => sum + product.price * itemQty, 0);
  const delivery = subtotal >= 999 ? 0 : 60;
  const discount = 0;
  const totalAmount = subtotal + delivery - discount;

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
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <PackageCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="mt-2 text-sm font-medium text-foreground">
            Order Number: <span className="font-mono text-gold font-bold">{placedOrder.id}</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            Thank you for shopping with Zupona! We have saved your order and our representative will call you shortly to confirm delivery.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-background p-4 text-left text-xs sm:text-sm">
            <div className="flex justify-between gap-3 border-b border-border pb-2">
              <span className="text-muted-foreground">Items:</span>
              <span className="text-right font-semibold text-foreground">
                {selectedItems.map(({ product: itemProduct, qty: itemQty }) => `${itemQty} × ${itemProduct.name}`).join(", ")}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-b border-border py-2">
              <span className="text-muted-foreground">Delivery To:</span>
              <span className="max-w-[220px] text-right font-semibold text-foreground">{placedOrder.shipping_address}</span>
            </div>
            <div className="flex justify-between gap-3 pt-2 text-sm font-bold">
              <span>Total Payable (COD):</span>
              <span className="text-gold">{formatTk(placedOrder.total_amount)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/track-order"
              search={{ id: placedOrder.id }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-gold-deep transition-colors"
            >
              Track Order <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Go to Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const deliveryLabel = delivery === 0 ? "Free delivery" : `${formatTk(delivery)} delivery`;
  const stepClass = "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold";

  return (
    <main className="mx-auto max-w-[1200px] px-3 py-4 sm:px-4 sm:py-6">
      <header className="mb-5 rounded-[28px] border border-border bg-card px-4 py-3 shadow-sm sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/cart" })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-secondary"
              aria-label="Go back to cart"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Link to="/" className="flex items-center gap-2" aria-label="Zupona home">
              <img src="/favicon.png" alt="Zupona" width={320} height={120} className="h-8 w-auto object-contain" />
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Lock className="h-3.5 w-3.5" />
            Secure Checkout
          </div>
        </div>
      </header>

      <div className="mb-5">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review your order and complete your purchase</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
        {["Cart", "Address", "Payment", "Confirm"].map((label, index) => {
          const isActive = index === 1;
          const isComplete = index < 1;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`${stepClass} ${isActive ? "border-gold/60 bg-[#fff9ee] text-gold" : ""} ${isComplete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-gold text-primary-foreground" : isComplete ? "bg-emerald-600 text-white" : "bg-secondary text-foreground"}`}>
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                {label}
              </div>
              {index < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      <form id="checkout-form" onSubmit={handleOrderSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Delivery address</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">Shipping details</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/account" })}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Change
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{fullName || user?.name || "Your delivery address"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{deliveryAddress || "Add your delivery address to continue."}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{phone || user?.phone || "Phone not set"}</span>
                    {shippingPostcode ? <span>• {shippingPostcode}</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Order items</p>
                <h2 className="mt-1 text-lg font-bold text-foreground">Your cart</h2>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground">{selectedItems.reduce((sum, item) => sum + item.qty, 0)} items</span>
            </div>

            <div className="space-y-3">
              {selectedItems.map(({ product: itemProduct, qty: itemQty }) => (
                <div key={itemProduct.slug} className="flex gap-3 rounded-2xl border border-border bg-background p-3">
                  <Link to="/product/$slug" params={{ slug: itemProduct.slug }} className="block shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                    <div className="relative aspect-[4/5] h-24 w-24 sm:h-28 sm:w-28">
                      <img src={itemProduct.image} alt={`${itemProduct.brand} ${itemProduct.name}`} className="h-full w-full object-cover" />
                    </div>
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{itemProduct.brand}</p>
                        <p className="mt-1 text-sm font-bold text-foreground">{itemProduct.name}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${itemProduct.name} from cart`}
                        onClick={() => removeFromCart(itemProduct.slug)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-border bg-card">
                        <button type="button" aria-label={`Decrease quantity for ${itemProduct.name}`} onClick={() => {
                          if (itemQty <= 1) removeFromCart(itemProduct.slug);
                          else setCartQty(itemProduct.slug, itemQty - 1);
                        }} className="flex h-9 w-9 items-center justify-center text-foreground hover:text-gold">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{itemQty}</span>
                        <button type="button" aria-label={`Increase quantity for ${itemProduct.name}`} onClick={() => setCartQty(itemProduct.slug, itemQty + 1)} className="flex h-9 w-9 items-center justify-center text-foreground hover:text-gold">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-base font-black text-gold">{formatTk(itemProduct.price * itemQty)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Delivery info</p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">Shipping & timing</h3>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Delivery charge</p>
                  <p className="mt-2 text-lg font-black text-foreground">{delivery === 0 ? "Free" : formatTk(delivery)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Estimated delivery</p>
                  <p className="mt-2 text-lg font-black text-foreground">2-4 days</p>
                </div>
              </div>

              {delivery === 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Free delivery unlocked for this order
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Payment method</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors ${paymentMethod === "COD" ? "border-gold bg-[#fff9ee]" : "border-border bg-background"}`}>
                  <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="h-4 w-4 accent-gold" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                  </div>
                </label>

                <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors ${paymentMethod === "ONLINE" ? "border-gold bg-[#fff9ee]" : "border-border bg-background"}`}>
                  <input type="radio" name="paymentMethod" value="ONLINE" checked={paymentMethod === "ONLINE"} onChange={() => setPaymentMethod("ONLINE")} className="h-4 w-4 accent-gold" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Online Payment</p>
                    <p className="text-xs text-muted-foreground">SSLCOMMERZ secure checkout</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6 hidden items-center gap-3 rounded-2xl border border-border bg-background p-3 md:flex">
              <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
                <Lock className="h-4 w-4" />
              </div>
              <p className="text-sm text-muted-foreground">Your payment is verified on the server before the order is confirmed.</p>
            </div>
          </div>
        </section>

        <aside className="h-fit lg:sticky lg:top-4">
          <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Order summary</p>
            <h2 className="mt-1 text-2xl font-black text-foreground">{formatTk(totalAmount)}</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold text-foreground">{formatTk(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-semibold text-foreground">{delivery === 0 ? "Free" : formatTk(delivery)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-semibold text-foreground">{formatTk(discount)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3 text-base font-black text-foreground">
                <dt>Total payable</dt>
                <dd className="text-gold">{formatTk(totalAmount)}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl border border-border bg-background p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-gold" />
                {deliveryLabel}
              </div>
              <p className="mt-2">Fast delivery across Bangladesh. Simple, secure checkout with trusted payment options.</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 hidden w-full rounded-full bg-gold px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-deep disabled:opacity-60 md:inline-flex md:items-center md:justify-center md:gap-2"
            >
              {submitting ? "Processing..." : "Proceed to Payment"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 py-3 shadow-[0_-8px_32px_rgba(17,24,39,0.12)] backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total</p>
            <p className="text-lg font-black text-foreground">{formatTk(totalAmount)}</p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gold px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-deep disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Proceed to Payment"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="pointer-events-none h-24 md:hidden" />
    </main>
  );
}
