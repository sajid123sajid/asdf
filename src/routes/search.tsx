import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/zupona/ProductCard";
import { searchProducts } from "@/components/zupona/data";
import { useShop } from "@/components/zupona/shop-store";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Search products — Zupona" },
      {
        name: "description",
        content: "Search thousands of Zupona products across beauty, fashion, watches, home and baby.",
      },
      { property: "og:title", content: "Search products — Zupona" },
      { property: "og:description", content: "Find exactly what you need on Zupona." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { products } = useShop();
  const results = searchProducts(q, products);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">
        {q ? `Results for "${q}"` : "Search products"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{results.length} products found</p>

      {results.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-14">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No products matched your search. Try another keyword or browse all categories.
          </p>
          <Link
            to="/categories"
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
          >
            Browse categories
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {results.map((p) => (
            <li key={p.id || p.slug} className="h-full">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
