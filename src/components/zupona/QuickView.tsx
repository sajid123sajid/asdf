import { Link } from "@tanstack/react-router";
import { Minus, Plus, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTk, variantsFor, type Product } from "./data";
import { useShop } from "./shop-store";

/** Quick-view modal: price, rating and variants without leaving the page. */
export function QuickView({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addToCart, setQty, qtyOf } = useShop();
  const variants = variantsFor(product);
  const [variant, setVariant] = useState(variants[0] ?? "");
  const qty = qtyOf(product.slug);

  useEffect(() => {
    if (open) setVariant(variants[0] ?? "");
  }, [open, product.slug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] gap-0 rounded-2xl p-0 sm:max-w-2xl">
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
          <div className="relative overflow-hidden rounded-xl bg-secondary/40">
            <span className="absolute left-0 top-0 z-10 rounded-br-xl bg-sale px-2 py-1 text-xs font-extrabold text-primary-foreground">
              {product.discount}% OFF
            </span>
            <div className="aspect-square p-4">
              <img
                src={product.image}
                alt={`${product.brand} ${product.name}`}
                width={512}
                height={512}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-base font-extrabold leading-snug sm:text-xl">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">{product.brand}</DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span className="font-semibold text-foreground">{product.rating}</span>
              <span>({product.reviews} reviews)</span>
            </div>



            <div className="mt-3 flex items-end gap-2">
              <p className="text-xl font-extrabold text-foreground sm:text-2xl">
                {formatTk(product.price)}
              </p>
              <p className="text-sm text-muted-foreground line-through">
                {formatTk(product.oldPrice)}
              </p>
            </div>

            <fieldset className="mt-4">
              <legend className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Options
              </legend>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    aria-pressed={variant === v}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                      variant === v
                        ? "border-gold bg-gold text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-gold hover:text-gold"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex items-center gap-2">
              {qty === 0 ? (
                <button
                  type="button"
                  onClick={() => addToCart(product.slug)}
                  className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-gold-deep active:scale-95"
                >
                  Add to cart
                </button>
              ) : (
                <div className="flex flex-1 items-center justify-between rounded-lg bg-gold px-2 py-1.5 text-primary-foreground">
                  <button
                    type="button"
                    onClick={() => setQty(product.slug, qty - 1)}
                    aria-label={`Decrease ${product.name} quantity`}
                    className="flex h-8 w-8 items-center justify-center transition-transform active:scale-75"
                  >
                    <Minus className="h-4 w-4" strokeWidth={3} />
                  </button>
                  <span className="text-sm font-extrabold">{qty} in cart</span>
                  <button
                    type="button"
                    onClick={() => addToCart(product.slug)}
                    aria-label={`Increase ${product.name} quantity`}
                    className="flex h-8 w-8 items-center justify-center transition-transform active:scale-75"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              )}

              <Link
                to="/product/$slug"
                params={{ slug: product.slug }}
                onClick={() => onOpenChange(false)}
                className="shrink-0 rounded-lg border border-gold px-4 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold hover:text-primary-foreground"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
