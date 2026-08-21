import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products, type Product } from "./data";

type CartLine = { slug: string; qty: number };

type ShopState = {
  cart: CartLine[];
  wishlist: string[];
  cartCount: number;
  cartTotal: number;
  cartItems: { product: Product; qty: number }[];
  wishlistItems: Product[];
  addToCart: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  qtyOf: (slug: string) => number;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const ShopContext = createContext<ShopState | null>(null);
const CART_KEY = "zupona.cart";
const WISH_KEY = "zupona.wishlist";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    setCart(read<CartLine[]>(CART_KEY, []));
    setWishlist(read<string[]>(WISH_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const value = useMemo<ShopState>(() => {
    const find = (slug: string) => products.find((p) => p.slug === slug);
    const cartItems = cart
      .map((line) => {
        const product = find(line.slug);
        return product ? { product, qty: line.qty } : null;
      })
      .filter((x): x is { product: Product; qty: number } => x !== null);

    return {
      cart,
      wishlist,
      cartItems,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      cartTotal: cartItems.reduce((n, l) => n + l.product.price * l.qty, 0),
      wishlistItems: wishlist
        .map(find)
        .filter((p): p is Product => Boolean(p)),
      addToCart: (slug, qty = 1) =>
        setCart((prev) => {
          const existing = prev.find((l) => l.slug === slug);
          return existing
            ? prev.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l))
            : [...prev, { slug, qty }];
        }),
      setQty: (slug, qty) =>
        setCart((prev) =>
          qty <= 0
            ? prev.filter((l) => l.slug !== slug)
            : prev.map((l) => (l.slug === slug ? { ...l, qty } : l)),
        ),
      removeFromCart: (slug) => setCart((prev) => prev.filter((l) => l.slug !== slug)),
      clearCart: () => setCart([]),
      toggleWishlist: (slug) =>
        setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
      isWishlisted: (slug) => wishlist.includes(slug),
      qtyOf: (slug) => cart.find((l) => l.slug === slug)?.qty ?? 0,
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    };
  }, [cart, wishlist, cartOpen]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
