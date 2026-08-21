import { useState } from "react";
import { Star } from "lucide-react";
import { getReviews, ratingDistribution, type Product } from "./data";

/** Customer reviews block: summary, distribution bars and individual reviews. */
export function ProductReviews({ product }: { product: Product }) {
  const reviews = getReviews(product);
  const [showAll, setShowAll] = useState(false);
  const dist = ratingDistribution(product.rating);
  const visible = showAll ? reviews : reviews.slice(0, 2);

  return (
    <section id="reviews" className="mt-8 scroll-mt-24">
      <h2 className="mb-3 text-lg font-bold text-foreground sm:text-xl">Customer Reviews</h2>
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
          <div className="text-center sm:text-left">
            <p className="text-3xl font-extrabold text-foreground">
              {product.rating}
              <span className="text-base font-semibold text-muted-foreground"> / 5</span>
            </p>
            <div className="mt-1 flex justify-center gap-0.5 sm:justify-start">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-4 w-4 ${n <= Math.round(product.rating) ? "fill-gold text-gold" : "text-border"}`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{product.reviews} reviews</p>
          </div>

          <ul className="space-y-1.5">
            {dist.map((pct, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-6 shrink-0 text-right font-semibold text-foreground">{5 - i}★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 shrink-0">{pct}%</span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-4 divide-y divide-border border-t border-border">
          {visible.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                <span className="shrink-0 text-[11px] text-muted-foreground">{r.date}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-3 w-3 ${n <= r.rating ? "fill-gold text-gold" : "text-border"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </li>
          ))}
        </ul>

        {reviews.length > 2 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-2 w-full rounded-full border border-border py-2 text-sm font-semibold text-foreground hover:border-gold hover:text-gold-deep"
          >
            {showAll ? "Show fewer reviews" : "See all reviews"}
          </button>
        )}
      </div>
    </section>
  );
}
