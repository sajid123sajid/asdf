import { Link } from "@tanstack/react-router";
import { categories } from "./data";

/** Compact category strip. Mobile shows all categories in exactly 2 rows of square cards; desktop scrolls horizontally. */
export function CategoryStrip() {
  return (
    <section aria-label="Quick categories" className="mt-3 rounded-lg bg-card px-3 py-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">Shop by Category</h2>
        <Link to="/categories" className="text-xs font-medium text-gold hover:underline">
          All Categories
        </Link>
      </div>
      <ul className="grid grid-cols-5 gap-2 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-1">
        {categories.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="group flex w-full flex-col items-center gap-1 text-center sm:w-[72px]"
            >
              <span className="flex aspect-square w-full max-w-[64px] items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/50 transition-colors group-hover:border-gold sm:h-14 sm:w-14 sm:rounded-full">
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-8 w-8 object-contain sm:h-11 sm:w-11"
                />
              </span>
              <span className="line-clamp-2 min-h-[2.4em] max-w-[72px] text-center text-[10px] leading-tight text-foreground">
                {c.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
