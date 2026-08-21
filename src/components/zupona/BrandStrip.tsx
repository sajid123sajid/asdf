import { Link } from "@tanstack/react-router";

import { products } from "./data";

const brands = Array.from(new Set(products.map((p) => p.brand))).slice(0, 12);

/** Compact horizontal brand shortcut row. */
export function BrandStrip() {
  return (
    <section aria-labelledby="shop-brands" className="mt-4 rounded-2xl bg-card px-2 py-3 sm:mt-8 sm:px-4 sm:py-5">
      <h2 id="shop-brands" className="mb-2 text-sm font-extrabold text-foreground sm:mb-4 sm:text-xl">
        Shop by Brand
      </h2>
      <ul className="flex gap-2 overflow-x-auto pb-1 sm:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {brands.map((b) => (
          <li key={b} className="shrink-0">
            <Link
              to="/search"
              search={{ q: b }}
              className="block rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:border-gold hover:text-gold sm:px-4 sm:py-2 sm:text-sm"
            >
              {b}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
