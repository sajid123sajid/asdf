import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { formatTk, getProduct } from "@/components/zupona/data";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    slug: typeof search["slug"] === "string" ? (search["slug"] as string) : undefined,
  }),
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
  const product = slug ? getProduct(slug) : undefined;
  const [qty, setQty] = useState(1);
  const [placed, setPlaced] = useState(false);

  if (!product) {
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

  const subtotal = product.price * qty;
  const delivery = subtotal >= 999 ? 0 : 60;

  if (placed) {
    return (
      <main className="mx-auto max-w-[600px] px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">Order confirmed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {qty} × {product.name} — {formatTk(subtotal + delivery)}. We&apos;ll call you shortly to
          confirm delivery.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Checkout</h1>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex gap-3">
            <Link to="/product/$slug" params={{ slug: product.slug }} className="shrink-0">
              <img
                src={product.image}
                alt={`${product.brand} ${product.name}`}
                width={512}
                height={512}
                className="h-24 w-24 rounded-md object-contain"
              />
            </Link>
            <div className="flex flex-1 flex-col">
              <p className="text-xs text-muted-foreground">{product.brand}</p>
              <p className="text-sm font-semibold text-foreground">{product.name}</p>
              <p className="mt-1 text-sm font-bold text-foreground">{formatTk(product.price)}</p>
              <div className="mt-auto flex items-center rounded-md border border-border self-start">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-2 py-1.5 hover:text-gold"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-2 py-1.5 hover:text-gold"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <form
            className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPlaced(true);
              toast.success("Order placed!");
            }}
          >
            <h2 className="text-base font-bold text-foreground sm:col-span-2">Delivery details</h2>
            <input
              required
              placeholder="Full name"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              required
              type="tel"
              placeholder="Phone number"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              required
              placeholder="Full delivery address"
              rows={3}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
            />
            <button
              type="submit"
              className="rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold-deep sm:col-span-2"
            >
              Place order — {formatTk(subtotal + delivery)}
            </button>
          </form>
        </section>

        <aside className="h-fit rounded-lg border border-border bg-card p-4">
          <h2 className="text-base font-bold text-foreground">Order Summary</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatTk(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-medium">{delivery === 0 ? "Free" : formatTk(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatTk(subtotal + delivery)}</dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4" strokeWidth={1.5} /> Free delivery over Tk 999
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} /> 30-day returns
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> Cash on delivery available
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
