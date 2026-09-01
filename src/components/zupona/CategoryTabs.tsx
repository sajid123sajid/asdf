import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";

import { categories } from "./data";

/** Shared desktop secondary navigation for storefront pages. */
export function CategoryTabs() {
  const location = useLocation();
  const hideSecondaryNav = location.pathname === "/login" || location.pathname === "/account" || location.pathname === "/cart" || location.pathname === "/checkout";

  if (hideSecondaryNav) return null;

  return (
    <nav aria-label="Shop categories" className="hidden border-b border-border/70 bg-card/95 backdrop-blur-sm md:block">
      <div className="mx-auto max-w-[1200px] px-4">
        <ul className="flex items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li>
            <Link
              to="/categories"
              className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:text-gold"
              activeProps={{ className: "border-gold text-gold" }}
            >
              <LayoutGrid className="h-4 w-4" />
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:text-gold"
                activeProps={{ className: "border-gold text-gold" }}
              >
                <img
                  src={c.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-6 w-6 shrink-0 object-contain"
                />
                {c.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/deals"
              className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:text-gold"
            >
              Offers
            </Link>
          </li>
          <li>
            <Link
              to="/categories"
              className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:text-gold"
            >
              New Arrivals
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
