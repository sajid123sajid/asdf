import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Minus, Plus, ReceiptText, ShoppingCart, Tag, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, type SafeUser } from "@/auth";
import { formatTk } from "./data";
import { useShop } from "./shop-store";

export function CartDrawer() {
  const navigate = useNavigate();
  const { cartOpen, closeCart, cartItems, cartTotal, cartCount, setQty, removeFromCart } = useShop();
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [authState, setAuthState] = useState<"checking" | "authenticated" | "unauthenticated">("checking");

  const savings = cartItems.reduce(
    (n, { product, qty }) => n + Math.max(0, product.oldPrice - product.price) * qty,
    0,
  );
  const delivery = cartTotal === 0 || cartTotal >= 999 ? 0 : 60;
  const total = cartTotal + delivery;

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        if (!isMounted) return;
        setCurrentUser(user);
        setAuthState(user ? "authenticated" : "unauthenticated");
      } catch {
        if (!isMounted) return;
        setCurrentUser(null);
        setAuthState("unauthenticated");
      }
    };

    if (cartOpen) {
      setAuthState("checking");
      void loadCurrentUser();
    }

    return () => {
      isMounted = false;
    };
  }, [cartOpen]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [cartOpen, closeCart]);

  const isCartEmpty = cartItems.length === 0;
  const isCheckoutDisabled = isCartEmpty || authState === "checking";
  const checkoutLabel =
    isCartEmpty
      ? "Cart is empty"
      : authState === "checking"
        ? "Checking session..."
        : authState === "authenticated"
          ? `Proceed to Checkout · ${formatTk(total)}`
          : "Login to Proceed";

  const handleCheckoutClick = () => {
    if (authState === "checking" || isCartEmpty) return;

    if (authState === "unauthenticated") {
      closeCart();
      navigate({ to: "/login", search: { returnTo: "/checkout" } });
      return;
    }

    closeCart();
    navigate({ to: "/checkout", search: { slug: undefined } });
  };

  return (
    <>
      {/* overlay */}
      <div
        onClick={closeCart}
        aria-hidden={!cartOpen}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        style={{ backgroundColor: "var(--muted)" }}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col shadow-2xl transition-transform duration-300 ease-out sm:max-w-[420px] ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* header */}
        <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3">
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Cart</h2>
          {cartCount > 0 && (
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={closeCart}
            aria-label="Dismiss"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {/* coupons */}
          <section className="rounded-xl border border-border bg-card p-3">
            <h3 className="text-sm font-bold text-foreground">Coupons &amp; offers</h3>
            <div className="mt-2 flex items-center gap-3 rounded-lg bg-gold/5 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                <Tag className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">ZUPONA10 · 10% off</p>
                <p className="truncate text-xs text-muted-foreground">On orders above Tk 1,500</p>
              </div>
              <button
                type="button"
                onClick={() => toast.success("Coupon ZUPONA10 saved for checkout")}
                className="ml-auto shrink-0 text-xs font-semibold text-gold hover:underline"
              >
                Apply
              </button>
            </div>
          </section>

          {/* items */}
          <section className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Truck className="h-4 w-4 text-gold" />
              <div>
                <p className="text-sm font-semibold text-foreground">Delivery in 2–3 days</p>
                <p className="text-xs text-muted-foreground">{cartItems.length} item(s)</p>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <ShoppingCart className="h-9 w-9 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                <Link
                  to="/deals"
                  onClick={closeCart}
                  className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
                >
                  Browse deals
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {cartItems.map(({ product, qty }) => (
                  <li key={product.id} className="flex gap-3 p-3">
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      onClick={closeCart}
                      className="shrink-0"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        width={512}
                        height={512}
                        className="h-14 w-14 rounded-md border border-border object-contain"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to="/product/$slug"
                        params={{ slug: product.slug }}
                        onClick={closeCart}
                        className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-gold"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{product.brand}</p>
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(product.slug);
                          toast.success("Removed from cart");
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-sale"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex items-center rounded-md border border-gold/40 bg-gold/5">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${product.name}`}
                          onClick={() => setQty(product.slug, qty - 1)}
                          className="px-2 py-1.5 text-gold hover:text-gold-deep"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-bold text-gold">{qty}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${product.name}`}
                          onClick={() => setQty(product.slug, qty + 1)}
                          className="px-2 py-1.5 text-gold hover:text-gold-deep"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-right text-sm font-bold text-foreground">
                        {product.oldPrice > product.price && (
                          <span className="mr-1 text-xs font-normal text-muted-foreground line-through">
                            {formatTk(product.oldPrice * qty)}
                          </span>
                        )}
                        {formatTk(product.price * qty)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-center gap-1 border-t border-border px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Forgot something?</span>
              <Link to="/deals" onClick={closeCart} className="font-semibold text-gold hover:underline">
                Add More Items
              </Link>
            </div>
          </section>

          {/* bill summary */}
          <section className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-gold" />
              <h3 className="text-sm font-bold text-foreground">Bill Summary</h3>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Item total</dt>
                <dd className="font-medium text-foreground">{formatTk(cartTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery charge</dt>
                <dd className="font-medium text-foreground">{delivery === 0 ? "Free" : formatTk(delivery)}</dd>
              </div>
              {savings > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount savings</dt>
                  <dd className="font-medium text-sale">− {formatTk(savings)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                <dt>To pay</dt>
                <dd>{formatTk(total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">Cash on delivery available nationwide.</p>
          </section>
        </div>

        {/* fixed footer */}
        <footer
          className="border-t border-border bg-card p-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            disabled={isCheckoutDisabled}
            onClick={handleCheckoutClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkoutLabel}
          </button>
        </footer>
      </aside>
    </>
  );
}
