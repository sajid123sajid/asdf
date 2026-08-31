import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, Heart, LayoutGrid, MapPin, Menu, Search, ShoppingCart, Smartphone, User, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { categories } from "./data";
import { CategoryTabs } from "./CategoryTabs";
import { useShop } from "./shop-store";
import { useHideOnScroll } from "@/hooks/use-scroll-direction";
import { useIsMobile } from "@/hooks/use-mobile";


export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, openCart, wishlist } = useShop();
  const isCartPage = location.pathname === "/cart";
  const isCategoriesPage = location.pathname === "/categories";
  const isAccountPage = location.pathname === "/account";

  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const isMobile = useIsMobile();
  const scrolledDown = useHideOnScroll();
  const collapsed = isMobile && scrolledDown && !menuOpen;
   

  useEffect(() => {
    if (collapsed) setCatsOpen(false);
  }, [collapsed]);

  const searchRef = useRef<HTMLFormElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      const el = searchRef.current;
      if (el) setShift(el.offsetTop);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isMobile]);
  if (location.pathname.startsWith("/product/")) {
  return null;
}

  return (
    <header
      className="sticky top-0 z-50 bg-card transition-transform duration-300 ease-out will-change-transform md:bg-card"
      style={collapsed && shift > 0 ? { transform: `translateY(-${shift}px)` } : undefined}
    >
      {/* Top utility bar — desktop only */}
      <div className="hidden border-b border-border/60 bg-topbar md:block">
        <div className="mx-auto flex h-9 max-w-[1200px] items-center justify-between px-4 text-sm text-foreground">
          <nav className="flex items-center gap-6">
            <button type="button" className="flex items-center gap-0.5 hover:text-gold">
              <span>English</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <button type="button" className="flex items-center gap-0.5 hover:text-gold">
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
            className="flex items-center gap-1 hover:text-gold"
          >
            <Smartphone className="h-3 w-3" />
            <span>Download App</span>
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1200px] flex-col px-3 pb-2 pt-1.5 sm:px-4 md:pb-4 md:pt-4">
        {/* Main header row */}
        <div
          className={`flex items-center gap-2 transition-opacity duration-200 ease-out ${
            collapsed ? "opacity-0" : "opacity-100"
          }`}
        >
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
            className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center text-foreground hover:text-gold md:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 leading-none md:flex-col md:items-center md:gap-0"
            aria-label="Zupona home"
          >
            <img
              src="/favicon.png"
              alt="Zupona"
              width={640}
              height={200}
              className="h-7 w-auto object-contain md:h-14"
            />
            <span className="text-[9px] font-medium tracking-wide text-muted-foreground md:mt-0.5 md:text-[11px] md:text-foreground">
              Trusted Online Shop
            </span>
          </Link>

          {/* Mobile actions */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => toast.info("Delivery area selection is coming soon")}
              className="flex items-center gap-1 rounded-full border border-border bg-secondary/80 px-2 py-1 text-[11px] font-medium text-muted-foreground"
            >
              <MapPin className="h-3 w-3 shrink-0 text-gold" />
              <span className="truncate">Dhaka, BD</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative flex h-8 w-8 items-center justify-center text-foreground hover:text-gold"
            >
              <Heart className="h-[21px] w-[21px]" />
              {wishlist.length > 0 && (
                <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-primary-foreground">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label="Open cart"
              className="relative flex h-8 w-8 items-center justify-center text-foreground hover:text-gold"
            >
              <ShoppingCart className="h-[21px] w-[21px]" />
              {cartCount > 0 && !isCartPage && (
                <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}

            </button>
          </div>

          {/* Desktop nav */}
          <div className="ml-auto hidden items-center gap-7 md:flex">
            <Link
              to="/wishlist"
              className="flex flex-col items-center gap-1 text-xs hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              <Heart className="h-5 w-5" />
              Wishlist
            </Link>
            <Link
              to="/account"
              className="flex flex-col items-center gap-1 text-xs hover:text-gold"
              activeProps={{ className: "text-gold" }}
            >
              <User className="h-5 w-5" />
              Account
            </Link>
            <button type="button" onClick={openCart} aria-label="Open cart" className="relative flex flex-col items-center gap-1 text-xs hover:text-gold">
              {cartCount > 0 && !isCartPage && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}

              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M4 5h2l2.4 10.2A2 2 0 0 0 10.35 17h7.3a2 2 0 0 0 1.95-1.55L21 8H7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10.5" cy="20" r="1.4" fill="currentColor" />
                <circle cx="18" cy="20" r="1.4" fill="currentColor" />
              </svg>
              Cart
            </button>
          </div>
        </div>

        {/* Search bar */}
        <form
          ref={searchRef}
          className="mt-2 flex h-10 w-full items-center overflow-hidden rounded-full border border-border bg-card md:mt-0 md:ml-2 md:h-11 md:w-auto md:flex-1 md:rounded-md"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/search", search: { q } });
          }}
        >
          <Search className="ml-3 h-4 w-4 shrink-0 text-gold md:hidden" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for products, brands and more..."
            aria-label="Search for products"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground md:px-3"
          />
          <button
            type="button"
            aria-label="Search by image"
            onClick={() => toast.info("Image search is coming soon")}
            className="px-2 text-muted-foreground hover:text-gold md:px-3"
          >
            <Camera className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <div className="p-1 md:p-0">
            <button
              type="submit"
              aria-label="Search"
              className="flex h-8 w-11 items-center justify-center rounded-full bg-gold text-primary-foreground transition-colors hover:bg-gold-deep md:h-11 md:w-14 md:rounded-none"
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </form>

        {/* Mobile category tiles */}
        {!(isCategoriesPage || isAccountPage) && (
        <>

        <div className="-mx-3 mt-2 md:hidden">
          <div className="mx-3 rounded-xl bg-card shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="flex w-max items-stretch">
                {categories.map((c) => (
                  <li key={c.slug} className="border-r border-border/60 last:border-r-0">
                    <Link
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      onClick={() => setCatsOpen(false)}
                      className="flex w-[62px] flex-col items-center gap-1 px-1 py-2"
                    >
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-secondary">
                        <img
                          src={c.image}
                          alt={c.name}
                          loading="lazy"
                          width={512}
                          height={512}
                          className="h-6 w-6 object-contain"
                        />
                      </span>
                      <span className="line-clamp-2 min-h-[1.9em] text-center text-[9px] leading-tight text-foreground">
                        {c.name}
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => setCatsOpen((o) => !o)}
                    aria-expanded={catsOpen}
                    aria-label={catsOpen ? "Hide all categories" : "Show all categories"}
                    className="flex w-[62px] flex-col items-center gap-1 px-1 py-2"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-gold">
                      <LayoutGrid className="h-4 w-4" />
                    </span>
                    <span className="min-h-[1.9em] text-center text-[9px] leading-tight text-foreground">More</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Expandable category grid */}
        <div
          className={`-mx-3 grid w-[calc(100%+1.5rem)] overflow-hidden transition-all duration-300 ease-out md:hidden ${
            catsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="overflow-x-auto px-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="grid grid-flow-col grid-rows-2 auto-cols-[64px] gap-2.5">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      onClick={() => setCatsOpen(false)}
                      className="flex flex-col items-center gap-1 text-center"
                    >
                      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/50">
                        <img
                          src={c.image}
                          alt={c.name}
                          loading="lazy"
                          width={512}
                          height={512}
                          className="h-8 w-8 object-contain"
                        />
                      </span>
                      <span className="text-[10px] leading-tight text-foreground">{c.name}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/categories"
                    onClick={() => setCatsOpen(false)}
                    className="flex flex-col items-center gap-1 text-center"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold bg-card text-gold">
                      <LayoutGrid className="h-4 w-4" />
                    </span>
                    <span className="text-[10px] font-semibold leading-tight text-gold">All</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        </>
        )}

      </div>

      <CategoryTabs />

      {/* Mobile menu overlay */}
      {menuOpen && (
        <nav className="border-t border-border bg-card">
          <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-1 px-4 py-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm text-foreground hover:bg-secondary hover:text-gold"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/categories"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-2 py-2 text-sm font-semibold text-gold hover:bg-secondary"
              >
                All Categories
              </Link>
            </li>
            <li>
              <Link
                to="/deals"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-2 py-2 text-sm font-semibold text-gold hover:bg-secondary"
              >
                Today's Deals
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
