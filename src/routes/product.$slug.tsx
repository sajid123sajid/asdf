import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ChevronRight,
  Heart,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/zupona/ProductCard";
import { ProductGallery } from "@/components/zupona/ProductGallery";
import { ProductReviews } from "@/components/zupona/ProductReviews";
import {
  formatTk,
  frequentlyBoughtWith,
  getCategory,
  getProduct as lookupProduct,
  relatedProducts,
} from "@/components/zupona/data";
import { useShop } from "@/components/zupona/shop-store";
import { usePartialHideOnScroll } from "@/hooks/use-scroll-direction";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = lookupProduct(params.slug);
    if (!product) return { title: "Zupona Product", price: 0 };
    return { title: `${product.brand} ${product.name}`, price: product.price };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product unavailable — Zupona" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} — Zupona`;
    const description = `Buy ${loaderData.title} for ${formatTk(loaderData.price)} at Zupona. Delivery in 60 minutes in Dhaka, 30-day returns, cash on delivery.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  errorComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <h1 className="text-xl font-bold text-foreground">Product not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This product may have been removed or is no longer available.
      </p>
      <div className="mt-5 flex gap-3">
        <Link
          to="/"
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-gold-deep"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}

const trust = [
  { icon: Truck, label: "Fast delivery", note: "Free over Tk 999" },
  { icon: RotateCcw, label: "30-day return", note: "Easy & free" },
  { icon: BadgeCheck, label: "100% authentic", note: "Verified seller" },
  { icon: Banknote, label: "Cash on delivery", note: "Pay at door" },
];

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const {
    products,
    getProduct,
    getProductDetail,
    addToCart,
    toggleWishlist,
    isWishlisted,
    cartCount,
    openCart,
  } = useShop();

  const product = getProduct(slug);
  const [qty, setQtyState] = useState(1);
  const [variant, setVariant] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const bottomOffset = usePartialHideOnScroll(40);

  if (!product) return <ProductNotFound />;

  const detail = getProductDetail(product);
  const category = getCategory(product.category);
  const wished = isWishlisted(product.slug);
  const related = relatedProducts(product, products);
  const alsoBought = frequentlyBoughtWith(product, products);
  const inStock = detail.stock > 0;
  const lowStock = inStock && detail.stock <= 5;
  const maxQty = Math.max(1, detail.stock);
  const activeVariant = variant ?? detail.variants[0] ?? null;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${product.brand} ${product.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const handleAdd = () => {
    if (!inStock) return;
    addToCart(product.slug, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
    toast.success(`${qty} × ${product.name}${activeVariant ? ` (${activeVariant})` : ""} added to cart`);
  };

  const buyNow = () => {
    if (!inStock) return;
    addToCart(product.slug, qty);
    navigate({ to: "/checkout", search: { slug: product.slug } });
  };

  return (
    <main className="pb-28 md:pb-6">
      {/* Mobile detail bar */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur md:hidden">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ to: "/" }))}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-foreground"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {category?.name ?? product.brand}
        </p>
        <button
          type="button"
          aria-label="Share product"
          onClick={share}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-foreground"
        >
          <Share2 className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          aria-label="Toggle wishlist"
          onClick={() => {
            toggleWishlist(product.slug);
            toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border"
        >
          <Heart className={`h-4.5 w-4.5 ${wished ? "fill-gold text-gold" : "text-foreground"}`} />
        </button>
      </div>

      <div className="mx-auto max-w-[1200px] px-3 pt-3 sm:px-4 sm:pt-6">
        <nav
          aria-label="Breadcrumb"
          className="hidden flex-wrap items-center gap-1 text-sm text-muted-foreground sm:flex"
        >
          <Link to="/" className="hover:text-gold">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          {category && (
            <>
              <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:text-gold">
                {category.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-0 grid gap-5 sm:mt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          <ProductGallery
            images={detail.images}
            alt={`${product.brand} ${product.name}`}
            discount={product.discount}
          />

          {/* Info column */}
          <div className="pt-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </p>
            <h1 className="mt-1 text-xl font-bold leading-snug text-foreground sm:text-3xl">
              {product.name}
            </h1>

            <a href="#reviews" className="mt-2 flex w-fit items-center gap-1.5 text-sm">
              <span className="flex items-center gap-1 rounded-full bg-gold/12 px-2 py-0.5 font-semibold text-gold-deep">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                {product.rating}
              </span>
              <span className="text-muted-foreground underline-offset-2 hover:underline">
                {product.reviews} reviews
              </span>
              <BadgeCheck className="h-4 w-4 text-gold" />
            </a>

            <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-foreground sm:text-4xl">
                {formatTk(product.price)}
              </span>
              {product.oldPrice > product.price && (
                <>
                  <span className="text-sm text-muted-foreground line-through sm:text-base">
                    {formatTk(product.oldPrice)}
                  </span>
                  <span className="rounded-md bg-sale/10 px-2 py-0.5 text-xs font-bold text-sale">
                    {product.discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <p className="mt-2 text-xs font-semibold">
              {!inStock ? (
                <span className="text-sale">Currently unavailable (Out of stock)</span>
              ) : lowStock ? (
                <span className="text-sale">Only {detail.stock} left in stock - order soon</span>
              ) : (
                <span className="text-emerald-600">In stock ({detail.stock} available)</span>
              )}
            </p>

            {/* Delivery */}
            <div className="mt-3 space-y-1 rounded-xl border border-border bg-card px-3 py-2.5 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <Zap className="h-4 w-4 fill-gold text-gold" /> Delivery in 60 minutes in Dhaka
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 text-gold" /> Delivering across all 64 districts in Bangladesh
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Banknote className="h-4 w-4 text-gold" /> Cash on delivery available
                {product.price >= 999 ? " · Free delivery" : " · Delivery Tk 60"}
              </p>
            </div>

            {/* Variants */}
            {detail.variants.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-foreground">{detail.variantLabel}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detail.variants.map((v) => {
                    const selected = v === activeVariant;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVariant(v)}
                        aria-pressed={selected}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                          selected
                            ? "border-gold bg-gold/12 text-gold-deep"
                            : "border-border text-foreground hover:border-gold"
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <ul className="mt-4 grid grid-cols-2 gap-2">
              {trust.map(({ icon: Icon, label, note }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2"
                >
                  <Icon className="h-4.5 w-4.5 shrink-0 text-gold" strokeWidth={1.8} />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-foreground">{label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{note}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Purchase (desktop / inline) */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Quantity</span>
                <div className="flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQtyState((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-foreground hover:text-gold disabled:opacity-40"
                    disabled={qty <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-bold">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQtyState((q) => Math.min(maxQty, q + 1))}
                    className="px-3 py-1.5 text-foreground hover:text-gold disabled:opacity-40"
                    disabled={qty >= maxQty || !inStock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!inStock}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gold px-4 py-2.5 text-sm font-bold text-gold-deep hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {!inStock ? "Out of Stock" : added ? "Added to Cart" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={!inStock}
                  className="flex-1 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-gold-deep disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleWishlist(product.slug);
                    toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
                  }}
                  aria-label="Toggle wishlist"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border hover:border-gold"
                >
                  <Heart className={`h-5 w-5 ${wished ? "fill-gold text-gold" : "text-foreground"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground sm:text-xl">About this product</h2>
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
            {detail.features.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {detail.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Specifications */}
        {detail.specs.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-foreground sm:text-xl">Specifications</h2>
            <dl className="overflow-hidden rounded-2xl border border-border bg-card text-sm">
              {detail.specs.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex gap-3 px-3 py-2.5 sm:px-4 ${i % 2 === 1 ? "bg-secondary/40" : ""}`}
                >
                  <dt className="w-32 shrink-0 text-muted-foreground sm:w-48">{s.label}</dt>
                  <dd className="min-w-0 font-medium text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <ProductReviews product={product} />

        {/* Frequently bought together */}
        {alsoBought.length >= 2 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-foreground sm:text-xl">
              Frequently bought together
            </h2>
            <ul className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {alsoBought.map((p) => (
                <li key={p.id} className="h-full">
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-foreground sm:text-xl">You may also like</h2>
            <ul className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id} className="h-full">
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Sticky mobile purchase bar */}
      <div
        className="fixed bottom-[4.5rem] left-0 right-0 z-40 px-3 transition-transform duration-[280ms] ease-in-out md:hidden"
        style={{ transform: `translateY(${bottomOffset}px)` }}
      >
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 p-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
          <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-foreground"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={buyNow}
            disabled={!inStock}
            className="h-10 shrink-0 rounded-full border border-gold px-4 text-sm font-bold text-gold-deep disabled:border-border disabled:text-muted-foreground"
          >
            Buy Now
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="h-10 flex-1 rounded-full bg-gold text-sm font-bold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
          >
            {!inStock ? "Out of Stock" : added ? "Added to Cart" : "Add to Cart"}
          </button>
        </div>
      </div>
    </main>
  );
}
