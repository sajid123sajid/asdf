import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { categories, productsByCategory } from "@/components/zupona/data";
import { ProductCard } from "@/components/zupona/ProductCard";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — Zupona Online Shop" },
      {
        name: "description",
        content:
          "Browse every Zupona category: bath & body, health & beauty, watches, bags, fashion, baby, toys and home living.",
      },
      { property: "og:title", content: "All Categories — Zupona" },
      { property: "og:description", content: "Browse every product category on Zupona." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const uniqueCategories = [...new Map(categories.map((c) => [c.slug, c])).values()];
  const [active, setActive] = useState(uniqueCategories[0]?.slug ?? "");
  const activeCategory = uniqueCategories.find((c) => c.slug === active) ?? uniqueCategories[0];
  const items = productsByCategory(active);

  return (
    <main className="mx-auto max-w-[1200px] px-0 sm:px-4 sm:py-4">
      <h1 className="px-3 pb-2 pt-3 text-base font-extrabold text-foreground sm:px-0 sm:text-2xl">
        All Categories
      </h1>

      <div className="grid grid-cols-[92px_minmax(0,1fr)] items-start gap-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4">
        {/* Left rail — Zepto style vertical category picker */}
        <nav
          aria-label="Category list"
          className="sticky top-[52px] max-h-[calc(100dvh-100px)] overflow-y-auto border-r border-border bg-card [scrollbar-width:none] sm:top-4 sm:rounded-2xl sm:border sm:shadow-[0_1px_6px_rgba(0,0,0,0.05)] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="py-1">
            {uniqueCategories.map((c) => {
              const isActive = c.slug === active;
              return (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => setActive(c.slug)}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative flex w-full flex-col items-center gap-1 px-1.5 py-2.5 text-center transition-colors sm:flex-row sm:gap-3 sm:px-3 sm:text-left ${
                      isActive ? "bg-gold/10" : "hover:bg-secondary/60"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r bg-gold" />
                    )}
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-secondary/50 ${
                        isActive ? "border-gold" : "border-transparent"
                      }`}
                    >
                      <img
                        src={c.image}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        width={512}
                        height={512}
                        className="h-9 w-9 object-contain"
                      />
                    </span>
                    <span
                      className={`line-clamp-2 text-[10px] font-semibold leading-tight sm:text-sm ${
                        isActive ? "text-gold" : "text-foreground"
                      }`}
                    >
                      {c.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right pane — products of the selected category */}
        <section aria-live="polite" className="min-w-0 px-2 pb-6 sm:px-0">
          <div className="mb-2 mt-1 flex items-center justify-between gap-2">
            <h2 className="truncate text-sm font-extrabold text-foreground sm:text-lg">
              {activeCategory?.name}
            </h2>
            {activeCategory && (
              <Link
                to="/category/$slug"
                params={{ slug: activeCategory.slug }}
                className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-gold hover:underline sm:text-sm"
              >
                See All
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {items.length > 0 ? (
            <ul className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {items.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground">
              New arrivals coming soon in this category.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
