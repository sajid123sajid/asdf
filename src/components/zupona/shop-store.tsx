import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  initialProducts,
  initialDetailsBySlug,
  getStoredProducts,
  saveStoredProducts,
  getStoredProductDetails,
  saveStoredProductDetails,
  categories,
  getProductDetail as assembleProductDetail,
  type Product,
  type ProductDetail,
  type Category,
} from "./data";
import { toast } from "sonner";
import { getPublicCatalog } from "@/admin-api";

type CartLine = { slug: string; qty: number };

export type ShopState = {
  // Products Management
  products: Product[];
  categories: Category[];
  bestSelling: Product[];
  topPicks: Product[];
  deals: Product[];
  addProduct: (productData: Omit<Product, "id" | "discount"> & { id?: string }, detailData?: Partial<ProductDetail>) => Product;
  updateProduct: (idOrSlug: string, updates: Partial<Product>, detailData?: Partial<ProductDetail>) => void;
  deleteProduct: (idOrSlug: string) => void;
  updateStock: (idOrSlug: string, newStockOrDelta: number, isExact?: boolean) => void;
  resetToDefaultProducts: () => void;
  importCatalog: (productsList: Product[], detailsMap?: Record<string, Partial<ProductDetail>>) => void;
  getProduct: (slugOrId: string) => Product | undefined;
  getProductDetail: (product: Product) => ProductDetail;

  // Cart & Wishlist
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
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [productsList, setProductsList] = useState<Product[]>(() => getStoredProducts());
  const [detailsMap, setDetailsMap] = useState<Record<string, Partial<ProductDetail>>>(() => getStoredProductDetails());
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    setCart(read<CartLine[]>(CART_KEY, []));
    setWishlist(read<string[]>(WISH_KEY, []));
    const stored = getStoredProducts();
    if (stored && stored.length > 0) setProductsList(stored);
    const storedDetails = getStoredProductDetails();
    if (storedDetails) setDetailsMap(storedDetails);
    setHydrated(true);
  }, []);

  // The public storefront always prefers the shared D1 catalog. Local storage is only an offline/demo fallback.
  useEffect(() => {
    let active = true;
    void getPublicCatalog()
      .then(({ catalog }) => {
        if (!active || catalog.length === 0) return;
        setProductsList(catalog.map((item) => item.product));
        setDetailsMap(Object.fromEntries(catalog.map((item) => [item.product.slug, item.detail])));
      })
      .catch(() => {
        // Keep the bundled catalog available when running without local Worker bindings.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (hydrated) {
      saveStoredProducts(productsList);
    }
  }, [productsList, hydrated]);

  useEffect(() => {
    if (hydrated) {
      saveStoredProductDetails(detailsMap);
    }
  }, [detailsMap, hydrated]);

  // Product helper functions
  const addProduct = (
    productData: Omit<Product, "id" | "discount"> & { id?: string },
    detailData?: Partial<ProductDetail>
  ): Product => {
    const nextId = productData.id || String(Date.now());
    const oldPrice = Number(productData.oldPrice) || Number(productData.price);
    const price = Number(productData.price) || 0;
    const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

    const newProduct: Product = {
      id: nextId,
      slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      brand: productData.brand || "Zupona",
      name: productData.name,
      image: productData.image || categories[0]?.image || "",
      price,
      oldPrice,
      discount,
      rating: Number(productData.rating) || 4.8,
      reviews: Number(productData.reviews) || 12,
      category: productData.category || "mens-fashion",
      stock: typeof productData.stock === "number" ? productData.stock : 25,
      bestSelling: Boolean(productData.bestSelling),
      topPick: Boolean(productData.topPick),
    };

    setProductsList((prev) => [newProduct, ...prev]);

    if (detailData) {
      setDetailsMap((prev) => ({
        ...prev,
        [newProduct.slug]: {
          images: detailData.images || [newProduct.image],
          description: detailData.description || `${newProduct.brand} ${newProduct.name} available now on Zupona.`,
          features: detailData.features || ["100% Authentic quality", "Express nationwide delivery", "Easy returns"],
          specs: detailData.specs || [
            { label: "Brand", value: newProduct.brand },
            { label: "SKU", value: `ZUP-${String(newProduct.id).padStart(4, "0")}` },
            { label: "Country of origin", value: "Bangladesh" },
          ],
          stock: newProduct.stock ?? 0,
          variantLabel: detailData.variantLabel || "Select option",
          variants: detailData.variants || ["Standard", "Pack of 2"],
        },
      }));
    }

    toast.success(`Product "${newProduct.name}" added successfully!`);
    return newProduct;
  };

  const updateProduct = (
    idOrSlug: string,
    updates: Partial<Product>,
    detailData?: Partial<ProductDetail>
  ) => {
    setProductsList((prev) =>
      prev.map((item) => {
        if (item.id === idOrSlug || item.slug === idOrSlug) {
          const price = updates.price !== undefined ? Number(updates.price) : item.price;
          const oldPrice = updates.oldPrice !== undefined ? Number(updates.oldPrice) : item.oldPrice;
          const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
          return {
            ...item,
            ...updates,
            price,
            oldPrice,
            discount,
          };
        }
        return item;
      })
    );

    if (detailData) {
      setDetailsMap((prev) => {
        const key = idOrSlug;
        return {
          ...prev,
          [key]: {
            ...(prev[key] || {}),
            ...detailData,
          },
        };
      });
    }

    toast.success("Product updated successfully");
  };

  const deleteProduct = (idOrSlug: string) => {
    const itemToDelete = productsList.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    setProductsList((prev) => prev.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug));
    if (itemToDelete) {
      setCart((prev) => prev.filter((c) => c.slug !== itemToDelete.slug));
      setWishlist((prev) => prev.filter((s) => s !== itemToDelete.slug));
      toast.success(`Product "${itemToDelete.name}" deleted from store`);
    }
  };

  const updateStock = (idOrSlug: string, newStockOrDelta: number, isExact = false) => {
    setProductsList((prev) =>
      prev.map((item) => {
        if (item.id === idOrSlug || item.slug === idOrSlug) {
          const currentStock = typeof item.stock === "number" ? item.stock : 15;
          const nextStock = isExact ? Math.max(0, newStockOrDelta) : Math.max(0, currentStock + newStockOrDelta);
          return { ...item, stock: nextStock };
        }
        return item;
      })
    );

    setDetailsMap((prev) => {
      const existing = prev[idOrSlug] || {};
      const currentStock = typeof existing.stock === "number" ? existing.stock : 15;
      const nextStock = isExact ? Math.max(0, newStockOrDelta) : Math.max(0, currentStock + newStockOrDelta);
      return {
        ...prev,
        [idOrSlug]: {
          ...existing,
          stock: nextStock,
        },
      };
    });
  };

  const resetToDefaultProducts = () => {
    setProductsList(initialProducts);
    setDetailsMap(initialDetailsBySlug as any);
    saveStoredProducts(initialProducts);
    saveStoredProductDetails(initialDetailsBySlug as any);
    toast.success("Catalog reset to factory default products!");
  };

  const importCatalog = (
    productsArray: Product[],
    newDetailsMap?: Record<string, Partial<ProductDetail>>
  ) => {
    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      toast.error("Invalid catalog format");
      return;
    }
    setProductsList(productsArray);
    if (newDetailsMap) setDetailsMap(newDetailsMap);
    toast.success(`Imported ${productsArray.length} products successfully!`);
  };

  const getProduct = (slugOrId: string) => {
    return productsList.find((p) => p.slug === slugOrId || p.id === slugOrId);
  };

  const getProductDetail = (product: Product): ProductDetail => {
    return assembleProductDetail(product, detailsMap);
  };

  const value = useMemo<ShopState>(() => {
    const find = (slug: string) => productsList.find((p) => p.slug === slug || p.id === slug);

    const cartItems = cart
      .map((line) => {
        const product = find(line.slug);
        return product ? { product, qty: line.qty } : null;
      })
      .filter((x): x is { product: Product; qty: number } => x !== null);

    const bestSelling = productsList.filter((p) => p.bestSelling);
    const topPicks = productsList.filter((p) => p.topPick);
    const deals = [...productsList].sort((a, b) => b.discount - a.discount);

    return {
      products: productsList,
      categories,
      bestSelling,
      topPicks,
      deals,
      addProduct,
      updateProduct,
      deleteProduct,
      updateStock,
      resetToDefaultProducts,
      importCatalog,
      getProduct,
      getProductDetail,

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
  }, [productsList, detailsMap, cart, wishlist, cartOpen]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
