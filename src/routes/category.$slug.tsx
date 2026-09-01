import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/zupona/ProductCard";
import { categories, getCategory } from "@/components/zupona/data";
import { useShop } from "@/components/zupona/shop-store";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { name: category.name };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Category unavailable — Zupona" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} — Shop online at Zupona`;
    const description = `Shop ${loaderData.name} at Zupona with free delivery over Tk 999, 30-day returns and secure checkout.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

type Sort = "popular" | "price-asc" | "price-desc" | "discount";

const sorts: { key: Sort; label: string }[] = [
  { key: "popular", label: "Most Popular" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "discount", label: "Biggest Discount" },
];

function CategoryPage() {
  const { slug } = Route.useParams();
  const { name } = Route.useLoaderData();
  const [sort, setSort] = useState<Sort>("popular");
  const { products } = useShop();

  const categoryProducts = products.filter((p) => p.category === slug);

  const items = [...categoryProducts].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "discount") return b.discount - a.discount;
    return b.reviews - a.reviews;
  });

  const subcategories = ["Trending", "New In", "Best Sellers", "Under Tk 1000", "Premium Picks"]; 

  return (
    <main className="mx-auto max-w-[1200px] px-3 py-5 sm:px-4 sm:py-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
        <Link to="/" className="hover:text-gold">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/categories" className="hover:text-gold">Categories</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Shop Collection</p>
            <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">{name}</h1>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-border bg-background px-3 py-2 text-sm text-muted-foreground md:self-auto">
            <span>{items.length} products</span>
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span>Fast delivery</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {subcategories.map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Filter</h2>
          </div>
          <div className="space-y-5 text-sm">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</p>
              <ul className="space-y-2">
                {categories.slice(0, 6).map((category) => (
                  <li key={category.slug}>
                    <Link to="/category/$slug" params={{ slug: category.slug }} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-foreground transition-colors hover:bg-secondary hover:text-gold">
                      <span>{category.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</p>
              <div className="space-y-2 text-muted-foreground">
                <label className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Under Tk 500</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Tk 500 - 1,500</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Tk 1,500 - 3,000</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Premium</label>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Brand</p>
              <div className="space-y-2 text-muted-foreground">
                <label className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Zupona</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Premium</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> New</label>
              </div>
            </div>
          </div>
        </aside>

        <section aria-live="polite" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Curated</p>
              <h2 className="text-lg font-bold text-foreground">{name}</h2>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-gold">
                {sorts.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          {items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-base font-semibold text-foreground">No products in this category yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Products added in this category will appear here instantly.</p>
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {items.map((p) => (
                <li key={p.id} className="h-full">
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
