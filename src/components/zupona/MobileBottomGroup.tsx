import { usePartialHideOnScroll } from "@/hooks/use-scroll-direction";
import { FloatingCart } from "./FloatingCart";
import { BottomNav } from "./BottomNav";

/** Mobile-only container that moves the cart pill + bottom nav together on scroll. */
export function MobileBottomGroup() {
  const translateY = usePartialHideOnScroll(40);
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-[280ms] ease-in-out md:hidden"
      style={{
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div className="relative">
        <FloatingCart />
        <BottomNav />
      </div>
    </div>
  );
}
