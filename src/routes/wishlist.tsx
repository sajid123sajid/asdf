import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/zupona/ProductCard";
import { useShop } from "@/components/zupona/shop-store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist — Zupona" },
      {
        name: "description",
        content: "Everything you saved on Zupona in one place, ready to order whenever you are.",
      },
      { property: "og:title", content: "My Wishlist — Zupona" },
      { property: "og:description", content: "Your saved Zupona products." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlistItems } = useShop();

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">{wishlistItems.length} saved items</p>

      {wishlistItems.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-14">
          <Heart className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          <Link
            to="/categories"
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-gold-deep"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {wishlistItems.map((p) => (
            <li key={p.id} className="h-full">
              <ProductCard product={p} variant="wish" />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
