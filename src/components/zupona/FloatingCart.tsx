import { useRouterState } from "@tanstack/react-router";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { useShop } from "./shop-store";

/** Zupona floating cart pill — gold gradient, white text. */
export function FloatingCart() {
  const { cartCount, openCart } = useShop();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = cartCount > 0 && pathname !== "/cart" && !pathname.startsWith("/product/");

  return (
    <div
      data-testid="floating-cart"
      aria-hidden={!visible}
      className="pointer-events-none absolute bottom-[4.5rem] left-0 right-0 z-40 flex justify-center px-4 transition-opacity duration-300 ease-out md:hidden"
      style={{
        opacity: visible ? 1 : 0,
      }}
    >
      <button
        type="button"
        onClick={openCart}
        tabIndex={visible ? 0 : -1}
        className={`flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2 text-white shadow-xl ring-1 ring-black/5 transition-all duration-200 hover:brightness-110 active:scale-95 ${
          visible ? "pointer-events-auto" : ""
        }`}
      >
        <ShoppingBag className="h-5 w-5" />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm font-bold">Cart</span>
          <span className="text-[11px] font-medium opacity-90">
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </span>
        </span>
        <ChevronRight className="ml-1 h-5 w-5" />
      </button>
    </div>
  );
}
