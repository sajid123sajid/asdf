import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/zupona/ProductCard";
import { getCategory } from "@/components/zupona/data";
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

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-gold">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/categories" className="hover:text-gold">
          Categories
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          <p className="text-sm text-muted-foreground">{items.length} products</p>
        </div>
        <label className="text-sm text-muted-foreground">
          Sort by{" "}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-base font-semibold text-foreground">No products in this category yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Products added in this category will appear here instantly.</p>
          <Link
            to="/admin"
            className="mt-4 inline-flex items-center rounded-md bg-gold px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-gold-deep"
          >
            Add Products in Admin
          </Link>
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
    </main>
  );
}
