import { useNavigate } from "@tanstack/react-router";
import { Eye, Heart, Minus, Plus, Star, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatSavings, formatTk, hasDiscount, type Product } from "./data";
import { QuickView } from "./QuickView";
import { useShop } from "./shop-store";

/** Zepto-style product card: framed image, corner discount tag, delivery badge, outlined ADD pill. */
export function ProductCard({
  product,
  variant = "full",
}: {
  product: Product;
  variant?: "full" | "wish";
}) {
  const { addToCart, setQty, qtyOf, toggleWishlist, isWishlisted } = useShop();
  const navigate = useNavigate();
  const [quickOpen, setQuickOpen] = useState(false);
  const wished = isWishlisted(product.slug);
  const qty = qtyOf(product.slug);


  const openDetail = () => {
    navigate({ to: "/product/$slug", params: { slug: product.slug } });
  };

  return (
    <>
    <article
      role="link"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail();
        }
      }}
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl bg-card p-1.5 transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] sm:p-2"
    >
      {/* Image frame */}
      <div className="relative overflow-hidden rounded-xl bg-secondary/40">
        {variant === "full" && (
          <span className="absolute left-0 top-0 z-10 rounded-br-xl bg-sale px-1.5 py-0.5 text-[10px] font-extrabold leading-tight text-primary-foreground sm:px-2 sm:py-1 sm:text-xs">
            {product.discount}%
            <br className="sm:hidden" />
            <span className="sm:ml-1">OFF</span>
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.slug);
            toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
          }}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className={`absolute right-1.5 top-1.5 z-10 rounded-full bg-card/90 p-1 shadow-sm backdrop-blur transition-colors hover:text-gold sm:p-1.5 ${
            wished ? "text-gold" : "text-foreground"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wished ? "fill-gold" : ""}`} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setQuickOpen(true);
          }}
          aria-label={`Quick view ${product.name}`}
          className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[10px] font-bold text-foreground shadow-sm backdrop-blur transition-colors hover:text-gold sm:text-[11px]"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Quick view</span>
        </button>



        <div className="block aspect-square p-2 sm:p-3">
          <img
            src={product.image}
            alt={`${product.brand} ${product.name}`}
            loading="lazy"
            width={512}
            height={512}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Delivery promise */}
      <div className="mt-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        <Zap className="h-3 w-3 shrink-0 fill-gold text-gold" />
        60 mins
      </div>

      {/* Price section */}
      <div className="mt-1.5">
        {hasDiscount(product) ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-md bg-savings px-2 py-0.5 text-[11px] font-extrabold text-savings-foreground sm:text-xs">
                {formatTk(product.price)}
              </span>
              <span className="text-[9px] font-medium text-muted-foreground line-through sm:text-xs">
                {formatTk(product.oldPrice)}
              </span>
            </div>
            <span className="text-[9px] font-bold text-savings sm:text-xs">
              {formatSavings(product)}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center rounded-md bg-savings px-2 py-0.5 text-[11px] font-extrabold text-savings-foreground sm:text-xs">
            {formatTk(product.price)}
          </span>
        )}
      </div>

      <h3 className="mt-1 line-clamp-2 min-h-[2.1rem] text-[11px] font-bold leading-snug text-foreground sm:min-h-[2.5rem] sm:text-sm">
        {product.name}
      </h3>
      <p className="truncate text-[9px] text-muted-foreground sm:text-xs">{product.brand}</p>

      <div className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground sm:text-xs">
        <Star className="h-3 w-3 fill-gold text-gold" />
        <span className="font-semibold text-foreground">{product.rating}</span>
        <span>({product.reviews})</span>
      </div>

      {/* ADD row */}
      <div className="mt-auto flex items-center justify-end gap-1 pt-1.5">
        {qty === 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product.slug);
            }}
            aria-label={`Add ${product.name} to cart`}
            className="shrink-0 rounded-lg border border-gold bg-card px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-primary-foreground active:scale-95 sm:px-4 sm:py-1.5 sm:text-xs"
          >
            Add
          </button>
        ) : (
          <div className="flex shrink-0 items-center rounded-lg bg-gold text-primary-foreground">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQty(product.slug, qty - 1);
              }}
              aria-label={`Decrease ${product.name} quantity`}
              className="flex h-6 w-6 items-center justify-center transition-transform active:scale-75 sm:h-7 sm:w-7"
            >
              <Minus className="h-3 w-3" strokeWidth={3} />
            </button>
            <span className="min-w-4 text-center text-[11px] font-extrabold sm:text-xs">{qty}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product.slug);
              }}
              aria-label={`Increase ${product.name} quantity`}
              className="flex h-6 w-6 items-center justify-center transition-transform active:scale-75 sm:h-7 sm:w-7"
            >
              <Plus className="h-3 w-3" strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </article>
    <QuickView product={product} open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}
