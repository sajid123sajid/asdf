import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { Product } from "./data";
import { ProductCard } from "./ProductCard";

/** Zepto-style horizontally scrolling product rail. */
export function ProductRail({
  id,
  title,
  products,
  viewAllTo = "/deals",
}: {
  id: string;
  title: string;
  products: Product[];
  viewAllTo?: string;
}) {
  return (
    <section aria-labelledby={id} className="mt-4 rounded-2xl bg-card px-2 py-3 sm:mt-8 sm:px-4 sm:py-5">
      <div className="mb-2 flex items-center justify-between gap-2 sm:mb-4">
        <h2 id={id} className="truncate text-sm font-extrabold text-foreground sm:text-xl">
          {title}
        </h2>
        <Link
          to={viewAllTo}
          className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-gold hover:underline sm:text-sm"
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
