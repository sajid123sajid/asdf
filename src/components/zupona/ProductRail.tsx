import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent } from "lucide-react";

import type { Product } from "./data";
import { ProductCard } from "./ProductCard";

/** Zepto-style horizontally scrolling product rail. */
export function ProductRail({
  id,
  title,
  products,
  viewAllTo = "/deals",
  variant = "default",
}: {
  id: string;
  title: string;
  products: Product[];
  viewAllTo?: string;
  variant?: "default" | "offers";
}) {
  const isOffers = variant === "offers";
  const highestDiscount = products.reduce((highest, product) => Math.max(highest, product.discount ?? 0), 0);

  return (
    <section aria-labelledby={id} className="mt-4 rounded-2xl bg-card px-2 py-3 sm:mt-8 sm:px-4 sm:py-5">
      <div
        className={`mb-2 flex items-center justify-between gap-2 sm:mb-4 ${
          isOffers ? "rounded-xl bg-[#fff8eb] px-3 py-2 sm:px-4 sm:py-2.5" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {isOffers ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold sm:h-10 sm:w-10">
              <BadgePercent className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.25} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 id={id} className="truncate text-sm font-extrabold text-foreground sm:text-xl">
              {title}
            </h2>
            {isOffers ? <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Extra savings on handpicked favourites</p> : null}
          </div>
        </div>
        {isOffers && highestDiscount > 0 ? (
          <span className="shrink-0 rounded-full bg-gold px-2.5 py-1 text-[10px] font-extrabold uppercase text-primary-foreground sm:px-3 sm:text-xs">
            Up to {highestDiscount}% off
          </span>
        ) : null}
        <Link
          to={viewAllTo}
          className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary hover:underline sm:text-sm"
        >
          See All
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <li key={p.slug} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
