import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatTk } from "@/components/zupona/data";
import { useShop } from "@/components/zupona/shop-store";
import { getCurrentUser, type SafeUser } from "@/auth";

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
  loader: async () => {
    try {
      return { user: await getCurrentUser() };
    } catch {
      return { user: null as SafeUser | null };
    }
  },
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { user } = Route.useLoaderData();
  const { cartItems, cartTotal, setQty, removeFromCart } = useShop();
  const delivery = cartTotal === 0 || cartTotal >= 999 ? 0 : 60;

  return (
    <main className="mx-auto max-w-[1200px] px-3 py-5 sm:px-4 sm:py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your basket</p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">Shopping Cart</h1>
        </div>
        <div className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
          {cartItems.length} item{cartItems.length === 1 ? "" : "s"}
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-14">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Link to="/deals" className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold-deep">
            Browse deals
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ul className="flex flex-col gap-3">
            {cartItems.map(({ product, qty }) => (
              <li key={product.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
                <Link to="/product/$slug" params={{ slug: product.slug }} className="shrink-0">
                  <img src={product.image} alt={product.name} loading="lazy" width={512} height={512} className="h-24 w-24 rounded-xl border border-border bg-background object-contain sm:h-28 sm:w-28" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{product.brand}</p>
                  <Link to="/product/$slug" params={{ slug: product.slug }} className="mt-1 text-sm font-bold text-foreground hover:text-gold sm:text-base">
                    {product.name}
                  </Link>
                  <p className="mt-2 text-sm font-bold text-gold">{formatTk(product.price)}</p>

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                    <div className="flex items-center rounded-full border border-border bg-background">
                      <button type="button" aria-label="Decrease quantity" onClick={() => setQty(product.slug, qty - 1)} className="px-2.5 py-1.5 text-foreground hover:text-gold">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => setQty(product.slug, qty + 1)} className="px-2.5 py-1.5 text-foreground hover:text-gold">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button type="button" onClick={() => { removeFromCart(product.slug); toast.success("Removed from cart"); }} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-sale">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm font-black text-foreground sm:text-base">{formatTk(product.price * qty)}</p>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold text-foreground">Order Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatTk(cartTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium">{delivery === 0 ? "Free" : formatTk(delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2.5 text-base font-black">
                <dt>Total</dt>
                <dd>{formatTk(cartTotal + delivery)}</dd>
              </div>
            </dl>
            <button type="button" onClick={() => { if (!user) { navigate({ to: "/login", search: { returnTo: "/checkout" } }); return; } navigate({ to: "/checkout", search: { slug: undefined } }); }} className="mt-5 w-full rounded-full bg-gold px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-gold-deep">
              {user ? "Proceed to Checkout" : "Login to Proceed"} · {formatTk(cartTotal + delivery)}
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Checkout calculates the final payable amount on the server.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
