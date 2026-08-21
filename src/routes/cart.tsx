import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatTk } from "@/components/zupona/data";
import { useShop } from "@/components/zupona/shop-store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart — Zupona" },
      {
        name: "description",
        content: "Review your Zupona cart, update quantities and checkout securely with free delivery over Tk 999.",
      },
      { property: "og:title", content: "Shopping Cart — Zupona" },
      { property: "og:description", content: "Review and checkout your Zupona order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cartItems, cartTotal, setQty, removeFromCart, clearCart } = useShop();
  const delivery = cartTotal === 0 || cartTotal >= 999 ? 0 : 60;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-14">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Link
            to="/deals"
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
          >
            Browse deals
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <ul className="flex flex-col gap-3">
            {cartItems.map(({ product, qty }) => (
              <li
                key={product.id}
                className="flex gap-3 rounded-lg border border-border bg-card p-3"
              >
                <Link to="/product/$slug" params={{ slug: product.slug }} className="shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-24 w-24 rounded-md object-contain"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="text-sm font-semibold text-foreground hover:text-gold"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm font-bold text-foreground">{formatTk(product.price)}</p>

                  <div className="mt-auto flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-border">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(product.slug, qty - 1)}
                        className="px-2 py-1.5 hover:text-gold"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQty(product.slug, qty + 1)}
                        className="px-2 py-1.5 hover:text-gold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeFromCart(product.slug);
                        toast.success("Removed from cart");
                      }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-sale"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground">{formatTk(product.price * qty)}</p>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-lg border border-border bg-card p-4">
            <h2 className="text-base font-bold text-foreground">Order Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatTk(cartTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium">{delivery === 0 ? "Free" : formatTk(delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatTk(cartTotal + delivery)}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                clearCart();
                toast.success("Order placed! We'll call you to confirm.");
              }}
              className="mt-4 w-full rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
            >
              Proceed to Checkout
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Cash on delivery available
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
