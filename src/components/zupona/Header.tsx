import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, ChevronDown, Heart, MapPin, Search, ShoppingCart, Smartphone, User } from "lucide-react";
import { toast } from "sonner";
import { useShop } from "./shop-store";
import { CategoryTabs } from "./CategoryTabs";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, openCart, wishlist } = useShop();
  const isHomePage = location.pathname === "/";
  const isCartPage = location.pathname === "/cart";
  const isCategoriesPage = location.pathname === "/categories";
  const isAccountPage = location.pathname === "/account";

  const [q, setQ] = useState("");
  return (
    <header
      className="sticky top-0 z-50 border-b border-primary/20 bg-primary text-primary-foreground backdrop-blur-sm"
    >
      {isHomePage && <div className="hidden border-b border-primary/20 bg-[#f7f4ef] md:block">
        <div className="mx-auto flex h-10 max-w-[1200px] items-center justify-between px-4 text-xs font-medium text-foreground/80">
          <nav className="flex items-center gap-5">
            <button type="button" className="inline-flex items-center gap-1 hover:text-gold">
              <span>English</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <button type="button" className="inline-flex items-center gap-1 hover:text-gold">
              <span>TK. BDT</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <Link to="/track-order" search={{ id: undefined }} className="hover:text-gold">
              Track Order
            </Link>
            <Link to="/help" className="hover:text-gold">
              Help Center
            </Link>
            <Link to="/sell" className="hover:text-gold">
              Sell on Zupona
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => toast.success("App download link sent to your phone")}
            className="inline-flex items-center gap-1.5 hover:text-gold"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Download App</span>
          </button>
        </div>
      </div>}

      <div className={`mx-auto max-w-[1200px] px-3 sm:px-4 ${isHomePage ? "py-3 md:py-4" : "py-2"}`}>
        {!isHomePage && (
          <div className="flex items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center" aria-label="Zupona home">
              <img src="/favicon.png" alt="Zupona" width={320} height={120} className="h-8 w-auto object-contain sm:h-9" />
            </Link>
            <form
              className="flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-border bg-white shadow-sm md:h-11"
              onSubmit={(e) => {
                e.preventDefault();
                const query = q.trim();
                navigate({ to: "/search", search: query ? { q: query } : { q: "" } });
              }}
            >
              <Search className="ml-3 h-4 w-4 shrink-0 text-primary" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" aria-label="Search" className="flex h-full w-12 items-center justify-center bg-gold text-primary-foreground">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {isHomePage && <>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 leading-none" aria-label="Zupona home">
            <img src="/favicon.png" alt="Zupona" width={640} height={200} className="h-9 w-auto object-contain md:h-12" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold md:text-[11px]">Trusted Online Shop</span>
            </div>
          </Link>

          <div className="hidden flex-1 justify-center md:flex md:px-6">
            <form
              className="flex h-12 w-full max-w-[680px] items-center overflow-hidden rounded-full border border-white/25 bg-white shadow-sm ring-1 ring-transparent transition focus-within:border-gold focus-within:ring-gold/20"
              onSubmit={(e) => {
                e.preventDefault();
                const query = q.trim();
                navigate({ to: "/search", search: query ? { q: query } : { q: "" } });
              }}
            >
              <Search className="ml-4 h-4 w-4 shrink-0 text-primary" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for products, brands and more..."
                aria-label="Search for products"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label="Search by image"
                onClick={() => toast.info("Image search is coming soon")}
                className="flex h-10 w-10 items-center justify-center text-foreground/70 hover:text-primary"
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                type="submit"
                aria-label="Search"
                className="flex h-12 w-16 items-center justify-center bg-primary text-primary-foreground transition-colors hover:bg-[#0d5c52]"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="ml-auto hidden items-center gap-5 md:flex">
            <Link to="/wishlist" className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:border-gold/60 hover:text-gold" activeProps={{ className: "border-gold/60 text-gold" }}>
              <Heart className="h-4 w-4" />
              <span>Wishlist</span>
              {wishlist.length > 0 && <span className="ml-0.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{wishlist.length}</span>}
            </Link>
            <Link to="/account" className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:border-gold/60 hover:text-gold" activeProps={{ className: "border-gold/60 text-gold" }}>
              <User className="h-4 w-4" />
              <span>Account</span>
            </Link>
            <button type="button" onClick={openCart} aria-label="Open cart" className="relative flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:border-gold/60 hover:text-gold">
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {cartCount > 0 && !isCartPage && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button type="button" onClick={() => toast.info("Delivery area selection is coming soon")} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-1.5 text-[10px] font-medium text-foreground">
              <MapPin className="h-3 w-3 text-gold" />
              Dhaka
            </button>
            <button type="button" onClick={openCart} aria-label="Open cart" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground">
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && !isCartPage && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <form
            className="flex h-11 items-center overflow-hidden rounded-full border border-border bg-secondary/80 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const query = q.trim();
              navigate({ to: "/search", search: query ? { q: query } : { q: "" } });
            }}
          >
            <Search className="ml-3 h-4 w-4 shrink-0 text-gold" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" aria-label="Search" className="flex h-11 w-12 items-center justify-center bg-gold text-primary-foreground">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
        </>}
      </div>

      {isHomePage && <CategoryTabs />}
    </header>
  );
}
