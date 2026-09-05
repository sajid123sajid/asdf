import { useNavigate } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShoppingCart, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatSavings, formatTk, hasDiscount, type Product } from "./data";
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

        <div className="block aspect-[1.15] sm:aspect-square">
          <img
            src={product.image}
            alt={`${product.brand} ${product.name}`}
            loading="lazy"
            width={512}
            height={512}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
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
      <div className="mt-auto flex items-center gap-1 pt-1.5">
        {qty === 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product.slug);
            }}
            aria-label={`Add ${product.name} to cart`}
            className="flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border border-primary bg-card px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95 sm:min-h-10 sm:px-4 sm:text-xs"
          >
            <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Add To Cart
          </button>
        ) : (
          <div className="flex w-full items-center justify-between rounded-lg bg-primary text-primary-foreground">
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
    </>
  );
}
