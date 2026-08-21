import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";

import { categories } from "./data";

/** Zepto-style horizontal category tab row (desktop only). */
export function CategoryTabs() {
  return (
    <nav
      aria-label="Shop categories"
      className="hidden border-t border-border/60 md:block"
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <ul className="flex items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li>
            <Link
              to="/categories"
              className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-foreground hover:text-gold"
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
                className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-foreground hover:text-gold"
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
        </ul>
      </div>
    </nav>
  );
}
